from datetime import datetime
from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.leave import LeaveType, LeaveBalance, LeaveRequest, LeaveStatus
from app.models.notification import Notification
from app.utils.rbac import token_required, role_required
from app.utils.audit import log_audit

leave_bp = Blueprint('leaves', __name__, url_prefix='/api/leaves')

@leave_bp.route('/types', methods=['GET'])
@token_required
def list_leave_types():
    l_types = LeaveType.query.all()
    return jsonify({
        'success': True,
        'leave_types': [lt.to_dict() for lt in l_types]
    })

@leave_bp.route('/types', methods=['POST'])
@token_required
@role_required(UserRole.ADMIN, UserRole.HR_STAFF)
def create_leave_type():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    default_days = data.get('default_days_per_year', 20)
    description = data.get('description', '').strip()

    if not name:
        return jsonify({'success': False, 'message': 'Leave category name is required'}), 400

    existing = LeaveType.query.filter_by(name=name).first()
    if existing:
        return jsonify({'success': False, 'message': f'Leave category "{name}" already exists'}), 400

    lt = LeaveType(
        name=name,
        default_days_per_year=int(default_days),
        description=description
    )
    db.session.add(lt)
    db.session.commit()

    # Automatically provision LeaveBalance for all current employees for this new category
    current_year = datetime.utcnow().year
    employees = Employee.query.filter_by(is_deleted=False).all()
    for emp in employees:
        bal_exists = LeaveBalance.query.filter_by(employee_id=emp.id, leave_type_id=lt.id, year=current_year).first()
        if not bal_exists:
            bal = LeaveBalance(
                employee_id=emp.id,
                leave_type_id=lt.id,
                year=current_year,
                allocated_days=lt.default_days_per_year,
                used_days=0
            )
            db.session.add(bal)

    db.session.commit()

    log_audit('CREATE_LEAVE_TYPE', 'LeaveType', target_id=lt.id, details=f"Created leave category {name} ({default_days} days/yr)", user_id=g.current_user.id)

    return jsonify({
        'success': True,
        'message': f'Leave category "{name}" created successfully with employee allocations',
        'leave_type': lt.to_dict()
    }), 201

@leave_bp.route('/types/<int:type_id>', methods=['PUT'])
@token_required
@role_required(UserRole.ADMIN, UserRole.HR_STAFF)
def update_leave_type(type_id):
    lt = LeaveType.query.get_or_404(type_id)
    data = request.get_json() or {}

    if 'name' in data and data['name'].strip():
        lt.name = data['name'].strip()
    if 'default_days_per_year' in data:
        lt.default_days_per_year = int(data['default_days_per_year'])
    if 'description' in data:
        lt.description = data['description'].strip()

    db.session.commit()

    log_audit('UPDATE_LEAVE_TYPE', 'LeaveType', target_id=lt.id, details=f"Updated leave category {lt.name}", user_id=g.current_user.id)

    return jsonify({
        'success': True,
        'message': f'Leave category "{lt.name}" updated successfully',
        'leave_type': lt.to_dict()
    })

@leave_bp.route('/types/<int:type_id>', methods=['DELETE'])
@token_required
@role_required(UserRole.ADMIN, UserRole.HR_STAFF)
def delete_leave_type(type_id):
    lt = LeaveType.query.get_or_404(type_id)

    # Check if category is referenced by active leave requests
    req_count = LeaveRequest.query.filter_by(leave_type_id=type_id).count()
    if req_count > 0:
        return jsonify({
            'success': False,
            'message': f'Cannot delete category "{lt.name}". It is associated with {req_count} leave requests.'
        }), 400

    # Clean up balances and delete type
    LeaveBalance.query.filter_by(leave_type_id=type_id).delete()
    db.session.delete(lt)
    db.session.commit()

    log_audit('DELETE_LEAVE_TYPE', 'LeaveType', target_id=type_id, details=f"Deleted leave category {lt.name}", user_id=g.current_user.id)

    return jsonify({
        'success': True,
        'message': f'Leave category "{lt.name}" deleted successfully'
    })


