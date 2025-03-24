user_management_bp = Blueprint('user_management', __name__
 
@user_management_bp.route('/users', methods=['GET']) 
@login_required(["admin"], require_all=True) 
def get_users(): 
    users_settings = load_users_settings() 
    user_list = [{"USERid": uid, "email_address": u["email_address"], "contact_name": u["contact_name"]} for uid, u in users_settings.items()] 
    return jsonify({"status": "success", "users": user_list}), 200 
 
@login_required(["admin"], require_all=True) 
def get_user(user_id): 
    users_settings = load_users_settings() 
    user = users_settings.get(user_id) 
    if not user: 
        return jsonify({"status": "error", "message": "User not found"}), 404 
    return jsonify({"status": "success", "user": {"USERid": user_id, **user}}), 200 
