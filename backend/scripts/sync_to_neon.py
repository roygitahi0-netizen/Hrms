import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add parent dir to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.department import Department, JobPosition
from app.models.employee import Employee
from app.models.leave import LeaveType, LeaveBalance

def migrate_to_remote(target_db_url):
    print(f"Connecting to target database...")
    app = create_app()
    app.app_context().push()

    # Create target engine
    if target_db_url.startswith('postgres://'):
        target_db_url = target_db_url.replace('postgres://', 'postgresql://', 1)
    if 'sslmode' not in target_db_url and 'postgresql://' in target_db_url:
        separator = '&' if '?' in target_db_url else '?'
        target_db_url = f"{target_db_url}{separator}sslmode=require"

    target_engine = create_engine(target_db_url)
    
    # Create all tables on target DB
    from app.models import user, department, employee, leave, attendance, audit_log
    db.metadata.create_all(target_engine)

    TargetSession = sessionmaker(bind=target_engine)
    target_session = TargetSession()

    print("Copying local data to target database...")

    # Copy Departments
    for d in Department.query.all():
        if not target_session.query(Department).filter_by(code=d.code).first():
            target_session.add(Department(
                id=d.id,
                name=d.name,
                code=d.code,
                description=d.description
            ))
    target_session.commit()

    # Copy Positions
    for p in JobPosition.query.all():
        if not target_session.query(JobPosition).filter_by(id=p.id).first():
            target_session.add(JobPosition(
                id=p.id,
                title=p.title,
                department_id=p.department_id,
                description=p.description
            ))
    target_session.commit()

    # Copy Leave Types
    for lt in LeaveType.query.all():
        if not target_session.query(LeaveType).filter_by(name=lt.name).first():
            target_session.add(LeaveType(
                id=lt.id,
                name=lt.name,
                default_days_per_year=lt.default_days_per_year,
                description=lt.description
            ))
    target_session.commit()

    # Copy Users & Employees
    for u in User.query.all():
        existing_u = target_session.query(User).filter_by(email=u.email).first()
        if not existing_u:
            new_u = User(
                id=u.id,
                email=u.email,
                password_hash=u.password_hash,
                role=u.role,
                is_active=u.is_active,
                created_at=u.created_at
            )
            target_session.add(new_u)
            target_session.commit()
            u_id = new_u.id
        else:
            u_id = existing_u.id

        emp = u.employee_profile
        if emp and not target_session.query(Employee).filter_by(email=emp.email).first():
            new_emp = Employee(
                id=emp.id,
                user_id=u_id,
                employee_code=emp.employee_code,
                first_name=emp.first_name,
                last_name=emp.last_name,
                email=emp.email,
                phone=emp.phone,
                department_id=emp.department_id,
                position_id=emp.position_id,
                employment_status=emp.employment_status,
                hire_date=emp.hire_date,
                salary=emp.salary,
                national_id=emp.national_id,
                is_deleted=emp.is_deleted
            )
            target_session.add(new_emp)
            target_session.commit()

            # Copy balances for this employee
            for lb in emp.leave_balances:
                if not target_session.query(LeaveBalance).filter_by(employee_id=new_emp.id, leave_type_id=lb.leave_type_id, year=lb.year).first():
                    target_session.add(LeaveBalance(
                        employee_id=new_emp.id,
                        leave_type_id=lb.leave_type_id,
                        year=lb.year,
                        allocated_days=lb.allocated_days,
                        used_days=lb.used_days
                    ))
            target_session.commit()

    print("Data sync to remote target database completed successfully!")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python scripts/sync_to_neon.py <DATABASE_URL>")
        sys.exit(1)
    
    url = sys.argv[1]
    migrate_to_remote(url)
