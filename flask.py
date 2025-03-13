from flask import Flask, jsonify, request
from flask_cors import CORS  # Added for CORS support
from amazon_paapi import AmazonApi
import time
import json
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Amazon API credentials (replace with your actual values)
ACCESS_KEY = "YOUR_ACCESS_KEY"
SECRET_KEY = "YOUR_SECRET_KEY"
ASSOCIATE_TAG = "YOUR_ASSOCIATE_TAG"
COUNTRY = "US"

amazon = AmazonApi(ACCESS_KEY, SECRET_KEY, ASSOCIATE_TAG, COUNTRY)

# JSON file to store user-specific root_category_ids
USERS_FILE = "users_categories.json"

# Default categories for new users (Books and Electronics)
DEFAULT_CATEGORIES = ["283155", "172282"]

# Load users' categories from JSON file
def load_users_categories():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return {}

# Save users' categories to JSON file
def save_users_categories(users_data):
    with open(USERS_FILE, 'w') as f:
        json.dump(users_data, f, indent=4)

# Get user-specific root_category_ids, adding USERid with default categories if not found
def get_user_categories(user_id):
    users_data = load_users_categories()
    if user_id not in users_data:
        users_data[user_id] = DEFAULT_CATEGORIES
        save_users_categories(users_data)
        print(f"Added new user {user_id} with default categories: {DEFAULT_CATEGORIES}")
    return users_data.get(user_id, [])

def get_immediate_subcategories(node_id):
    category_list = []
    try:
        nodes = amazon.get_browse_nodes([node_id])
        for node in nodes:
            if node.children:
                for child in node.children:
                    category_list.append({
                        "id": child.id,
                        "name": child.display_name,
                        "parent_name": node.display_name,
                        "has_children": bool(child.children)
                    })
        time.sleep(1)
    except Exception as e:
        print(f"Error fetching immediate subcategories for {node_id}: {str(e)}")
    return category_list

def search_discounted_items(browse_node_id, min_discount_percent=20):
    discounted_items = []
    search_params = {
        "BrowseNodeId": browse_node_id,
        "ItemCount": 10,
        "Resources": ["ItemInfo.Title", "Offers.Listings.Price", "Offers.Summaries.HighestPrice"]
    }
    try:
        for page in range(1, 11):
            search_params["ItemPage"] = page
            search_result = amazon.search_items(**search_params)
            if not search_result or not search_result.items:
                break
            for item in search_result.items:
                if (item.offers and item.offers.listings and item.offers.listings[0].price and 
                    item.offers.listings[0].price.savings and 
                    item.offers.listings[0].price.savings.percentage >= min_discount_percent):
                    discounted_items.append({
                        "asin": item.asin,
                        "title": item.item_info.title.display_value,
                        "browse_node_id": browse_node_id,
                        "current_price": item.offers.listings[0].price.amount,
                        "savings": item.offers.listings[0].price.savings.amount,
                        "original_price": item.offers.listings[0].price.amount + item.offers.listings[0].price.savings.amount,
                        "discount_percent": item.offers.listings[0].price.savings.percentage
                    })
            time.sleep(1)
    except Exception as e:
        print(f"Error searching node {browse_node_id}: {str(e)}")
    return discounted_items

def get_full_item_details(asins):
    full_item_data = []
    try:
        item_response = amazon.get_items(
            item_ids=asins,
            resources=["ItemInfo.ByLineInfo", "ItemInfo.ContentInfo", "ItemInfo.Features", 
                       "ItemInfo.ProductInfo", "ItemInfo.Title", "Images.Primary.Large", 
                       "Offers.Listings.Price", "DetailPageURL"]
        )
        for item in item_response.items:
            item_data = {
                "asin": item.asin,
                "title": item.item_info.title.display_value if item.item_info.title else None,
                "product_url": item.detail_page_url,
                "current_price": item.offers.listings[0].price.amount if item.offers and item.offers.listings else None,
                "savings": item.offers.listings[0].price.savings.amount if item.offers and item.offers.listings and item.offers.listings[0].price.savings else None,
                "original_price": (item.offers.listings[0].price.amount + item.offers.listings[0].price.savings.amount) if item.offers and item.offers.listings and item.offers.listings[0].price.savings else None,
                "discount_percent": item.offers.listings[0].price.savings.percentage if item.offers and item.offers.listings and item.offers.listings[0].price.savings else None,
                "manufacturer": item.item_info.by_line_info.manufacturer.display_value if item.item_info.by_line_info and item.item_info.by_line_info.manufacturer else None,
                "dimensions": item.item_info.product_info.item_dimensions.display_value if item.item_info.product_info and item.item_info.product_info.item_dimensions else None,
                "features": item.item_info.features.display_values if item.item_info.features else [],
                "image_url": item.images.primary.large.url if item.images and item.images.primary else None
            }
            full_item_data.append(item_data)
        time.sleep(1)
    except Exception as e:
        print(f"Error fetching full details for ASINs {asins}: {str(e)}")
    return full_item_data

