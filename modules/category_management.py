from flask import Blueprint, jsonify, request
from utils.data_utils import load_json_file, save_json_file
from utils.decorators import require_permissions

category_management_bp = Blueprint('category_management', __name__)

@category_management_bp.route('/<USERid>/mycategories', methods=['GET'])
@require_permissions(['self'])
def get_user_categories(USERid):
    users_data = load_json_file('users_categories.json')
    categories = users_data.get(USERid, [])
    return jsonify({"status": "success", "count": len(categories), "categories": categories}), 200

@category_management_bp.route('/<USERid>/mycategories', methods=['PUT'])
@require_permissions(['self'])
def put_user_categories(USERid):
    if not request.json or 'categories' not in request.json:
        return jsonify({"status": "error", "message": "Request body must contain 'categories' list"}), 400
    new_categories = request.json['categories']
    if not isinstance(new_categories, list):
        return jsonify({"status": "error", "message": "'categories' must be a list"}), 400
    users_data = load_json_file('users_categories.json')
    users_data[USERid] = new_categories
    save_json_file(users_data, 'users_categories.json')
    return jsonify({"status": "success", "message": f"Categories for user {USERid} replaced", "categories": new_categories}), 200