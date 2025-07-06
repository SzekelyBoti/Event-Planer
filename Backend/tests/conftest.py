import pytest
from app import create_app, db
from app.models import User, Event, HelpRequest
from flask_jwt_extended import create_access_token

@pytest.fixture(scope='session')
def test_app():
    app = create_app('testing')
    with app.app_context():
        yield app

@pytest.fixture(scope='session')
def test_client(test_app):
    return test_app.test_client()

@pytest.fixture(scope='function', autouse=True)
def setup_and_teardown(test_app):
    db.create_all()
    yield
    db.session.remove()
    db.drop_all()

@pytest.fixture
def create_user():
    def _create_user(username, email, password, role='user', mfa_enabled=False):
        user = User(username=username, email=email, role=role, mfa_enabled=mfa_enabled)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user
    return _create_user

@pytest.fixture
def access_token(create_user):
    def _access_token(username="user", email="user@test.com", password="password", role='user'):
        user = create_user(username, email, password, role)
        return create_access_token(identity=str(user.id))
    return _access_token

@pytest.fixture
def auth_header(access_token):
    def _auth_header(**kwargs):
        token = access_token(**kwargs)
        return {'Authorization': f'Bearer {token}'}
    return _auth_header


