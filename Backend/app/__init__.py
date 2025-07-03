import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///eventplanner.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = '1234'

    db.init_app(app)

    from app.routes import bp as events_bp
    app.register_blueprint(events_bp)

    with app.app_context():
        if not os.path.exists('eventplanner.db'):
            from app.models import User, Event
            db.create_all()

    return app


