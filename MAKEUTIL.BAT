@echo off
setlocal enabledelayedexpansion

:: Define the root directory of the Flask project
set "ROOT_DIR=C:\inetpub\clubmadeira.io"

:: Define the folders
set "BLUEPRINTS_DIR=%ROOT_DIR%\blueprints"
set "UTILS_DIR=%ROOT_DIR%\utils"

set "FILE=%UTILS_DIR%\auth.py"
if not exist "%FILE%" (
import jwt 
import datetime 
from flask import current_app, request, jsonify 
from functools import wraps 
import bcrypt 
from .users import load_users_settings, save_users_settings, generate_code 
 
def login_required(required_permissions, require_all=True): 
    def decorator(f): 
        @wraps(f) 
        def decorated_function(*args, **kwargs): 
            token = request.headers.get("Authorization", "").replace("Bearer ", "") 
            if not token: 
                return jsonify({"status": "error", "message": "Token required"}), 401 
            try: 
                payload = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=["HS256"]) 
                if datetime.datetime.utcnow().timestamp() > payload["exp"]: 
                    return jsonify({"status": "error", "message": "Token expired"}), 401 
                request.user_id = payload["userId"] 
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
                        return jsonify({"status": "error", "message": "Insufficient permissions"}), 403 
                else: 
                    if not any(p in request.permissions for p in effective_perms if p and p != "self"): 
                        return jsonify({"status": "error", "message": "Insufficient permissions"}), 403 
                return f(*args, **kwargs) 
            except jwt.InvalidTokenError: 
                return jsonify({"status": "error", "message": "Invalid token"}), 401 
        return decorated_function 
    return decorator 
 
def login_user(): 
    data = request.get_json() 
    if not data or 'email' not in data or 'password' not in data: 
        return jsonify({"status": "error", "message": "Email and password required"}), 400 
    email = data["email"].strip().lower() 
    password = data["password"].strip() 
    users_settings = load_users_settings() 
    user_id = None 
    for uid, settings in users_settings.items(): 
        if settings.get("email_address", "").lower() == email and bcrypt.checkpw(password.encode('utf-8'), settings["password"].encode('utf-8')): 
            user_id = uid 
            break 
    if not user_id: 
        return jsonify({"status": "error", "message": "Invalid credentials"}), 401 
    permissions = users_settings[user_id].get("permissions", []) 
    token = jwt.encode({"userId": user_id, "permissions": permissions, "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)}, current_app.config['JWT_SECRET_KEY'], algorithm="HS256") 
    return jsonify({"status": "success", "token": token, "userId": user_id}), 200 
 
def signup_user(): 
    data = request.get_json() 
    if not all(k in data for k in ['signup_type', 'contact_name', 'signup_email', 'signup_password']): 
        return jsonify({"status": "error", "message": "All fields required"}), 400 
    users_settings = load_users_settings() 
    if any(u['email_address'] == data['signup_email'] for u in users_settings.values()): 
        return jsonify({"status": "error", "message": "Email exists"}), 400 
    USERid = generate_code() 
    hashed_password = bcrypt.hashpw(data['signup_password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8') 
    users_settings[USERid] = { 
        "email_address": data['signup_email'], 
        "password": hashed_password, 
        "contact_name": data['contact_name'], 
        "permissions": [data['signup_type']] 
    } 
    save_users_settings(users_settings) 
    return jsonify({"status": "success", "message": "Signup successful"}), 201 
Utils file created: %FILE%
) else (
File already exists: %FILE%
)

:: config.py in utils
set "FILE=%UTILS_DIR%\config.py"
if not exist "%FILE%" (
import json 
import os 
 
CONFIG_FILE = "config.json" 
 
def load_config(): 
    default_config = {"amazon_uk": {"ACCESS_KEY": "", "SECRET_KEY": "", "ASSOCIATE_TAG": "", "COUNTRY": ""}} 
    if not os.path.exists(CONFIG_FILE): 
        return default_config 
    with open(CONFIG_FILE, 'r') as f: 
        return json.load(f) 
 
def save_config(config): 
    with open(CONFIG_FILE, 'w') as f: 
        json.dump(config, f, indent=4) 
Utils file created: %FILE%
) else (
File already exists: %FILE%
)

:: users.py in utils
set "FILE=%UTILS_DIR%\users.py"
if not exist "%FILE%" (
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
    checksum = charset[total %% 36] 
    return code + checksum 
Utils file created: %FILE%
) else (
File already exists: %FILE%
)

:: categories.py in utils
set "FILE=%UTILS_DIR%\categories.py"
if not exist "%FILE%" (
from amazon_paapi import AmazonApi 
from .config import load_config 
from pseudo_categories import PSEUDO_CATEGORIES 
 
def get_all_categories(parent_id=None): 
    config = load_config() 
    if parent_id and all(config.get("amazon_uk", {}).values()): 
        amazon = AmazonApi(config["amazon_uk"]["ACCESS_KEY"], config["amazon_uk"]["SECRET_KEY"], config["amazon_uk"]["ASSOCIATE_TAG"], config["amazon_uk"]["COUNTRY"]) 
        browse_nodes = amazon.get_browse_nodes(browse_node_ids=[parent_id], resources=["BrowseNodes.Children"]) 
        return [{"id": node.browse_node_id, "name": node.display_name} for node in browse_nodes.browse_nodes[0].children] 
    return [{"id": cat["id"], "name": cat["name"]} for cat in PSEUDO_CATEGORIES] 
 
def filter_categories_with_products(category_ids, min_discount_percent): 
    # Placeholder for filtering logic 
    return [{"id": cat_id, "name": cat_id} for cat_id in category_ids] 
Utils file created: %FILE%
) else (
File already exists: %FILE%
)

:: products.py in utils
set "FILE=%UTILS_DIR%\products.py"
if not exist "%FILE%" (
from .config import load_config 
from amazon_paapi import AmazonApi 
 
def search_all_discounted(category_id): 
    config = load_config() 
    items = [] 
    if all(config.get("amazon_uk", {}).values()): 
        amazon = AmazonApi(config["amazon_uk"]["ACCESS_KEY"], config["amazon_uk"]["SECRET_KEY"], config["amazon_uk"]["ASSOCIATE_TAG"], config["amazon_uk"]["COUNTRY"]) 
        search_result = amazon.search_items(BrowseNodeId=category_id, ItemCount=10) 
        items.extend([{"id": item.asin, "title": item.item_info.title.display_value} for item in search_result.items]) 
    return items 
Utils file created: %FILE%
) else (
File already exists: %FILE%
)

:: data.py in utils
set "FILE=%UTILS_DIR%\data.py"
if not exist "%FILE%" (
import os 
import json 
 
SITE_REQUEST_DIR = os.path.join(os.path.dirname(__file__), "siterequest") 
 
def load_site_request(user_id): 
    file_path = os.path.join(SITE_REQUEST_DIR, user_id) 
    if os.path.exists(file_path): 
        with open(file_path, 'r') as f: 
            return json.load(f) 
    return {} 
 
def save_site_request(user_id, site_request_data): 
    if not os.path.exists(SITE_REQUEST_DIR): 
        os.makedirs(SITE_REQUEST_DIR) 
    file_path = os.path.join(SITE_REQUEST_DIR, user_id) 
    with open(file_path, 'w') as f: 
        json.dump(site_request_data, f, indent=4) 
Utils file created: %FILE%
) else (
File already exists: %FILE%
)

echo All files have been created or already exist.
pause