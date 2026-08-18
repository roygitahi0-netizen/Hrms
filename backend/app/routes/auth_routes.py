from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.user import User
from app.utils.rbac import generate_token, token_required, can_view_sensitive_info
from app.utils.audit import log_audit

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required'}), 400

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

    user = g.current_user
    if not user.check_password(old_password):
        return jsonify({'success': False, 'message': 'Incorrect current password'}), 400

    user.set_password(new_password)
    db.session.commit()

    log_audit('CHANGE_PASSWORD', 'User', target_id=user.id, details="Password updated", user_id=user.id)
    return jsonify({'success': True, 'message': 'Password changed successfully'})
