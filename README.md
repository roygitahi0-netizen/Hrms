# Pulse HRMS - Human Resource Management System

Centralized, secure, role-aware web application for small and medium-sized organizations to streamline core HR operations, employee records, leave approvals, attendance tracking, and audit logging.

## Tech Stack

- **Backend**: Python 3, Flask REST API, SQLAlchemy ORM, PyJWT, Werkzeug, Flask-CORS, Pytest.
- **Database**: SQLite (default zero-dependency out of the box) / PostgreSQL (via `DATABASE_URL` env variable).
- **Frontend**: React (Vite), Redux Toolkit (`@reduxjs/toolkit`), React Router DOM v6, Lucide Icons, Axios.
- **Styling**: Custom Modern Glassmorphic CSS system with dark luxury theme tokens and responsive layouts.

---

## Key Features

1. **Role-Based Access Control (RBAC)**:
   - **Admin**: Full system management, user role assignment, department creation, full CRUD on employees, system audit log inspection.
   - **HR Staff**: Employee onboarding, leave type management, organization-wide leave approvals, attendance & headcount report exports.
   - **Manager**: Team roster overview, direct report leave request approval/rejection queue, team leave calendar, team attendance summary.
   - **Employee**: Self-service profile updates (phone, address, emergency contacts), leave request submissions & remaining balance gauges, daily clock-in / clock-out attendance tracking.
2. **Sensitive Data Redaction**:
   - Salary and National ID / SSN fields are strictly redacted for non-authorized users.
3. **Leave Management Workflow**:
   - Submit leave requests with automatic balance deduction on approval.
4. **Attendance Tracking**:
   - Real-time clock in and clock out controls with duration calculation and LATE/HALF_DAY status detection.
5. **CSV Exporting & Reporting**:
   - Downloadable CSV reports for attendance logs and leave request history.
6. **Audit Logging**:
   - Every write operation (creations, edits, soft deletes, leave status updates, clocking) is stored with actor email, role, IP address, and timestamp.

---

## Quick Start Guide

### 1. Run Backend Server (Flask REST API)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```

- Flask API runs on `http://localhost:5000`
- Database is automatically initialized & seeded with 8 sample users across all 4 roles.

### 2. Run Backend Unit Tests

```bash
cd backend
PYTHONPATH=. ./venv/bin/pytest tests/test_hrms.py
```

### 3. Run Frontend Server (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

- React SPA runs on `http://localhost:5173`

---

## Pre-seeded Demo Credentials

All pre-seeded demo accounts use the password: `password123`

| Role | Email | Password | Scope |
|---|---|---|---|
| **Admin** | `admin@hrms.com` | `password123` | Full system access, audit logs |
| **HR Staff** | `hr@hrms.com` | `password123` | Employee onboarding, leave approvals |
| **Tech Manager** | `manager.tech@hrms.com` | `password123` | Direct reports in Engineering |
| **Sales Manager** | `manager.sales@hrms.com` | `password123` | Direct reports in Sales |
| **Employee (Dev)** | `emp1@hrms.com` | `password123` | Self-service, time off requests |
| **Employee (Sales)**| `emp3@hrms.com` | `password123` | Self-service, clocking |

---

## Git Workflow & Branching Strategy

The repository follows clean git history practices:
- All features were developed on descriptive feature branches (`feature/backend-api-auth-rbac`, `feature/frontend-react-redux`).
- Branches were validated, merged into `main`, and deleted after PR validation.
