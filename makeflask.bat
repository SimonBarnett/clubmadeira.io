@echo off
sleep 1
setlocal enabledelayedexpansion
sleep 1

sleep 1
:: Define the root directory of the Flask project
sleep 1
set "ROOT_DIR=C:\inetpub\clubmadeira.io"
sleep 1

sleep 1
:: Define the folders
sleep 1
set "BLUEPRINTS_DIR=%ROOT_DIR%\blueprints"
sleep 1
set "UTILS_DIR=%ROOT_DIR%\utils"
sleep 1

sleep 1
:: Check and create blueprints folder if it doesn't exist
sleep 1
if not exist "%BLUEPRINTS_DIR%" (
sleep 1
    echo Blueprints folder does not exist. Creating...
sleep 1
    mkdir "%BLUEPRINTS_DIR%"
sleep 1
)
sleep 1

sleep 1
:: Check and create utils folder if it doesn't exist
sleep 1
if not exist "%UTILS_DIR%" (
sleep 1
    echo Utils folder does not exist. Creating...
sleep 1
    mkdir "%UTILS_DIR%"
sleep 1
)
sleep 1

sleep 1
:: Create Blueprint files
sleep 1
echo Creating Blueprint files...
sleep 1

sleep 1
:: authentication.py in blueprints
sleep 1
set "FILE=%BLUEPRINTS_DIR%\authentication.py"
sleep 1
if not exist "%FILE%" (
sleep 1
    echo from flask import Blueprint, jsonify, request, render_template >> "%FILE%"
sleep 1
    echo from utils.auth import login_user, signup_user >> "%FILE%"
sleep 1
    echo from utils.users import load_users_settings, save_users_settings >> "%FILE%"
sleep 1
    echo import jwt >> "%FILE%"
sleep 1
    echo import datetime >> "%FILE%"
sleep 1
    echo from flask import current_app >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo authentication_bp = Blueprint('authentication', __name__) >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo @authentication_bp.route('/login', methods=['POST']) >> "%FILE%"
sleep 1
    echo def login(): >> "%FILE%"
sleep 1
    echo     return login_user() >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo @authentication_bp.route('/signup', methods=['GET']) >> "%FILE%"
sleep 1
    echo def signup_page(): >> "%FILE%"
sleep 1
    echo     return render_template('signup.html') >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo @authentication_bp.route('/signup', methods=['POST']) >> "%FILE%"
sleep 1
    echo def signup(): >> "%FILE%"
sleep 1
    echo     return signup_user() >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo @authentication_bp.route('/update-password', methods=['POST']) >> "%FILE%"
sleep 1
    echo @login_required(["allauth"], require_all=False) >> "%FILE%"
sleep 1
    echo def update_password(): >> "%FILE%"
sleep 1
    echo     data = request.get_json() >> "%FILE%"
sleep 1
    echo     if not data or 'email' not in data or 'password' not in data: >> "%FILE%"
sleep 1
    echo         return jsonify({"status": "error", "message": "Email and password required"}), 400 >> "%FILE%"
sleep 1
    echo     email = data["email"].strip() >> "%FILE%"
sleep 1
    echo     new_password = data["password"].strip() >> "%FILE%"
sleep 1
    echo     users_settings = load_users_settings() >> "%FILE%"
sleep 1
    echo     user_id = next((uid for uid, u in users_settings.items() if u["email_address"].lower() == email.lower()), None) >> "%FILE%"
sleep 1
    echo     if not user_id or user_id != request.user_id: >> "%FILE%"
sleep 1
    echo         return jsonify({"status": "error", "message": "Unauthorized"}), 403 >> "%FILE%"
sleep 1
    echo     import bcrypt >> "%FILE%"
sleep 1
    echo     hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8') >> "%FILE%"
sleep 1
    echo     users_settings[user_id]["password"] = hashed_password >> "%FILE%"
sleep 1
    echo     save_users_settings(users_settings) >> "%FILE%"
sleep 1
    echo     return jsonify({"status": "success", "message": f"Password updated for {email}", "user_id": user_id}), 200 >> "%FILE%"
sleep 1
    echo Blueprint file created: %FILE%
sleep 1
) else (
sleep 1
    echo File already exists: %FILE%
sleep 1
)
sleep 1

