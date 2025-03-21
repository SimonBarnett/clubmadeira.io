import requests
import json

def get_wix_access_token(client_id):
    """Retrieve an access token for the given Wix clientId."""
    token_url = "https://www.wixapis.com/oauth2/token"
    payload = {
        "clientId": client_id,
        "grantType": "anonymous"
    }
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.post(token_url, json=payload, headers=headers)
        if response.status_code != 200:
            print(f"Error getting token for clientId {client_id}: {response.status_code} - {response.text}")
            return None
        token_data = response.json()
        return token_data["access_token"]
    except Exception as e:
        print(f"Token fetch error for clientId {client_id}: {str(e)}")
        return None

def search_wix_discounted(client_id, collection_id, min_discount_percent=20):
    """Search for discounted Wix products in a collection for a given clientId."""
    access_token = get_wix_access_token(client_id)
    if not access_token:
        return []

    url = "https://www.wixapis.com/stores/v1/products/query"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    filter_str = json.dumps({"collections.id": {"$hasSome": [collection_id]}})
    params = {
        "query": {
            "filter": filter_str,
            "paging": {"limit": 100, "offset": 0}  # Higher limit for broader search
        }
    }

    discounted_products = []
    offset = 0
    limit = 100

    try:
        while True:
            params["query"]["paging"]["offset"] = offset
            response = requests.post(url, headers=headers, json=params)
            if response.status_code != 200:
                print(f"Error fetching products for clientId {client_id}, collection {collection_id}: {response.status_code} - {response.text}")
                return discounted_products

            data = response.json()
            products = data.get("products", [])
            if not products:
                break

            for product in products:
                current_price_str = product.get("price", {}).get("formatted", {}).get("price", "0")
                original_price_str = product.get("discountedPrice", {}).get("formatted", {}).get("price", current_price_str)
                
                # Convert prices to floats, removing currency symbols
                try:
                    current_price = float(current_price_str.replace("$", "").replace("£", "").replace(",", ""))
                    original_price = float(original_price_str.replace("$", "").replace("£", "").replace(",", ""))
                except (ValueError, TypeError):
                    continue  # Skip if price conversion fails

                # Check if it’s discounted (original > current)
                if original_price > current_price:
                    discount = ((original_price - current_price) / original_price) * 100
                    if discount >= min_discount_percent:
                        discounted_products.append({
                            "name": product.get("name", ""),
                            "thumbnail": product.get("media", {}).get("mainMedia", {}).get("thumbnail", {}).get("url", ""),
                            "price": current_price_str,
                            "discountPrice": original_price_str,
                            "link": (
                                product.get("productPageUrl", {}).get("base", "").rstrip("/") + "/" +
                                product.get("productPageUrl", {}).get("path", "").lstrip("/")
                            )
                        })

            offset += limit
            if len(products) < limit:  # Fewer items than limit means we're done
                break

        return discounted_products

    except Exception as e:
        print(f"Wix Search Error for clientId {client_id}, collection {collection_id}: {str(e)}")
        return []

# Example usage
if __name__ == "__main__":
    client_id = "9fa0f271-1600-4282-9fae-d841be6aaff6"  # Your Wix clientId
    collection_id = "3357079e-958c-c25e-d594-ea3f72e1660a"  # Example collection (Camping)
    discounted_products = search_wix_discounted(client_id, collection_id, min_discount_percent=20)
    print(json.dumps(discounted_products, indent=2))