from flask import Blueprint, jsonify, request
from utils.auth import login_required
from utils.users import load_users_settings, save_users_settings
import logging
import json

user_management_bp = Blueprint('user_management', __name__)

@user_management_bp.route('/users', methods=['GET'])  # Added explicit route
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
                "phone_number": user.get("phone_number", None)
            }
            for user_id, user in users_settings.items()
        ]
        if not user_list:
            logging.warning("UX Issue - No users found in settings")
        logging.debug(f"Retrieved user list: {json.dumps(user_list)}")
        return jsonify({"status": "success", "users": user_list}), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to retrieve users: {str(e)}", exc_info=True)
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
            logging.warning(f"UX Issue - User not found: {user_id}")
            return jsonify({"status": "error", "message": "User not found"}), 404
        user = users_settings[user_id]
        user_data = {
            "USERid": user_id,
            "email_address": user.get("email_address", ""),
            "contact_name": user.get("contact_name", ""),
            "phone_number": user.get("phone_number", None),
            "permissions": user.get("permissions", []),
            "website_url": user.get("website_url", ""),
            "wixClientId": user.get("wixClientId", ""),
            "referrals": user.get("referrals", {"visits": [], "orders": []})
        }
        # Redact sensitive data in logs
        log_data = user_data.copy()
        if "password" in log_data:
            log_data["password"] = "[REDACTED]"
        logging.debug(f"Retrieved user data for {user_id}: {json.dumps(log_data)}")
        return jsonify({"status": "success", "user": user_data}), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to retrieve user {user_id}: {str(e)}", exc_info=True)
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
            logging.warning(f"UX Issue - User not found for permissions: {user_id}")
            return jsonify({"status": "error", "message": "User not found"}), 404
        permissions = users_settings[user_id].get('permissions', [])
        logging.debug(f"Retrieved permissions for user {user_id}: {json.dumps(permissions)}")
        return jsonify({"status": "success", "permissions": permissions}), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to retrieve permissions for user {user_id}: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500

@user_management_bp.route('/permissions/<user_id>', methods=['POST'])
@login_required(["admin"], require_all=True)
def add_permission(user_id):
    """
    Add a permission to a specific user.
    """
    try:
        data = request.get_json()
        if 'permission' not in data:
            logging.warning(f"UX Issue - Missing permission field in request for user {user_id}: {json.dumps(data)}")
            return jsonify({"status": "error", "message": "Permission field is required"}), 400
        permission = data['permission']
        users_settings = load_users_settings()
        if user_id not in users_settings:
            logging.warning(f"UX Issue - User not found for adding permission: {user_id}")
            return jsonify({"status": "error", "message": "User not found"}), 404
        if permission in users_settings[user_id].get('permissions', []):
            logging.warning(f"UX Issue - Permission already exists for user {user_id}: {permission}")
            return jsonify({"status": "error", "message": "Permission already exists"}), 400
        users_settings[user_id].setdefault('permissions', []).append(permission)
        save_users_settings(users_settings)
        logging.debug(f"Added permission {permission} to user {user_id}")
        return jsonify({"status": "success", "message": "Permission added"}), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to add permission for user {user_id}: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500