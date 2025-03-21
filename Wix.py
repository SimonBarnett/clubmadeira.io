import requests
import json

# Step 1: Retrieve the access token using the "anonymous" grant type
token_url = "https://www.wixapis.com/oauth2/token"
payload = {
    "clientId": "9fa0f271-1600-4282-9fae-d841be6aaff6",
    "grantType": "anonymous"
}
headers = {"Content-Type": "application/json"}

response = requests.post(token_url, json=payload, headers=headers)
if response.status_code != 200:
    print(f"Error getting token: {response.status_code} - {response.text}")
    exit()

token_data = response.json()
access_token = token_data["access_token"]
print(f"Access Token: {access_token}")

# Step 2: Function to fetch products with pagination
products_url = "https://www.wixapis.com/stores-reader/v1/products/query"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {access_token}"
}

def fetch_products(limit=100, offset=0, last_numeric_id=None):
    # Base query payload from your earlier request
    query_payload = {
        "query": {},
        "includeVariants": False,
        "includeHiddenProducts": False,
        "includeMerchantSpecificData": False
    }

    # Use limit/offset for smaller datasets
    if last_numeric_id is None:
        query_payload["query"]["paging"] = {"limit": limit, "offset": offset}
    # Use numericId for larger datasets (>10k items)
    else:
        query_payload["query"]["sort"] = [{"numericId": "asc"}]
        query_payload["query"]["filter"] = {"numericId": {"$gt": last_numeric_id}}

    response = requests.post(products_url, headers=headers, json=query_payload)
    if response.status_code != 200:
        print(f"Error fetching products: {response.status_code} - {response.text}")
        return None
    return response.json()

# Step 3: Paginate through products
all_products = []
limit = 100  # Items per page
offset = 0   # Starting point

# First, try limit/offset pagination
while True:
    result = fetch_products(limit=limit, offset=offset)
    if not result or "products" not in result or not result["products"]:
        break  # Stop if no more products

    products = result["products"]
    all_products.extend(products)
    print(f"Fetched {len(products)} products (offset {offset} to {offset + limit - 1})")

    offset += limit
    if len(products) < limit:  # Fewer items than limit means we're done
        break

# If we hit ~10k items or limit/offset fails, switch to numericId
if len(all_products) >= 10000 or not all_products:
    print("Switching to numericId pagination for large datasets...")
    all_products = []  # Reset
    last_numeric_id = None

    while True:
        result = fetch_products(last_numeric_id=last_numeric_id)
        if not result or "products" not in result or not result["products"]:
            break  # Stop if no more products

        products = result["products"]
        all_products.extend(products)
        last_numeric_id = products[-1]["numericId"]  # Get the last numericId
        print(f"Fetched {len(products)} products (numericId > {last_numeric_id})")

# Step 4: Output all fetched products
print(f"\nTotal products fetched: {len(all_products)}")
print(json.dumps(all_products, indent=2))  # Pretty-print all products