# Wix Store API Usage for Club Madeira

This document provides a detailed guide on using the Wix Stores API to retrieve part category and part data for clubmadeira.io. This will later be replaced with instructions on how to obtain the API key details from Wix to use in the config.

## Prerequisites
- A Wix account with a store (sign up at [https://www.wix.com/signup](https://www.wix.com/signup)).
- API credentials (API_TOKEN, SITE_ID) from Wix.
- Basic API knowledge (e.g., REST, JSON).

## Step-by-Step Instructions

### Step 1: Verify API Credentials
Ensure you have your API_TOKEN and SITE_ID from your Wix account (to be added to config.json).

### Step 2: Access Wix Stores API
Refer to the Wix Stores API documentation: [https://dev.wix.com/api/rest/wix-stores](https://dev.wix.com/api/rest/wix-stores). Base URL: https://www.wixapis.com/stores/v1.

### Step 3: Retrieve Part Categories
API Endpoint: GET /catalog/categories. Request: Headers: Authorization: Bearer <API_TOKEN>. URL: https://www.wixapis.com/stores/v1/catalog/categories?siteId=<SITE_ID>. Example with cURL: ``` curl -X GET "https://www.wixapis.com/stores/v1/catalog/categories?siteId=<SITE_ID>" -H "Authorization: Bearer <API_TOKEN>" ``` Response: JSON with category data (e.g., {"categories": [{"id": "cat1", "name": "Brakes"}]}). Steps: 1. Replace <API_TOKEN> and <SITE_ID> with your config values. 2. Send the request. 3. Parse the response to list categories (e.g., "Brakes", "Engines").

### Step 4: Retrieve Part Data
API Endpoint: GET /catalog/products. Request: Headers: Authorization: Bearer <API_TOKEN>. URL: https://www.wixapis.com/stores/v1/catalog/products?siteId=<SITE_ID>&categoryId=<category_id>. Example with cURL: ``` curl -X GET "https://www.wixapis.com/stores/v1/catalog/products?siteId=<SITE_ID>&categoryId=<category_id>" -H "Authorization: Bearer <API_TOKEN>" ``` Response: JSON with product data (e.g., {"products": [{"id": "prod1", "name": "Brake Pad", "price": "29.99"}]}). Steps: 1. Use a category_id from Step 3 (e.g., cat1). 2. Send the request. 3. Parse the response to display parts (e.g., "Brake Pad - $29.99").

### Step 5: Integrate with Club Madeira
Use the fetched data in clubmadeira.io (e.g., display categories and parts in a search interface). Update your application code to handle these API calls dynamically with user-provided API_TOKEN and SITE_ID.

## Troubleshooting
- **401 Unauthorized**: Verify API_TOKEN is correct and not expired.
- **No Data**: Ensure categories and products are added to your Wix Store.

## Next Steps
Test API calls with your Wix Store data. **Note**: This guide will be replaced with instructions on how to obtain API_TOKEN and SITE_ID from Wix for the config.