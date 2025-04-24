# ~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~
#      .-"""-.          A friendly face to greet our users!
#     /       \
#    |  O   O  |
#    |   \_/   |
#     \       /
#      `-...-`
# ~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~

from flask import Blueprint, render_template, request, jsonify, current_app, session, redirect, url_for
from utils.auth import login_required, load_users_settings, save_users_settings, generate_token, decode_token, login_user, signup_user, generate_code
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

# Helper Function for Phone Number Formatting
def format_phone_for_storage(phone):
    """
    Formats the phone number for storage by removing leading '0' or '+44'.
    
    - Input: '07989389179' -> Output: '7989389179'
    - Input: '+447989389179' -> Output: '7989389179'
    - Input: '7989389179' -> Output: '7989389179'
    
    This ensures consistency in storage, while allowing correct formatting for Stripe and OTP.
    """
    if phone.startswith('0'):
        return phone[1:]
    elif phone.startswith('+44'):
        return phone[3:]
    else:
        return phone  # Assume it's already without leading 0

# /login GET and POST - User Login
@authentication_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template('login.html', title='clubmadeira.io | Login', page_type='login', base_url=request.url_root.rstrip('/'), publishable_key=current_app.config.get('STRIPE_PUBLISHABLE_KEY', ''))

    # Use login_user from utils.auth for POST requests
    return login_user()

