from flask import Blueprint, jsonify, request
from utils.data_utils import load_json_file, save_json_file
from utils.decorators import require_permissions
import os
import datetime
import re
import json

site_request_management_bp = Blueprint('site_request_management', __name__)

SITE_REQUEST_DIR = os.path.join(os.path.dirname(__file__), "siterequest")
os.makedirs(SITE_REQUEST_DIR, exist_ok=True)

def save_site_request(user_id, site_request):
    filename = os.path.join(SITE_REQUEST_DIR, f"{user_id}.json")
    with open(filename, 'w') as f:
        json.dump(site_request, f, indent=4)

def load_site_request(user_id):
    filename = os.path.join(SITE_REQUEST_DIR, f"{user_id}.json")
    return load_json_file(filename)

@site_request_management_bp.route('/<user_id>/siterequest', methods=['POST'])
@require_permissions(["admin", "merchant", "community"], require_all=False)
def save_site_request_endpoint(user_id):
    data = request.get_json()
    if not data:
        return jsonify({"status": "error", "message": "No data provided"}), 400
    body_user_id = data.get("userId")
    if body_user_id and body_user_id != user_id:
        return jsonify({"status": "error", "message": "User ID in body does not match URL"}), 400
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
        return jsonify({"status": "error", "message": "Community name or store name is required"}), 400
    domain_regex = r'^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$'
    if not re.match(domain_regex, site_request["preferredDomain"]):
        return jsonify({"status": "error", "message": "Invalid domain name"}), 400
    save_site_request(user_id, site_request)
    return jsonify({"status": "success", "message": "Site request saved successfully"}), 200

@site_request_management_bp.route('/siterequests', methods=['GET'])
@require_permissions(["admin", "wixpro"], require_all=False)
def list_site_requests():
    users_settings = load_json_file('users_settings.json')
    siterequests = []
    for filename in os.listdir(SITE_REQUEST_DIR):
        user_id = filename.replace('.json', '')
        site_request = load_site_request(user_id)
        if not site_request:
            continue
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
    siterequests.sort(key=lambda x: x['received_at'] or '', reverse=True)
    return jsonify({"status": "success", "siterequests": siterequests}), 200