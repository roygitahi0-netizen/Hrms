from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.user import UserRole
from app.models.department import Department, JobPosition
from app.utils.rbac import token_required, role_required
from app.utils.audit import log_audit

department_bp = Blueprint('departments', __name__, url_prefix='/api/departments')

@department_bp.route('', methods=['GET'])
@token_required
def list_departments():
    depts = Department.query.order_by(Department.name.asc()).all()
    return jsonify({
        'success': True,
        'departments': [d.to_dict() for d in depts]
    })

@department_bp.route('', methods=['POST'])
@token_required
@role_required(UserRole.ADMIN, UserRole.HR_STAFF)
def create_department():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    code = data.get('code', '').strip().upper()
    description = data.get('description', '').strip()
    manager_id = data.get('manager_id')

    if not name or not code:
        return jsonify({'success': False, 'message': 'Department name and code are required'}), 400

    if Department.query.filter((Department.name == name) | (Department.code == code)).first():
        return jsonify({'success': False, 'message': 'Department with this name or code already exists'}), 400

    dept = Department(name=name, code=code, description=description, manager_id=manager_id)
    db.session.add(dept)
    db.session.commit()

    log_audit('CREATE_DEPARTMENT', 'Department', target_id=dept.id, details=f"Created department {name} ({code})", user_id=g.current_user.id)

    return jsonify({
        'success': True,
        'message': 'Department created successfully',
        'department': dept.to_dict()
    }), 201

@department_bp.route('/<int:dept_id>', methods=['PUT'])
@token_required
@role_required(UserRole.ADMIN, UserRole.HR_STAFF)
def update_department(dept_id):
    dept = Department.query.get_or_404(dept_id)
    data = request.get_json() or {}

    if 'name' in data and data['name']:
        dept.name = data['name'].strip()
    if 'code' in data and data['code']:
        dept.code = data['code'].strip().upper()
    if 'description' in data:
        dept.description = data['description'].strip()
    if 'manager_id' in data:
        dept.manager_id = data['manager_id']

    db.session.commit()

    log_audit('UPDATE_DEPARTMENT', 'Department', target_id=dept.id, details=f"Updated department {dept.name}", user_id=g.current_user.id)

    return jsonify({
        'success': True,
        'message': 'Department updated successfully',
        'department': dept.to_dict()
    })

@department_bp.route('/<int:dept_id>', methods=['DELETE'])
@token_required
@role_required(UserRole.ADMIN)
def delete_department(dept_id):
    dept = Department.query.get_or_404(dept_id)
    if len(dept.employees) > 0:
        return jsonify({'success': False, 'message': 'Cannot delete department that contains active employees'}), 400

    db.session.delete(dept)
    db.session.commit()

    log_audit('DELETE_DEPARTMENT', 'Department', target_id=dept_id, details=f"Deleted department {dept.name}", user_id=g.current_user.id)

    return jsonify({'success': True, 'message': 'Department deleted successfully'})

@department_bp.route('/positions', methods=['GET'])
@token_required
def list_positions():
    positions = JobPosition.query.order_by(JobPosition.title.asc()).all()
    return jsonify({
        'success': True,
        'positions': [p.to_dict() for p in positions]
    })

@department_bp.route('/positions', methods=['POST'])
@token_required
@role_required(UserRole.ADMIN, UserRole.HR_STAFF)
def create_position():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    department_id = data.get('department_id')
    description = data.get('description', '').strip()

    if not title or not department_id:
        return jsonify({'success': False, 'message': 'Title and department_id are required'}), 400

    pos = JobPosition(title=title, department_id=department_id, description=description)
    db.session.add(pos)
    db.session.commit()

    log_audit('CREATE_POSITION', 'JobPosition', target_id=pos.id, details=f"Created job position {title}", user_id=g.current_user.id)

    return jsonify({
        'success': True,
        'message': 'Job position created successfully',
        'position': pos.to_dict()
    }), 201
