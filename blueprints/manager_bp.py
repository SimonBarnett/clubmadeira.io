from flask import Blueprint, request, jsonify
from utils.auth import login_required
from utils.users import load_users_settings, save_users_settings
from utils.config import load_config, save_config
import logging
import json

# Behold manager_bp, the blueprint that governs with the authority of Zaphod Beeblebrox’s dual-headed presidency!
# This is the control room—admin-only, like the bridge of the Heart of Gold, but with less improbability.
manager_bp = Blueprint('manager_bp', __name__)

@manager_bp.route('/users', methods=['GET'])
@login_required(["admin"], require_all=True)
def get_users():
    users_settings = load_users_settings()
    user_list = [{"USERid": user_id, "email_address": user["email_address"], "contact_name": user["contact_name"]} 
                 for user_id, user in users_settings.items()]
    return jsonify({"status": "success", "users": user_list}), 200

@manager_bp.route('/users/<user_id>', methods=['GET'])
@login_required(["admin"], require_all=True)
def get_user(user_id):
    """
    Retrieves detailed user info for admins, faster than Trillian can calculate the meaning of life.
    Purpose: Like the Holy Grail sought by the Knights Who Say Ni, this endpoint delivers a user’s full profile—admin eyes only!
    Permissions: Restricted to "admin"—you must be the Messiah (or at least Brian) to wield this power!
    Inputs: URL parameter:
        - user_id (str): The ID of the user to fetch, e.g., "42".
    Outputs:
        - Success: JSON {"status": "success", "user": {"USERid": "<id>", "email_address": "<email>", ...}}, status 200—user data delivered!
        - Errors:
            - 404: {"status": "error", "message": "User not found"}—this user’s as dead as a parrot!
            - 500: {"status": "error", "message": "Server error: <reason>"}—the Ronnies lost the fork handles!
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
            "phone_number": user.get("phone_number", ""),
            "permissions": user.get("permissions", []),
            "website_url": user.get("website_url", ""),
            "referrals": user.get("referrals", {"visits": [], "orders": []})
        }
        log_data = user_data.copy()
        if "password" in log_data:
            log_data["password"] = "[REDACTED]"
        logging.debug(f"Retrieved user data for {user_id}: {json.dumps(log_data)}")
        return jsonify({"status": "success", "user": user_data}), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to retrieve user {user_id}: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@manager_bp.route('/permissions/<user_id>', methods=['GET'])
@login_required(["admin"], require_all=True)
def get_permissions(user_id):
    """
    Fetches a user’s permissions, like Zaphod checking his presidential privileges.
    Purpose: Returns the list of permissions for a user—admin-only, because only the chosen one (or Brian) gets to peek!
    Permissions: Restricted to "admin"—you’re either the Messiah or nobody!
    Inputs: URL parameter:
        - user_id (str): The ID of the user whose permissions are sought.
    Outputs:
        - Success: JSON {"status": "success", "permissions": [<permission_list>]}, status 200—rank revealed!
        - Errors:
            - 404: {"status": "error", "message": "User not found"}—this user’s not in the Guide!
            - 500: {"status": "error", "message": "Server error: <reason>"}—the Parrot’s pining again!
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
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@manager_bp.route('/permissions/<user_id>', methods=['POST'])
@login_required(["admin"], require_all=True)
def add_permission(user_id):
    """
    Adds a permission to a user, like giving Zaphod a third head (if only!).
    Purpose: Grants a new permission to a user—admin-only, because only the chosen can wield this power!
    Permissions: Restricted to "admin"—you’re the Messiah, not just a naughty boy!
    Inputs: JSON payload with:
        - permission (str): The permission to add, e.g., "merchant", "wixpro".
    Outputs:
        - Success: JSON {"status": "success", "message": "Permission added"}, status 200—rank upgraded!
        - Errors:
            - 400: {"status": "error", "message": "Permission field is required"}—no permission, no fork handles!
            - 404: {"status": "error", "message": "User not found"}—this user’s not in the galaxy!
            - 400: {"status": "error", "message": "Permission already exists"}—already got it, Biggus Dickus!
            - 500: {"status": "error", "message": "Server error: <reason>"}—the system’s gone to Judea!
    """
    try:
        data = request.get_json()
        if not data or 'permission' not in data:
            logging.warning(f"UX Issue - Missing permission field in request for user {user_id}: {json.dumps(data)}")
            return jsonify({"status": "error", "message": "Permission field is required"}), 400
        
        permission = data['permission']
        users_settings = load_users_settings()
        if user_id not in users_settings:
            logging.warning(f"UX Issue - User not found for adding permission: {user_id}")
            return jsonify({"status": "error", "message": "User not found"}), 404
        
        user_permissions = users_settings[user_id].get('permissions', [])
        if permission in user_permissions:
            logging.warning(f"UX Issue - Permission already exists for user {user_id}: {permission}")
            return jsonify({"status": "error", "message": "Permission already exists"}), 400
        
        user_permissions.append(permission)
        users_settings[user_id]['permissions'] = user_permissions
        save_users_settings(users_settings)
        logging.info(f"Added permission {permission} to user {user_id}")
        return jsonify({"status": "success", "message": "Permission added"}), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to add permission for user {user_id}: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

