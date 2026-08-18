from flask import Blueprint, request, jsonify, g
from marshmallow import ValidationError
from app.extensions import db
from app.models.user import User, UserRole
from app.models.employee import Employee, EmploymentStatus
from app.models.leave import LeaveType, LeaveBalance
from app.schemas.auth_schemas import UserRegistrationSchema, UserLoginSchema
from app.utils.rbac import generate_token, token_required, can_view_sensitive_info
from app.utils.audit import log_audit

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

registration_schema = UserRegistrationSchema()
login_schema = UserLoginSchema()

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}

    try:
        validated_data = registration_schema.load(data)
    except ValidationError as err:
        # Extract first validation error for display
        messages = []
        for field, err_list in err.messages.items():
            messages.append(err_list[0] if isinstance(err_list, list) else str(err_list))
        first_msg = messages[0] if messages else "Validation failed"
        return jsonify({'success': False, 'message': first_msg, 'errors': err.messages}), 400

    email = validated_data['email'].strip().lower()
    password = validated_data['password']
    first_name = validated_data['first_name'].strip()
    last_name = validated_data['last_name'].strip()
    phone = validated_data.get('phone', '').strip() if validated_data.get('phone') else ''
    country = validated_data.get('country', '').strip() if validated_data.get('country') else ''
    role = validated_data.get('role', UserRole.EMPLOYEE)

    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'An account with this email already exists'}), 400

    # 1. Create User account with bcrypt hashing
    user = User(email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    # 2. Auto-generate employee code
    count = Employee.query.count() + 1
    employee_code = f"EMP-{count:03d}"
    while Employee.query.filter_by(employee_code=employee_code).first():
        count += 1
        employee_code = f"EMP-{count:03d}"

    # 3. Create Employee profile with phone and country
    employee = Employee(
        user_id=user.id,
        employee_code=employee_code,
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=phone,
        country=country,
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
    log_audit('USER_REGISTER', 'User', target_id=user.id, details=f"New user registered: {first_name} {last_name} ({email}) - {role}", user_id=user.id)

    return jsonify({
        'success': True,
        'message': 'Registration successful',
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

    if not user.is_active:
        return jsonify({'success': False, 'message': 'Account is deactivated. Contact HR or Admin.'}), 403

    token = generate_token(user)
    log_audit('LOGIN_SUCCESS', 'User', target_id=user.id, details=f"User {user.email} logged in", user_id=user.id)

    emp = user.employee_profile
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
            'employee': emp_data
        }
    })

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    log_audit('LOGOUT', 'User', target_id=g.current_user.id, details=f"User {g.current_user.email} logged out", user_id=g.current_user.id)
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password():
    data = request.get_json() or {}
    old_password = data.get('old_password', '')
    new_password = data.get('new_password', '')

    if not old_password or not new_password:
        return jsonify({'success': False, 'message': 'Both old and new passwords are required'}), 400

    if len(new_password) < 6:
        return jsonify({'success': False, 'message': 'New password must be at least 6 characters long'}), 400

    user = g.current_user
    if not user.check_password(old_password):
        return jsonify({'success': False, 'message': 'Incorrect current password'}), 400

    user.set_password(new_password)
    db.session.commit()

    log_audit('CHANGE_PASSWORD', 'User', target_id=user.id, details="Password updated", user_id=user.id)
    return jsonify({'success': True, 'message': 'Password changed successfully'})
