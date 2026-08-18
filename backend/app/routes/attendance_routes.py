from datetime import datetime
from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.user import UserRole
from app.models.employee import Employee
from app.models.attendance import AttendanceRecord, AttendanceStatus
from app.utils.rbac import token_required, role_required
from app.utils.audit import log_audit

attendance_bp = Blueprint('attendance', __name__, url_prefix='/api/attendance')

@attendance_bp.route('/today', methods=['GET'])
@token_required
def get_today_status():
    current_u = g.current_user
    current_emp = current_u.employee_profile

    if not current_emp:
        return jsonify({'success': False, 'message': 'No employee profile associated'}), 400

    today = datetime.utcnow().date()
    record = AttendanceRecord.query.filter_by(employee_id=current_emp.id, date=today).first()

    return jsonify({
        'success': True,
        'has_clocked_in': record is not None and record.clock_in is not None,
        'has_clocked_out': record is not None and record.clock_out is not None,
        'attendance': record.to_dict() if record else None
    })

@attendance_bp.route('/clock-in', methods=['POST'])
@token_required
def clock_in():
    current_u = g.current_user
    current_emp = current_u.employee_profile

    if not current_emp:
        return jsonify({'success': False, 'message': 'No employee profile associated'}), 400

    today = datetime.utcnow().date()
    now = datetime.utcnow()

    existing = AttendanceRecord.query.filter_by(employee_id=current_emp.id, date=today).first()
    if existing and existing.clock_in:
        return jsonify({'success': False, 'message': 'You have already clocked in today'}), 400

    if not existing:
        # Determine status (LATE if after 09:15 AM)
        status = AttendanceStatus.PRESENT
        if now.hour > 9 or (now.hour == 9 and now.minute > 15):
            status = AttendanceStatus.LATE

        record = AttendanceRecord(
            employee_id=current_emp.id,
            date=today,
            clock_in=now,
            status=status
        )
        db.session.add(record)
    else:
        existing.clock_in = now
        record = existing

    db.session.commit()

    log_audit('CLOCK_IN', 'AttendanceRecord', target_id=record.id, details=f"Clocked in at {now.strftime('%H:%M:%S')}", user_id=current_u.id)

    return jsonify({
        'success': True,
        'message': 'Clocked in successfully',
        'attendance': record.to_dict()
    })

@attendance_bp.route('/clock-out', methods=['POST'])
@token_required
def clock_out():
    current_u = g.current_user
    current_emp = current_u.employee_profile

    if not current_emp:
        return jsonify({'success': False, 'message': 'No employee profile associated'}), 400

    today = datetime.utcnow().date()
    now = datetime.utcnow()

    record = AttendanceRecord.query.filter_by(employee_id=current_emp.id, date=today).first()
    if not record or not record.clock_in:
        return jsonify({'success': False, 'message': 'You must clock in before clocking out'}), 400

    if record.clock_out:
        return jsonify({'success': False, 'message': 'You have already clocked out today'}), 400

    record.clock_out = now
    duration_seconds = (record.clock_out - record.clock_in).total_seconds()
    record.total_hours = duration_seconds / 3600.0

    if record.total_hours < 4.0:
        record.status = AttendanceStatus.HALF_DAY

    db.session.commit()

    log_audit('CLOCK_OUT', 'AttendanceRecord', target_id=record.id, details=f"Clocked out at {now.strftime('%H:%M:%S')} (Total hours: {round(record.total_hours, 2)})", user_id=current_u.id)

    return jsonify({
        'success': True,
        'message': 'Clocked out successfully',
        'attendance': record.to_dict()
    })

@attendance_bp.route('', methods=['GET'])
@token_required
def list_attendance():
    current_u = g.current_user
    current_emp = current_u.employee_profile

    query = AttendanceRecord.query

    # Optional date filters
    date_str = request.args.get('date')
    if date_str:
        try:
            filter_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            query = query.filter_by(date=filter_date)
        except ValueError:
            pass

    # Scoping by Role
    if current_u.role == UserRole.EMPLOYEE:
        if not current_emp:
            return jsonify({'success': True, 'attendance_records': []})
        query = query.filter_by(employee_id=current_emp.id)
    elif current_u.role == UserRole.MANAGER:
        if not current_emp:
            return jsonify({'success': True, 'attendance_records': []})
        dept_id = current_emp.department_id
        query = query.join(Employee, AttendanceRecord.employee_id == Employee.id).filter(
            (Employee.manager_id == current_emp.id) |
            (Employee.department_id == dept_id) |
            (AttendanceRecord.employee_id == current_emp.id)
        )
    elif current_u.role in [UserRole.ADMIN, UserRole.HR_STAFF]:
        emp_id = request.args.get('employee_id', type=int)
        if emp_id:
            query = query.filter_by(employee_id=emp_id)

    records = query.order_by(AttendanceRecord.date.desc(), AttendanceRecord.clock_in.desc()).all()

    return jsonify({
        'success': True,
        'count': len(records),
        'attendance_records': [r.to_dict() for r in records]
    })