sleep 1
:: configuration.py in blueprints
sleep 1
set "FILE=%BLUEPRINTS_DIR%\configuration.py"
sleep 1
if not exist "%FILE%" (
sleep 1
    echo from flask import Blueprint, jsonify, request >> "%FILE%"
sleep 1
    echo from utils.config import load_config, save_config >> "%FILE%"
sleep 1
    echo from utils.auth import login_required >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo configuration_bp = Blueprint('configuration', __name__) >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo @configuration_bp.route('/config', methods=['GET']) >> "%FILE%"
sleep 1
    echo @login_required(["admin"], require_all=True) >> "%FILE%"
sleep 1
    echo def get_config(): >> "%FILE%"
sleep 1
    echo     config = load_config() >> "%FILE%"
sleep 1
    echo     return jsonify({"status": "success", "count": len(config), "config": config}), 200 >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo @configuration_bp.route('/config/<affiliate>', methods=['PATCH']) >> "%FILE%"
sleep 1
    echo @login_required(["admin"], require_all=True) >> "%FILE%"
sleep 1
    echo def replace_config(affiliate): >> "%FILE%"
sleep 1
    echo     config = load_config() >> "%FILE%"
sleep 1
    echo     data = request.get_json() >> "%FILE%"
sleep 1
    echo     if not data or not isinstance(data, dict): >> "%FILE%"
sleep 1
    echo         return jsonify({"status": "error", "message": "Invalid data"}), 400 >> "%FILE%"
sleep 1
    echo     config[affiliate] = data >> "%FILE%"
sleep 1
    echo     save_config(config) >> "%FILE%"
sleep 1
    echo     return jsonify({"status": "success", "message": f"Updated {affiliate} config"}), 200 >> "%FILE%"
sleep 1
    echo Blueprint file created: %FILE%
sleep 1
) else (
sleep 1
    echo File already exists: %FILE%
sleep 1
)
sleep 1

sleep 1
:: data_retrieval.py in blueprints
sleep 1
set "FILE=%BLUEPRINTS_DIR%\data_retrieval.py"
sleep 1
if not exist "%FILE%" (
sleep 1
    echo from flask import Blueprint, jsonify, request >> "%FILE%"
sleep 1
    echo from utils.auth import login_required >> "%FILE%"
sleep 1
    echo from utils.categories import get_all_categories, filter_categories_with_products >> "%FILE%"
sleep 1
    echo from utils.products import search_all_discounted >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo data_retrieval_bp = Blueprint('data_retrieval', __name__) >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo @data_retrieval_bp.route('/categories', methods=['GET']) >> "%FILE%"
sleep 1
    echo @login_required(["allauth"], require_all=False) >> "%FILE%"
sleep 1
    echo def get_categories(): >> "%FILE%"
sleep 1
    echo     parent_id = request.args.get('parent_id') >> "%FILE%"
sleep 1
    echo     categories = get_all_categories(parent_id) >> "%FILE%"
sleep 1
    echo     return jsonify({"status": "success", "count": len(categories), "categories": categories}), 200 >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo @data_retrieval_bp.route('/discounted-products', methods=['GET']) >> "%FILE%"
sleep 1
    echo def get_all_discounted_products(): >> "%FILE%"
sleep 1
    echo     category_id = request.args.get('category_id') >> "%FILE%"
sleep 1
    echo     if not category_id: >> "%FILE%"
sleep 1
    echo         return jsonify({"status": "error", "message": "category_id required"}), 400 >> "%FILE%"
sleep 1
    echo     products = search_all_discounted(category_id) >> "%FILE%"
sleep 1
    echo     return jsonify({"status": "success", "count": len(products), "products": products}), 200 >> "%FILE%"
sleep 1
    echo Blueprint file created: %FILE%
sleep 1
) else (
sleep 1
    echo File already exists: %FILE%
sleep 1
)
sleep 1

