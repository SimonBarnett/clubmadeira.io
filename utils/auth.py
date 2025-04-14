
from functools import wraps
from flask import request, jsonify, current_app, url_for, redirect, session
import jwt
import datetime
import bcrypt
import string
import random
import logging
import json
from utils.users import load_users_settings, save_users_settings

def login_required(required_permissions, require_all=True):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = request.headers.get("Authorization", "").replace("Bearer ", "")
            if not token and 'user' in session:
                token = session.get('user', {}).get('token', '')

            if not token:
                logging.warning("Security Issue - No token provided in Authorization header or session, redirecting to /")
                return redirect(url_for('home'))

            try:
                payload = decode_token(token)
                request.user_id = payload["user_id"]
                request.permissions = payload.get("permissions", [])
                effective_perms = []
                for perm in required_permissions:
                    if perm == "allauth":
                        effective_perms.extend(["admin", "merchant", "community", "wixpro"])
                    elif perm == "self":
                        user_id = next((v for v in kwargs.values() if isinstance(v, str)), None)
                        if user_id and request.user_id != user_id:
                            effective_perms.append(None)
                        else:
                            effective_perms.append("self")
                    else:
                        effective_perms.append(perm)
                if require_all:
                    if not all(p in request.permissions for p in effective_perms if p and p != "self"):
                        logging.warning(f"Security Issue - Insufficient permissions for user {request.user_id}: required={effective_perms}, has={request.permissions}")
                        return jsonify({"status": "error", "message": f"Insufficient permissions: {effective_perms}"}), 403
                else:
                    if not any(p in request.permissions for p in effective_perms if p and p != "self"):
                        logging.warning(f"Security Issue - Insufficient permissions for user {request.user_id}: required={effective_perms}, has={request.permissions}")
                        return jsonify({"status": "error", "message": f"Insufficient permissions: {effective_perms}"}), 403
                return f(*args, **kwargs)
            except jwt.InvalidTokenError:
                logging.error("Security Issue - Invalid token provided, redirecting to /", exc_info=True)
                return redirect(url_for('home'))
            except Exception as e:
                logging.error(f"UX Issue - Token processing error: {str(e)}", exc_info=True)
                return jsonify({"status": "error", "message": f"Token error: {str(e)}"}), 500
        return decorated_function
    return decorator

def login_user():
    try:
        data = request.get_json()
        if not data or 'email' not in data or 'password' not in data:
            logging.warning("UX Issue - Login attempt with missing email or password")
            return jsonify({"status": "error", "message": "Email and password required"}), 400
        email = data["email"].strip().lower()
        users_settings = load_users_settings()

        user_id = None
        user = None
        for uid, settings in users_settings.items():
            if settings.get("email_address", "").lower() == email:
                try:
                    if bcrypt.checkpw(data["password"].encode('utf-8'), settings["password"].encode('utf-8')):
                        user_id = uid
                        user = settings
                        break
                except Exception as e:
                    logging.error(f"Security Issue - Password verification failed for email {email}: {str(e)}", exc_info=True)
                    return jsonify({"status": "error", "message": "Invalid password format in user data"}), 500

        if not user_id:
            logging.warning(f"Security Issue - Login failed, no user found for email: {email}")
            return jsonify({"status": "error", "message": "Invalid credentials"}), 401

        permissions = user.get("permissions", [])
        token = generate_token(user_id, permissions)
        
        # Store user_id and token in session
        session['user_id'] = user_id
        session['user'] = {'token': token}

        redirect_url = None
        if "admin" in permissions:
            redirect_url = url_for('role_pages.admin')
        elif "merchant" in permissions:
            redirect_url = url_for('role_pages.merchant')
        elif "community" in permissions:
            redirect_url = url_for('role_pages.community')
        elif "wixpro" in permissions:
            redirect_url = url_for('role_pages.wixpro')
        else:
            redirect_url = url_for('home')

        response_data = {
            "status": "success",
            "token": "[REDACTED]",
            "user_id": user_id,
            "contact_name": user.get("contact_name", "User"),
            "redirect_url": redirect_url
        }
        logging.debug(f"Login response for user {user_id}: {json.dumps(response_data)}")
        return jsonify({"status": "success", "token": token, "user_id": user_id, "contact_name": user.get("contact_name", "User"), "redirect_url": redirect_url}), 200
    except Exception as e:
        logging.error(f"UX Issue - Login processing error: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
    
def signup_user():
    data = request.get_json()
    required_fields = ['signup_type', 'contact_name', 'signup_email', 'signup_password']
    if not all(k in data for k in required_fields):
        logging.warning(f"UX Issue - Signup failed, missing fields: {required_fields}")
        return jsonify({"status": "error", "message": "Signup type, contact name, email, and password are required"}), 400

    signup_type = data['signup_type']
    signup_phone = data.get('signup_phone')
    if signup_type in ['community', 'seller'] and (signup_phone is None or signup_phone == ''):
        logging.warning(f"UX Issue - Signup failed for {signup_type}, phone required")
        return jsonify({"status": "error", "message": "Phone number is required for Community Group and Merchant signups"}), 400

    if signup_phone:
        import re
        if not re.match(r'^\d{10}$', signup_phone):
            logging.warning(f"UX Issue - Signup failed, invalid phone format: {signup_phone}")
            return jsonify({"status": "error", "message": "Phone number must be a 10-digit number with no spaces or special characters"}), 400

    users_settings = load_users_settings()
    if any(u['email_address'] == data['signup_email'] for u in users_settings.values()):
        logging.warning(f"UX Issue - Signup failed, email exists: {data['signup_email']}")
        return jsonify({"status": "error", "message": "Email exists"}), 400

    USERid = generate_code()
    hashed_password = bcrypt.hashpw(data['signup_password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    users_settings[USERid] = {
        "email_address": data['signup_email'],
        "password": hashed_password,
        "contact_name": data['contact_name'],
        "phone_number": signup_phone,
        "permissions": [data['signup_type']]
    }
    save_users_settings(users_settings)
    logging.debug(f"User signed up - User ID: {USERid}, Type: {signup_type}")
    return jsonify({"status": "success", "message": "Signup successful"}), 201

def generate_token(user_id, permissions, x_role=None):
    payload = {
        "user_id": user_id,
        "permissions": permissions,
        "exp": int(datetime.datetime.utcnow().timestamp() + (24 * 3600))
    }
    if x_role:
        payload["x-role"] = x_role
    token = jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm="HS256")
    logging.debug(f"Generated token for user {user_id} with x-role {x_role}: [REDACTED]")
    return token

def decode_token(token):
    try:
        payload = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=["HS256"])
        if datetime.datetime.utcnow().timestamp() > payload["exp"]:
            logging.warning(f"Security Issue - Token expired for user: {payload.get('user_id')}")
            raise jwt.InvalidTokenError("Token expired")
        logging.debug(f"Decoded token for user {payload['user_id']}")
        return payload
    except jwt.InvalidTokenError as e:
        logging.error(f"Security Issue - Invalid token: {str(e)}", exc_info=True)
        raise

def generate_code():
    charset = string.digits + string.ascii_uppercase
    code = ''.join(random.choice(charset) for _ in range(7))
    total = sum(charset.index(c) for c in code)
    checksum = charset[total % 36]
    return code + checksum