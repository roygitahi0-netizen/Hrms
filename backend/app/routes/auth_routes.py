from flask import Blueprint, request, jsonify, g
from marshmallow import ValidationError
from app.extensions import db
from app.models.user import User, UserRole
from app.models.employee import Employee, EmploymentStatus
from app.models.department import Department
from app.models.leave import LeaveType, LeaveBalance
from app.models.audit_log import AuditLog
from app.schemas.auth_schemas import UserRegistrationSchema, UserLoginSchema, UserEligibilityUpdateSchema, ForgotPasswordSchema, ResetPasswordSchema, AdminPasswordResetSchema
from app.utils.rbac import generate_token, generate_reset_token, decode_reset_token, token_required, role_required, can_view_sensitive_info
from app.utils.audit import log_audit

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

registration_schema = UserRegistrationSchema()
login_schema = UserLoginSchema()
eligibility_schema = UserEligibilityUpdateSchema()
forgot_password_schema = ForgotPasswordSchema()
reset_password_schema = ResetPasswordSchema()
admin_password_reset_schema = AdminPasswordResetSchema()


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}

    try:
        validated_data = registration_schema.load(data)
    except ValidationError as err:
        messages = []
        for field, err_list in err.messages.items():
            messages.append(err_list[0] if isinstance(err_list, list) else str(err_list))
        first_msg = messages[0] if messages else "Validation failed"
        return jsonify({'success': False, 'message': first_msg, 'errors': err.messages}), 400

    email = validated_data['email'].strip().lower()
    password = validated_data['password']
    first_name = validated_data['first_name'].strip()
    last_name = validated_data['last_name'].strip()
    department_id = validated_data['department_id']
    phone = validated_data.get('phone', '').strip() if validated_data.get('phone') else ''
    country = validated_data.get('country', '').strip() if validated_data.get('country') else ''

    # Verify Department exists
    dept = Department.query.get(department_id)
    if not dept:
        return jsonify({'success': False, 'message': 'Selected department does not exist'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'An account with this email already exists'}), 400

    # 1. Create User account with EMPLOYEE role by default
    user = User(email=email, role=UserRole.EMPLOYEE, is_active=True)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    # 2. Auto-generate employee code
    count = Employee.query.count() + 1
    employee_code = f"EMP-{count:03d}"
    while Employee.query.filter_by(employee_code=employee_code).first():
        count += 1
        employee_code = f"EMP-{count:03d}"

    # 3. Create Employee profile with assigned department
    employee = Employee(
        user_id=user.id,
        employee_code=employee_code,
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=phone,
        country=country,
        department_id=department_id,
        address=data.get('address', ''),
        employment_status=EmploymentStatus.FULL_TIME
    )
    db.session.add(employee)
    db.session.commit()

    # 4. Create default leave balances
    leave_types = LeaveType.query.all()
    current_year = user.created_at.year
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

    token = generate_token(user)
    log_audit('USER_REGISTER', 'User', target_id=user.id, details=f"New user registered: {first_name} {last_name} ({email}) assigned to {dept.name}", user_id=user.id)

    return jsonify({
        'success': True,
        'message': f'Registration successful in {dept.name} department',
        'token': token,
        'user': {
            'id': user.id,
            'email': user.email,
            'role': user.role,
            'employee': employee.to_dict(include_sensitive=False)
        }
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}

    try:
        validated_data = login_schema.load(data)
    except ValidationError as err:
        messages = []
        for field, err_list in err.messages.items():
            messages.append(err_list[0] if isinstance(err_list, list) else str(err_list))
        first_msg = messages[0] if messages else "Validation failed"
        return jsonify({'success': False, 'message': first_msg, 'errors': err.messages}), 400

    email = validated_data['email'].strip().lower()
    password = validated_data['password']

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        log_audit('LOGIN_FAILED', 'User', details=f"Failed login attempt for {email}")
        return jsonify({'success': False, 'message': 'Invalid email or password'}), 401

    # Admin Eligibility Check
    if not user.is_active:
        log_audit('LOGIN_BLOCKED', 'User', target_id=user.id, details=f"Inactive account login attempt for {email}")
        return jsonify({'success': False, 'message': 'Account pending Admin eligibility approval or deactivated.'}), 403

    token = generate_token(user)
    emp = user.employee_profile
    dept_name = emp.department.name if emp and emp.department else "Unassigned"
    log_audit('LOGIN_SUCCESS', 'User', target_id=user.id, details=f"User {user.email} ({user.role}) logged in to {dept_name}", user_id=user.id)

    include_sensitive = can_view_sensitive_info(user, emp)
    emp_data = emp.to_dict(include_sensitive=include_sensitive) if emp else None

    return jsonify({
        'success': True,
        'message': 'Login successful',
        'token': token,
        'user': {
            'id': user.id,
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active,
            'employee': emp_data
        }
    })

@auth_bp.route('/me', methods=['GET'])
@token_required
def me():
    user = g.current_user
    emp = user.employee_profile
    include_sensitive = can_view_sensitive_info(user, emp) or (emp and emp.id == getattr(user.employee_profile, 'id', None))
    emp_data = emp.to_dict(include_sensitive=include_sensitive) if emp else None

    return jsonify({
        'success': True,
        'user': {
            'id': user.id,
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active,
            'employee': emp_data
        }
    })

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    log_audit('LOGOUT', 'User', target_id=g.current_user.id, details=f"User {g.current_user.email} logged out", user_id=g.current_user.id)
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@auth_bp.route('/users', methods=['GET'])
@token_required
@role_required(UserRole.ADMIN, UserRole.HR_STAFF)
def list_users_eligibility():
    """Admin / HR route to list all users, eligibility status, department, role, and last login time."""
    users = User.query.all()
    user_list = []
    for u in users:
        emp = u.employee_profile
        # Find last login audit log entry
        last_login_log = AuditLog.query.filter_by(user_id=u.id, action='LOGIN_SUCCESS').order_by(AuditLog.timestamp.desc()).first()
        user_list.append({
            'id': u.id,
            'email': u.email,
            'role': u.role,
            'is_active': u.is_active,
            'created_at': u.created_at.isoformat() if u.created_at else None,
            'last_login': last_login_log.timestamp.isoformat() if last_login_log else None,
            'employee': emp.to_dict(include_sensitive=False) if emp else None
        })

    return jsonify({
        'success': True,
        'users': user_list
    })

@auth_bp.route('/users/<int:user_id>/eligibility', methods=['PUT'])
@token_required
@role_required(UserRole.ADMIN, UserRole.HR_STAFF)
def update_user_eligibility(user_id):
    """Admin / HR route to update a user's role, department, or active eligibility status."""
    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({'success': False, 'message': 'User account not found'}), 404

    data = request.get_json() or {}

    try:
        validated_data = eligibility_schema.load(data)
    except ValidationError as err:
        return jsonify({'success': False, 'message': 'Invalid update payload', 'errors': err.messages}), 400

    if 'role' in validated_data and validated_data['role']:
        target_user.role = validated_data['role']

    if 'is_active' in validated_data and validated_data['is_active'] is not None:
        target_user.is_active = validated_data['is_active']

    emp = target_user.employee_profile
    if emp and 'department_id' in validated_data:
        dept_id = validated_data['department_id']
        if dept_id:
            dept = Department.query.get(dept_id)
            if dept:
                emp.department_id = dept_id

    db.session.commit()

    log_audit('UPDATE_USER_ELIGIBILITY', 'User', target_id=target_user.id, details=f"Updated eligibility for {target_user.email}: Role={target_user.role}, Active={target_user.is_active}")

    return jsonify({
        'success': True,
        'message': f'Eligibility and role for {target_user.email} updated successfully.',
        'user': {
            'id': target_user.id,
            'email': target_user.email,
            'role': target_user.role,
            'is_active': target_user.is_active,
            'employee': emp.to_dict(include_sensitive=False) if emp else None
        }
    })

@auth_bp.route('/users/<int:user_id>/reset-password', methods=['PUT'])
@token_required
@role_required(UserRole.ADMIN, UserRole.HR_STAFF)
def admin_reset_user_password(user_id):
    """Admin / HR Staff route to directly assign a new password to any user account.
    Restricted to local machine requests (127.0.0.1 / localhost) unless ALLOW_REMOTE_ADMIN_RESET=true.
    """
    client_ip = request.headers.get('X-Forwarded-For', '').split(',')[0].strip() or request.remote_addr or ''
    allow_remote_reset = os.environ.get('ALLOW_REMOTE_ADMIN_RESET', 'false').lower() == 'true'
    is_localhost = client_ip in ['127.0.0.1', '::1', 'localhost']

    if not is_localhost and not allow_remote_reset:
        return jsonify({
            'success': False,
            'message': 'Security Restriction: Direct admin password override is restricted to local machine access only.'
        }), 403

    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({'success': False, 'message': 'User account not found'}), 404

    data = request.get_json() or {}
    try:
        validated_data = admin_password_reset_schema.load(data)
    except ValidationError as err:
        messages = []
        for field, err_list in err.messages.items():
            messages.append(err_list[0] if isinstance(err_list, list) else str(err_list))
        first_msg = messages[0] if messages else "Validation failed"
        return jsonify({'success': False, 'message': first_msg, 'errors': err.messages}), 400

    new_password = validated_data['new_password']
    target_user.set_password(new_password)
    db.session.commit()

    log_audit('ADMIN_RESET_USER_PASSWORD', 'User', target_id=target_user.id, details=f"Admin {g.current_user.email} reset password for {target_user.email}", user_id=g.current_user.id)

    return jsonify({
        'success': True,
        'message': f'Successfully updated password for {target_user.email}. User can now log in with the new password.'
    })

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_reset_email(to_email, reset_link):
    smtp_server = (os.environ.get('SMTP_SERVER') or os.environ.get('MAIL_SERVER') or '').strip()
    smtp_port_str = os.environ.get('SMTP_PORT') or os.environ.get('MAIL_PORT') or '587'
    smtp_user = (os.environ.get('SMTP_USERNAME') or os.environ.get('MAIL_USERNAME') or '').strip()
    smtp_pass_raw = os.environ.get('SMTP_PASSWORD') or os.environ.get('MAIL_PASSWORD') or ''
    # Automatically strip spaces from Google App Password (e.g. 'abcd efgh ijkl mnop' -> 'abcdefghijklmnop')
    smtp_pass = smtp_pass_raw.replace(' ', '').strip()
    sender_email = (os.environ.get('SMTP_SENDER') or smtp_user or 'noreply@teamhub.com').strip()

    if not smtp_server or not smtp_user or not smtp_pass:
        msg = "SMTP credentials not set on Render environment variables."
        print(f"[Email Dispatcher Warning] {msg}")
        return False, msg

    try:
        smtp_port = int(smtp_port_str)
    except ValueError:
        smtp_port = 587

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "Team Hub — Password Reset Link"
        msg['From'] = f"Team Hub <{sender_email}>"
        msg['To'] = to_email

        html_body = f"""
        <html>
          <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #060913; color: #f8fafc; padding: 20px;">
            <div style="max-width: 520px; margin: 0 auto; background: #0c1222; padding: 32px; border-radius: 16px; border: 1px solid rgba(0, 242, 254, 0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background: linear-gradient(135deg, #6366f1, #00f2fe); border-radius: 12px; font-weight: 800; font-size: 20px; color: #000;">TH</div>
                <h2 style="color: #ffffff; margin-top: 12px; font-size: 22px; letter-spacing: -0.5px;">Password Reset Request</h2>
              </div>
              <p style="font-size: 15px; color: #cbd5e1; line-height: 1.5;">Hello,</p>
              <p style="font-size: 15px; color: #cbd5e1; line-height: 1.5;">We received a request to reset the password for your Team Hub account associated with <strong>{to_email}</strong>.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" style="background: linear-gradient(135deg, #6366f1 0%, #00f2fe 100%); color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 4px 15px rgba(0,242,254,0.3);">
                  Reset Password Now &rarr;
                </a>
              </div>
              <p style="font-size: 13px; color: #94a3b8; line-height: 1.4;">If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
              <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;" />
              <p style="font-size: 12px; color: #64748b; word-break: break-all;">Direct Link: {reset_link}</p>
            </div>
          </body>
        </html>
        """
        msg.attach(MIMEText(html_body, 'html'))

        # Use SSL for port 465, or TLS for port 587/25
        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_server, smtp_port, timeout=15) as server:
                server.login(smtp_user, smtp_pass)
                server.sendmail(sender_email, to_email, msg.as_string())
        else:
            with smtplib.SMTP(smtp_server, smtp_port, timeout=15) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(sender_email, to_email, msg.as_string())
        
        print(f"[Email Dispatcher Success] Sent password reset email to {to_email}")
        return True, "Email sent successfully"
    except Exception as ex:
        err_msg = str(ex)
        print(f"[Email Dispatcher Error] Failed sending to {to_email}: {err_msg}")
        return False, err_msg

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json() or {}
        try:
            validated_data = forgot_password_schema.load(data)
        except ValidationError as err:
            return jsonify({'success': False, 'message': 'Invalid email address format', 'errors': err.messages}), 400

        email = validated_data['email'].strip().lower()
        user = User.query.filter_by(email=email).first()

        if not user:
            # Standard security practice: return success even if user not found to prevent user enumeration
            return jsonify({
                'success': True,
                'message': 'If an account with that email exists, a password reset link has been dispatched to your inbox.'
            })

        token = generate_reset_token(user)
        origin = request.headers.get('Origin') or request.host_url.rstrip('/')
        reset_link = f"{origin}/reset-password?token={token}"

        try:
            log_audit('PASSWORD_RESET_REQUESTED', 'User', target_id=user.id, details=f"Password reset link requested for {email}")
        except Exception as audit_err:
            print(f"[Audit Warning] {audit_err}")

        # Dispatch real email via SMTP
        email_sent, error_reason = send_reset_email(email, reset_link)

        if email_sent:
            msg = f"Password reset email sent to {email}. Please check your inbox and spam folder."
        else:
            msg = f"Password reset link generated for {email}. (Note: {error_reason})"

        return jsonify({
            'success': True,
            'message': msg,
            'reset_link': reset_link,
            'token': token,
            'email_sent': email_sent
        })
    except Exception as general_err:
        print(f"[Forgot Password Error] {general_err}")
        return jsonify({'success': False, 'message': f"Error processing password reset: {str(general_err)}"}), 400

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    try:
        validated_data = reset_password_schema.load(data)
    except ValidationError as err:
        messages = []
        for field, err_list in err.messages.items():
            messages.append(err_list[0] if isinstance(err_list, list) else str(err_list))
        first_msg = messages[0] if messages else "Validation failed"
        return jsonify({'success': False, 'message': first_msg, 'errors': err.messages}), 400

    token = validated_data['token']
    new_password = validated_data['password']

    payload = decode_reset_token(token)
    if not payload:
        return jsonify({'success': False, 'message': 'Invalid or expired password reset link. Please request a new link.'}), 400

    user = User.query.get(payload['user_id'])
    if not user:
        return jsonify({'success': False, 'message': 'User account not found'}), 404

    user.set_password(new_password)
    db.session.commit()

    log_audit('PASSWORD_RESET_SUCCESS', 'User', target_id=user.id, details=f"Password successfully reset for {user.email}", user_id=user.id)

    return jsonify({
        'success': True,
        'message': 'Your password has been reset successfully. You can now log in with your new password.'
    })

