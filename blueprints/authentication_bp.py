from flask import Blueprint, render_template, request, jsonify, current_app
from utils.auth import login_required, load_users_settings, save_users_settings, generate_token
from utils.users import generate_code
from utils.config import load_config
import logging
import datetime
import json
import bcrypt
import jwt
import requests
import string
import random

# region Blueprint Setup
authentication_bp = Blueprint('authentication_bp', __name__)
# endregion

# region /login GET and POST - User Login
@authentication_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        # Render login.html for GET requests
        return render_template('login.html', title='clubmadeira.io | Login', page_type='login', base_url=request.url_root.rstrip('/'))

    # Handle POST request (login form submission)
    try:
        content_type = request.headers.get('Content-Type', '')
        if 'application/json' in content_type:
            data = request.get_json(silent=True, force=True, cache=False)
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
        logging.debug(f"Raw password before validation: [REDACTED]")
        
        users_settings = load_users_settings()
        user_entry = next(((uid, u) for uid, u in users_settings.items() if u['email_address'].lower() == email), None)
        
        if user_entry:
            user_id, user = user_entry
            logging.debug(f"Stored hash for user {user_id}: [REDACTED]")
            if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
                token = generate_token(user_id, user['permissions'])
                return jsonify({"status": "success", "token": token, "user_id": user_id}), 200  # Changed "userId" to "user_id"
            else:
                logging.debug("Password does not match")
        else:
            logging.debug(f"User not found for email: {email}")
        
        return jsonify({"status": "error", "message": "Invalid credentials"}), 401
    except Exception as e:
        logging.error(f"Login error: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500
# endregion

# region /signup GET - The Holy Grail of New User Entry
@authentication_bp.route('/signup', methods=['GET'])
def signup_page():
    try:
        request_data = {
            "method": request.method,
            "url": request.full_path,
            "headers": dict(request.headers),
            "ip": request.remote_addr,
            "body": "[NO BODY]"
        }
        log_data = request_data.copy()
        if "Authorization" in log_data["headers"]:
            log_data["headers"]["Authorization"] = "[REDACTED]"
        logging.debug(f"Request: {json.dumps(log_data)}")

        response = render_template('signup.html')
        logging.info(f"Signup page rendered successfully")
        return response
    except Exception as e:
        logging.error(f"UX Issue - Failed to render signup page: {str(e)}", exc_info=True)
        response_data = {"status": "error", "message": "Server error"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 500
# endregion

# region /signup POST - Joining the Galactic Crew
@authentication_bp.route('/signup', methods=['POST'])
def signup():
    try:
        request_data = {
            "method": request.method,
            "url": request.full_path,
            "headers": dict(request.headers),
            "ip": request.remote_addr,
            "body": request.get_json(silent=True) or "[NO BODY]"
        }
        log_data = request_data.copy()
        if "Authorization" in log_data["headers"]:
            log_data["headers"]["Authorization"] = "[REDACTED]"
        if isinstance(log_data["body"], dict) and "signup_password" in log_data["body"]:
            log_data["body"]["signup_password"] = "[REDACTED]"
        logging.debug(f"Request: {json.dumps(log_data)}")

        data = request_data["body"]
        required_fields = ['signup_type', 'contact_name', 'signup_email', 'signup_password', 'signup_phone']
        if not all(k in data for k in required_fields):
            logging.warning(f"UX Issue - Signup attempt missing required fields: {json.dumps(data)}")
            response_data = {"status": "error", "message": "Missing required fields"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400
        
        signup_type = data['signup_type']
        contact_name = data['contact_name']
        signup_email = data['signup_email']
        signup_password = data['signup_password']
        signup_phone = data['signup_phone']

        if not signup_phone:
            logging.warning(f"UX Issue - Signup failed for {signup_type} - Phone required")
            response_data = {"status": "error", "message": "Phone required for all users"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400

        users_settings = load_users_settings()
        logging.debug(f"Loaded users: {json.dumps({k: {**v, 'password': '[REDACTED]'} for k, v in users_settings.items()})}")
        if any(u['email_address'].lower() == signup_email.lower() for u in users_settings.values()):
            logging.warning(f"UX Issue - Signup failed - Email already registered: {signup_email}")
            response_data = {"status": "error", "message": "Email already registered"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 409

        user_id = generate_code()
        hashed_password = bcrypt.hashpw(signup_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        permission_map = {'seller': 'merchant', 'community': 'community', 'wixpro': 'wixpro'}
        permission = permission_map.get(signup_type, signup_type)

        otp = ''.join(random.choices(string.digits, k=6))
        signup_expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
        if "signup_codes" not in current_app.config:
            current_app.config["signup_codes"] = {}
        current_app.config["signup_codes"][user_id] = {"code": otp, "expires": signup_expiry.isoformat()}

        users_settings[user_id] = {
            "email_address": signup_email.lower(),
            "contact_name": contact_name,
            "phone_number": signup_phone,
            "password": hashed_password,
            "permissions": [permission]
        }
        save_users_settings(users_settings)
        logging.debug(f"User signed up - User ID: {user_id}, Permission: {permission}")

        sms_payload = {
            "email": signup_email,
            "message": f"clubmadeira.io signup OTP: {otp}. Expires in 15 mins."
        }
        response = requests.post("https://madeira.io/send-sms", json=sms_payload)
        if response.status_code != 200:
            logging.error(f"UX Issue - Failed to send signup OTP - User ID: {user_id}, Response: {response.text}")
            del users_settings[user_id]
            save_users_settings(users_settings)
            response_data = {"status": "error", "message": f"Failed to send SMS: {response.text}"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 500

        logging.info(f"Signup successful for user {user_id}, OTP sent to email {signup_email}")
        response_data = {"status": "success", "message": "User created, please verify OTP"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 201
    except Exception as e:
        logging.error(f"UX Issue - Signup processing error: {str(e)}", exc_info=True)
        response_data = {"status": "error", "message": "Server error"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 500
# endregion

# ASCII Art 1: The Dead Parrot
"""
       ______
      /|_||_\`.__
     (   _    _ _\
     =|  _    _  |  "It's not pining, it's passed on! This parrot is no more!"
      | (_)  (_) |
       \._|\'|\'_./
          |__|__| 
"""

# region /reset-password POST - A New Hope for Forgotten Passwords
@authentication_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        request_data = {
            "method": request.method,
            "url": request.full_path,
            "headers": dict(request.headers),
            "ip": request.remote_addr,
            "body": request.get_json(silent=True) or "[NO BODY]"
        }
        log_data = request_data.copy()
        if "Authorization" in log_data["headers"]:
            log_data["headers"]["Authorization"] = "[REDACTED]"
        logging.debug(f"Request: {json.dumps(log_data)}")

        data = request_data["body"]
        if not data or 'email' not in data:
            logging.warning("UX Issue - Reset password attempt missing email")
            response_data = {"status": "error", "message": "Email is required"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400
        
        email = data.get("email").lower()
        users_settings = load_users_settings()
        logging.debug(f"Loaded users: {json.dumps({k: {**v, 'password': '[REDACTED]'} for k, v in users_settings.items()})}")
        matching_user_id = next((uid for uid, settings in users_settings.items() if settings.get("email_address", "").lower() == email), None)
        
        if not matching_user_id:
            logging.warning(f"UX Issue - Reset password failed - Email not found: {email}")
            response_data = {"status": "error", "message": "Email not found"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 404

        user = users_settings[matching_user_id]
        otp = ''.join(random.choices(string.digits, k=6))
        reset_expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
        if "reset_codes" not in current_app.config:
            current_app.config["reset_codes"] = {}
        current_app.config["reset_codes"][matching_user_id] = {"code": otp, "expires": reset_expiry.isoformat()}
        logging.debug(f"Generated OTP for reset - User ID: {matching_user_id}, OTP: {otp}")

        sms_payload = {
            "email": email,
            "message": f"clubmadeira.io one-time password: {otp}. Expires in 15 mins."
        }
        response = requests.post("https://madeira.io/send-sms", json=sms_payload)

        if response.status_code != 200:
            logging.error(f"UX Issue - Failed to send SMS for reset - User ID: {matching_user_id}, Response: {response.text}")
            response_data = {"status": "error", "message": f"Failed to send SMS: {response.text}"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 500
        
        logging.info(f"SMS sent successfully for password reset - User ID: {matching_user_id}")
        response_data = {"status": "success", "message": "A one-time password has been sent to your phone"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 200
    except Exception as e:
        logging.error(f"UX Issue - Reset password error: {str(e)}", exc_info=True)
        response_data = {"status": "error", "message": "Server error"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 500
# endregion

# region /verify-reset-code POST - The Messiah of Password Recovery
@authentication_bp.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    try:
        request_data = {
            "method": request.method,
            "url": request.full_path,
            "headers": dict(request.headers),
            "ip": request.remote_addr,
            "body": request.get_json(silent=True) or "[NO BODY]"
        }
        log_data = request_data.copy()
        if "Authorization" in log_data["headers"]:
            log_data["headers"]["Authorization"] = "[REDACTED]"
        if isinstance(log_data["body"], dict) and "new_password" in log_data["body"]:
            log_data["body"]["new_password"] = "[REDACTED]"
        logging.debug(f"Request: {json.dumps(log_data)}")

        data = request_data["body"]
        if not data or not isinstance(data, dict) or not all(k in data for k in ['email', 'code', 'new_password']):
            logging.warning(f"UX Issue - Verify reset code missing required fields: {json.dumps(data)}")
            response_data = {"status": "error", "message": "Email, code, and new password are required"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400
        
        email = data.get("email").lower()
        code = data.get("code")
        new_password = data.get("new_password")

        users_settings = load_users_settings()
        logging.debug(f"Loaded users: {json.dumps({k: {**v, 'password': '[REDACTED]'} for k, v in users_settings.items()})}")
        matching_user_id = next((uid for uid, settings in users_settings.items() if settings.get("email_address", "").lower() == email), None)
        
        if not matching_user_id:
            logging.warning(f"UX Issue - Verify reset code failed - Email not found: {email}")
            response_data = {"status": "error", "message": "Email not found"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 404

        stored_reset = current_app.config.get("reset_codes", {}).get(matching_user_id, {})
        stored_code = stored_reset.get("code")
        if not stored_code:
            logging.warning(f"UX Issue - No reset code found for user {matching_user_id}")
            response_data = {"status": "error", "message": "No reset code found for this user"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400

        try:
            expiry = datetime.datetime.fromisoformat(stored_reset.get("expires", "2000-01-01T00:00:00"))
        except (ValueError, TypeError) as e:
            logging.error(f"Security Issue - Invalid reset code expiry format for user {matching_user_id}: {str(e)}", exc_info=True)
            response_data = {"status": "error", "message": "Invalid reset code expiry format"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 500

        if stored_code != code or datetime.datetime.utcnow() > expiry:
            logging.warning(f"Security Issue - Invalid or expired reset code for user {matching_user_id}: {code}")
            response_data = {"status": "error", "message": "Invalid or expired reset code"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400

        user = users_settings[matching_user_id]
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user["password"] = hashed_password
        
        if "verified" not in user.get("permissions", []):
            user["permissions"].append("verified")
        
        save_users_settings(users_settings)
        if matching_user_id in current_app.config.get("reset_codes", {}):
            del current_app.config["reset_codes"][matching_user_id]

        token = generate_token(matching_user_id, user.get("permissions", []))
        logging.info(f"Password reset successful for user {matching_user_id}")
        response_data = {"status": "success", "token": "[REDACTED]", "user_id": matching_user_id}  # Changed "userId" to "user_id"
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify({"status": "success", "token": token, "user_id": matching_user_id}), 200  # Changed "userId" to "user_id"
    except Exception as e:
        logging.error(f"UX Issue - Verify reset code error: {str(e)}", exc_info=True)
        response_data = {"status": "error", "message": "Server error"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 500
# endregion

# region /update-password POST - Changing the Galactic Key
@authentication_bp.route('/update-password', methods=['POST'])
@login_required(["self"], require_all=True)
def update_password():
    try:
        request_data = {
            "method": request.method,
            "url": request.full_path,
            "headers": dict(request.headers),
            "ip": request.remote_addr,
            "body": request.get_json(silent=True) or "[NO BODY]"
        }
        log_data = request_data.copy()
        if "Authorization" in log_data["headers"]:
            log_data["headers"]["Authorization"] = "[REDACTED]"
        if isinstance(log_data["body"], dict) and "password" in log_data["body"]:
            log_data["body"]["password"] = "[REDACTED]"
        logging.debug(f"Request: {json.dumps(log_data)}")

        data = request_data["body"]
        if not data or 'email' not in data or 'password' not in data:
            logging.warning(f"UX Issue - Update password attempt missing email or password: {json.dumps(data)}")
            response_data = {"status": "error", "message": "Email and password required"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400
        
        email = data["email"].strip().lower()
        new_password = data["password"].strip()
        users_settings = load_users_settings()
        logging.debug(f"Loaded users: {json.dumps({k: {**v, 'password': '[REDACTED]'} for k, v in users_settings.items()})}")
        user_id = next((uid for uid, u in users_settings.items() if u["email_address"].lower() == email), None)
        
        if not user_id or user_id != request.user_id:
            logging.warning(f"Security Issue - Unauthorized password update attempt for {email} by {request.user_id}")
            response_data = {"status": "error", "message": "Unauthorized"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 403
        
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        users_settings[user_id]["password"] = hashed_password
        save_users_settings(users_settings)
        logging.info(f"Password updated for user {user_id}")
        response_data = {"status": "success", "message": f"Password updated for {email}", "user_id": user_id}  # Changed "userId" to "user_id"
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 200
    except Exception as e:
        logging.error(f"UX Issue - Update password error: {str(e)}", exc_info=True)
        response_data = {"status": "error", "message": "Server error"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 500
# endregion