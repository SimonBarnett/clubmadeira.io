from flask import Blueprint, render_template, jsonify, request
from utils.auth import login_required
from utils.users import load_users_settings
import os
import json
import logging

role_pages_bp = Blueprint('role_pages', __name__)

def load_branding_data():
    try:
        with open(os.path.join(os.path.dirname(__file__), '..', 'branding.json'), 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        logging.warning("UX Issue - branding.json not found, using fallback data")
        return {
            "admin": "<h1>Admin Dashboard</h1>",
            "merchant": "<h1>Merchant Dashboard</h1>",
            "community": "<h1>Community Dashboard</h1>",
            "wixpro": "<h1>Partner Dashboard</h1>",
            "login": "<h1>Login</h1>",
            "signup": "<h1>Sign Up</h1>"
        }
    except Exception as e:
        logging.error(f"UX Issue - Failed to load branding data: {str(e)}", exc_info=True)
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
    try:
        user_id = request.user_id
        if not user_id:
            logging.error("Security Issue - Admin route accessed with no user_id in token")
            return jsonify({"status": "error", "message": "User ID not found in token"}), 401
        users_settings = load_users_settings()
        user = users_settings.get(user_id)
        if not user:
            logging.warning(f"UX Issue - Admin route - User not found: {user_id}")
            return jsonify({"status": "error", "message": "User not found"}), 404
        return render_template('admin.html', user=user)
    except Exception as e:
        logging.error(f"UX Issue - Failed to render admin page: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500

@role_pages_bp.route('/community', methods=['GET'])
@login_required(["community", "admin"], require_all=False)
def community():
    try:
        user_id = request.user_id
        users_settings = load_users_settings()
        user = users_settings.get(user_id) if user_id else None
        if not user and user_id:
            logging.warning(f"UX Issue - Community route - User not found: {user_id}")
        return render_template('community.html', user=user)
    except Exception as e:
        logging.error(f"UX Issue - Failed to render community page: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500

@role_pages_bp.route('/merchant', methods=['GET'])
@login_required(["merchant", "admin"], require_all=False)
def merchant():
    try:
        user_id = request.user_id
        users_settings = load_users_settings()
        user = users_settings.get(user_id) if user_id else None
        if not user and user_id:
            logging.warning(f"UX Issue - Merchant route - User not found: {user_id}")
        return render_template('merchant.html', user=user)
    except Exception as e:
        logging.error(f"UX Issue - Failed to render merchant page: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500

@role_pages_bp.route('/partner', methods=['GET'])
@login_required(["wixpro", "admin"], require_all=False)
def wixpro():
    try:
        user_id = request.user_id
        users_settings = load_users_settings()
        user = users_settings.get(user_id) if user_id else None
        if not user and user_id:
            logging.warning(f"UX Issue - Partner route - User not found: {user_id}")
        return render_template('partner.html', user=user)
    except Exception as e:
        logging.error(f"UX Issue - Failed to render partner page: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500

@role_pages_bp.route('/branding', methods=['GET'])
@login_required(["allauth"], require_all=False)
def get_branding():
    try:
        branding_type = request.args.get('type')
        if not branding_type:
            logging.warning("UX Issue - No branding type parameter provided")
            return jsonify({"status": "error", "message": "Branding type not specified"}), 400
        
        if branding_type == 'partner':
            branding_type = 'wixpro'

        branding_data = load_branding_data()
        branding = branding_data.get(branding_type, '<h1>Dashboard</h1>')
        if branding == '<h1>Dashboard</h1>':
            logging.warning(f"UX Issue - No specific branding found for type: {branding_type}")
        
        response_data = {"status": "success", "branding": branding}
        logging.debug(f"Sending branding for type {branding_type}: {json.dumps(response_data)}")
        return jsonify(response_data), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to retrieve branding: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500