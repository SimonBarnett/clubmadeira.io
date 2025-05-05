from flask import Blueprint, render_template, request, jsonify, current_app, session, redirect, url_for
from utils.auth import login_required, load_users_settings, save_users_settings, generate_token, decode_token, login_user, generate_code
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

# /signup POST - Handle User Signup
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
        logging.debug(f"Request: {json.dumps(log_data)}")

        data = request_data["body"]
        if not data or 'signup_type' not in data:
            logging.warning("Signup attempt missing signup_type")
            return jsonify({"status": "error", "message": "Signup type is required"}), 400

        signup_type = data.get("signup_type").lower()
        valid_signup_types = ['community', 'seller', 'partner']
        if signup_type not in valid_signup_types:
            logging.warning(f"Invalid signup_type: {signup_type}")
            return jsonify({"status": "error", "message": "Invalid signup type"}), 400

        site_settings = load_config()
        stripe.api_key = site_settings.get('stripe', {}).get('API_KEY')

        # Determine business type based on role
        business_type = 'individual' if signup_type in ['community', 'partner'] else 'company'

        # Create Stripe account for the new user
        account = stripe.Account.create(
            type='express',
            business_type=business_type,
            capabilities={'transfers': {'requested': True}}
        )

        # Create Stripe account link with return URL including role and section
        return_url = f"https://clubmadeira.io/?section=completeSignup&role={signup_type}&account_id={account.id}"
        account_link = stripe.AccountLink.create(
            account=account.id,
            refresh_url='https://clubmadeira.io/?section=failSignup',
            return_url=return_url,
            type='account_onboarding'
        )

        logging.info(f"Stripe account created for {signup_type}, account_link: {account_link.url}")
        return jsonify({
            "status": "success",
            "signup_type": signup_type,
            "account_link": account_link.url
        }), 200

    except stripe.error.StripeError as e:
        logging.error(f"Stripe error during signup: {str(e)}")
        return jsonify({"status": "error", "message": f"Stripe error: {str(e)}"}), 400
    except Exception as e:
        logging.error(f"Signup error: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500

# /complete-signup POST - Complete Signup After Stripe
@authentication_bp.route('/complete-signup', methods=['POST'])
def complete_signup():
    """Handle password setup after Stripe onboarding to complete user account creation."""
    try:
        # Load the configuration
        config = load_config()
        
        # Check if Stripe API key exists in the config
        if "stripe" not in config or "API_KEY" not in config["stripe"]:
            logging.error("Stripe API key not found in config")
            return jsonify({"status": "error", "message": "Server configuration error"}), 500
        
        # Set the Stripe API key
        stripe.api_key = config["stripe"]["API_KEY"]

        # Attempt to parse JSON, fall back to form data if not JSON
        data = request.get_json(silent=True) or request.form.to_dict()
        logging.debug(f"Received data: {data}")

        # Check if data is empty or missing required fields
        if not data or 'password' not in data or 'stripe_account_id' not in data or 'role' not in data:
            logging.warning("Missing required fields in complete-signup request")
            return jsonify({"status": "error", "message": "Password, stripe_account_id, and role are required"}), 400

        password = data['password'].strip()
        stripe_account_id = data['stripe_account_id']
        role = data['role']

        if not password:
            return jsonify({"status": "error", "message": "Password cannot be empty"}), 400

        # Fetch Stripe account details
        try:
            stripe_account = stripe.Account.retrieve(stripe_account_id)
        except stripe.error.StripeError as e:
            logging.error(f"Stripe error: {str(e)}")
            return jsonify({"status": "error", "message": "Failed to retrieve Stripe account"}), 400

        # Generate a permanent user ID using generate_code from utils.auth
        user_id = generate_code()

        # Determine email: Use Stripe email if available, else form email, else default
        email_from_stripe = stripe_account.email
        email_from_form = data.get('email', '').strip()
        email = email_from_stripe if email_from_stripe is not None else (email_from_form if email_from_form else f"{user_id}@example.com")

        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Prepare user data
        user_data = {
            'email_address': email,
            'permissions': [role, 'validated'],
            'password': hashed_password,
            'stripe_account_id': stripe_account_id,
            'role': role
        }

        # Add role-specific data from Stripe onboarding or form
        if role == 'community':
            individual = stripe_account.individual if stripe_account.individual else {}
            phone_from_stripe = individual.get('phone') if stripe_account.individual else None
            phone_from_form = data.get('phone', '').strip()
            phone_number = phone_from_stripe if phone_from_stripe is not None else (phone_from_form if phone_from_form else None)
            user_data.update({
                'first_name': individual.get('first_name') if stripe_account.individual else None,
                'last_name': individual.get('last_name') if stripe_account.individual else None,
                'phone_number': phone_number,
                'dob': individual.get('dob') if stripe_account.individual else None,
                'address': individual.get('address') if stripe_account.individual else None,
                'ssn_last_4': individual.get('ssn_last_4') if stripe_account.individual else None,
            })
        elif role == 'seller':
            company = stripe_account.company if stripe_account.company else {}
            phone_from_stripe = company.get('phone') if stripe_account.company else None
            phone_from_form = data.get('phone', '').strip()
            phone_number = phone_from_stripe if phone_from_stripe is not None else (phone_from_form if phone_from_form else None)
            user_data.update({
                'company_name': company.get('name') if stripe_account.company else None,
                'phone_number': phone_number,
                'tax_id': company.get('tax_id') if stripe_account.company else None,
                'address': company.get('address') if stripe_account.company else None,
            })

        # Save the user to user_settings
        users_settings = load_users_settings()
        users_settings[user_id] = user_data
        save_users_settings(users_settings)
        logging.info(f"User {user_id} created successfully after Stripe onboarding")

        # Record signup event in PostHog using the new utility
        posthog_client = current_app.posthog_client
        signup_data = {
            "user_id": user_id,
            "role": role,
            "timestamp": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        }
        if posthog_client:
            try:
                posthog_client.capture(
                    distinct_id=user_id,
                    event="signup",
                    properties=signup_data
                )
                logging.debug(f"PostHog signup event captured: distinct_id={user_id}, properties={json.dumps(signup_data)}")
            except Exception as e:
                logging.error(f"PostHog Issue - Failed to capture signup event: {str(e)}", exc_info=True)
        else:
            logging.warning("PostHog Issue - posthog_client is None, signup event not captured")

        # Generate a token using generate_token from utils.auth
        token = generate_token(user_id, user_data['permissions'])
        session['user'] = {
            'user_id': user_id,
            'permissions': user_data['permissions'],
            'token': token,
            'x-role': role
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