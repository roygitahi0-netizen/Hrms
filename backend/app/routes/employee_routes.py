from datetime import datetime
from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.user import User, UserRole
from app.models.employee import Employee, EmploymentStatus
from app.models.leave import LeaveType, LeaveBalance
from app.utils.rbac import token_required, role_required, can_view_sensitive_info
from app.utils.audit import log_audit

employee_bp = Blueprint('employees', __name__, url_prefix='/api/employees')

@employee_bp.route('', methods=['GET'])
@token_required
def list_employees():
    current_u = g.current_user
    current_emp = current_u.employee_profile

    query = Employee.query.filter_by(is_deleted=False)

    # Search & filters
    search = request.args.get('search', '').strip()
    dept_id = request.args.get('department_id', type=int)
    status = request.args.get('status')
    role = request.args.get('role')

    if search:
        query = query.filter(
            (Employee.first_name.ilike(f'%{search}%')) |
            (Employee.last_name.ilike(f'%{search}%')) |
            (Employee.email.ilike(f'%{search}%')) |
            (Employee.employee_code.ilike(f'%{search}%'))
        )

    if dept_id:
        query = query.filter_by(department_id=dept_id)

    if status:
        query = query.filter_by(employment_status=status)

    if role:
        query = query.join(User).filter(User.role == role)

    # Permission scoping for MANAGER role
    if current_u.role == UserRole.MANAGER and current_emp:
        # Show direct reports OR employees in manager's managed department
        query = query.filter(
            (Employee.manager_id == current_emp.id) |
            (Employee.department_id == current_emp.department_id) |
            (Employee.id == current_emp.id)
        )
    elif current_u.role == UserRole.EMPLOYEE and current_emp:
        # Standard employees can view employee directory summary or team
        pass

    employees = query.order_by(Employee.first_name.asc()).all()

    show_sensitive = can_view_sensitive_info(current_u)
    result = [e.to_dict(include_sensitive=show_sensitive) for e in employees]

    return jsonify({
        'success': True,
        'count': len(result),
        'employees': result
    })

@employee_bp.route('/<int:emp_id>', methods=['GET'])
@token_required
def get_employee(emp_id):
    emp = Employee.query.get_or_404(emp_id)
    if emp.is_deleted:
        return jsonify({'success': False, 'message': 'Employee record not found'}), 404

    current_u = g.current_user
    current_emp = current_u.employee_profile

    # Check sensitivity
    is_self = current_emp and current_emp.id == emp.id
    show_sensitive = can_view_sensitive_info(current_u) or is_self

    return jsonify({
        'success': True,
        'employee': emp.to_dict(include_sensitive=show_sensitive)
    })

