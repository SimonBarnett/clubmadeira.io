from flask import Blueprint, jsonify, request 
from utils.auth import login_required 
from utils.categories import get_all_categories, filter_categories_with_products 
from utils.products import search_all_discounted 
 
data_retrieval_bp = Blueprint('data_retrieval', __name__) 
 
@data_retrieval_bp.route('/categories', methods=['GET']) 
@login_required(["allauth"], require_all=False) 
def get_categories(): 
    parent_id = request.args.get('parent_id') 
    categories = get_all_categories(parent_id) 
    return jsonify({"status": "success", "count": len(categories), "categories": categories}), 200 
 
@data_retrieval_bp.route('/discounted-products', methods=['GET']) 
def get_all_discounted_products(): 
    category_id = request.args.get('category_id') 
    if not category_id: 
        return jsonify({"status": "error", "message": "category_id required"}), 400 
    products = search_all_discounted(category_id) 
    return jsonify({"status": "success", "count": len(products), "products": products}), 200 
from flask import Blueprint, jsonify, request 
from utils.auth import login_required 
from utils.categories import get_all_categories, filter_categories_with_products 
from utils.products import search_all_discounted 
 
data_retrieval_bp = Blueprint('data_retrieval', __name__) 
 
@data_retrieval_bp.route('/categories', methods=['GET']) 
@login_required(["allauth"], require_all=False) 
def get_categories(): 
    parent_id = request.args.get('parent_id') 
    categories = get_all_categories(parent_id) 
    return jsonify({"status": "success", "count": len(categories), "categories": categories}), 200 
 
@data_retrieval_bp.route('/discounted-products', methods=['GET']) 
def get_all_discounted_products(): 
    category_id = request.args.get('category_id') 
    if not category_id: 
        return jsonify({"status": "error", "message": "category_id required"}), 400 
    products = search_all_discounted(category_id) 
    return jsonify({"status": "success", "count": len(products), "products": products}), 200 
