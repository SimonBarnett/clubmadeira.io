from flask import Blueprint, jsonify, request
from utils.auth import login_required
from utils.config import load_config, save_config
import logging
import json

configuration_bp = Blueprint('configuration', __name__)

def get_config():
    try:
        config = load_config()
        # Redact sensitive data in logs
        log_config = config.copy()
        if "jwt" in log_config and "SECRET_KEY" in log_config["jwt"]:
            log_config["jwt"]["SECRET_KEY"] = "[REDACTED]"
        logging.debug(f"Retrieved config: {json.dumps(log_config)}")
        return jsonify({"status": "success", "count": len(config), "config": config}), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to retrieve config: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@configuration_bp.route('/config/<affiliate>', methods=['PATCH'])
@login_required(["admin"], require_all=True)
def replace_config(affiliate):
    try:
        config = load_config()
        data = request.get_json()
        if not data or not isinstance(data, dict):
            logging.warning(f"UX Issue - Invalid config update data for affiliate {affiliate}: {json.dumps(data)}")
            return jsonify({"status": "error", "message": "Invalid data"}), 400
        config[affiliate] = data
        save_config(config)
        # Redact sensitive data in logs
        log_config = config.copy()
        if "jwt" in log_config and "SECRET_KEY" in log_config["jwt"]:
            log_config["jwt"]["SECRET_KEY"] = "[REDACTED]"
        logging.debug(f"Updated config for affiliate {affiliate}: {json.dumps(log_config)}")
        return jsonify({"status": "success", "message": f"Updated {affiliate} config"}), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to update config for affiliate {affiliate}: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500