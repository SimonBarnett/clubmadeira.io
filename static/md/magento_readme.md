# Magento API Usage for Club Madeira

This document provides a detailed guide on using the Magento API to retrieve part category and part data for clubmadeira.io. This will later be replaced with instructions on how to obtain the API key details from Magento to use in the config.

## Prerequisites
- A Magento account (sign up at [https://magento.com/magento-commerce](https://magento.com/magento-commerce)).
- API credential (ACCESS_TOKEN) from Magento.
- Basic API knowledge.

## Step-by-Step Instructions

### Step 1: Verify API Credentials
Ensure you have your ACCESS_TOKEN from your Magento account (in config.json).

### Step 2: Access Magento API
Refer to the Magento REST API documentation: [https://devdocs.magento.com/guides/v2.4/rest/bk-rest.html](https://devdocs.magento.com/guides/v2.4/rest/bk-rest.html). Base URL: <STORE_URL>/rest/V1 (e.g., https://yourstore.com/rest/V1).

### Step 3: Retrieve Part Categories
API Endpoint: GET /categories. Request: Headers: Authorization: Bearer <ACCESS_TOKEN>. URL: <STORE_URL>/rest/V1/categories. Example with cURL: ``` curl -X GET "<STORE_URL>/rest/V1/categories" -H "Authorization: Bearer <ACCESS_TOKEN>" ``` Response: JSON with category data (e.g., {"id": 2, "name": "Brakes", "children_data": []}). Steps: 1. Replace <STORE_URL> and <ACCESS_TOKEN> with your config values. 2. Send the request. 3. Parse the response to list categories.

### Step 4: Retrieve Part Data
API Endpoint: GET /products. Request: Headers: Authorization: Bearer <ACCESS_TOKEN>. URL: <STORE_URL>/rest/V1/products?searchCriteria[filter_groups][0][filters][0][field]=category_id&searchCriteria[filter_groups][0][filters][0][value]=<category_id>. Example with cURL: ``` curl -X GET "<STORE_URL>/rest/V1/products?searchCriteria[filter_groups][0][filters][0][field]=category_id&searchCriteria[filter_groups][0][filters][0][value]=<category_id>" -H "Authorization: Bearer <ACCESS_TOKEN>" ``` Response: JSON with product data (e.g., {"items": [{"sku": "brakepad", "name": "Brake Pad", "price": "29.99"}]}). Steps: 1. Use a category_id from Step 3 (e.g., 2). 2. Send the request. 3. Parse the response to display parts.

### Step 5: Integrate with Club Madeira
Use the fetched data in clubmadeira.io (e.g., display parts in a catalog). Update your application to use these API calls with user-provided ACCESS_TOKEN and STORE_URL.

## Troubleshooting
- **401 Unauthorized**: Verify ACCESS_TOKEN is valid.
- **No Data**: Add categories and products in your Magento admin.

## Next Steps
Test with your Magento store data. **Note**: This guide will be replaced with instructions on how to obtain ACCESS_TOKEN from Magento for the config.