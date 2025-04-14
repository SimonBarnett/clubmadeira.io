from flask import Flask, render_template, session, request, jsonify, make_response, send_from_directory, redirect
from flask_cors import CORS
from blueprints.authentication_bp import authentication_bp
from blueprints.site_request_bp import site_request_bp
from blueprints.user_settings_bp import user_settings_bp
from blueprints.utility_bp import utility_bp
from blueprints.content_bp import content_bp
from blueprints.referral_bp import referral_bp
from blueprints.manager_bp import manager_bp
from utils.auth import login_required, load_users_settings, generate_token, decode_token
from functools import wraps
import json
import os
import logging
from logging.handlers import TimedRotatingFileHandler
import datetime
import time
import bcrypt
import jwt

app = Flask(__name__, template_folder='templates')
CORS(app)

CONFIG_FILE = "config.json"

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    return {
        "jwt": {"SECRET_KEY": "your-secret-key"},
        "session": {"SECRET_KEY": "your-session-secret-key"},
        "log_level": "DEBUG"
    }

config = load_config()
app.config['JWT_SECRET_KEY'] = config['jwt']['SECRET_KEY']
app.secret_key = config['session']['SECRET_KEY']

def setup_logging():
    log_level_str = config.get("log_level", "DEBUG").upper()
    log_levels = {"DEBUG": logging.DEBUG, "INFO": logging.INFO, "WARNING": logging.WARNING, "ERROR": logging.ERROR}
    log_level = log_levels.get(log_level_str, logging.DEBUG)

    now = datetime.datetime.utcnow()
    log_dir = os.path.join("log", str(now.year), f"{now.month:02d}")
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, f"{now.year}-{now.month:02d}-{now.day:02d}.log")

    handler = TimedRotatingFileHandler(log_file, when="midnight", interval=1, backupCount=0, utc=True)
    handler.setFormatter(logging.Formatter("[%(asctime)s] | %(levelname)s | %(message)s", datefmt="%Y-%m-%d %H:%M:%S"))
    handler.suffix = "%Y-%m-%d"

    logger = logging.getLogger()
    logger.setLevel(log_level)
    logger.handlers = []
    logger.addHandler(handler)

setup_logging()

# Function to fetch site settings from config
def fetch_site_settings():
    try:
        config = load_config()
        settings_dict = {}
        for key, value in config.items():
            if value.get('setting_type') == 'settings_key':
                fields = {k: v for k, v in value.items() if k not in ['_comment', '_description', 'setting_type', 'icon', 'doc_link']}
                settings_dict[key] = fields
        return settings_dict
    except Exception as e:
        logging.error(f"Error fetching site settings from config: {str(e)}", exc_info=True)
        return {}

# Add site settings to the template context for all routes
@app.context_processor
def inject_site_settings():
    site_settings = fetch_site_settings()
    return dict(site_settings=site_settings)

def get_authenticated_user():
    token = None
    source = None
    
    if 'user' in session and session['user'].get('token'):
        try:
            decoded = decode_token(session['user']['token'])
            logging.debug(f"Authenticated via session for user: {decoded.get('user_id')}")
            return decoded, session['user']['token'], "session"
        except jwt.InvalidTokenError:
            logging.debug("Session token invalid, clearing session")
            session.pop('user', None)

    header_token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if header_token:
        try:
            decoded = decode_token(header_token)
            logging.debug(f"Authenticated via Authorization header for user: {decoded.get('user_id')}")
            session['user'] = {
                'user_id': decoded.get('user_id'),
                'permissions': decoded.get('permissions', []),
                'token': header_token,
                'x-role': decoded.get('x-role') or ('admin' if 'admin' in decoded.get('permissions', []) else next((r for r in ['merchant', 'community', 'partner'] if r in decoded.get('permissions', [])), 'login'))
            }
            session.modified = True
            return decoded, header_token, "header"
        except jwt.InvalidTokenError:
            logging.debug("Header token invalid")

    cookie_token = request.cookies.get('authToken', '')
    if cookie_token:
        try:
            decoded = decode_token(cookie_token)
            logging.debug(f"Authenticated via cookie for user: {decoded.get('user_id')}")
            session['user'] = {
                'user_id': decoded.get('user_id'),
                'permissions': decoded.get('permissions', []),
                'token': cookie_token,
                'x-role': decoded.get('x-role') or ('admin' if 'admin' in decoded.get('permissions', []) else next((r for r in ['merchant', 'community', 'partner'] if r in decoded.get('permissions', [])), 'login'))
            }
            session.modified = True
            return decoded, cookie_token, "cookie"
        except jwt.InvalidTokenError:
            logging.debug("Cookie token invalid")

    logging.debug("No valid authentication found")
    return None, None, None

