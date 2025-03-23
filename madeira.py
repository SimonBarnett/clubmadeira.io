from flask import Flask, jsonify, request, render_template, redirect, url_for, abort, render_template_string
from flask_cors import CORS
from amazon_paapi import AmazonApi 
import time
import json
import os
import requests
import jwt
from pseudo_categories import PSEUDO_CATEGORIES
import random
import string
import hashlib
from flask import Flask, request, jsonify
import bcrypt
import json
import datetime, re
import logging
import os
import markdown

app = Flask(__name__)
# Enable CORS with verbose logging
CORS(app, resources={
    r"/*": {  # Wildcard to match all routes
        "origins": "http://walrus:8282",
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
}, supports_credentials=False)

SECRET_KEY = "itsananagramjanet"  # Replace with a secure key
USERS_FILE = "users_categories.json"
USERS_PRODUCTS_FILE = "users_products.json"
CONFIG_FILE = "config.json"
DEFAULT_CATEGORIES = ["283155", "172282"]
USERS_SETTINGS_FILE = "users_settings.json"
# Define the base directory for site requests
SITE_REQUEST_DIR = os.path.join(os.path.dirname(__file__), "siterequest")

# Set up logging
logging.basicConfig(
    filename='app.log',  # Logfile will be 'app.log' in the current working directory
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s %(message)s'
)
logger = logging.getLogger(__name__)

# Ensure the siterequest directory exists
if not os.path.exists(SITE_REQUEST_DIR):
    os.makedirs(SITE_REQUEST_DIR)

# region Helper Functions
def generate_code():
    # Define the character set: 0-9 and A-Z (36 possible characters)
    charset = string.digits + string.ascii_uppercase
    
    # Generate a random 7-character string
    code = ''.join(random.choice(charset) for _ in range(7))
    
    # Calculate checksum
    total = sum(charset.index(c) for c in code)
    checksum = charset[total % 36]
    
    # Return 8-character code (7 digits + checksum)
    return code + checksum

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
    """Load Wix products for all users using their wixClientId from users_settings.json."""
    users_settings = load_users_settings()
    users_products = {}
    
    for user_id, settings in users_settings.items():
        wix_client_id = settings.get("wixClientId")
        if not wix_client_id:
            print(f"No wixClientId found for user {user_id}")
            users_products[user_id] = []
            continue

        token_url = "https://www.wixapis.com/oauth2/token"
        payload = {
            "clientId": wix_client_id,
            "grantType": "anonymous"
        }
        headers = {"Content-Type": "application/json"}
        try:
            response = requests.post(token_url, json=payload, headers=headers)
            if response.status_code != 200:
                print(f"Error getting token for user {user_id}: {response.status_code} - {response.text}")
                users_products[user_id] = []
                continue
            token_data = response.json()
            access_token = token_data["access_token"]
            print(f"Access Token for user {user_id}: {access_token}")
        except Exception as e:
            print(f"Token fetch error for user {user_id}: {str(e)}")
            users_products[user_id] = []
            continue

        collections_url = "https://www.wixapis.com/stores-reader/v1/collections/query"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }

        def fetch_collections(limit=10, offset=0):
            query_payload = {
                "query": {
                    "paging": {"limit": limit, "offset": offset}
                },
                "includeNumberOfProducts": True
            }
            response = requests.post(collections_url, headers=headers, json=query_payload)
            if response.status_code != 200:
                print(f"Error fetching collections for user {user_id}: {response.status_code} - {response.text}")
                return None
            return response.json()

        products_url = "https://www.wixapis.com/stores/v1/products/query"

        def fetch_products_for_collection(collection_id, limit=10, offset=0):
            filter_str = json.dumps({"collections.id": {"$hasSome": [collection_id]}})
            query_payload = {
                "query": {
                    "filter": filter_str,
                    "paging": {"limit": limit, "offset": offset}
                }
            }
            response = requests.post(products_url, headers=headers, json=query_payload)
            if response.status_code != 200:
                print(f"Error fetching products for collection {collection_id} for user {user_id}: {response.status_code} - {response.text}")
                return None
            return response.json()

        all_collections = []
        limit = 10
        offset = 0

        while True:
            result = fetch_collections(limit=limit, offset=offset)
            if not result or "collections" not in result or not result["collections"]:
                break

            collections = result["collections"]
            filtered_collections = [
                {
                    "id": col["id"],
                    "name": col["name"],
                    "numberOfProducts": col["numberOfProducts"],
                    "products": []
                }
                for col in collections
                if not col["id"].startswith("00000000")
            ]
            all_collections.extend(filtered_collections)
            print(f"Fetched {len(collections)} collections, kept {len(filtered_collections)} for user {user_id} (offset {offset} to {offset + limit - 1})")
            offset += limit
            if len(collections) < limit:
                break

        all_products = []
        for collection in all_collections:
            collection_id = collection["id"]
            collection_name = collection["name"]
            offset = 0

            while True:
                result = fetch_products_for_collection(collection_id, limit=limit, offset=offset)
                if not result or "products" not in result or not result["products"]:
                    break

                products = result["products"]
                for product in products:
                    current_price = float(product.get("price", {}).get("formatted", {}).get("price", "0").replace("$", "").replace("£", "").replace(",", "") or 0.0)
                    original_price = float(product.get("discountedPrice", {}).get("formatted", {}).get("price", str(current_price)).replace("$", "").replace("£", "").replace(",", "") or current_price)
                    discount = ((original_price - current_price) / original_price) * 100 if original_price > current_price else 0
                    base_url = (
                        product.get("productPageUrl", {}).get("base", "").rstrip("/") + "/" +
                        product.get("productPageUrl", {}).get("path", "").lstrip("/")
                    )
                    product_url = f"{base_url}?referer={user_id}"
                    all_products.append({
                        "source": user_id,
                        "id": product.get("id", ""),
                        "title": product.get("name", ""),
                        "product_url": product_url,
                        "current_price": current_price,
                        "original_price": original_price,
                        "discount_percent": round(discount, 2),
                        "image_url": product.get("media", {}).get("mainMedia", {}).get("thumbnail", {}).get("url", ""),
                        "qty": (
                            int(product.get("stock", {}).get("quantity", 0))
                            if product.get("stock", {}).get("trackQuantity", False)
                            else -1
                        ),
                        "category": collection_name,
                        "user_id": user_id
                    })
                print(f"Fetched {len(products)} products for collection {collection_name} for user {user_id} (offset {offset} to {offset + limit - 1})")
                offset += limit
                if len(products) < limit:
                    break

        users_products[user_id] = all_products
        print(f"Total products fetched for user {user_id}: {len(all_products)}")

    return users_products

def save_users_products(users_products):
    with open(USERS_PRODUCTS_FILE, 'w') as f:
        json.dump(users_products, f, indent=4)

def get_user_products(user_id):
    users_products = load_users_products()
    return users_products.get(user_id, [])

