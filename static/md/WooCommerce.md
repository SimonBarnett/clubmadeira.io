# WooCommerce API Settings for Categories and Products

This document outlines how to get the `CONSUMER_KEY`, `CONSUMER_SECRET`, and `STORE_URL` for the WooCommerce REST API, per the [WooCommerce REST API Docs](https://woocommerce.github.io/woocommerce-rest-api-docs/).

## Prerequisites
- A WordPress site with WooCommerce installed.
- Admin access to the WordPress dashboard.

## Obtaining the CONSUMER_KEY and CONSUMER_SECRET
These are API keys for authenticating requests.

1. **Log into WordPress Admin**:
   - Access `https://{your-store}/wp-admin`.

2. **Navigate to WooCommerce Settings**:
   - Go to "WooCommerce" > "Settings" > "Advanced" > "REST API".

3. **Add a Key**:
   - Click "Add Key".
   - Enter a description (e.g., "ClubMadeira Integration").
   - Select a user with admin rights.
   - Set permissions to "Read/Write".

4. **Generate and Save Keys**:
   - Click "Generate API Key".
   - Copy:
     - `Consumer Key` (e.g., `ck_1234567890abcdef1234567890abcdef12345678`)
     - `Consumer Secret` (e.g., `cs_1234567890abcdef1234567890abcdef12345678`)
   - Save these securely as they won’t be shown again.

## Obtaining the STORE_URL
The `STORE_URL` is your WooCommerce store’s domain.

1. **Find Your Store URL**:
   - In WordPress, go to "Settings" > "General".
   - Note the "Site Address (URL)" (e.g., `https://example.com`).

2. **Store the STORE_URL**:
   - Example: `https://example.com`.

## Usage
Make API requests with basic auth:
```
GET {STORE_URL}/wp-json/wc/v3/products
Authorization: Basic {Base64 encoded CONSUMER_KEY:CONSUMER_SECRET}
```
Or use query parameters:

GET {STORE_URL}/wp-json/wc/v3/products?consumer_key={CONSUMER_KEY}&consumer_secret={CONSUMER_SECRET}

See the [WooCommerce API Docs](https://w

