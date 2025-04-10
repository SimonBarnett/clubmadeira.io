# Shopify API Usage for Club Madeira

This document provides a detailed guide on using the Shopify API to retrieve part category and part data for clubmadeira.io. This will later be replaced with instructions on how to obtain the API key details from Shopify to use in the config.

## Prerequisites
- A Shopify account (sign up at [https://www.shopify.com/signup](https://www.shopify.com/signup)).
- API credentials (API_KEY, API_SECRET_KEY, ACCESS_TOKEN) from Shopify.
- Basic API knowledge.

## Step-by-Step Instructions

### Step 1: Verify API Credentials
Ensure you have your API_KEY, API_SECRET_KEY, and ACCESS_TOKEN from your Shopify account (in config.json).

### Step 2: Access Shopify API
Refer to the Shopify API documentation: [https://shopify.dev/api](https://shopify.dev/api). Base URL: <STORE_URL>/admin/api/2023-10 (e.g., https://yourstore.myshopify.com/admin/api/2023-10).

### Step 3: Retrieve Part Categories
API Endpoint: GET /collections. Request: Headers: X-Shopify-Access-Token: <ACCESS_TOKEN>. URL: <STORE_URL>/admin/api/2023-10/collections.json. Example with cURL: ``` curl -X GET "<STORE_URL>/admin/api/2023-10/collections.json" -H "X-Shopify-Access-Token: <ACCESS_TOKEN>" ``` Response: JSON with collection data (e.g., {"collections": [{"id": 123456, "title": "Brakes"}]}). Steps: 1. Replace <STORE_URL> and <ACCESS_TOKEN> with your config values. 2. Send the request. 3. Parse the response to list categories (collections).

### Step 4: Retrieve Part Data
API Endpoint: GET /products. Request: Headers: X-Shopify-Access-Token: <ACCESS_TOKEN>. URL: <STORE_URL>/admin/api/2023-10/products.json?collection_id=<collection_id>. Example with cURL: ``` curl -X GET "<STORE_URL>/admin/api/2023-10/products.json?collection_id=<collection_id>" -H "X-Shopify-Access-Token: <ACCESS_TOKEN>" ``` Response: JSON with product data (e.g., {"products": [{"id": 789012, "title": "Brake Pad", "variants": [{"price": "29.99"}]}]}). Steps: 1. Use a collection_id from Step 3 (e.g., 123456). 2. Send the request. 3. Parse the response to display parts.

### Step 5: Integrate with Club Madeira
Use the fetched data in clubmadeira.io (e.g., display parts in a search UI). Update your application to use these API calls with user-provided credentials.

## Troubleshooting
- **401 Unauthorized**: Verify ACCESS_TOKEN is correct.
- **No Data**: Add collections and products in your Shopify admin.

## Next Steps
Test with your Shopify store data. **Note**: This guide will be replaced with instructions on how to obtain API_KEY, API_SECRET_KEY, and ACCESS_TOKEN from Shopify for the config.