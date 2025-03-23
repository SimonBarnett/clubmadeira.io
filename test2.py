from flask import Flask, request, jsonify
import datetime
import random
import string
import bcrypt  # Ensure this is imported

app = Flask(__name__)

@app.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    
    try:
        # Parse JSON safely
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return jsonify({"status": "error", "message": "Invalid or missing JSON data"}), 400

        email = data.get("email")
        code = data.get("code")
        new_password = data.get("new_password")
        if not all([email, code, new_password]):
            return jsonify({"status": "error", "message": "Email, code, and new password are required"}), 400

        # Load user settings
        try:
            users_settings = load_users_settings()
        except Exception as e:
            print(f"Error loading users_settings: {str(e)}")
            return jsonify({"status": "error", "message": "Failed to load user data"}), 500

        # Find user by email
        matching_user_id = None
        for user_id, settings in users_settings.items():
            if settings.get("email_address", "").lower() == email.lower():
                matching_user_id = user_id
                break

        if not matching_user_id:
            return jsonify({"status": "error", "message": "Email not found"}), 404

        # Check stored OTP
        stored_reset = app.config.get("reset_codes", {}).get(matching_user_id, {})
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

        # Update password
        try:
            hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            users_settings[matching_user_id]["password"] = hashed_password
        except Exception as e:
            print(f"Error hashing password: {str(e)}")
            return jsonify({"status": "error", "message": "Failed to hash password"}), 500

        # Save updated settings
        try:
            save_users_settings(users_settings)
        except Exception as e:
            print(f"Error saving users_settings: {str(e)}")
            return jsonify({"status": "error", "message": "Failed to save updated user data"}), 500

        # Clean up reset code
        if matching_user_id in app.config.get("reset_codes", {}):
            del app.config["reset_codes"][matching_user_id]

        return jsonify({
            "status": "success",
            "message": "Password updated successfully"
        }), 200

    except Exception as e:
        print(f"Unexpected error in verify-reset-code endpoint: {str(e)}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500