sleep 1
:: referral.py in blueprints
sleep 1
set "FILE=%BLUEPRINTS_DIR%\referral.py"
sleep 1
if not exist "%FILE%" (
sleep 1
    echo from flask import Blueprint, jsonify, request >> "%FILE%"
sleep 1
    echo from utils.users import load_users_settings, save_users_settings >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo referral_bp = Blueprint('referral', __name__) >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo @referral_bp.route('/referal', methods=['POST']) >> "%FILE%"
sleep 1
    echo def handle_referral(): >> "%FILE%"
sleep 1
    echo     data = request.get_json() >> "%FILE%"
sleep 1
    echo     if not data or 'timestamp' not in data: >> "%FILE%"
sleep 1
    echo         return jsonify({"status": "error", "message": "Invalid data"}), 400 >> "%FILE%"
sleep 1
    echo     users_settings = load_users_settings() >> "%FILE%"
sleep 1
    echo     referer = data.get("referer", "none") >> "%FILE%"
sleep 1
    echo     if referer not in users_settings: >> "%FILE%"
sleep 1
    echo         users_settings[referer] = {"referrals": {"visits": [], "orders": []}} >> "%FILE%"
sleep 1
    echo     if "page" in data: >> "%FILE%"
sleep 1
    echo         users_settings[referer]["referrals"]["visits"].append({"page": data["page"], "timestamp": data["timestamp"]}) >> "%FILE%"
sleep 1
    echo     elif "orderId" in data: >> "%FILE%"
sleep 1
    echo         users_settings[referer]["referrals"]["orders"].append({"orderId": data["orderId"], "buyer": data["buyer"], "total": data["total"], "timestamp": data["timestamp"]}) >> "%FILE%"
sleep 1
    echo     save_users_settings(users_settings) >> "%FILE%"
sleep 1
    echo     return jsonify({"status": "success", "message": "Referral recorded", "referer": referer}), 200 >> "%FILE%"
sleep 1
    echo Blueprint file created: %FILE%
sleep 1
) else (
sleep 1
    echo File already exists: %FILE%
sleep 1
)
sleep 1

sleep 1
:: role_pages.py in blueprints
sleep 1
set "FILE=%BLUEPRINTS_DIR%\role_pages.py"
sleep 1
if not exist "%FILE%" (
sleep 1
    echo from flask import Blueprint, render_template >> "%FILE%"
sleep 1
    echo from utils.auth import login_required >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo role_pages_bp = Blueprint('role_pages', __name__) >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo @role_pages_bp.route('/admin', methods=['GET']) >> "%FILE%"
sleep 1
    echo @login_required(["admin"], require_all=True) >> "%FILE%"
sleep 1
    echo def admin(): >> "%FILE%"
sleep 1
    echo     return render_template('admin.html') >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo @role_pages_bp.route('/community', methods=['GET']) >> "%FILE%"
sleep 1
    echo @login_required(["community", "admin"], require_all=False) >> "%FILE%"
sleep 1
    echo def community(): >> "%FILE%"
sleep 1
    echo     return render_template('community.html') >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo @role_pages_bp.route('/merchant', methods=['GET']) >> "%FILE%"
sleep 1
    echo @login_required(["merchant", "admin"], require_all=False) >> "%FILE%"
sleep 1
    echo def merchant(): >> "%FILE%"
sleep 1
    echo     return render_template('merchant.html') >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo @role_pages_bp.route('/partner', methods=['GET']) >> "%FILE%"
sleep 1
    echo @login_required(["wixpro", "admin"], require_all=False) >> "%FILE%"
sleep 1
    echo def wixpro(): >> "%FILE%"
sleep 1
    echo     return render_template('partner.html') >> "%FILE%"
sleep 1
    echo Blueprint file created: %FILE%
sleep 1
) else (
sleep 1
    echo File already exists: %FILE%
sleep 1
)
sleep 1

