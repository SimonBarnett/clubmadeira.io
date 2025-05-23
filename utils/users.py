import os
import json
import string
import random
import logging

USERS_SETTINGS_FILE = "users_settings.json"

def load_users_settings():
    """
    Loads all user settings from the JSON file.
    Returns an empty dict if the file doesn't exist or is invalid.
    Ensures each user's settings have a 'phone_number' field.
    """
    try:
        if os.path.exists(USERS_SETTINGS_FILE):
            with open(USERS_SETTINGS_FILE, 'r') as f:
                users_settings = json.load(f)
                # Ensure all user records have a phone_number field
                for user_id, settings in users_settings.items():
                    if 'phone_number' not in settings:
                        settings['phone_number'] = None
                # Redact sensitive data in logs
                log_settings = {uid: {k: "[REDACTED]" if k in ["password"] else v for k, v in s.items()} for uid, s in users_settings.items()}
                logging.debug(f"Loaded users settings: {json.dumps(log_settings)}")
                return users_settings
        else:
            logging.warning("UX Issue - Users settings file not found, returning empty dict")
            return {}
    except json.JSONDecodeError as e:
        logging.error(f"Security Issue - Invalid users settings file format: {str(e)}", exc_info=True)
        return {}
    except Exception as e:
        logging.error(f"UX Issue - Failed to load users settings: {str(e)}", exc_info=True)
        return {}

def save_users_settings(users_settings):
    """
    Saves all user settings to the JSON file.
    Raises an exception if saving fails.
    """
    try:
        with open(USERS_SETTINGS_FILE, 'w') as f:
            json.dump(users_settings, f, indent=4)
        # Redact sensitive data in logs
        log_settings = {uid: {k: "[REDACTED]" if k in ["password"] else v for k, v in s.items()} for uid, s in users_settings.items()}
        logging.debug(f"Saved users settings: {json.dumps(log_settings)}")
    except Exception as e:
        logging.error(f"UX Issue - Failed to save users settings: {str(e)}", exc_info=True)
        raise  # Re-raise to alert calling code

def get_user_settings(user_id):
    """
    Retrieves settings for a specific user.
    Returns an empty dict if the user doesn't exist or retrieval fails.
    Ensures 'phone_number' is present in the returned settings.
    """
    try:
        user_settings = load_users_settings().get(user_id, {})
        if not user_settings:
            logging.warning(f"UX Issue - No settings found for user {user_id}")
        # Ensure phone_number is included
        if 'phone_number' not in user_settings:
            user_settings['phone_number'] = None
        # Redact sensitive data in logs
        log_settings = {k: "[REDACTED]" if k in ["password"] else v for k, v in user_settings.items()}
        logging.debug(f"Retrieved settings for user {user_id}: {json.dumps(log_settings)}")
        return user_settings
    except Exception as e:
        logging.error(f"UX Issue - Failed to get settings for user {user_id}: {str(e)}", exc_info=True)
        return {}

def save_user_settings(user_id, user_settings):
    """
    Saves settings for a specific user.
    Adds new settings if the user_id doesn't exist, or updates existing settings.
    Ensures 'phone_number' is present in the saved settings.
    Raises an exception if saving fails.
    """
    try:
        all_users_settings = load_users_settings()
        if 'phone_number' not in user_settings:
            user_settings['phone_number'] = None
        all_users_settings[user_id] = user_settings
        save_users_settings(all_users_settings)
        # Redact sensitive data for logging
        log_settings = {k: "[REDACTED]" if k in ["password"] else v for k, v in user_settings.items()}
        logging.debug(f"Saved settings for user {user_id}: {json.dumps(log_settings)}")
    except Exception as e:
        logging.error(f"UX Issue - Failed to save settings for user {user_id}: {str(e)}", exc_info=True)
        raise

def generate_code():
    """
    Generates a random 8-character code (7 characters + checksum).
    Returns an empty string if generation fails.
    """
    try:
        charset = string.digits + string.ascii_uppercase
        code = ''.join(random.choice(charset) for _ in range(7))
        total = sum(charset.index(c) for c in code)
        checksum = charset[total % 36]
        result = code + checksum
        logging.debug(f"Generated code for user: {result}")
        return result
    except Exception as e:
        logging.error(f"UX Issue - Failed to generate code: {str(e)}", exc_info=True)
        return ""  # Return empty string as fallback
    try:
        charset = string.digits + string.ascii_uppercase
        code = ''.join(random.choice(charset) for _ in range(7))
        total = sum(charset.index(c) for c in code)
        checksum = charset[total % 36]
        result = code + checksum
        logging.debug(f"Generated code for user: {result}")
        return result
    except Exception as e:
        logging.error(f"UX Issue - Failed to generate code: {str(e)}", exc_info=True)
        return ""  # Return empty string as fallback