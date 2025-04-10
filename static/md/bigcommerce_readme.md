# BigCommerce API Usage for Club Madeira

This document provides a detailed guide on using the BigCommerce API to retrieve part category and part data for clubmadeira.io. This will later be replaced with instructions on how to obtain the API key details from BigCommerce to use in the config.

## Prerequisites
- A BigCommerce account (sign up at [https://www.bigcommerce.com/signup](https://www.bigcommerce.com/signup)).
- API credentials (API_TOKEN, CLIENT_ID, STORE_HASH) from BigCommerce.
- Basic API knowledge.

## Step-by-Step Instructions

### Step 1: Verify API Credentials
Ensure you have your API_TOKEN, CLIENT_ID, and STORE_HASH from your BigCommerce account (in config.json).

### Step 2: Access BigCommerce API
Refer to the BigCommerce API documentation: [https://developer.bigcommerce.com/api-docs](https://developer.bigcommerce.com/api-docs). Base URL: https://api.bigcommerce.com/stores/<STORE_HASH>/v3.

### Step 3: Retrieve Part Categories
API Endpoint: GET /catalog/categories. Request: Headers: X-Auth-Token: <API_TOKEN>. URL: https://api.bigcommerce.com/stores/<STORE_HASH>/v3/catalog/categories. Example with cURL: ``` curl -X GET "https://api.bigcommerce.com/stores/<STORE_HASH>/v3/catalog/categories" -H "X-Auth-Token: <API_TOKEN>" ``` Response: JSON with category data (e.g., {"data": [{"id": 1, "name": "Brakes"}]}). Steps: 1. Replace <API_TOKEN> and <STORE_HASH> with your config values. 2. Send the request. 3. Parse the response to list categories.

### Step 4: Retrieve Part Data
API Endpoint: GET /catalog/products. Request: Headers: X-Auth-Token: <API_TOKEN>. URL: https://api.bigcommerce.com/stores/<STORE_HASH>/v3/catalog/products?categories:in=<category_id>. Example with cURL: ``` curl -X GET "https://api.bigcommerce.com/stores/<STORE_HASH>/v3/catalog/products?categories:in=<category_id>" -H "X-Auth-Token: <API_TOKEN>" ``` Response: JSON with product data (e.g., {"data": [{"id": 101, "name": "Brake Pad", "price": "29.99"}]}). Steps: 1. Use a category_id from Step 3 (e.g., 1). 2. Send the request. 3. Parse the response to display parts.

### Step 5: Integrate with Club Madeira
Use the fetched data in clubmadeira.io (e.g., populate a parts catalog). Update your application to use these API calls with user-provided credentials.

## Troubleshooting
- **403 Forbidden**: Check API_TOKEN and STORE_HASH accuracy.
- **Empty Response**: Add categories and products in your BigCommerce store.

## Next Steps
Test with your BigCommerce store data. **Note**: This guide will be replaced with instructions on how to obtain API_TOKEN, CLIENT_ID, and STORE_HASH from BigCommerce for the config.