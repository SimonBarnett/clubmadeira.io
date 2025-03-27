from flask import Blueprint, request, jsonify
from utils.products import search_all_discounted
from utils.categories import get_all_categories
import logging
import json

# region Blueprint Setup
# Welcome to content_bp, the blueprint that’s more organized than the Spanish Inquisition’s filing system.
# Arthur Dent would be proud—simple, logical, and occasionally bewildered by its own existence.
content_bp = Blueprint('content_bp', __name__)
# endregion

# region /discounted-products GET - The Quest for Bargain Treasures
@content_bp.route('/discounted-products', methods=['GET'])
def get_all_discounted_products():
    """
    Retrieves all discounted products for a given category, like Zaphod Beeblebrox hunting for the best Pan Galactic Gargle Blaster deals.
    Purpose: To provide a list of products that are currently on discount, filtered by category—like the Holy Grail, but with price tags.
    Inputs: Query parameter:
        - category_id (str): The ID of the category to filter discounted products. Required, or it’s like asking for "four candles" and getting fork handles.
    Outputs:
        - Success: JSON {"status": "success", "count": <int>, "products": [<product_data>]}, status 200—your treasure map to savings!
        - Errors:
            - 400: {"status": "error", "message": "category_id required"}—you forgot the category, you naughty boy!
            - 500: {"status": "error", "message": "Server error: <reason>"}—the system’s gone to the People’s Front of Judea!
    """
    try:
        # Arthur Dent checks the query params—where’s that category_id?
        category_id = request.args.get('category_id')
        if not category_id:
            logging.warning("UX Issue - No category_id provided for discounted products")
            return jsonify({"status": "error", "message": "category_id required"}), 400
        
        # Search for discounted products—like finding a shrubbery in a galaxy far, far away.
        products = search_all_discounted(category_id)
        if not products:
            logging.warning(f"UX Issue - No discounted products found for category_id: {category_id}")
        
        # Assemble the response—fit for the Life of Brian’s marketplace.
        response_data = {"status": "success", "count": len(products), "products": products}
        logging.debug(f"Retrieved discounted products for category_id {category_id}: {json.dumps(response_data)}")
        return jsonify(response_data), 200
    except Exception as e:
        # Marvin’s lament: “I tried to fetch products, but the universe broke.”
        logging.error(f"UX Issue - Failed to retrieve discounted products: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
# endregion

# ASCII Art 1: The Holy Grail
"""
       /\
      /  \
     /____\  "It's just a flesh wound! Keep searching for those discounts!"
    |      |
    |______|
"""

# region /categories GET - Mapping the Galactic Product Hierarchy
@content_bp.route('/categories', methods=['GET'])
def get_categories():
    """
    Retrieves product categories, optionally filtered by parent_id, like Trillian navigating the Heart of Gold’s improbability drive.
    Purpose: To provide a list of categories, helping users explore the product galaxy—like the Guide, but for shopping.
    Inputs: Query parameter (optional):
        - parent_id (str): The ID of the parent category to filter subcategories. If omitted, returns top-level categories.
    Outputs:
        - Success: JSON {"status": "success", "count": <int>, "categories": [<category_data>]}, status 200—your map to the stars!
        - Errors:
            - 500: {"status": "error", "message": "Server error: <reason>"}—the Ronnies misplaced the candles!
    """
    try:
        # Zaphod checks the query—parent_id or bust!
        parent_id = request.args.get('parent_id')
        # Fetch categories—like finding the right fork handle in a sea of four candles.
        categories = get_all_categories(parent_id)
        if not categories:
            logging.warning(f"UX Issue - No categories returned for parent_id: {parent_id or 'None'}")
        
        # Assemble the response—neater than a Two Ronnies sketch.
        response_data = {"status": "success", "count": len(categories), "categories": categories}
        logging.debug(f"Retrieved categories for parent_id {parent_id or 'None'}: {json.dumps(response_data)}")
        return jsonify(response_data), 200
    except Exception as e:
        # Marvin’s take: “I fetched categories, and now I’m even more depressed.”
        logging.error(f"UX Issue - Failed to retrieve categories: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
# endregion

# ASCII Art 2: Zaphod Beeblebrox
"""
       ______
      /|_||_\`.__
     (   _    _ _\
     =|  _    _  |  "Two heads are better than one—especially for finding bargains!"
      | (_)  (_) |
       \._|\'|\'_./
          |__|__| 
"""