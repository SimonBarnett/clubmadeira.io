from flask import Flask, request, jsonify
from functools import wraps
import jwt
import datetime
import re

app = Flask(__name__)

# Secret key for JWT (replace with your actual secret)
SECRET_KEY = "itsananagramjanet"

# Custom decorator for permissions
def require_permissions(required_permissions, require_all=True):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return jsonify({"status": "error", "message": "Authorization token required"}), 401
            
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                if datetime.datetime.utcnow().timestamp() > payload["exp"]:
                    return jsonify({"status": "error", "message": "Token has expired"}), 401
                user_permissions = payload.get("permissions", [])
                request.user_id = payload["userId"]
                request.permissions = user_permissions
            except jwt.InvalidTokenError:
                return jsonify({"status": "error", "message": "Invalid token"}), 401
            except Exception as e:
                return jsonify({"status": "error", "message": f"Token error: {str(e)}"}), 500

            # Handle shorthands
            effective_perms = []
            for perm in required_permissions:
                if perm == "allauth":
                    effective_perms.extend(["admin", "merchant", "community", "wixpro"])
                elif perm == "self":
                    user_id_in_route = next((v for v in kwargs.values() if isinstance(v, str)), None)
                    if user_id_in_route and request.user_id != user_id_in_route:
                        effective_perms.append(None)  # Fails unless other perms allow
                    elif not user_id_in_route:  # For endpoints like /update-password
                        effective_perms.append("self")  # Check in function
                else:
                    effective_perms.append(perm)

            # Permission check
            if require_all:
                if not all(perm in user_permissions for perm in effective_perms if perm is not None and perm != "self"):
                    return jsonify({"status": "error", "message": f"Insufficient permissions: {effective_perms}"}), 403
            else:
                if not any(perm in user_permissions for perm in effective_perms if perm is not None and perm != "self"):
                    return jsonify({"status": "error", "message": f"Insufficient permissions: {effective_perms}"}), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Public Endpoints
@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Welcome to the application"})

