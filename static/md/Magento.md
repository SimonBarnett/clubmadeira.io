# Magento API Settings for Categories and Products

This guide explains how to obtain the `ACCESS_TOKEN` and `STORE_URL` for the Magento REST API, detailed in the [Magento REST API documentation](https://devdocs.magento.com/guides/v2.4/rest/bk-rest.html).

## Prerequisites
- A Magento 2 store (self-hosted or cloud).
- Admin access to the Magento Admin Panel.

## Obtaining the ACCESS_TOKEN
The `ACCESS_TOKEN` is an OAuth or integration token for API access.

1. **Log into Magento Admin**:
   - Access `https://{your-store}/admin`.

2. **Create an Integration**:
   - Go to "System" > "Integrations".
   - Click "Add New Integration".
   - Name it (e.g., "ClubMadeira Integration").
   - Set permissions (e.g., "Catalog" > "Categories" and "Products").

3. **Activate the Integration**:
   - Save and activate the integration.
   - Approve the permissions prompt.

4. **Copy the ACCESS_TOKEN**:
   - After activation, Magento provides:
     - `Consumer Key`
     - `Consumer Secret`
     - `Access Token` (this is your `ACCESS_TOKEN`)
     - `Access Token Secret`
   - Example: `abcdefghijklmnopqrstuvwxyz123456`.
   - Save the `ACCESS_TOKEN` securely.

## Obtaining the STORE_URL
The `STORE_URL` is your Magento store’s base URL.

1. **Find Your Store URL**:
   - In the Admin Panel, go to "Stores" > "Configuration" > "General" > "Web".
   - Under "Base URLs", note the "Base URL" (e.g., `https://example.com`).

2. **Verify API Endpoint**:
   - The REST API base URL is typically `{STORE_URL}/rest` (e.g., `https://example.com/rest`).

3. **Store the STORE_URL**:
   - Example: `https://example.com`.

## Usage
Authenticate API requests with the token:
```
GET {STORE_URL}/rest/V1/products
Authorization: Bearer {ACCESS_TOKEN}
```

Refer to the [Magento REST API docs](https://devdocs.magento.com/guides/v2.4/rest/bk-rest.html) for endpoints.