def load_config():
    """
    Load the configuration from config.json, merging with default values.
    If the file doesn't exist or is invalid, return the default config.
    """
    # Define the default configuration with all expected affiliates
    default_config = {
        "amazon_uk": {"ACCESS_KEY": "", "SECRET_KEY": "", "ASSOCIATE_TAG": "", "COUNTRY": ""},
        "ebay_uk": {"APP_ID": ""},
        "awin": {"API_TOKEN": ""},
        "cj": {"API_KEY": "", "WEBSITE_ID": ""},
        "textmagic": {"USERNAME": "", "API_KEY": ""},
        "tiny": {"API_KEY": ""}
    }
    
    # If config file doesn't exist, return the default config
    if not os.path.exists(CONFIG_FILE):
        return default_config

    try:
        with open(CONFIG_FILE, 'r') as f:
            loaded_config = json.load(f)
        
        # Ensure loaded_config is a dictionary
        if not isinstance(loaded_config, dict):
            print(f"Error: {CONFIG_FILE} does not contain a valid JSON object. Using default config.")
            return default_config

        # Start with the default config as the base
        result_config = default_config.copy()
        
        # Update with loaded config, preserving all existing data
        for affiliate in loaded_config:
            if affiliate in result_config:
                # For known affiliates, update only the expected keys
                result_config[affiliate].update(loaded_config[affiliate])
            else:
                # For unknown affiliates, add them as-is
                result_config[affiliate] = loaded_config[affiliate]

        return result_config
    
    except json.JSONDecodeError as e:
        print(f"Error decoding {CONFIG_FILE}: {str(e)}. Returning default config.")
        return default_config
    except Exception as e:
        print(f"Unexpected error loading {CONFIG_FILE}: {str(e)}. Returning default config.")
        return default_config

def save_config(config):
    """
    Save the provided configuration to config.json without modifying its structure.
    """
    try:
        # Ensure the config is a dictionary
        if not isinstance(config, dict):
            raise ValueError("Config must be a dictionary")

        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=4)
        print(f"Config saved successfully to {CONFIG_FILE}")
    
    except IOError as e:
        print(f"Error saving {CONFIG_FILE}: {str(e)}")
        raise
    except ValueError as e:
        print(f"Error: {str(e)}")
        raise
    except Exception as e:
        print(f"Unexpected error saving {CONFIG_FILE}: {str(e)}")
        raise

def get_amazon_category_title(browse_node_id):
    config = load_config()
    if all(config.get("amazon_uk", {}).values()):
        amazon = AmazonApi(config["amazon_uk"]["ACCESS_KEY"], config["amazon_uk"]["SECRET_KEY"],
                           config["amazon_uk"]["ASSOCIATE_TAG"], config["amazon_uk"]["COUNTRY"])
        try:
            browse_nodes = amazon.get_browse_nodes(
                browse_node_ids=[browse_node_id],
                resources=["BrowseNodes.DisplayName"]
            )
            if browse_nodes and browse_nodes.browse_nodes:
                return browse_nodes.browse_nodes[0].display_name
        except Exception as e:
            print(f"Error fetching category title for {browse_node_id}: {str(e)}")
    def find_category_recursive(categories, target_id):
        for category in categories:
            if category.get("id") == target_id:
                return category.get("name")
            if "subcategories" in category:
                result = find_category_recursive(category["subcategories"], target_id)
                if result is not None:
                    return result
    return find_category_recursive(PSEUDO_CATEGORIES, browse_node_id)

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
    for category in categories:
        if category['id'] == target_id:
            return category
        if 'subcategories' in category:
            result = find_node(category['subcategories'], target_id)
            if result is not None:
                return result
    return None

def find_pseudo_subcategories(parent_id, categories):
    node = find_node(categories, parent_id)
    if node and 'subcategories' in node:
        return [{'id': subcat['id'], 'name': subcat['name']} for subcat in node['subcategories']]
    return []

