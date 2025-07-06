import os

class Config:
    SECRET_KEY = "your-secret-key"
    SQLALCHEMY_DATABASE_URI = "sqlite:///dev.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:" 
    
config_dict = {
    'default': Config,
    'testing': TestingConfig
}