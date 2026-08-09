from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "http://localhost:4200"}})

    # Register blueprints later
    # from app.routes import shipment_bp, auth_bp
    # app.register_blueprint(shipment_bp, url_prefix='/api/shipments')
    # app.register_blueprint(auth_bp, url_prefix='/api/auth')

    return app