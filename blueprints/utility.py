from flask import Blueprint, render_template, jsonify, request, make_response, current_app
import os
import json
import markdown
import requests
import whois
from utils.auth import require_permissions

# Define the utility blueprint
utility_bp = Blueprint('utility', __name__)

@utility_bp.route('/', methods=['GET'])
def home():
    """
    Render the home page, typically a login page.
    Returns:
        Rendered HTML template for the login page.
    """
    return render_template('login.html')

@utility_bp.route('/branding', methods=['GET'])
def branding():
    """
    Serve branding information from a JSON file.
    Returns:
        JSON response with branding data or an error message.
    """
    try:
        root_dir = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.join(root_dir, 'branding.json')
        with open(json_path, 'r') as f:
            branding_data = json.load(f)
        return jsonify(branding_data)
    except FileNotFoundError:
        return jsonify({'content': '<h1>Branding content not found</h1>'}), 500
    except Exception as e:
        return jsonify({'content': f'Internal Server Error: {str(e)}'}), 500

@utility_bp.route('/render-md/<path:full_path>', methods=['GET'])
@require_permissions(["allauth"], require_all=False)
def render_md(full_path):
    """
    Render Markdown files from the static folder or GitHub based on the URL path.
    Args:
        full_path (str): The path to the Markdown file, either starting with 'static' or a GitHub path.
    Returns:
        HTML response with the rendered Markdown content or an error page.
    """
    try:
        segments = full_path.rstrip('/').split('/')
        if not segments or segments == ['']:
            raise ValueError("Invalid path provided")
        
        if segments[0] == 'static':
            if len(segments) < 2:
                raise ValueError("No file path provided after 'static'")
            file_path = '/'.join(segments[1:])
            if not file_path.endswith('.md'):
                raise ValueError("Only .md files are supported")
            static_file = os.path.join(current_app.static_folder, file_path)
            if not os.path.isfile(static_file):
                raise FileNotFoundError("File not found in static folder")
            with open(static_file, 'r', encoding='utf-8') as f:
                md_content = f.read()
        else:
            if len(segments) < 4:
                raise ValueError("Invalid GitHub path: Must provide owner/repo/branch/path")
            owner, repo, branch, *path_segments = segments
            path = '/'.join(path_segments)
            if not path.endswith('.md'):
                raise ValueError("Only .md files are supported")
            url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
            response = requests.get(url)
            if response.status_code != 200:
                raise FileNotFoundError("File not found on GitHub")
            md_content = response.text
        
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
        current_app.logger.error(f"Error: {e}", exc_info=True)
    
    # Load error template based on status code
    template_path = os.path.join(current_app.static_folder, 'error', f'{status_code}.md')
    with open(template_path, 'r', encoding='utf-8') as f:
        template = f.read()
    
    # Replace placeholders in the template
    if status_code == 200:
        final_html = template.replace('{content}', html_content)
    else:
        final_html = template.replace('{error_message}', error_message)
    
    response = make_response(final_html, status_code)
    response.headers['Content-Type'] = 'text/html'
    return response

@utility_bp.route('/check-domain', methods=['GET'])
@require_permissions(["allauth"], require_all=False)
def check_domain():
    """
    Check the availability of a domain name using WHOIS.
    Query Parameters:
        domain (str): The domain name to check (e.g., 'example.com').
    Returns:
        JSON response with domain availability or an error message.
    """
    domain = request.args.get('domain')
    if not domain:
        return jsonify({"error": "Please provide a domain name"}), 400
    if not all(c.isalnum() or c in '-.' for c in domain) or '.' not in domain or len(domain.split('.')[-1]) < 2:
        return jsonify({"error": "Invalid domain name (e.g., mystore.uk)"}), 400
    
    try:
        w = whois.whois(domain)
        is_available = w.creation_date is None
        return jsonify({"domain": domain, "available": is_available}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to check domain availability: {str(e)}"}), 500