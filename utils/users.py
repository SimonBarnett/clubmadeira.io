import json 
import os 
import random 
import string 
 
USERS_SETTINGS_FILE = "users_settings.json" 
 
def load_users_settings(): 
    if os.path.exists(USERS_SETTINGS_FILE): 
        with open(USERS_SETTINGS_FILE, 'r') as f: 
            return json.load(f) 
    return {} 
 
def save_users_settings(users_settings): 
    with open(USERS_SETTINGS_FILE, 'w') as f: 
        json.dump(users_settings, f, indent=4) 
 
def get_user_settings(user_id): 
    return load_users_settings().get(user_id, {}) 
 
def generate_code(): 
    charset = string.digits + string.ascii_uppercase 
    code = ''.join(random.choice(charset) for _ in range(7)) 
    total = sum(charset.index(c) for c in code) 
    checksum = charset[total % 36] 
    return code + checksum 
