from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token , jwt_required, get_jwt_identity
from datetime import datetime
from flask import url_for
from flask_mail import Message
from app.models import User, Event , HelpRequest
from app import db , mail
from app.utils import role_required

bp = Blueprint('api', __name__, url_prefix='/api')

@bp.route('/events', methods=['POST'])
@jwt_required()
@role_required('user')
def create_event():
    user_id = get_jwt_identity()
    data = request.get_json()
    title = data.get('title')
    occurrence_str = data.get('occurrence')
    description = data.get('description')

    if not title or not occurrence_str:
        return jsonify({"error": "Title and occurrence are required"}), 400

    try:
        occurrence = datetime.fromisoformat(occurrence_str)
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    event = Event(title=title, occurrence=occurrence, description=description, user_id=user_id)
    db.session.add(event)
    db.session.commit()

    return jsonify({
        "id": event.id,
        "title": event.title,
        "occurrence": event.occurrence.isoformat(),
        "description": event.description
    }), 201

@bp.route('/events', methods=['GET'])
@jwt_required()
@role_required('user')
def list_events():
    user_id = get_jwt_identity()
    events = Event.query.filter_by(user_id=user_id).all()
    events_list = [{
        "id": e.id,
        "title": e.title,
        "occurrence": e.occurrence.isoformat(),
        "description": e.description
    } for e in events]

    return jsonify(events_list)

@bp.route('/events/<int:event_id>', methods=['PATCH'])
@jwt_required()
@role_required('user')
def update_event(event_id):
    user_id = get_jwt_identity()
    event = Event.query.filter_by(id=event_id, user_id=user_id).first()
    if not event:
        return jsonify({"error": "Event not found"}), 404

    data = request.get_json()
    description = data.get("description")
    if description is not None:
        event.description = description
    event.description = description
    db.session.commit()
    return jsonify({
        "id": event.id,
        "description": event.description
    }), 200

@bp.route('/events/<int:event_id>', methods=['DELETE'])
@jwt_required()
@role_required('user')
def delete_event(event_id):
    user_id = get_jwt_identity()
    event = Event.query.filter_by(id=event_id, user_id=user_id).first()
    if not event:
        return jsonify({"error": "Event not found"}), 404

    db.session.delete(event)
    db.session.commit()
    return '', 204

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid username or password"}), 401

    if user.mfa_enabled:
        import random
        from datetime import datetime, timedelta

        code = str(random.randint(100000, 999999))
        user.mfa_code = code
        user.mfa_expiry = datetime.utcnow() + timedelta(minutes=5)
        db.session.commit()

        msg = Message(
            subject="Your MFA Code",
            recipients=[user.email],
            body=f"Your MFA code is: {code}. It will expire in 5 minutes."
        )
        mail.send(msg)

        return jsonify({
            "mfa_required": True,
            "user_id": user.id
        }), 200

    # No MFA, normal login
    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    }), 200


@bp.route('/mfa-verify', methods=['POST'])
def mfa_verify():
    data = request.get_json()
    user_id = data.get('user_id')
    code = data.get('code')

    user = User.query.get(user_id)
    if not user or user.mfa_code != code:
        return jsonify({"error": "Invalid MFA code"}), 401

    if datetime.utcnow() > user.mfa_expiry:
        return jsonify({"error": "MFA code expired"}), 401

    user.mfa_code = None
    user.mfa_expiry = None
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    }), 200

@bp.route('/password-reset-request', methods=['POST'])
def password_reset_request():
    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "If your email is registered, you'll receive a password reset link."}), 200

    token = user.get_reset_token()
    frontend_reset_url = f"http://localhost:5173/password-reset/{token}"

    msg = Message(
        subject="Password Reset Request",
        recipients=[email],
        body=f"To reset your password, visit the following link:\n{frontend_reset_url}\n\n"
             "If you did not request a password reset, please ignore this email."
    )
    mail.send(msg)

    return jsonify({"message": "If your email is registered, you'll receive a password reset link."}), 200

@bp.route('/password-reset/<token>', methods=['GET'])
def verify_token(token):
    user = User.verify_reset_token(token)
    if not user:
        return jsonify({"error": "Invalid or expired token"}), 400
    return jsonify({"message": "Token is valid"}), 200

@bp.route('/password-reset/<token>', methods=['POST'])
def password_reset(token):
    user = User.verify_reset_token(token)
    if not user:
        return jsonify({"error": "Invalid or expired token"}), 400

    data = request.get_json()
    new_password = data.get('password')
    if not new_password:
        return jsonify({"error": "Password is required"}), 400

    user.set_password(new_password)
    db.session.commit()

    return jsonify({"message": "Your password has been updated"}), 200


@bp.route('/helpdesk/submit', methods=['POST'])
@jwt_required()
@role_required('user')
def submit_help_request():
    data = request.get_json()
    message = data.get('message')
    if not message:
        return jsonify({'error': 'Message is required'}), 400
    user_id = get_jwt_identity()
    help_request = HelpRequest(user_id=user_id, message=message)
    db.session.add(help_request)
    db.session.commit()
    return jsonify({'message': 'Request submitted'}), 201

@bp.route('/helpdesk/requests', methods=['GET'])
@jwt_required()
def view_help_requests():
    requests = HelpRequest.query.all()
    print(f"Found {len(requests)} help requests")

    return jsonify([{
        'id': req.id,
        'user_id': req.user_id,
        'user_email': req.user.email if req.user else None,
        'message': req.message,
        'response': req.response
    } for req in requests]), 200


@bp.route('/helpdesk/respond/<int:request_id>', methods=['POST'])
@jwt_required()
@role_required('helpdesk')
def respond_to_help_request(request_id):
    data = request.get_json()
    response = data.get('response')
    req = HelpRequest.query.get_or_404(request_id)
    req.response = response
    db.session.commit()
    return jsonify({'message': 'Response sent'}), 200
