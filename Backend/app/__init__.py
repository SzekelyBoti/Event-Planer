from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_mail import Mail
import os
from flask_cors import CORS

db = SQLAlchemy()
mail = Mail()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///eventplanner.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-key')

    app.config['MAIL_DEFAULT_SENDER'] = 'noreply@yourdomain.com'
    app.config['MAIL_SERVER'] = 'localhost'
    app.config['MAIL_PORT'] = 1025
    app.config['MAIL_USE_TLS'] = False
    app.config['MAIL_USE_SSL'] = False
    app.config['MAIL_USERNAME'] = None
    app.config['MAIL_PASSWORD'] = None

    CORS(app, supports_credentials=True, expose_headers=['Authorization'], allow_headers=['Authorization', 'Content-Type'])

    db.init_app(app)
    mail.init_app(app)

    jwt = JWTManager(app)

    @jwt.unauthorized_loader
    def unauthorized_response(err_str):
        return jsonify({"error": "Missing or invalid Authorization header"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(err_str):
        return jsonify({"error": "Invalid token: " + err_str}), 422

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"error": "Token has expired"}), 401

    from app.routes import bp as events_bp
    app.register_blueprint(events_bp)

    with app.app_context():
        if not os.path.exists('eventplanner.db'):
            from app.models import User, Event, HelpRequest
            db.create_all()

    return app


