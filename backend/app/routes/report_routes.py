import os
import csv
from io import StringIO
from datetime import datetime
from flask import Blueprint, jsonify, Response, request, g, current_app
from app.extensions import db
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.employee import Employee, EmploymentStatus
from app.models.leave import LeaveRequest, LeaveStatus
from app.models.attendance import AttendanceRecord, AttendanceStatus
from app.utils.rbac import token_required, role_required
from app.utils.audit import log_audit

report_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

def get_exports_dir():
    exports_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'exports'))
    os.makedirs(exports_dir, exist_ok=True)
    return exports_dir

@report_bp.route('/dashboard', methods=['GET'])
@token_required
def dashboard_stats():
    current_u = g.current_user
    current_emp = current_u.employee_profile

    today = datetime.utcnow().date()

    # Base Metrics
    total_employees = Employee.query.filter_by(is_deleted=False).count()
    total_departments = Department.query.count()
    pending_leaves_count = LeaveRequest.query.filter_by(status=LeaveStatus.PENDING).count()

    today_attendance = AttendanceRecord.query.filter_by(date=today).all()
    clocked_in_today = len([a for a in today_attendance if a.clock_in])
    attendance_rate = round((clocked_in_today / total_employees * 100), 1) if total_employees > 0 else 0.0

    # Department breakdown
    depts = Department.query.all()
    dept_breakdown = []
    for d in depts:
        active_emps = [e for e in d.employees if not e.is_deleted]
        dept_breakdown.append({
            'name': d.name,
            'code': d.code,
            'count': len(active_emps)
        })

    # Status breakdown
    status_breakdown = {
        'FULL_TIME': Employee.query.filter_by(is_deleted=False, employment_status=EmploymentStatus.FULL_TIME).count(),
        'PART_TIME': Employee.query.filter_by(is_deleted=False, employment_status=EmploymentStatus.PART_TIME).count(),
        'CONTRACT': Employee.query.filter_by(is_deleted=False, employment_status=EmploymentStatus.CONTRACT).count()
    }

    # Role specific data
    role_specific = {}

    if current_u.role == UserRole.MANAGER and current_emp:
        team_members = Employee.query.filter(
            (Employee.manager_id == current_emp.id) | (Employee.department_id == current_emp.department_id),
            Employee.is_deleted == False
        ).all()
        team_ids = [t.id for t in team_members]

        pending_team_leaves = LeaveRequest.query.filter(
            LeaveRequest.employee_id.in_(team_ids),
            LeaveRequest.status == LeaveStatus.PENDING
        ).count()

        team_today_attendance = AttendanceRecord.query.filter(
            AttendanceRecord.employee_id.in_(team_ids),
            AttendanceRecord.date == today
        ).all()

        role_specific = {
            'team_count': len(team_members),
            'pending_team_leaves': pending_team_leaves,
            'team_present_today': len([a for a in team_today_attendance if a.clock_in])
        }

    elif current_u.role == UserRole.EMPLOYEE and current_emp:
        my_pending_leaves = LeaveRequest.query.filter_by(employee_id=current_emp.id, status=LeaveStatus.PENDING).count()
        today_att = AttendanceRecord.query.filter_by(employee_id=current_emp.id, date=today).first()
        
        role_specific = {
            'my_pending_leaves': my_pending_leaves,
            'my_today_clocked_in': today_att is not None and today_att.clock_in is not None,
            'my_today_clocked_out': today_att is not None and today_att.clock_out is not None
        }

    return jsonify({
        'success': True,
        'stats': {
            'total_employees': total_employees,
            'total_departments': total_departments,
            'pending_leaves_count': pending_leaves_count,
            'clocked_in_today': clocked_in_today,
            'attendance_rate': attendance_rate,
            'dept_breakdown': dept_breakdown,
            'status_breakdown': status_breakdown,
            'role_specific': role_specific
        }
    })

