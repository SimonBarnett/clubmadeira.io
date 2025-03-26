from flask import Blueprint, jsonify, request, render_template, current_app
from utils.auth import login_user, signup_user, login_required, generate_token  # Added generate_token
from utils.users import load_users_settings, save_users_settings
from utils.config import load_config  # For TextMagic config
import jwt
import datetime
import bcrypt
import random
import string
import requests  # For SMS sending via TextMagic

authentication_bp = Blueprint('authentication', __name__)

@authentication_bp.route('/login', methods=['POST'])
def login():
    return login_user()

@authentication_bp.route('/signup', methods=['GET'])
def signup_page():
    return render_template('signup.html')

@authentication_bp.route('/signup', methods=['POST'])
def signup():
    # Override signup_user() to ensure correct behavior; replace with signup_user() if it aligns
    data = request.get_json()
    signup_type = data.get('signup_type')
    contact_name = data.get('contact_name')
    signup_phone = data.get('signup_phone')
    signup_email = data.get('signup_email')
    signup_password = data.get('signup_password')

    if not all([signup_type, contact_name, signup_email, signup_password]):
        return jsonify({"status": "error", "message": "Missing required fields"}), 400
    if signup_type in ['seller', 'community'] and not signup_phone:
        return jsonify({"status": "error", "message": "Phone required for Merchant/Community"}), 400

    users_settings = load_users_settings()
    # Check if email already exists
    if any(u['email_address'].lower() == signup_email.lower() for u in users_settings.values()):
        return jsonify({"status": "error", "message": "Email already registered"}), 409

    user_id = f"{int(datetime.datetime.utcnow().timestamp())}{random.randint(1000, 9999)}"  # Unique ID
    hashed_password = bcrypt.hashpw(signup_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Map signup_type to permission
    permission_map = {'seller': 'merchant', 'community': 'community', 'wixpro': 'wixpro'}
    permission = permission_map.get(signup_type, signup_type)

    # Save user without "verified" permission
    users_settings[user_id] = {
        "email_address": signup_email.lower(),
        "contact_name": contact_name,
        "phone_number": signup_phone,  # Consistent with reset-password
        "password": hashed_password,
        "permissions": [permission]  # No "verified" yet
    }
    save_users_settings(users_settings)
    return jsonify({"status": "success", "message": "User created, please verify OTP"}), 201

@authentication_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400
        email = data.get("email")
        if not email:
            return jsonify({"status": "error", "message": "Email is required"}), 400

        users_settings = load_users_settings()
        matching_user_id = next((uid for uid, settings in users_settings.items() if settings.get("email_address", "").lower() == email.lower()), None)
        if not matching_user_id:
            return jsonify({"status": "error", "message": "Email not found"}), 404

        user = users_settings[matching_user_id]
        phone_number = user.get("phone_number", "").strip()
        if not phone_number:
            return jsonify({"status": "error", "message": "No phone number associated with this account"}), 400

        otp = ''.join(random.choices(string.digits, k=6))
        reset_expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
        if "reset_codes" not in current_app.config:
            current_app.config["reset_codes"] = {}
        current_app.config["reset_codes"][matching_user_id] = {"code": otp, "expires": reset_expiry.isoformat()}

        config = load_config()
        textmagic_config = config.get("textmagic", {})
        username = textmagic_config.get("USERNAME")
        api_key = textmagic_config.get("API_KEY")
        if not username or not api_key:
            return jsonify({"status": "error", "message": "TextMagic credentials not configured"}), 500

        url = "https://rest.textmagic.com/api/v2/messages"
        payload = {"text": f"clubmadeira.io one-time password: {otp}. Expires in 15 mins.", "phones": phone_number}
        headers = {"X-TM-Username": username, "X-TM-Key": api_key, "Content-Type": "application/x-www-form-urlencoded"}
        response = requests.post(url, data=payload, headers=headers)

        if response.status_code == 201:
            return jsonify({"status": "success", "message": "A one-time password has been sent to your phone"}), 200
        else:
            return jsonify({"status": "error", "message": f"Failed to send SMS: {response.text}"}), 500
    except Exception as e:
        print(f"Error in reset-password endpoint: {str(e)}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@authentication_bp.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    try:
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return jsonify({"status": "error", "message": "Invalid or missing JSON data"}), 400
        email = data.get("email")
        code = data.get("code")
        new_password = data.get("new_password")
        if not all([email, code, new_password]):
            return jsonify({"status": "error", "message": "Email, code, and new password are required"}), 400

        users_settings = load_users_settings()
        matching_user_id = next((uid for uid, settings in users_settings.items() if settings.get("email_address", "").lower() == email.lower()), None)
        if not matching_user_id:
            return jsonify({"status": "error", "message": "Email not found"}), 404

        stored_reset = current_app.config.get("reset_codes", {}).get(matching_user_id, {})
        stored_code = stored_reset.get("code")
        if not stored_code:
            return jsonify({"status": "error", "message": "No reset code found for this user"}), 400

        try:
            expiry = datetime.datetime.fromisoformat(stored_reset.get("expires", "2000-01-01T00:00:00"))
        except (ValueError, TypeError) as e:
            print(f"Error parsing expiry: {str(e)}")
            return jsonify({"status": "error", "message": "Invalid reset code expiry format"}), 500

        if stored_code != code or datetime.datetime.utcnow() > expiry:
            return jsonify({"status": "error", "message": "Invalid or expired reset code"}), 400

        user = users_settings[matching_user_id]
        if bcrypt.checkpw(new_password.encode('utf-8'), user["password"].encode('utf-8')):
            # Signup verification: Add "verified" permission
            permissions = user.get("permissions", [])
            if "verified" not in permissions:
                permissions.append("verified")
                user["permissions"] = permissions
        else:
            # Password reset: Update password
            hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            user["password"] = hashed_password

        save_users_settings(users_settings)
        if matching_user_id in current_app.config.get("reset_codes", {}):
            del current_app.config["reset_codes"][matching_user_id]

        # Generate token with updated permissions
        token = generate_token(matching_user_id, user.get("permissions", []))
        return jsonify({"status": "success", "token": token, "user_id": matching_user_id}), 200
    except Exception as e:
        print(f"Unexpected error in verify-reset-code endpoint: {str(e)}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@authentication_bp.route('/update-password', methods=['POST'])
@login_required(["allauth"], require_all=False)
def update_password():
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({"status": "error", "message": "Email and password required"}), 400
    email = data["email"].strip()
    new_password = data["password"].strip()
    users_settings = load_users_settings()
    user_id = next((uid for uid, u in users_settings.items() if u["email_address"].lower() == email.lower()), None)
    if not user_id or user_id != request.user_id:
        return jsonify({"status": "error", "message": "Unauthorized"}), 403
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    users_settings[user_id]["password"] = hashed_password
    save_users_settings(users_settings)
    return jsonify({"status": "success", "message": f"Password updated for {email}", "user_id": user_id}), 200