def load_users_settings():
    if os.path.exists(USERS_SETTINGS_FILE):
        try:
            with open(USERS_SETTINGS_FILE, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            raise Exception(f"Invalid JSON in {USERS_SETTINGS_FILE}: {str(e)}")
        except Exception as e:
            raise Exception(f"Error loading {USERS_SETTINGS_FILE}: {str(e)}")
    return {}

def save_users_settings(users_settings):
    try:
        with open(USERS_SETTINGS_FILE, 'w') as f:
            json.dump(users_settings, f, indent=4)
    except IOError as e:
        raise Exception(f"Failed to write to {USERS_SETTINGS_FILE}: {str(e)}")
    except Exception as e:
        raise Exception(f"Unexpected error saving {USERS_SETTINGS_FILE}: {str(e)}")
    
def get_user_settings(user_id):
    users_settings = load_users_settings()
    return users_settings.get(user_id, {})

def load_site_request(user_id):
    """Load site request data from <user_id> file in /siterequest folder."""
    file_path = os.path.join(SITE_REQUEST_DIR, user_id)
    logger.debug(f"Attempting to load site request for user {user_id} from {file_path}")
    
    if os.path.exists(file_path):
        logger.debug(f"File exists: {file_path}")
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                logger.debug(f"Successfully loaded data for user {user_id}: {json.dumps(data, indent=2)}")
                return data
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error for user {user_id} at {file_path}: {str(e)}")
            return {}
        except IOError as e:
            logger.error(f"IO error loading file for user {user_id} at {file_path}: {str(e)}")
            return {}
    else:
        logger.debug(f"No file found for user {user_id} at {file_path}")
        return {}

def save_site_request(user_id, site_request_data):
    """Save site request data to <user_id> file in /siterequest folder."""
    file_path = os.path.join(SITE_REQUEST_DIR, user_id)
    try:
        with open(file_path, 'w') as f:
            json.dump(site_request_data, f, indent=4)
    except IOError as e:
        raise Exception(f"Failed to save site request for user {user_id}: {str(e)}")

# endregion Helper Functions

# region Detailed Fetch
def get_amazon_uk_full_details(asins, category):
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
            current_price = item.offers.listings[0].price.amount if item.offers and item.offers.listings else None
            if item.offers and item.offers.listings and item.offers.listings[0].price.savings:
                savings = item.offers.listings[0].price.savings.amount
                original_price = current_price + savings
                discount_percent = float(item.offers.listings[0].price.savings.percentage)
            else:
                original_price = current_price
                discount_percent = 0.0
            item_data = {
                "source": "amazon_uk",
                "id": item.asin,
                "title": item.item_info.title.display_value if item.item_info.title else None,
                "product_url": item.detail_page_url,
                "current_price": current_price,
                "original_price": original_price,
                "discount_percent": discount_percent,
                "image_url": item.images.primary.large.url if item.images and item.images.primary else None,
                "category": category,
                "manufacturer": item.item_info.by_line_info.manufacturer.display_value if item.item_info.by_line_info and item.item_info.by_line_info.manufacturer else None,
                "dimensions": item.item_info.product_info.item_dimensions.display_value if item.item_info.product_info and item.item_info.product_info.item_dimensions else None,
                "features": item.item_info.features.display_values if item.item_info.features else []
            }
            full_item_data.append(item_data)
        time.sleep(1)
    except Exception as e:
        print(f"Amazon UK Error: {str(e)}")
    return full_item_data

def get_ebay_uk_full_details(item_ids, category):
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
            original_price_value = item.get("originalPrice", {}).get("value", current_price)
            original_price = float(original_price_value)
            discount = ((original_price - current_price) / original_price) * 100 if original_price > current_price else 0.0
            item_data = {
                "source": "ebay_uk",
                "id": item["itemId"],
                "title": item["title"],
                "product_url": item["itemWebUrl"],
                "current_price": current_price,
                "original_price": original_price,
                "discount_percent": round(discount, 2),
                "image_url": item["image"]["imageUrl"] if "image" in item else None,
                "category": category,
                "manufacturer": item.get("brand", None),
                "features": item.get("shortDescription", "").split(". ") if item.get("shortDescription") else []
            }
            full_item_data.append(item_data)
            time.sleep(1)
        except Exception as e:
            print(f"eBay UK Error for {item_id}: {str(e)}")
    return full_item_data

def get_awin_uk_full_details(product_ids, category):
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
            discount = ((original_price - current_price) / original_price) * 100 if original_price > current_price else 0.0
            item_data = {
                "source": "awin_uk",
                "id": product["productId"],
                "title": product["name"],
                "product_url": product["url"],
                "current_price": current_price,
                "original_price": original_price,
                "discount_percent": round(discount, 2),
                "image_url": product.get("imageUrl", None),
                "category": category,
                "manufacturer": product.get("brand", None),
                "dimensions": product.get("dimensions", None),
                "features": product.get("description", "").split(". ") if product.get("description") else []
            }
            full_item_data.append(item_data)
            time.sleep(1)
        except Exception as e:
            print(f"Awin UK Error for {product_id}: {str(e)}")
    return full_item_data

def get_cj_uk_full_details(skus, category):
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
            discount = ((original_price - current_price) / original_price) * 100 if original_price > current_price else 0.0
            item_data = {
                "source": "cj_uk",
                "id": product["sku"],
                "title": product["name"],
                "product_url": product["buyUrl"],
                "current_price": current_price,
                "original_price": original_price,
                "discount_percent": round(discount, 2),
                "image_url": product.get("imageUrl", None),
                "category": category,
                "manufacturer": product.get("manufacturerName", None),
                "dimensions": product.get("dimensions", None),
                "features": product.get("description", "").split(". ") if product.get("description") else []
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
    category_title = get_amazon_category_title(browse_node_id)
    if not category_title:
        return []
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
        return get_amazon_uk_full_details(asins, category=category_title)
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
        return get_ebay_uk_full_details(item_ids, category=category_title)
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
        return get_awin_uk_full_details(product_ids, category=category_title)
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
        return get_cj_uk_full_details(skus, category=category_title)
    except Exception as e:
        print(f"CJ UK Search Error: {str(e)}")
        return []

def search_wix_discounted(browse_node_id, min_discount_percent=20):
    """Search for discounted Wix products across all users matching browse_node_id."""
    users_settings = load_users_settings()
    all_discounted_products = []
    
    category_title = get_amazon_category_title(browse_node_id)
    if not category_title:
        print(f"No category title found for browse_node_id {browse_node_id}")
        return []

    for user_id, settings in users_settings.items():
        wix_client_id = settings.get("wixClientId")
        if not wix_client_id:
            print(f"No wixClientId found for user {user_id}")
            continue

        token_url = "https://www.wixapis.com/oauth2/token"
        payload = {
            "clientId": wix_client_id,
            "grantType": "anonymous"
        }
        headers = {"Content-Type": "application/json"}
        try:
            response = requests.post(token_url, json=payload, headers=headers)
            if response.status_code != 200:
                print(f"Error getting token for user {user_id}: {response.status_code} - {response.text}")
                continue
            token_data = response.json()
            access_token = token_data["access_token"]
            print(f"Access Token for user {user_id}: {access_token}")
        except Exception as e:
            print(f"Token fetch error for user {user_id}: {str(e)}")
            continue

        collections_url = "https://www.wixapis.com/stores-reader/v1/collections/query"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }

        def fetch_collections(limit=10, offset=0):
            query_payload = {
                "query": {
                    "paging": {"limit": limit, "offset": offset}
                },
                "includeNumberOfProducts": True
            }
            response = requests.post(collections_url, headers=headers, json=query_payload)
            if response.status_code != 200:
                print(f"Error fetching collections for user {user_id}: {response.status_code} - {response.text}")
                return None
            return response.json()

        products_url = "https://www.wixapis.com/stores/v1/products/query"

        def fetch_products_for_collection(collection_id, limit=10, offset=0):
            filter_str = json.dumps({"collections.id": {"$hasSome": [collection_id]}})
            query_payload = {
                "query": {
                    "filter": filter_str,
                    "paging": {"limit": limit, "offset": offset}
                }
            }
            response = requests.post(products_url, headers=headers, json=query_payload)
            if response.status_code != 200:
                print(f"Error fetching products for collection {collection_id} for user {user_id}: {response.status_code} - {response.text}")
                return None
            return response.json()

        limit = 10
        offset = 0
        matching_collection = None

        while True:
            result = fetch_collections(limit=limit, offset=offset)
            if not result or "collections" not in result or not result["collections"]:
                break

            collections = result["collections"]
            for col in collections:
                if col["name"].lower() == category_title.lower() and not col["id"].startswith("00000000"):
                    matching_collection = col
                    break
            if matching_collection:
                break

            offset += limit
            if len(collections) < limit:
                break

        if not matching_collection:
            print(f"No matching collection found for category '{category_title}' for user {user_id}")
            continue

        collection_id = matching_collection["id"]
        offset = 0
        discounted_products = []

        while True:
            result = fetch_products_for_collection(collection_id, limit=limit, offset=offset)
            if not result or "products" not in result or not result["products"]:
                break

            products = result["products"]
            for product in products:
                current_price = float(product.get("price", {}).get("formatted", {}).get("price", "0").replace("$", "").replace("£", "").replace(",", "") or 0.0)
                original_price = float(product.get("discountedPrice", {}).get("formatted", {}).get("price", str(current_price)).replace("$", "").replace("£", "").replace(",", "") or current_price)
                if original_price > current_price:
                    discount = ((original_price - current_price) / original_price) * 100
                    if discount >= min_discount_percent:
                        base_url = (
                            product.get("productPageUrl", {}).get("base", "").rstrip("/") + "/" +
                            product.get("productPageUrl", {}).get("path", "").lstrip("/")
                        )
                        product_url = f"{base_url}?referer={user_id}"
                        discounted_products.append({
                            "source": user_id,
                            "id": product.get("id", ""),
                            "title": product.get("name", ""),
                            "product_url": product_url,
                            "current_price": current_price,
                            "original_price": original_price,
                            "discount_percent": round(discount, 2),
                            "image_url": product.get("media", {}).get("mainMedia", {}).get("thumbnail", {}).get("url", ""),
                            "qty": (
                                int(product.get("stock", {}).get("quantity", 0))
                                if product.get("stock", {}).get("trackQuantity", False)
                                else -1
                            ),
                            "category": matching_collection["name"],
                            "user_id": user_id
                        })

            offset += limit
            if len(products) < limit:
                break

        all_discounted_products.extend(discounted_products)
        print(f"Found {len(discounted_products)} discounted products for user {user_id} in category '{category_title}'")

    return all_discounted_products

def search_amazon_uk_all(browse_node_id):
    config = load_config()
    if not all(config.get("amazon_uk", {}).values()):
        return []
    amazon = AmazonApi(config["amazon_uk"]["ACCESS_KEY"], config["amazon_uk"]["SECRET_KEY"],
                       config["amazon_uk"]["ASSOCIATE_TAG"], config["amazon_uk"]["COUNTRY"])
    asins = []
    category_title = get_amazon_category_title(browse_node_id)
    if not category_title:
        return []
    try:
        search_params = {
            "BrowseNodeId": browse_node_id,
            "ItemCount": 10,
            "Resources": ["ItemInfo.Title", "Offers.Listings.Price", "Images.Primary.Large", "DetailPageURL"]
        }
        for page in range(1, 11):
            search_params["ItemPage"] = page
            search_result = amazon.search_items(**search_params)
            if not search_result or not search_result.items:
                break
            for item in search_result.items:
                asins.append(item.asin)
            time.sleep(1)
        return get_amazon_uk_full_details(asins, category=category_title)
    except Exception as e:
        print(f"Amazon UK Search Error: {str(e)}")
        return []

def search_ebay_uk_all(browse_node_id):
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
        "limit": "10"
    }
    item_ids = []
    try:
        response = requests.get(url, headers=headers, params=params)
        data = response.json()
        for item in data.get("itemSummaries", []):
            item_ids.append(item["itemId"])
        return get_ebay_uk_full_details(item_ids, category=category_title)
    except Exception as e:
        print(f"eBay UK Search Error: {str(e)}")
        return []