@report_bp.route('/export/leave-csv', methods=['GET'])
@token_required
@role_required(UserRole.ADMIN, UserRole.HR_STAFF, UserRole.MANAGER)
def export_leave_csv():
    requests_list = LeaveRequest.query.order_by(LeaveRequest.created_at.desc()).all()

    si = StringIO()
    cw = csv.writer(si)
    cw.writerow(['Request ID', 'Employee Code', 'Employee Name', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status', 'Reviewer', 'Reviewer Comment'])

    for r in requests_list:
        emp = r.employee
        rev = r.reviewer
        cw.writerow([
            r.id,
            emp.employee_code if emp else '',
            f"{emp.first_name} {emp.last_name}" if emp else '',
            emp.department.name if (emp and emp.department) else '',
            r.leave_type.name if r.leave_type else '',
            r.start_date.strftime('%Y-%m-%d'),
            r.end_date.strftime('%Y-%m-%d'),
            r.total_days,
            r.reason,
            r.status,
            f"{rev.first_name} {rev.last_name}" if rev else '',
            r.reviewer_comment or ''
        ])

    output = si.getvalue()

    # Save to local machine if save_local flag is passed
    save_local = request.args.get('save_local', 'false').lower() == 'true'
    local_path = None
    if save_local:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"hrms_leave_requests_{timestamp}.csv"
        local_path = os.path.join(get_exports_dir(), filename)
        with open(local_path, 'w', encoding='utf-8') as f:
            f.write(output)
        log_audit('EXPORT_REPORT_LOCAL', 'Report', details=f"Saved leave CSV report to local file: {local_path}")
        return jsonify({
            'success': True,
            'message': 'Report exported and saved to local machine successfully.',
            'file_path': local_path,
            'filename': filename
        })

    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=hrms_leave_requests_report.csv"}
    )

@report_bp.route('/export/attendance-csv', methods=['GET'])
@token_required
@role_required(UserRole.ADMIN, UserRole.HR_STAFF, UserRole.MANAGER)
def export_attendance_csv():
    records = AttendanceRecord.query.order_by(AttendanceRecord.date.desc()).all()

    si = StringIO()
    cw = csv.writer(si)
    cw.writerow(['Record ID', 'Date', 'Employee Code', 'Employee Name', 'Department', 'Clock In', 'Clock Out', 'Total Hours', 'Status'])

    for r in records:
        emp = r.employee
        cw.writerow([
            r.id,
            r.date.strftime('%Y-%m-%d'),
            emp.employee_code if emp else '',
            f"{emp.first_name} {emp.last_name}" if emp else '',
            emp.department.name if (emp and emp.department) else '',
            r.clock_in.strftime('%H:%M:%S') if r.clock_in else '',
            r.clock_out.strftime('%H:%M:%S') if r.clock_out else '',
            round(r.total_hours, 2) if r.total_hours is not None else 0.0,
            r.status
        ])

    output = si.getvalue()

    save_local = request.args.get('save_local', 'false').lower() == 'true'
    if save_local:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"hrms_attendance_{timestamp}.csv"
        local_path = os.path.join(get_exports_dir(), filename)
        with open(local_path, 'w', encoding='utf-8') as f:
            f.write(output)
        log_audit('EXPORT_REPORT_LOCAL', 'Report', details=f"Saved attendance CSV report to local file: {local_path}")
        return jsonify({
            'success': True,
            'message': 'Attendance report exported and saved to local machine successfully.',
            'file_path': local_path,
            'filename': filename
        })

    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=hrms_attendance_report.csv"}
    )

@report_bp.route('/export/employee-csv', methods=['GET'])
@token_required
@role_required(UserRole.ADMIN, UserRole.HR_STAFF, UserRole.MANAGER)
def export_employee_csv():
    employees = Employee.query.filter_by(is_deleted=False).order_by(Employee.id.asc()).all()

    si = StringIO()
    cw = csv.writer(si)
    cw.writerow(['Employee ID', 'Employee Code', 'First Name', 'Last Name', 'Work Email', 'Phone', 'Department', 'Position', 'Status', 'Role', 'Hire Date'])

    for emp in employees:
        cw.writerow([
            emp.id,
            emp.employee_code,
            emp.first_name,
            emp.last_name,
            emp.email,
            emp.phone or '',
            emp.department.name if emp.department else '',
            emp.position.title if emp.position else '',
            emp.employment_status,
            emp.user.role if emp.user else '',
            emp.hire_date.strftime('%Y-%m-%d') if emp.hire_date else ''
        ])

    output = si.getvalue()

    save_local = request.args.get('save_local', 'false').lower() == 'true'
    if save_local:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"hrms_employees_{timestamp}.csv"
        local_path = os.path.join(get_exports_dir(), filename)
        with open(local_path, 'w', encoding='utf-8') as f:
            f.write(output)
        log_audit('EXPORT_REPORT_LOCAL', 'Report', details=f"Saved employee CSV report to local file: {local_path}")
        return jsonify({
            'success': True,
            'message': 'Employee master roster exported and saved to local machine successfully.',
            'file_path': local_path,
            'filename': filename
        })

    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=hrms_employees_report.csv"}
    )
