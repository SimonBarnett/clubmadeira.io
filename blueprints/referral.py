from flask import Blueprint, jsonify, request 
from utils.users import load_users_settings, save_users_settings 
 
referral_bp = Blueprint('referral', __name__) 
 
@referral_bp.route('/referral', methods=['POST']) 
def handle_referral(): 
    data = request.get_json() 
    if not data or 'timestamp' not in data: 
        return jsonify({"status": "error", "message": "Invalid data"}), 400 
    users_settings = load_users_settings() 
    referer = data.get("referer", "none") 
    if referer not in users_settings: 
        users_settings[referer] = {"referrals": {"visits": [], "orders": []}} 
    if "page" in data: 
        users_settings[referer]["referrals"]["visits"].append({"page": data["page"], "timestamp": data["timestamp"]}) 
    elif "orderId" in data: 
        users_settings[referer]["referrals"]["orders"].append({"orderId": data["orderId"], "buyer": data["buyer"], "total": data["total"], "timestamp": data["timestamp"]}) 
    save_users_settings(users_settings) 
    return jsonify({"status": "success", "message": "Referral recorded", "referer": referer}), 200 