@app.before_request
def log_request():
    if request.path.startswith('/static'):
        return
    start_time = time.time()
    request_data = {
        "method": request.method,
        "url": request.full_path,
        "headers": dict(request.headers),
        "ip": request.remote_addr,
        "body": request.get_json(silent=True) or request.form.to_dict() or "[NO BODY]"
    }
    log_data = request_data.copy()
    if "Authorization" in log_data["headers"]:
        log_data["headers"]["Authorization"] = "[REDACTED]"
    if isinstance(log_data["body"], dict) and "password" in log_data["body"]:
        log_data["body"]["password"] = "[REDACTED]"
    logging.debug(f"Request: {json.dumps(log_data)}")
    request.start_time = start_time

@app.after_request
def log_response(response):
    if request.path.startswith('/static'):
        return response
    duration = (time.time() - request.start_time) * 1000
    response_data = {
        "status": response.status_code,
        "duration_ms": f"{duration:.2f}",
        "body": response.get_data(as_text=True)[:1000] + ("..." if len(response.get_data()) > 1000 else "")
    }
    logging.debug(f"Full Response: Status {response.status_code}, Body: {response.get_data(as_text=True)}")
    if "token" in response_data["body"].lower():
        try:
            resp_json = json.loads(response_data["body"])
            if "token" in resp_json:
                resp_json["token"] = "[REDACTED]"
            response_data["body"] = json.dumps(resp_json)
        except json.JSONDecodeError:
            response_data["body"] = "[REDACTED CONTENT]"
    if response.status_code >= 400:
        logging.warning(f"UX Issue - Response failed: {json.dumps(response_data)}")
    logging.debug(f"Response: {json.dumps(response_data)}")
    return response

app.register_blueprint(authentication_bp, url_prefix='')
app.register_blueprint(site_request_bp, url_prefix='')
app.register_blueprint(user_settings_bp, url_prefix='')
app.register_blueprint(utility_bp, url_prefix='')
app.register_blueprint(content_bp, url_prefix='')
app.register_blueprint(referral_bp, url_prefix='')
app.register_blueprint(manager_bp, url_prefix='')

