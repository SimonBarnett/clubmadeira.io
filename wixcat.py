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

# Step 2: Function to fetch collections
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
        print(f"Error fetching collections: {response.status_code} - {response.text}")
        return None
    return response.json()

# Step 3: Function to fetch products for a collection
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
        print(f"Error fetching products for collection {collection_id}: {response.status_code} - {response.text}")
        return None
    return response.json()

# Step 4: Fetch all collections and their products
all_collections = []
limit = 10
offset = 0

# Fetch collections
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
    print(f"Fetched {len(collections)} collections, kept {len(filtered_collections)} (offset {offset} to {offset + limit - 1})")

    offset += limit
    if len(collections) < limit:
        break

# Fetch products for each collection and filter fields
for collection in all_collections:
    collection_id = collection["id"]
    all_products = []
    offset = 0

    while True:
        result = fetch_products_for_collection(collection_id, limit=limit, offset=offset)
        if not result or "products" not in result or not result["products"]:
            break

        products = result["products"]
        # Filter to only desired fields, combining base and path for link
        filtered_products = [
            {
                "name": product.get("name", ""),
                "thumbnail": product.get("media", {}).get("mainMedia", {}).get("thumbnail", {}).get("url", ""),
                "price": product.get("price", {}).get("formatted", {}).get("price", ""),
                "discountPrice": product.get("discountedPrice", {}).get("formatted", {}).get("price", ""),
                "link": (
                    product.get("productPageUrl", {}).get("base", "") +
                    product.get("productPageUrl", {}).get("path", "")
                )
            }
            for product in products
        ]
        all_products.extend(filtered_products)
        print(f"Fetched {len(products)} products for collection {collection['name']} (offset {offset} to {offset + limit - 1})")

        offset += limit
        if len(products) < limit:
            break

    collection["products"] = all_products
    print(f"Total products in {collection['name']}: {len(all_products)}")

# Step 5: Output the combined data
print(f"\nTotal collections fetched (after filtering): {len(all_collections)}")
print(json.dumps(all_collections, indent=2))  # Pretty-print collections with filtered products