def filter_categories_with_products(category_ids, min_discount_percent=20):
    filtered_categories = []
    try:
        nodes = amazon.get_browse_nodes(category_ids)
        for node in nodes:
            discounted_items = search_discounted_items(node.id, min_discount_percent)
            if discounted_items:
                filtered_categories.append({
                    "id": node.id,
                    "name": node.display_name,
                    "parent_name": node.context_free_name if node.context_free_name else "Root",
                    "has_children": bool(node.children)
                })
        time.sleep(1)
    except Exception as e:
        print(f"Error filtering categories: {str(e)}")
    return filtered_categories

@app.route('/<USERid>/discounted-products', methods=['GET'])
def get_discounted_products(USERid):
    category_id = request.args.get('category_id')
    min_discount = request.args.get('min_discount', default=20, type=int)
    all_discounted_items = []
    root_category_ids = get_user_categories(USERid)
    
    if category_id:
        all_category_ids = {category_id}
        discounted_items = search_discounted_items(category_id, min_discount)
        all_discounted_items.extend(discounted_items)
    else:
        all_category_ids = set()
        for root_id in root_category_ids:
            discounted_items = search_discounted_items(root_id, min_discount)
            if discounted_items:
                all_category_ids.add(root_id)
                all_discounted_items.extend(discounted_items)
    
    print(f"User {USERid} - Total categories with products (min_discount={min_discount}%): {len(all_category_ids)}")
    if all_discounted_items:
        asins = [item["asin"] for item in all_discounted_items]
        print(f"Found {len(asins)} discounted items. Fetching full details...")
        full_details = []
        for i in range(0, len(asins), 10):
            batch = asins[i:i + 10]
            full_details.extend(get_full_item_details(batch))
        for detail, discount_info in zip(full_details, all_discounted_items):
            detail["browse_node_id"] = discount_info["browse_node_id"]
        return jsonify({"status": "success", "count": len(full_details), "products": full_details, "min_discount": min_discount})
    else:
        return jsonify({"status": "success", "count": 0, "products": [], "message": f"No items with a discount greater than {min_discount}% were found."})

@app.route('/<USERid>/categories', methods=['GET'])
def get_categories(USERid):
    parent_id = request.args.get('parent_id')
    min_discount = request.args.get('min_discount', default=20, type=int)
    all_categories = []
    root_category_ids = get_user_categories(USERid)
    
    try:
        if parent_id:
            print(f"User {USERid} - Fetching subcategories for parent node {parent_id}...")
            subcategories = get_immediate_subcategories(parent_id)
            if subcategories:
                subcategory_ids = [cat["id"] for cat in subcategories]
                all_categories = filter_categories_with_products(subcategory_ids, min_discount)
        else:
            print(f"User {USERid} - Fetching root categories with products...")
            all_categories = filter_categories_with_products(root_category_ids, min_discount)
        
        if all_categories:
            return jsonify({"status": "success", "count": len(all_categories), "categories": all_categories, "min_discount": min_discount})
        else:
            return jsonify({"status": "success", "count": 0, "categories": [], "message": f"No categories with products at {min_discount}% discount found."})
    except Exception as e:
        return jsonify({"status": "error", "message": f"Error fetching categories: {str(e)}"}), 500

@app.route('/<USERid>/categories', methods=['PUT'])
def put_user_categories(USERid):
    if not request.json or 'categories' not in request.json:
        return jsonify({"status": "error", "message": "Request body must contain 'categories' list"}), 400
    
    new_categories = request.json['categories']
    if not isinstance(new_categories, list):
        return jsonify({"status": "error", "message": "'categories' must be a list"}), 400
    
    users_data = load_users_categories()
    users_data[USERid] = new_categories
    save_users_categories(users_data)
    return jsonify({"status": "success", "message": f"Categories for user {USERid} replaced", "categories": new_categories})

@app.route('/<USERid>/categories', methods=['PATCH'])
def patch_user_categories(USERid):
    if not request.json or 'categories' not in request.json:
        return jsonify({"status": "error", "message": "Request body must contain 'categories' list"}), 400
    
    new_categories = request.json['categories']
    if not isinstance(new_categories, list):
        return jsonify({"status": "error", "message": "'categories' must be a list"}), 400
    
    users_data = load_users_categories()
    current_categories = set(users_data.get(USERid, []))
    current_categories.update(new_categories)
    users_data[USERid] = list(current_categories)
    save_users_categories(users_data)
    return jsonify({"status": "success", "message": f"Categories for user {USERid} patched", "categories": users_data[USERid]})

@app.route('/<USERid>/categories', methods=['DELETE'])
def delete_user_category(USERid):
    category_id = request.args.get('category_id')
    if not category_id:
        return jsonify({"status": "error", "message": "Query parameter 'category_id' is required"}), 400
    
    users_data = load_users_categories()
    if USERid in users_data:
        current_categories = users_data[USERid]
        if category_id in current_categories:
            current_categories.remove(category_id)
            users_data[USERid] = current_categories
            save_users_categories(users_data)
            return jsonify({"status": "success", "message": f"Category {category_id} removed for user {USERid}", "categories": current_categories})
        else:
            return jsonify({"status": "error", "message": f"Category {category_id} not found for user {USERid}"}), 404
    return jsonify({"status": "error", "message": f"User {USERid} not found"}), 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)