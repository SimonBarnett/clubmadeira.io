from flask import Blueprint, request, jsonify
from utils.auth import login_required
from utils.users import load_users_settings, save_users_settings
from utils.config import load_config, save_config
import logging
import json

# region Blueprint Setup
# Behold manager_bp, the blueprint that governs with the authority of Zaphod Beeblebrox’s dual-headed presidency!
# This is the control room—admin-only, like the bridge of the Heart of Gold, but with less improbability.
manager_bp = Blueprint('manager_bp', __name__)
# endregion

@manager_bp.route('/users', methods=['GET'])
@login_required(["admin"], require_all=True)
def get_users():
    users_settings = load_users_settings()
    user_list = [{"USERid": user_id, "email_address": user["email_address"], "contact_name": user["contact_name"]} 
                 for user_id, user in users_settings.items()]
    return jsonify({"status": "success", "users": user_list}), 200

# region /users/<user_id> GET - The Admin’s Guide to the User Galaxy
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
        # Load the user database—like Arthur Dent flipping through the Guide, but with less tea.
        users_settings = load_users_settings()
        if user_id not in users_settings:
            logging.warning(f"UX Issue - User not found: {user_id}")
            return jsonify({"status": "error", "message": "User not found"}), 404
        
        # Assemble the user data—fit for the Life of Brian’s People’s Front.
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
        # Redact sensitive data in logs—nobody expects the password!
        log_data = user_data.copy()
        if "password" in log_data:
            log_data["password"] = "[REDACTED]"
        logging.debug(f"Retrieved user data for {user_id}: {json.dumps(log_data)}")
        return jsonify({"status": "success", "user": user_data}), 200
    except Exception as e:
        # Marvin’s take: “I fetched a user, and now I’m broken.”
        logging.error(f"UX Issue - Failed to retrieve user {user_id}: {str(e)}", exc_info=True)
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

# region /permissions/<user_id> GET - Checking the Galactic Rank
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
        # Load the user settings—like the Guide, but less likely to say "Don’t Panic".
        users_settings = load_users_settings()
        if user_id not in users_settings:
            logging.warning(f"UX Issue - User not found for permissions: {user_id}")
            return jsonify({"status": "error", "message": "User not found"}), 404
        
        # Fetch permissions—neater than Ronnie Corbett’s wordplay.
        permissions = users_settings[user_id].get('permissions', [])
        logging.debug(f"Retrieved permissions for user {user_id}: {json.dumps(permissions)}")
        return jsonify({"status": "success", "permissions": permissions}), 200
    except Exception as e:
        # Marvin groans: “I checked permissions, and now I’m depressed.”
        logging.error(f"UX Issue - Failed to retrieve permissions for user {user_id}: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
# endregion

# region /permissions/<user_id> POST - Granting Galactic Privileges
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
        # Arthur Dent fumbles the JSON—where’s that permission?
        data = request.get_json()
        if not data or 'permission' not in data:
            logging.warning(f"UX Issue - Missing permission field in request for user {user_id}: {json.dumps(data)}")
            return jsonify({"status": "error", "message": "Permission field is required"}), 400
        
        permission = data['permission']
        users_settings = load_users_settings()
        if user_id not in users_settings:
            logging.warning(f"UX Issue - User not found for adding permission: {user_id}")
            return jsonify({"status": "error", "message": "User not found"}), 404
        
        # Check if they’ve already got it—like asking for four candles twice!
        user_permissions = users_settings[user_id].get('permissions', [])
        if permission in user_permissions:
            logging.warning(f"UX Issue - Permission already exists for user {user_id}: {permission}")
            return jsonify({"status": "error", "message": "Permission already exists"}), 400
        
        # Add the permission—stronger than a Wookiee’s grip!
        user_permissions.append(permission)
        users_settings[user_id]['permissions'] = user_permissions
        save_users_settings(users_settings)
        logging.info(f"Added permission {permission} to user {user_id}")
        return jsonify({"status": "success", "message": "Permission added"}), 200
    except Exception as e:
        # Marvin’s verdict: “I added a permission, and now I’m broken.”
        logging.error(f"UX Issue - Failed to add permission for user {user_id}: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
# endregion

# region /settings/affiliate_key GET - Retrieving Affiliate Key Settings
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
# endregion