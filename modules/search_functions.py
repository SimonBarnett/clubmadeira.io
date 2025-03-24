from flask import Blueprint, jsonify, request
from utils.data_utils import load_json_file

search_functions_bp = Blueprint('search_functions', __name__)

@search_functions_bp.route('/discounted-products', methods=['GET'])
def get_discounted_products():
    category_id = request.args.get('category_id')
    if not category_id:
        return jsonify({"status": "error", "message": "Query parameter 'category_id' is required"}), 400
    # Placeholder: Integrate with affiliate APIs or database
    return jsonify({"status": "success", "products": []}), 200  # Replace with actual search logic