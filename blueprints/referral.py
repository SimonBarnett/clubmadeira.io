from flask import Blueprint, request, jsonify
from utils.users import load_users_settings, save_users_settings
import logging
import json

referral_bp = Blueprint('referral', __name__)

@referral_bp.route('/referral', methods=['POST'])  # Added explicit route for clarity
def handle_referral():
    try:
        data = request.get_json()
        if not data or 'timestamp' not in data:
            logging.warning(f"UX Issue - Invalid referral data: {json.dumps(data)}")
            return jsonify({"status": "error", "message": "Invalid data"}), 400
        
        users_settings = load_users_settings()
        referer = data.get("referer", "none")
        if referer not in users_settings:
            logging.debug(f"New referer {referer} initialized with empty referral data")
            users_settings[referer] = {"referrals": {"visits": [], "orders": []}}
        
        if "page" in data:
            users_settings[referer]["referrals"]["visits"].append({"page": data["page"], "timestamp": data["timestamp"]})
        elif "orderId" in data:
            users_settings[referer]["referrals"]["orders"].append({
                "orderId": data["orderId"],
                "buyer": data["buyer"],
                "total": data["total"],
                "timestamp": data["timestamp"]
            })
        else:
            logging.warning(f"UX Issue - Referral data missing page or orderId: {json.dumps(data)}")
            return jsonify({"status": "error", "message": "Invalid referral data"}), 400
        
        save_users_settings(users_settings)
        logging.debug(f"Referral recorded for referer {referer}: {json.dumps(data)}")
        return jsonify({"status": "success", "message": "Referral recorded", "referer": referer}), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to handle referral: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500