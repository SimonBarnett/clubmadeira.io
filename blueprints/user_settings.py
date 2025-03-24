user_settings_bp = Blueprint('user_settings', __name__
 
@login_required(["self", "admin"], require_all=False) 
def get_user_settings_endpoint(USERid): 
    settings = get_user_settings(USERid) 
    if not settings: 
        return jsonify({"status": "error", "message": "User not found"}), 404 
    return jsonify({"status": "success", "settings": settings}), 200 
 
@login_required(["self", "admin"], require_all=False) 
def put_user_settings(USERid): 
    if not request.json: 
        return jsonify({"status": "error", "message": "Settings required"}), 400 
    settings = request.json 
    users_settings = load_users_settings() 
    users_settings[USERid] = settings 
    save_users_settings(users_settings) 
    return jsonify({"status": "success", "message": f"Settings updated for {USERid}"}), 200 
