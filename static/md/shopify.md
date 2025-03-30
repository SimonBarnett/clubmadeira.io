# Shopify API Settings for Categories and Products

This guide details how to obtain the `ACCESS_TOKEN`, `API_KEY`, `API_SECRET_KEY`, and `STORE_URL` for the Shopify Admin REST API, per the [Shopify API Docs](https://shopify.dev/api/admin-rest).

## Prerequisites
- A Shopify store.
- Admin access to the Shopify admin panel.

## Obtaining the API_KEY and API_SECRET_KEY
These are credentials for a custom app.

1. **Log into Shopify Admin**:
   - Access `https://{your-store}.myshopify.com/admin`.

2. **Create a Custom App**:
   - Go to "Apps" > "App and sales channel settings" > "Develop apps".
   - Click "Create an app".
   - Name it (e.g., "ClubMadeira Integration").

3. **Configure Admin API Scopes**:
   - In the app settings, go to "Configuration" > "Admin API integration".
   - Enable scopes (e.g., `read_products`, `write_products`, `read_product_listings`).

4. **Get API Credentials**:
   - Go to "API credentials".
   - Copy:
     - `API Key` (e.g., `1234567890abcdef1234567890abcdef`)
     - `API Secret Key` (e.g., `abcdef1234567890abcdef1234567890`)
   - Save these securely.

## Obtaining the ACCESS_TOKEN
The `ACCESS_TOKEN` is an admin API token.

1. **Generate an Admin API Token**:
   - In the same "API credentials" section, under "Admin API access token", click "Generate API token".
   - Select the same scopes as above.
   - Copy the token (e.g., `shpat_1234567890abcdef1234567890abcdef`).

2. **Store the ACCESS_TOKEN**:
   - Save it securely.

## Obtaining the STORE_URL
The `STORE_URL` is your Shopify store’s domain.

1. **Find Your Store URL**:
   - In the admin panel, it’s the URL you log into (e.g., `https://{your-store}.myshopify.com`).

2. **Store the STORE_URL**:
   - Example: `https://example-store.myshopify.com`.

## Usage
Authenticate API requests with the token:
```
GET {STORE_URL}/admin/api/2023-10/products.json
X-Shopify-Access-Token: {ACCESS_TOKEN}
```

