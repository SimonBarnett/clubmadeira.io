from flask import Flask, render_template, redirect, url_for, session, request, jsonify
from flask_cors import CORS
from blueprints.authentication import authentication_bp
from blueprints.site_request import site_request_bp
from blueprints.user_management import user_management_bp
from blueprints.user_settings import user_settings_bp
from blueprints.utility import utility_bp
from blueprints.role_pages import role_pages_bp
from blueprints.data_retrieval import data_retrieval_bp
from blueprints.configuration import configuration_bp
from utils.auth import login_required 
import json
import os
import logging
from logging.handlers import TimedRotatingFileHandler
import datetime
import time

app = Flask(__name__, template_folder='templates')  # Explicitly set template folder
CORS(app)

CONFIG_FILE = "config.json"
def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    return {"jwt": {"SECRET_KEY": "your-secret-key"}, "log_level": "DEBUG"}  # Added default log_level

config = load_config()
app.config['JWT_SECRET_KEY'] = config['jwt']['SECRET_KEY']

# Centralized logging setup
def setup_logging():
    log_level_str = config.get("log_level", "DEBUG").upper()
    log_levels = {"DEBUG": logging.DEBUG, "INFO": logging.INFO, "WARNING": logging.WARNING, "ERROR": logging.ERROR}
    log_level = log_levels.get(log_level_str, logging.DEBUG)

    # Create log directory structure
    now = datetime.datetime.utcnow()
    log_dir = os.path.join("log", str(now.year), f"{now.month:02d}")
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, f"{now.year}-{now.month:02d}-{now.day:02d}.log")

    # Configure rotating file handler
    handler = TimedRotatingFileHandler(log_file, when="midnight", interval=1, backupCount=0, utc=True)
    handler.setFormatter(logging.Formatter("[%(asctime)s] | %(levelname)s | %(message)s", datefmt="%Y-%m-%d %H:%M:%S"))
    handler.suffix = "%Y-%m-%d"  # Ensure daily rotation

    # Set up root logger
    logger = logging.getLogger()
    logger.setLevel(log_level)
    logger.handlers = []  # Clear default handlers
    logger.addHandler(handler)

# Initialize logging at startup
setup_logging()

# Middleware to log requests and responses with JWT redaction
@app.before_request
def log_request():
    if request.path.startswith('/static'):  # Skip static files
        return
    start_time = time.time()
    request_data = {
        "method": request.method,
        "url": request.full_path,
        "headers": dict(request.headers),
        "ip": request.remote_addr,
        "body": request.get_json(silent=True) or request.form.to_dict() or "[NO BODY]",
        "user_id": getattr(request, "user_id", "Unauthenticated")
    }
    # Redact JWT from headers
    if "Authorization" in request_data["headers"]:
        request_data["headers"]["Authorization"] = "[REDACTED]"
    # Redact password from body
    if isinstance(request_data["body"], dict) and "password" in request_data["body"]:
        request_data["body"]["password"] = "[REDACTED]"
    logging.debug(f"Request: {json.dumps(request_data)}")
    request.start_time = start_time

@app.after_request
def log_response(response):
    if request.path.startswith('/static'):
        return response
    duration = (time.time() - request.start_time) * 1000  # ms
    response_data = {
        "status": response.status_code,
        "duration_ms": f"{duration:.2f}",
        "body": response.get_data(as_text=True)[:1000] + ("..." if len(response.get_data()) > 1000 else "")
    }
    # Redact JWT from response body
    if "token" in response_data["body"].lower():
        try:
            resp_json = json.loads(response_data["body"])
            if "token" in resp_json:
                resp_json["token"] = "[REDACTED]"
            response_data["body"] = json.dumps(resp_json)
        except json.JSONDecodeError:
            response_data["body"] = "[REDACTED CONTENT]"
    # Log UX problems
    if response.status_code >= 400:
        logging.warning(f"UX Issue - Response failed: {json.dumps(response_data)}")
    logging.debug(f"Response: {json.dumps(response_data)}")
    return response

# Register blueprints
app.register_blueprint(authentication_bp, url_prefix='')  # Ensure no prefix conflicts
app.register_blueprint(site_request_bp, url_prefix='')
app.register_blueprint(user_management_bp, url_prefix='')
app.register_blueprint(user_settings_bp, url_prefix='')
app.register_blueprint(utility_bp, url_prefix='')
app.register_blueprint(role_pages_bp, url_prefix='')
app.register_blueprint(data_retrieval_bp, url_prefix='')
app.register_blueprint(configuration_bp, url_prefix='')

@app.route('/')
def home():
    try:
        if 'user' in session:
            user = session['user']
            if 'admin' in user['permissions']:
                return redirect(url_for('role_pages.admin'))
            elif 'merchant' in user['permissions']:
                return redirect(url_for('role_pages.merchant'))
            elif 'community' in user['permissions']:
                return redirect(url_for('role_pages.community'))
            elif 'wixpro' in user['permissions']:
                return redirect(url_for('role_pages.wixpro'))
            logging.warning(f"UX Issue - User {user.get('userId', 'unknown')} in session but no recognized permissions: {user.get('permissions', [])}")
        return render_template('login.html')
    except Exception as e:
        logging.error(f"UX Issue - Failed to render login page or redirect: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)