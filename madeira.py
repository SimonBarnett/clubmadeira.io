from flask import Flask
from flask_cors import CORS
import os
import logging
from utils.config import load_config
from blueprints.authentication import authentication_bp
from blueprints.configuration import configuration_bp
from blueprints.data_retrieval import data_retrieval_bp
from blueprints.referral import referral_bp
from blueprints.role_pages import role_pages_bp
from blueprints.site_request import site_request_bp
from blueprints.user_management import user_management_bp
from blueprints.user_settings import user_settings_bp
from blueprints.utility import utility_bp

# Initialize Flask app
app = Flask(__name__)

# Constants
CONFIG_FILE = "config.json"
USERS_SETTINGS_FILE = "users_settings.json"
SITE_REQUEST_DIR = os.path.join(os.path.dirname(__file__), "siterequest")

# Set up logging
logging.basicConfig(
    filename='app.log',
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s %(message)s'
)
logger = logging.getLogger(__name__)

# Enable CORS
CORS(app, resources={
    r"/*": {
        "origins": "https://clubmadeira.io",
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
}, supports_credentials=False)

# Load configuration
config = load_config()

# Validate JWT secret key
if 'jwt' not in config or 'SECRET_KEY' not in config['jwt']:
    raise ValueError("JWT SECRET_KEY is missing in config.json")
app.config['JWT_SECRET_KEY'] = config['jwt']['SECRET_KEY']

# Ensure site request directory exists
if not os.path.exists(SITE_REQUEST_DIR):
    os.makedirs(SITE_REQUEST_DIR)

# Register blueprints
app.register_blueprint(authentication_bp)
app.register_blueprint(configuration_bp)
app.register_blueprint(data_retrieval_bp)
app.register_blueprint(referral_bp)
app.register_blueprint(role_pages_bp)
app.register_blueprint(site_request_bp)
app.register_blueprint(user_management_bp)
app.register_blueprint(user_settings_bp)
app.register_blueprint(utility_bp)

# Run the app
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)