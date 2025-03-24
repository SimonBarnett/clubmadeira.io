from flask import Blueprint, jsonify, request
from utils.data_utils import load_json_file, save_json_file
from utils.decorators import require_permissions

user_management_bp = Blueprint('user_management', __name__)

@user_management_bp.route('/', methods=['GET'])
@require_permissions(['admin'])
def get_users():
    users_settings = load_json_file('users_settings.json')
    user_list = [{"USERid": user_id, "email_address": user["email_address"], "contact_name": user["contact_name"]}
                 for user_id, user in users_settings.items()]
    return jsonify({"status": "success", "users": user_list}), 200

@user_management_bp.route('/<user_id>', methods=['GET'])
@require_permissions(['admin'])
def get_user(user_id):
    users_settings = load_json_file('users_settings.json')
    if user_id not in users_settings:
        return jsonify({"status": "error", "message": "User not found"}), 404
    user = users_settings[user_id]
    user_data = {
        "USERid": user_id,
        "email_address": user["email_address"],
        "contact_name": user["contact_name"],
        "permissions": user["permissions"],
        "website_url": user.get("website_url", ""),
        "wixClientId": user.get("wixClientId", ""),
        "referrals": user.get("referrals", {"visits": [], "orders": []})
    }
    return jsonify({"status": "success", "user": user_data}), 200