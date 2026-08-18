import os
import pytest
from app import create_app
from app.extensions import db
from app.models.user import User, UserRole
from app.models.leave import LeaveStatus
from app.utils.seed import seed_database

TEST_DB_PATH = os.path.join(os.path.dirname(__file__), 'test_teamhub_temp.db')

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
        db.drop_all()
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

def get_auth_token(client, email="admin@teamhub.com", password="admin123"):
    res = client.post('/api/auth/login', json={'email': email, 'password': password})
    assert res.status_code == 200, f"Login failed for {email}: {res.json}"
    return res.json['token']

def test_auth_login_with_bcrypt(client):
    res = client.post('/api/auth/login', json={'email': 'admin@teamhub.com', 'password': 'admin123'})
    assert res.status_code == 200
    assert res.json['success'] is True
    assert 'token' in res.json
    assert res.json['user']['role'] == UserRole.ADMIN

def test_user_registration_with_marshmallow_validation(client):
    # Test 1: Invalid email format -> 400
    res_bad_email = client.post('/api/auth/register', json={
        'first_name': 'Sarah',
        'last_name': 'Connor',
        'email': 'not-an-email',
        'password': 'Password123',
        'role': UserRole.EMPLOYEE
    })
    assert res_bad_email.status_code == 400
    assert 'Invalid email' in res_bad_email.json['message']

    # Test 2: Weak password (no number) -> 400
    res_weak_pw = client.post('/api/auth/register', json={
        'first_name': 'Sarah',
        'last_name': 'Connor',
        'email': 'sarah@teamhub.com',
        'password': 'passwordonly',
        'role': UserRole.EMPLOYEE
    })
    assert res_weak_pw.status_code == 400
    assert 'must contain' in res_weak_pw.json['message']

    # Test 3: Valid registration with Phone & Country
    reg_data = {
        'first_name': 'Sarah',
        'last_name': 'Connor',
        'email': 'sarah@teamhub.com',
        'password': 'Password123',
        'phone': '+15550199',
        'country': 'United States',
        'role': UserRole.EMPLOYEE
    }
    res = client.post('/api/auth/register', json=reg_data)
    assert res.status_code == 201
    assert res.json['success'] is True
    assert res.json['user']['email'] == 'sarah@teamhub.com'
    assert res.json['user']['employee']['phone'] == '+15550199'
    assert res.json['user']['employee']['country'] == 'United States'

def test_rbac_sensitive_field_redaction(client):
    admin_token = get_auth_token(client, 'admin@teamhub.com', 'admin123')
    
    # Register a standard employee
    client.post('/api/auth/register', json={
        'first_name': 'John',
        'last_name': 'Doe',
        'email': 'johndoe@teamhub.com',
        'password': 'Password123',
        'phone': '+44207946',
        'country': 'United Kingdom',
        'role': UserRole.EMPLOYEE
    })
    emp_token = get_auth_token(client, 'johndoe@teamhub.com', 'Password123')

    # Admin listing employees -> includes sensitive salary and national_id
    res_admin = client.get('/api/employees', headers={'Authorization': f'Bearer {admin_token}'})
    assert res_admin.status_code == 200
    assert 'salary' in res_admin.json['employees'][0]

    # Employee listing employees -> sensitive fields redacted
    res_emp = client.get('/api/employees', headers={'Authorization': f'Bearer {emp_token}'})
    assert res_emp.status_code == 200
    assert 'salary' not in res_emp.json['employees'][0]

def test_leave_submission(client):
    emp_token = get_auth_token(client, 'johndoe@teamhub.com', 'Password123')

    # Submit leave request
    leave_data = {
        'leave_type_id': 1,
        'start_date': '2026-12-01',
        'end_date': '2026-12-05',
        'reason': 'Year end holiday'
    }
    sub_res = client.post('/api/leaves', json=leave_data, headers={'Authorization': f'Bearer {emp_token}'})
    assert sub_res.status_code == 201, f"Failed leave submission: {sub_res.json}"
    assert sub_res.json['leave_request']['total_days'] == 5

def test_attendance_clock_in_out(client):
    emp_token = get_auth_token(client, 'johndoe@teamhub.com', 'Password123')

    # Clock in
    in_res = client.post('/api/attendance/clock-in', headers={'Authorization': f'Bearer {emp_token}'})
    assert in_res.status_code == 200, f"Clock-in failed: {in_res.json}"

    # Clock out
    out_res = client.post('/api/attendance/clock-out', headers={'Authorization': f'Bearer {emp_token}'})
    assert out_res.status_code == 200, f"Clock-out failed: {out_res.json}"
    assert out_res.json['attendance']['clock_out'] is not None