@app.route('/branding', methods=['GET'])
def branding():
    # Placeholder: Load branding from branding.json
    return jsonify({"status": "success", "branding": {"name": "Example"}})

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'GET':
        return jsonify({"message": "Signup page"})
    data = request.get_json()
    # Placeholder: Register user
    return jsonify({"status": "success", "message": "User registered"})

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    # Placeholder: Authenticate and return JWT
    token = jwt.encode({"userId": "123", "permissions": ["user"], "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)}, SECRET_KEY)
    return jsonify({"status": "success", "token": token})

@app.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    # Placeholder: Send OTP
    return jsonify({"status": "success", "message": "OTP sent"})

@app.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    data = request.get_json()
    # Placeholder: Verify OTP and update password
    return jsonify({"status": "success", "message": "Password reset"})

@app.route('/discounted-products', methods=['GET'])
def get_all_discounted_products():
    category_id = request.args.get('category_id')
    # Placeholder: Fetch discounted products
    return jsonify({"status": "success", "products": []})

@app.route('/<USERid>/categories', methods=['GET'])
def get_user_categories_public(USERid):
    # Placeholder: Fetch categories with discounted products
    return jsonify({"status": "success", "categories": []})

@app.route('/referal', methods=['POST'])
def handle_referral():
    data = request.get_json()
    # Placeholder: Handle referral callback
    return jsonify({"status": "success", "message": "Referral recorded"})

@app.route('/<USERid>/discounted-products', methods=['GET'])
def get_user_discounted_products(USERid):
    # Placeholder: Fetch user's discounted products
    return jsonify({"status": "success", "products": []})

@app.route('/<USERid>/products/<product_id>', methods=['GET'])
def reduce_product_quantity(USERid, product_id):
    # Placeholder: Reduce product quantity (should be PATCH?)
    return jsonify({"status": "success", "message": f"Quantity reduced for {product_id}"})

# Private Endpoints
@app.route('/update-password', methods=['POST'])
@require_permissions(["allauth"], require_all=False)
def update_password():
    data = request.get_json()
    if not data or "userId" not in data or request.user_id != data["userId"]:
        return jsonify({"status": "error", "message": "Unauthorized: Can only update own password"}), 403
    # Placeholder: Update password
    return jsonify({"status": "success", "message": "Password updated"})

@app.route('/render-github-md/<owner>/<repo>/<branch>/<path:path>', methods=['GET'])
@require_permissions(["allauth"], require_all=False)
def render_github_md(owner, repo, branch, path):
    # Placeholder: Render Markdown
    return jsonify({"status": "success", "content": "Rendered Markdown"})

@app.route('/users', methods=['GET'])
@require_permissions(["admin"], require_all=True)
def get_users():
    # Placeholder: List all users
    return jsonify({"status": "success", "users": []})

@app.route('/users/<user_id>', methods=['GET'])
@require_permissions(["admin"], require_all=True)
def get_user(user_id):
    # Placeholder: Get user details
    return jsonify({"status": "success", "user": {}})

@app.route('/permissions/<user_id>', methods=['GET', 'POST', 'DELETE'])
@require_permissions(["admin"], require_all=True)
def manage_permissions(user_id):
    # Placeholder: Manage permissions
    return jsonify({"status": "success", "message": "Permissions updated"})

@app.route('/<USERid>/user', methods=['GET', 'PUT', 'PATCH'])
@require_permissions(["self", "admin", "wixpro"], require_all=False)
def user_settings_endpoint(USERid):
    if request.method in ['GET', 'PUT'] and not (request.user_id == USERid or "admin" in request.permissions):
        return jsonify({"status": "error", "message": "Unauthorized: Requires self or admin"}), 403
    if request.method == 'PATCH' and "wixpro" in request.permissions and not (request.user_id == USERid or "admin" in request.permissions):
        data = request.get_json()
        if not data or any(key != "wixClientId" for key in data.keys()):
            return jsonify({"status": "error", "message": "Wixpro can only update wixClientId"}), 403
    # Placeholder: User settings logic
    return jsonify({"status": "success", "settings": {}})

@app.route('/<USERid>/visits', methods=['GET'])
@require_permissions(["self", "admin"], require_all=False)
def get_visits(USERid):
    # Placeholder: Fetch visits
    return jsonify({"status": "success", "visits": []})

@app.route('/<USERid>/orders', methods=['GET'])
@require_permissions(["self", "admin"], require_all=False)
def get_orders(USERid):
    # Placeholder: Fetch orders
    return jsonify({"status": "success", "orders": []})

@app.route('/config', methods=['GET'])
@require_permissions(["admin"], require_all=True)
def get_config():
    # Placeholder: Fetch config
    return jsonify({"status": "success", "config": {}})

@app.route('/config/<affiliate>', methods=['PATCH'])
@require_permissions(["admin"], require_all=True)
def update_config(affiliate):
    # Placeholder: Update config
    return jsonify({"status": "success", "message": "Config updated"})

@app.route('/<USERid>/mycategories', methods=['GET', 'PUT', 'PATCH', 'DELETE'])
@require_permissions(["self"], require_all=False)
def manage_mycategories(USERid):
    # Placeholder: Manage categories
    return jsonify({"status": "success", "categories": []})

@app.route('/categories', methods=['GET'])
@require_permissions(["allauth"], require_all=False)
def get_categories():
    # Placeholder: Fetch all categories
    return jsonify({"status": "success", "categories": []})

@app.route('/<USERid>/products', methods=['GET'])
@require_permissions(["self"], require_all=False)
def get_products(USERid):
    # Placeholder: Fetch user's products
    return jsonify({"status": "success", "products": []})

@app.route('/<user_id>/siterequest', methods=['POST'])
@require_permissions(["admin", "merchant", "community"], require_all=False)
def save_site_request_post(user_id):
    if request.user_id != user_id:
        return jsonify({"status": "error", "message": "Unauthorized: Must match user_id"}), 403
    data = request.get_json()
    # Placeholder: Save site request
    return jsonify({"status": "success", "message": "Site request saved"})

@app.route('/<user_id>/siterequest', methods=['GET'])
@require_permissions(["admin", "wixpro"], require_all=False)
def get_site_request(user_id):
    # Placeholder: Fetch site request
    return jsonify({"status": "success", "site_request": {}})

@app.route('/siterequests', methods=['GET'])
@require_permissions(["admin", "wixpro"], require_all=False)
def get_site_requests():
    # Placeholder: Fetch all site requests
    return jsonify({"status": "success", "site_requests": []})

@app.route('/admin', methods=['GET'])
@require_permissions(["admin"], require_all=True)
def admin_dashboard():
    # Placeholder: Admin dashboard
    return jsonify({"status": "success", "message": "Admin dashboard"})

@app.route('/community', methods=['GET'])
@require_permissions(["community", "admin"], require_all=False)
def community_dashboard():
    # Placeholder: Community dashboard
    return jsonify({"status": "success", "message": "Community dashboard"})

@app.route('/merchant', methods=['GET'])
@require_permissions(["merchant", "admin"], require_all=False)
def merchant_dashboard():
    # Placeholder: Merchant dashboard
    return jsonify({"status": "success", "message": "Merchant dashboard"})

@app.route('/partner', methods=['GET'])
@require_permissions(["wixpro", "admin"], require_all=False)
def partner_dashboard():
    # Placeholder: Partner (Wixpro) dashboard
    return jsonify({"status": "success", "message": "Partner dashboard"})

if __name__ == '__main__':
    app.run(debug=True)