def search_awin_uk_all(browse_node_id):
    config = load_config()
    if not config.get("awin", {}).get("API_TOKEN"):
        return []
    category_title = get_amazon_category_title(browse_node_id)
    if not category_title:
        return []
    url = f"https://api.awin.com/publishers/{config['awin']['API_TOKEN']}/products"
    params = {
        "region": "UK",
        "search": category_title
    }
    product_ids = []
    try:
        response = requests.get(url, params=params)
        data = response.json()
        for product in data.get("products", []):
            product_ids.append(product["productId"])
        return get_awin_uk_full_details(product_ids, category=category_title)
    except Exception as e:
        print(f"Awin UK Search Error: {str(e)}")
        return []

def search_cj_uk_all(browse_node_id):
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
        "country": "UK"
    }
    skus = []
    try:
        response = requests.get(url, headers=headers, params=params)
        data = response.json()
        for product in data.get("products", []):
            skus.append(product["sku"])
        return get_cj_uk_full_details(skus, category=category_title)
    except Exception as e:
        print(f"CJ UK Search Error: {str(e)}")
        return []

def search_wix_all(browse_node_id):
    """Search for all Wix products across all users matching browse_node_id."""
    users_settings = load_users_settings()
    all_products = []
    
    category_title = get_amazon_category_title(browse_node_id)
    if not category_title:
        print(f"No category title found for browse_node_id {browse_node_id}")
        return []

    for user_id, settings in users_settings.items():
        wix_client_id = settings.get("wixClientId")
        if not wix_client_id:
            print(f"No wixClientId found for user {user_id}")
            continue

        token_url = "https://www.wixapis.com/oauth2/token"
        payload = {
            "clientId": wix_client_id,
            "grantType": "anonymous"
        }
        headers = {"Content-Type": "application/json"}
        try:
            response = requests.post(token_url, json=payload, headers=headers)
            if response.status_code != 200:
                print(f"Error getting token for user {user_id}: {response.status_code} - {response.text}")
                continue
            token_data = response.json()
            access_token = token_data["access_token"]
            print(f"Access Token for user {user_id}: {access_token}")
        except Exception as e:
            print(f"Token fetch error for user {user_id}: {str(e)}")
            continue

        collections_url = "https://www.wixapis.com/stores-reader/v1/collections/query"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }

        def fetch_collections(limit=10, offset=0):
            query_payload = {
                "query": {
                    "paging": {"limit": limit, "offset": offset}
                },
                "includeNumberOfProducts": True
            }
            response = requests.post(collections_url, headers=headers, json=query_payload)
            if response.status_code != 200:
                print(f"Error fetching collections for user {user_id}: {response.status_code} - {response.text}")
                return None
            return response.json()

        products_url = "https://www.wixapis.com/stores/v1/products/query"

        def fetch_products_for_collection(collection_id, limit=10, offset=0):
            filter_str = json.dumps({"collections.id": {"$hasSome": [collection_id]}})
            query_payload = {
                "query": {
                    "filter": filter_str,
                    "paging": {"limit": limit, "offset": offset}
                }
            }
            response = requests.post(products_url, headers=headers, json=query_payload)
            if response.status_code != 200:
                print(f"Error fetching products for collection {collection_id} for user {user_id}: {response.status_code} - {response.text}")
                return None
            return response.json()

        limit = 10
        offset = 0
        matching_collection = None

        while True:
            result = fetch_collections(limit=limit, offset=offset)
            if not result or "collections" not in result or not result["collections"]:
                break

            collections = result["collections"]
            for col in collections:
                if col["name"].lower() == category_title.lower() and not col["id"].startswith("00000000"):
                    matching_collection = col
                    break
            if matching_collection:
                break

            offset += limit
            if len(collections) < limit:
                break

        if not matching_collection:
            print(f"No matching collection found for category '{category_title}' for user {user_id}")
            continue

        collection_id = matching_collection["id"]
        offset = 0
        category_products = []

        while True:
            result = fetch_products_for_collection(collection_id, limit=limit, offset=offset)
            if not result or "products" not in result or not result["products"]:
                break

            products = result["products"]
            for product in products:
                current_price = float(product.get("price", {}).get("formatted", {}).get("price", "0").replace("$", "").replace("£", "").replace(",", "") or 0.0)
                original_price = float(product.get("discountedPrice", {}).get("formatted", {}).get("price", str(current_price)).replace("$", "").replace("£", "").replace(",", "") or current_price)
                discount = ((original_price - current_price) / original_price) * 100 if original_price > current_price else 0.0
                base_url = (
                    product.get("productPageUrl", {}).get("base", "").rstrip("/") + "/" +
                    product.get("productPageUrl", {}).get("path", "").lstrip("/")
                )
                product_url = f"{base_url}?referer={user_id}"
                category_products.append({
                    "source": user_id,
                    "id": product.get("id", ""),
                    "title": product.get("name", ""),
                    "product_url": product_url,
                    "current_price": current_price,
                    "original_price": original_price,
                    "discount_percent": round(discount, 2),
                    "image_url": product.get("media", {}).get("mainMedia", {}).get("thumbnail", {}).get("url", ""),
                    "qty": (
                        int(product.get("stock", {}).get("quantity", 0))
                        if product.get("stock", {}).get("trackQuantity", False)
                        else -1
                    ),
                    "category": matching_collection["name"],
                    "user_id": user_id
                })

            offset += limit
            if len(products) < limit:
                break

        all_products.extend(category_products)
        print(f"Found {len(category_products)} products for user {user_id} in category '{category_title}'")

    return all_products
