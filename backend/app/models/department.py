from datetime import datetime
from app.extensions import db

class Department(db.Model):
    __tablename__ = 'departments'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    manager_id = db.Column(db.Integer, db.ForeignKey('employees.id', use_alter=True, name='fk_dept_manager'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    employees = db.relationship('Employee', foreign_keys='Employee.department_id', backref='department', lazy=True)
    positions = db.relationship('JobPosition', backref='department', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        manager_emp = None
        if self.manager_id:
            from app.models.employee import Employee
            mgr = Employee.query.get(self.manager_id)
            if mgr:
                manager_emp = {
                    'id': mgr.id,
                    'name': f"{mgr.first_name} {mgr.last_name}",
                    'email': mgr.email
                }

        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'description': self.description,
            'manager_id': self.manager_id,
            'manager': manager_emp,
            'employee_count': len([e for e in self.employees if not e.is_deleted]),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class JobPosition(db.Model):
    __tablename__ = 'job_positions'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    employees = db.relationship('Employee', foreign_keys='Employee.position_id', backref='position', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
