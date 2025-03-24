from flask import Blueprint, jsonify, request
from utils.auth import require_permissions
from utils.data import load_site_request, save_site_request, load_users_settings
import os
import datetime
import re

# Define the Blueprint
site_request_bp = Blueprint('site_request', __name__)

# Endpoint to save a site request
@site_request_bp.route('/<user_id>/siterequest', methods=['POST'])
@require_permissions(["admin", "merchant", "community"], require_all=False)
def save_site_request_endpoint(user_id):
    """
    Save a site request for a specific user.
    
    Args:
        user_id (str): The ID of the user submitting the site request.
    
    Returns:
        JSON response with status and message.
    """
    try:
        # Get JSON data from the request
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        # Validate user_id consistency between URL and body
        body_user_id = data.get("userId")
        if body_user_id and body_user_id != user_id:
            return jsonify({"status": "error", "message": "User ID in body does not match URL"}), 400

        # Permission check: Admins can save for any user, others only for themselves
        if "admin" not in request.permissions and request.user_id != user_id:
            return jsonify({"status": "error", "message": "Unauthorized: Must be admin or match user_id"}), 403

        # Construct site request data
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

        # Validate required fields
        if not site_request["communityName"]:
            return jsonify({"status": "error", "message": "Community name or store name is required"}), 400

        # Validate domain name
        domain_regex = r'^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$'
        if not re.match(domain_regex, site_request["preferredDomain"]):
            return jsonify({"status": "error", "message": "Invalid domain name"}), 400

        # Process page images
        for page in site_request["pages"]:
            if "images" in page and page["images"]:
                page["images"] = [img if isinstance(img, str) else "placeholder" for img in page["images"]]

        # Save the site request
        save_site_request(user_id, site_request)
        return jsonify({"status": "success", "message": "Site request saved successfully"}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

# Endpoint to list all site requests
@site_request_bp.route('/siterequests', methods=['GET'])
@require_permissions(["admin", "wixpro"], require_all=False)
def list_site_requests():
    """
    List all site requests, accessible only to admin or wixpro users.
    
    Returns:
        JSON response with status and a list of site request summaries.
    """
    try:
        siterequest_dir = 'siterequest'
        # Return empty list if directory doesn't exist
        if not os.path.exists(siterequest_dir):
            return jsonify({"status": "success", "siterequests": []}), 200

        # Load user settings and initialize list
        users_settings = load_users_settings()
        siterequests = []

        # Iterate through site request files
        for filename in os.listdir(siterequest_dir):
            if filename.endswith('.json'):
                user_id = filename.replace('.json', '')
                site_request = load_site_request(user_id)
                if site_request:
                    # Extract user details from settings
                    contact_name = users_settings.get(user_id, {}).get('contact_name', '')
                    email = users_settings.get(user_id, {}).get('email_address', '')
                    request_type = site_request.get('type', '')
                    store_name = site_request.get('storeName')
                    community_name = site_request.get('communityName')
                    organisation = store_name if store_name else community_name if community_name else ''
                    received_at = site_request.get('submitted_at', '')

                    # Append site request summary
                    siterequests.append({
                        'user_id': user_id,
                        'type': request_type,
                        'received_at': received_at,
                        'contact_name': contact_name,
                        'email': email,
                        'organisation': organisation
                    })

        # Sort by submission time, most recent first
        siterequests.sort(key=lambda x: x['received_at'] or '', reverse=True)
        return jsonify({"status": "success", "siterequests": siterequests}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500