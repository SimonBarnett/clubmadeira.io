from flask import Flask, render_template, session, request, jsonify, make_response, send_from_directory, redirect, current_app
from flask_cors import CORS
from blueprints.referral_bp import referral_bp
from blueprints.authentication_bp import authentication_bp
from blueprints.content_bp import content_bp
from blueprints.manager_bp import manager_bp
from blueprints.site_request_bp import site_request_bp
from blueprints.user_settings_bp import user_settings_bp
from blueprints.utility_bp import utility_bp
from utils.auth import login_required, load_users_settings, generate_token, decode_token
from utils.posthog_utils import initialize_posthog
from functools import wraps
import json
import os
import logging
from logging.handlers import TimedRotatingFileHandler
import datetime
import time
import bcrypt
import jwt
import requests  # Added for PostHog API calls

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

# Initialize PostHog client and attach it to the app
app.posthog_client = initialize_posthog()

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

# Function to fetch the user's last login from PostHog
def fetch_last_login(user_id):
    try:
        config = load_config()
        posthog_config = config.get("posthog", {})
        api_key = posthog_config.get("PROJECT_READ_KEY")
        host = posthog_config.get("HOST", "https://eu.i.posthog.com")
        project_id = posthog_config.get("PROJECT_ID")

        if not api_key or not project_id:
            logging.error("PostHog configuration missing: PROJECT_READ_KEY or PROJECT_ID not set")
            return "Last login information unavailable"

        response = requests.get(
            f"{host}/api/projects/{project_id}/events",
            headers={"Authorization": f"Bearer {api_key}"},
            params={
                "event": "login",
                "properties": json.dumps([{"key": "user_id", "value": user_id, "operator": "exact"}]),
                "order_by": json.dumps(["-timestamp"]),
                "limit": 1
            },
            timeout=5
        )

        if response.status_code != 200:
            logging.error(f"Failed to fetch login events from PostHog for user {user_id}: {response.status_code} - {response.text}")
            return "Last login information unavailable"

        events_data = response.json().get("results", [])
        if events_data:
            last_login = events_data[0]
            timestamp = last_login.get("timestamp", "N/A")
            ip_address = last_login.get("properties", {}).get("ip_address", "N/A")
            return f"Your last login was on {timestamp} from IP {ip_address}"
        else:
            return "This is your first login"

    except requests.Timeout:
        logging.error(f"Timeout while fetching last login for user {user_id}")
        return "Last login information unavailable"
    except Exception as e:
        logging.error(f"Failed to retrieve last login for user {user_id}: {str(e)}", exc_info=True)
        return "Last login information unavailable"

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

app.register_blueprint(referral_bp)
app.register_blueprint(authentication_bp)
app.register_blueprint(content_bp)
app.register_blueprint(manager_bp)
app.register_blueprint(site_request_bp)
app.register_blueprint(user_settings_bp)
app.register_blueprint(utility_bp)

