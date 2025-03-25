import json
import os
import random
import string

USERS_SETTINGS_FILE = "users_settings.json"

def load_users_settings():
    if os.path.exists(USERS_SETTINGS_FILE):
        with open(USERS_SETTINGS_FILE, 'r') as f:
            users_settings = json.load(f)
            # Ensure all user records have a phone_number field
            for user_id, settings in users_settings.items():
                if 'phone_number' not in settings:
                    settings['phone_number'] = None  # Set to None for existing users
            return users_settings
    return {}

def save_users_settings(users_settings):
    with open(USERS_SETTINGS_FILE, 'w') as f:
        json.dump(users_settings, f, indent=4)

def get_user_settings(user_id):
    user_settings = load_users_settings().get(user_id, {})
    # Ensure the returned settings include phone_number
    if 'phone_number' not in user_settings:
        user_settings['phone_number'] = None
    return user_settings

def generate_code():
    charset = string.digits + string.ascii_uppercase
    code = ''.join(random.choice(charset) for _ in range(7))
    total = sum(charset.index(c) for c in code)
    checksum = charset[total % 36]
    return code + checksum