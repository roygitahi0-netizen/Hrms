from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.user import UserRole
from app.models.department import Department, JobPosition
from app.utils.rbac import token_required, role_required
from app.utils.audit import log_audit

department_bp = Blueprint('departments', __name__, url_prefix='/api/departments')

def sanitize_int(value):
    if value is None or str(value).strip() == '':
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None

@department_bp.route('', methods=['GET'])
def list_departments():
    try:
        depts = Department.query.order_by(Department.name.asc()).all()
        return jsonify({
            'success': True,
            'departments': [d.to_dict() for d in depts]
        })
    except Exception as err:
        print(f"[List Departments Error] {err}")
        return jsonify({'success': False, 'message': 'Failed to retrieve departments', 'departments': []}), 500

@department_bp.route('', methods=['POST'])
@token_required
@role_required(UserRole.ADMIN, UserRole.HR_STAFF)
def create_department():
    try:
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        code = data.get('code', '').strip().upper()
        description = data.get('description', '').strip()
        manager_id = sanitize_int(data.get('manager_id'))

        if not name or not code:
            return jsonify({'success': False, 'message': 'Department name and code are required'}), 400

        existing = Department.query.filter((Department.name == name) | (Department.code == code)).first()
        if existing:
            if existing.name.lower() == name.lower():
                return jsonify({'success': False, 'message': f'Department with name "{name}" already exists'}), 400
            return jsonify({'success': False, 'message': f'Department with code "{code}" already exists'}), 400

        dept = Department(name=name, code=code, description=description, manager_id=manager_id)
        db.session.add(dept)
        db.session.commit()

        try:
            user_id = g.current_user.id if hasattr(g, 'current_user') and g.current_user else None
            log_audit('CREATE_DEPARTMENT', 'Department', target_id=dept.id, details=f"Created department {name} ({code})", user_id=user_id)
        except Exception as audit_err:
            print(f"[Audit Warning] {audit_err}")

        return jsonify({
            'success': True,
            'message': f'Department "{name}" ({code}) created successfully',
            'department': dept.to_dict()
        }), 201
    except Exception as err:
        db.session.rollback()
        print(f"[Create Department Error] {err}")
        return jsonify({'success': False, 'message': f'Error creating department: {str(err)}'}), 400

@department_bp.route('/<int:dept_id>', methods=['PUT'])
@token_required
@role_required(UserRole.ADMIN, UserRole.HR_STAFF)
def update_department(dept_id):
    try:
        dept = Department.query.get(dept_id)
        if not dept:
            return jsonify({'success': False, 'message': 'Department not found'}), 404

        data = request.get_json() or {}

        if 'name' in data and data['name']:
            dept.name = data['name'].strip()
        if 'code' in data and data['code']:
            dept.code = data['code'].strip().upper()
        if 'description' in data:
            dept.description = data['description'].strip()
        if 'manager_id' in data:
            dept.manager_id = sanitize_int(data['manager_id'])

        db.session.commit()

        try:
            user_id = g.current_user.id if hasattr(g, 'current_user') and g.current_user else None
            log_audit('UPDATE_DEPARTMENT', 'Department', target_id=dept.id, details=f"Updated department {dept.name}", user_id=user_id)
        except Exception as audit_err:
            print(f"[Audit Warning] {audit_err}")

        return jsonify({
            'success': True,
            'message': 'Department updated successfully',
            'department': dept.to_dict()
        })
    except Exception as err:
        db.session.rollback()
        print(f"[Update Department Error] {err}")
        return jsonify({'success': False, 'message': f'Error updating department: {str(err)}'}), 400

@department_bp.route('/<int:dept_id>', methods=['DELETE'])
@token_required
@role_required(UserRole.ADMIN)
def delete_department(dept_id):
    try:
        dept = Department.query.get(dept_id)
        if not dept:
            return jsonify({'success': False, 'message': 'Department not found'}), 404

        if len(dept.employees) > 0:
            return jsonify({'success': False, 'message': 'Cannot delete department that contains active employees'}), 400

        dept_name = dept.name
        db.session.delete(dept)
        db.session.commit()

        try:
            user_id = g.current_user.id if hasattr(g, 'current_user') and g.current_user else None
            log_audit('DELETE_DEPARTMENT', 'Department', target_id=dept_id, details=f"Deleted department {dept_name}", user_id=user_id)
        except Exception as audit_err:
            print(f"[Audit Warning] {audit_err}")

        return jsonify({'success': True, 'message': f'Department "{dept_name}" deleted successfully'})
    except Exception as err:
        db.session.rollback()
        print(f"[Delete Department Error] {err}")
        return jsonify({'success': False, 'message': f'Error deleting department: {str(err)}'}), 400

