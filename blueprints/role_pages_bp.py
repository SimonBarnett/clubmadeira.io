from flask import Blueprint, render_template, request, jsonify
from utils.auth import login_required
from utils.users import load_users_settings
import logging
import os
import json

# region Blueprint Setup
# This is role_pages_bp, more organized than Zaphod Beeblebrox’s two-headed filing system!
# It handles role-specific pages and branding—think of it as the Heart of Gold’s control panel.
role_pages_bp = Blueprint('role_pages', __name__)
# endregion

# region Helper Function: load_branding_data
def load_branding_data():
    """
    Loads branding data from 'branding.json', like Arthur Dent deciphering the Guide.
    Purpose: Fetches custom branding for roles, making pages as unique as Vogon poetry.
    Inputs: None—reads from a file, like the Dead Parrot’s final squawk.
    Outputs:
        - Success: Dict of branding data, e.g., {"admin": "<h1>Admin Dashboard</h1>", ...}
        - Fallback: Default branding if the file’s missing, like Marvin’s default gloom.
    """
    try:
        branding_file = os.path.join(os.path.dirname(__file__), '..', 'branding.json')
        if os.path.exists(branding_file):
            with open(branding_file, 'r') as f:
                return json.load(f)
        else:
            # No file? It’s like asking for four candles and getting fork handles!
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
        # Marvin: “I tried to load branding, and now I’m even more depressed.”
        logging.error(f"UX Issue - Failed to load branding data: {str(e)}", exc_info=True)
        return {
            "admin": "<h1>Admin Dashboard</h1>",
            "merchant": "<h1>Merchant Dashboard</h1>",
            "community": "<h1>Community Dashboard</h1>",
            "wixpro": "<h1>Partner Dashboard</h1>",
            "login": "<h1>Login</h1>",
            "signup": "<h1>Sign Up</h1>"
        }
# endregion

