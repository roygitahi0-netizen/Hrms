from datetime import datetime
from app.extensions import db
from app.models.user import User, UserRole
from app.models.department import Department, JobPosition
from app.models.employee import Employee, EmploymentStatus
from app.models.leave import LeaveType, LeaveBalance
from app.utils.audit import log_audit

def seed_database():
    db.create_all()

    # Check if admin user exists
    if User.query.filter_by(email="admin@teamhub.com").first():
        return

    print("Initializing Team Hub database structure...")

    # 1. Create Core Departments
    eng_dept = Department(name="Engineering", code="ENG", description="Software development, IT infrastructure and DevOps")
    hr_dept = Department(name="Human Resources", code="HR", description="Talent acquisition, employee relations, culture and compliance")
    sales_dept = Department(name="Sales & Marketing", code="SALES", description="Business development, sales strategy and brand marketing")
    fin_dept = Department(name="Finance & Accounting", code="FIN", description="Financial management, payroll, accounting and auditing")

    db.session.add_all([eng_dept, hr_dept, sales_dept, fin_dept])
    db.session.commit()

    # 2. Create Core Job Positions
    pos_eng_lead = JobPosition(title="Lead Software Engineer", department_id=eng_dept.id, description="Technical lead for core platform development")
    pos_eng_dev = JobPosition(title="Software Engineer", department_id=eng_dept.id, description="Full stack software engineer")
    pos_hr_mgr = JobPosition(title="HR Specialist", department_id=hr_dept.id, description="Manages employee lifecycle and benefits")
    pos_sales_mgr = JobPosition(title="Sales Manager", department_id=sales_dept.id, description="Leads business expansion and key client relations")
    pos_sys_admin = JobPosition(title="System Administrator", department_id=eng_dept.id, description="System administration and security")

    db.session.add_all([pos_eng_lead, pos_eng_dev, pos_hr_mgr, pos_sales_mgr, pos_sys_admin])
    db.session.commit()

    # 3. Create Standard Leave Types
    lt_annual = LeaveType(name="Annual Leave", default_days_per_year=20, description="Paid annual vacation time")
    lt_sick = LeaveType(name="Sick Leave", default_days_per_year=10, description="Paid medical and health recovery leave")
    lt_casual = LeaveType(name="Casual Leave", default_days_per_year=5, description="Short-term unexpected personal leave")
    lt_parental = LeaveType(name="Parental Leave", default_days_per_year=30, description="Maternity and paternity leave allocation")

    db.session.add_all([lt_annual, lt_sick, lt_casual, lt_parental])
    db.session.commit()

    # 4. Create Initial System Admin Account
    u_admin = User(email="admin@teamhub.com", role=UserRole.ADMIN)
    u_admin.set_password("admin123")
    db.session.add(u_admin)
    db.session.commit()

    e_admin = Employee(
        user_id=u_admin.id,
        employee_code="EMP-001",
        first_name="System",
        last_name="Administrator",
        email="admin@teamhub.com",
        phone="+1 (555) 000-0001",
        department_id=eng_dept.id,
        position_id=pos_sys_admin.id,
        employment_status=EmploymentStatus.FULL_TIME,
        hire_date=datetime.utcnow().date(),
        salary=120000.0,
        national_id="ADM-001"
    )
    db.session.add(e_admin)
    db.session.commit()

    # Assign initial leave balances for system admin
    current_year = datetime.utcnow().year
    for lt in [lt_annual, lt_sick, lt_casual, lt_parental]:
        lb = LeaveBalance(
            employee_id=e_admin.id,
            leave_type_id=lt.id,
            year=current_year,
            allocated_days=lt.default_days_per_year,
            used_days=0
        )
        db.session.add(lb)

    db.session.commit()

    try:
        log_audit("INITIALIZE_DATABASE", "System", target_id="1", details="Initialized Team Hub structure with system admin")
    except Exception:
        pass
    print("Database initialization completed successfully!")
