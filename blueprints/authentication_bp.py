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
# Here begins the grand adventure of authentication_bp, a blueprint forged in the fires of Mount Doom (or at least the xAI labs).
# Zaphod Beeblebrox would approve—two heads are better than one, and this module handles signups and password resets with flair!
authentication_bp = Blueprint('authentication_bp', __name__)
# endregion

# region /login POST - User Login
@authentication_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticates a user and returns a JWT token if successful.
    Purpose: Allows users to log in using their email and password.
    Inputs: JSON payload with:
        - email (str): The user's email address.
        - password (str): The user's password.
    Outputs:
        - Success: JSON {"status": "success", "token": "<JWT>", "user_id": "<id>"}, status 200
        - Errors:
            - 400: {"status": "error", "message": "Email and password are required"}
            - 401: {"status": "error", "message": "Invalid credentials"}
            - 500: {"status": "error", "message": "Server error"}
    """
    try:
        # Log the raw JSON data before any processing to debug middleware interference
        raw_data = request.get_json(force=True, cache=False)
        logging.debug(f"Raw JSON received: {json.dumps(raw_data)}")
        data = raw_data
        
        if not data or 'email' not in data or 'password' not in data:
            logging.warning(f"UX Issue - Login attempt missing email or password: {json.dumps(data)}")
            return jsonify({"status": "error", "message": "Email and password are required"}), 400
        
        email = data['email'].strip().lower()
        password = data['password'].strip()
        # Log the raw password for debugging
        logging.debug(f"Login attempt - Email: {email}, Password (sent): {password}")
        
        users_settings = load_users_settings()
        logging.debug(f"Loaded users: {json.dumps({k: {**v, 'password': '[REDACTED]'} for k, v in users_settings.items()})}")
        user_entry = next(((uid, u) for uid, u in users_settings.items() if u['email_address'].lower() == email), None)
        
        if user_entry:
            user_id, user = user_entry
            logging.debug(f"User found - ID: {user_id}, Stored Hash: {user['password']}")
            logging.debug(f"Password sent bytes: {password.encode('utf-8')}, Stored hash bytes: {user['password'].encode('utf-8')}")
            if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
                logging.debug("Password matches")
                token = generate_token(user_id, user['permissions'])
                return jsonify({"status": "success", "token": token, "user_id": user_id}), 200
            else:
                logging.debug("Password does not match")
        else:
            logging.debug(f"User not found for email: {email}")
        
        logging.warning(f"Security Issue - Invalid login attempt for email: {email}")
        return jsonify({"status": "error", "message": "Invalid credentials"}), 401
    except Exception as e:
        logging.error(f"UX Issue - Login processing error: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500
# endregion

# region /signup GET - The Holy Grail of New User Entry
@authentication_bp.route('/signup', methods=['GET'])
def signup_page():
    """
    Renders the signup page, a portal to the galaxy for new users.
    Purpose: Like the Knights of the Round Table seeking the Grail, this endpoint offers a form for brave souls to join the ranks.
    Inputs: None—just point your browser and pray you’re not a shrubbery.
    Outputs: 
        - Success: HTML signup form, a beacon of hope.
        - Error: JSON {"status": "error", "message": "Server error"}, status 500—like Marvin groaning, "I’ve got a brain the size of a planet and they ask me to render a page."
    """
    try:
        # Trillian would navigate this smoothly—straight to the template!
        return render_template('signup.html')
    except Exception as e:
        # Alas, the Parrot is no more! It’s an ex-page!
        logging.error(f"UX Issue - Failed to render signup page: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500
# endregion

# region /signup POST - Joining the Galactic Crew
@authentication_bp.route('/signup', methods=['POST'])
def signup():
    """
    Registers a new user, faster than Zaphod escaping a Vogon poetry reading.
    Purpose: Takes JSON data to create a user account—think of it as signing up for the Rebel Alliance, but with less paperwork.
    Inputs: JSON payload with:
        - signup_type (str): "seller", "community", "wixpro", etc.
        - contact_name (str): Your alias, e.g., "Arthur Dent".
        - signup_email (str): Galactic comms address.
        - signup_password (str): Secret key, not "four candles".
        - signup_phone (str, optional): Required for seller/community, else optional like a spare towel.
    Outputs:
        - Success: JSON {"status": "success", "message": "User created, please verify OTP"}, status 201—welcome aboard!
        - Errors:
            - 400: {"status": "error", "message": "Missing required fields"}—you forgot the fork handles!
            - 400: {"status": "error", "message": "Phone required for Merchant/Community"}—no phone, no entry!
            - 409: {"status": "error", "message": "Email already registered"}—this email’s already in the Biggus Dickus database.
            - 500: {"status": "error", "message": "Server error"}—the Spanish Inquisition struck unexpectedly!
    """
    try:
        # Arthur Dent fumbles with the JSON—let’s hope it’s all there!
        data = request.get_json()
        required_fields = ['signup_type', 'contact_name', 'signup_email', 'signup_password']
        if not all(k in data for k in required_fields):
            logging.warning(f"UX Issue - Signup attempt missing required fields: {json.dumps(data)}")
            return jsonify({"status": "error", "message": "Missing required fields"}), 400
        
        signup_type = data['signup_type']
        contact_name = data['contact_name']
        signup_email = data['signup_email']
        signup_password = data['signup_password']
        signup_phone = data.get('signup_phone', '')

        # Seller or community? Better have a phone, or it’s “Nobody expects the Spanish Inquisition!”
        if signup_type in ['seller', 'community'] and not signup_phone:
            logging.warning(f"UX Issue - Signup failed for {signup_type} - Phone required")
            return jsonify({"status": "error", "message": "Phone required for Merchant/Community"}), 400

        # Load the user database—like the Guide, but less likely to say "Don’t Panic".
        users_settings = load_users_settings()
        if any(u['email_address'].lower() == signup_email.lower() for u in users_settings.values()):
            logging.warning(f"UX Issue - Signup failed - Email already registered: {signup_email}")
            return jsonify({"status": "error", "message": "Email already registered"}), 409

        # Generate a user ID—unique as Zaphod’s second head.
        user_id = generate_code()
        # Hash the password with bcrypt—stronger than a Wookiee’s grip!
        hashed_password = bcrypt.hashpw(signup_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Map signup types to permissions—Ronnie Corbett would approve this tidy switch.
        permission_map = {'seller': 'merchant', 'community': 'community', 'wixpro': 'wixpro'}
        permission = permission_map.get(signup_type, signup_type)

        # Assemble the user record—fit for the Life of Brian’s People’s Front of Judea.
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
    except Exception as e:
        # Marvin’s lament: “I tried to sign up, but the universe broke.”
        logging.error(f"UX Issue - Signup processing error: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500
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
    """
    Initiates a password reset, sending an OTP faster than Trillian can say “Don’t Panic!”.
    Purpose: Like Brian’s sandal leading the masses, this endpoint guides users back to access with a one-time password.
    Inputs: JSON payload with:
        - email (str): The user’s galactic address to reset.
    Outputs:
        - Success: JSON {"status": "success", "message": "A one-time password has been sent to your phone"}, status 200—help is on the way!
        - Errors:
            - 400: {"status": "error", "message": "Email is required"}—no email, no fork handles!
            - 404: {"status": "error", "message": "Email not found"}—this user’s not in the Guide.
            - 400: {"status": "error", "message": "No phone number associated with this account"}—no comms, no reset!
            - 500: {"status": "error", "message": "TextMagic credentials not configured"}—the Vogons forgot the keys!
            - 500: {"status": "error", "message": "Failed to send SMS: <reason>"}—a comedy of errors!
    """
    try:
        # Arthur Dent checks the JSON—where’s that email?
        data = request.get_json()
        if not data or 'email' not in data:
            logging.warning("UX Issue - Reset password attempt missing email")
            return jsonify({"status": "error", "message": "Email is required"}), 400
        
        email = data.get("email").lower()
        users_settings = load_users_settings()
        matching_user_id = next((uid for uid, settings in users_settings.items() if settings.get("email_address", "").lower() == email), None)
        
        # No user? It’s like looking for the Holy Grail in a galaxy far, far away.
        if not matching_user_id:
            logging.warning(f"UX Issue - Reset password failed - Email not found: {email}")
            return jsonify({"status": "error", "message": "Email not found"}), 404

        user = users_settings[matching_user_id]
        phone_number = user.get("phone_number", "").strip()
        if not phone_number:
            logging.warning(f"UX Issue - Reset password failed for {email} - No phone number")
            return jsonify({"status": "error", "message": "No phone number associated with this account"}), 400

        # Generate OTP—six digits of pure, random brilliance, courtesy of Zaphod’s improbability drive.
        otp = ''.join(random.choices(string.digits, k=6))
        reset_expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
        if "reset_codes" not in current_app.config:
            current_app.config["reset_codes"] = {}
        current_app.config["reset_codes"][matching_user_id] = {"code": otp, "expires": reset_expiry.isoformat()}
        logging.debug(f"Generated OTP for reset - User ID: {matching_user_id}, OTP: {otp}")

        # Load TextMagic config—Ronnie Barker’s “four candles” would be easier to find!
        config = load_config()
        textmagic_config = config.get("textmagic", {})
        username = textmagic_config.get("USERNAME")
        api_key = textmagic_config.get("API_KEY")
        if not username or not api_key:
            logging.error("Security Issue - TextMagic credentials not configured")
            return jsonify({"status": "error", "message": "TextMagic credentials not configured"}), 500

        # Send the SMS—faster than a lumberjack singing in drag!
        url = "https://rest.textmagic.com/api/v2/messages"
        payload = {"text": f"clubmadeira.io one-time password: {otp}. Expires in 15 mins.", "phones": phone_number}
        headers = {"X-TM-Username": username, "X-TM-Key": api_key, "Content-Type": "application/x-www-form-urlencoded"}
        response = requests.post(url, data=payload, headers=headers)

        if response.status_code != 201:
            logging.error(f"UX Issue - Failed to send SMS for reset - User ID: {matching_user_id}, Response: {response.text}")
            return jsonify({"status": "error", "message": f"Failed to send SMS: {response.text}"}), 500
        
        logging.info(f"SMS sent successfully for password reset - User ID: {matching_user_id}")
        return jsonify({"status": "success", "message": "A one-time password has been sent to your phone"}), 200
    except Exception as e:
        # Marvin’s take: “I sent an SMS, and now the universe hates me.”
        logging.error(f"UX Issue - Reset password error: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500
# endregion

# region /verify-reset-code POST - The Messiah of Password Recovery
@authentication_bp.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    """
    Verifies an OTP and resets the password—like Arthur Dent finding the Ultimate Answer (42, obviously).
    Purpose: Validates the OTP and updates the password, granting access like the *Life of Brian* crowd shouting “He IS the Messiah!”.
    Inputs: JSON payload with:
        - email (str): The user’s address.
        - code (str): The OTP, six digits of destiny.
        - new_password (str): The new key to the galaxy.
    Outputs:
        - Success: JSON {"status": "success", "token": "<JWT>", "user_id": "<id>"}, status 200—access granted!
        - Errors:
            - 400: {"status": "error", "message": "Email, code, and new password are required"}—no shortcuts here!
            - 404: {"status": "error", "message": "Email not found"}—lost in space!
            - 400: {"status": "error", "message": "No reset code found for this user"}—no OTP, no entry!
            - 500: {"status": "error", "message": "Invalid reset code expiry format"}—time’s gone wonky!
            - 400: {"status": "error", "message": "Invalid or expired reset code"}—this code’s pining for the fjords!
            - 500: {"status": "error", "message": "Server error"}—the Ronnies misplaced the candles!
    """
    try:
        # Trillian checks the JSON—three items, or it’s a bust!
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict) or not all(k in data for k in ['email', 'code', 'new_password']):
            logging.warning(f"UX Issue - Verify reset code missing required fields: {json.dumps(data)}")
            return jsonify({"status": "error", "message": "Email, code, and new password are required"}), 400
        
        email = data.get("email").lower()
        code = data.get("code")
        new_password = data.get("new_password")

        users_settings = load_users_settings()
        matching_user_id = next((uid for uid, settings in users_settings.items() if settings.get("email_address", "").lower() == email), None)
        
        # No user? It’s like Zaphod losing both heads at once!
        if not matching_user_id:
            logging.warning(f"UX Issue - Verify reset code failed - Email not found: {email}")
            return jsonify({"status": "error", "message": "Email not found"}), 404

        stored_reset = current_app.config.get("reset_codes", {}).get(matching_user_id, {})
        stored_code = stored_reset.get("code")
        if not stored_code:
            logging.warning(f"UX Issue - No reset code found for user {matching_user_id}")
            return jsonify({"status": "error", "message": "No reset code found for this user"}), 400

        # Check expiry—don’t let it join the Parrot in the great beyond!
        try:
            expiry = datetime.datetime.fromisoformat(stored_reset.get("expires", "2000-01-01T00:00:00"))
        except (ValueError, TypeError) as e:
            logging.error(f"Security Issue - Invalid reset code expiry format for user {matching_user_id}: {str(e)}", exc_info=True)
            return jsonify({"status": "error", "message": "Invalid reset code expiry format"}), 500

        if stored_code != code or datetime.datetime.utcnow() > expiry:
            logging.warning(f"Security Issue - Invalid or expired reset code for user {matching_user_id}: {code}")
            return jsonify({"status": "error", "message": "Invalid or expired reset code"}), 400

        user = users_settings[matching_user_id]
        # Hash the new password—stronger than a Wookiee’s grip!
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user["password"] = hashed_password
        
        # Add 'verified' permission if missing—like Brian gaining a halo!
        if "verified" not in user.get("permissions", []):
            user["permissions"].append("verified")
        
        save_users_settings(users_settings)
        if matching_user_id in current_app.config.get("reset_codes", {}):
            del current_app.config["reset_codes"][matching_user_id]

        # Generate a token—your key to the galaxy, courtesy of Zaphod’s improbability!
        token = generate_token(matching_user_id, user.get("permissions", []))
        response_data = {"status": "success", "token": "[REDACTED]", "user_id": matching_user_id}
        logging.debug(f"Reset code verified - User ID: {matching_user_id}, Response: {json.dumps(response_data)}")
        return jsonify({"status": "success", "token": token, "user_id": matching_user_id}), 200
    except Exception as e:
        # Marvin’s verdict: “I verified the code, and now I’m even more depressed.”
        logging.error(f"UX Issue - Verify reset code error: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500
# endregion

# region /update-password POST - Changing the Galactic Key
@authentication_bp.route('/update-password', methods=['POST'])
@login_required(["self"], require_all=True)
def update_password():
    """
    Updates a user’s password, secure as a Two Ronnies sketch twist.
    Purpose: Lets an authenticated user change their password—like swapping four candles for fork handles, but with more security.
    Permissions: Restricted to "self"—only you can wield this lightsaber!
    Inputs: JSON payload with:
        - email (str): Your address, matching your JWT.
        - password (str): The new password to hash.
    Outputs:
        - Success: JSON {"status": "success", "message": "Password updated for <email>", "user_id": "<id>"}, status 200—victory!
        - Errors:
            - 400: {"status": "error", "message": "Email and password required"}—no dice without both!
            - 403: {"status": "error", "message": "Unauthorized"}—this isn’t your password, you naughty boy!
            - 500: {"status": "error", "message": "Server error"}—the system’s gone to the People’s Front of Judea!
    """
    try:
        # Arthur Dent fumbles again—where’s that email and password?
        data = request.get_json()
        if not data or 'email' not in data or 'password' not in data:
            logging.warning(f"UX Issue - Update password attempt missing email or password: {json.dumps(data)}")
            return jsonify({"status": "error", "message": "Email and password required"}), 400
        
        email = data["email"].strip().lower()
        new_password = data["password"].strip()
        users_settings = load_users_settings()
        user_id = next((uid for uid, u in users_settings.items() if u["email_address"].lower() == email), None)
        
        # Only you can change your password—or it’s “Nobody expects the Spanish Inquisition!”
        if not user_id or user_id != request.user_id:
            logging.warning(f"Security Issue - Unauthorized password update attempt for {email} by {request.user_id}")
            return jsonify({"status": "error", "message": "Unauthorized"}), 403
        
        # Hash it up—bcrypt’s grip is Wookiee-strong!
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        users_settings[user_id]["password"] = hashed_password
        save_users_settings(users_settings)
        logging.info(f"Password updated for user {user_id}")
        return jsonify({"status": "success", "message": f"Password updated for {email}", "user_id": user_id}), 200
    except Exception as e:
        # Marvin sighs: “I updated the password, and now I’m broken.”
        logging.error(f"UX Issue - Update password error: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500
# endregion