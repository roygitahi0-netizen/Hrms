from datetime import datetime
from app.extensions import db

class AttendanceStatus:
    PRESENT = 'PRESENT'
    LATE = 'LATE'
    HALF_DAY = 'HALF_DAY'
    ABSENT = 'ABSENT'

    ALL = [PRESENT, LATE, HALF_DAY, ABSENT]

class AttendanceRecord(db.Model):
    __tablename__ = 'attendance_records'

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow().date)
    clock_in = db.Column(db.DateTime, nullable=True)
    clock_out = db.Column(db.DateTime, nullable=True)
    total_hours = db.Column(db.Float, nullable=True, default=0.0)
    status = db.Column(db.String(20), default=AttendanceStatus.PRESENT, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        emp = self.employee
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'employee_name': f"{emp.first_name} {emp.last_name}" if emp else None,
            'department_name': emp.department.name if (emp and emp.department) else None,
            'date': self.date.strftime('%Y-%m-%d') if self.date else None,
            'clock_in': (self.clock_in.isoformat() + 'Z') if self.clock_in else None,
            'clock_out': (self.clock_out.isoformat() + 'Z') if self.clock_out else None,
            'total_hours': round(self.total_hours, 2) if self.total_hours is not None else 0.0,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
