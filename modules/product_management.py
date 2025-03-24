from flask import Blueprint, jsonify, request
from utils.data_utils import load_json_file, save_json_file
from utils.decorators import require_permissions

product_management_bp = Blueprint('product_management', __name__)

@product_management_bp.route('/<USERid>/products', methods=['GET'])
@require_permissions(['self'])
def get_user_products(USERid):
    users_products = load_json_file('users_products.json')
    products = users_products.get(USERid, [])
    return jsonify({"status": "success", "count": len(products), "products": products}), 200

@product_management_bp.route('/<USERid>/products/<product_id>', methods=['GET'])
@require_permissions(['self'])
def reduce_product_quantity(USERid, product_id):
    qty = request.args.get('qty', type=int)
    if qty is None or qty >= 0:
        return jsonify({"status": "error", "message": "Query parameter 'qty' must be a negative integer"}), 400
    users_products = load_json_file('users_products.json')
    if USERid not in users_products:
        return jsonify({"status": "error", "message": f"User {USERid} not found"}), 404
    current_products = users_products[USERid]
    product_to_update = next((p for p in current_products if p["id"] == product_id), None)
    if not product_to_update:
        return jsonify({"status": "error", "message": f"Product {product_id} not found for user {USERid}"}), 404
    current_qty = product_to_update["qty"]
    if current_qty != -1:  # -1 could indicate unlimited quantity
        product_to_update["qty"] = max(0, current_qty + qty)
    users_products[USERid] = current_products
    save_json_file(users_products, 'users_products.json')
    return jsonify({"status": "success", "message": f"Quantity reduced for product {product_id}", "product": product_to_update}), 200