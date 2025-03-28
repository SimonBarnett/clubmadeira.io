# Wix API Integration for Categories and Products

This guide covers programmatic access to category and product information from Wix Stores using the Wix eCommerce API.

## Prerequisites
- A Wix account with a store enabled (Wix Stores app added).
- Admin access to generate API credentials.

## Required Credentials
- **API Token**: A single token for authentication, generated in the Wix dashboard.
- **Site ID**: Unique identifier for your Wix site (found in API calls or dashboard).

To get credentials:
1. Log in to your Wix account.
2. Go to **Settings > Advanced Settings > API Tokens**.
3. Generate a new token with scopes `STORE_READ_PRODUCTS` and `STORE_READ_CATEGORIES`.
4. Copy the API Token. The Site ID is available in the dashboard or via API calls.

## Authentication
Use the API Token in the request header:

Authorization: Bearer {api_token}

## Retrieving Categories
Wix calls categories "Collections." To list all collections:

@bash
curl -X GET "https://www.wixapis.com/stores/v1/collections" \
-H "Authorization: Bearer {api_token}"
@

- Endpoint: `GET https://www.wixapis.com/stores/v1/collections`
- Response includes collection IDs, names, and slugs.

## Retrieving Products
To fetch all products:

@bash
curl -X GET "https://www.wixapis.com/stores/v1/products" \
-H "Authorization: Bearer {api_token}"
@

- Endpoint: `GET https://www.wixapis.com/stores/v1/products`
- Returns product IDs, names, prices, and more.
- Filter by collection: Add `?collectionId={collection_id}` to the query.

## Notes
- Wix APIs require HTTPS.
- Rate limits are not publicly detailed but monitored per app.
- Use pagination (`?paging.limit=100`) for large datasets.

See [Wix eCommerce API Docs](https://dev.wix.com/api/rest/wix-stores) for more details.