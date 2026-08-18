from flask import request
from app.extensions import db
from app.models.audit_log import AuditLog

def log_audit(action, target_type, target_id=None, details=None, user_id=None):
    try:
        ip = request.remote_addr if request else None
    except Exception:
        ip = None

    log_entry = AuditLog(
        user_id=user_id,
        action=action,
        target_type=target_type,
        target_id=str(target_id) if target_id is not None else None,
        details=str(details) if details is not None else None,
        ip_address=ip
    )
    db.session.add(log_entry)
    db.session.commit()
