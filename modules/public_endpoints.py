from flask import Blueprint, render_template, jsonify
import os
import json

public_endpoints_bp = Blueprint('public_endpoints', __name__)

@public_endpoints_bp.route('/', methods=['GET'])
def home():
    return render_template('login.html')

@public_endpoints_bp.route('/branding', methods=['GET'])
def branding():
    try:
        root_dir = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.join(root_dir, 'branding.json')
        with open(json_path, 'r') as f:
            branding_data = json.load(f)
        return jsonify(branding_data)
    except FileNotFoundError:
        return jsonify({'content': '<h1>Branding content not found</h1>'}), 500
    except Exception as e:
        return jsonify({'content': f'Internal Server Error: {str(e)}'}), 500