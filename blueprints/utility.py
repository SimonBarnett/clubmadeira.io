from flask import Blueprint, jsonify, request, make_response
import markdown
import os
import requests
import re
import whois
from utils.auth import login_required  # Changed from require_permissions

utility_bp = Blueprint('utility', __name__)

@utility_bp.route('/render-md/<path:full_path>', methods=['GET'])
@login_required(["allauth"], require_all=False)  # Changed from require_permissions
def render_md(full_path):
    """
    Render Markdown files from the static folder or GitHub based on the URL path.
    Returns an HTML response using templates from static/error/<status_code>.md.
    """
    from flask import current_app as app
    try:
        # Parse the full_path, removing trailing slashes
        segments = full_path.rstrip('/').split('/')
        if not segments or segments == ['']:
            raise ValueError("Invalid path provided")

        # Determine source: static folder or GitHub
        if segments[0] == 'static':
            # Handle static file
            if len(segments) < 2:
                raise ValueError("No file path provided after 'static'")
            file_path = '/'.join(segments[1:])
            if not file_path.endswith('.md'):
                raise ValueError("Only .md files are supported")
            static_file = os.path.join(app.static_folder, file_path)
            if not os.path.isfile(static_file):
                raise FileNotFoundError("File not found in static folder")
            with open(static_file, 'r', encoding='utf-8') as f:
                md_content = f.read()
        else:
            # Handle GitHub file
            if len(segments) < 4:
                raise ValueError("Invalid GitHub path: Must provide owner/repo/branch/path")
            owner, repo, branch = segments[:3]
            path_segments = segments[3:]
            path = '/'.join(path_segments)
            if not path.endswith('.md'):
                raise ValueError("Only .md files are supported")
            url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
            response = requests.get(url)
            if response.status_code != 200:
                raise FileNotFoundError(f"File not found on GitHub: {response.status_code}")
            md_content = response.text

        # Convert Markdown to HTML with table support
        html_content = markdown.markdown(md_content, extensions=['tables'])
        status_code = 200
    except ValueError as e:
        status_code = 404
        error_message = str(e)
    except FileNotFoundError as e:
        status_code = 404
        error_message = str(e)
    except requests.RequestException as e:
        status_code = 500
        error_message = "Failed to fetch from GitHub"
    except Exception as e:
        status_code = 500
        error_message = "An unexpected error occurred"

    # Load the corresponding template
    template_path = os.path.join(app.static_folder, 'error', f'{status_code}.md')
    if not os.path.exists(template_path):
        return jsonify({"status": "error", "message": f"Template for status {status_code} not found"}), 500
    with open(template_path, 'r', encoding='utf-8') as f:
        template = f.read()

    # Replace the appropriate placeholder
    if status_code == 200:
        final_html = template.replace('{content}', html_content)
    else:
        final_html = template.replace('{error_message}', error_message)

    # Create and return the response
    response = make_response(final_html, status_code)
    response.headers['Content-Type'] = 'text/html'
    return response

@utility_bp.route('/check-domain', methods=['GET'])
@login_required(["allauth"], require_all=False)  # Changed from require_permissions
def check_domain():
    """
    Check the availability of a domain name using WHOIS.
    """
    domain = request.args.get('domain')
    
    # Basic validation (matches client-side regex: /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/)
    if not domain:
        return jsonify({"error": "Please provide a domain name"}), 400
    
    if not all(c.isalnum() or c in '-.' for c in domain) or \
       '.' not in domain or \
       len(domain.split('.')[-1]) < 2:
        return jsonify({"error": "Invalid domain name (e.g., mystore.uk)"}), 400
    
    # Query WHOIS data
    try:
        w = whois.whois(domain)
        # If no registration data exists (e.g., creation_date is None), domain is available
        is_available = w.creation_date is None
        return jsonify({
            "domain": domain,
            "available": is_available
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to check domain availability: {str(e)}"}), 500