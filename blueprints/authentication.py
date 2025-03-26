from flask import Blueprint, request, jsonify, render_template, current_app
from utils.auth import login_user, generate_token, login_required  # Added login_required import
from utils.users import load_users_settings, save_users_settings
import datetime
import random
import string
import bcrypt
import requests
import logging
import json

authentication_bp = Blueprint('authentication', __name__)

def login():
    return login_user()

@authentication_bp.route('/signup', methods=['GET'])
def signup_page():
    try:
        return render_template('signup.html')
    except Exception as e:
        logging.error(f"UX Issue - Failed to render signup page: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500

@authentication_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    signup_type = data.get('signup_type')
    contact_name = data.get('contact_name')
    signup_phone = data.get('signup_phone')
    signup_email = data.get('signup_email')
    signup_password = data.get('signup_password')

    if not all([signup_type, contact_name, signup_email, signup_password]):
        logging.warning(f"UX Issue - Signup attempt missing required fields: {json.dumps(data)}")
        return jsonify({"status": "error", "message": "Missing required fields"}), 400
    if signup_type in ['seller', 'community'] and not signup_phone:
        logging.warning(f"UX Issue - Signup failed for {signup_type} - Phone required")
        return jsonify({"status": "error", "message": "Phone required for Merchant/Community"}), 400

    users_settings = load_users_settings()
    if any(u['email_address'].lower() == signup_email.lower() for u in users_settings.values()):
        logging.warning(f"UX Issue - Signup failed - Email already registered: {signup_email}")
        return jsonify({"status": "error", "message": "Email already registered"}), 409

    user_id = f"{int(datetime.datetime.utcnow().timestamp())}{random.randint(1000, 9999)}"
    hashed_password = bcrypt.hashpw(signup_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    permission_map = {'seller': 'merchant', 'community': 'community', 'wixpro': 'wixpro'}
    permission = permission_map.get(signup_type, signup_type)

    users_settings[user_id] = {
        "email_address": signup_email.lower(),
        "contact_name": contact_name,
        "phone_number": signup_phone,
        "password": hashed_password,
        "permissions": [permission]
    }
    save_users_settings(users_settings)
    logging.debug(f"User signed up - User ID: {user_id}, Permission: {permission}")
    return jsonify({"status": "success", "message": "User created, please verify OTP"}), 201

@authentication_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        if not data:
            logging.warning("UX Issue - Reset password attempt with no data")
            return jsonify({"status": "error", "message": "No data provided"}), 400
        email = data.get("email")
        if not email:
            logging.warning("UX Issue - Reset password attempt missing email")
            return jsonify({"status": "error", "message": "Email is required"}), 400

        users_settings = load_users_settings()
        matching_user_id = next((uid for uid, settings in users_settings.items() if settings.get("email_address", "").lower() == email.lower()), None)
        if not matching_user_id:
            logging.warning(f"UX Issue - Reset password failed - Email not found: {email}")
            return jsonify({"status": "error", "message": "Email not found"}), 404

        user = users_settings[matching_user_id]
        phone_number = user.get("phone_number", "").strip()
        if not phone_number:
            logging.warning(f"UX Issue - Reset password failed for {email} - No phone number")
            return jsonify({"status": "error", "message": "No phone number associated with this account"}), 400

        otp = ''.join(random.choices(string.digits, k=6))
        reset_expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
        if "reset_codes" not in current_app.config:
            current_app.config["reset_codes"] = {}
        current_app.config["reset_codes"][matching_user_id] = {"code": otp, "expires": reset_expiry.isoformat()}
        logging.debug(f"Generated OTP for reset - User ID: {matching_user_id}, OTP: {otp}")

        from utils.config import load_config
        config = load_config()
        textmagic_config = config.get("textmagic", {})
        username = textmagic_config.get("USERNAME")
        api_key = textmagic_config.get("API_KEY")
        if not username or not api_key:
            logging.error("Security Issue - TextMagic credentials not configured")
            return jsonify({"status": "error", "message": "TextMagic credentials not configured"}), 500

        url = "https://rest.textmagic.com/api/v2/messages"
        payload = {"text": f"clubmadeira.io one-time password: {otp}. Expires in 15 mins.", "phones": phone_number}
        headers = {"X-TM-Username": username, "X-TM-Key": api_key, "Content-Type": "application/x-www-form-urlencoded"}
        response = requests.post(url, data=payload, headers=headers)

        if response.status_code != 201:
            logging.error(f"UX Issue - Failed to send SMS for reset - User ID: {matching_user_id}, Response: {response.text}")
            return jsonify({"status": "error", "message": f"Failed to send SMS: {response.text}"}), 500
        return jsonify({"status": "success", "message": "A one-time password has been sent to your phone"}), 200
    except Exception as e:
        logging.error(f"UX Issue - Reset password error: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@authentication_bp.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    try:
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            logging.warning("UX Issue - Verify reset code attempt with invalid JSON")
            return jsonify({"status": "error", "message": "Invalid or missing JSON data"}), 400
        email = data.get("email")
        code = data.get("code")
        new_password = data.get("new_password")
        if not all([email, code, new_password]):
            logging.warning(f"UX Issue - Verify reset code missing required fields: {json.dumps(data)}")
            return jsonify({"status": "error", "message": "Email, code, and new password are required"}), 400

        users_settings = load_users_settings()
        matching_user_id = next((uid for uid, settings in users_settings.items() if settings.get("email_address", "").lower() == email.lower()), None)
        if not matching_user_id:
            logging.warning(f"UX Issue - Verify reset code failed - Email not found: {email}")
            return jsonify({"status": "error", "message": "Email not found"}), 404

        stored_reset = current_app.config.get("reset_codes", {}).get(matching_user_id, {})
        stored_code = stored_reset.get("code")
        if not stored_code:
            logging.warning(f"UX Issue - No reset code found for user {matching_user_id}")
            return jsonify({"status": "error", "message": "No reset code found for this user"}), 400

        try:
            expiry = datetime.datetime.fromisoformat(stored_reset.get("expires", "2000-01-01T00:00:00"))
        except (ValueError, TypeError) as e:
            logging.error(f"Security Issue - Invalid reset code expiry format for user {matching_user_id}: {str(e)}", exc_info=True)
            return jsonify({"status": "error", "message": "Invalid reset code expiry format"}), 500

        if stored_code != code or datetime.datetime.utcnow() > expiry:
            logging.warning(f"Security Issue - Invalid or expired reset code for user {matching_user_id}: {code}")
            return jsonify({"status": "error", "message": "Invalid or expired reset code"}), 400

        user = users_settings[matching_user_id]
        if bcrypt.checkpw(new_password.encode('utf-8'), user["password"].encode('utf-8')):
            permissions = user.get("permissions", [])
            if "verified" not in permissions:
                permissions.append("verified")
                user["permissions"] = permissions
        else:
            hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            user["password"] = hashed_password

        save_users_settings(users_settings)
        if matching_user_id in current_app.config.get("reset_codes", {}):
            del current_app.config["reset_codes"][matching_user_id]

        token = generate_token(matching_user_id, user.get("permissions", []))
        response_data = {"status": "success", "token": "[REDACTED]", "user_id": matching_user_id}
        logging.debug(f"Reset code verified - User ID: {matching_user_id}, Response: {json.dumps(response_data)}")
        return jsonify({"status": "success", "token": token, "user_id": matching_user_id}), 200
    except Exception as e:
        logging.error(f"UX Issue - Verify reset code error: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@authentication_bp.route('/update-password', methods=['POST'])
@login_required(["allauth"], require_all=False)
def update_password():
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data:
        logging.warning(f"UX Issue - Update password attempt missing email or password: {json.dumps(data)}")
        return jsonify({"status": "error", "message": "Email and password required"}), 400
    email = data["email"].strip()
    new_password = data["password"].strip()
    users_settings = load_users_settings()
    user_id = next((uid for uid, u in users_settings.items() if u["email_address"].lower() == email.lower()), None)
    if not user_id or user_id != request.user_id:
        logging.warning(f"Security Issue - Unauthorized password update attempt for {email} by {request.user_id}")
        return jsonify({"status": "error", "message": "Unauthorized"}), 403
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    users_settings[user_id]["password"] = hashed_password
    save_users_settings(users_settings)
    logging.debug(f"Password updated for user {user_id}")
    return jsonify({"status": "success", "message": f"Password updated for {email}", "user_id": user_id}), 200