sleep 1
:: site_request.py in blueprints
sleep 1
set "FILE=%BLUEPRINTS_DIR%\site_request.py"
sleep 1
if not exist "%FILE%" (
sleep 1
    echo from flask import Blueprint, jsonify, request >> "%FILE%"
sleep 1
    echo from utils.auth import login_required >> "%FILE%"
sleep 1
    echo from utils.data import save_site_request, load_site_request >> "%FILE%"
sleep 1
    echo import datetime >> "%FILE%"
sleep 1
    echo import re >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo site_request_bp = Blueprint('site_request', __name__) >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo @site_request_bp.route('/<user_id>/siterequest', methods=['POST']) >> "%FILE%"
sleep 1
    echo @login_required(["admin", "merchant", "community"], require_all=False) >> "%FILE%"
sleep 1
    echo def save_site_request_endpoint(user_id): >> "%FILE%"
sleep 1
    echo     data = request.get_json() >> "%FILE%"
sleep 1
    echo     if not data or (data.get("userId") and data["userId"] != user_id): >> "%FILE%"
sleep 1
    echo         return jsonify({"status": "error", "message": "Invalid data"}), 400 >> "%FILE%"
sleep 1
    echo     if request.user_id != user_id: >> "%FILE%"
sleep 1
    echo         return jsonify({"status": "error", "message": "Unauthorized"}), 403 >> "%FILE%"
sleep 1
    echo     request_type = data.get("type", "community") >> "%FILE%"
sleep 1
    echo     site_request = { >> "%FILE%"
sleep 1
    echo         "user_id": user_id, >> "%FILE%"
sleep 1
    echo         "type": request_type, >> "%FILE%"
sleep 1
    echo         "communityName": data.get("communityName", ""), >> "%FILE%"
sleep 1
    echo         "submitted_at": datetime.datetime.utcnow().isoformat() >> "%FILE%"
sleep 1
    echo     } >> "%FILE%"
sleep 1
    echo     if not site_request["communityName"]: >> "%FILE%"
sleep 1
    echo         return jsonify({"status": "error", "message": "Community name required"}), 400 >> "%FILE%"
sleep 1
    echo     save_site_request(user_id, site_request) >> "%FILE%"
sleep 1
    echo     return jsonify({"status": "success", "message": "Site request saved"}), 200 >> "%FILE%"
sleep 1
    echo Blueprint file created: %FILE%
sleep 1
) else (
sleep 1
    echo File already exists: %FILE%
sleep 1
)
sleep 1

sleep 1
:: user_management.py in blueprints
sleep 1
set "FILE=%BLUEPRINTS_DIR%\user_management.py"
sleep 1
if not exist "%FILE%" (
sleep 1
    echo from flask import Blueprint, jsonify, request >> "%FILE%"
sleep 1
    echo from utils.auth import login_required >> "%FILE%"
sleep 1
    echo from utils.users import load_users_settings, save_users_settings >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo user_management_bp = Blueprint('user_management', __name__) >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo @user_management_bp.route('/users', methods=['GET']) >> "%FILE%"
sleep 1
    echo @login_required(["admin"], require_all=True) >> "%FILE%"
sleep 1
    echo def get_users(): >> "%FILE%"
sleep 1
    echo     users_settings = load_users_settings() >> "%FILE%"
sleep 1
    echo     user_list = [{"USERid": uid, "email_address": u["email_address"], "contact_name": u["contact_name"]} for uid, u in users_settings.items()] >> "%FILE%"
sleep 1
    echo     return jsonify({"status": "success", "users": user_list}), 200 >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo @user_management_bp.route('/users/<user_id>', methods=['GET']) >> "%FILE%"
sleep 1
    echo @login_required(["admin"], require_all=True) >> "%FILE%"
sleep 1
    echo def get_user(user_id): >> "%FILE%"
sleep 1
    echo     users_settings = load_users_settings() >> "%FILE%"
sleep 1
    echo     user = users_settings.get(user_id) >> "%FILE%"
sleep 1
    echo     if not user: >> "%FILE%"
sleep 1
    echo         return jsonify({"status": "error", "message": "User not found"}), 404 >> "%FILE%"
sleep 1
    echo     return jsonify({"status": "success", "user": {"USERid": user_id, **user}}), 200 >> "%FILE%"
sleep 1
    echo Blueprint file created: %FILE%
sleep 1
) else (
sleep 1
    echo File already exists: %FILE%
sleep 1
)
sleep 1

