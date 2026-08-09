from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config

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

    # Import and register blueprints
    from app.routes.shipment import shipment_bp
    from app.auth import auth_bp
    
    app.register_blueprint(shipment_bp, url_prefix='/api/shipments')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    # 👇 ADD THIS TEST ROUTE
    @app.route('/')
    def home():
        return "Flask is running! 🚀"

    return app