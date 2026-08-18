from datetime import datetime
from app.extensions import db

class EmploymentStatus:
    FULL_TIME = 'FULL_TIME'
    PART_TIME = 'PART_TIME'
    CONTRACT = 'CONTRACT'

    ALL = [FULL_TIME, PART_TIME, CONTRACT]

class Employee(db.Model):
    __tablename__ = 'employees'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    employee_code = db.Column(db.String(20), unique=True, nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(30), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    emergency_contact_name = db.Column(db.String(100), nullable=True)
    emergency_contact_phone = db.Column(db.String(30), nullable=True)

    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    position_id = db.Column(db.Integer, db.ForeignKey('job_positions.id'), nullable=True)
    manager_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=True)

    employment_status = db.Column(db.String(20), default=EmploymentStatus.FULL_TIME, nullable=False)
    hire_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)

    # Sensitive fields
    salary = db.Column(db.Float, nullable=True)
    national_id = db.Column(db.String(50), nullable=True)

    is_deleted = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    direct_reports = db.relationship('Employee', backref=db.backref('manager', remote_side=[id]), lazy=True)
    leave_balances = db.relationship('LeaveBalance', backref='employee', lazy=True, cascade="all, delete-orphan")
    leave_requests = db.relationship('LeaveRequest', foreign_keys='LeaveRequest.employee_id', backref='employee', lazy=True, cascade="all, delete-orphan")
    attendance_records = db.relationship('AttendanceRecord', backref='employee', lazy=True, cascade="all, delete-orphan")

    def to_summary_dict(self):
        return {
            'id': self.id,
            'employee_code': self.employee_code,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': f"{self.first_name} {self.last_name}",
            'email': self.email,
            'department_name': self.department.name if self.department else None,
            'position_title': self.position.title if self.position else None
        }

    def to_dict(self, include_sensitive=False):
        mgr = None
        if self.manager_id:
            m = Employee.query.get(self.manager_id)
            if m:
                mgr = {
                    'id': m.id,
                    'name': f"{m.first_name} {m.last_name}",
                    'email': m.email
                }

        data = {
            'id': self.id,
            'user_id': self.user_id,
            'role': self.user.role if self.user else None,
            'employee_code': self.employee_code,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': f"{self.first_name} {self.last_name}",
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'emergency_contact_name': self.emergency_contact_name,
            'emergency_contact_phone': self.emergency_contact_phone,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'position_id': self.position_id,
            'position_title': self.position.title if self.position else None,
            'manager_id': self.manager_id,
            'manager': mgr,
            'employment_status': self.employment_status,
            'hire_date': self.hire_date.strftime('%Y-%m-%d') if self.hire_date else None,
            'is_deleted': self.is_deleted,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if include_sensitive:
            data['salary'] = self.salary
            data['national_id'] = self.national_id

        return data
