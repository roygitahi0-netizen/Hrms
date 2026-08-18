from datetime import datetime, timedelta
from app.extensions import db
from app.models.user import User, UserRole
from app.models.department import Department, JobPosition
from app.models.employee import Employee, EmploymentStatus
from app.models.leave import LeaveType, LeaveBalance, LeaveRequest, LeaveStatus
from app.models.attendance import AttendanceRecord, AttendanceStatus
from app.models.notification import Notification
from app.models.audit_log import AuditLog

def seed_database():
    db.create_all()

    # Check if already seeded
    if User.query.first():
        print("Database already contains data. Skipping seed.")
        return

    print("Seeding database...")

    # 1. Create Departments
    eng_dept = Department(name="Engineering", code="ENG", description="Software development, IT infrastructure and DevOps")
    hr_dept = Department(name="Human Resources", code="HR", description="Talent acquisition, employee relations, culture and compliance")
    sales_dept = Department(name="Sales & Marketing", code="SALES", description="Business development, sales strategy and brand marketing")
    fin_dept = Department(name="Finance & Accounting", code="FIN", description="Financial management, payroll, accounting and auditing")

    db.session.add_all([eng_dept, hr_dept, sales_dept, fin_dept])
    db.session.commit()

    # 2. Create Job Positions
    pos_eng_lead = JobPosition(title="Lead Software Engineer", department_id=eng_dept.id, description="Technical lead for core platform development")
    pos_eng_dev = JobPosition(title="Software Engineer", department_id=eng_dept.id, description="Full stack software engineer")
    pos_hr_mgr = JobPosition(title="HR Specialist", department_id=hr_dept.id, description="Manages employee lifecycle and benefits")
    pos_sales_mgr = JobPosition(title="Sales Manager", department_id=sales_dept.id, description="Leads business expansion and key client relations")
    pos_sales_rep = JobPosition(title="Account Executive", department_id=sales_dept.id, description="Drives sales pipeline and client onboarding")
    pos_sys_admin = JobPosition(title="System Administrator", department_id=eng_dept.id, description="System administration and security")

    db.session.add_all([pos_eng_lead, pos_eng_dev, pos_hr_mgr, pos_sales_mgr, pos_sales_rep, pos_sys_admin])
    db.session.commit()

    # 3. Create Leave Types
    lt_annual = LeaveType(name="Annual Leave", default_days_per_year=20, description="Paid annual vacation time")
    lt_sick = LeaveType(name="Sick Leave", default_days_per_year=10, description="Paid medical and health recovery leave")
    lt_casual = LeaveType(name="Casual Leave", default_days_per_year=5, description="Short-term unexpected personal leave")
    lt_parental = LeaveType(name="Parental Leave", default_days_per_year=30, description="Maternity and paternity leave allocation")

    db.session.add_all([lt_annual, lt_sick, lt_casual, lt_parental])
    db.session.commit()

    # 4. Create Users & Employees
    default_password = "password123"

    # User 1: Admin
    u_admin = User(email="admin@hrms.com", role=UserRole.ADMIN)
    u_admin.set_password(default_password)
    db.session.add(u_admin)
    db.session.commit()

    e_admin = Employee(
        user_id=u_admin.id,
        employee_code="EMP-001",
        first_name="Alice",
        last_name="Administrator",
        email="admin@hrms.com",
        phone="+1 (555) 010-0001",
        address="100 Enterprise Way, Suite 400, San Francisco, CA",
        emergency_contact_name="Bob Admin",
        emergency_contact_phone="+1 (555) 010-9999",
        department_id=eng_dept.id,
        position_id=pos_sys_admin.id,
        employment_status=EmploymentStatus.FULL_TIME,
        hire_date=datetime(2022, 1, 15).date(),
        salary=120000.0,
        national_id="SSN-998877661"
    )
    db.session.add(e_admin)
    db.session.commit()

    # User 2: HR Staff
    u_hr = User(email="hr@hrms.com", role=UserRole.HR_STAFF)
    u_hr.set_password(default_password)
    db.session.add(u_hr)
    db.session.commit()

    e_hr = Employee(
        user_id=u_hr.id,
        employee_code="EMP-002",
        first_name="Hannah",
        last_name="Richards",
        email="hr@hrms.com",
        phone="+1 (555) 010-0002",
        address="250 Culture Blvd, Oakland, CA",
        emergency_contact_name="James Richards",
        emergency_contact_phone="+1 (555) 010-8888",
        department_id=hr_dept.id,
        position_id=pos_hr_mgr.id,
        employment_status=EmploymentStatus.FULL_TIME,
        hire_date=datetime(2022, 3, 1).date(),
        salary=85000.0,
        national_id="SSN-998877662"
    )
    db.session.add(e_hr)
    db.session.commit()

    # User 3: Engineering Manager
    u_mgr_tech = User(email="manager.tech@hrms.com", role=UserRole.MANAGER)
    u_mgr_tech.set_password(default_password)
    db.session.add(u_mgr_tech)
    db.session.commit()

    e_mgr_tech = Employee(
        user_id=u_mgr_tech.id,
        employee_code="EMP-003",
        first_name="Marcus",
        last_name="Vance",
        email="manager.tech@hrms.com",
        phone="+1 (555) 010-0003",
        address="789 Innovation Ave, San Jose, CA",
        emergency_contact_name="Clara Vance",
        emergency_contact_phone="+1 (555) 010-7777",
        department_id=eng_dept.id,
        position_id=pos_eng_lead.id,
        employment_status=EmploymentStatus.FULL_TIME,
        hire_date=datetime(2021, 6, 15).date(),
        salary=135000.0,
        national_id="SSN-998877663"
    )
    db.session.add(e_mgr_tech)
    db.session.commit()
    eng_dept.manager_id = e_mgr_tech.id
    db.session.commit()

    # User 4: Sales Manager
    u_mgr_sales = User(email="manager.sales@hrms.com", role=UserRole.MANAGER)
    u_mgr_sales.set_password(default_password)
    db.session.add(u_mgr_sales)
    db.session.commit()

    e_mgr_sales = Employee(
        user_id=u_mgr_sales.id,
        employee_code="EMP-004",
        first_name="Sophia",
        last_name="Martinez",
        email="manager.sales@hrms.com",
        phone="+1 (555) 010-0004",
        address="432 Commerce Rd, San Francisco, CA",
        emergency_contact_name="David Martinez",
        emergency_contact_phone="+1 (555) 010-6666",
        department_id=sales_dept.id,
        position_id=pos_sales_mgr.id,
        employment_status=EmploymentStatus.FULL_TIME,
        hire_date=datetime(2021, 9, 1).date(),
        salary=110000.0,
        national_id="SSN-998877664"
    )
    db.session.add(e_mgr_sales)
    db.session.commit()
    sales_dept.manager_id = e_mgr_sales.id
    db.session.commit()

    # User 5 & 6: Engineering Employees (reporting to Marcus Vance)
    u_emp1 = User(email="emp1@hrms.com", role=UserRole.EMPLOYEE)
    u_emp1.set_password(default_password)
    db.session.add(u_emp1)
    db.session.commit()

    e_emp1 = Employee(
        user_id=u_emp1.id,
        employee_code="EMP-005",
        first_name="David",
        last_name="Chen",
        email="emp1@hrms.com",
        phone="+1 (555) 010-0005",
        address="12 Tech Lane, Palo Alto, CA",
        emergency_contact_name="Sarah Chen",
        emergency_contact_phone="+1 (555) 010-5555",
        department_id=eng_dept.id,
        position_id=pos_eng_dev.id,
        manager_id=e_mgr_tech.id,
        employment_status=EmploymentStatus.FULL_TIME,
        hire_date=datetime(2023, 2, 10).date(),
        salary=95000.0,
        national_id="SSN-998877665"
    )
    db.session.add(e_emp1)

    u_emp2 = User(email="emp2@hrms.com", role=UserRole.EMPLOYEE)
    u_emp2.set_password(default_password)
    db.session.add(u_emp2)
    db.session.commit()

    e_emp2 = Employee(
        user_id=u_emp2.id,
        employee_code="EMP-006",
        first_name="Emily",
        last_name="Taylor",
        email="emp2@hrms.com",
        phone="+1 (555) 010-0006",
        address="55 Code St, Mountain View, CA",
        emergency_contact_name="Mark Taylor",
        emergency_contact_phone="+1 (555) 010-4444",
        department_id=eng_dept.id,
        position_id=pos_eng_dev.id,
        manager_id=e_mgr_tech.id,
        employment_status=EmploymentStatus.FULL_TIME,
        hire_date=datetime(2023, 5, 20).date(),
        salary=92000.0,
        national_id="SSN-998877666"
    )
    db.session.add(e_emp2)
    db.session.commit()

    # User 7 & 8: Sales Employees (reporting to Sophia Martinez)
    u_emp3 = User(email="emp3@hrms.com", role=UserRole.EMPLOYEE)
    u_emp3.set_password(default_password)
    db.session.add(u_emp3)
    db.session.commit()

    e_emp3 = Employee(
        user_id=u_emp3.id,
        employee_code="EMP-007",
        first_name="Jordan",
        last_name="Lee",
        email="emp3@hrms.com",
        phone="+1 (555) 010-0007",
        address="88 Market St, San Francisco, CA",
        emergency_contact_name="Grace Lee",
        emergency_contact_phone="+1 (555) 010-3333",
        department_id=sales_dept.id,
        position_id=pos_sales_rep.id,
        manager_id=e_mgr_sales.id,
        employment_status=EmploymentStatus.FULL_TIME,
        hire_date=datetime(2023, 8, 1).date(),
        salary=75000.0,
        national_id="SSN-998877667"
    )
    db.session.add(e_emp3)

    u_emp4 = User(email="emp4@hrms.com", role=UserRole.EMPLOYEE)
    u_emp4.set_password(default_password)
    db.session.add(u_emp4)
    db.session.commit()

    e_emp4 = Employee(
        user_id=u_emp4.id,
        employee_code="EMP-008",
        first_name="Rachel",
        last_name="Green",
        email="emp4@hrms.com",
        phone="+1 (555) 010-0008",
        address="304 Pine St, San Francisco, CA",
        emergency_contact_name="Monica Geller",
        emergency_contact_phone="+1 (555) 010-2222",
        department_id=sales_dept.id,
        position_id=pos_sales_rep.id,
        manager_id=e_mgr_sales.id,
        employment_status=EmploymentStatus.PART_TIME,
        hire_date=datetime(2024, 1, 15).date(),
        salary=50000.0,
        national_id="SSN-998877668"
    )
    db.session.add(e_emp4)
    db.session.commit()

    # 5. Leave Balances for all employees
    all_employees = [e_admin, e_hr, e_mgr_tech, e_mgr_sales, e_emp1, e_emp2, e_emp3, e_emp4]
    all_leave_types = [lt_annual, lt_sick, lt_casual, lt_parental]
    current_year = datetime.utcnow().year

    for emp in all_employees:
        for lt in all_leave_types:
            lb = LeaveBalance(
                employee_id=emp.id,
                leave_type_id=lt.id,
                year=current_year,
                allocated_days=lt.default_days_per_year,
                used_days=3 if lt.id == lt_annual.id and emp.id in [e_emp1.id, e_emp3.id] else 0
            )
            db.session.add(lb)
    db.session.commit()

    # 6. Sample Leave Requests
    lr1 = LeaveRequest(
        employee_id=e_emp1.id,
        leave_type_id=lt_annual.id,
        start_date=(datetime.utcnow() + timedelta(days=5)).date(),
        end_date=(datetime.utcnow() + timedelta(days=7)).date(),
        reason="Family vacation trip",
        status=LeaveStatus.PENDING
    )
    lr2 = LeaveRequest(
        employee_id=e_emp2.id,
        leave_type_id=lt_sick.id,
        start_date=(datetime.utcnow() - timedelta(days=10)).date(),
        end_date=(datetime.utcnow() - timedelta(days=9)).date(),
        reason="Flu recovery and doctor appointment",
        status=LeaveStatus.APPROVED,
        reviewer_id=e_mgr_tech.id,
        reviewer_comment="Approved. Rest well."
    )
    lr3 = LeaveRequest(
        employee_id=e_emp3.id,
        leave_type_id=lt_casual.id,
        start_date=(datetime.utcnow() + timedelta(days=12)).date(),
        end_date=(datetime.utcnow() + timedelta(days=12)).date(),
        reason="Personal errands",
        status=LeaveStatus.PENDING
    )

    db.session.add_all([lr1, lr2, lr3])
    db.session.commit()

    # 7. Sample Attendance Records for past 7 days
    today = datetime.utcnow().date()
    for emp in all_employees:
        for i in range(1, 8):
            past_date = today - timedelta(days=i)
            # Skip weekends for realistic data
            if past_date.weekday() in [5, 6]:
                continue
            
            c_in = datetime.combine(past_date, datetime.min.time()).replace(hour=9, minute=0)
            c_out = datetime.combine(past_date, datetime.min.time()).replace(hour=17, minute=30)
            
            att = AttendanceRecord(
                employee_id=emp.id,
                date=past_date,
                clock_in=c_in,
                clock_out=c_out,
                total_hours=8.5,
                status=AttendanceStatus.PRESENT
            )
            db.session.add(att)

        # Active clock-in for today for half employees
        if emp.id % 2 == 1:
            att_today = AttendanceRecord(
                employee_id=emp.id,
                date=today,
                clock_in=datetime.utcnow().replace(hour=8, minute=55),
                status=AttendanceStatus.PRESENT
            )
            db.session.add(att_today)

    db.session.commit()

    # 8. Sample Notifications
    n1 = Notification(
        user_id=u_emp1.id,
        title="Welcome to HRMS",
        message="Your employee portal is active. Check your profile and submit leave requests easily.",
        type="info"
    )
    n2 = Notification(
        user_id=u_mgr_tech.id,
        title="Pending Leave Request",
        message="David Chen submitted a 3-day Annual Leave request requiring your review.",
        type="warning"
    )
    db.session.add_all([n1, n2])

    # 9. Audit log entry
    log_audit("SEED_DATABASE", "System", target_id="1", details="Initialized HRMS database with default seed data")
    print("Database seeding completed successfully!")
