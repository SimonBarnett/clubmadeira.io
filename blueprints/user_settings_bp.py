from flask import Blueprint, request, jsonify
from utils.auth import login_required
from utils.users import load_users_settings, save_users_settings
from utils.config import load_config
from utils import wix
import logging
import json

user_settings_bp = Blueprint('user_settings_bp', __name__)

# region <settings/user> GET, PUT, PATCH
@user_settings_bp.route('/settings/user', methods=['GET', 'PUT', 'PATCH'])
@login_required(["self"], require_all=True)
def manage_user_settings():
    """
    Manage the authenticated user's top-level settings based on the HTTP method.
    
    - GET: Retrieve the user's top-level settings as an array of fields and values.
    - PUT: Replace the entire top-level settings with the provided fields and values.
    - PATCH: Update specific fields in the user's top-level settings.
    """
    try:
        user_id = request.user_id
        users_settings = load_users_settings()
        
        if user_id not in users_settings:
            return jsonify({"status": "error", "message": "User not found"}), 404
        
        if request.method == 'GET':
            top_level_settings = {k: v for k, v in users_settings[user_id].items()}
            response = [{"field": key, "value": value} for key, value in top_level_settings.items()]
            return jsonify({"status": "success", "settings": response}), 200
        
        elif request.method == 'PUT':
            data = request.get_json()
            if not data:
                return jsonify({"status": "error", "message": "No data provided"}), 400
            
            required_fields = ["email", "notifications", "theme"]
            if not all(field in data for field in required_fields):
                return jsonify({"status": "error", "message": "Missing required fields"}), 400
            
            users_settings[user_id] = data
            save_users_settings(users_settings)
            logging.info(f"Top-level settings replaced for user {user_id}")
            return jsonify({"status": "success", "message": "Settings replaced"}), 200
        
        elif request.method == 'PATCH':
            data = request.get_json()
            if not data:
                return jsonify({"status": "error", "message": "No data provided"}), 400
            
            for field, value in data.items():
                if field in users_settings[user_id]:
                    users_settings[user_id][field] = value
                else:
                    return jsonify({"status": "error", "message": f"Invalid field: {field}"}), 400
            
            save_users_settings(users_settings)
            logging.info(f"Top-level settings updated for user {user_id}")
            return jsonify({"status": "success", "message": "Settings updated"}), 200
    
    except Exception as e:
        logging.error(f"Error managing user settings: {str(e)}")
        return jsonify({"status": "error", "message": "Server error"}), 500
# endregion <settings/user> GET, PUT, PATCH

# region settings/api - Manage client_api and api_key settings
@user_settings_bp.route('/settings/client_api', methods=['GET'])
@login_required(["allauth"], require_all=False)
def get_client_api_settings():
    """
    Retrieve all client_api settings from the configuration.
    """
    try:
        config = load_config()
        settings = [
            {
                "key_type": key,
                "fields": {k: v for k, v in value.items() if k not in ["setting_type", "icon", "doc_link", "_comment"]},
                "icon": value.get("icon", "icon-favicon"),
                "doc_link": value.get("doc_link", ""),
                "comment": value.get("_comment", "")
            }
            for key, value in config.items()
            if value.get("setting_type") == "client_api"
        ]
        return jsonify({"status": "success", "settings": settings}), 200
    except Exception as e:
        logging.error(f"Error retrieving client_api settings: {str(e)}")
        return jsonify({"status": "error", "message": "Server error"}), 500

@user_settings_bp.route('/settings/client_api/<key>', methods=['PUT', 'POST'])
@login_required(["self"], require_all=True)
def put_client_api_setting(key):
    """
    Replace the client_api setting for the specified key for the authenticated user.
    """
    try:
        user_id = request.user_id
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        config = load_config()
        if key not in config or config[key].get("setting_type") != "client_api":
            return jsonify({"status": "error", "message": "Invalid key"}), 400

        users_settings = load_users_settings()
        if user_id not in users_settings:
            return jsonify({"status": "error", "message": "User not found"}), 404

        if "settings" not in users_settings[user_id]:
            users_settings[user_id]["settings"] = {}
        if "client_api" not in users_settings[user_id]["settings"]:
            users_settings[user_id]["settings"]["client_api"] = {}
        users_settings[user_id]["settings"]["client_api"][key] = data
        save_users_settings(users_settings)
        return jsonify({"status": "success", "message": f"Setting {key} replaced"}), 200
    except Exception as e:
        logging.error(f"Error replacing client_api setting: {str(e)}")
        return jsonify({"status": "error", "message": "Server error"}), 500

@user_settings_bp.route('/settings/client_api/<key>', methods=['PATCH'])
@login_required(["self"], require_all=True)
def patch_client_api_setting(key):
    """
    Update specific fields of the client_api setting for the specified key for the authenticated user.
    """
    try:
        user_id = request.user_id
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        config = load_config()
        if key not in config or config[key].get("setting_type") != "client_api":
            return jsonify({"status": "error", "message": "Invalid key"}), 400

        users_settings = load_users_settings()
        if user_id not in users_settings or "settings" not in users_settings[user_id] or "client_api" not in users_settings[user_id]["settings"] or key not in users_settings[user_id]["settings"]["client_api"]:
            return jsonify({"status": "error", "message": "Setting not found"}), 404

        for field, value in data.items():
            if field in users_settings[user_id]["settings"]["client_api"][key]:
                users_settings[user_id]["settings"]["client_api"][key][field] = value
            else:
                return jsonify({"status": "error", "message": f"Invalid field: {field}"}), 400

        save_users_settings(users_settings)
        return jsonify({"status": "success", "message": f"Setting {key} updated"}), 200
    except Exception as e:
        logging.error(f"Error updating client_api setting: {str(e)}")
        return jsonify({"status": "error", "message": "Server error"}), 500

