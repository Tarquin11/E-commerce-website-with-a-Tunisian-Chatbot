from flask import Flask, app
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_mail import Mail
import os
from dotenv import load_dotenv  
load_dotenv()

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
mail = Mail()
from flask_caching import Cache


cache = Cache()
def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "http://goatshop.se:5173"}})
    
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')

    env_db = os.environ.get('DATABASE_URL')
    if env_db:
        app.config['SQLALCHEMY_DATABASE_URI'] = env_db
    else:
        basedir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        db_path = os.path.join(basedir, 'ecommerce.db')
        app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"

    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')
    app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
    mail_pw = os.environ.get('MAIL_PASSWORD') or ''
    app.config['MAIL_PASSWORD'] = mail_pw.replace(' ', '')
    
    app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER')
    app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'true').lower() in ('true', '1', 'yes')
    app.config['MAIL_USE_SSL'] = os.environ.get('MAIL_USE_SSL', 'false').lower() in ('true', '1', 'yes')
    print(f"Configuring Mail: {app.config.get('MAIL_USERNAME')} using port {app.config.get('MAIL_PORT')}")
    if not app.config['MAIL_PASSWORD']:
         print(" MAIL_PASSWORD is empty!")
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://goatshop.com:3000",
        "http://goatshop.com"
    ]
    CORS(app, resources={r"/api/*": {"origins": origins}})
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)
    from app.auth import auth_bp
    from app.main import main_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(main_bp, url_prefix='/api')
    with app.app_context():
        db.create_all()

        try:
            from app.main import init_app
            init_app(app)
        except ImportError:
            pass
        try:
            from .seed_legends import seed_all_legends

            @app.cli.command("seed-legends")
            def seed_legends_command():
                """Seeds the legendary player jerseys into the database."""
                print("Starting legend seed...")
                try:
                    added = seed_all_legends()
                    print(f"Success! Added {added} legendary items.")
                except Exception as e:
                    print("Seeding failed:", e)
        except Exception:
            pass

        pre = os.environ.get('PREGENERATE_LOCALES', '1').lower()
        if pre in ('1', 'true', 'yes'):
            def _pre_generate_locales():
                try:
                    from app.main import generate_locale, SUPPORTED_LANGS
                    with app.app_context():
                        for lang in SUPPORTED_LANGS:
                            try:
                                generate_locale(lang)
                            except Exception:
                                pass
                except Exception:
                    pass
            
            try:
                import threading
                threading.Thread(target=_pre_generate_locales, daemon=True).start()
            except Exception:
                pass

    return app