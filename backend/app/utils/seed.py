from datetime import datetime
from app.extensions import db
from app.models.user import User, UserRole
from app.models.department import Department, JobPosition
from app.models.employee import Employee, EmploymentStatus
from app.models.leave import LeaveType, LeaveBalance
from app.utils.audit import log_audit

def seed_database():
    db.create_all()

    # 1. Create Core Departments if missing
    eng_dept = Department.query.filter_by(code="ENG").first()
    if not eng_dept:
        eng_dept = Department(name="Engineering", code="ENG", description="Software development, IT infrastructure and DevOps")
        db.session.add(eng_dept)

    hr_dept = Department.query.filter_by(code="HR").first()
    if not hr_dept:
        hr_dept = Department(name="Human Resources", code="HR", description="Talent acquisition, employee relations, culture and compliance")
        db.session.add(hr_dept)

    sales_dept = Department.query.filter_by(code="SALES").first()
    if not sales_dept:
        sales_dept = Department(name="Sales & Marketing", code="SALES", description="Business development, sales strategy and brand marketing")
        db.session.add(sales_dept)

    fin_dept = Department.query.filter_by(code="FIN").first()
    if not fin_dept:
        fin_dept = Department(name="Finance & Accounting", code="FIN", description="Financial management, payroll, accounting and auditing")
        db.session.add(fin_dept)

    db.session.commit()

    # 2. Create Core Job Positions if missing
    if JobPosition.query.count() == 0:
        pos_eng_lead = JobPosition(title="Lead Software Engineer", department_id=eng_dept.id, description="Technical lead for core platform development")
        pos_eng_dev = JobPosition(title="Software Engineer", department_id=eng_dept.id, description="Full stack software engineer")
        pos_hr_mgr = JobPosition(title="HR Specialist", department_id=hr_dept.id, description="Manages employee lifecycle and benefits")
        pos_sales_mgr = JobPosition(title="Sales Manager", department_id=sales_dept.id, description="Leads business expansion and key client relations")
        pos_sys_admin = JobPosition(title="System Administrator", department_id=eng_dept.id, description="System administration and security")
        db.session.add_all([pos_eng_lead, pos_eng_dev, pos_hr_mgr, pos_sales_mgr, pos_sys_admin])
        db.session.commit()

    # 3. Create Standard Leave Types if missing
    if LeaveType.query.count() == 0:
        lt_annual = LeaveType(name="Annual Leave", default_days_per_year=20, description="Paid annual vacation time")
        lt_sick = LeaveType(name="Sick Leave", default_days_per_year=10, description="Paid medical and health recovery leave")
        lt_casual = LeaveType(name="Casual Leave", default_days_per_year=5, description="Short-term unexpected personal leave")
        lt_parental = LeaveType(name="Parental Leave", default_days_per_year=30, description="Maternity and paternity leave allocation")
        db.session.add_all([lt_annual, lt_sick, lt_casual, lt_parental])
        db.session.commit()

    # 4. Seed Standard Employee Roster
    seed_users = [
        {"email": "admin@teamhub.com", "role": UserRole.ADMIN, "first": "System", "last": "Administrator", "code": "EMP-001", "dept": eng_dept.id},
        {"email": "roygitahi0@gmail.com", "role": UserRole.EMPLOYEE, "first": "Jane", "last": "Doe", "code": "EMP-002", "dept": sales_dept.id},
        {"email": "ryan@gmail.com", "role": UserRole.EMPLOYEE, "first": "Ryan", "last": "Kamau", "code": "EMP-003", "dept": hr_dept.id},
        {"email": "ding@gmail.com", "role": UserRole.EMPLOYEE, "first": "Ding", "last": "Mading", "code": "EMP-004", "dept": hr_dept.id},
        {"email": "girang@gmail.com", "role": UserRole.EMPLOYEE, "first": "Girang", "last": "Fima", "code": "EMP-005", "dept": hr_dept.id},
        {"email": "derrick@gmail.com", "role": UserRole.EMPLOYEE, "first": "Derrick", "last": "Ayieko", "code": "EMP-006", "dept": sales_dept.id},
    ]

    current_year = datetime.utcnow().year
    leave_types = LeaveType.query.all()

    for item in seed_users:
        u = User.query.filter_by(email=item["email"]).first()
        if not u:
            u = User(email=item["email"], role=item["role"], is_active=True)
            u.set_password("admin123" if item["email"] == "admin@teamhub.com" else "UserPass123!")
            db.session.add(u)
            db.session.commit()

        emp = Employee.query.filter_by(user_id=u.id).first()
        if not emp:
            emp = Employee(
                user_id=u.id,
                employee_code=item["code"],
                first_name=item["first"],
                last_name=item["last"],
                email=item["email"],
                department_id=item["dept"],
                employment_status=EmploymentStatus.FULL_TIME,
                hire_date=datetime.utcnow().date()
            )
            db.session.add(emp)
            db.session.commit()

        # Provision Leave Balances
        for lt in leave_types:
            bal_exists = LeaveBalance.query.filter_by(employee_id=emp.id, leave_type_id=lt.id, year=current_year).first()
            if not bal_exists:
                bal = LeaveBalance(
                    employee_id=emp.id,
                    leave_type_id=lt.id,
                    year=current_year,
                    allocated_days=lt.default_days_per_year,
                    used_days=0
                )
                db.session.add(bal)

    db.session.commit()
    print("Database seeding completed successfully!")
