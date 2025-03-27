from flask import Blueprint, request, jsonify
from utils.auth import login_required
from utils.users import load_users_settings, save_users_settings
import logging
import json

# region Blueprint Setup
# Welcome to referral_bp, the blueprint that tracks referrals like Zaphod Beeblebrox tracks the best parties in the galaxy!
# This module is the galactic hub for recording and retrieving referral data—prepare for some improbably fun stats!
referral_bp = Blueprint('referral_bp', __name__)
# endregion

# region /referral POST - Recording Galactic Referrals
@referral_bp.route('/referral', methods=['POST'])
def handle_referral():
    """
    Records referral data (visits or orders), like the Spanish Inquisition—nobody expects it, but it’s here!
    Purpose: To log referral activities, whether it’s a page visit or an order, for tracking and analytics. Public access—no permissions needed, just like the People’s Front of Judea’s open meetings.
    Inputs: JSON payload with:
        - timestamp (str): When the referral happened, e.g., "2023-10-26T12:34:56Z".
        - referer (str, optional): The ID of the referer, defaults to "none" if not provided.
        - page (str, optional): The page visited, required for visit referrals.
        - orderId (str, optional): The order ID, required for order referrals.
        - buyer (str, optional): The buyer’s name or ID for orders.
        - total (float, optional): The order total for orders.
    Outputs:
        - Success: JSON {"status": "success", "message": "Referral recorded", "referer": "<referer>"}, status 200—referral logged!
        - Errors:
            - 400: {"status": "error", "message": "Invalid data: timestamp required"}—no timestamp, no fork handles!
            - 400: {"status": "error", "message": "Invalid referral data: page or orderId required"}—missing key data!
            - 500: {"status": "error", "message": "Server error: <reason>"}—the Parrot’s ceased to be!
    """
    try:
        # Arthur Dent checks the JSON—timestamp is crucial, or it’s a bust!
        data = request.get_json()
        if not data or 'timestamp' not in data:
            logging.warning(f"UX Issue - Invalid referral data: {json.dumps(data)}")
            return jsonify({"status": "error", "message": "Invalid data: timestamp required"}), 400
        
        # Load the user settings—like the Guide, but with less towel advice.
        users_settings = load_users_settings()
        referer = data.get("referer", "none")
        if referer not in users_settings:
            # Initialize new referer—like Zaphod discovering a new head!
            logging.debug(f"New referer {referer} initialized with empty referral data")
            users_settings[referer] = {"referrals": {"visits": [], "orders": []}}
        
        # Record the referral—page visit or order, like the Holy Grail or a shrubbery.
        if "page" in data:
            users_settings[referer]["referrals"]["visits"].append({
                "page": data["page"],
                "timestamp": data["timestamp"]
            })
        elif "orderId" in data:
            users_settings[referer]["referrals"]["orders"].append({
                "orderId": data["orderId"],
                "buyer": data.get("buyer", "unknown"),
                "total": data.get("total", 0.0),
                "timestamp": data["timestamp"]
            })
        else:
            # Missing page or orderId? That’s like asking for four candles and getting fork handles!
            logging.warning(f"UX Issue - Referral data missing page or orderId: {json.dumps(data)}")
            return jsonify({"status": "error", "message": "Invalid referral data: page or orderId required"}), 400
        
        # Save the updated settings—stronger than a Wookiee’s grip!
        save_users_settings(users_settings)
        logging.info(f"Referral recorded for referer {referer}: {json.dumps(data)}")
        return jsonify({"status": "success", "message": "Referral recorded", "referer": referer}), 200
    except Exception as e:
        # Marvin’s take: “I recorded a referral, and now I’m even more depressed.”
        logging.error(f"UX Issue - Failed to handle referral: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
# endregion

# ASCII Art 1: The Dead Parrot
"""
       ______
      /|_||_\`.__
     (   _    _ _\
     =|  _    _  |  "This referral is no more! It has ceased to be!"
      | (_)  (_) |
       \._|\'|\'_./
          |__|__| 
"""

# region /<user_id>/visits GET - Checking Referral Visits
@referral_bp.route('/<user_id>/visits', methods=['GET'])
@login_required(["self", "admin"], require_all=False)
def get_referral_visits(user_id):
    """
    Retrieves referral visits for a user, like Zaphod checking his party RSVPs.
    Purpose: To list all page visits referred by the user—restricted to the user themselves or admins, because privacy is key in the galaxy!
    Permissions: Restricted to "self" or "admin"—you’re either the referer or the Messiah!
    Inputs: URL parameter:
        - user_id (str): The ID of the user whose referral visits are sought.
    Outputs:
        - Success: JSON {"status": "success", "visits": [<visit_data>]}, status 200—visits revealed!
        - Errors:
            - 403: {"status": "error", "message": "Unauthorized"}—you’re not the chosen one!
            - 500: {"status": "error", "message": "Server error: <reason>"}—the Ronnies lost the candles!
    """
    try:
        # Permission check—like the Knights Who Say Ni demanding a shrubbery!
        if user_id != request.user_id and "admin" not in request.permissions:
            logging.warning(f"Security Issue - Unauthorized visits retrieval attempt for {user_id} by {request.user_id}")
            return jsonify({"status": "error", "message": "Unauthorized"}), 403
        
        # Load the user settings—like the Guide, but with less towel advice.
        users_settings = load_users_settings()
        if user_id not in users_settings or "referrals" not in users_settings[user_id]:
            logging.warning(f"UX Issue - No referral data found for user {user_id}")
            return jsonify({"status": "success", "visits": []}), 200
        
        # Fetch the visits—neater than Ronnie Corbett’s wordplay.
        visits = users_settings[user_id]["referrals"].get("visits", [])
        logging.debug(f"Retrieved referral visits for user {user_id}: {json.dumps(visits)}")
        return jsonify({"status": "success", "visits": visits}), 200
    except Exception as e:
        # Marvin groans: “I fetched visits, and now I’m broken.”
        logging.error(f"UX Issue - Failed to retrieve referral visits for user {user_id}: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
# endregion

# region /<user_id>/orders GET - Checking Referral Orders
@referral_bp.route('/<user_id>/orders', methods=['GET'])
@login_required(["self", "admin"], require_all=False)
def get_referral_orders(user_id):
    """
    Retrieves referral orders for a user, like Trillian tallying up the galaxy’s shopping spree.
    Purpose: To list all orders referred by the user—restricted to the user or admins, because only the elite can peek at the ledger!
    Permissions: Restricted to "self" or "admin"—you’re either the referer or the chosen one!
    Inputs: URL parameter:
        - user_id (str): The ID of the user whose referral orders are sought.
    Outputs:
        - Success: JSON {"status": "success", "orders": [<order_data>]}, status 200—orders revealed!
        - Errors:
            - 403: {"status": "error", "message": "Unauthorized"}—you’re not the Messiah, you’re a very naughty boy!
            - 500: {"status": "error", "message": "Server error: <reason>"}—the Parrot’s pining again!
    """
    try:
        # Permission check—like the Holy Hand Grenade, only the worthy may pass!
        if user_id != request.user_id and "admin" not in request.permissions:
            logging.warning(f"Security Issue - Unauthorized orders retrieval attempt for {user_id} by {request.user_id}")
            return jsonify({"status": "error", "message": "Unauthorized"}), 403
        
        # Load the user settings—like the Guide, but with less towel advice.
        users_settings = load_users_settings()
        if user_id not in users_settings or "referrals" not in users_settings[user_id]:
            logging.warning(f"UX Issue - No referral data found for user {user_id}")
            return jsonify({"status": "success", "orders": []}), 200
        
        # Fetch the orders—neater than a Two Ronnies sketch.
        orders = users_settings[user_id]["referrals"].get("orders", [])
        logging.debug(f"Retrieved referral orders for user {user_id}: {json.dumps(orders)}")
        return jsonify({"status": "success", "orders": orders}), 200
    except Exception as e:
        # Marvin sighs: “I fetched orders, and now I’m even more depressed.”
        logging.error(f"UX Issue - Failed to retrieve referral orders for user {user_id}: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
# endregion

# ASCII Art 2: The Towel (Hitchhiker’s Guide)
"""
       ______
      /|_||_\`.__
     (   _    _ _\
     =|  _    _  |  "Don’t forget your towel—essential for referral success!"
      | (_)  (_) |
       \._|\'|\'_./
          |__|__| 
"""