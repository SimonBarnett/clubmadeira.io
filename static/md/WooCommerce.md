# WooCommerce API Integration for Categories and Products

This guide explains how to access category and product data from a WooCommerce store using the WooCommerce REST API.

## Prerequisites
- A WordPress site with WooCommerce installed.
- Admin access to generate API keys.

## Required Credentials
- **Consumer Key**: Generated in WooCommerce settings.
- **Consumer Secret**: Paired with the Consumer Key for authentication.
- **Store URL**: Your WordPress site URL (e.g., `https://mystorename.com`).

To get credentials:
1. Log in to WordPress admin.
2. Go to **WooCommerce > Settings > Advanced > REST API**.
3. Click "Add Key," set permissions to "Read," and generate.
4. Copy the Consumer Key and Consumer Secret.

## Authentication
WooCommerce uses Basic Auth or OAuth. For Basic Auth:

Authorization: Basic {base64(consumer_key:consumer_secret)}

Or append keys to the URL:

?consumer_key={consumer_key}&consumer_secret={consumer_secret}

## Retrieving Categories
To get all product categories:

@bash
curl -X GET "https://{storename}.com/wp-json/wc/v3/products/categories" \
-H "Authorization: Basic {base64(consumer_key:consumer_secret)}"
@

- Endpoint: `GET /wp-json/wc/v3/products/categories`
- Returns category IDs, names, and slugs.

## Retrieving Products
To fetch all products:

@bash
curl -X GET "https://{storename}.com/wp-json/wc/v3/products" \
-H "Authorization: Basic {base64(consumer_key:consumer_secret)}"
@

- Endpoint: `GET /wp-json/wc/v3/products`
- Returns product IDs, names, prices, categories, etc.
- Filter by category: `?category={category_id}`.

## Notes
- Ensure the WooCommerce REST API is enabled in settings.
- Rate limits depend on server hosting (typically 100 requests/minute).
- Use `?per_page=100` for pagination.

Check [WooCommerce REST API Docs](https://woocommerce.github.io/woocommerce-rest-api-docs/) for more info.