@app.route('/', methods=['GET', 'POST'])
def home():
    try:
        decoded, token, source = get_authenticated_user()
        is_authenticated = bool(decoded)

        if request.method == 'GET':
            if not decoded:
                section = request.args.get('section', 'info')
                context = {
                    'title': 'clubmadeira.io | Login',
                    'page_type': 'login',
                    'is_authenticated': False,
                    'base_url': request.url_root.rstrip('/'),
                    'section': section
                }
                if section == 'completeSignup':
                    stripe_account_id = request.args.get('account_id')
                    role = request.args.get('role')
                    if not stripe_account_id or not role:
                        logging.warning("Missing account_id or role in query parameters")
                        return redirect('/?section=failSignupContainer')
                    context['signup_data'] = {
                        'stripe_account_id': stripe_account_id,
                        'role': role
                    }
                    config = load_config()
                    stripe_api_key = config.get('stripe', {}).get('API_KEY', '')
                    context['stripe_sandbox'] = stripe_api_key.startswith('sk_test_')
                response = make_response(render_template('login.html', **context))
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
            # Add last_login to the user object
            user['last_login'] = session['user'].get('last_login', 'Last login information unavailable')
            role_pages = {
                'admin': ('admin.html', 'Admin', 'admin'),
                'community': ('community.html', 'Community', 'community'),
                'merchant': ('merchant.html', 'Merchant', 'merchant'),
                'partner': ('partner.html', 'Partner', 'partner')
            }
            template, title_suffix, page_type = role_pages.get(x_role, ('login.html', 'Login', 'login'))
            logging.debug(f"Serving {page_type} page for user {user_id} from {source} with template {template}")
            logging.debug(f"Template context - x_role: {x_role}, page_type: {page_type}, user: {user}")
            
            context = {
                'title': f'clubmadeira.io | {title_suffix}',
                'page_type': page_type,
                'is_authenticated': True,
                'user': user,
                'x_role': x_role,
                'deselected': [],
                'previous_deselected': [],
                'selected': [],
                'prompt': '',
                'categories': {}
            }
            response = make_response(render_template(template, **context))
            response.headers['X-Role'] = x_role
            response.headers['X-Page-Type'] = page_type
            response.set_cookie('authToken', token, secure=True, max_age=604800, path='/')
            return response

        # POST request (login or password setup)
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

        # Handle login
        if not data or 'email' not in data or 'password' not in data:
            logging.warning(f"Missing fields: {data}")
            return jsonify({"status": "error", "message": "Email and password are required"}), 400

        email = data['email'].strip().lower()
        password = data['password'].strip()

        users_settings = load_users_settings()
        user_entry = next(((uid, u) for uid, u in users_settings.items() if u['email_address'].lower() == email), None)

        if user_entry:
            user_id, user = user_entry
            stored_hash = user['password']
            logging.debug(f"Stored password hash for {user_id}: {stored_hash[:10]}...")
            logging.debug(f"Provided password length: {len(password)}")

            if bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
                permissions = user['permissions']
                x_role = 'admin' if 'admin' in permissions else next((r for r in ['merchant', 'community', 'partner'] if r in permissions), 'login')
                token = generate_token(user_id, permissions, x_role=x_role)
                # Fetch last login before recording current login event
                last_login_message = fetch_last_login(user_id)
                session['user'] = {
                    'user_id': user_id,
                    'permissions': permissions,
                    'token': token,
                    'x-role': x_role,
                    'last_login': last_login_message  # Store in session
                }
                session.modified = True
                logging.debug(f"Login successful, x-role set to {x_role} for user {user_id}")

                # Record login event in PostHog after fetching last login
                login_data = {
                    "user_id": user_id,
                    "timestamp": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "ip_address": request.remote_addr
                }
                if current_app.posthog_client:
                    try:
                        current_app.posthog_client.capture(
                            distinct_id=user_id,
                            event="login",
                            properties=login_data
                        )
                        logging.debug(f"PostHog login event captured: distinct_id={user_id}, properties={json.dumps(login_data)}")
                    except Exception as e:
                        logging.error(f"PostHog Issue - Failed to capture login event: {str(e)}", exc_info=True)
                else:
                    logging.warning("PostHog Issue - posthog_client is None, login event not captured")

                response = jsonify({
                    "status": "success",
                    "token": token,
                    "user_id": user_id,
                    "x-role": x_role
                })
                response.set_cookie('authToken', token, secure=True, max_age=604800, path='/')
                return response, 200
            else:
                logging.debug("Password mismatch during login attempt")
                return jsonify({"status": "error", "message": "Invalid credentials"}), 401
        else:
            logging.debug(f"User not found for email: {email}")
            return jsonify({"status": "error", "message": "Invalid credentials"}), 401

    except Exception as e:
        logging.error(f"UX Issue - Failed to process request: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
      
@app.route('/get-token', methods=['GET'])
def get_token():
    try:
        decoded, token, source = get_authenticated_user()
        is_authenticated = bool(decoded)  # Set is_authenticated for consistency
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
        # Check for authenticated user and log details
        decoded, _, source = get_authenticated_user()
        if decoded:
            logging.debug(f"Logging off user {decoded['user_id']} authenticated via {source}")
        
        # Clear session data
        if 'user' in session:
            session['user'].pop('x-role', None)
            logging.debug("x-role cleared from session")
        session.clear()
        logging.debug("Server-side session cleared during logoff")

        # Create redirect response to home page
        response = redirect('/')
        # Delete authentication-related cookies
        response.delete_cookie('authToken', path='/')
        response.delete_cookie('session', path='/')
        return response

    except Exception as e:
        # Log error and render error page
        logging.error(f"UX Issue - Failed to process logoff request: {str(e)}", exc_info=True)
        context = {
            'title': 'clubmadeira.io | Logoff Error',
            'page_type': 'error',
            'is_authenticated': False,
            'error_message': str(e)
        }
        html_content = render_template('error.html', **context)
        response = make_response(html_content, 500)
        response.headers['Content-Type'] = 'text/html'
        response.headers['X-Page-Type'] = 'error'
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