sleep 1
:: user_settings.py in blueprints
sleep 1
set "FILE=%BLUEPRINTS_DIR%\user_settings.py"
sleep 1
if not exist "%FILE%" (
sleep 1
    echo from flask import Blueprint, jsonify, request >> "%FILE%"
sleep 1
    echo from utils.auth import login_required >> "%FILE%"
sleep 1
    echo from utils.users import get_user_settings, load_users_settings, save_users_settings >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo user_settings_bp = Blueprint('user_settings', __name__) >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo @user_settings_bp.route('/<USERid>/user', methods=['GET']) >> "%FILE%"
sleep 1
    echo @login_required(["self", "admin"], require_all=False) >> "%FILE%"
sleep 1
    echo def get_user_settings_endpoint(USERid): >> "%FILE%"
sleep 1
    echo     settings = get_user_settings(USERid) >> "%FILE%"
sleep 1
    echo     if not settings: >> "%FILE%"
sleep 1
    echo         return jsonify({"status": "error", "message": "User not found"}), 404 >> "%FILE%"
sleep 1
    echo     return jsonify({"status": "success", "settings": settings}), 200 >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo @user_settings_bp.route('/<USERid>/user', methods=['PUT']) >> "%FILE%"
sleep 1
    echo @login_required(["self", "admin"], require_all=False) >> "%FILE%"
sleep 1
    echo def put_user_settings(USERid): >> "%FILE%"
sleep 1
    echo     if not request.json: >> "%FILE%"
sleep 1
    echo         return jsonify({"status": "error", "message": "Settings required"}), 400 >> "%FILE%"
sleep 1
    echo     settings = request.json >> "%FILE%"
sleep 1
    echo     users_settings = load_users_settings() >> "%FILE%"
sleep 1
    echo     users_settings[USERid] = settings >> "%FILE%"
sleep 1
    echo     save_users_settings(users_settings) >> "%FILE%"
sleep 1
    echo     return jsonify({"status": "success", "message": f"Settings updated for {USERid}"}), 200 >> "%FILE%"
sleep 1
    echo Blueprint file created: %FILE%
sleep 1
) else (
sleep 1
    echo File already exists: %FILE%
sleep 1
)
sleep 1

sleep 1
:: utility.py in blueprints
sleep 1
set "FILE=%BLUEPRINTS_DIR%\utility.py"
sleep 1
if not exist "%FILE%" (
sleep 1
    echo from flask import Blueprint, jsonify, render_template >> "%FILE%"
sleep 1
    echo import os >> "%FILE%"
sleep 1
    echo import json >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo utility_bp = Blueprint('utility', __name__) >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo @utility_bp.route('/', methods=['GET']) >> "%FILE%"
sleep 1
    echo def home(): >> "%FILE%"
sleep 1
    echo     return render_template('login.html') >> "%FILE%"
sleep 1
    echo. >> "%FILE%"
sleep 1
    echo @utility_bp.route('/branding', methods=['GET']) >> "%FILE%"
sleep 1
    echo def branding(): >> "%FILE%"
sleep 1
    echo     root_dir = os.path.dirname(os.path.abspath(__file__)) >> "%FILE%"
sleep 1
    echo     json_path = os.path.join(root_dir, 'branding.json') >> "%FILE%"
sleep 1
    echo     try: >> "%FILE%"
sleep 1
    echo         with open(json_path, 'r') as f: >> "%FILE%"
sleep 1
    echo             branding_data = json.load(f) >> "%FILE%"
sleep 1
    echo         return jsonify(branding_data) >> "%FILE%"
sleep 1
    echo     except FileNotFoundError: >> "%FILE%"
sleep 1
    echo         return jsonify({'content': '<h1>Branding content not found</h1>'}), 500 >> "%FILE%"
sleep 1
    echo Blueprint file created: %FILE%
sleep 1
) else (
sleep 1
    echo File already exists: %FILE%
sleep 1
)
sleep 1

sleep 1
