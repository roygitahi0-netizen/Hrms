from datetime import datetime
from app.extensions import db

class LeaveStatus:
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'

    ALL = [PENDING, APPROVED, REJECTED]

class LeaveType(db.Model):
    __tablename__ = 'leave_types'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    default_days_per_year = db.Column(db.Integer, nullable=False, default=20)
    description = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'default_days_per_year': self.default_days_per_year,
            'description': self.description
        }

class LeaveBalance(db.Model):
    __tablename__ = 'leave_balances'

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    leave_type_id = db.Column(db.Integer, db.ForeignKey('leave_types.id'), nullable=False)
    year = db.Column(db.Integer, nullable=False, default=datetime.utcnow().year)
    allocated_days = db.Column(db.Integer, nullable=False, default=20)
    used_days = db.Column(db.Integer, nullable=False, default=0)

    # Relationship
    leave_type = db.relationship('LeaveType', lazy=True)

    @property
    def remaining_days(self):
        return max(0, self.allocated_days - self.used_days)

    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'leave_type_id': self.leave_type_id,
            'leave_type_name': self.leave_type.name if self.leave_type else None,
            'year': self.year,
            'allocated_days': self.allocated_days,
            'used_days': self.used_days,
            'remaining_days': self.remaining_days
        }

class LeaveRequest(db.Model):
    __tablename__ = 'leave_requests'

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    leave_type_id = db.Column(db.Integer, db.ForeignKey('leave_types.id'), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default=LeaveStatus.PENDING, nullable=False)

    reviewer_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=True)
    reviewer_comment = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    leave_type = db.relationship('LeaveType', lazy=True)
    reviewer = db.relationship('Employee', foreign_keys=[reviewer_id], lazy=True)

    @property
    def total_days(self):
        if self.start_date and self.end_date:
            return (self.end_date - self.start_date).days + 1
        return 0

    def to_dict(self):
        emp = self.employee
        rev = self.reviewer
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'employee_name': f"{emp.first_name} {emp.last_name}" if emp else None,
            'department_name': emp.department.name if (emp and emp.department) else None,
            'leave_type_id': self.leave_type_id,
            'leave_type_name': self.leave_type.name if self.leave_type else None,
            'start_date': self.start_date.strftime('%Y-%m-%d') if self.start_date else None,
            'end_date': self.end_date.strftime('%Y-%m-%d') if self.end_date else None,
            'total_days': self.total_days,
            'reason': self.reason,
            'status': self.status,
            'reviewer_id': self.reviewer_id,
            'reviewer_name': f"{rev.first_name} {rev.last_name}" if rev else None,
            'reviewer_comment': self.reviewer_comment,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
