configuration_bp = Blueprint('configuration', __name__
 
@configuration_bp.route('/config', methods=['GET']) 
@login_required(["admin"], require_all=True) 
def get_config(): 
    config = load_config() 
    return jsonify({"status": "success", "count": len(config), "config": config}), 200 
 
@login_required(["admin"], require_all=True) 
def replace_config(affiliate): 
    config = load_config() 
    data = request.get_json() 
    if not data or not isinstance(data, dict): 
        return jsonify({"status": "error", "message": "Invalid data"}), 400 
    config[affiliate] = data 
    save_config(config) 
    return jsonify({"status": "success", "message": f"Updated {affiliate} config"}), 200 
