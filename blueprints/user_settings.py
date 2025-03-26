from flask import Blueprint, request, jsonify, make_response, current_app
from utils.auth import login_required
import os
import requests
import markdown
import whois
import logging
import json

utility_bp = Blueprint('utility', __name__)

def render_md(full_path):
    """
    Render Markdown files from the static folder or GitHub based on the URL path.
    Returns an HTML response using templates from static/error/<status_code>.md.
    """
    try:
        # Parse the full_path, removing trailing slashes
        segments = full_path.rstrip('/').split('/')
        if not segments or segments == ['']:
            logging.warning("UX Issue - Invalid path provided for markdown rendering")
            raise ValueError("Invalid path provided")

        # Determine source: static folder or GitHub
        if segments[0] == 'static':
            if len(segments) < 2:
                logging.warning("UX Issue - No file path provided after 'static'")
                raise ValueError("No file path provided after 'static'")
            file_path = '/'.join(segments[1:])
            if not file_path.endswith('.md'):
                logging.warning(f"UX Issue - Unsupported file type for {file_path}")
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
                logging.warning(f"UX Issue - Unsupported GitHub file type: {path}")
                raise ValueError("Only .md files are supported")
            url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
            response = requests.get(url)
            if response.status_code != 200:
                logging.warning(f"UX Issue - GitHub file not found: {url}, Status: {response.status_code}")
                raise FileNotFoundError(f"File not found on GitHub: {response.status_code}")
            md_content = response.text

        # Convert Markdown to HTML with table support
        html_content = markdown.markdown(md_content, extensions=['tables'])
        status_code = 200
    except (ValueError, FileNotFoundError) as e:
        status_code = 404
        error_message = str(e)
    except requests.RequestException as e:
        status_code = 500
        logging.error(f"UX Issue - Failed to fetch GitHub markdown: {str(e)}", exc_info=True)
        error_message = "Failed to fetch from GitHub"
    except Exception as e:
        status_code = 500
        logging.error(f"UX Issue - Unexpected error rendering markdown: {str(e)}", exc_info=True)
        error_message = "An unexpected error occurred"

    # Load the corresponding template
    template_path = os.path.join(current_app.static_folder, 'error', f'{status_code}.md')
    if not os.path.exists(template_path):
        logging.error(f"UX Issue - Template not found for status {status_code}: {template_path}")
        return jsonify({"status": "error", "message": f"Template for status {status_code} not found"}), 500
    with open(template_path, 'r', encoding='utf-8') as f:
        template = f.read()

    # Replace the appropriate placeholder
    if status_code == 200:
        final_html = template.replace('{content}', html_content)
        logging.debug(f"Rendered markdown for path {full_path}")
    else:
        final_html = template.replace('{error_message}', error_message)

    response = make_response(final_html, status_code)
    response.headers['Content-Type'] = 'text/html'
    return response

@utility_bp.route('/check-domain', methods=['GET'])
@login_required(["allauth"], require_all=False)
def check_domain():
    """
    Check the availability of a domain name using WHOIS.
    """
    try:
        domain = request.args.get('domain')
        if not domain:
            logging.warning("UX Issue - No domain provided for check")
            return jsonify({"error": "Please provide a domain name"}), 400
        
        # Basic validation (matches client-side regex: /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/)
        if not all(c.isalnum() or c in '-.' for c in domain) or '.' not in domain or len(domain.split('.')[-1]) < 2:
            logging.warning(f"UX Issue - Invalid domain name: {domain}")
            return jsonify({"error": "Invalid domain name (e.g., mystore.uk)"}), 400
        
        # Query WHOIS data
        w = whois.whois(domain)
        is_available = w.creation_date is None
        response_data = {"domain": domain, "available": is_available}
        logging.debug(f"Checked domain {domain}: {json.dumps(response_data)}")
        return jsonify(response_data), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to check domain availability: {str(e)}", exc_info=True)
        return jsonify({"error": f"Failed to check domain availability: {str(e)}"}), 500