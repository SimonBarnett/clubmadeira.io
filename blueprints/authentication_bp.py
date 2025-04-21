from flask import Blueprint, render_template, request, jsonify, current_app, session
from utils.auth import login_required, load_users_settings, save_users_settings, generate_token
from utils.users import generate_code
from utils.config import load_config
import logging
import datetime
import json
import bcrypt
import jwt
import hashlib
import random
import string
import requests
import stripe

# Blueprint Setup
authentication_bp = Blueprint('authentication_bp', __name__)

# /login GET and POST - User Login
@authentication_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template('login.html', title='clubmadeira.io | Login', page_type='login', base_url=request.url_root.rstrip('/'), publishable_key=current_app.config.get('STRIPE_PUBLISHABLE_KEY', ''))

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
                session['user'] = {'user_id': user_id, 'permissions': user['permissions'], 'token': token, 'x-role': next((r for r in ['admin', 'merchant', 'community', 'partner'] if r in user['permissions']), 'user')}
                session.modified = True
                response = jsonify({"status": "success", "token": token, "user_id": user_id, "redirect": "/"})
                response.set_cookie('authToken', token, secure=True, max_age=604800, path='/')
                return response, 200
            else:
                logging.debug("Password does not match")
        else:
            logging.debug(f"User not found for email: {email}")
        
        return jsonify({"status": "error", "message": "Invalid credentials"}), 401
    except Exception as e:
        logging.error(f"Login error: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500

# /signup GET - The Holy Grail of New User Entry
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

        response = render_template('login.html', title='clubmadeira.io | Signup', page_type='signup', base_url=request.url_root.rstrip('/'), publishable_key=current_app.config.get('STRIPE_PUBLISHABLE_KEY', ''))
        logging.info(f"Signup page rendered successfully")
        return response
    except Exception as e:
        logging.error(f"UX Issue - Failed to render signup page: {str(e)}", exc_info=True)
        response_data = {"status": "error", "message": "Server error"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 500

# /signup POST - Joining the Galactic Crew
@authentication_bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json(silent=True) or {}
        logging.debug(f"Received signup request: {json.dumps(data)}")

        required_fields = ['signup_type', 'contact_name', 'signup_email', 'signup_phone']
        missing_fields = [field for field in required_fields if field not in data or not str(data[field]).strip()]
        if missing_fields:
            error_msg = f"Missing or empty required fields: {', '.join(missing_fields)}"
            logging.warning(error_msg)
            return jsonify({"status": "error", "message": error_msg}), 400

        # Basic validation
        signup_type = data['signup_type'].strip()
        if signup_type not in ['seller', 'community', 'partner']:
            return jsonify({"status": "error", "message": "Invalid signup type"}), 400

        signup_phone = data['signup_phone'].strip()
        if not signup_phone.isdigit() or len(signup_phone) < 10:
            return jsonify({"status": "error", "message": "Invalid phone number"}), 400

        signup_email = data['signup_email'].strip().lower()
        if '@' not in signup_email or '.' not in signup_email:
            return jsonify({"status": "error", "message": "Invalid email format"}), 400

        # Proceed with signup logic (e.g., Stripe integration, user creation)
        logging.info(f"Signup successful for {signup_email}")
        return jsonify({"status": "success", "message": "Signup initiated"}), 200

    except Exception as e:
        logging.error(f"Signup error: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500
def stripe_return():
    try:
        site_settings = load_config()
        stripe.api_key = site_settings.get('stripe', {}).get('API_KEY')
        account_id = request.args.get('account_id')
        signup_data = session.get('signup_data', {})
        if not account_id or not signup_data or signup_data['stripe_account_id'] != account_id:
            logging.warning(f"Invalid or missing account_id: {account_id}")
            response_data = {"status": "error", "message": "Invalid session or account"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400

        account = stripe.Account.retrieve(account_id)
        is_complete = account.get('charges_enabled', False) or account.get('payouts_enabled', False)
        
        if is_complete:
            users_settings = load_users_settings()
            user_id = signup_data['temp_user_id']
            users_settings[user_id] = {
                'email_address': account.get('email', signup_data['email_address']),
                'contact_name': account.get('business_profile', {}).get('name', signup_data['contact_name']),
                'phone_number': account.get('phone_number', signup_data['phone_number']).lstrip('+44'),
                'password': signup_data['hashed_password'],
                'permissions': signup_data['permissions'],
                'stripe_account_id': account_id
            }
            save_users_settings(users_settings)

            otp = ''.join(random.choices(string.digits, k=4))
            otp_hash = hashlib.sha256(otp.encode()).hexdigest()
            otp_token = jwt.encode({
                'email': users_settings[user_id]['email_address'],
                'otp_hash': otp_hash,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
            }, site_settings.get('jwt', {}).get('SECRET_KEY'), algorithm='HS256')

            try:
                send_otp_via_sms(users_settings[user_id]['phone_number'], otp)
            except Exception as e:
                logging.error(f"Failed to send OTP: {str(e)}")
                del users_settings[user_id]
                save_users_settings(users_settings)
                response_data = {"status": "error", "message": f"Failed to send SMS: {str(e)}"}
                logging.debug(f"Response: {json.dumps(response_data)}")
                return jsonify(response_data), 500

            session['otp_token'] = otp_token
            session['user'] = {'user_id': user_id, 'permissions': users_settings[user_id]['permissions'], 'x-role': signup_data['signup_type']}
            session.pop('signup_data', None)
            session.modified = True
            logging.info(f"Stripe onboarding complete for user {user_id}, OTP sent to {users_settings[user_id]['phone_number']}")
            return render_template('login.html', title='clubmadeira.io | Verify OTP', show_otp_verify=True, publishable_key=site_settings.get('stripe', {}).get('PUBLISHABLE_KEY'))
        else:
            logging.info(f"Account {account_id} incomplete, no user data created")
            response_data = {"status": "error", "message": "Onboarding incomplete, please retry"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400

    except stripe.error.StripeError as e:
        logging.error(f"Stripe error: {str(e)}")
        response_data = {"status": "error", "message": f"Stripe error: {str(e)}"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 400
    except Exception as e:
        logging.error(f"Stripe return error: {str(e)}", exc_info=True)
        response_data = {"status": "error", "message": "Server error"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 500

# /verify-signup-otp POST - Verify OTP and Set Password for Signup
@authentication_bp.route('/verify-signup-otp', methods=['POST'])
def verify_signup_otp():
    try:
        site_settings = load_config()
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
        if not data or not isinstance(data, dict) or not all(k in data for k in ['email', 'otp', 'otp_token', 'new_password']):
            logging.warning(f"UX Issue - Verify signup OTP missing required fields: {json.dumps(data)}")
            response_data = {"status": "error", "message": "Email, OTP, token, and new password are required"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400
        
        email = data['email'].lower()
        otp = data['otp']
        otp_token = data['otp_token']
        new_password = data['new_password'].strip()

        try:
            payload = jwt.decode(otp_token, site_settings.get('jwt', {}).get('SECRET_KEY'), algorithms=['HS256'])
            if payload['email'] != email:
                logging.warning(f"Security Issue - Email mismatch: provided {email}, stored {payload['email']}")
                response_data = {"status": "error", "message": "Email mismatch"}
                logging.debug(f"Response: {json.dumps(response_data)}")
                return jsonify(response_data), 400
            stored_otp_hash = payload['otp_hash']
        except jwt.ExpiredSignatureError:
            logging.warning("Security Issue - OTP token expired")
            response_data = {"status": "error", "message": "OTP expired"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400
        except jwt.InvalidTokenError:
            logging.warning("Security Issue - Invalid OTP token")
            response_data = {"status": "error", "message": "Invalid token"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400

        entered_otp_hash = hashlib.sha256(otp.encode()).hexdigest()
        if entered_otp_hash != stored_otp_hash:
            logging.warning("Security Issue - Invalid OTP")
            response_data = {"status": "error", "message": "Invalid OTP"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400

        users_settings = load_users_settings()
        matching_user_id = next((uid for uid, settings in users_settings.items() if settings.get("email_address", "").lower() == email), None)
        if not matching_user_id:
            logging.warning(f"UX Issue - User not found for email: {email}")
            response_data = {"status": "error", "message": "User not found"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 404

        user = users_settings[matching_user_id]
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user['password'] = hashed_password
        if 'verified' not in user['permissions']:
            user['permissions'].append('verified')
        save_users_settings(users_settings)

        permissions = user['permissions']
        x_role = 'admin' if 'admin' in permissions else next((r for r in ['merchant', 'community', 'partner'] if r in permissions), 'user')
        token = generate_token(matching_user_id, permissions, x_role=x_role)
        session['user'] = {'user_id': matching_user_id, 'permissions': permissions, 'token': token, 'x-role': x_role}
        session.pop('otp_token', None)
        session.modified = True
        response = jsonify({"status": "success", "message": "Signup complete", "token": token, "user_id": matching_user_id, "redirect": "/"})
        response.set_cookie('authToken', token, secure=True, max_age=604800, path='/')
        logging.info(f"Signup OTP verified and password set for user {matching_user_id}")
        logging.debug(f"Response: {json.dumps(response.get_json())}")
        return response, 200

    except Exception as e:
        logging.error(f"UX Issue - Verify signup OTP error: {str(e)}", exc_info=True)
        response_data = {"status": "error", "message": "Server error"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 500

# /link-stripe POST - Allow Partner and Admin to Link Stripe Account
@authentication_bp.route('/link-stripe', methods=['POST'])
@login_required(['partner', 'admin'])
def link_stripe():
    try:
        site_settings = load_config()
        stripe.api_key = site_settings.get('stripe', {}).get('API_KEY')
        user_id = request.user_id
        users_settings = load_users_settings()
        user = users_settings.get(user_id)
        if not user:
            logging.warning(f"User not found: {user_id}")
            response_data = {"status": "error", "message": "User not found"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 404

        if user.get('stripe_account_id'):
            logging.warning(f"User {user_id} already has Stripe account")
            response_data = {"status": "error", "message": "Stripe account already linked"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400

        account = stripe.Account.create(
            type='express',
            email=user['email_address'],
            business_profile={'name': user['contact_name'], 'url': ''},
            phone_number=f"+44{user['phone_number']}",  # Pre-populate with UK country code
            capabilities={'transfers': {'requested': True}}
        )
        account_link = stripe.AccountLink.create(
            account=account.id,
            refresh_url='https://clubmadeira.io/refresh',
            return_url='https://clubmadeira.io/stripe-return',
            type='account_onboarding'
        )
        user['stripe_account_id'] = account.id
        save_users_settings(users_settings)
        logging.info(f"Stripe account linked for user {user_id}")
        response_data = {"status": "success", "account_link": account_link.url, "redirect": "/"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 200

    except stripe.error.StripeError as e:
        logging.error(f"Stripe error: {str(e)}")
        response_data = {"status": "error", "message": f"Stripe error: {str(e)}"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 400
    except Exception as e:
        logging.error(f"Link Stripe error: {str(e)}", exc_info=True)
        response_data = {"status": "error", "message": "Server error"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 500

# /reset-password POST - A New Hope for Forgotten Passwords
#       ______
#      /|_||_\`.__
#     (   _    _ _\
#     =|  _    _  |  "It's not pining, it's passed on! This parrot is no more!"
#      | (_)  (_) |
#       \._|\'|\'_./
#          |__|__| 
@authentication_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        site_settings = load_config()
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

        otp = ''.join(random.choices(string.digits, k=4))
        otp_hash = hashlib.sha256(otp.encode()).hexdigest()
        otp_token = jwt.encode({
            'email': email,
            'otp_hash': otp_hash,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
        }, site_settings.get('jwt', {}).get('SECRET_KEY'), algorithm='HS256')

        try:
            send_otp_via_sms(users_settings[matching_user_id]['phone_number'], otp)
        except Exception as e:
            logging.error(f"Failed to send OTP: {str(e)}")
            response_data = {"status": "error", "message": f"Failed to send SMS: {str(e)}"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 500

        logging.info(f"OTP generated and token created for user {matching_user_id}")
        response_data = {"status": "success", "message": "OTP sent successfully", "otp_token": otp_token}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 200
    except Exception as e:
        logging.error(f"UX Issue - Reset password error: {str(e)}", exc_info=True)
        response_data = {"status": "error", "message": "Server error"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 500

def send_otp_via_sms(phone_number, otp):
    """
    Sends an OTP via SMS to the specified phone number using TextMagic's API.

    Args:
        phone_number (str): The recipient's phone number.
        otp (str): The one-time password to send.

    Raises:
        Exception: If TextMagic credentials are not configured or if the SMS fails to send.
    """
    try:
        site_settings = load_config()
        username = site_settings.get('textmagic', {}).get('USERNAME')
        api_key = site_settings.get('textmagic', {}).get('API_KEY')

        if not username or not api_key:
            logging.error("TextMagic credentials not configured")
            raise Exception("TextMagic credentials not configured")

        message = f"Your OTP for clubmadeira.io is {otp}"
        url = "https://rest.textmagic.com/api/v2/messages"
        payload = {"text": message, "phones": f"+44{phone_number}"}
        headers = {
            "X-TM-Username": username,
            "X-TM-Key": api_key,
            "Content-Type": "application/x-www-form-urlencoded"
        }

        logging.info(f"Sending OTP {otp} to +44{phone_number} via SMS")
        response = requests.post(url, data=payload, headers=headers)
        
        if response.status_code != 201:
            logging.error(f"Failed to send SMS to +44{phone_number}: {response.text}")
            raise Exception(f"Failed to send SMS: {response.text}")

        logging.info(f"SMS sent successfully to +44{phone_number}")
    except requests.exceptions.RequestException as e:
        logging.error(f"Error sending SMS to +44{phone_number}: {str(e)}")
        raise Exception(f"Error sending SMS: {str(e)}")
    except Exception as e:
        logging.error(f"Unexpected error sending SMS to +44{phone_number}: {str(e)}")
        raise

# /verify-reset-code POST - The Messiah of Password Recovery
#       .-""""""""-.
#     .'          '.
#    /   ʕ ˵• ₒ •˵ ʔ  \
#  : ,          , ' :
#   `. ,          , .'
#     `._         _.' 
#        `"'"""""'"` 
@authentication_bp.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    try:
        site_settings = load_config()
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
        if not data or not isinstance(data, dict) or not all(k in data for k in ['email', 'otp', 'otp_token', 'new_password']):
            logging.warning(f"UX Issue - Verify reset code missing required fields: {json.dumps(data)}")
            response_data = {"status": "error", "message": "Email, OTP, token, and new password are required"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400
        
        email = data.get("email").lower()
        otp = data.get("otp")
        otp_token = data.get("otp_token")
        new_password = data.get("new_password").strip()

        try:
            payload = jwt.decode(otp_token, site_settings.get('jwt', {}).get('SECRET_KEY'), algorithms=['HS256'])
            if payload['email'] != email:
                logging.warning(f"Security Issue - Email mismatch: provided {email}, stored {payload['email']}")
                response_data = {"status": "error", "message": "Email mismatch"}
                logging.debug(f"Response: {json.dumps(response_data)}")
                return jsonify(response_data), 400
            stored_otp_hash = payload['otp_hash']
        except jwt.ExpiredSignatureError:
            logging.warning("Security Issue - Token expired")
            response_data = {"status": "error", "message": "Token expired"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400
        except jwt.InvalidTokenError:
            logging.warning("Security Issue - Invalid token")
            response_data = {"status": "error", "message": "Invalid token"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400

        entered_otp_hash = hashlib.sha256(otp.encode()).hexdigest()
        if entered_otp_hash != stored_otp_hash:
            logging.warning("Security Issue - Invalid OTP")
            response_data = {"status": "error", "message": "Invalid OTP"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400

        users_settings = load_users_settings()
        matching_user_id = next((uid for uid, settings in users_settings.items() if settings.get("email_address", "").lower() == email), None)
        if not matching_user_id:
            logging.warning(f"UX Issue - User not found for email: {email}")
            response_data = {"status": "error", "message": "User not found"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 404

        user = users_settings[matching_user_id]
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user["password"] = hashed_password
        
        if "verified" not in user.get("permissions", []):
            user["permissions"].append("verified")
        
        save_users_settings(users_settings)
        logging.info(f"Password reset successful for user {matching_user_id}")

        permissions = user['permissions']
        x_role = 'admin' if 'admin' in permissions else next((r for r in ['merchant', 'community', 'partner'] if r in permissions), 'user')
        token = generate_token(matching_user_id, permissions, x_role=x_role)
        session['user'] = {
            'user_id': matching_user_id,
            'permissions': permissions,
            'token': token,
            'x-role': x_role
        }
        session.modified = True
        response = jsonify({
            "status": "success",
            "message": "Password reset successful",
            "token": token,
            "x-role": x_role,
            "user_id": matching_user_id,
            "redirect": "/"
        })
        response.set_cookie('authToken', token, secure=True, max_age=604800, path='/')
        logging.debug(f"Response: {json.dumps(response.get_json())}")
        return response, 200

    except Exception as e:
        logging.error(f"UX Issue - Verify reset code error: {str(e)}", exc_info=True)
        response_data = {"status": "error", "message": "Server error"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 500

# /update-password POST - Changing the Galactic Key
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
        if isinstance(log_data["body"], dict) and "new_password" in log_data["body"]:
            log_data["body"]["new_password"] = "[REDACTED]"
        logging.debug(f"Request: {json.dumps(log_data)}")

        data = request_data["body"]
        if not data or 'current_password' not in data or 'new_password' not in data:
            logging.warning("UX Issue - Update password attempt missing current_password or new_password")
            response_data = {"status": "error", "message": "Current password and new password are required"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400

        current_password = data["current_password"].strip()
        new_password = data["new_password"].strip()

        users_settings = load_users_settings()
        user_id = request.user_id
        user = users_settings.get(user_id)
        if not user:
            logging.warning(f"Security Issue - User {user_id} not found")
            response_data = {"status": "error", "message": "User not found"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 404

        if not bcrypt.checkpw(current_password.encode('utf-8'), user["password"].encode('utf-8')):
            logging.warning(f"Security Issue - Current password incorrect for user {user_id}")
            response_data = {"status": "error", "message": "Current password is incorrect"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 403

        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        users_settings[user_id]["password"] = hashed_password
        save_users_settings(users_settings)
        logging.info(f"Password updated for user {user_id}")
        response_data = {"status": "success", "message": "Password updated successfully", "redirect": "/"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 200
    except Exception as e:
        logging.error(f"UX Issue - Update password error: {str(e)}", exc_info=True)
        response_data = {"status": "error", "message": "Server error"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 500

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