@employee_bp.route('', methods=['POST'])
@token_required
@role_required(UserRole.ADMIN, UserRole.HR_STAFF)
def create_employee():
    data = request.get_json() or {}

    email = data.get('email', '').strip().lower()
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    role = data.get('role', UserRole.EMPLOYEE)
    password = data.get('password', 'password123')

    if not email or not first_name or not last_name:
        return jsonify({'success': False, 'message': 'First name, last name, and email are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': f'User account with email {email} already exists'}), 400

    # Auto-generate employee code
    count = Employee.query.count() + 1
    employee_code = f"EMP-{count:03d}"
    while Employee.query.filter_by(employee_code=employee_code).first():
        count += 1
        employee_code = f"EMP-{count:03d}"

    # 1. Create User account
    user = User(email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    # 2. Create Employee profile
    hire_date_str = data.get('hire_date')
    hire_date = datetime.strptime(hire_date_str, '%Y-%m-%d').date() if hire_date_str else datetime.utcnow().date()

    employee = Employee(
        user_id=user.id,
        employee_code=employee_code,
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=data.get('phone'),
        address=data.get('address'),
        emergency_contact_name=data.get('emergency_contact_name'),
        emergency_contact_phone=data.get('emergency_contact_phone'),
        department_id=data.get('department_id'),
        position_id=data.get('position_id'),
        manager_id=data.get('manager_id'),
        employment_status=data.get('employment_status', EmploymentStatus.FULL_TIME),
        hire_date=hire_date,
        salary=float(data['salary']) if data.get('salary') is not None else None,
        national_id=data.get('national_id')
    )

    db.session.add(employee)
    db.session.commit()

    # 3. Create initial leave balances for current year
    current_year = datetime.utcnow().year
    leave_types = LeaveType.query.all()
    for lt in leave_types:
        lb = LeaveBalance(
            employee_id=employee.id,
            leave_type_id=lt.id,
            year=current_year,
            allocated_days=lt.default_days_per_year,
            used_days=0
        )
        db.session.add(lb)
    db.session.commit()

    log_audit('CREATE_EMPLOYEE', 'Employee', target_id=employee.id, details=f"Created employee profile for {employee.first_name} {employee.last_name} ({email})", user_id=g.current_user.id)

    show_sensitive = can_view_sensitive_info(g.current_user)
    return jsonify({
        'success': True,
        'message': 'Employee created successfully',
        'employee': employee.to_dict(include_sensitive=show_sensitive)
    }), 201

@employee_bp.route('/<int:emp_id>', methods=['PUT'])
@token_required
def update_employee(emp_id):
    emp = Employee.query.get_or_404(emp_id)
    if emp.is_deleted:
        return jsonify({'success': False, 'message': 'Employee record not found'}), 404

    current_u = g.current_user
    current_emp = current_u.employee_profile
    is_admin_or_hr = current_u.role in [UserRole.ADMIN, UserRole.HR_STAFF]
    is_self = current_emp and current_emp.id == emp.id

    # ── Access Gate ─────────────────────────────────────────────────────────
    # EMPLOYEE role: can ONLY edit their own profile. Period.
    # Admin / HR Staff: can edit any profile.
    if not is_admin_or_hr and not is_self:
        return jsonify({
            'success': False,
            'message': 'Access Denied: You can only edit your own profile'
        }), 403

    data = request.get_json() or {}

    # ── Self-Service Fields (allowed for any authenticated user editing themselves)
    if 'phone' in data:
        emp.phone = data['phone']
    if 'address' in data:
        emp.address = data['address']
    if 'emergency_contact_name' in data:
        emp.emergency_contact_name = data['emergency_contact_name']
    if 'emergency_contact_phone' in data:
        emp.emergency_contact_phone = data['emergency_contact_phone']

    # ── Privileged HR / Admin-Only Fields ───────────────────────────────────
    # These are COMPLETELY IGNORED for self-edits by non-admin/HR employees.
    if is_admin_or_hr:
        if 'first_name' in data and data['first_name']:
            emp.first_name = data['first_name'].strip()
        if 'last_name' in data and data['last_name']:
            emp.last_name = data['last_name'].strip()
        if 'department_id' in data:
            emp.department_id = data['department_id']
        if 'position_id' in data:
            emp.position_id = data['position_id']
        if 'manager_id' in data:
            emp.manager_id = data['manager_id']
        if 'employment_status' in data:
            emp.employment_status = data['employment_status']
        if 'hire_date' in data and data['hire_date']:
            emp.hire_date = datetime.strptime(data['hire_date'], '%Y-%m-%d').date()
        if 'salary' in data:
            emp.salary = float(data['salary']) if data['salary'] is not None else None
        if 'national_id' in data:
            emp.national_id = data['national_id']

        # Only Admins can change another person's system role.
        # Admin CANNOT escalate their own role (prevents self-promotion attacks).
        if 'role' in data and current_u.role == UserRole.ADMIN and not is_self:
            new_role = data['role']
            if new_role in [UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR_STAFF, UserRole.ADMIN]:
                emp.user.role = new_role

    db.session.commit()

    log_audit(
        'UPDATE_EMPLOYEE',
        'Employee',
        target_id=emp.id,
        details=f"{'Self-service' if is_self else 'Admin'} profile update for {emp.first_name} {emp.last_name}",
        user_id=current_u.id
    )

    show_sensitive = can_view_sensitive_info(current_u) or is_self
    return jsonify({
        'success': True,
        'message': 'Profile updated successfully',
        'employee': emp.to_dict(include_sensitive=show_sensitive)
    })

@employee_bp.route('/<int:emp_id>', methods=['DELETE'])
@token_required
@role_required(UserRole.ADMIN, UserRole.HR_STAFF)
def delete_employee(emp_id):
    emp = Employee.query.get_or_404(emp_id)
    if emp.is_deleted:
        return jsonify({'success': False, 'message': 'Employee already deleted'}), 400

    # Soft delete
    emp.is_deleted = True
    if emp.user:
        emp.user.is_active = False

    db.session.commit()

    log_audit('SOFT_DELETE_EMPLOYEE', 'Employee', target_id=emp.id, details=f"Soft deleted employee {emp.first_name} {emp.last_name} ({emp.email})", user_id=g.current_user.id)

    return jsonify({
        'success': True,
        'message': f'Employee {emp.first_name} {emp.last_name} soft deleted successfully'
    })
