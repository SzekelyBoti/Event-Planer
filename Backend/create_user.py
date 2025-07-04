import sys
from app import create_app, db
from app.models import User

app = create_app()
app.app_context().push()

def create_user(username, email, password, role='user'):
    if User.query.filter((User.username == username) | (User.email == email)).first():
        print("User already exists!")
        return
    user = User(username=username, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    print(f"User '{username}' created successfully with role '{role}'.")

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("Usage: python create_user.py <username> <email> <password> [role]")
    else:
        role = sys.argv[4] if len(sys.argv) > 4 else 'user'
        create_user(sys.argv[1], sys.argv[2], sys.argv[3], role)
