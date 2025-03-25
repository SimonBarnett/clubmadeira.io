# blueprints/role_pages.py
from flask import Blueprint, render_template, jsonify, request
from utils.auth import login_required
import json
import os

role_pages_bp = Blueprint('role_pages', __name__)

# Load branding data from branding.json
def load_branding_data():
    try:
        with open(os.path.join(os.path.dirname(__file__), '..', 'branding.json'), 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # Fallback branding data if the file doesn't exist
        print('load_branding_data - branding.json not found, using fallback data')
        return {
            "admin": "<h1>Admin Dashboard</h1>",
            "merchant": "<h1>Merchant Dashboard</h1>",
            "community": "<h1>Community Dashboard</h1>",
            "wixpro": "<h1>Partner Dashboard</h1>",
            "login": "<h1>Login</h1>",
            "signup": "<h1>Sign Up</h1>"
        }

@role_pages_bp.route('/admin', methods=['GET'])
@login_required(["admin"], require_all=True)
def admin():
    return render_template('admin.html')

@role_pages_bp.route('/community', methods=['GET'])
@login_required(["community", "admin"], require_all=False)
def community():
    return render_template('community.html')

@role_pages_bp.route('/merchant', methods=['GET'])
@login_required(["merchant", "admin"], require_all=False)
def merchant():
    return render_template('merchant.html')

@role_pages_bp.route('/partner', methods=['GET'])
@login_required(["wixpro", "admin"], require_all=False)
def wixpro():
    return render_template('partner.html')

@role_pages_bp.route('/branding', methods=['GET'])
@login_required(["allauth"], require_all=False)
def get_branding():
    print('GET /branding - Request received')
    
    # Get the branding type from the query parameter
    branding_type = request.args.get('type')
    if not branding_type:
        print('GET /branding - No type parameter provided')
        return jsonify({"status": "error", "message": "Branding type not specified"}), 400
    
    print('GET /branding - Requested branding type:', branding_type)

    # Load branding data
    branding_data = load_branding_data()
    
    # Get the branding content for the specified type
    branding = branding_data.get(branding_type, '<h1>Dashboard</h1>')
    
    print('GET /branding - Sending branding content for type:', branding_type, 'Content:', branding)
    return jsonify({
        "status": "success",
        "branding": branding
    }), 200