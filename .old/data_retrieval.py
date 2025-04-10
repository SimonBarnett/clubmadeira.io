from flask import Blueprint, request, jsonify
from utils.categories import get_all_categories
from utils.products import search_all_discounted
import logging
import json

data_retrieval_bp = Blueprint('data_retrieval', __name__)

def get_categories():
    try:
        parent_id = request.args.get('parent_id')
        categories = get_all_categories(parent_id)
        if not categories:
            logging.warning(f"UX Issue - No categories returned for parent_id: {parent_id}")
        return jsonify({"status": "success", "count": len(categories), "categories": categories}), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to retrieve categories: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@data_retrieval_bp.route('/discounted-products', methods=['GET'])
def get_all_discounted_products():
    try:
        category_id = request.args.get('category_id')
        if not category_id:
            logging.warning("UX Issue - No category_id provided for discounted products")
            return jsonify({"status": "error", "message": "category_id required"}), 400
        products = search_all_discounted(category_id)
        if not products:
            logging.warning(f"UX Issue - No discounted products found for category_id: {category_id}")
        return jsonify({"status": "success", "count": len(products), "products": products}), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to retrieve discounted products: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500