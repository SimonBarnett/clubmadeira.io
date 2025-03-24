from flask import Blueprint, jsonify, request
from utils.data_utils import load_json_file, save_json_file
from utils.decorators import require_permissions
import bcrypt
import jwt
from datetime import datetime, timedelta
import random
import string

authentication_bp = Blueprint('authentication', __name__)

def generate_code(length=8):
    """Generate a random user ID."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@authentication_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    if not email or not password:
        return jsonify({"status": "error", "message": "Email and password are required"}), 400
    users_settings = load_json_file('users_settings.json')
    matching_user_id = None
    for user_id, settings in users_settings.items():
        stored_email = settings.get("email_address", "").strip().lower()
        stored_password = settings.get("password", "")
        if stored_email == email:
            if isinstance(stored_password, str):
                stored_password = stored_password.encode('utf-8')
            if bcrypt.checkpw(password.encode('utf-8'), stored_password):
                matching_user_id = user_id
                break
    if not matching_user_id:
        return jsonify({"status": "error", "message": "Invalid email or password"}), 401
    user_data = users_settings[matching_user_id]
    permissions = user_data.get("permissions", [])
    contact_name = user_data.get("contact_name", "User")
    token_payload = {
        "userId": matching_user_id,
        "permissions": permissions,
        "exp": datetime.utcnow() + timedelta(hours=1),
        "iat": datetime.utcnow()
    }
    token = jwt.encode(token_payload, "itsananagramjanet", algorithm="HS256")
    response_data = {
        "status": "success",
        "message": "Login successful",
        "token": token,
        "userId": matching_user_id,
        "contact_name": contact_name
    }
    return jsonify(response_data), 200

@authentication_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    required_fields = ['signup_type', 'contact_name', 'signup_email', 'signup_password']
    if not all(field in data for field in required_fields):
        return jsonify({"status": "error", "message": "All fields are required"}), 400
    users_settings = load_json_file('users_settings.json')
    if any(user['email_address'] == data['signup_email'] for user in users_settings.values()):
        return jsonify({"status": "error", "message": "Email already exists"}), 400
    USERid = generate_code()
    hashed_password = bcrypt.hashpw(data['signup_password'].encode('utf-8'), bcrypt.gensalt())
    users_settings[USERid] = {
        "email_address": data['signup_email'],
        "password": hashed_password,
        "contact_name": data['contact_name'],
        "permissions": [data['signup_type']],
        "website_url": "",
        "wixClientId": "",
        "referrals": {"visits": [], "orders": []}
    }
    save_json_file(users_settings, 'users_settings.json')
    return jsonify({"status": "success", "message": "Signup successful"}), 201