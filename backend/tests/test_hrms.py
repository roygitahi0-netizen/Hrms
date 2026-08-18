import os
import pytest
from app import create_app
from app.extensions import db
from app.models.user import User, UserRole
from app.models.leave import LeaveStatus
from app.utils.seed import seed_database

TEST_DB_PATH = os.path.join(os.path.dirname(__file__), 'test_hrms_temp.db')

@pytest.fixture(scope='session')
def app():
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except Exception:
            pass

    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{TEST_DB_PATH}'

    with app.app_context():
        db.create_all()
        seed_database()

    yield app

    with app.app_context():
        db.session.remove()
        db.drop_all()

    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except Exception:
            pass

@pytest.fixture
def client(app):
    return app.test_client()

def get_auth_token(client, email, password="password123"):
    res = client.post('/api/auth/login', json={'email': email, 'password': password})
    assert res.status_code == 200, f"Login failed for {email}: {res.json}"
    return res.json['token']

def test_auth_login(client):
    res = client.post('/api/auth/login', json={'email': 'admin@hrms.com', 'password': 'password123'})
    assert res.status_code == 200
    assert res.json['success'] is True
    assert 'token' in res.json
    assert res.json['user']['role'] == UserRole.ADMIN

def test_rbac_sensitive_field_redaction(client):
    admin_token = get_auth_token(client, 'admin@hrms.com')
    emp_token = get_auth_token(client, 'emp1@hrms.com')

    # Admin listing employees -> includes sensitive salary and national_id
    res_admin = client.get('/api/employees', headers={'Authorization': f'Bearer {admin_token}'})
    assert res_admin.status_code == 200
    assert 'salary' in res_admin.json['employees'][0]

    # Employee listing employees -> sensitive fields redacted
    res_emp = client.get('/api/employees', headers={'Authorization': f'Bearer {emp_token}'})
    assert res_emp.status_code == 200
    assert 'salary' not in res_emp.json['employees'][0]

def test_employee_creation_and_soft_delete(client):
    admin_token = get_auth_token(client, 'admin@hrms.com')

    new_emp_data = {
        'first_name': 'UniqueTest',
        'last_name': 'User',
        'email': 'uniquetest99@hrms.com',
        'role': UserRole.EMPLOYEE,
        'salary': 75000.0,
        'national_id': 'SSN-000111222'
    }

    create_res = client.post('/api/employees', json=new_emp_data, headers={'Authorization': f'Bearer {admin_token}'})
    assert create_res.status_code == 201, f"Failed to create employee: {create_res.json}"
    emp_id = create_res.json['employee']['id']

    # Soft delete
    del_res = client.delete(f'/api/employees/{emp_id}', headers={'Authorization': f'Bearer {admin_token}'})
    assert del_res.status_code == 200

    # Verify soft deleted employee not in active list
    get_res = client.get(f'/api/employees/{emp_id}', headers={'Authorization': f'Bearer {admin_token}'})
    assert get_res.status_code == 404

def test_leave_workflow(client):
    emp_token = get_auth_token(client, 'emp1@hrms.com')
    mgr_token = get_auth_token(client, 'manager.tech@hrms.com')

    # Submit leave request
    leave_data = {
        'leave_type_id': 1,
        'start_date': '2026-11-01',
        'end_date': '2026-11-03',
        'reason': 'Vacation trip'
    }
    sub_res = client.post('/api/leaves', json=leave_data, headers={'Authorization': f'Bearer {emp_token}'})
    assert sub_res.status_code == 201, f"Failed leave submission: {sub_res.json}"
    req_id = sub_res.json['leave_request']['id']

    # Manager approves
    app_res = client.put(f'/api/leaves/{req_id}/status', json={'status': LeaveStatus.APPROVED, 'comment': 'Approved by manager'}, headers={'Authorization': f'Bearer {mgr_token}'})
    assert app_res.status_code == 200
    assert app_res.json['leave_request']['status'] == LeaveStatus.APPROVED

def test_attendance_clock_in_out(client):
    emp_token = get_auth_token(client, 'emp4@hrms.com')

    # Clock in (if not already clocked in)
    in_res = client.post('/api/attendance/clock-in', headers={'Authorization': f'Bearer {emp_token}'})
    assert in_res.status_code in [200, 400], f"Clock-in failed: {in_res.json}"

    # Clock out
    out_res = client.post('/api/attendance/clock-out', headers={'Authorization': f'Bearer {emp_token}'})
    assert out_res.status_code == 200, f"Clock-out failed: {out_res.json}"
    assert out_res.json['attendance']['clock_out'] is not None
