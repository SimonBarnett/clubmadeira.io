from flask import Blueprint, jsonify, request, render_template 
from utils.auth import login_user, signup_user 
from utils.users import load_users_settings, save_users_settings 
import jwt 
import datetime 
from flask import current_app 
 
authentication_bp = Blueprint('authentication', __name__) 
 
@authentication_bp.route('/login', methods=['POST']) 
def login(): 
    return login_user() 
 
@authentication_bp.route('/signup', methods=['GET']) 
def signup_page(): 
    return render_template('signup.html') 
 
@authentication_bp.route('/signup', methods=['POST']) 
def signup(): 
    return signup_user() 
 
@authentication_bp.route('/update-password', methods=['POST']) 
@login_required(["allauth"], require_all=False) 
def update_password(): 
    data = request.get_json() 
    if not data or 'email' not in data or 'password' not in data: 
        return jsonify({"status": "error", "message": "Email and password required"}), 400 
    email = data["email"].strip() 
    new_password = data["password"].strip() 
    users_settings = load_users_settings() 
    user_id = next((uid for uid, u in users_settings.items() if u["email_address"].lower() == email.lower()), None) 
    if not user_id or user_id != request.user_id: 
        return jsonify({"status": "error", "message": "Unauthorized"}), 403 
    import bcrypt 
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8') 
    users_settings[user_id]["password"] = hashed_password 
    save_users_settings(users_settings) 
    return jsonify({"status": "success", "message": f"Password updated for {email}", "user_id": user_id}), 200 
