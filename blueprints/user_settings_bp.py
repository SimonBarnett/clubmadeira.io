from flask import Blueprint, request, jsonify
from utils.auth import login_required
from utils.users import load_users_settings, save_users_settings
import logging
import json

user_settings_bp = Blueprint('user_settings_bp', __name__)

@user_settings_bp.route('/<USERid>/user', methods=['PUT'])
@login_required(["self", "admin"], require_all=True)
def update_user_full(USERid):
    try:
        if USERid != request.user_id and "admin" not in request.permissions:
            logging.warning(f"Security Issue - Unauthorized full user update attempt for {USERid} by {request.user_id}")
            return jsonify({"status": "error", "message": "Unauthorized"}), 403

        data = request.get_json()
        if not data:
            logging.warning(f"UX Issue - Full user update attempt with no data for {USERid}")
            return jsonify({"status": "error", "message": "No data provided"}), 400

        users_settings = load_users_settings()
        if USERid not in users_settings:
            logging.warning(f"UX Issue - User not found for full update: {USERid}")
            return jsonify({"status": "error", "message": "User not found"}), 404

        # Full update replaces the entire user settings (except password, which requires /update-password)
        updated_user = {
            "email_address": data.get("email_address", users_settings[USERid]["email_address"]).lower(),
            "contact_name": data.get("contact_name", users_settings[USERid]["contact_name"]),
            "phone_number": data.get("phone_number", users_settings[USERid].get("phone_number", "")),
            "permissions": users_settings[USERid]["permissions"],  # Preserve existing permissions
            "password": users_settings[USERid]["password"]  # Password preserved
        }

        users_settings[USERid] = updated_user
        save_users_settings(users_settings)
        logging.info(f"Full user settings updated for user {USERid}")
        return jsonify({"status": "success", "message": f"User {USERid} settings updated"}), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to fully update user {USERid}: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500

@user_settings_bp.route('/<USERid>/user', methods=['PATCH'])
@login_required(["self", "admin", "wixpro"], require_all=False)
def update_user_partial(USERid):
    try:
        if USERid != request.user_id and "admin" not in request.permissions and "wixpro" not in request.permissions:
            logging.warning(f"Security Issue - Unauthorized partial user update attempt for {USERid} by {request.user_id}")
            return jsonify({"status": "error", "message": "Unauthorized"}), 403

        data = request.get_json()
        if not data:
            logging.warning(f"UX Issue - Partial user update attempt with no data for {USERid}")
            return jsonify({"status": "error", "message": "No data provided"}), 400

        users_settings = load_users_settings()
        if USERid not in users_settings:
            logging.warning(f"UX Issue - User not found for partial update: {USERid}")
            return jsonify({"status": "error", "message": "User not found"}), 404

        # Partial update modifies only provided fields
        user = users_settings[USERid]
        if "email_address" in data:
            user["email_address"] = data["email_address"].lower()
        if "contact_name" in data:
            user["contact_name"] = data["contact_name"]
        if "phone_number" in data:
            user["phone_number"] = data["phone_number"]

        users_settings[USERid] = user
        save_users_settings(users_settings)
        logging.info(f"Partial user settings updated for user {USERid}")
        return jsonify({"status": "success", "message": f"User {USERid} settings partially updated"}), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to partially update user {USERid}: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500

@user_settings_bp.route('/<USERid>/categories', methods=['GET'])
@login_required(["self"], require_all=True)
def get_user_categories(USERid):
    try:
        if USERid != request.user_id:
            logging.warning(f"Security Issue - Unauthorized categories retrieval attempt for {USERid} by {request.user_id}")
            return jsonify({"status": "error", "message": "Unauthorized"}), 403

        users_settings = load_users_settings()
        if USERid not in users_settings:
            logging.warning(f"UX Issue - User not found for categories retrieval: {USERid}")
            return jsonify({"status": "error", "message": "User not found"}), 404

        categories = users_settings[USERid].get("categories", [])
        logging.debug(f"Retrieved categories for user {USERid}: {json.dumps(categories)}")
        return jsonify({"status": "success", "categories": categories}), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to retrieve categories for user {USERid}: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500

@user_settings_bp.route('/<USERid>/categories', methods=['PUT'])
@login_required(["self"], require_all=True)
def replace_user_categories(USERid):
    try:
        if USERid != request.user_id:
            logging.warning(f"Security Issue - Unauthorized categories replacement attempt for {USERid} by {request.user_id}")
            return jsonify({"status": "error", "message": "Unauthorized"}), 403

        data = request.get_json()
        if not data or "categories" not in data:
            logging.warning(f"UX Issue - Categories replacement attempt missing data for {USERid}")
            return jsonify({"status": "error", "message": "Categories data required"}), 400

        users_settings = load_users_settings()
        if USERid not in users_settings:
            logging.warning(f"UX Issue - User not found for categories replacement: {USERid}")
            return jsonify({"status": "error", "message": "User not found"}), 404

        # Replace entire categories list
        users_settings[USERid]["categories"] = data["categories"]
        save_users_settings(users_settings)
        logging.info(f"Categories replaced for user {USERid}")
        return jsonify({"status": "success", "message": f"Categories replaced for user {USERid}"}), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to replace categories for user {USERid}: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500

@user_settings_bp.route('/<USERid>/categories', methods=['PATCH'])
@login_required(["self"], require_all=True)
def update_user_categories(USERid):
    try:
        if USERid != request.user_id:
            logging.warning(f"Security Issue - Unauthorized categories update attempt for {USERid} by {request.user_id}")
            return jsonify({"status": "error", "message": "Unauthorized"}), 403

        data = request.get_json()
        if not data or "categories" not in data:
            logging.warning(f"UX Issue - Categories update attempt missing data for {USERid}")
            return jsonify({"status": "error", "message": "Categories data required"}), 400

        users_settings = load_users_settings()
        if USERid not in users_settings:
            logging.warning(f"UX Issue - User not found for categories update: {USERid}")
            return jsonify({"status": "error", "message": "User not found"}), 404

        # Update categories by merging with existing ones
        current_categories = users_settings[USERid].get("categories", [])
        updated_categories = data["categories"]
        users_settings[USERid]["categories"] = current_categories + [cat for cat in updated_categories if cat not in current_categories]
        save_users_settings(users_settings)
        logging.info(f"Categories updated for user {USERid}")
        return jsonify({"status": "success", "message": f"Categories updated for user {USERid}"}), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to update categories for user {USERid}: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500

@user_settings_bp.route('/<USERid>/categories', methods=['DELETE'])
@login_required(["self"], require_all=True)
def delete_user_categories(USERid):
    try:
        if USERid != request.user_id:
            logging.warning(f"Security Issue - Unauthorized categories deletion attempt for {USERid} by {request.user_id}")
            return jsonify({"status": "error", "message": "Unauthorized"}), 403

        users_settings = load_users_settings()
        if USERid not in users_settings:
            logging.warning(f"UX Issue - User not found for categories deletion: {USERid}")
            return jsonify({"status": "error", "message": "User not found"}), 404

        if "categories" in users_settings[USERid]:
            del users_settings[USERid]["categories"]
            save_users_settings(users_settings)
            logging.info(f"Categories deleted for user {USERid}")
        else:
            logging.debug(f"No categories found to delete for user {USERid}")
        
        return jsonify({"status": "success", "message": f"Categories deleted for user {USERid}"}), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to delete categories for user {USERid}: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500