# endregion Search

# region Management Endpoints

# GET /users - Retrieve list of all users
@app.route('/users', methods=['GET'])
def get_users():
    users_settings = load_users_settings()
    user_list = [
        {
            "USERid": user_id,
            "email_address": user["email_address"],
            "contact_name": user["contact_name"]
        }
        for user_id, user in users_settings.items()
    ]
    return jsonify({"status": "success", "users": user_list}), 200

# GET /users/<user_id> - Retrieve specific user details
@app.route('/users/<user_id>', methods=['GET'])
def get_user(user_id):
    users_settings = load_users_settings()
    if user_id not in users_settings:
        return jsonify({"status": "error", "message": "User not found"}), 404
    user = users_settings[user_id]
    user_data = {
        "USERid": user_id,
        "email_address": user["email_address"],
        "contact_name": user["contact_name"],
        "permissions": user["permissions"],
        "website_url": user.get("website_url", ""),
        "wixClientId": user.get("wixClientId", ""),
        "referrals": user.get("referrals", {"visits": [], "orders": []})
    }
    return jsonify({"status": "success", "user": user_data}), 200

# GET /permissions/<user_id> - Retrieve permissions for a specific user
@app.route('/permissions/<user_id>', methods=['GET'])
def get_permissions(user_id):
    users_settings = load_users_settings()
    if user_id not in users_settings:
        return jsonify({"status": "error", "message": "User not found"}), 404
    permissions = users_settings[user_id]['permissions']
    return jsonify({"status": "success", "permissions": permissions}), 200

# POST /permissions/<user_id> - Add a permission to a specific user
@app.route('/permissions/<user_id>', methods=['POST'])
def add_permission(user_id):
    data = request.get_json()
    if 'permission' not in data:
        return jsonify({"status": "error", "message": "Permission field is required"}), 400
    permission = data['permission']
    users_settings = load_users_settings()
    if user_id not in users_settings:
        return jsonify({"status": "error", "message": "User not found"}), 404
    if permission in users_settings[user_id]['permissions']:
        return jsonify({"status": "error", "message": "Permission already exists"}), 400
    users_settings[user_id]['permissions'].append(permission)
    save_users_settings(users_settings)
    return jsonify({"status": "success", "message": "Permission added"}), 200

# DELETE /permissions/<user_id> - Remove a permission from a specific user
@app.route('/permissions/<user_id>', methods=['DELETE'])
def remove_permission(user_id):
    data = request.get_json()
    if 'permission' not in data:
        return jsonify({"status": "error", "message": "Permission field is required"}), 400
    permission = data['permission']
    users_settings = load_users_settings()
    if user_id not in users_settings:
        return jsonify({"status": "error", "message": "User not found"}), 404
    if permission not in users_settings[user_id]['permissions']:
        return jsonify({"status": "error", "message": "Permission not found"}), 400
    users_settings[user_id]['permissions'].remove(permission)
    save_users_settings(users_settings)
    return jsonify({"status": "success", "message": "Permission removed"}), 200

@app.route('/config', methods=['GET'])
def get_config():
    config = load_config()
    return jsonify({"status": "success", "count": len(config), "config": config})

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

