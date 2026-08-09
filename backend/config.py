 
import os
from dotenv import load_dotenv

# Load the .env file
load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-dev-key')
    SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:FSD2026@localhost/freight_db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    