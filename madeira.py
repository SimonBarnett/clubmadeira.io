from flask import Flask, jsonify, request
from flask_cors import CORS
from amazon_paapi import AmazonApi 
import time
import json
import os
import requests
from pseudo_categories import PSEUDO_CATEGORIES  # Added import

app = Flask(__name__)
CORS(app)

USERS_FILE = "users_categories.json"
USERS_PRODUCTS_FILE = "users_products.json"
CONFIG_FILE = "config.json"
DEFAULT_CATEGORIES = ["283155", "172282"]
USERS_SETTINGS_FILE = "users_settings.json"

# region Helper Functions
def load_users_categories():
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {USERS_FILE}: {str(e)}")
            return {}
    return {}

def save_users_categories(users_data):
    try:
        with open(USERS_FILE, 'w') as f:
            json.dump(users_data, f, indent=4)
    except Exception as e:
        print(f"Error saving {USERS_FILE}: {str(e)}")

def get_user_categories(user_id):
    users_data = load_users_categories()
    if user_id not in users_data:
        users_data[user_id] = DEFAULT_CATEGORIES
        save_users_categories(users_data)
    return users_data.get(user_id, [])

def load_users_products():
    if os.path.exists(USERS_PRODUCTS_FILE):
        with open(USERS_PRODUCTS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_users_products(users_products):
    with open(USERS_PRODUCTS_FILE, 'w') as f:
        json.dump(users_products, f, indent=4)

def get_user_products(user_id):
    users_products = load_users_products()
    return users_products.get(user_id, [])

def load_config():
    default_config = {
        "amazon_uk": {
            "ACCESS_KEY": "",
            "SECRET_KEY": "",
            "ASSOCIATE_TAG": "",
            "COUNTRY": ""
        },
        "ebay_uk": {
            "APP_ID": ""
        },
        "awin": {
            "API_TOKEN": ""
        },
        "cj": {
            "API_KEY": "",
            "WEBSITE_ID": ""
        }
    }
    
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                loaded_config = json.load(f)
                # Merge loaded config with default config to ensure all fields exist
                for section in default_config:
                    if section in loaded_config:
                        default_config[section].update(loaded_config[section])
                    else:
                        loaded_config[section] = default_config[section]
                return loaded_config
        except Exception as e:
            print(f"Error loading {CONFIG_FILE}: {str(e)}")
            return default_config
    return default_config

# region Helper Functions

def save_config(config):
    # Ensure all expected fields are present, even if empty
    default_config = {
        "amazon_uk": {
            "ACCESS_KEY": "",
            "SECRET_KEY": "",
            "ASSOCIATE_TAG": "",
            "COUNTRY": ""
        },
        "ebay_uk": {
            "APP_ID": ""
        },
        "awin": {
            "API_TOKEN": ""
        },
        "cj": {
            "API_KEY": "",
            "WEBSITE_ID": ""
        }
    }
    
    # Update default config with provided values
    for section in config:
        if section in default_config:
            default_config[section].update(config[section])
    
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(default_config, f, indent=4)
    except Exception as e:
        print(f"Error saving {CONFIG_FILE}: {str(e)}")

def get_amazon_category_title(browse_node_id):
    config = load_config()
    if not all(config.get("amazon_uk", {}).values()):
        return None
    amazon = AmazonApi(config["amazon_uk"]["ACCESS_KEY"], config["amazon_uk"]["SECRET_KEY"],
                       config["amazon_uk"]["ASSOCIATE_TAG"], config["amazon_uk"]["COUNTRY"])
    try:
        browse_nodes = amazon.get_browse_nodes(
            browse_node_ids=[browse_node_id],
            resources=["BrowseNodes.DisplayName"]
        )
        if browse_nodes and browse_nodes.browse_nodes:
            return browse_nodes.browse_nodes[0].display_name
        return None
    except Exception as e:
        print(f"Error fetching category title for {browse_node_id}: {str(e)}")
        return None

def get_immediate_subcategories(parent_id):
    config = load_config()
    if not all(config.get("amazon_uk", {}).values()):
        return []
    amazon = AmazonApi(config["amazon_uk"]["ACCESS_KEY"], config["amazon_uk"]["SECRET_KEY"],
                       config["amazon_uk"]["ASSOCIATE_TAG"], config["amazon_uk"]["COUNTRY"])
    try:
        browse_nodes = amazon.get_browse_nodes(
            browse_node_ids=[parent_id],
            resources=["BrowseNodes.Children"]
        )
        if browse_nodes and browse_nodes.browse_nodes:
            return [{"id": node.browse_node_id, "name": node.display_name} for node in browse_nodes.browse_nodes[0].children]
        return []
    except Exception as e:
        print(f"Error fetching subcategories for {parent_id}: {str(e)}")
        return []

def filter_categories_with_products(category_ids, min_discount_percent):
    config = load_config()
    all_discounted_items = []
    for cat_id in category_ids:
        if all(config.get("amazon_uk", {}).values()):
            all_discounted_items.extend(search_amazon_uk_discounted(cat_id, min_discount_percent))
        if all(config.get("ebay_uk", {}).values()):
            all_discounted_items.extend(search_ebay_uk_discounted(cat_id, min_discount_percent))
        if config.get("awin", {}).get("API_TOKEN"):
            all_discounted_items.extend(search_awin_uk_discounted(cat_id, min_discount_percent))
        if all(config.get("cj", {}).values()):
            all_discounted_items.extend(search_cj_uk_discounted(cat_id, min_discount_percent))
    filtered_categories = []
    for cat_id in category_ids:
        if any(item for item in all_discounted_items if "BrowseNodeId" in item and item["BrowseNodeId"] == cat_id):
            category_title = get_amazon_category_title(cat_id) or cat_id
            filtered_categories.append({"id": cat_id, "name": category_title})
    return filtered_categories

def find_node(categories, target_id):
    """
    Recursively search for a node with the given target_id in a nested list of categories.
    
    Args:
        categories (list): List of category dictionaries with 'id', 'name', and optional 'subcategories'.
        target_id (str): The ID to search for.
    
    Returns:
        dict or None: The dictionary representing the node with the target_id, or None if not found.
    """
    for category in categories:
        # Check if the current category's ID matches the target
        if category['id'] == target_id:
            return category
        # If the category has subcategories, search them recursively
        if 'subcategories' in category:
            result = find_node(category['subcategories'], target_id)
            if result is not None:
                return result
    # If no match is found in this list or its subcategories, return None
    return None

def find_pseudo_subcategories(parent_id, categories):
    node = find_node(categories, parent_id)
    if node and 'subcategories' in node:
        return [{'id': subcat['id'], 'name': subcat['name']} for subcat in node['subcategories']]
    else:
        return []

def load_users_settings():
    if os.path.exists(USERS_SETTINGS_FILE):
        try:
            with open(USERS_SETTINGS_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {USERS_SETTINGS_FILE}: {str(e)}")
            return {}
    return {}

def save_users_settings(users_settings):
    try:
        with open(USERS_SETTINGS_FILE, 'w') as f:
            json.dump(users_settings, f, indent=4)
    except Exception as e:
        print(f"Error saving {USERS_SETTINGS_FILE}: {str(e)}")

def get_user_settings(user_id):
    users_settings = load_users_settings()
    return users_settings.get(user_id, {})

def validate_product(product):
    required_fields = {
        "id": str,
        "title": str,
        "product_url": str,
        "current_price": (int, float),
        "original_price": (int, float),
        "image_url": str,
        "QTY": int
    }
    for field, field_type in required_fields.items():
        # Check if field is missing or None
        if field not in product or product[field] is None:
            return False, f"Missing field: {field}"
        # Check field type
        if isinstance(field_type, tuple):
            if not isinstance(product[field], field_type):
                return False, f"Invalid type for {field}: expected {field_type}"
        else:
            if not isinstance(product[field], field_type):
                return False, f"Invalid type for {field}: expected {field_type}"
            # For strings, ensure not empty after stripping whitespace
            if field_type == str and not product[field].strip():
                return False, f"Empty string for {field}"
    return True, ""

# endregion Helper Functions

# region Detailed Fetch
def get_amazon_uk_full_details(asins):
    config = load_config()
    if not all(config.get("amazon_uk", {}).values()):
        return []
    amazon = AmazonApi(config["amazon_uk"]["ACCESS_KEY"], config["amazon_uk"]["SECRET_KEY"],
                       config["amazon_uk"]["ASSOCIATE_TAG"], config["amazon_uk"]["COUNTRY"])
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
                "source": "amazon_uk",
                "id": item.asin,
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
        print(f"Amazon UK Error: {str(e)}")
    return full_item_data

def get_ebay_uk_full_details(item_ids):
    config = load_config()
    if not all(config.get("ebay_uk", {}).values()):
        return []
    url = "https://api.ebay.com/buy/browse/v1/item"
    headers = {"Authorization": f"Bearer {config['ebay_uk']['APP_ID']}"}
    full_item_data = []
    for item_id in item_ids:
        try:
            params = {"item_id": item_id}
            response = requests.get(url, headers=headers, params=params)
            item = response.json()
            current_price = float(item["price"]["value"])
            original_price = float(item.get("originalPrice", {}).get("value", current_price))
            discount = ((original_price - current_price) / original_price) * 100 if original_price > current_price else 0
            item_data = {
                "source": "ebay_uk",
                "id": item["itemId"],
                "title": item["title"],
                "product_url": item["itemWebUrl"],
                "current_price": current_price,
                "savings": original_price - current_price if original_price > current_price else None,
                "original_price": original_price if original_price > current_price else None,
                "discount_percent": int(discount) if discount > 0 else None,
                "manufacturer": item.get("brand", None),
                "dimensions": None,
                "features": item.get("shortDescription", "").split(". ") if item.get("shortDescription") else [],
                "image_url": item["image"]["imageUrl"] if "image" in item else None
            }
            full_item_data.append(item_data)
            time.sleep(1)
        except Exception as e:
            print(f"eBay UK Error for {item_id}: {str(e)}")
    return full_item_data

def get_awin_uk_full_details(product_ids):
    config = load_config()
    if not config.get("awin", {}).get("API_TOKEN"):
        return []
    url = f"https://api.awin.com/publishers/{config['awin']['API_TOKEN']}/products"
    full_item_data = []
    for product_id in product_ids:
        try:
            params = {"productId": product_id, "region": "UK"}
            response = requests.get(url, params=params)
            product = response.json()["products"][0]
            current_price = float(product["price"]["amount"])
            original_price = float(product.get("originalPrice", current_price))
            discount = ((original_price - current_price) / original_price) * 100 if original_price > current_price else 0
            item_data = {
                "source": "awin_uk",
                "id": product["productId"],
                "title": product["name"],
                "product_url": product["url"],
                "current_price": current_price,
                "savings": original_price - current_price if original_price > current_price else None,
                "original_price": original_price if original_price > current_price else None,
                "discount_percent": int(discount) if discount > 0 else None,
                "manufacturer": product.get("brand", None),
                "dimensions": product.get("dimensions", None),
                "features": product.get("description", "").split(". ") if product.get("description") else [],
                "image_url": product.get("imageUrl", None)
            }
            full_item_data.append(item_data)
            time.sleep(1)
        except Exception as e:
            print(f"Awin UK Error for {product_id}: {str(e)}")
    return full_item_data

def get_cj_uk_full_details(skus):
    config = load_config()
    if not all(config.get("cj", {}).values()):
        return []
    url = "https://product-search.api.cj.com/v2/product-search"
    headers = {"Authorization": f"Bearer {config['cj']['API_KEY']}"}
    full_item_data = []
    for sku in skus:
        try:
            params = {
                "website-id": config["cj"]["WEBSITE_ID"],
                "sku": sku,
                "country": "UK"
            }
            response = requests.get(url, headers=headers, params=params)
            product = response.json()["products"][0]
            current_price = float(product["price"])
            original_price = float(product.get("salePrice", current_price))
            discount = ((original_price - current_price) / original_price) * 100 if original_price > current_price else 0
            item_data = {
                "source": "cj_uk",
                "id": product["sku"],
                "title": product["name"],
                "product_url": product["buyUrl"],
                "current_price": current_price,
                "savings": original_price - current_price if original_price > current_price else None,
                "original_price": original_price if original_price > current_price else None,
                "discount_percent": int(discount) if discount > 0 else None,
                "manufacturer": product.get("manufacturerName", None),
                "dimensions": product.get("dimensions", None),
                "features": product.get("description", "").split(". ") if product.get("description") else [],
                "image_url": product.get("imageUrl", None)
            }
            full_item_data.append(item_data)
            time.sleep(1)
        except Exception as e:
            print(f"CJ UK Error for {sku}: {str(e)}")
    return full_item_data
# endregion Detailed Fetch

# region Search
def search_amazon_uk_discounted(browse_node_id, min_discount_percent=20):
    config = load_config()
    if not all(config.get("amazon_uk", {}).values()):
        return []
    amazon = AmazonApi(config["amazon_uk"]["ACCESS_KEY"], config["amazon_uk"]["SECRET_KEY"],
                       config["amazon_uk"]["ASSOCIATE_TAG"], config["amazon_uk"]["COUNTRY"])
    asins = []
    try:
        search_params = {
            "BrowseNodeId": browse_node_id,
            "ItemCount": 10,
            "Resources": ["Offers.Listings.Price", "Offers.Summaries.HighestPrice"]
        }
        for page in range(1, 11):
            search_params["ItemPage"] = page
            search_result = amazon.search_items(**search_params)
            if not search_result or not search_result.items:
                break
            for item in search_result.items:
                if (item.offers and item.offers.listings and item.offers.listings[0].price and 
                    item.offers.listings[0].price.savings and 
                    item.offers.listings[0].price.savings.percentage >= min_discount_percent):
                    asins.append(item.asin)
            time.sleep(1)
        return get_amazon_uk_full_details(asins)
    except Exception as e:
        print(f"Amazon UK Search Error: {str(e)}")
        return []

def search_ebay_uk_discounted(browse_node_id, min_discount_percent=20):
    config = load_config()
    if not all(config.get("ebay_uk", {}).values()):
        return []
    category_title = get_amazon_category_title(browse_node_id)
    if not category_title:
        return []
    url = "https://api.ebay.com/buy/browse/v1/item_summary/search"
    headers = {"Authorization": f"Bearer {config['ebay_uk']['APP_ID']}"}
    params = {
        "q": category_title,
        "filter": "condition:NEW,availability:UK",
        "limit": "10",
        "sort": "-price"
    }
    item_ids = []
    try:
        response = requests.get(url, headers=headers, params=params)
        data = response.json()
        for item in data.get("itemSummaries", []):
            current_price = float(item["price"]["value"])
            original_price = float(item.get("originalPrice", {}).get("value", current_price))
            if original_price > current_price:
                discount = ((original_price - current_price) / original_price) * 100
                if discount >= min_discount_percent:
                    item_ids.append(item["itemId"])
        return get_ebay_uk_full_details(item_ids)
    except Exception as e:
        print(f"eBay UK Search Error: {str(e)}")
        return []

def search_awin_uk_discounted(browse_node_id, min_discount_percent=20):
    config = load_config()
    if not config.get("awin", {}).get("API_TOKEN"):
        return []
    category_title = get_amazon_category_title(browse_node_id)
    if not category_title:
        return []
    url = f"https://api.awin.com/publishers/{config['awin']['API_TOKEN']}/products"
    params = {
        "region": "UK",
        "search": category_title,
        "discount": "true"
    }
    product_ids = []
    try:
        response = requests.get(url, params=params)
        data = response.json()
        for product in data.get("products", []):
            current_price = float(product["price"]["amount"])
            original_price = float(product.get("originalPrice", current_price))
            if original_price > current_price:
                discount = ((original_price - current_price) / original_price) * 100
                if discount >= min_discount_percent:
                    product_ids.append(product["productId"])
        return get_awin_uk_full_details(product_ids)
    except Exception as e:
        print(f"Awin UK Search Error: {str(e)}")
        return []

def search_cj_uk_discounted(browse_node_id, min_discount_percent=20):
    config = load_config()
    if not all(config.get("cj", {}).values()):
        return []
    category_title = get_amazon_category_title(browse_node_id)
    if not category_title:
        return []
    url = "https://product-search.api.cj.com/v2/product-search"
    headers = {"Authorization": f"Bearer {config['cj']['API_KEY']}"}
    params = {
        "website-id": config["cj"]["WEBSITE_ID"],
        "keywords": category_title,
        "country": "UK",
        "sale-price": "true"
    }
    skus = []
    try:
        response = requests.get(url, headers=headers, params=params)
        data = response.json()
        for product in data.get("products", []):
            current_price = float(product["price"])
            original_price = float(product.get("salePrice", current_price))
            if original_price > current_price:
                discount = ((original_price - current_price) / original_price) * 100
                if discount >= min_discount_percent:
                    skus.append(product["sku"])
        return get_cj_uk_full_details(skus)
    except Exception as e:
        print(f"CJ UK Search Error: {str(e)}")
        return []
# endregion Search

# region Management Endpoints

# region /config
@app.route('/config', methods=['GET'])
def get_config():
    config = load_config()
    return jsonify({
        "status": "success",
        "count": len(config),
        "config": config
    })

@app.route('/config/<affiliate>', methods=['PATCH'])
def replace_config(affiliate):
    config = load_config()
    data = request.get_json()
    if not data or not isinstance(data, dict):
        return jsonify({"status": "error", "message": "Request body must contain a dictionary of credentials"}), 400
    config[affiliate] = data
    save_config(config)
    return jsonify({
        "status": "success",
        "message": f"Credentials for {affiliate} replaced",
        "credentials": config[affiliate]
    })

# endregion /config

# region /<USERid>/user
@app.route('/<USERid>/user', methods=['GET'])
def get_user_settings_endpoint(USERid):
    try:
        settings = get_user_settings(USERid)
        return jsonify({
            "status": "success",
            "contact_name": settings.get("contact_name", ""),
            "website_url": settings.get("website_url", ""),
            "email_address": settings.get("email_address", ""),
            "phone_number": settings.get("phone_number", "")
        })
    except Exception as e:
        print(f"Error in /<USERid>/user GET: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/<USERid>/user', methods=['PUT'])
def put_user_settings(USERid):
    if not request.json:
        return jsonify({"status": "error", "message": "Request body must contain settings"}), 400
    
    settings = request.json
    required_fields = ["contact_name", "website_url", "email_address", "phone_number"]
    if not all(field in settings for field in required_fields):
        return jsonify({"status": "error", "message": "Settings must include contact_name, website_url, email_address, phone_number"}), 400
    
    users_settings = load_users_settings()
    users_settings[USERid] = settings
    save_users_settings(users_settings)
    return jsonify({"status": "success", "message": f"Settings for user {USERid} replaced", "settings": settings})

@app.route('/<USERid>/user', methods=['PATCH'])
def patch_user_settings(USERid):
    if not request.json:
        return jsonify({"status": "error", "message": "Request body must contain settings"}), 400
    
    new_settings = request.json
    users_settings = load_users_settings()
    current_settings = users_settings.get(USERid, {})
    
    # Update only provided fields
    for key in new_settings:
        if key in ["contact_name", "website_url", "email_address", "phone_number"]:
            current_settings[key] = new_settings[key]
    
    users_settings[USERid] = current_settings
    save_users_settings(users_settings)
    return jsonify({"status": "success", "message": f"Settings for user {USERid} updated", "settings": current_settings})
# endregion /<USERid>/user

# region /<USERid>/categories
@app.route('/<USERid>/mycategories', methods=['GET'])
def get_user_categories_endpoint(USERid):
    try:
        categories = get_user_categories(USERid)
        return jsonify({
            "status": "success",
            "count": len(categories),
            "categories": categories
        })
    except Exception as e:
        print(f"Error in /<USERid>/mycategories for USERid {USERid}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to retrieve categories: {str(e)}"
        }), 500

@app.route('/<USERid>/mycategories', methods=['PUT'])
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

@app.route('/<USERid>/mycategories', methods=['PATCH'])
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

@app.route('/<USERid>/mycategories', methods=['DELETE'])
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

@app.route('/categories', methods=['GET'])
def get_all_categories():
    config = load_config()
    parent_id = request.args.get('parent_id')
    
    amazon_config = config.get("amazon_uk", {})
    # Check if all Amazon config fields are non-empty strings
    has_valid_amazon_config = all(
        isinstance(amazon_config.get(field, ""), str) and 
        len(amazon_config.get(field, "").strip()) > 0
        for field in ["ACCESS_KEY", "SECRET_KEY", "ASSOCIATE_TAG", "COUNTRY"]
    )

    if has_valid_amazon_config:
        # Amazon config exists and all fields are non-empty strings
        amazon = AmazonApi(
            amazon_config["ACCESS_KEY"],
            amazon_config["SECRET_KEY"],
            amazon_config["ASSOCIATE_TAG"],
            amazon_config["COUNTRY"]
        )
        try:
            if parent_id:
                # Fetch subcategories for the given parent_id
                browse_nodes = amazon.get_browse_nodes(
                    browse_node_ids=[parent_id],
                    resources=["BrowseNodes.Children"]
                )
                if browse_nodes and browse_nodes.browse_nodes and browse_nodes.browse_nodes[0].children:
                    categories = [
                        {"id": node.browse_node_id, "name": node.display_name}
                        for node in browse_nodes.browse_nodes[0].children
                    ]
                else:
                    categories = []
            else:
                # Fetch top-level categories
                browse_nodes = amazon.get_browse_nodes(
                    browse_node_ids=DEFAULT_CATEGORIES,
                    resources=["BrowseNodes.DisplayName"]
                )
                if browse_nodes and browse_nodes.browse_nodes:
                    categories = [
                        {"id": node.browse_node_id, "name": node.display_name}
                        for node in browse_nodes.browse_nodes
                    ]
                else:
                    categories = []
        except Exception as e:
            print(f"Error fetching Amazon categories: {str(e)}")
            categories = []
    else:
        # No valid Amazon config, use pseudo data
        if parent_id:
            # Find subcategories based on parent_id in pseudo data
            categories = find_pseudo_subcategories(parent_id, PSEUDO_CATEGORIES)
            if categories is None:
                categories = []  # Return empty if parent_id not found
        else:
            # Return top-level pseudo categories
            categories = [
                {"id": cat["id"], "name": cat["name"]}
                for cat in PSEUDO_CATEGORIES
            ]

    return jsonify({
        "status": "success",
        "count": len(categories),
        "categories": categories
    })

# endregion /<USERid>/categories

# region /<USERid>/products
@app.route('/<USERid>/products', methods=['GET'])
def get_user_product_list(USERid):
    products = get_user_products(USERid)
    return jsonify({
        "status": "success",
        "count": len(products),
        "products": products
    })

@app.route('/<USERid>/products', methods=['POST'])
def post_user_product(USERid):
    if not request.json or 'product' not in request.json:
        return jsonify({"status": "error", "message": "Request body must contain 'product' object"}), 400
    
    product = request.json['product']
    valid, message = validate_product(product)
    if not valid:
        return jsonify({"status": "error", "message": message}), 400
    
    # Proceed with adding the product (e.g., save to storage)
    product["source"] = "user_defined"
    users_products = load_users_products()
    if USERid not in users_products:
        users_products[USERid] = []
    
    if any(p["id"] == product["id"] for p in users_products[USERid]):
        return jsonify({"status": "error", "message": f"Product with id {product['id']} already exists"}), 409
    
    users_products[USERid].append(product)
    save_users_products(users_products)
    return jsonify({"status": "success", "message": f"Product added for user {USERid}", "product": product}), 201

@app.route('/<USERid>/products', methods=['PUT'])
def put_user_products(USERid):
    if not request.json or 'products' not in request.json:
        return jsonify({"status": "error", "message": "Request body must contain 'products' list"}), 400
    
    new_products = request.json['products']
    if not isinstance(new_products, list):
        return jsonify({"status": "error", "message": "'products' must be a list"}), 400
    
    for product in new_products:
        valid, message = validate_product(product)
        if not valid:
            return jsonify({"status": "error", "message": message}), 400
        product["source"] = "user_defined"
    
    # Replace the user's product list
    users_products = load_users_products()
    users_products[USERid] = new_products
    save_users_products(users_products)
    return jsonify({"status": "success", "message": f"Products for user {USERid} replaced", "products": new_products})

@app.route('/<USERid>/products', methods=['PATCH'])
def patch_user_products(USERid):
    if not request.json or 'products' not in request.json:
        return jsonify({"status": "error", "message": "Request body must contain 'products' list"}), 400
    
    new_products = request.json['products']
    if not isinstance(new_products, list):
        return jsonify({"status": "error", "message": "'products' must be a list"}), 400
    
    for product in new_products:
        valid, message = validate_product(product)
        if not valid:
            return jsonify({"status": "error", "message": message}), 400
        product["source"] = "user_defined"
    
    # Update the user's product list
    users_products = load_users_products()
    current_products = users_products.get(USERid, [])
    updated_products = [p for p in current_products if p["id"] not in {np["id"] for np in new_products}]
    updated_products.extend(new_products)
    users_products[USERid] = updated_products
    save_users_products(users_products)
    return jsonify({"status": "success", "message": f"Products for user {USERid} updated", "products": updated_products})

@app.route('/<USERid>/products', methods=['DELETE'])
def delete_user_product(USERid):
    product_id = request.args.get('product_id')
    if not product_id:
        return jsonify({"status": "error", "message": "Query parameter 'product_id' is required"}), 400
    
    users_products = load_users_products()
    if USERid in users_products:
        current_products = users_products[USERid]
        product_to_remove = next((p for p in current_products if p["id"] == product_id), None)
        if product_to_remove:
            current_products.remove(product_to_remove)
            users_products[USERid] = current_products
            save_users_products(users_products)
            return jsonify({"status": "success", "message": f"Product {product_id} removed for user {USERid}", "products": current_products})
        else:
            return jsonify({"status": "error", "message": f"Product {product_id} not found for user {USERid}"}), 404
    return jsonify({"status": "error", "message": f"User {USERid} not found"}), 404

@app.route('/<USERid>/products/<product_id>', methods=['GET'])
def reduce_product_quantity(USERid, product_id):
    # Get the qty parameter and ensure it’s an integer
    qty = request.args.get('qty', type=int)
    if qty is None:
        return jsonify({"status": "error", "message": "Query parameter 'qty' is required and must be an integer"}), 400
    
    # Ensure qty is negative as per the requirement
    if qty >= 0:
        return jsonify({"status": "error", "message": "Query parameter 'qty' must be a negative integer"}), 400
    
    # Load the user’s product data
    users_products = load_users_products()
    if USERid not in users_products:
        return jsonify({"status": "error", "message": f"User {USERid} not found"}), 404
    
    # Find the product for the user
    current_products = users_products[USERid]
    product_to_update = next((p for p in current_products if p["id"] == product_id), None)
    if not product_to_update:
        return jsonify({"status": "error", "message": f"Product {product_id} not found for user {USERid}"}), 404
    
    # Reduce the quantity by adding the negative qty, ensuring it doesn’t go below 0
    current_qty = product_to_update["QTY"]
    new_qty = max(0, current_qty + qty)
    product_to_update["QTY"] = new_qty
    
    # Save the updated products
    users_products[USERid] = current_products
    save_users_products(users_products)
    
    # Return success response
    return jsonify({
        "status": "success",
        "message": f"Quantity reduced for product {product_id} for user {USERid}",
        "product": product_to_update
    })

# endregion /<USERid>/products

# endregion Management Endpoints

# region Velo Public Endpoints
@app.route('/<USERid>/discounted-products', methods=['GET'])
def get_discounted_products(USERid):
    category_id = request.args.get('category_id')
    min_discount = request.args.get('min_discount', default=20, type=int)
    root_category_ids = get_user_categories(USERid)
    all_discounted_items = []

    search_categories = [category_id] if category_id else root_category_ids
    config = load_config()

    for cat_id in search_categories:
        if all(config.get("amazon_uk", {}).values()):
            all_discounted_items.extend(search_amazon_uk_discounted(cat_id, min_discount))
        if all(config.get("ebay_uk", {}).values()):
            all_discounted_items.extend(search_ebay_uk_discounted(cat_id, min_discount))
        if config.get("awin", {}).get("API_TOKEN"):
            all_discounted_items.extend(search_awin_uk_discounted(cat_id, min_discount))
        if all(config.get("cj", {}).values()):
            all_discounted_items.extend(search_cj_uk_discounted(cat_id, min_discount))

    return jsonify({
        "status": "success",
        "count": len(all_discounted_items),
        "products": all_discounted_items,
        "min_discount": min_discount
    })

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

@app.route('/club-products', methods=['GET'])
def get_club_products():
    users_products = load_users_products()
    all_club_products = []
    for user_id, products in users_products.items():
        for product in products:
            if product["QTY"] > 0:
                all_club_products.append(product)
    
    return jsonify({
        "status": "success",
        "count": len(all_club_products),
        "products": all_club_products
    })
# endregion Velo Endpoints

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)