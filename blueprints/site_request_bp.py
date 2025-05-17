from flask import Blueprint, request, jsonify, current_app
from utils.auth import login_required  # Assumes this validates the token and sets request.user_id
from utils.data import load_site_request, save_site_request
from utils.users import load_users_settings  # Use load_users_settings for listing all settings
import logging
import os
import datetime
import json
import re
import jwt  # For decoding the JWT token

# Blueprint Setup
site_request_bp = Blueprint('site_request_bp', __name__)

# /siterequests GET - List All Site Requests (Admin/Partner)
@site_request_bp.route('/siterequests', methods=['GET'])
@login_required(["admin", "partner"], require_all=False)
def list_site_requests():
    """
    Lists all site requests for admin or partner users.
    Permissions: Requires 'admin' or 'partner' role.
    Returns:
        - 200: {"status": "success", "siterequests": [<siterequest_data>]}
        - 403: {"status": "error", "message": "Unauthorized"}
        - 500: {"status": "error", "message": "Server error: <reason>"}
    """
    try:
        siterequest_dir = 'c:\\inetpub\\clubmadeira.io\\siterequest'
        if not os.path.exists(siterequest_dir):
            logging.warning("No site requests directory found")
            return jsonify({"status": "success", "siterequests": []}), 200

        # Fetch all users' settings using load_users_settings
        users_settings = load_users_settings()
        siterequests = []

        # Iterate through the siterequest directory to gather all site requests
        for filename in os.listdir(siterequest_dir):            
            user_id = filename
            site_request = load_site_request(user_id)
            if site_request:                
                first_name = users_settings.get(user_id, {}).get('first_name', '')
                last_name = users_settings.get(user_id, {}).get('last_name', '')
                email = users_settings.get(user_id, {}).get('email_address', '')
                organisation = site_request.get('communityName', '')
                siterequests.append({
                    'user_id': user_id,
                    'type': site_request.get('type', ''),
                    'received_at': site_request.get('submitted_at', ''),
                    'contact_name': first_name + " " + last_name,
                    'email': email,
                    'organisation': organisation
                })

        if not siterequests:
            logging.warning("No site requests found in directory")
        logging.debug(f"Listed site requests: {json.dumps(siterequests)}")
        return jsonify({"status": "success", "siterequests": siterequests}), 200
    except Exception as e:
        logging.error(f"Failed to list site requests: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

# /siterequests/<user_id> GET - Get Specific Site Request (Admin/Partner)
@site_request_bp.route('/siterequests/<user_id>', methods=['GET'])
@login_required(["admin", "partner"], require_all=False)
def get_site_request(user_id):
    """
    Retrieves a specific site request by user_id for admin or partner users.
    Permissions: Requires 'admin' or 'partner' role.
    Returns:
        - 200: {"status": "success", "siterequest": <siterequest_data>}
        - 403: {"status": "error", "message": "Unauthorized"}
        - 404: {"status": "error", "message": "Site request not found"}
        - 500: {"status": "error", "message": "Server error: <reason>"}
    """
    try:
        site_request = load_site_request(user_id)
        if not site_request:
            logging.warning(f"Site request not found for user {user_id}")
            return jsonify({"status": "error", "message": "Site request not found"}), 404

        logging.debug(f"Retrieved site request for user {user_id}: {json.dumps(site_request)}")
        return jsonify({"status": "success", "siterequest": site_request}), 200
    except Exception as e:
        logging.error(f"Failed to retrieve site request for user {user_id}: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

# /siterequest GET, POST, PATCH - Self Site Request Operations
@site_request_bp.route('/siterequest', methods=['GET', 'POST', 'PATCH'])
@login_required(["self"], require_all=True)
def manage_self_site_request():
    """
    Handles GET, POST, and PATCH for the authenticated user's site request.
    Permissions: Requires 'self' role (authenticated user).
    GET:
        Returns the user's site request or a blank site request with mandatory pages if none exists.
        - 200: {"status": "success", "siterequest": <siterequest_data>}
        - 500: {"status": "error", "message": "Server error: <reason>"}
    POST:
        Creates a new site request, ensuring mandatory pages are included.
        Inputs (JSON):
            - type (str, optional): Defaults to "community".
            - communityName (str, required): Community or store name.
            - aboutCommunity (str): Description.
            - communityLogos (list): Logos.
            - colorPrefs (str): Color preferences.
            - stylingDetails (str): Styling details.
            - preferredDomain (str): e.g., "mycommunity.org".
            - emails (list): Emails.
            - pages (list): Pages.
            - widgets (list): Widgets.
        Returns:
            - 200: {"status": "success", "message": "Site request saved successfully"}
            - 400: {"status": "error", "message": "<validation error>"}
            - 500: {"status": "error", "message": "Server error: <reason>"}
    PATCH:
        Updates specific fields of the site request, ensuring mandatory pages are not removed.
        Inputs (JSON): Any subset of POST fields (e.g., {"communityName": "New Name"}).
        Returns:
            - 200: {"status": "success", "message": "Site request updated successfully"}
            - 400: {"status": "error", "message": "<validation error>"}
            - 404: {"status": "error", "message": "Site request not found"}
            - 500: {"status": "error", "message": "Server error: <reason>"}
    """
    try:
        user_id = request.user_id

        # Extract and validate JWT token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            logging.warning("No valid Authorization header provided")
            return jsonify({"status": "error", "message": "Missing or invalid token"}), 401

        token = auth_header.split(' ')[1]
        decoded_token = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        x_role = decoded_token.get('x-role', 'community')  # Default to 'community' if missing

        # Define mandatory pages based on user role
        mandatory_pages = (
            [
                {"title": "Home", "content": "", "mandatory": True},
                {"title": "Returns Policy", "content": "", "mandatory": True}
            ] if x_role == 'merchant' else
            [
                {"title": "Home", "content": "", "mandatory": True}
            ]
        )

        if request.method == 'GET':
            site_request = load_site_request(user_id)
            if not site_request:
                logging.info(f"No site request found for user {user_id}, returning blank site request with mandatory pages for role: {x_role}")
                site_request = {
                    "user_id": user_id,
                    "type": x_role,
                    "communityName": "",
                    "aboutCommunity": "",
                    "communityLogos": [],
                    "colorPrefs": "",
                    "stylingDetails": "",
                    "preferredDomain": "",
                    "emails": [""],  # Default to a single empty email
                    "pages": mandatory_pages,
                    "widgets": [],
                    "submitted_at": ""
                }
            else:
                # Ensure emails field is populated
                if not site_request.get("emails"):
                    site_request["emails"] = [""]
                # Ensure mandatory pages are included
                existing_pages = {page['title']: page for page in site_request.get("pages", [])}
                for mandatory_page in mandatory_pages:
                    if mandatory_page['title'] not in existing_pages:
                        site_request["pages"].append(mandatory_page)
            logging.debug(f"Retrieved site request for user {user_id}: {json.dumps(site_request)}")
            return jsonify({"status": "success", "siterequest": site_request}), 200

        # Handle POST and PATCH requests
        data = request.get_json()
        if not data:
            logging.warning("Site request operation attempted with no data")
            return jsonify({"status": "error", "message": "No data provided"}), 400

        if request.method == 'POST':
            community_name = data.get("communityName") or data.get("storeName")
            if not community_name:
                logging.warning(f"Missing community/store name for user {user_id}")
                return jsonify({"status": "error", "message": "Community name or store name is required"}), 400

            preferred_domain = data.get("preferredDomain", "mycommunity.org")
            domain_regex = r'^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$'
            if not re.match(domain_regex, preferred_domain):
                logging.warning(f"Invalid domain name for user {user_id}: {preferred_domain}")
                return jsonify({"status": "error", "message": "Invalid domain name"}), 400

            site_request = {
                "user_id": user_id,
                "type": data.get("type", x_role),  # Use role from token if not provided
                "communityName": community_name,
                "aboutCommunity": data.get("aboutCommunity") or data.get("aboutStore") or "",
                "communityLogos": data.get("communityLogos") or data.get("storeLogos") or [],
                "colorPrefs": data.get("colorPrefs", ""),
                "stylingDetails": data.get("stylingDetails", ""),
                "preferredDomain": preferred_domain,
                "emails": data.get("emails", []),
                "pages": data.get("pages", []),
                "widgets": data.get("widgets", []),
                "submitted_at": datetime.datetime.utcnow().isoformat()
            }

            # Ensure mandatory pages are included
            existing_pages = {page['title']: page for page in site_request["pages"]}
            for mandatory_page in mandatory_pages:
                if mandatory_page['title'] not in existing_pages:
                    site_request["pages"].append(mandatory_page)

            # Process images in pages
            for page in site_request["pages"]:
                if "images" in page and page["images"]:
                    page["images"] = [img if isinstance(img, str) else "placeholder" for img in page["images"]]

            save_site_request(user_id, site_request)
            logging.info(f"Site request saved for user {user_id}: {json.dumps(site_request)}")
            return jsonify({"status": "success", "message": "Site request saved successfully"}), 200

        if request.method == 'PATCH':
            site_request = load_site_request(user_id)
            if not site_request:
                logging.warning(f"Site request not found for user {user_id}")
                return jsonify({"status": "error", "message": "Site request not found"}), 404

            updatable_fields = [
                "type", "communityName", "aboutCommunity", "communityLogos",
                "colorPrefs", "stylingDetails", "preferredDomain", "emails",
                "pages", "widgets"
            ]
            for field in updatable_fields:
                if field in data:
                    site_request[field] = data[field]

            if "communityName" in data and not data["communityName"]:
                logging.warning(f"Empty community name provided for user {user_id}")
                return jsonify({"status": "error", "message": "Community name cannot be empty"}), 400

            if "preferredDomain" in data:
                domain_regex = r'^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$'
                if not re.match(domain_regex, data["preferredDomain"]):
                    logging.warning(f"Invalid domain name for user {user_id}: {data['preferredDomain']}")
                    return jsonify({"status": "error", "message": "Invalid domain name"}), 400

            if "pages" in data:
                # Ensure mandatory pages are not removed
                existing_pages = {page['title']: page for page in site_request["pages"]}
                for mandatory_page in mandatory_pages:
                    if mandatory_page['title'] not in existing_pages:
                        site_request["pages"].append(mandatory_page)
                # Process images in pages
                for page in site_request["pages"]:
                    if "images" in page and page["images"]:
                        page["images"] = [img if isinstance(img, str) else "placeholder" for img in page["images"]]

            save_site_request(user_id, site_request)
            logging.info(f"Site request updated for user {user_id}: {json.dumps(site_request)}")
            return jsonify({"status": "success", "message": "Site request updated successfully"}), 200

    except jwt.InvalidTokenError as e:
        logging.error(f"JWT decoding failed for user {user_id}: {str(e)}")
        return jsonify({"status": "error", "message": "Invalid token"}), 401
    except Exception as e:
        logging.error(f"Failed to process site request for user {user_id}: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500