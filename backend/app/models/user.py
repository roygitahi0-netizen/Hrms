from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db

class UserRole:
    ADMIN = 'ADMIN'
    HR_STAFF = 'HR_STAFF'
    MANAGER = 'MANAGER'
    EMPLOYEE = 'EMPLOYEE'

    ALL = [ADMIN, HR_STAFF, MANAGER, EMPLOYEE]

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default=UserRole.EMPLOYEE)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    employee_profile = db.relationship('Employee', backref='user', uselist=False, lazy=True, cascade="all, delete-orphan")
    notifications = db.relationship('Notification', backref='user', lazy=True, cascade="all, delete-orphan")
    audit_logs = db.relationship('AuditLog', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        emp = self.employee_profile
        return {
            'id': self.id,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'employee': emp.to_summary_dict() if emp else None
        }