@leave_bp.route('/balances', methods=['GET'])
@token_required
def get_leave_balances():
    current_u = g.current_user
    current_emp = current_u.employee_profile

    emp_id = request.args.get('employee_id', type=int)

    if not emp_id:
        if not current_emp:
            return jsonify({'success': False, 'message': 'No employee profile associated'}), 400
        emp_id = current_emp.id

    # Permission check if checking another employee's balance
    if emp_id != getattr(current_emp, 'id', None) and current_u.role not in [UserRole.ADMIN, UserRole.HR_STAFF, UserRole.MANAGER]:
        return jsonify({'success': False, 'message': 'Permission denied'}), 403

    year = request.args.get('year', type=int, default=datetime.utcnow().year)
    balances = LeaveBalance.query.filter_by(employee_id=emp_id, year=year).all()

    return jsonify({
        'success': True,
        'balances': [b.to_dict() for b in balances]
    })

@leave_bp.route('', methods=['GET'])
@token_required
def list_leave_requests():
    current_u = g.current_user
    current_emp = current_u.employee_profile

    query = LeaveRequest.query

    # Status filter
    status = request.args.get('status')
    if status and status in LeaveStatus.ALL:
        query = query.filter_by(status=status)

    # Scoping by Role
    if current_u.role == UserRole.EMPLOYEE:
        if not current_emp:
            return jsonify({'success': True, 'leave_requests': []})
        query = query.filter_by(employee_id=current_emp.id)
    elif current_u.role == UserRole.MANAGER:
        if not current_emp:
            return jsonify({'success': True, 'leave_requests': []})
        # Direct reports or department members
        dept_id = current_emp.department_id
        query = query.join(Employee, LeaveRequest.employee_id == Employee.id).filter(
            (Employee.manager_id == current_emp.id) |
            (Employee.department_id == dept_id) |
            (LeaveRequest.employee_id == current_emp.id)
        )
    elif current_u.role in [UserRole.ADMIN, UserRole.HR_STAFF]:
        emp_id = request.args.get('employee_id', type=int)
        if emp_id:
            query = query.filter_by(employee_id=emp_id)

    requests_list = query.order_by(LeaveRequest.created_at.desc()).all()

    return jsonify({
        'success': True,
        'count': len(requests_list),
        'leave_requests': [r.to_dict() for r in requests_list]
    })

@leave_bp.route('', methods=['POST'])
@token_required
def submit_leave_request():
    current_u = g.current_user
    current_emp = current_u.employee_profile

    if not current_emp:
        return jsonify({'success': False, 'message': 'No employee profile associated with account'}), 400

    data = request.get_json() or {}
    leave_type_id = data.get('leave_type_id')
    start_date_str = data.get('start_date')
    end_date_str = data.get('end_date')
    reason = data.get('reason', '').strip()

    if not leave_type_id or not start_date_str or not end_date_str or not reason:
        return jsonify({'success': False, 'message': 'Leave type, start date, end date, and reason are required'}), 400

    # 1. Validate Leave Category exists
    leave_type = LeaveType.query.get(leave_type_id)
    if not leave_type:
        return jsonify({'success': False, 'message': 'Selected leave category does not exist'}), 400

    # 2. Robust Date Parsing & Validation
    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Invalid date format. Dates must be formatted as YYYY-MM-DD'}), 400

    if start_date > end_date:
        return jsonify({'success': False, 'message': 'Start date cannot be after end date'}), 400

    requested_days = (end_date - start_date).days + 1
    current_year = start_date.year

    # 3. Check leave balance allocation
    balance = LeaveBalance.query.filter_by(employee_id=current_emp.id, leave_type_id=leave_type_id, year=current_year).first()
    if balance and balance.remaining_days < requested_days:
        return jsonify({
            'success': False,
            'message': f'Insufficient leave balance. You have {balance.remaining_days} days remaining for {leave_type.name}, but requested {requested_days} days.'
        }), 400

    req = LeaveRequest(
        employee_id=current_emp.id,
        leave_type_id=leave_type_id,
        start_date=start_date,
        end_date=end_date,
        reason=reason,
        status=LeaveStatus.PENDING
    )

    db.session.add(req)
    db.session.commit()

    # 4. Notify Manager or HR / Admins
    notified = False
    if current_emp.manager and current_emp.manager.user:
        n = Notification(
            user_id=current_emp.manager.user.id,
            title="New Leave Request",
            message=f"{current_emp.first_name} {current_emp.last_name} submitted a {requested_days}-day {leave_type.name} request.",
            type="warning"
        )
        db.session.add(n)
        notified = True

    if not notified:
        # Fallback: Notify Admins if no manager assigned
        admins = User.query.filter_by(role=UserRole.ADMIN, is_active=True).all()
        for admin_u in admins:
            n = Notification(
                user_id=admin_u.id,
                title="New Leave Request",
                message=f"{current_emp.first_name} {current_emp.last_name} submitted a {requested_days}-day {leave_type.name} request.",
                type="warning"
            )
            db.session.add(n)

    db.session.commit()

    log_audit('SUBMIT_LEAVE_REQUEST', 'LeaveRequest', target_id=req.id, details=f"Submitted {requested_days}-day {leave_type.name} ({start_date_str} to {end_date_str})", user_id=current_u.id)

    return jsonify({
        'success': True,
        'message': 'Leave request submitted successfully for approval',
        'leave_request': req.to_dict()
    }), 201

