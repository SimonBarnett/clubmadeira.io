from flask import Blueprint, jsonify, request
from utils.data_utils import load_json_file, save_json_file
from utils.decorators import require_permissions

config_management_bp = Blueprint('config_management', __name__)

@config_management_bp.route('/', methods=['GET'])
@require_permissions(['admin'])
def get_config():
    config = load_json_file('config.json')
    return jsonify({"status": "success", "count": len(config), "config": config}), 200

@config_management_bp.route('/<affiliate>', methods=['PATCH'])
@require_permissions(['admin'])
def replace_config(affiliate):
    config = load_json_file('config.json')
    data = request.get_json()
    if not data or not isinstance(data, dict):
        return jsonify({"status": "error", "message": "Request body must contain a dictionary of credentials"}), 400
    config[affiliate] = data
    save_json_file(config, 'config.json')
    return jsonify({"status": "success", "message": f"Credentials for {affiliate} replaced", "credentials": config[affiliate]}), 200