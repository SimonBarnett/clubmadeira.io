# BigCommerce API Integration for Categories and Products

This guide details how to programmatically retrieve category and product data from BigCommerce using the BigCommerce Catalog API.

## Prerequisites
- A BigCommerce store with admin access.
- An API token created in the store settings.

## Required Credentials
- **API Token**: A single token for authentication.
- **Client ID**: Used to generate the API Token.
- **Store Hash**: Unique identifier for your store (e.g., `stores/{store_hash}`).
- **Store URL**: Your BigCommerce store domain (e.g., `https://api.bigcommerce.com/stores/{store_hash}`).

To get credentials:
1. Log in to your BigCommerce admin.
2. Go to **Settings > API Accounts > Create API Account**.
3. Select scopes `Products (read-only)` and `Categories (read-only)`.
4. Save to get Client ID, API Token, and Store Hash.

## Authentication
Use the API Token in the header:

X-Auth-Token: {api_token}

## Retrieving Categories
To list all categories:

@bash
curl -X GET "https://api.bigcommerce.com/stores/{store_hash}/v3/catalog/categories" \
-H "X-Auth-Token: {api_token}" \
-H "Accept: application/json"
@

- Endpoint: `GET /stores/{store_hash}/v3/catalog/categories`
- Returns category IDs, names, and parent IDs.

## Retrieving Products
To fetch all products:

@bash
curl -X GET "https://api.bigcommerce.com/stores/{store_hash}/v3/catalog/products" \
-H "X-Auth-Token: {api_token}" \
-H "Accept: application/json"
@

- Endpoint: `GET /stores/{store_hash}/v3/catalog/products`
- Returns product IDs, names, prices, and categories.
- Filter by category: `?categories:in={category_id}`.

## Notes
- API version `v3` is recommended.
- Rate limit: 20,000 requests/hour (varies by plan).
- Use `?limit=250` for pagination.

Refer to [BigCommerce API Docs](https://developer.bigcommerce.com/api-reference) for full details.