@leave_bp.route('/<int:req_id>/status', methods=['PUT'])
@token_required
@role_required(UserRole.ADMIN, UserRole.HR_STAFF, UserRole.MANAGER)
def update_leave_status(req_id):
    leave_req = LeaveRequest.query.get_or_404(req_id)
    current_u = g.current_user
    current_emp = current_u.employee_profile

    data = request.get_json() or {}
    new_status = data.get('status')
    reviewer_comment = data.get('comment', '').strip()

    if new_status not in [LeaveStatus.APPROVED, LeaveStatus.REJECTED]:
        return jsonify({'success': False, 'message': 'Status must be APPROVED or REJECTED'}), 400

    # Self-Approval Prevention Security Rule
    if current_emp and leave_req.employee_id == current_emp.id and current_u.role != UserRole.ADMIN:
        return jsonify({'success': False, 'message': 'Security Policy: You cannot approve or reject your own leave request.'}), 403

    # Verification for Manager role (must be direct report or department member)
    if current_u.role == UserRole.MANAGER and current_emp:
        target_emp = leave_req.employee
        if target_emp.manager_id != current_emp.id and target_emp.department_id != current_emp.department_id:
            return jsonify({'success': False, 'message': 'You can only review leave requests for your team members'}), 403

    previous_status = leave_req.status
    leave_req.status = new_status
    leave_req.reviewer_id = current_emp.id if current_emp else None
    leave_req.reviewer_comment = reviewer_comment

    # If APPROVED for the first time, update leave balance
    if new_status == LeaveStatus.APPROVED and previous_status != LeaveStatus.APPROVED:
        current_year = leave_req.start_date.year
        balance = LeaveBalance.query.filter_by(
            employee_id=leave_req.employee_id,
            leave_type_id=leave_req.leave_type_id,
            year=current_year
        ).first()

        if balance:
            balance.used_days += leave_req.total_days

    # If status changed from APPROVED back to REJECTED or PENDING, revert used days
    elif previous_status == LeaveStatus.APPROVED and new_status != LeaveStatus.APPROVED:
        current_year = leave_req.start_date.year
        balance = LeaveBalance.query.filter_by(
            employee_id=leave_req.employee_id,
            leave_type_id=leave_req.leave_type_id,
            year=current_year
        ).first()

        if balance:
            balance.used_days = max(0, balance.used_days - leave_req.total_days)

    db.session.commit()

    # Create Notification for Requester Employee
    if leave_req.employee and leave_req.employee.user:
        msg = f"Your leave request ({leave_req.start_date} to {leave_req.end_date}) was {new_status.lower()}."
        if reviewer_comment:
            msg += f" Note: {reviewer_comment}"
        
        n = Notification(
            user_id=leave_req.employee.user.id,
            title=f"Leave Request {new_status.title()}",
            message=msg,
            type="success" if new_status == LeaveStatus.APPROVED else "danger"
        )
        db.session.add(n)
        db.session.commit()

    log_audit('UPDATE_LEAVE_STATUS', 'LeaveRequest', target_id=leave_req.id, details=f"Changed leave status to {new_status} for Employee #{leave_req.employee_id}", user_id=current_u.id)

    return jsonify({
        'success': True,
        'message': f'Leave request successfully {new_status.lower()}',
        'leave_request': leave_req.to_dict()
    })
