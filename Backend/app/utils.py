from flask_jwt_extended import get_jwt_identity
from functools import wraps
from flask import jsonify
from app.models import User

def role_required(required_role):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            user_id = get_jwt_identity()
            if not user_id:
                return jsonify({"error": "Authentication required"}), 401

            current_user = User.query.get(user_id)
            if not current_user or current_user.role != required_role:
                return jsonify({"error": "Access forbidden"}), 403

            return fn(*args, **kwargs)
        return decorator
    return wrapper

