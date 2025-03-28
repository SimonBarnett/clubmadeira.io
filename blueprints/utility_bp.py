from flask import Blueprint, request, jsonify, current_app, make_response
from utils.auth import login_required, load_users_settings
from utils.helpers import get_system_stats, ping_service, log_activity
import logging
import requests
import os
import markdown
import whois
import json

utility_bp = Blueprint('utility_bp', __name__)

@utility_bp.route('/system/stats', methods=['GET'])
@login_required(["admin"], require_all=True)
def system_stats():
    try:
        # Log request like madeira.py
        request_data = {
            "method": request.method,
            "url": request.full_path,
            "headers": dict(request.headers),
            "ip": request.remote_addr,
            "body": "[NO BODY]"
        }
        log_data = request_data.copy()
        if "Authorization" in log_data["headers"]:
            log_data["headers"]["Authorization"] = "[REDACTED]"
        logging.debug(f"Request: {json.dumps(log_data)}")

        if "admin" not in request.permissions:
            logging.warning(f"Security Issue - Unauthorized system stats access attempt by {request.user_id}")
            return jsonify({"status": "error", "message": "Unauthorized"}), 403

        stats = get_system_stats()
        logging.info(f"System stats retrieved by admin {request.user_id}")
        response_data = {"status": "success", "stats": stats}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to retrieve system stats: {str(e)}", exc_info=True)
        response_data = {"status": "error", "message": "Server error"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 500

@utility_bp.route('/ping', methods=['GET'])
@login_required(["admin", "wixpro"], require_all=False)
def ping():
    try:
        request_data = {
            "method": request.method,
            "url": request.full_path,
            "headers": dict(request.headers),
            "ip": request.remote_addr,
            "body": "[NO BODY]"
        }
        log_data = request_data.copy()
        if "Authorization" in log_data["headers"]:
            log_data["headers"]["Authorization"] = "[REDACTED]"
        logging.debug(f"Request: {json.dumps(log_data)}")

        if "admin" not in request.permissions and "wixpro" not in request.permissions:
            logging.warning(f"Security Issue - Unauthorized ping attempt by {request.user_id}")
            return jsonify({"status": "error", "message": "Unauthorized"}), 403

        ping_result = ping_service()
        if ping_result:
            logging.info(f"Ping successful by {request.user_id}")
            response_data = {"status": "success", "message": "Pong!"}
        else:
            logging.error(f"UX Issue - Ping failed by {request.user_id}")
            response_data = {"status": "error", "message": "Service error"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 200 if ping_result else 500
    except Exception as e:
        logging.error(f"UX Issue - Failed to ping service: {str(e)}", exc_info=True)
        response_data = {"status": "error", "message": "Service error"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 500

@utility_bp.route('/activity/log', methods=['POST'])
@login_required(["admin"], require_all=True)
def log_user_activity():
    try:
        request_data = {
            "method": request.method,
            "url": request.full_path,
            "headers": dict(request.headers),
            "ip": request.remote_addr,
            "body": request.get_json(silent=True) or "[NO BODY]"
        }
        log_data = request_data.copy()
        if "Authorization" in log_data["headers"]:
            log_data["headers"]["Authorization"] = "[REDACTED]"
        logging.debug(f"Request: {json.dumps(log_data)}")

        if "admin" not in request.permissions:
            logging.warning(f"Security Issue - Unauthorized activity log attempt by {request.user_id}")
            return jsonify({"status": "error", "message": "Unauthorized"}), 403

        data = request.get_json()
        if not data or "user_id" not in data or "action" not in data:
            logging.warning(f"UX Issue - Invalid activity log data from {request.user_id}: {json.dumps(data)}")
            return jsonify({"status": "error", "message": "Invalid data"}), 400

        user_id = data["user_id"]
        action = data["action"]
        details = data.get("details", {})
        log_activity(user_id, action, details)
        logging.info(f"Activity logged by admin {request.user_id} for user {user_id}: {action}")
        response_data = {"status": "success", "message": "Activity logged"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 201
    except Exception as e:
        logging.error(f"UX Issue - Failed to log activity: {str(e)}", exc_info=True)
        response_data = {"status": "error", "message": "Server error"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 500

@utility_bp.route('/send-sms', methods=['POST'])
def send_sms():
    """
    Sends an SMS to a user's phone number looked up by email, publicly accessible for OTP requests.
    Purpose: Centralized SMS sending for public OTP workflows, using email to identify the recipient.
    Inputs: JSON payload:
        - email (str): User's email to look up phone number.
        - message (str): Text message to send.
    Outputs:
        - Success: JSON {"status": "success", "message": "SMS sent"}, status 200
        - Errors:
            - 400: {"status": "error", "message": "email and message are required"}
            - 404: {"status": "error", "message": "User not found"}
            - 400: {"status": "error", "message": "No valid phone number associated with this email"}
            - 500: {"status": "error", "message": "Failed to send SMS: <reason>"}
    """
    try:
        # Log request like madeira.py
        request_data = {
            "method": request.method,
            "url": request.full_path,
            "headers": dict(request.headers),
            "ip": request.remote_addr,
            "body": request.get_json(silent=True) or "[NO BODY]"
        }
        log_data = request_data.copy()
        if "Authorization" in log_data["headers"]:
            log_data["headers"]["Authorization"] = "[REDACTED]"
        logging.debug(f"Request: {json.dumps(log_data)}")

        data = request.get_json()
        if not data or "email" not in data or "message" not in data:
            logging.warning(f"UX Issue - SMS attempt missing email or message: {json.dumps(data)}")
            response_data = {"status": "error", "message": "email and message are required"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400

        email = data["email"].strip().lower()
        message = data["message"].strip()

        # Look up user by email
        users_settings = load_users_settings()
        user_entry = next(((uid, u) for uid, u in users_settings.items() if u.get("email_address", "").lower() == email), None)
        if not user_entry:
            logging.warning(f"UX Issue - SMS failed - Email not found: {email}")
            response_data = {"status": "error", "message": "User not found"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 404

        user_id, user = user_entry
        phone_number = user.get("phone_number", "").strip()
        if not phone_number:
            logging.warning(f"UX Issue - SMS failed for {email} - No valid phone number, User ID: {user_id}")
            response_data = {"status": "error", "message": "No valid phone number associated with this email"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400

        logging.debug(f"User found - ID: {user_id}, Phone: {phone_number}")

        # Load TextMagic config
        username = current_app.config.get("TEXTMAGIC_USERNAME")
        api_key = current_app.config.get("TEXTMAGIC_API_KEY")
        if not username or not api_key:
            logging.error("Security Issue - TextMagic credentials not configured")
            response_data = {"status": "error", "message": "Failed to send SMS: TextMagic credentials not configured"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 500

        # Send SMS
        url = "https://rest.textmagic.com/api/v2/messages"
        payload = {"text": message, "phones": phone_number}
        headers = {
            "X-TM-Username": username,
            "X-TM-Key": api_key,
            "Content-Type": "application/x-www-form-urlencoded"
        }
        response = requests.post(url, data=payload, headers=headers)

        if response.status_code != 201:
            logging.error(f"UX Issue - Failed to send SMS for {email}, User ID: {user_id}, Response: {response.text}")
            response_data = {"status": "error", "message": f"Failed to send SMS: {response.text}"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 500

        logging.info(f"SMS sent successfully for email {email}, User ID: {user_id} to {phone_number}")
        response_data = {"status": "success", "message": "SMS sent"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 200
    except Exception as e:
        logging.error(f"UX Issue - SMS sending error for email {email if 'email' in locals() else 'unknown'}: {str(e)}", exc_info=True)
        response_data = {"status": "error", "message": f"Failed to send SMS: {str(e)}"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 500

@utility_bp.route('/render-md/<path:full_path>', methods=['GET'])
@login_required(["allauth"], require_all=False)
def render_md(full_path):
    try:
        request_data = {
            "method": request.method,
            "url": request.full_path,
            "headers": dict(request.headers),
            "ip": request.remote_addr,
            "body": "[NO BODY]"
        }
        log_data = request_data.copy()
        if "Authorization" in log_data["headers"]:
            log_data["headers"]["Authorization"] = "[REDACTED]"
        logging.debug(f"Request: {json.dumps(log_data)}")

        segments = full_path.rstrip('/').split('/')
        if not segments or segments == ['']:
            logging.warning(f"UX Issue - Invalid path provided: {full_path}")
            raise ValueError("Invalid path provided")
        if segments[0] == 'static':
            if len(segments) < 2:
                logging.warning(f"UX Issue - No file path provided after 'static': {full_path}")
                raise ValueError("No file path provided after 'static'")
            file_path = '/'.join(segments[1:])
            if not file_path.endswith('.md'):
                logging.warning(f"UX Issue - Only .md files supported: {file_path}")
                raise ValueError("Only .md files are supported")
            static_file = os.path.join(current_app.static_folder, file_path)
            if not os.path.isfile(static_file):
                logging.warning(f"UX Issue - File not found in static folder: {static_file}")
                raise FileNotFoundError("File not found in static folder")
            with open(static_file, 'r', encoding='utf-8') as f:
                md_content = f.read()
        else:
            if len(segments) < 4:
                logging.warning(f"UX Issue - Invalid GitHub path: {full_path}")
                raise ValueError("Invalid GitHub path: Must provide owner/repo/branch/path")
            owner, repo, branch = segments[:3]
            path_segments = segments[3:]
            path = '/'.join(path_segments)
            if not path.endswith('.md'):
                logging.warning(f"UX Issue - Only .md files supported: {path}")
                raise ValueError("Only .md files are supported")
            url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
            response = requests.get(url)
            if response.status_code != 200:
                logging.warning(f"UX Issue - File not found on GitHub: {response.status_code}")
                raise FileNotFoundError(f"File not found on GitHub: {response.status_code}")
            md_content = response.text

        html_content = markdown.markdown(md_content, extensions=['tables'])
        status_code = 200
        logging.info(f"Markdown rendered successfully for path {full_path}")
    except ValueError as e:
        status_code = 404
        error_message = str(e)
    except FileNotFoundError as e:
        status_code = 404
        error_message = str(e)
    except requests.RequestException as e:
        status_code = 500
        error_message = "Failed to fetch from GitHub"
        logging.error(f"UX Issue - Failed to fetch Markdown from GitHub: {str(e)}", exc_info=True)
    except Exception as e:
        status_code = 500
        error_message = "An unexpected error occurred"
        logging.error(f"UX Issue - Unexpected error rendering Markdown: {str(e)}", exc_info=True)

    template_path = os.path.join(current_app.static_folder, 'error', f'{status_code}.md')
    if not os.path.exists(template_path):
        logging.error(f"UX Issue - Template for status {status_code} not found")
        response_data = {"status": "error", "message": f"Template for status {status_code} not found"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 500

    with open(template_path, 'r', encoding='utf-8') as f:
        template = f.read()

    final_html = template.replace('{content}' if status_code == 200 else '{error_message}', html_content if status_code == 200 else error_message)
    response = make_response(final_html, status_code)
    response.headers['Content-Type'] = 'text/html'
    logging.debug(f"Response: HTML content, Status: {status_code}")
    return response

@utility_bp.route('/check-domain', methods=['GET'])
@login_required(["allauth"], require_all=False)
def check_domain():
    try:
        request_data = {
            "method": request.method,
            "url": request.full_path,
            "headers": dict(request.headers),
            "ip": request.remote_addr,
            "body": "[NO BODY]"
        }
        log_data = request_data.copy()
        if "Authorization" in log_data["headers"]:
            log_data["headers"]["Authorization"] = "[REDACTED]"
        logging.debug(f"Request: {json.dumps(log_data)}")

        domain = request.args.get('domain')
        if not domain:
            logging.warning(f"UX Issue - Domain check missing domain parameter")
            response_data = {"error": "Please provide a domain name"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400

        if not all(c.isalnum() or c in '-.' for c in domain) or '.' not in domain or len(domain.split('.')[-1]) < 2:
            logging.warning(f"UX Issue - Invalid domain name: {domain}")
            response_data = {"error": "Invalid domain name (e.g., mystore.uk)"}
            logging.debug(f"Response: {json.dumps(response_data)}")
            return jsonify(response_data), 400

        w = whois.whois(domain)
        is_available = w.creation_date is None
        logging.info(f"Domain check successful for {domain}: {'available' if is_available else 'taken'}")
        response_data = {"domain": domain, "available": is_available}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to check domain availability: {str(e)}", exc_info=True)
        response_data = {"error": f"Failed to check domain availability: {str(e)}"}
        logging.debug(f"Response: {json.dumps(response_data)}")
        return jsonify(response_data), 500