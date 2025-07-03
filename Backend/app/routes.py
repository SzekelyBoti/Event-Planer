from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token , jwt_required, get_jwt_identity
from datetime import datetime
from flask import url_for
from app.models import User, Event
from app import db

bp = Blueprint('api', __name__, url_prefix='/api')

@bp.route('/events', methods=['POST'])
@jwt_required()
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

    access_token = create_access_token(identity=user.id)

    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
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
    reset_url = url_for('api.password_reset', token=token, _external=True)

    # TODO: send reset_url via email here (using an email library like Flask-Mail)
    print(f"Password reset link (send this by email): {reset_url}")

    return jsonify({"message": "If your email is registered, you'll receive a password reset link."}), 200

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