@app.route('/<USERid>/user', methods=['GET'])
def get_user_settings_endpoint(USERid):
    try:
        settings = get_user_settings(USERid)
        return jsonify({
            "status": "success",
            "contact_name": settings.get("contact_name", ""),
            "website_url": settings.get("website_url", ""),
            "email_address": settings.get("email_address", ""),
            "phone_number": settings.get("phone_number", ""),
            "wixClientId": settings.get("wixClientId", "")
        })
    except Exception as e:
        print(f"Error in /<USERid>/user GET: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/<USERid>/user', methods=['PUT'])
def put_user_settings(USERid):
    if not request.json:
        return jsonify({"status": "error", "message": "Request body must contain settings"}), 400
    settings = request.json
    required_fields = ["contact_name", "website_url", "email_address", "phone_number", "wixClientId"]
    if not all(field in settings for field in required_fields):
        return jsonify({"status": "error", "message": "Settings must include all required fields"}), 400
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
    valid_fields = ["contact_name", "website_url", "email_address", "phone_number", "wixClientId"]
    for key in new_settings:
        if key in valid_fields:
            current_settings[key] = new_settings[key]
    users_settings[USERid] = current_settings
    save_users_settings(users_settings)
    return jsonify({"status": "success", "message": f"Settings for user {USERid} updated", "settings": current_settings})

@app.route('/<USERid>/mycategories', methods=['GET'])
def get_user_categories_endpoint(USERid):
    try:
        categories = get_user_categories(USERid)
        return jsonify({"status": "success", "count": len(categories), "categories": categories})
    except Exception as e:
        print(f"Error in /<USERid>/mycategories for USERid {USERid}: {str(e)}")
        return jsonify({"status": "error", "message": f"Failed to retrieve categories: {str(e)}"}), 500

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
    if USERid in users_data and category_id in users_data[USERid]:
        users_data[USERid].remove(category_id)
        save_users_categories(users_data)
        return jsonify({"status": "success", "message": f"Category {category_id} removed for user {USERid}", "categories": users_data[USERid]})
    return jsonify({"status": "error", "message": f"Category {category_id} not found for user {USERid}"}), 404

@app.route('/categories', methods=['GET'])
def get_all_categories():
    config = load_config()
    parent_id = request.args.get('parent_id')
    amazon_config = config.get("amazon_uk", {})
    has_valid_amazon_config = all(amazon_config.get(field, "") for field in ["ACCESS_KEY", "SECRET_KEY", "ASSOCIATE_TAG", "COUNTRY"])
    
    if has_valid_amazon_config and parent_id:
        categories = get_immediate_subcategories(parent_id)
    elif not parent_id:
        categories = [{"id": cat["id"], "name": cat["name"]} for cat in PSEUDO_CATEGORIES]
    else:
        categories = find_pseudo_subcategories(parent_id, PSEUDO_CATEGORIES)
    
    return jsonify({"status": "success", "count": len(categories), "categories": categories})

@app.route('/<USERid>/products', methods=['GET'])
def get_user_product_list(USERid):
    products = get_user_products(USERid)
    return jsonify({"status": "success", "count": len(products), "products": products})

@app.route('/<USERid>/products/<product_id>', methods=['GET'])
def reduce_product_quantity(USERid, product_id):
    qty = request.args.get('qty', type=int)
    if qty is None or qty >= 0:
        return jsonify({"status": "error", "message": "Query parameter 'qty' must be a negative integer"}), 400
    users_products = load_users_products()
    if USERid not in users_products:
        return jsonify({"status": "error", "message": f"User {USERid} not found"}), 404
    current_products = users_products[USERid]
    product_to_update = next((p for p in current_products if p["id"] == product_id), None)
    if not product_to_update:
        return jsonify({"status": "error", "message": f"Product {product_id} not found for user {USERid}"}), 404
    current_qty = product_to_update["qty"]
    if current_qty != -1:
        product_to_update["qty"] = max(0, current_qty + qty)
    users_products[USERid] = current_products
    save_users_products(users_products)
    return jsonify({"status": "success", "message": f"Quantity reduced for product {product_id}", "product": product_to_update})

@app.route('/discounted-products', methods=['GET'])
def get_all_discounted_products():
    category_id = request.args.get('category_id')
    if not category_id:
        return jsonify({"status": "error", "message": "Query parameter 'category_id' is required"}), 400
    all_items = []
    config = load_config()
    search_categories = [category_id]
    
    for cat_id in search_categories:
        if all(config.get("amazon_uk", {}).values()):
            all_items.extend(search_amazon_uk_all(cat_id))
        if all(config.get("ebay_uk", {}).values()):
            all_items.extend(search_ebay_uk_all(cat_id))
        if config.get("awin", {}).get("API_TOKEN"):
            all_items.extend(search_awin_uk_all(cat_id))
        if all(config.get("cj", {}).values()):
            all_items.extend(search_cj_uk_all(cat_id))
        all_items.extend(search_wix_all(cat_id))

    return jsonify({"status": "success", "count": len(all_items), "products": all_items})

@app.route('/referal', methods=['POST'])
def handle_referral():
    """
    Handle referral callbacks from Wix scripts and store in users_settings.json.
    Expects JSON payload with either page visit or order data.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        users_settings = load_users_settings()
        
        referer = data.get("referer", "none")
        timestamp = data.get("timestamp")
        
        if not timestamp:
            return jsonify({"status": "error", "message": "Timestamp is required"}), 400

        if referer not in users_settings:
            users_settings[referer] = {
                "contact_name": "",
                "website_url": "",
                "email_address": "",
                "phone_number": "",
                "wixClientId": "",
                "referrals": {
                    "visits": [],
                    "orders": []
                }
            }
        elif "referrals" not in users_settings[referer]:
            users_settings[referer]["referrals"] = {
                "visits": [],
                "orders": []
            }

        if "page" in data:
            referral_data = {
                "page": data["page"],
                "timestamp": timestamp
            }
            users_settings[referer]["referrals"]["visits"].append(referral_data)
            print(f"Stored page visit for referer {referer}: {referral_data}")
        
        elif "orderId" in data:
            referral_data = {
                "orderId": data["orderId"],
                "buyer": data["buyer"],
                "total": data["total"],
                "timestamp": timestamp
            }
            users_settings[referer]["referrals"]["orders"].append(referral_data)
            print(f"Stored order for referer {referer}: {referral_data}")
        
        else:
            return jsonify({"status": "error", "message": "Invalid referral data format"}), 400

        save_users_settings(users_settings)
        
        return jsonify({
            "status": "success",
            "message": "Referral data recorded",
            "referer": referer,
            "timestamp": timestamp
        })

    except Exception as e:
        print(f"Error in referral endpoint: {str(e)}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

def load_users_settings():
    """Load users_settings.json file."""
    try:
        with open('users_settings.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

@app.route('/update-password', methods=['POST'])
def update_password():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        email = data.get("email", "").strip()
        new_password = data.get("password", "").strip()

        if not email or not new_password:
            return jsonify({"status": "error", "message": "Email and password are required"}), 400

        users_settings = load_users_settings()
        matching_user_id = None
        for user_id, settings in users_settings.items():
            stored_email = settings.get("email_address", "").strip()
            if stored_email and stored_email.lower() == email.lower():
                matching_user_id = user_id
                break

        if not matching_user_id:
            return jsonify({"status": "error", "message": f"No user found with email '{email}'"}), 404

        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        users_settings[matching_user_id]["password"] = hashed_password.decode('utf-8')
        save_users_settings(users_settings)
        return jsonify({"status": "success", "message": f"Password updated for user with email '{email}'", "user_id": matching_user_id}), 200
    except Exception as e:
        print(f"Error in update-password endpoint: {str(e)}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@app.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        email = data.get("email")
        if not email:
            return jsonify({"status": "error", "message": "Email is required"}), 400

        users_settings = load_users_settings()
        matching_user_id = None
        for user_id, settings in users_settings.items():
            if settings.get("email_address", "").lower() == email.lower():
                matching_user_id = user_id
                break

        if not matching_user_id:
            return jsonify({"status": "error", "message": "Email not found"}), 404

        user = users_settings[matching_user_id]
        phone_number = user.get("phone_number", "").strip()
        if not phone_number:
            return jsonify({"status": "error", "message": "No phone number associated with this account"}), 400

        otp = ''.join(random.choices(string.digits, k=6))
        reset_expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)

        if "reset_codes" not in app.config:
            app.config["reset_codes"] = {}
        app.config["reset_codes"][matching_user_id] = {
            "code": otp,
            "expires": reset_expiry.isoformat()
        }

        config = load_config()
        textmagic_config = config.get("textmagic", {})
        username = textmagic_config.get("USERNAME")
        api_key = textmagic_config.get("API_KEY")
        if not username or not api_key:
            return jsonify({"status": "error", "message": "TextMagic credentials not configured"}), 500

        url = "https://rest.textmagic.com/api/v2/messages"
        payload = {
            "text": f"clubmadiera.io sent you a one-time password: {otp}. It expires in 15mins.",
            "phones": phone_number
        }
        headers = {
            "X-TM-Username": username,
            "X-TM-Key": api_key,
            "Content-Type": "application/x-www-form-urlencoded"
        }

        response = requests.post(url, data=payload, headers=headers)
        if response.status_code == 201:
            return jsonify({
                "status": "success",
                "message": "A one-time password has been sent to your phone"
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": f"Failed to send SMS: {response.text}"
            }), 500

    except Exception as e:
        print(f"Error in reset-password endpoint: {str(e)}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@app.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    
    try:
        # Parse JSON safely
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return jsonify({"status": "error", "message": "Invalid or missing JSON data"}), 400

        email = data.get("email")
        code = data.get("code")
        new_password = data.get("new_password")
        if not all([email, code, new_password]):
            return jsonify({"status": "error", "message": "Email, code, and new password are required"}), 400

        # Load user settings
        try:
            users_settings = load_users_settings()
        except Exception as e:
            print(f"Error loading users_settings: {str(e)}")
            return jsonify({"status": "error", "message": "Failed to load user data"}), 500

        # Find user by email
        matching_user_id = None
        for user_id, settings in users_settings.items():
            if settings.get("email_address", "").lower() == email.lower():
                matching_user_id = user_id
                break

        if not matching_user_id:
            return jsonify({"status": "error", "message": "Email not found"}), 404

        # Check stored OTP
        stored_reset = app.config.get("reset_codes", {}).get(matching_user_id, {})
        stored_code = stored_reset.get("code")
        if not stored_code:
            return jsonify({"status": "error", "message": "No reset code found for this user"}), 400

        try:
            expiry = datetime.datetime.fromisoformat(stored_reset.get("expires", "2000-01-01T00:00:00"))
        except (ValueError, TypeError) as e:
            print(f"Error parsing expiry: {str(e)}")
            return jsonify({"status": "error", "message": "Invalid reset code expiry format"}), 500

        if stored_code != code or datetime.datetime.utcnow() > expiry:
            return jsonify({"status": "error", "message": "Invalid or expired reset code"}), 400

        # Update password
        try:
            hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            users_settings[matching_user_id]["password"] = hashed_password
        except Exception as e:
            print(f"Error hashing password: {str(e)}")
            return jsonify({"status": "error", "message": "Failed to hash password"}), 500

        # Save updated settings
        try:
            save_users_settings(users_settings)
        except Exception as e:
            print(f"Error saving users_settings: {str(e)}")
            return jsonify({"status": "error", "message": "Failed to save updated user data"}), 500

        # Clean up reset code
        if matching_user_id in app.config.get("reset_codes", {}):
            del app.config["reset_codes"][matching_user_id]

        return jsonify({
            "status": "success",
            "message": "Password updated successfully"
        }), 200

    except Exception as e:
        print(f"Unexpected error in verify-reset-code endpoint: {str(e)}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
        
@app.route('/<USERid>/visits', methods=['GET'])
def get_user_visits(USERid):
    """Fetch the list of visits for a user from users_settings.json."""
    try:
        users_settings = load_users_settings()
        if USERid not in users_settings:
            return jsonify({"status": "error", "message": f"User {USERid} not found"}), 404

        referrals = users_settings[USERid].get("referrals", {})
        visits = referrals.get("visits", [])
        return jsonify({
            "status": "success",
            "count": len(visits),
            "visits": visits
        })
    except Exception as e:
        print(f"Error in /<USERid>/visits GET: {str(e)}")
        return jsonify({"status": "error", "message": f"Failed to retrieve visits: {str(e)}"}), 500

@app.route('/<USERid>/orders', methods=['GET'])
def get_user_orders(USERid):
    """Fetch the list of orders for a user from users_settings.json."""
    try:
        users_settings = load_users_settings()
        if USERid not in users_settings:
            return jsonify({"status": "error", "message": f"User {USERid} not found"}), 404

        referrals = users_settings[USERid].get("referrals", {})
        orders = referrals.get("orders", [])
        return jsonify({
            "status": "success",
            "count": len(orders),
            "orders": orders
        })
    except Exception as e:
        print(f"Error in /<USERid>/orders GET: {str(e)}")
        return jsonify({"status": "error", "message": f"Failed to retrieve orders: {str(e)}"}), 500

# endregion Management Endpoints

# region Logged in Endpoints
@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/community')
def community():
    return render_template('community.html')

@app.route('/merchant')
def merchant():
    return render_template('merchant.html')

@app.route('/partner')
def wixpro():
    return render_template('partner.html')

@app.route('/<user_id>/siterequest', methods=['POST'])
def save_site_request_endpoint(user_id):
    try:
        # Get JSON data from request
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        # Validate user_id matches the one in the body (if provided)
        body_user_id = data.get("userId")
        if body_user_id and body_user_id != user_id:
            return jsonify({"status": "error", "message": "User ID in body does not match URL"}), 400

        if not user_id:
            return jsonify({"status": "error", "message": "User ID is required"}), 400

        # Determine request type (optional field, defaults to "community" if not specified)
        request_type = data.get("type", "community")

        # Extract site request fields, supporting both merchant and community schemas
        site_request = {
            "user_id": user_id,
            "type": request_type,  # Store the type (merchant or community)
            "communityName": data.get("communityName") or data.get("storeName") or "",  # Accept either
            "aboutCommunity": data.get("aboutCommunity") or data.get("aboutStore") or "",  # Accept either
            "communityLogos": data.get("communityLogos") or data.get("storeLogos") or [],  # Accept either
            "colorPrefs": data.get("colorPrefs", ""),
            "stylingDetails": data.get("stylingDetails", ""),
            "preferredDomain": data.get("preferredDomain", "mycommunity.org"),
            "emails": data.get("emails", []),
            "pages": data.get("pages", []),
            "widgets": data.get("widgets", []),
            "submitted_at": datetime.datetime.utcnow().isoformat()
        }

        # Validate required fields
        if not site_request["communityName"]:
            return jsonify({"status": "error", "message": "Community name or store name is required"}), 400

        # Validate domain format
        domain_regex = r'^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$'
        if not re.match(domain_regex, site_request["preferredDomain"]):
            return jsonify({"status": "error", "message": "Invalid domain name"}), 400

        # Handle file data (assuming base64 strings or placeholders)
        for page in site_request["pages"]:
            if "images" in page and page["images"]:
                page["images"] = [img if isinstance(img, str) else "placeholder" for img in page["images"]]

        # Save to file in /siterequest folder
        save_site_request(user_id, site_request)

        return jsonify({"status": "success", "message": "Site request saved successfully"}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@app.route('/<user_id>/siterequest', methods=['GET'])
def get_site_request(user_id):
    try:
        # Load site request data from file
        site_request = load_site_request(user_id)

        # If no data exists, return an empty site_request
        if not site_request:
            return jsonify({
                "status": "success",
                "site_request": {}
            }), 200

        # Return the site request data
        response = {
            "status": "success",
            "site_request": site_request
        }
        return jsonify(response), 200

    except Exception as e:
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
     
@app.route('/siterequests', methods=['GET'])
def list_site_requests():
    try:
        siterequest_dir = 'siterequest'
        logger.debug(f"Looking in directory: {os.path.abspath(siterequest_dir)}")
        if not os.path.exists(siterequest_dir):
            logger.debug("Directory does not exist")
            return jsonify({"status": "success", "siterequests": []}), 200

        users_settings = load_users_settings()
        siterequests = []
        files = os.listdir(siterequest_dir)
        logger.debug(f"Found files: {files}")
        for filename in files:
            user_id = filename.replace('.json', '')
            logger.debug(f"Processing user_id: {user_id}")
            site_request = load_site_request(user_id)
            if not site_request:
                logger.debug(f"No data loaded for {user_id}")
                continue

            contact_name = users_settings.get(user_id, {}).get('contact_name', '')
            email = users_settings.get(user_id, {}).get('email_address', '')
            request_type = site_request.get('type', '')
            store_name = site_request.get('storeName')
            community_name = site_request.get('communityName')
            organisation = store_name if store_name else community_name if community_name else ''
            received_at = site_request.get('submitted_at', '')

            siterequests.append({
                'user_id': user_id,
                'type': request_type,
                'received_at': received_at,
                'contact_name': contact_name,
                'email': email,
                'organisation': organisation
            })
            logger.debug(f"Added request for {user_id}")

        logger.debug(f"Total requests found: {len(siterequests)}")
        siterequests.sort(key=lambda x: x['received_at'] or '', reverse=True)
        return jsonify({"status": "success", "siterequests": siterequests}), 200

    except Exception as e:
        logger.error(f"Error in list_site_requests: {str(e)}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@app.route('/render-github-md/<owner>/<repo>/<branch>/<path:path>')
def render_github_md(owner, repo, branch, path):
    # Ensure the file is a Markdown file
    if not path.endswith('.md'):
        abort(404, "Not a Markdown file")
    
    # Construct the URL to fetch the raw Markdown content from GitHub
    url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
    
    # Fetch the content
    response = requests.get(url)
    if response.status_code == 200:
        md_content = response.text
        # Convert Markdown to HTML with tables extension
        html_content = markdown.markdown(md_content, extensions=['tables'])
        # Render the HTML in a simple template
        return render_template_string('''
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Rendered Markdown</title>
                <style>
                    table {
                        border-collapse: collapse;
                        width: 100%;
                        margin: 20px 0;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                </style>
            </head>
            <body>
                {{ content | safe }}
            </body>
            </html>
        ''', content=html_content)
    else:
        abort(404, "File not found")
    
# endregion Logged in Endpoints

# region Public Endpoints

@app.route('/')
def home():
    return render_template('login.html')  # Serves login.html at /

@app.route('/branding')
def branding():
    try:
        # Path to branding.json in the root directory
        root_dir = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.join(root_dir, 'branding.json')
        
        with open(json_path, 'r') as f:
            branding_data = json.load(f)
        return jsonify(branding_data)
    except FileNotFoundError:
        return jsonify({'content': '<h1>Branding content not found</h1>'}), 500
    except Exception as e:
        return jsonify({'content': f'Internal Server Error: {str(e)}'}), 500

# Login endpoint
@app.route('/login', methods=['POST'])
def login():
    # Get request data
    data = request.get_json()
    email = data.get("email", "").strip()
    plain_password = data.get("password", "").strip()

    # Validate input
    if not email or not plain_password:
        return jsonify({"status": "error", "message": "Email and password are required"}), 400

    # Load user data
    users_settings = load_users_settings()

    # Find user by email and verify password
    matching_user_id = None
    for user_id, settings in users_settings.items():
        if settings.get("email_address", "").lower() == email.lower():
            stored_hashed_password = settings.get("password")
            if isinstance(stored_hashed_password, str):
                stored_hashed_password = stored_hashed_password.encode('utf-8')
            if bcrypt.checkpw(plain_password.encode('utf-8'), stored_hashed_password):
                matching_user_id = user_id
                break

    # If authentication fails
    if not matching_user_id:
        return jsonify({"status": "error", "message": "Invalid email or password"}), 401

    # Get user permissions
    user_permissions = users_settings[matching_user_id].get("permissions", [])

    # Determine redirect URL based on permissions
    redirect_url = None
    if "admin" in user_permissions:
        redirect_url = url_for('admin')
    elif "community" in user_permissions:
        redirect_url = url_for('community')
    elif "merchant" in user_permissions:
        redirect_url = url_for('merchant')
    elif "wixpro" in user_permissions:
        redirect_url = url_for('partner')

    # Generate JWT token with permissions included
    token_payload = {
        "userId": matching_user_id,
        "permissions": user_permissions,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }
    token = jwt.encode(token_payload, SECRET_KEY, algorithm="HS256")

    # Prepare response
    contact_name = users_settings[matching_user_id].get("contact_name", "User")
    response_data = {
        "status": "success",
        "message": "Login successful",
        "token": token,
        "userId": matching_user_id,
        "contact_name": contact_name
    }

    # Add redirect URL if applicable
    if redirect_url:
        response_data["redirect_url"] = redirect_url

    return jsonify(response_data), 200

@app.route('/signup', methods=['GET'])
def signup_page():
    return render_template('signup.html')

@app.route('/signup', methods=['POST'])
def signup():
    # Parse the incoming JSON data
    data = request.get_json()

    # Define required fields
    required_fields = ['signup_type', 'contact_name', 'signup_email', 'signup_password']
    
    # Validate that all required fields are present
    if not all(field in data for field in required_fields):
        return jsonify({"status": "error", "message": "All fields are required"}), 400

    # Load existing users
    users_settings = load_users_settings()

    # Check if the email already exists
    if any(user['email_address'] == data['signup_email'] for user in users_settings.values()):
        return jsonify({"status": "error", "message": "Email already exists"}), 400

    # Generate a unique USERid
    while True:
        USERid = generate_code()
        if USERid not in users_settings:
            break

    # Hash the password
    hashed_password = bcrypt.hashpw(data['signup_password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Create the user entry with user_categories included
    users_settings[USERid] = {
        "email_address": data['signup_email'],
        "password": hashed_password,
        "contact_name": data['contact_name'],
        "permissions": [data['signup_type']],  # Existing field for access control
        "user_categories": [data['signup_type']],  # New field for categorization
        "website_url": "",
        "wixClientId": "",
        "referrals": {"visits": [], "orders": []}
    }

    # Save the updated user settings
    save_users_settings(users_settings)

    # Return a success response
    return jsonify({"status": "success", "message": "Signup successful"}), 201
# endregion Sign up

# region Velocify Public Endpoints
@app.route('/<USERid>/discounted-products', methods=['GET'])
def get_user_discounted_products(USERid):
    category_id = request.args.get('category_id')
    min_discount = request.args.get('min_discount', default=20, type=int)
    root_category_ids = get_user_categories(USERid)
    all_discounted_items = []
    config = load_config()
    search_categories = [category_id] if category_id else root_category_ids
    
    for cat_id in search_categories:
        if all(config.get("amazon_uk", {}).values()):
            all_discounted_items.extend(search_amazon_uk_discounted(cat_id, min_discount))
        if all(config.get("ebay_uk", {}).values()):
            all_discounted_items.extend(search_ebay_uk_discounted(cat_id, min_discount))
        if config.get("awin", {}).get("API_TOKEN"):
            all_discounted_items.extend(search_awin_uk_discounted(cat_id, min_discount))
        if all(config.get("cj", {}).values()):
            all_discounted_items.extend(search_cj_uk_discounted(cat_id, min_discount))
        all_discounted_items.extend(search_wix_discounted(cat_id, min_discount))

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
            subcategories = get_immediate_subcategories(parent_id)
            if subcategories:
                subcategory_ids = [cat["id"] for cat in subcategories]
                all_categories = filter_categories_with_products(subcategory_ids, min_discount)
        else:
            all_categories = filter_categories_with_products(root_category_ids, min_discount)
        
        return jsonify({
            "status": "success",
            "count": len(all_categories),
            "categories": all_categories,
            "min_discount": min_discount
        }) if all_categories else jsonify({
            "status": "success",
            "count": 0,
            "categories": [],
            "message": f"No categories with products at {min_discount}% discount found."
        })
    except Exception as e:
        return jsonify({"status": "error", "message": f"Error fetching categories: {str(e)}"}), 500
# endregion Velo Public Endpoints

# endregion Public Endpoints

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)