from flask import Blueprint, jsonify, request
from utils.auth import require_permissions
from utils.data import load_users_settings, save_users_settings

# Define the user_settings blueprint
user_settings_bp = Blueprint('user_settings', __name__)

@user_settings_bp.route('/<USERid>/user', methods=['GET'])
@require_permissions(["self", "admin"], require_all=False)
def get_user_settings(USERid):
    """
    Retrieve the settings for a specific user.

    Args:
        USERid (str): The ID of the user whose settings are being retrieved.

    Returns:
        JSON response with the user's settings or an error message.
    """
    try:
        users_settings = load_users_settings()
        if USERid not in users_settings:
            return jsonify({"status": "error", "message": "User not found"}), 404
        settings = users_settings[USERid]
        return jsonify({
            "status": "success",
            "contact_name": settings.get("contact_name", ""),
            "website_url": settings.get("website_url", ""),
            "email_address": settings.get("email_address", ""),
            "phone_number": settings.get("phone_number", ""),
            "wixClientId": settings.get("wixClientId", "")
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@user_settings_bp.route('/<USERid>/user', methods=['PUT'])
@require_permissions(["self", "admin"], require_all=False)
def put_user_settings(USERid):
    """
    Replace the entire settings for a specific user.

    Args:
        USERid (str): The ID of the user whose settings are being replaced.

    Returns:
        JSON response confirming the replacement or an error message.
    """
    if not request.json:
        return jsonify({"status": "error", "message": "Request body must contain settings"}), 400
    settings = request.json
    required_fields = ["contact_name", "website_url", "email_address", "phone_number", "wixClientId"]
    if not all(field in settings for field in required_fields):
        return jsonify({"status": "error", "message": "Settings must include all required fields"}), 400
    try:
        users_settings = load_users_settings()
        users_settings[USERid] = settings
        save_users_settings(users_settings)
        return jsonify({
            "status": "success",
            "message": f"Settings for user {USERid} replaced",
            "settings": settings
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@user_settings_bp.route('/<USERid>/user', methods=['PATCH'])
@require_permissions(["self", "admin", "wixpro"], require_all=False)
def patch_user_settings(USERid):
    """
    Partially update the settings for a specific user.

    Args:
        USERid (str): The ID of the user whose settings are being updated.

    Returns:
        JSON response confirming the update or an error message.
    """
    if not request.json:
        return jsonify({"status": "error", "message": "Request body must contain settings"}), 400
    new_settings = request.json
    try:
        users_settings = load_users_settings()
        if USERid not in users_settings:
            return jsonify({"status": "error", "message": "User not found"}), 404
        current_settings = users_settings[USERid]
        valid_fields = ["contact_name", "website_url", "email_address", "phone_number", "wixClientId"]

        # Restrict "wixpro" users to only updating wixClientId unless they have admin or self permissions
        if "wixpro" in request.permissions and not ("admin" in request.permissions or request.user_id == USERid):
            if any(key not in ["wixClientId"] for key in new_settings.keys()):
                return jsonify({"status": "error", "message": "Wixpro can only update wixClientId"}), 403

        # Update only the provided fields
        for key in new_settings:
            if key in valid_fields:
                current_settings[key] = new_settings[key]
        users_settings[USERid] = current_settings
        save_users_settings(users_settings)
        return jsonify({
            "status": "success",
            "message": f"Settings for user {USERid} updated",
            "settings": current_settings
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500