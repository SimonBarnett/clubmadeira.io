# utils/wix.py
import requests
from utils.users import load_users_settings
import logging

def get_wix_access_token(client_id):
    """Obtain an access token from Wix using the client ID."""
    token_url = "https://www.wixapis.com/oauth2/token"
    payload = {"clientId": client_id, "grantType": "anonymous"}
    headers = {"Content-Type": "application/json"}
    response = requests.post(token_url, json=payload, headers=headers)
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        raise Exception(f"Failed to get Wix access token: {response.text}")

def fetch_wix_collections(access_token):
    """Fetch collections from Wix using the access token."""
    collections_url = "https://www.wixapis.com/stores-reader/v1/collections/query"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {access_token}"}
    query_payload = {"query": {"paging": {"limit": 100}}, "includeNumberOfProducts": True}
    response = requests.post(collections_url, headers=headers, json=query_payload)
    if response.status_code == 200:
        return response.json()["collections"]
    else:
        raise Exception(f"Failed to fetch Wix collections: {response.text}")

def fetch_wix_products_for_collection(access_token, collection_id):
    """Fetch products for a specific collection from Wix."""
    products_url = "https://www.wixapis.com/stores/v1/products/query"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {access_token}"}
    filter_str = '{"collections.id": {"$hasSome": ["' + collection_id + '"]}}'
    query_payload = {"query": {"filter": filter_str, "paging": {"limit": 100}}}
    response = requests.post(products_url, headers=headers, json=query_payload)
    if response.status_code == 200:
        return response.json()["products"]
    else:
        raise Exception(f"Failed to fetch Wix products for collection {collection_id}: {response.text}")

def fetch_user_products(user_id):
    """Fetch all products for a user from Wix."""
    users_settings = load_users_settings()
    user = users_settings.get(user_id)
    if not user:
        logging.warning(f"No user found for ID: {user_id}")
        return []  # User not found
    wix_settings = user.get("settings", {}).get("api_key", {}).get("wixStore", {})
    wix_client_id = wix_settings.get("API_TOKEN")
    if not wix_client_id:
        logging.warning(f"No Wix API token found for user: {user_id}")
        return []  # No Wix API token found
    
    try:
        access_token = get_wix_access_token(wix_client_id)
        collections = fetch_wix_collections(access_token)
        all_products = []
        
        for collection in collections:
            if collection["id"].startswith("00000000"):
                continue  # Skip default/system collections
            products = fetch_wix_products_for_collection(access_token, collection["id"])
            for product in products:
                current_price = float(product.get("price", {}).get("formatted", {}).get("price", "0").replace("$", "").replace("£", "").replace(",", "") or 0.0)
                original_price = float(product.get("discountedPrice", {}).get("formatted", {}).get("price", str(current_price)).replace("$", "").replace("£", "").replace(",", "") or current_price)
                discount = ((original_price - current_price) / original_price) * 100 if original_price > current_price else 0.0
                base_url = product.get("productPageUrl", {}).get("base", "").rstrip("/") + "/" + product.get("productPageUrl", {}).get("path", "").lstrip("/")
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
                    "qty": int(product.get("stock", {}).get("quantity", 0)) if product.get("stock", {}).get("trackQuantity", False) else -1,
                    "category": collection["name"],
                    "user_id": user_id
                })
        return all_products
    except Exception as e:
        logging.error(f"Error fetching products for user {user_id}: {str(e)}")
        return []