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
    SQLALCHEMY_DATABASE_URI = 'sqlite://'
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

def test_leave_validation_and_security(client):
    # Login as admin
    admin_res = client.post('/api/auth/login', json={'email': 'admin@teamhub.com', 'password': 'admin123'})
    token = admin_res.json['token']

    # 1. Missing required fields
    invalid_res = client.post('/api/leaves', json={'reason': ''}, headers={'Authorization': f'Bearer {token}'})
    assert invalid_res.status_code == 400
    assert 'required' in invalid_res.json['message'].lower()

    # 2. Invalid date format
    bad_date_res = client.post('/api/leaves', json={
        'leave_type_id': 1,
        'start_date': 'invalid-date',
        'end_date': '2026-08-20',
        'reason': 'Vacation'
    }, headers={'Authorization': f'Bearer {token}'})
    assert bad_date_res.status_code == 400
    assert 'invalid date' in bad_date_res.json['message'].lower()

    # 3. Invalid Leave Category ID
    bad_cat_res = client.post('/api/leaves', json={
        'leave_type_id': 99999,
        'start_date': '2026-08-20',
        'end_date': '2026-08-21',
        'reason': 'Vacation'
    }, headers={'Authorization': f'Bearer {token}'})
    assert bad_cat_res.status_code == 400
    assert 'does not exist' in bad_cat_res.json['message'].lower()
def test_admin_direct_password_reset(client):
    # 1. Login as Admin
    admin_login = client.post('/api/auth/login', json={'email': 'admin@teamhub.com', 'password': 'admin123'})
    admin_token = admin_login.json['token']
    headers = {'Authorization': f'Bearer {admin_token}'}

    # 2. Register a new user
    reg_res = client.post('/api/auth/register', json={
        'email': 'target_user@teamhub.com',
        'password': 'OldPass123',
        'first_name': 'Target',
        'last_name': 'Employee',
        'department_id': 1
    })
    assert reg_res.status_code == 201
    user_id = reg_res.json['user']['id']

    # 3. Test Remote IP Restriction (Blocked with 403 when request comes from public IP)
    remote_headers = {'Authorization': f'Bearer {admin_token}', 'X-Forwarded-For': '203.0.113.195'}
    remote_reset = client.put(f'/api/auth/users/{user_id}/reset-password', json={
        'new_password': 'AdminAssigned123'
    }, headers=remote_headers)
    assert remote_reset.status_code == 403
    assert 'restricted to local machine' in remote_reset.json['message'].lower()

    # 4. Test invalid password payload on local request (rejected by Marshmallow schema)
    invalid_reset = client.put(f'/api/auth/users/{user_id}/reset-password', json={
        'new_password': 'short' # Missing digits and length < 6
    }, headers=headers)
    assert invalid_reset.status_code == 400

    # 5. Admin resets target user's password from local machine (127.0.0.1) with valid payload
    valid_reset = client.put(f'/api/auth/users/{user_id}/reset-password', json={
        'new_password': 'AdminAssigned123'
    }, headers=headers)
    assert valid_reset.status_code == 200
    assert valid_reset.json['success'] is True

    # 6. Verify target user can now log in with the new password
    user_login = client.post('/api/auth/login', json={
        'email': 'target_user@teamhub.com',
        'password': 'AdminAssigned123'
    })
    assert user_login.status_code == 200
    assert user_login.json['success'] is True

def test_report_exports_and_local_file_saving(client):
    admin_login = client.post('/api/auth/login', json={'email': 'admin@teamhub.com', 'password': 'admin123'})
    admin_token = admin_login.json['token']
    headers = {'Authorization': f'Bearer {admin_token}'}

    # 1. Standard CSV File Download
    csv_res = client.get('/api/reports/export/leave-csv', headers=headers)
    assert csv_res.status_code == 200
    assert csv_res.mimetype == 'text/csv'

    # 2. Local File Save Trigger (save_local=true)
    local_res = client.get('/api/reports/export/leave-csv?save_local=true', headers=headers)
    assert local_res.status_code == 200
    assert local_res.json['success'] is True
    assert 'file_path' in local_res.json
    import os
    assert os.path.exists(local_res.json['file_path'])

    # 3. Employee CSV export
    emp_res = client.get('/api/reports/export/employee-csv?save_local=true', headers=headers)
    assert emp_res.status_code == 200
    assert emp_res.json['success'] is True
    assert os.path.exists(emp_res.json['file_path'])
