import os

db_url = os.environ.get('DATABASE_URL')
if db_url:
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
    if 'sslmode' not in db_url and 'postgresql://' in db_url:
        separator = '&' if '?' in db_url else '?'
        db_url = f"{db_url}{separator}sslmode=require"

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'hrms-super-secret-key-2026-production-grade')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'hrms-jwt-secret-key-secure-token-2026')
    SQLALCHEMY_DATABASE_URI = db_url or ('sqlite:///' + os.path.join(os.path.abspath(os.path.dirname(__file__)), '../hrms.db'))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours in seconds