# region settings/api - Manage settings_key and affiliate_key

@manager_bp.route('/settings/settings_key', methods=['GET'])
@login_required(["admin"], require_all=True)
def get_settings_key_settings():
    """
    Retrieves all settings of type 'settings_key' from the configuration.
    Purpose: Provides admins with a list of settings_key settings for management.
    Permissions: Restricted to "admin"—only the chosen can access this!
    Inputs: None
    Outputs:
        - Success: JSON {"status": "success", "setting_type": "settings_key", "settings": [<list_of_settings>]}, status 200
        - Errors:
            - 404: {"status": "error", "message": "Setting type settings_key not found"} if no settings are found
            - 500: {"status": "error", "message": "Server error: <reason>"}
    """
    try:
        config = load_config()
        settings = []
        for key, value in config.items():
            if value.get('setting_type') == 'settings_key':
                fields = {k: v for k, v in value.items() if k not in ['_comment', 'setting_type', 'icon', 'doc_link']}
                setting = {
                    'key_type': key,
                    'fields': fields,
                    'icon': value.get('icon', 'icon-favicon'),
                    'doc_link': value.get('doc_link', ''),
                    'comment': value.get('_comment', '')
                }
                settings.append(setting)
        
        if not settings:
            logging.warning("No settings found for type 'settings_key'")
            return jsonify({"status": "error", "message": "Setting type settings_key not found"}), 404
        
        logging.debug(f"Retrieved settings_key settings: {json.dumps(settings)}")
        return jsonify({"status": "success", "setting_type": "settings_key", "settings": settings}), 200
    except Exception as e:
        logging.error(f"Failed to retrieve settings_key settings: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@manager_bp.route('/settings/settings_key/<key_type>', methods=['PATCH'])
@login_required(["admin"], require_all=True)
def patch_settings_key(key_type):
    """
    Updates specific fields of an existing settings_key entry.
    Purpose: Allows admins to modify parts of a settings_key setting.
    Permissions: Restricted to "admin".
    Inputs: JSON payload with fields to update.
    Outputs:
        - Success: JSON {"status": "success", "message": "Setting <key_type> updated"}, status 200
        - Errors:
            - 400: {"status": "error", "message": "No data provided"}
            - 404: {"status": "error", "message": "Setting not found"}
            - 400: {"status": "error", "message": "Invalid field: <field>"}
            - 500: {"status": "error", "message": "Server error: <reason>"}
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        config = load_config()
        if key_type not in config or config[key_type].get('setting_type') != 'settings_key':
            return jsonify({"status": "error", "message": "Setting not found"}), 404

        for field, value in data.items():
            if field in config[key_type]:
                config[key_type][field] = value
            else:
                return jsonify({"status": "error", "message": f"Invalid field: {field}"}), 400

        save_config(config)
        logging.info(f"Updated settings_key: {key_type}")
        return jsonify({"status": "success", "message": f"Setting {key_type} updated"}), 200
    except Exception as e:
        logging.error(f"Failed to update settings_key: {str(e)}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@manager_bp.route('/settings/settings_key/<key_type>', methods=['PUT'])
@login_required(["admin"], require_all=True)
def put_settings_key(key_type):
    """
    Replaces an existing settings_key entry or creates it if it doesn’t exist.
    Purpose: Allows admins to fully replace a settings_key setting.
    Permissions: Restricted to "admin".
    Inputs: JSON payload with full setting data (must include "setting_type": "settings_key").
    Outputs:
        - Success: JSON {"status": "success", "message": "Setting <key_type> replaced"}, status 200
        - Errors:
            - 400: {"status": "error", "message": "No data provided"}
            - 400: {"status": "error", "message": "Invalid setting_type for this endpoint."}
            - 500: {"status": "error", "message": "Server error: <reason>"}
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        if data.get('setting_type') != 'settings_key':
            return jsonify({"status": "error", "message": "Invalid setting_type for this endpoint."}), 400

        config = load_config()
        config[key_type] = data
        save_config(config)
        logging.info(f"Replaced settings_key: {key_type}")
        return jsonify({"status": "success", "message": f"Setting {key_type} replaced"}), 200
    except Exception as e:
        logging.error(f"Failed to replace settings_key: {str(e)}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@manager_bp.route('/settings/affiliate_key', methods=['GET'])
@login_required(["admin"], require_all=True)
def get_affiliate_key_settings():
    """
    Retrieves all settings of type 'affiliate_key' from the configuration.
    Purpose: Provides admins with a list of affiliate key settings for management.
    Permissions: Restricted to "admin"—only the chosen can access this!
    Inputs: None
    Outputs:
        - Success: JSON {"status": "success", "setting_type": "affiliate_key", "settings": [<list_of_settings>]}, status 200
        - Errors:
            - 404: {"status": "error", "message": "Setting type affiliate_key not found"} if no settings are found
            - 500: {"status": "error", "message": "Server error: <reason>"}
    """
    try:
        config = load_config()
        settings = []
        for key, value in config.items():
            if value.get('setting_type') == 'affiliate_key':
                fields = {k: v for k, v in value.items() if k not in ['_comment', 'setting_type', 'icon', 'doc_link']}
                setting = {
                    'key_type': key,
                    'fields': fields,
                    'icon': value.get('icon', 'icon-favicon'),
                    'doc_link': value.get('doc_link', ''),
                    'comment': value.get('_comment', '')
                }
                settings.append(setting)
        
        if not settings:
            logging.warning("No settings found for type 'affiliate_key'")
            return jsonify({"status": "error", "message": "Setting type affiliate_key not found"}), 404
        
        logging.debug(f"Retrieved affiliate_key settings: {json.dumps(settings)}")
        return jsonify({"status": "success", "setting_type": "affiliate_key", "settings": settings}), 200
    except Exception as e:
        logging.error(f"Failed to retrieve affiliate_key settings: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@manager_bp.route('/settings/affiliate_key/<key_type>', methods=['PATCH'])
@login_required(["admin"], require_all=True)
def patch_affiliate_key(key_type):
    """
    Updates specific fields of an existing affiliate_key entry.
    Purpose: Allows admins to modify parts of an affiliate_key setting.
    Permissions: Restricted to "admin".
    Inputs: JSON payload with fields to update.
    Outputs:
        - Success: JSON {"status": "success", "message": "Setting <key_type> updated"}, status 200
        - Errors:
            - 400: {"status": "error", "message": "No data provided"}
            - 404: {"status": "error", "message": "Setting not found"}
            - 400: {"status": "error", "message": "Invalid field: <field>"}
            - 500: {"status": "error", "message": "Server error: <reason>"}
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        config = load_config()
        if key_type not in config or config[key_type].get('setting_type') != 'affiliate_key':
            return jsonify({"status": "error", "message": "Setting not found"}), 404

        for field, value in data.items():
            if field in config[key_type]:
                config[key_type][field] = value
            else:
                return jsonify({"status": "error", "message": f"Invalid field: {field}"}), 400

        save_config(config)
        logging.info(f"Updated affiliate_key: {key_type}")
        return jsonify({"status": "success", "message": f"Setting {key_type} updated"}), 200
    except Exception as e:
        logging.error(f"Failed to update affiliate_key: {str(e)}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@manager_bp.route('/settings/affiliate_key/<key_type>', methods=['PUT'])
@login_required(["admin"], require_all=True)
def put_affiliate_key(key_type):
    """
    Replaces an existing affiliate_key entry or creates it if it doesn’t exist.
    Purpose: Allows admins to fully replace an affiliate_key setting.
    Permissions: Restricted to "admin".
    Inputs: JSON payload with full setting data (must include "setting_type": "affiliate_key").
    Outputs:
        - Success: JSON {"status": "success", "message": "Setting <key_type> replaced"}, status 200
        - Errors:
            - 400: {"status": "error", "message": "No data provided"}
            - 400: {"status": "error", "message": "Invalid setting_type for this endpoint."}
            - 500: {"status": "error", "message": "Server error: <reason>"}
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        if data.get('setting_type') != 'affiliate_key':
            return jsonify({"status": "error", "message": "Invalid setting_type for this endpoint."}), 400

        config = load_config()
        config[key_type] = data
        save_config(config)
        logging.info(f"Replaced affiliate_key: {key_type}")
        return jsonify({"status": "success", "message": f"Setting {key_type} replaced"}), 200
    except Exception as e:
        logging.error(f"Failed to replace affiliate_key: {str(e)}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

# endregion

# ASCII Art 1: The Two Ronnies’ Fork Handles
"""
       ______
      /|_||_\`.__
     (   _    _ _\
     =|  _    _  |  "Four candles? No, fork handles—admin privileges required!"
      | (_)  (_) |
       \._|\'|\'_./
          |__|__| 
"""