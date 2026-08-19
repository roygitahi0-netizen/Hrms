import os
import pytest
from app import create_app
from app.extensions import db
from app.models.user import User, UserRole
from app.models.leave import LeaveStatus
from app.utils.seed import seed_database

TEST_DB_PATH = os.path.join(os.path.dirname(__file__), 'test_teamhub_temp.db')

class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{TEST_DB_PATH}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = 'test-secret-key'
    JWT_SECRET_KEY = 'test-jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = 86400

@pytest.fixture(scope='session')
def app():
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except Exception:
            pass

    app = create_app(TestConfig)

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

def test_user_registration_with_department(client):
    # Registration with Department
    reg_data = {
        'first_name': 'Sarah',
        'last_name': 'Connor',
        'email': 'sarah@teamhub.com',
        'password': 'Password123',
        'department_id': 1, # Engineering
        'phone': '+15550199',
        'country': 'United States'
    }
    res = client.post('/api/auth/register', json=reg_data)
    assert res.status_code == 201
    assert res.json['success'] is True
    assert res.json['user']['role'] == UserRole.EMPLOYEE # Auto-assigned
    assert res.json['user']['employee']['department_id'] == 1

def test_admin_eligibility_control(client):
    admin_token = get_auth_token(client, 'admin@teamhub.com', 'admin123')

    # Register employee
    reg_res = client.post('/api/auth/register', json={
        'first_name': 'John',
        'last_name': 'Doe',
        'email': 'johndoe@teamhub.com',
        'password': 'Password123',
        'department_id': 2, # HR
        'phone': '+44207946',
        'country': 'United Kingdom'
    })
    user_id = reg_res.json['user']['id']

    # Admin lists all users & eligibility status
    users_res = client.get('/api/auth/users', headers={'Authorization': f'Bearer {admin_token}'})
    assert users_res.status_code == 200
    assert len(users_res.json['users']) >= 2

    # Admin deactivates John Doe -> login gets blocked with 403
    client.put(f'/api/auth/users/{user_id}/eligibility', json={'is_active': False}, headers={'Authorization': f'Bearer {admin_token}'})

    blocked_res = client.post('/api/auth/login', json={'email': 'johndoe@teamhub.com', 'password': 'Password123'})
    assert blocked_res.status_code == 403
    assert 'eligibility' in blocked_res.json['message'] or 'deactivated' in blocked_res.json['message']

    # Admin reactivates John Doe & promotes him to MANAGER
    promote_res = client.put(f'/api/auth/users/{user_id}/eligibility', json={'is_active': True, 'role': UserRole.MANAGER}, headers={'Authorization': f'Bearer {admin_token}'})
    assert promote_res.status_code == 200
    assert promote_res.json['user']['role'] == UserRole.MANAGER

    # Login now succeeds as MANAGER
    login_res = client.post('/api/auth/login', json={'email': 'johndoe@teamhub.com', 'password': 'Password123'})
    assert login_res.status_code == 200
    assert login_res.json['user']['role'] == UserRole.MANAGER

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

def test_forgot_and_reset_password(client):
    # Request reset link
    forgot_res = client.post('/api/auth/forgot-password', json={'email': 'admin@teamhub.com'})
    assert forgot_res.status_code == 200
    assert 'token' in forgot_res.json
    token = forgot_res.json['token']

    # Reset password
    reset_res = client.post('/api/auth/reset-password', json={'token': token, 'password': 'NewPassword123'})
    assert reset_res.status_code == 200
    assert reset_res.json['success'] is True

    # Test login with new password
    login_res = client.post('/api/auth/login', json={'email': 'admin@teamhub.com', 'password': 'NewPassword123'})
    assert login_res.status_code == 200

    # Reset back to original password for other tests
    token2 = client.post('/api/auth/forgot-password', json={'email': 'admin@teamhub.com'}).json['token']
    client.post('/api/auth/reset-password', json={'token': token2, 'password': 'admin123'})

