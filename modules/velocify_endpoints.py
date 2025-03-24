from flask import Blueprint, jsonify, request
from utils.data_utils import load_json_file

velocify_endpoints_bp = Blueprint('velocify_endpoints', __name__)

@velocify_endpoints_bp.route('/<USERid>/discounted-products', methods=['GET'])
def get_user_discounted_products(USERid):
    category_id = request.args.get('category_id')
    min_discount = request.args.get('min_discount', default=20, type=int)
    # Placeholder: Fetch user categories and search for discounted products
    return jsonify({"status": "success", "products": [], "min_discount": min_discount}), 200