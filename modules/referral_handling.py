from flask import Blueprint, jsonify, request
from utils.data_utils import load_json_file, save_json_file
from utils.decorators import require_permissions

referral_handling_bp = Blueprint('referral_handling', __name__)

@referral_handling_bp.route('/referal', methods=['POST'])  # Note: 'referal' might be a typo; consider 'referral'
def handle_referral():
    data = request.get_json()
    if not data:
        return jsonify({"status": "error", "message": "No data provided"}), 400
    users_settings = load_json_file('users_settings.json')
    referer = data.get("referer", "none")
    timestamp = data.get("timestamp")
    if not timestamp:
        return jsonify({"status": "error", "message": "Timestamp is required"}), 400
    if referer not in users_settings:
        users_settings[referer] = {
            "contact_name": "",
            "website_url": "",
            "email_address": "",
            "phone_number": "",
            "wixClientId": "",
            "referrals": {"visits": [], "orders": []}
        }
    elif "referrals" not in users_settings[referer]:
        users_settings[referer]["referrals"] = {"visits": [], "orders": []}
    if "page" in data:
        referral_data = {"page": data["page"], "timestamp": timestamp}
        users_settings[referer]["referrals"]["visits"].append(referral_data)
    elif "orderId" in data:
        referral_data = {"orderId": data["orderId"], "buyer": data["buyer"], "total": data["total"], "timestamp": timestamp}
        users_settings[referer]["referrals"]["orders"].append(referral_data)
    else:
        return jsonify({"status": "error", "message": "Invalid referral data format"}), 400
    save_json_file(users_settings, 'users_settings.json')
    return jsonify({"status": "success", "message": "Referral data recorded", "referer": referer, "timestamp": timestamp}), 200

@referral_handling_bp.route('/<USERid>/visits', methods=['GET'])
@require_permissions(['self', 'admin'], require_all=False)
def get_user_visits(USERid):
    users_settings = load_json_file('users_settings.json')
    if USERid not in users_settings:
        return jsonify({"status": "error", "message": f"User {USERid} not found"}), 404
    referrals = users_settings[USERid].get("referrals", {})
    visits = referrals.get("visits", [])
    return jsonify({"status": "success", "count": len(visits), "visits": visits}), 200

@referral_handling_bp.route('/<USERid>/orders', methods=['GET'])
@require_permissions(['self', 'admin'], require_all=False)
def get_user_orders(USERid):
    users_settings = load_json_file('users_settings.json')
    if USERid not in users_settings:
        return jsonify({"status": "error", "message": f"User {USERid} not found"}), 404
    referrals = users_settings[USERid].get("referrals", {})
    orders = referrals.get("orders", [])
    return jsonify({"status": "success", "count": len(orders), "orders": orders}), 200