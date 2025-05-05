from flask import Blueprint, request, jsonify, current_app
from utils.auth import login_required
from utils.users import load_users_settings, save_users_settings
import logging
import json
import os
from datetime import datetime

# region Blueprint Setup
# referral_bp: The galactic hub for tracking referrals, clicks, orders, logins, and signups!
referral_bp = Blueprint('referral_bp', __name__)
# endregion

# region /click POST - Recording Click Events
@referral_bp.route('/click', methods=['POST'])
def handle_click():
    """
    Records a click event between source and destination user IDs.
    Inputs: JSON payload with:
        - source_user_id (str): The ID of the user initiating the click.
        - destination_user_id (str): The ID of the user being clicked to.
        - timestamp (str): When the click happened.
    Outputs:
        - Success: JSON {"status": "success", "message": "Click recorded"}, status 200
        - Errors: JSON with error message, status 400 or 500
    """
    try:
        posthog_client = current_app.posthog_client
        data = request.get_json()
        if not data or not all(key in data for key in ["source_user_id", "destination_user_id", "timestamp"]):
            logging.warning(f"UX Issue - Invalid click data: {json.dumps(data)}")
            if posthog_client:
                posthog_client.capture(
                    distinct_id=data.get("source_user_id", "unknown"),
                    event="click_error",
                    properties={"error": "Invalid data: source_user_id, destination_user_id, timestamp required", "data": data}
                )
            return jsonify({"status": "error", "message": "Invalid data: source_user_id, destination_user_id, timestamp required"}), 400
        
        if posthog_client:
            try:
                posthog_client.capture(
                    distinct_id=data["source_user_id"],
                    event="click",
                    properties={
                        "source_user_id": data["source_user_id"],
                        "destination_user_id": data["destination_user_id"],
                        "timestamp": data["timestamp"]
                    }
                )
                logging.info(f"Click event captured for {data['source_user_id']} to {data['destination_user_id']}")
            except Exception as e:
                logging.error(f"Failed to capture click event: {str(e)}")
        else:
            logging.warning("posthog_client is None, event not captured")
        
        logging.info(f"Click recorded from {data['source_user_id']} to {data['destination_user_id']}")
        return jsonify({"status": "success", "message": "Click recorded"}), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to handle click: {str(e)}", exc_info=True)
        if posthog_client:
            posthog_client.capture(
                distinct_id=data.get("source_user_id", "unknown") if data else "unknown",
                event="click_error",
                properties={"error": f"Server error: {str(e)}"}
            )
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
# endregion

# region /order POST - Recording Order Events
@referral_bp.route('/order', methods=['POST'])
def handle_order():
    """
    Records an order event with source, destination user IDs, and sale value, like Trillian sealing a deal in the galaxy!
    Inputs: JSON payload with:
        - source_user_id (str): The ID of the user initiating the order.
        - destination_user_id (str): The ID of the user being referred to.
        - sale_value (float): The value of the sale.
        - timestamp (str): When the order happened, e.g., "2023-10-26T12:34:56Z".
    Outputs:
        - Success: JSON {"status": "success", "message": "Order recorded"}, status 200
        - Errors: JSON with error message, status 400 or 500
    """
    try:
        posthog_client = current_app.posthog_client
        data = request.get_json()
        if not data or not all(key in data for key in ["source_user_id", "destination_user_id", "sale_value", "timestamp"]):
            logging.warning(f"UX Issue - Invalid order data: {json.dumps(data)}")
            if posthog_client:
                posthog_client.capture(
                    distinct_id=data.get("source_user_id", "unknown"),
                    event="order_error",
                    properties={"error": "Invalid data: source_user_id, destination_user_id, sale_value, timestamp required", "data": data}
                )
            return jsonify({"status": "error", "message": "Invalid data: source_user_id, destination_user_id, sale_value, timestamp required"}), 400
        
        if posthog_client:
            posthog_client.capture(
                distinct_id=data["source_user_id"],
                event="order",
                properties={
                    "source_user_id": data["source_user_id"],
                    "destination_user_id": data["destination_user_id"],
                    "sale_value": data["sale_value"],
                    "timestamp": data["timestamp"]
                }
            )
        
        logging.info(f"Order recorded from {data['source_user_id']} to {data['destination_user_id']} for {data['sale_value']}")
        return jsonify({"status": "success", "message": "Order recorded"}), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to handle order: {str(e)}", exc_info=True)
        if posthog_client:
            posthog_client.capture(
                distinct_id=data.get("source_user_id", "unknown") if data else "unknown",
                event="order_error",
                properties={"error": f"Server error: {str(e)}"}
            )
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

# ASCII Art 2: The Towel
"""
       ______
      /|_||_\`.__
     (   _    _ _\
     =|  _    _  |  "Don’t forget your towel—essential for referral success!"
      | (_)  (_) |
       \._|\'|\'_./
          |__|__| 
"""