@user_settings_bp.route('/settings/api_key', methods=['GET'])
@login_required(["allauth"], require_all=False)
def get_api_key_settings():
    """
    Retrieve all api_key settings for the authenticated user, merging configuration defaults with saved user settings.
    """
    try:
        user_id = request.user_id
        config = load_config()
        users_settings = load_users_settings()
        
        if user_id not in users_settings:
            return jsonify({"status": "error", "message": "User not found"}), 404
        
        # Get user's saved api_key settings, defaulting to an empty dict if not present
        user_api_keys = users_settings[user_id].get("settings", {}).get("api_key", {})
        
        settings = []
        for key, value in config.items():
            if value.get("setting_type") == "api_key":
                # Extract default fields, excluding metadata
                default_fields = {k: v for k, v in value.items() if k not in ["setting_type", "icon", "doc_link", "_comment"]}
                # Get user's saved fields for this key, defaulting to an empty dict
                user_fields = user_api_keys.get(key, {})
                # Merge defaults with user settings, prioritizing user data
                merged_fields = {field: user_fields.get(field, default_fields.get(field, "")) for field in default_fields}
                setting = {
                    "key_type": key,
                    "fields": merged_fields,
                    "icon": value.get("icon", "icon-favicon"),
                    "doc_link": value.get("doc_link", ""),
                    "comment": value.get("_comment", "")
                }
                settings.append(setting)
        
        return jsonify({"status": "success", "settings": settings}), 200
    except Exception as e:
        logging.error(f"Error retrieving api_key settings: {str(e)}")
        return jsonify({"status": "error", "message": "Server error"}), 500

@user_settings_bp.route('/settings/api_key/<key>', methods=['PUT', 'POST'])
@login_required(["self"], require_all=True)
def put_api_key_setting(key):
    """
    Replace the api_key setting for the specified key for the authenticated user.
    """
    try:
        user_id = request.user_id
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        config = load_config()
        if key not in config or config[key].get("setting_type") != "api_key":
            return jsonify({"status": "error", "message": "Invalid key"}), 400

        users_settings = load_users_settings()
        if user_id not in users_settings:
            return jsonify({"status": "error", "message": "User not found"}), 404

        if "settings" not in users_settings[user_id]:
            users_settings[user_id]["settings"] = {}
        if "api_key" not in users_settings[user_id]["settings"]:
            users_settings[user_id]["settings"]["api_key"] = {}
        users_settings[user_id]["settings"]["api_key"][key] = data
        save_users_settings(users_settings)
        return jsonify({"status": "success", "message": f"Setting {key} replaced"}), 200
    except Exception as e:
        logging.error(f"Error replacing api_key setting: {str(e)}")
        return jsonify({"status": "error", "message": "Server error"}), 500

@user_settings_bp.route('/settings/api_key/<key>', methods=['PATCH'])
@login_required(["self"], require_all=True)
def patch_api_key_setting(key):
    """
    Update specific fields of the api_key setting for the specified key for the authenticated user.
    Only fields defined in the configuration are updated; others are ignored.
    """
    try:
        user_id = request.user_id
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        # Load the configuration to determine allowed fields
        config = load_config()
        if key not in config or config[key].get("setting_type") != "api_key":
            return jsonify({"status": "error", "message": "Invalid key"}), 400

        # Extract allowed fields from the configuration, excluding metadata
        allowed_fields = [field for field in config[key] if not field.startswith("_")]

        # Load user settings
        users_settings = load_users_settings()
        if user_id not in users_settings:
            return jsonify({"status": "error", "message": "User not found"}), 404

        # Ensure nested structure exists
        if "settings" not in users_settings[user_id]:
            users_settings[user_id]["settings"] = {}
        if "api_key" not in users_settings[user_id]["settings"]:
            users_settings[user_id]["settings"]["api_key"] = {}
        if key not in users_settings[user_id]["settings"]["api_key"]:
            users_settings[user_id]["settings"]["api_key"][key] = {}

        # Update only fields that are in the allowed_fields list
        for field, value in data.items():
            if field in allowed_fields:
                users_settings[user_id]["settings"]["api_key"][key][field] = value
            else:
                logging.info(f"Ignored invalid field: {field} for key: {key}")

        # Save the updated settings
        save_users_settings(users_settings)
        return jsonify({"status": "success", "message": f"Setting {key} updated"}), 200
    except Exception as e:
        logging.error(f"Error updating api_key setting: {str(e)}")
        return jsonify({"status": "error", "message": "Server error"}), 500

# endregion settings/api

@user_settings_bp.route('/settings/products', methods=['GET'])
@login_required(["self"], require_all=True)
def get_user_products():
    """Retrieve the list of products for the current user."""
    try:
        user_id = request.user_id  # Get the user ID from the token
        products = wix.fetch_user_products(user_id)
        return jsonify({"status": "success", "count": len(products), "products": products}), 200
    except Exception as e:
        logging.error(f"Error fetching products for user {request.user_id}: {str(e)}")
        return jsonify({"status": "error", "message": "Failed to fetch products"}), 500