@department_bp.route('/positions', methods=['GET'])
@token_required
def list_positions():
    try:
        positions = JobPosition.query.order_by(JobPosition.title.asc()).all()
        return jsonify({
            'success': True,
            'positions': [p.to_dict() for p in positions]
        })
    except Exception as err:
        print(f"[List Positions Error] {err}")
        return jsonify({'success': False, 'message': 'Failed to retrieve positions', 'positions': []}), 500

@department_bp.route('/positions', methods=['POST'])
@token_required
@role_required(UserRole.ADMIN, UserRole.MANAGER, UserRole.HR_STAFF)
def create_position():
    try:
        data = request.get_json() or {}
        title = data.get('title', '').strip()
        department_id = sanitize_int(data.get('department_id'))
        description = data.get('description', '').strip()

        if not title or not department_id:
            return jsonify({'success': False, 'message': 'Title and department_id are required'}), 400

        dept = Department.query.get(department_id)
        if not dept:
            return jsonify({'success': False, 'message': 'Selected department does not exist'}), 400

        pos = JobPosition(title=title, department_id=department_id, description=description)
        db.session.add(pos)
        db.session.commit()

        try:
            user_id = g.current_user.id if hasattr(g, 'current_user') and g.current_user else None
            log_audit('CREATE_POSITION', 'JobPosition', target_id=pos.id, details=f"Created job position {title}", user_id=user_id)
        except Exception as audit_err:
            print(f"[Audit Warning] {audit_err}")

        return jsonify({
            'success': True,
            'message': f'Job position "{title}" created successfully',
            'position': pos.to_dict()
        }), 201
    except Exception as err:
        db.session.rollback()
        print(f"[Create Position Error] {err}")
        return jsonify({'success': False, 'message': f'Error creating position: {str(err)}'}), 400

@department_bp.route('/positions/<int:pos_id>', methods=['PUT'])
@token_required
@role_required(UserRole.ADMIN, UserRole.MANAGER, UserRole.HR_STAFF)
def update_position(pos_id):
    try:
        pos = JobPosition.query.get(pos_id)
        if not pos:
            return jsonify({'success': False, 'message': 'Job position not found'}), 404

        data = request.get_json() or {}
        if 'title' in data and data['title']:
            pos.title = data['title'].strip()
        if 'department_id' in data and data['department_id']:
            dept_id = sanitize_int(data['department_id'])
            if dept_id and Department.query.get(dept_id):
                pos.department_id = dept_id
        if 'description' in data:
            pos.description = data['description'].strip()

        db.session.commit()

        try:
            user_id = g.current_user.id if hasattr(g, 'current_user') and g.current_user else None
            log_audit('UPDATE_POSITION', 'JobPosition', target_id=pos.id, details=f"Updated job position {pos.title}", user_id=user_id)
        except Exception as audit_err:
            print(f"[Audit Warning] {audit_err}")

        return jsonify({
            'success': True,
            'message': f'Job position "{pos.title}" updated successfully',
            'position': pos.to_dict()
        })
    except Exception as err:
        db.session.rollback()
        print(f"[Update Position Error] {err}")
        return jsonify({'success': False, 'message': f'Error updating job position: {str(err)}'}), 400

@department_bp.route('/positions/<int:pos_id>', methods=['DELETE'])
@token_required
@role_required(UserRole.ADMIN, UserRole.MANAGER, UserRole.HR_STAFF)
def delete_position(pos_id):
    try:
        pos = JobPosition.query.get(pos_id)
        if not pos:
            return jsonify({'success': False, 'message': 'Job position not found'}), 404

        if len(pos.employees) > 0:
            return jsonify({'success': False, 'message': 'Cannot delete position assigned to active employees'}), 400

        title = pos.title
        db.session.delete(pos)
        db.session.commit()

        try:
            user_id = g.current_user.id if hasattr(g, 'current_user') and g.current_user else None
            log_audit('DELETE_POSITION', 'JobPosition', target_id=pos_id, details=f"Deleted job position {title}", user_id=user_id)
        except Exception as audit_err:
            print(f"[Audit Warning] {audit_err}")

        return jsonify({'success': True, 'message': f'Job position "{title}" deleted successfully'})
    except Exception as err:
        db.session.rollback()
        print(f"[Delete Position Error] {err}")
        return jsonify({'success': False, 'message': f'Error deleting job position: {str(err)}'}), 400
