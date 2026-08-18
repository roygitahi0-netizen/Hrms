import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'hrms-super-secret-key-2026-production-grade')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'hrms-jwt-secret-key-secure-token-2026')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///' + os.path.join(os.path.abspath(os.path.dirname(__file__)), '../hrms.db'))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours in seconds
