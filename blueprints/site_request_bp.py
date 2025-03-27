from flask import Blueprint, request, jsonify
from utils.auth import login_required
from utils.data import load_site_request, save_site_request
from utils.users import load_users_settings
import logging
import os
import datetime
import json
import re

# region Blueprint Setup
# Welcome to site_request_bp, the blueprint that handles site requests like Zaphod Beeblebrox handles improbability—fast and with flair!
# This module is the galactic hub for listing and saving site requests. Prepare for some cosmic organization!
site_request_bp = Blueprint('site_request_bp', __name__)
# endregion

# region /siterequests GET - Listing Galactic Site Requests
@site_request_bp.route('/siterequests', methods=['GET'])
@login_required(["admin", "wixpro"], require_all=False)
def list_site_requests():
    """
    Lists all site requests, like the Spanish Inquisition—nobody expects it, but it’s here for admins and wixpro users!
    Purpose: To provide a list of site requests for admins or wixpro users, helping them manage the galaxy’s site needs.
    Permissions: Restricted to "admin" or "wixpro"—you’re either the chosen one or a very naughty boy!
    Inputs: None—just be logged in with the right permissions, or it’s “Nobody expects the Spanish Inquisition!”
    Outputs:
        - Success: JSON {"status": "success", "siterequests": [<siterequest_data>]}, status 200—your map to the site requests!
        - Errors:
            - 500: {"status": "error", "message": "Server error: <reason>"}—the Parrot’s ceased to be!
    """
    try:
        # Check permissions—like the Knights Who Say Ni demanding a shrubbery!
        if "admin" not in request.permissions and "wixpro" not in request.permissions:
            logging.warning(f"Security Issue - Unauthorized site request list attempt by {request.user_id}")
            return jsonify({"status": "error", "message": "Unauthorized"}), 403
        
        # Load the site request directory—like Arthur Dent flipping through the Guide.
        siterequest_dir = 'siterequest'
        if not os.path.exists(siterequest_dir):
            logging.warning("UX Issue - No site requests directory found")
            return jsonify({"status": "success", "siterequests": []}), 200

        # Load user settings—like the Guide, but with less towel advice.
        users_settings = load_users_settings()
        siterequests = []

        # Process each site request file—like the Holy Grail, but with JSON.
        for filename in os.listdir(siterequest_dir):
            if filename.endswith('.json'):
                user_id = filename.replace('.json', '')
                site_request = load_site_request(user_id)
                if site_request:
                    contact_name = users_settings.get(user_id, {}).get('contact_name', '')
                    email = users_settings.get(user_id, {}).get('email_address', '')
                    request_type = site_request.get('type', '')
                    store_name = site_request.get('communityName')  # Adjusted to match POST logic
                    community_name = site_request.get('communityName')
                    organisation = store_name if store_name else community_name if community_name else ''
                    received_at = site_request.get('submitted_at', '')

                    # Assemble the site request data—fit for the Life of Brian’s marketplace.
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
        # Marvin’s take: “I tried to list site requests, and now I’m even more depressed.”
        logging.error(f"UX Issue - Failed to list site requests: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
# endregion

# ASCII Art 1: The Dead Parrot
"""
       ______
      /|_||_\`.__
     (   _    _ _\
     =|  _    _  |  "This site request is no more! It has ceased to be!"
      | (_)  (_) |
       \._|\'|\'_./
          |__|__| 
"""

# region /siterequests POST - Saving New Galactic Site Requests
@site_request_bp.route('/siterequests', methods=['POST'])
@login_required(["self"], require_all=True)
def save_site_request_endpoint():
    """
    Saves a new site request, faster than Zaphod’s spaceship escaping a Vogon poetry reading.
    Purpose: Allows users to submit new site requests, restricted to themselves—like the People’s Front of Judea’s secret meetings.
    Permissions: Restricted to "self"—only you can submit your own request, or it’s “Nobody expects the Spanish Inquisition!”
    Inputs: JSON payload with:
        - userId (str, optional): Must match the authenticated user.
        - type (str, optional): Request type, defaults to "community".
        - communityName (str): Name of the community or store.
        - aboutCommunity (str): Description of the community or store.
        - communityLogos (list): Logos for the community or store.
        - colorPrefs (str): Color preferences.
        - stylingDetails (str): Styling details.
        - preferredDomain (str): Preferred domain, e.g., "mycommunity.org".
        - emails (list): List of emails.
        - pages (list): List of pages.
        - widgets (list): List of widgets.
    Outputs:
        - Success: JSON {"status": "success", "message": "Site request saved successfully"}, status 200—request logged!
        - Errors:
            - 400: {"status": "error", "message": "No data provided"}—no data, no fork handles!
            - 400: {"status": "error", "message": "User ID in body does not match authenticated user"}—mismatch!
            - 403: {"status": "error", "message": "Unauthorized: Must be admin or match user_id"}—unauthorized!
            - 400: {"status": "error", "message": "Community name or store name is required"}—missing name!
            - 400: {"status": "error", "message": "Invalid domain name"}—bad domain!
            - 500: {"status": "error", "message": "Server error: <reason>"}—the Parrot’s pining again!
    """
    try:
        # Arthur Dent checks the JSON—where’s that data?
        data = request.get_json()
        if not data:
            logging.warning("UX Issue - Site request save attempt with no data")
            return jsonify({"status": "error", "message": "No data provided"}), 400

        # Check user_id—like the Knights Who Say Ni demanding a shrubbery!
        user_id = request.user_id
        body_user_id = data.get("userId")
        if body_user_id and body_user_id != user_id:
            logging.warning(f"Security Issue - User ID mismatch: URL={user_id}, Body={body_user_id}")
            return jsonify({"status": "error", "message": "User ID in body does not match authenticated user"}), 400

        # Permission check—only self or admin can submit, or it’s “Nobody expects the Spanish Inquisition!”
        if "admin" not in request.permissions and request.user_id != user_id:
            logging.warning(f"Security Issue - Unauthorized site request save by {request.user_id} for {user_id}")
            return jsonify({"status": "error", "message": "Unauthorized: Must be admin or match user_id"}), 403

        # Assemble the site request—like the Holy Grail, but with JSON.
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

        # Check for community/store name—or it’s like asking for four candles and getting fork handles!
        if not site_request["communityName"]:
            logging.warning(f"UX Issue - Site request missing community/store name for user {user_id}")
            return jsonify({"status": "error", "message": "Community name or store name is required"}), 400

        # Validate domain—like checking if a parrot is still alive.
        domain_regex = r'^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$'
        if not re.match(domain_regex, site_request["preferredDomain"]):
            logging.warning(f"UX Issue - Invalid domain name for user {user_id}: {site_request['preferredDomain']}")
            return jsonify({"status": "error", "message": "Invalid domain name"}), 400

        # Process page images—like the Holy Hand Grenade, but less explosive.
        for page in site_request["pages"]:
            if "images" in page and page["images"]:
                page["images"] = [img if isinstance(img, str) else "placeholder" for img in page["images"]]

        # Save the site request—stronger than a Wookiee’s grip!
        save_site_request(user_id, site_request)
        logging.info(f"Site request saved successfully for user {user_id}: {json.dumps(site_request)}")
        return jsonify({"status": "success", "message": "Site request saved successfully"}), 200
    except Exception as e:
        # Marvin’s take: “I tried to save the site request, and now I’m even more depressed.”
        logging.error(f"UX Issue - Failed to save site request: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
# endregion

# ASCII Art 2: The Towel (Hitchhiker’s Guide)
"""
       ______
      /|_||_\`.__
     (   _    _ _\
     =|  _    _  |  "Don’t forget your towel—essential for site requests!"
      | (_)  (_) |
       \._|\'|\'_./
          |__|__| 
"""