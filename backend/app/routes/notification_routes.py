from flask import Blueprint, jsonify, request, g
from app.extensions import db
from app.models.notification import Notification
from app.utils.rbac import token_required

notification_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notification_bp.route('', methods=['GET'])
@token_required
def list_notifications():
    try:
        user = g.current_user
        notifications = Notification.query.filter_by(user_id=user.id).order_by(Notification.created_at.desc()).limit(20).all()
        unread_count = Notification.query.filter_by(user_id=user.id, is_read=False).count()

        return jsonify({
            'success': True,
            'unread_count': unread_count,
            'notifications': [n.to_dict() for n in notifications]
        })
    except Exception as err:
        print(f"[Notification Fetch Warning] {err}")
        return jsonify({
            'success': True,
            'unread_count': 0,
            'notifications': []
        })

@notification_bp.route('/mark-read', methods=['POST'])
@token_required
def mark_read():
    user = g.current_user
    data = request.get_json() or {}
    notif_id = data.get('notification_id')

    if notif_id:
        n = Notification.query.filter_by(id=notif_id, user_id=user.id).first()
        if n:
            n.is_read = True
    else:
        # Mark all as read
        notifications = Notification.query.filter_by(user_id=user.id, is_read=False).all()
        for n in notifications:
            n.is_read = True

    db.session.commit()
    return jsonify({'success': True, 'message': 'Notifications updated'})
