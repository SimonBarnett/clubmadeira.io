site_request_bp = Blueprint('site_request', __name__
 
@login_required(["admin", "merchant", "community"], require_all=False) 
def save_site_request_endpoint(user_id): 
    data = request.get_json() 
    if not data or (data.get("userId") and data["userId"] != user_id): 
        return jsonify({"status": "error", "message": "Invalid data"}), 400 
    if request.user_id != user_id: 
        return jsonify({"status": "error", "message": "Unauthorized"}), 403 
    request_type = data.get("type", "community") 
    site_request = { 
        "user_id": user_id, 
        "type": request_type, 
        "communityName": data.get("communityName", ""), 
        "submitted_at": datetime.datetime.utcnow().isoformat() 
    } 
    if not site_request["communityName"]: 
        return jsonify({"status": "error", "message": "Community name required"}), 400 
    save_site_request(user_id, site_request) 
    return jsonify({"status": "success", "message": "Site request saved"}), 200 
