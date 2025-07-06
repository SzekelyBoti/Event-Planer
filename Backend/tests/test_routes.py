from datetime import datetime
from app.models import User
from app import db
from werkzeug.security import generate_password_hash

def test_create_event_success(test_client, auth_header):
    response = test_client.post('/api/events', json={
        'title': 'Meeting',
        'occurrence': datetime.utcnow().isoformat(),
        'description': 'Monthly meeting'
    }, headers=auth_header())
    assert response.status_code == 201
    data = response.get_json()
    assert data['title'] == 'Meeting'

def test_login_success(test_client):
    user = User(
        username='testuser',
        email='test@example.com',
        role='user',
        password_hash=generate_password_hash('password123'),
        mfa_enabled=False
    )
    db.session.add(user)
    db.session.commit()

    response = test_client.post('/api/login', json={
        'username': 'testuser',
        'password': 'password123'
    })

    assert response.status_code == 200
    data = response.get_json()
    assert 'access_token' in data
    assert data['user']['username'] == 'testuser'

def test_create_event_missing_fields(test_client, auth_header):
    response = test_client.post('/api/events', json={
        'occurrence': datetime.utcnow().isoformat()
    }, headers=auth_header())

    assert response.status_code == 400
    assert 'error' in response.get_json()

def test_update_event_not_found(test_client, auth_header):
    response = test_client.patch('/api/events/9999', json={
        'description': 'New description'
    }, headers=auth_header())

    assert response.status_code == 404
    assert 'error' in response.get_json()

def test_submit_help_request_no_message(test_client, auth_header):
    response = test_client.post('/api/helpdesk/submit', json={}, headers=auth_header())
    assert response.status_code == 400
    assert 'error' in response.get_json()
