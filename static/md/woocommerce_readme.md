# WooCommerce API Usage for Club Madeira

This document provides a detailed guide on using the WooCommerce API to retrieve part category and part data for clubmadeira.io. This will later be replaced with instructions on how to obtain the API key details from WooCommerce to use in the config.

## Prerequisites
- A WooCommerce site (sign up at [https://woocommerce.com/start](https://woocommerce.com/start)).
- API credentials (CONSUMER_KEY, CONSUMER_SECRET) from WooCommerce.
- Basic API knowledge.

## Step-by-Step Instructions

### Step 1: Verify API Credentials
Ensure you have your CONSUMER_KEY and CONSUMER_SECRET from your WooCommerce site (in config.json).

### Step 2: Access WooCommerce API
Refer to the WooCommerce REST API documentation: [https://woocommerce.github.io/woocommerce-rest-api-docs/](https://woocommerce.github.io/woocommerce-rest-api-docs/). Base URL: <STORE_URL>/wp-json/wc/v3 (e.g., https://yourstore.com/wp-json/wc/v3).

### Step 3: Retrieve Part Categories
API Endpoint: GET /products/categories. Request: Headers: Authorization: Basic <base64(<CONSUMER_KEY>:<CONSUMER_SECRET>)>. URL: <STORE_URL>/wp-json/wc/v3/products/categories. Example with cURL: ``` curl -X GET "<STORE_URL>/wp-json/wc/v3/products/categories" -u <CONSUMER_KEY>:<CONSUMER_SECRET> ``` Response: JSON with category data (e.g., [{"id": 15, "name": "Brakes"}]). Steps: 1. Replace <STORE_URL>, <CONSUMER_KEY>, and <CONSUMER_SECRET> with your config values. 2. Send the request (use -u for basic auth). 3. Parse the response to list categories.

### Step 4: Retrieve Part Data
API Endpoint: GET /products. Request: Headers: Authorization: Basic <base64(<CONSUMER_KEY>:<CONSUMER_SECRET>)>. URL: <STORE_URL>/wp-json/wc/v3/products?category=<category_id>. Example with cURL: ``` curl -X GET "<STORE_URL>/wp-json/wc/v3/products?category=<category_id>" -u <CONSUMER_KEY>:<CONSUMER_SECRET> ``` Response: JSON with product data (e.g., [{"id": 101, "name": "Brake Pad", "price": "29.99"}]). Steps: 1. Use a category_id from Step 3 (e.g., 15). 2. Send the request. 3. Parse the response to display parts.

### Step 5: Integrate with Club Madeira
Use the fetched data in clubmadeira.io (e.g., populate a parts list). Update your application to use these API calls with user-provided credentials.

## Troubleshooting
- **401 Unauthorized**: Check CONSUMER_KEY and CONSUMER_SECRET.
- **Empty Response**: Add categories and products in WooCommerce admin.

## Next Steps
Test with your WooCommerce store data. **Note**: This guide will be replaced with instructions on how to obtain CONSUMER_KEY and CONSUMER_SECRET from WooCommerce for the config.