from flask import Blueprint, jsonify, request
from app.models.user import UserRole
from app.models.audit_log import AuditLog
from app.utils.rbac import token_required, role_required

audit_bp = Blueprint('audit', __name__, url_prefix='/api/audit-logs')

@audit_bp.route('', methods=['GET'])
@token_required
@role_required(UserRole.ADMIN, UserRole.HR_STAFF)
def list_audit_logs():
    limit = request.args.get('limit', type=int, default=50)
    target_type = request.args.get('target_type')

    query = AuditLog.query

    if target_type:
        query = query.filter_by(target_type=target_type)

    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()

    return jsonify({
        'success': True,
        'count': len(logs),
        'audit_logs': [l.to_dict() for l in logs]
    })
