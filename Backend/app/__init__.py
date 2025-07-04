from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_mail import Mail
import os

db = SQLAlchemy()
mail = Mail()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///eventplanner.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-key')

    app.config['MAIL_SERVER'] = 'localhost'
    app.config['MAIL_PORT'] = 8025

    db.init_app(app)
    JWTManager(app)
    mail.init_app(app)

    from app.routes import bp as events_bp
    app.register_blueprint(events_bp)

    with app.app_context():
        if not os.path.exists('eventplanner.db'):
            from app.models import User, Event, HelpRequest
            db.create_all()

    return app


