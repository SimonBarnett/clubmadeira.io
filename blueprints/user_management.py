from flask import Blueprint, jsonify, request
from utils.auth import login_required
from utils.users import load_users_settings, save_users_settings  # Changed from utils.data to utils.users

# Define the user_management blueprint
user_management_bp = Blueprint('user_management', __name__)

@user_management_bp.route('/users', methods=['GET'])
@login_required(["admin"], require_all=True)
def get_users():
    """
    Retrieve a list of all users.
    """
    try:
        users_settings = load_users_settings()
        user_list = [
            {
                "USERid": user_id,
                "email_address": user.get("email_address", ""),
                "contact_name": user.get("contact_name", ""),
                "phone_number": user.get("phone_number", None)  # Add phone_number
            }
            for user_id, user in users_settings.items()
        ]
        return jsonify({"status": "success", "users": user_list}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@user_management_bp.route('/users/<user_id>', methods=['GET'])
@login_required(["admin"], require_all=True)
def get_user(user_id):
    """
    Retrieve details of a specific user.
    """
    try:
        users_settings = load_users_settings()
        if user_id not in users_settings:
            return jsonify({"status": "error", "message": "User not found"}), 404
        user = users_settings[user_id]
        user_data = {
            "USERid": user_id,
            "email_address": user.get("email_address", ""),
            "contact_name": user.get("contact_name", ""),
            "phone_number": user.get("phone_number", None),  # Add phone_number
            "permissions": user.get("permissions", []),
            "website_url": user.get("website_url", ""),
            "wixClientId": user.get("wixClientId", ""),
            "referrals": user.get("referrals", {"visits": [], "orders": []})
        }
        return jsonify({"status": "success", "user": user_data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@user_management_bp.route('/permissions/<user_id>', methods=['GET'])
@login_required(["admin"], require_all=True)
def get_permissions(user_id):
    """
    Retrieve the permissions of a specific user.
    """
    try:
        users_settings = load_users_settings()
        if user_id not in users_settings:
            return jsonify({"status": "error", "message": "User not found"}), 404
        permissions = users_settings[user_id].get('permissions', [])
        return jsonify({"status": "success", "permissions": permissions}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@user_management_bp.route('/permissions/<user_id>', methods=['POST'])
@login_required(["admin"], require_all=True)
def add_permission(user_id):
    """
    Add a permission to a specific user.
    """
    data = request.get_json()
    if 'permission' not in data:
        return jsonify({"status": "error", "message": "Permission field is required"}), 400
    permission = data['permission']
    try:
        users_settings = load_users_settings()
        if user_id not in users_settings:
            return jsonify({"status": "error", "message": "User not found"}), 404
        if permission in users_settings[user_id].get('permissions', []):
            return jsonify({"status": "error", "message": "Permission already exists"}), 400
        users_settings[user_id]['permissions'].append(permission)
        save_users_settings(users_settings)
        return jsonify({"status": "success", "message": "Permission added"}), 200
    except Exception as e:
        return