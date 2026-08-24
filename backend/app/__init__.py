from flask import Flask, jsonify, request
from flask_cors import CORS
from app.config import Config
from app.extensions import db

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    CORS(app, resources={r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
    }})

    @app.after_request
    def add_cors_headers(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        return response

    @app.route('/api/<path:dummy>', methods=['OPTIONS'])
    @app.route('/api', methods=['OPTIONS'])
    def handle_options(dummy=None):
        return jsonify({'status': 'ok'}), 200

    with app.app_context():
        try:
            # Explicitly import models so SQLAlchemy metadata registers all tables
            from app.models.user import User
            from app.models.employee import Employee
            from app.models.department import Department, JobPosition
            from app.models.leave import LeaveType, LeaveBalance, LeaveRequest
            from app.models.attendance import AttendanceRecord
            from app.models.notification import Notification
            from app.models.audit_log import AuditLog
            from app.utils.seed import seed_database

            db.create_all()
            seed_database()
        except Exception as e:
            app.logger.error(f"Error during auto-seeding: {e}")

    # Register blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.employee_routes import employee_bp
    from app.routes.department_routes import department_bp
    from app.routes.leave_routes import leave_bp
    from app.routes.attendance_routes import attendance_bp
    from app.routes.report_routes import report_bp
    from app.routes.notification_routes import notification_bp
    from app.routes.audit_routes import audit_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(employee_bp)
    app.register_blueprint(department_bp)
    app.register_blueprint(leave_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(audit_bp)

    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({'status': 'healthy', 'service': 'HRMS Flask REST API', 'version': '1.0.0'})

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'success': False, 'message': 'Endpoint not found'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'success': False, 'message': 'An internal server error occurred'}), 500

    return app
