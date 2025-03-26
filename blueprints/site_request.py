from flask import Blueprint, request, jsonify
from utils.auth import login_required
from utils.data import load_site_request, save_site_request
from utils.users import load_users_settings
import datetime
import os
import re
import logging
import json

site_request_bp = Blueprint('site_request', __name__)

@site_request_bp.route('/siterequest/<user_id>', methods=['POST'])  # Added explicit route
def save_site_request_endpoint(user_id):
    try:
        data = request.get_json()
        if not data:
            logging.warning("UX Issue - Site request save attempt with no data")
            return jsonify({"status": "error", "message": "No data provided"}), 400

        body_user_id = data.get("userId")
        if body_user_id and body_user_id != user_id:
            logging.warning(f"Security Issue - User ID mismatch: URL={user_id}, Body={body_user_id}")
            return jsonify({"status": "error", "message": "User ID in body does not match URL"}), 400

        if "admin" not in request.permissions and request.user_id != user_id:
            logging.warning(f"Security Issue - Unauthorized site request save by {request.user_id} for {user_id}")
            return jsonify({"status": "error", "message": "Unauthorized: Must be admin or match user_id"}), 403

        request_type = data.get("type", "community")
        site_request = {
            "user_id": user_id,
            "type": request_type,
            "communityName": data.get("communityName") or data.get("storeName") or "",
            "aboutCommunity": data.get("aboutCommunity") or data.get("aboutStore") or "",
            "communityLogos": data.get("communityLogos") or data.get("storeLogos") or [],
            "colorPrefs": data.get("colorPrefs", ""),
            "stylingDetails": data.get("stylingDetails", ""),
            "preferredDomain": data.get("preferredDomain", "mycommunity.org"),
            "emails": data.get("emails", []),
            "pages": data.get("pages", []),
            "widgets": data.get("widgets", []),
            "submitted_at": datetime.datetime.utcnow().isoformat()
        }

        if not site_request["communityName"]:
            logging.warning(f"UX Issue - Site request missing community/store name for user {user_id}")
            return jsonify({"status": "error", "message": "Community name or store name is required"}), 400

        domain_regex = r'^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$'
        if not re.match(domain_regex, site_request["preferredDomain"]):
            logging.warning(f"UX Issue - Invalid domain name for user {user_id}: {site_request['preferredDomain']}")
            return jsonify({"status": "error", "message": "Invalid domain name"}), 400

        for page in site_request["pages"]:
            if "images" in page and page["images"]:
                page["images"] = [img if isinstance(img, str) else "placeholder" for img in page["images"]]

        save_site_request(user_id, site_request)
        logging.debug(f"Site request saved for user {user_id}: {json.dumps(site_request)}")
        return jsonify({"status": "success", "message": "Site request saved successfully"}), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to save site request for user {user_id}: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@site_request_bp.route('/siterequests', methods=['GET'])
@login_required(["admin", "wixpro"], require_all=False)
def list_site_requests():
    try:
        siterequest_dir = 'siterequest'
        if not os.path.exists(siterequest_dir):
            logging.warning("UX Issue - No site requests directory found")
            return jsonify({"status": "success", "siterequests": []}), 200

        users_settings = load_users_settings()
        siterequests = []

        for filename in os.listdir(siterequest_dir):
            if filename.endswith('.json'):
                user_id = filename.replace('.json', '')
                site_request = load_site_request(user_id)
                if site_request:
                    contact_name = users_settings.get(user_id, {}).get('contact_name', '')
                    email = users_settings.get(user_id, {}).get('email_address', '')
                    request_type = site_request.get('type', '')
                    store_name = site_request.get('storeName')
                    community_name = site_request.get('communityName')
                    organisation = store_name if store_name else community_name if community_name else ''
                    received_at = site_request.get('submitted_at', '')

                    siterequests.append({
                        'user_id': user_id,
                        'type': request_type,
                        'received_at': received_at,
                        'contact_name': contact_name,
                        'email': email,
                        'organisation': organisation
                    })

        if not siterequests:
            logging.warning("UX Issue - No site requests found in directory")
        logging.debug(f"Listed site requests: {json.dumps(siterequests)}")
        return jsonify({"status": "success", "siterequests": siterequests}), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to list site requests: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500