@app.route('/', methods=['GET', 'POST'])
def home():
    try:
        if request.method == 'GET':
            decoded, token, source = get_authenticated_user()
            if not decoded:
                logging.debug("No valid authentication, serving login page")
                response = make_response(render_template('login.html', title='clubmadeira.io | Login', page_type='login', base_url=request.url_root.rstrip('/')))
                response.headers['X-Page-Type'] = 'login'
                return response

            user_id = decoded.get('user_id')
            permissions = decoded.get('permissions', [])
            x_role_header = request.headers.get('X-Role', '').lower()
            x_role = x_role_header if x_role_header in ['admin', 'community', 'merchant', 'partner'] else \
                     decoded.get('x-role') or session['user'].get('x-role') or \
                     ('admin' if 'admin' in permissions else next((r for r in ['merchant', 'community', 'partner'] if r in permissions), 'login'))
            
            if 'user' in session:
                session['user']['x-role'] = x_role
                session.modified = True
            
            users_settings = load_users_settings()
            user_data = users_settings.get(user_id, {})
            if 'contact_name' not in user_data:
                user_data['contact_name'] = ''
            user = {**user_data, 'user_id': user_id}
            role_pages = {
                'admin': ('admin.html', 'Admin', 'admin'),
                'community': ('community.html', 'Community', 'community'),
                'merchant': ('merchant.html', 'Merchant', 'merchant'),
                'partner': ('partner.html', 'Partner', 'partner')
            }
            template, title_suffix, page_type = role_pages.get(x_role, ('login.html', 'Login', 'login'))
            logging.debug(f"Serving {page_type} page for user {user_id} from {source} with template {template}")
            logging.debug(f"Template context - x_role: {x_role}, page_type: {page_type}, user: {user}")
            
            # Define context with default values to prevent undefined variable errors
            context = {
                'title': f'clubmadeira.io | {title_suffix}',
                'page_type': page_type,
                'user': user,
                'x_role': x_role,
                'deselected': [],           # Default empty list
                'previous_deselected': [],  # Default empty list
                'selected': [],             # Default empty list
                'prompt': '',               # Default empty string
                'categories': {}            # Default empty dict
            }
            response = make_response(render_template(template, **context))
            response.headers['X-Role'] = x_role
            response.headers['X-Page-Type'] = page_type
            response.set_cookie('authToken', token, secure=True, max_age=604800, path='/')
            return response

        # POST request (login)
        content_type = request.headers.get('Content-Type', '')
        if 'application/json' in content_type:
            data = request.get_json(silent=True, force=True, cache=False) or {}
        else:
            data = request.form.to_dict()

        log_data = {
            "method": request.method,
            "url": request.full_path,
            "headers": {k: "[REDACTED]" if k == "Authorization" else v for k, v in request.headers.items()},
            "ip": request.remote_addr,
            "content_type": content_type,
            "body": {"email": data.get("email"), "password": "[REDACTED]"} if data else "[NO BODY]"
        }
        logging.debug(f"Request: {json.dumps(log_data)}")

        if not data or 'email' not in data or 'password' not in data:
            logging.warning(f"Missing fields: {data}")
            return jsonify({"status": "error", "message": "Email and password are required"}), 400

        email = data['email'].strip().lower()
        password = data['password'].strip()

        users_settings = load_users_settings()
        user_entry = next(((uid, u) for uid, u in users_settings.items() if u['email_address'].lower() == email), None)

        if user_entry:
            user_id, user = user_entry
            if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
                permissions = user['permissions']
                x_role = 'admin' if 'admin' in permissions else next((r for r in ['merchant', 'community', 'partner'] if r in permissions), 'login')
                token = generate_token(user_id, permissions, x_role=x_role)
                session['user'] = {
                    'user_id': user_id,
                    'permissions': permissions,
                    'token': token,
                    'x-role': x_role
                }
                session.modified = True
                logging.debug(f"Login successful, x-role set to {x_role} for user {user_id}")
                response = jsonify({
                    "status": "success",
                    "token": token,
                    "user_id": user_id,
                    "x-role": x_role
                })
                response.set_cookie('authToken', token, secure=True, max_age=604800, path='/')
                return response, 200
            else:
                logging.debug("Password does not match")
                return jsonify({"status": "error", "message": "Invalid credentials"}), 401
        else:
            logging.debug(f"User not found for email: {email}")
            return jsonify({"status": "error", "message": "Invalid credentials"}), 401

    except Exception as e:
        logging.error(f"UX Issue - Failed to process request: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@app.route('/set-role', methods=['POST'])
@login_required(['admin'], require_all=True)
def set_role():
    decoded, token, source = get_authenticated_user()
    if not decoded:
        return jsonify({"status": "error", "message": "Authentication required"}), 401

    data = request.get_json()
    if not data or 'role' not in data:
        logging.warning(f"Missing role field in set-role request for user {decoded['user_id']}")
        return jsonify({"status": "error", "message": "Role field is required"}), 400

    new_role = data['role']
    valid_roles = ['admin', 'community', 'merchant', 'partner']
    if new_role not in valid_roles:
        return jsonify({"status": "error", "message": f"Invalid role. Must be one of: {', '.join(valid_roles)}"}), 400

    current_role = decoded.get('x-role', 'login')
    if current_role == new_role:
        logging.debug(f"Role unchanged for user {decoded['user_id']}: {new_role}")
        return jsonify({"status": "success", "message": f"Role already set to {new_role}", "token": token}), 200

    user_id = decoded['user_id']
    permissions = decoded['permissions']
    new_token = generate_token(user_id, permissions, x_role=new_role)
    if 'user' in session:
        session['user']['x-role'] = new_role
        session['user']['token'] = new_token
        session.modified = True
    logging.debug(f"Updated x-role to {new_role} and token for user {user_id} from {source}")
    response = jsonify({"status": "success", "message": f"Role set to {new_role}", "token": new_token})
    response.set_cookie('authToken', new_token, secure=True, max_age=604800, path='/')
    return response, 200

@app.route('/get-token', methods=['GET'])
def get_token():
    try:
        decoded, token, source = get_authenticated_user()
        if not decoded:
            logging.debug("No valid token found in session, header, or cookie")
            return jsonify({"status": "error", "message": "No token found"}), 401

        logging.debug(f"Returning token for user {decoded['user_id']} from {source}")
        return jsonify({"status": "success", "token": token})

    except Exception as e:
        logging.error(f"UX Issue - Failed to get token: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@app.route('/logoff', methods=['GET'])
def logoff():
    try:
        decoded, _, source = get_authenticated_user()
        if decoded:
            logging.debug(f"Logging off user {decoded['user_id']} authenticated via {source}")
        
        if 'user' in session:
            session['user'].pop('x-role', None)
            logging.debug("x-role cleared from session")
        session.clear()
        logging.debug("Server-side session cleared during logoff")

        response = redirect('/')
        response.delete_cookie('authToken', path='/')
        response.delete_cookie('session', path='/')
        return response

    except Exception as e:
        logging.error(f"UX Issue - Failed to process logoff request: {str(e)}", exc_info=True)
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Logoff Error</title>
        </head>
        <body>
            <p>Error during logoff: {str(e)}</p>
        </body>
        </html>
        """
        response = make_response(html_content, 500)
        response.headers['Content-Type'] = 'text/html'
        return response

@app.route('/static/js/<path:filename>')
def serve_js(filename):
    response = send_from_directory('static/js', filename, mimetype='text/javascript')
    response.headers['Content-Type'] = 'text/javascript'
    return response

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

def login_required(required_permissions=None, require_all=False):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            decoded, _, source = get_authenticated_user()
            if not decoded:
                return jsonify({"status": "error", "message": "Authentication required"}), 401
            
            user_permissions = decoded.get('permissions', [])
            if required_permissions:
                if require_all:
                    if not all(p in user_permissions for p in required_permissions):
                        return jsonify({"status": "error", "message": "Permission denied"}), 403
                else:
                    if not any(p in user_permissions for p in required_permissions):
                        return jsonify({"status": "error", "message": "Permission denied"}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=80)