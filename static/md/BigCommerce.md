# BigCommerce API Settings for Categories and Products

This document details how to obtain the `API_TOKEN`, `CLIENT_ID`, `STORE_HASH`, and `STORE_URL` required for the BigCommerce API, as per the [BigCommerce API Reference](https://developer.bigcommerce.com/api-reference).

## Prerequisites
- A BigCommerce store account.
- Admin access to the store’s control panel.

## Obtaining the API_TOKEN
The `API_TOKEN` is a legacy API token for authenticating requests.

1. **Log into BigCommerce**:
   - Access your store’s control panel at `https://{your-store}.mybigcommerce.com/manage`.

2. **Navigate to API Settings**:
   - Go to "Settings" > "API" > "Store-level API accounts".

3. **Create an API Account**:
   - Click "Create API Account".
   - Name it (e.g., "ClubMadeira Integration").
   - Select scopes (e.g., "Products" and "Categories" set to "Modify").

4. **Generate and Save Credentials**:
   - Click "Save" to generate:
     - `API Token`: Your `API_TOKEN`.
     - `Client ID` and `Client Secret` (save these too; `Client ID` is needed later).
   - Download the credentials file or copy the `API Token`.

5. **Store the API_TOKEN**:
   - Example: `a1b2c3d4e5f6g7h8i9j0`.
   - Keep it secure.

## Obtaining the CLIENT_ID
- **Source**: Generated with the `API_TOKEN` in the API account creation step above.
- **Value**: A string like `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`.
- **Action**: Copy from the API account credentials.

## Obtaining the STORE_HASH
The `STORE_HASH` is a unique identifier for your store in BigCommerce’s API.

1. **Find Your Store Hash**:
   - In the API credentials file or control panel, it’s the part of the API path after `/stores/`.
   - Example API path: `https://api.bigcommerce.com/stores/{STORE_HASH}/v3/`.
   - Or, make a test API call (e.g., `GET /stores/{guess}/v3/catalog/products`) and adjust until it works.

2. **Record the STORE_HASH**:
   - Example: `abc123`.
   - Save this value.

## Obtaining the STORE_URL
The `STORE_URL` is your store’s domain.

1. **Get Your Store Domain**:
   - In the control panel, go to "Settings" > "Store Details".
   - Note the "Store URL" (e.g., `https://{your-store}.mybigcommerce.com`).

2. **Alternative Method**:
   - Use the storefront URL you access (e.g., `https://example-store.mybigcommerce.com`).

3. **Store the STORE_URL**:
   - Example: `https://example-store.mybigcommerce.com`.

## Usage
With these credentials, authenticate API requests:
```
GET https://api.bigcommerce.com/stores/{STORE_HASH}/v3/catalog/products
X-Auth-Token: {API_TOKEN}
X-Auth-Client: {CLIENT_ID}
Accept: application/json
```

See the [BigCommerce API Reference](https://developer.bigcommerce.com/api-reference) for more.

