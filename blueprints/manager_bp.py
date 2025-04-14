from flask import Blueprint, request, jsonify
from utils.auth import login_required
from utils.users import load_users_settings, save_users_settings
from utils.config import load_config, save_config
import logging
import json

# Behold manager_bp, the blueprint that governs with the authority of Zaphod Beeblebrox’s dual-headed presidency!
# This is the control room—admin-only, like the bridge of the Heart of Gold, but with less improbability.
manager_bp = Blueprint('manager_bp', __name__)

from flask import jsonify, abort
from utils.auth import login_required
from utils.users import load_users_settings

@manager_bp.route('/permission', methods=['PATCH'])
@login_required(required_permissions=['admin'])
def patch_permission():
    """
    Add a permission for a user if it doesn't already exist.
    Payload: {"USERid": "string", "permission": "string"}
    """
    data = request.get_json()
    if not data or 'USERid' not in data or 'permission' not in data:
        return jsonify({"status": "error", "message": "USERid and permission are required"}), 400
    
    user_id = data['USERid']
    new_permission = data['permission']
    
    users_data = load_users_settings()
    user = users_data.get(user_id)
    
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404
    
    if 'permissions' not in user:
        user['permissions'] = []
    
    if new_permission in user['permissions']:
        return jsonify({"status": "error", "message": f"Permission {new_permission} already exists for user {user_id}"}), 400
    
    user['permissions'].append(new_permission)
    save_users_settings(users_data)
    return jsonify({"status": "success", "message": f"Permission {new_permission} added for user {user_id}"}), 200

@manager_bp.route('/permission', methods=['DELETE'])
@login_required(required_permissions=['admin'])
def delete_permission():
    """
    Remove a specific permission from a user.
    Payload: {"USERid": "string", "permission": "string"}
    """
    data = request.get_json()
    if not data or 'USERid' not in data or 'permission' not in data:
        return jsonify({"status": "error", "message": "USERid and permission are required"}), 400
    
    user_id = data['USERid']
    permission_to_remove = data['permission']
    
    users_data = load_users_settings()
    user = users_data.get(user_id)
    
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404
    
    if 'permissions' not in user or permission_to_remove not in user['permissions']:
        return jsonify({"status": "error", "message": f"Permission {permission_to_remove} not found for user {user_id}"}), 404
    
    user['permissions'].remove(permission_to_remove)
    save_users_settings(users_data)
    return jsonify({"status": "success", "message": f"Permission {permission_to_remove} removed from user {user_id}"}), 200

# New endpoint for listing users by role
@manager_bp.route('/users/<role>', methods=['GET'])
@login_required(required_permissions=['admin'])
def get_users_by_role(role):
    """
    Retrieves a list of users who have the specified role in their permissions.
    Purpose: Allows admins to view users based on their roles.
    Permissions: Restricted to "admin".
    Inputs: 
        - role (string): The role to filter users by (e.g., 'admin', 'partner').
    Outputs:
        - Success: JSON {"status": "success", "role": "<role>", "users": [<list_of_users>]}, status 200
        - Info: JSON {"status": "info", "message": "No users found with role '<role>'"}, status 200 if no users are found
        - Errors:
            - 500: {"status": "error", "message": "Server error: <reason>"}
    """
    try:
        users_data = load_users_settings()
        users_with_role = []
        for user_id, user in users_data.items():
            if 'permissions' in user and role in user['permissions']:
                user_copy = user.copy()
                user_copy['USERid'] = user_id
                users_with_role.append(user_copy)
        
        if not users_with_role:
            logging.info(f"No users found with role '{role}'")
            return jsonify({"status": "info", "message": f"No users found with role '{role}'"}), 200
        
        logging.debug(f"Retrieved users with role '{role}': {len(users_with_role)} users found")
        return jsonify({"status": "success", "role": role, "users": users_with_role}), 200
    except Exception as e:
        logging.error(f"Failed to retrieve users with role '{role}': {str(e)}", exc_info=True)
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
                fields = {k: v for k, v in value.items() if k not in ['_comment', 'setting_type', 'icon', 'doc_link', '_description']}
                setting = {
                    'key_type': key,
                    'fields': fields,
                    'icon': value.get('icon', 'icon-favicon'),
                    'doc_link': value.get('doc_link', ''),
                    'comment': value.get('_comment', ''),
                    'description': value.get('_description', '')
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
        
        valid_fields = {k for k in config[key_type].keys() if k not in ['_comment', 'setting_type', 'icon', 'doc_link', '_description']}
        for field, value in data.items():
            if field in valid_fields:
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
        valid_fields = {k for k in config[key_type].keys() if k not in ['_comment', 'setting_type', 'icon', 'doc_link', '_description']} if key_type in config else set()
        if valid_fields:
            temp_data = {k: v for k, v in data.items() if k in valid_fields}
            temp_data['setting_type'] = 'settings_key'
            temp_data['_comment'] = config[key_type].get('_comment', '')
            temp_data['icon'] = config[key_type].get('icon', 'icon-favicon')
            temp_data['doc_link'] = config[key_type].get('doc_link', '')
            temp_data['_description'] = config[key_type].get('_description', '')
            config[key_type] = temp_data
        else:
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
    Purpose: Provides admins with a list of affiliate_key settings for management.
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
                fields = {k: v for k, v in value.items() if k not in ['_comment', 'setting_type', 'icon', 'doc_link', '_description']}
                setting = {
                    'key_type': key,
                    'fields': fields,
                    'icon': value.get('icon', 'icon-favicon'),
                    'doc_link': value.get('doc_link', ''),
                    'comment': value.get('_comment', ''),
                    'description': value.get('_description', '')
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
        
        valid_fields = {k for k in config[key_type].keys() if k not in ['_comment', 'setting_type', 'icon', 'doc_link', '_description']}
        for field, value in data.items():
            if field in valid_fields:
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
        valid_fields = {k for k in config[key_type].keys() if k not in ['_comment', 'setting_type', 'icon', 'doc_link', '_description']} if key_type in config else set()
        if valid_fields:
            temp_data = {k: v for k, v in data.items() if k in valid_fields}
            temp_data['setting_type'] = 'affiliate_key'
            temp_data['_comment'] = config[key_type].get('_comment', '')
            temp_data['icon'] = config[key_type].get('icon', 'icon-favicon')
            temp_data['doc_link'] = config[key_type].get('doc_link', '')
            temp_data['_description'] = config[key_type].get('_description', '')
            config[key_type] = temp_data
        else:
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