# region /admin GET - Admin’s Command Center
@role_pages_bp.route('/admin', methods=['GET'])
@login_required(["admin"], require_all=True)
def admin():
    """
    Renders the admin dashboard, faster than Zaphod saying “Don’t Panic!”.
    Purpose: Provides a control panel for admins—like the Heart of Gold’s bridge, admin-only!
    Permissions: "admin" only—you’re either the Messiah or nobody!
    Inputs: None—just be logged in as admin, or it’s “Nobody expects the Spanish Inquisition!”
    Outputs:
        - Success: HTML admin dashboard with user data.
        - Errors:
            - 401: {"status": "error", "message": "User ID not found in token"}
            - 404: {"status": "error", "message": "User not found"}
            - 500: {"status": "error", "message": "Server error"}
    """
    try:
        # Check user_id—like the Knights Who Say Ni demanding a shrubbery!
        user_id = request.user_id
        if not user_id:
            logging.error("Security Issue - Admin route accessed with no user_id")
            return jsonify({"status": "error", "message": "User ID not found in token"}), 401
        
        # Load user settings—like the Guide, but less towel-focused.
        users_settings = load_users_settings()
        user = users_settings.get(user_id)
        if not user:
            logging.warning(f"UX Issue - Admin route - User not found: {user_id}")
            return jsonify({"status": "error", "message": "User not found"}), 404
        
        # Render the dashboard—stronger than a Wookiee’s grip!
        logging.debug(f"Rendering admin dashboard for user {user_id}")
        return render_template('admin.html', user=user)
    except Exception as e:
        # Marvin: “I tried to render the admin page, and now I’m broken.”
        logging.error(f"UX Issue - Failed to render admin page: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500
# endregion

# ASCII Art 1: The Holy Hand Grenade
"""
       ______
      /|_||_\`.__
     (   _    _ _\
     =|  _    _  |  "And Saint Attila raised the hand grenade up on high..."
      | (_)  (_) |
       \._|\'|\'_./
          |__|__| 
"""

# region /community GET - Community Hub
@role_pages_bp.route('/community', methods=['GET'])
@login_required(["community", "admin"], require_all=False)
def community():
    """
    Renders the community dashboard, like Trillian hosting a galactic tea party.
    Purpose: A space for community users and admins, like the People’s Front of Judea’s lair.
    Permissions: "community" or "admin"—part of the community or the chosen one!
    Inputs: None—just be logged in, or it’s “Nobody expects the Spanish Inquisition!”
    Outputs:
        - Success: HTML community dashboard with user data (if available).
        - Errors:
            - 500: {"status": "error", "message": "Server error"}
    """
    try:
        # Fetch user_id—like Zaphod checking his second head.
        user_id = request.user_id
        users_settings = load_users_settings()
        user = users_settings.get(user_id) if user_id else None
        if not user and user_id:
            logging.warning(f"UX Issue - Community route - User not found: {user_id}")
        
        # Render the dashboard—neater than a Two Ronnies sketch.
        logging.debug(f"Rendering community dashboard for user {user_id}")
        return render_template('community.html', user=user)
    except Exception as e:
        # Marvin: “I tried to render the community page, and now I’m depressed.”
        logging.error(f"UX Issue - Failed to render community page: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500
# endregion

# region /merchant GET - Merchant’s Marketplace
@role_pages_bp.route('/merchant', methods=['GET'])
@login_required(["merchant", "admin"], require_all=False)
def merchant():
    """
    Renders the merchant dashboard, like Arthur Dent navigating Magrathea’s marketplace.
    Purpose: A control panel for merchants and admins—like the Heart of Gold’s bridge!
    Permissions: "merchant" or "admin"—merchant or Messiah!
    Inputs: None—just be logged in, or it’s “Nobody expects the Spanish Inquisition!”
    Outputs:
        - Success: HTML merchant dashboard with user data (if available).
        - Errors:
            - 500: {"status": "error", "message": "Server error"}
    """
    try:
        # Fetch user_id—like Zaphod checking his second head.
        user_id = request.user_id
        users_settings = load_users_settings()
        user = users_settings.get(user_id) if user_id else None
        if not user and user_id:
            logging.warning(f"UX Issue - Merchant route - User not found: {user_id}")
        
        # Render the dashboard—stronger than a Wookiee’s grip!
        logging.debug(f"Rendering merchant dashboard for user {user_id}")
        return render_template('merchant.html', user=user)
    except Exception as e:
        # Marvin: “I tried to render the merchant page, and now I’m broken.”
        logging.error(f"UX Issue - Failed to render merchant page: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500
# endregion

# region /partner GET - Partner’s Portal
@role_pages_bp.route('/partner', methods=['GET'])
@login_required(["wixpro", "admin"], require_all=False)
def partner():
    """
    Renders the partner dashboard, like Trillian tweaking the improbability drive.
    Purpose: A control panel for partners (wixpro) and admins—like the Heart of Gold’s bridge!
    Permissions: "wixpro" or "admin"—partner or chosen one!
    Inputs: None—just be logged in, or it’s “Nobody expects the Spanish Inquisition!”
    Outputs:
        - Success: HTML partner dashboard with user data (if available).
        - Errors:
            - 500: {"status": "error", "message": "Server error"}
    """
    try:
        # Fetch user_id—like Zaphod checking his second head.
        user_id = request.user_id
        users_settings = load_users_settings()
        user = users_settings.get(user_id) if user_id else None
        if not user and user_id:
            logging.warning(f"UX Issue - Partner route - User not found: {user_id}")
        
        # Render the dashboard—neater than a Two Ronnies sketch.
        logging.debug(f"Rendering partner dashboard for user {user_id}")
        return render_template('partner.html', user=user)
    except Exception as e:
        # Marvin: “I tried to render the partner page, and now I’m depressed.”
        logging.error(f"UX Issue - Failed to render partner page: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500
# endregion

# region /branding GET - Fetch Galactic Branding
@role_pages_bp.route('/branding', methods=['GET'])
@login_required(["allauth"], require_all=False)
def get_branding():
    """
    Retrieves branding data, like Marvin fetching the Ultimate Answer (42, obviously).
    Purpose: Provides custom branding for roles, as unique as Vogon poetry.
    Permissions: "allauth"—any authenticated user can peek, like the People’s Front of Judea.
    Inputs: Query parameter:
        - type (str): Branding type, e.g., "admin", "merchant".
    Outputs:
        - Success: JSON {"status": "success", "branding": "<html_content>"}, 200
        - Errors:
            - 400: {"status": "error", "message": "Branding type not specified"}
            - 500: {"status": "error", "message": "Server error: <reason>"}
    """
    try:
        # Check branding type—like the Knights Who Say Ni demanding a shrubbery!
        branding_type = request.args.get('type')
        if not branding_type:
            logging.warning("UX Issue - No branding type provided")
            return jsonify({"status": "error", "message": "Branding type not specified"}), 400
        
        # Map "partner" to "wixpro"—Ronnie Barker would approve!
        if branding_type == 'partner':
            branding_type = 'wixpro'

        # Fetch branding—like Arthur Dent flipping through the Guide.
        branding_data = load_branding_data()
        branding = branding_data.get(branding_type, '<h1>Dashboard</h1>')
        if branding == '<h1>Dashboard</h1>':
            logging.warning(f"UX Issue - No branding for type: {branding_type}")
        
        # Assemble response—fit for the Life of Brian’s marketplace.
        response_data = {"status": "success", "branding": branding}
        logging.debug(f"Sending branding for {branding_type}: {json.dumps(response_data)}")
        return jsonify(response_data), 200
    except Exception as e:
        # Marvin: “I tried to fetch branding, and now I’m broken.”
        logging.error(f"UX Issue - Failed to retrieve branding: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
# endregion

# ASCII Art 2: The Towel (Hitchhiker’s Guide)
"""
       ______
      /|_||_\`.__
     (   _    _ _\
     =|  _    _  |  "Don’t forget your towel—essential for navigating role pages!"
      | (_)  (_) |
       \._|\'|\'_./
          |__|__| 
"""