# /signup GET - Render Signup Page
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
        logging.info("Signup page rendered successfully")
        return response
    except Exception as e:
        logging.error(f"UX Issue - Failed to render signup page: {str(e)}", exc_info=True)
        response_data = {"status": "error", "message": "Server error"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 500

# /signup POST - Handle User Signup
@authentication_bp.route('/signup', methods=['POST'])
def signup():
    # Use signup_user from utils.auth
    return signup_user()

# /stripe_RETURN GET - Handle Stripe Onboarding Return
@authentication_bp.route('/stripe-return', methods=['GET'])
def stripe_return():
    signup_data = session.get('signup_data', {})
    if not signup_data:
        return redirect('/')
    account_id = signup_data['stripe_account_id']
    account = stripe.Account.retrieve(account_id)
    if account.get('charges_enabled', False) or account.get('payouts_enabled', False):
        session['signup_data'].update({
            'email': account.get('email'),
        })
        if signup_data['signup_type'] == 'community':
            individual = account.get('individual', {})
            session['signup_data'].update({
                'first_name': individual.get('first_name'),
                'last_name': individual.get('last_name'),
                'phone': individual.get('phone'),
                'dob': individual.get('dob'),
                'address': individual.get('address'),
                'ssn_last_4': individual.get('ssn_last_4'),
            })
        elif signup_data['signup_type'] == 'seller':
            company = account.get('company', {})
            session['signup_data'].update({
                'company_name': company.get('name'),
                'phone': company.get('phone'),
                'tax_id': company.get('tax_id'),
                'address': company.get('address'),
            })
        session.modified = True
        return redirect('/complete-signup')
    return redirect('/')

# /complete-signup GET and POST - Complete Signup After Stripe
@authentication_bp.route('/complete-signup', methods=['GET', 'POST'])
def complete_signup():
    """Handle password setup after Stripe onboarding to complete user account creation."""
    if 'signup_data' not in session:
        logging.warning("Missing signup_data in session for complete-signup")
        return redirect('/')

    if request.method == 'GET':
        return render_template('set_password.html', title='clubmadeira.io | Set Password')

    if request.method == 'POST':
        try:
            data = request.form.to_dict()
            if not data or 'password' not in data:
                logging.warning("Missing password in complete-signup request")
                return jsonify({"status": "error", "message": "Password is required"}), 400

            password = data['password'].strip()
            if not password:
                return jsonify({"status": "error", "message": "Password cannot be empty"}), 400

            # Retrieve and clear temporary signup data from session
            signup_data = session.pop('signup_data')
            permissions = signup_data['permissions']
            stripe_account_id = signup_data['stripe_account_id']
            signup_type = signup_data['signup_type']

            # Generate a permanent user ID using generate_code from utils.auth
            user_id = generate_code()

            # Hash the password
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

            # Prepare user data with information from Stripe
            user_data = {
                'email_address': signup_data.get('email', f"{user_id}@example.com"),
                'permissions': permissions,
                'password': hashed_password,
                'stripe_account_id': stripe_account_id,
                'role': signup_type
            }

            # Add role-specific data from Stripe onboarding
            if signup_type == 'community':
                user_data.update({
                    'first_name': signup_data.get('first_name'),
                    'last_name': signup_data.get('last_name'),
                    'phone_number': format_phone_for_storage(signup_data.get('phone', '')) if signup_data.get('phone') else None,
                    'dob': signup_data.get('dob'),
                    'address': signup_data.get('address'),
                    'ssn_last_4': signup_data.get('ssn_last_4'),
                })
            elif signup_type == 'seller':
                user_data.update({
                    'company_name': signup_data.get('company_name'),
                    'phone_number': format_phone_for_storage(signup_data.get('phone', '')) if signup_data.get('phone') else None,
                    'tax_id': signup_data.get('tax_id'),
                    'address': signup_data.get('address'),
                })

            # Save the user to user_settings
            users_settings = load_users_settings()
            users_settings[user_id] = user_data
            save_users_settings(users_settings)
            logging.info(f"User {user_id} created successfully after Stripe onboarding")

            # Generate a token using generate_token from utils.auth
            token = generate_token(user_id, permissions)
            session['user'] = {
                'user_id': user_id,
                'permissions': permissions,
                'token': token,
                'x-role': next((r for r in ['admin', 'merchant', 'community', 'partner'] if r in permissions), 'user')
            }
            session.modified = True

            # Prepare response
            response = jsonify({
                "status": "success",
                "message": "Account created successfully",
                "token": token,
                "user_id": user_id,
                "redirect": "/"
            })
            response.set_cookie('authToken', token, secure=True, max_age=604800, path='/')
            return response, 200

        except Exception as e:
            logging.error(f"Complete signup error: {str(e)}", exc_info=True)
            return jsonify({"status": "error", "message": "Server error"}), 500

# /link-stripe POST - Link Stripe Account for Partner/Admin
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
            return jsonify({"status": "error", "message": "User not found"}), 404

        if user.get('stripe_account_id'):
            logging.warning(f"User {user_id} already has Stripe account")
            return jsonify({"status": "error", "message": "Stripe account already linked"}), 400

        # Create Stripe account for linking
        account = stripe.Account.create(
            type='express',
            business_type='individual',
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
        return jsonify({"status": "success", "account_link": account_link.url, "redirect": "/"}), 200

    except stripe.error.StripeError as e:
        logging.error(f"Stripe error: {str(e)}")
        return jsonify({"status": "error", "message": f"Stripe error: {str(e)}"}), 400
    except Exception as e:
        logging.error(f"Link Stripe error: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500

# /reset-password POST - Initiate Password Reset
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
            logging.warning("Reset password attempt missing email")
            return jsonify({"status": "error", "message": "Email is required"}), 400
        
        email = data.get("email").lower()
        users_settings = load_users_settings()
        matching_user_id = next((uid for uid, settings in users_settings.items() if settings.get("email_address", "").lower() == email), None)
        
        if not matching_user_id:
            logging.warning(f"Reset password failed - Email not found: {email}")
            return jsonify({"status": "error", "message": "Email not found"}), 404

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
            return jsonify({"status": "error", "message": f"Failed to send SMS: {str(e)}"}), 500

        logging.info(f"OTP generated and token created for user {matching_user_id}")
        return jsonify({"status": "success", "message": "OTP sent successfully", "otp_token": otp_token}), 200
    except Exception as e:
        logging.error(f"Reset password error: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500

def send_otp_via_sms(phone_number, otp):
    """
    Sends an OTP via SMS to the specified phone number using TextMagic's API.

    Args:
        phone_number (str): The recipient's phone number (without leading 0, e.g., '7989389179').
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

# /verify-reset-code POST - Verify OTP and Reset Password
@authentication_bp.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    """
    Verify the OTP and reset the user's password.

    Expects JSON payload with email, otp, otp_token, and new_password.
    Updates the user's password in users_settings.json if OTP is valid.
    Returns a new authentication token on success.
    """
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
        if not data or not all(k in data for k in ['email', 'otp', 'otp_token', 'new_password']):
            logging.warning(f"Verify reset code missing required fields: {json.dumps(data)}")
            return jsonify({"status": "error", "message": "Email, OTP, token, and new password are required"}), 400
        
        email = data.get("email").lower()
        otp = data.get("otp")
        otp_token = data.get("otp_token")
        new_password = data.get("new_password").strip()

        # Decode and validate the OTP token
        try:
            payload = jwt.decode(otp_token, site_settings.get('jwt', {}).get('SECRET_KEY'), algorithms=['HS256'])
            if payload['email'] != email:
                logging.warning(f"Email mismatch: provided {email}, stored {payload['email']}")
                return jsonify({"status": "error", "message": "Email mismatch"}), 400
            stored_otp_hash = payload['otp_hash']
        except jwt.ExpiredSignatureError:
            logging.warning("Token expired")
            return jsonify({"status": "error", "message": "Token expired"}), 400
        except jwt.InvalidTokenError:
            logging.warning("Invalid token")
            return jsonify({"status": "error", "message": "Invalid token"}), 400

        # Verify OTP with consistent encoding
        entered_otp_hash = hashlib.sha256(otp.encode('utf-8')).hexdigest()
        if entered_otp_hash != stored_otp_hash:
            logging.warning("Invalid OTP")
            return jsonify({"status": "error", "message": "Invalid OTP"}), 400

        # Load user settings and find the user
        users_settings = load_users_settings()
        matching_user_id = next((uid for uid, settings in users_settings.items() if settings.get("email_address", "").lower() == email), None)
        if not matching_user_id:
            logging.warning(f"User not found for email: {email}")
            return jsonify({"status": "error", "message": "User not found"}), 404

        user = users_settings[matching_user_id]
        
        # Hash the new password with consistent encoding
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user["password"] = hashed_password
        
        # Add 'verified' permission if not present
        if "verified" not in user.get("permissions", []):
            user["permissions"].append("verified")
        
        # Save the updated settings with error handling
        try:
            save_users_settings(users_settings)
            logging.info(f"Password reset successful for user {matching_user_id}")
        except Exception as save_error:
            logging.error(f"Failed to save updated password for user {matching_user_id}: {str(save_error)}")
            return jsonify({"status": "error", "message": "Failed to save new password. Please try again."}), 500

        # Generate a new token
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
        
        # Prepare and return the response
        response = jsonify({
            "status": "success",
            "message": "Password reset successful",
            "token": token,
            "x-role": x_role,
            "user_id": matching_user_id,
            "redirect": "/"
        })
        response.set_cookie('authToken', token, secure=True, max_age=604800, path='/')
        return response, 200

    except Exception as e:
        logging.error(f"Verify reset code error: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500
    
# /update-password POST - Update Existing Password
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
            logging.warning("Update password attempt missing current_password or new_password")
            return jsonify({"status": "error", "message": "Current password and new password are required"}), 400

        current_password = data["current_password"].strip()
        new_password = data["new_password"].strip()

        users_settings = load_users_settings()
        user_id = request.user_id
        user = users_settings.get(user_id)
        if not user:
            logging.warning(f"User {user_id} not found")
            return jsonify({"status": "error", "message": "User not found"}), 404

        if not bcrypt.checkpw(current_password.encode('utf-8'), user["password"].encode('utf-8')):
            logging.warning(f"Current password incorrect for user {user_id}")
            return jsonify({"status": "error", "message": "Current password is incorrect"}), 403

        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        users_settings[user_id]["password"] = hashed_password
        save_users_settings(users_settings)
        logging.info(f"Password updated for user {user_id}")
        return jsonify({"status": "success", "message": "Password updated successfully", "redirect": "/"}), 200
    except Exception as e:
        logging.error(f"Update password error: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500

        from flask import jsonify, request

@authentication_bp.route('/debug-password/<user_id>', methods=['GET', 'POST'])
def debug_password(user_id):
    """
    Temporary route to debug password hash issues.
    - GET: Check if a provided password matches the stored hash.
    - POST: Update the password hash with a new password.
    """
    users_settings = load_users_settings()
    user = users_settings.get(user_id)
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404

    if request.method == 'GET':
        password = request.args.get('password')
        if not password:
            return jsonify({"status": "error", "message": "Password parameter required"}), 400

        # Check if the password matches the stored hash
        if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({"status": "success", "message": "Password matches"})
        else:
            return jsonify({"status": "error", "message": "Password does not match"})

    elif request.method == 'POST':
        new_password = request.json.get('new_password')
        if not new_password:
            return jsonify({"status": "error", "message": "New password required"}), 400

        # Hash and update the password
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user['password'] = hashed_password
        try:
            save_users_settings(users_settings)
            return jsonify({"status": "success", "message": "Password updated"})
        except Exception as e:
            return jsonify({"status": "error", "message": f"Failed to save: {str(e)}"}), 500

