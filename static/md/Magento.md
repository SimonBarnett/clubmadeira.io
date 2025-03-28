# Magento API Integration for Categories and Products

This guide covers accessing category and product information from Magento using the Magento REST API.

## Prerequisites
- A Magento 2 store (Open Source or Commerce).
- Admin access to create integration credentials.

## Required Credentials
- **Access Token**: Generated via an integration or admin user.
- **Store URL**: Your Magento store domain (e.g., `https://mystorename.com`).

To get credentials:
1. Log in to Magento Admin.
2. Go to **System > Integrations > Add New Integration**.
3. Name it, set permissions for `Catalog > Categories` and `Catalog > Products`.
4. Save and activate to get an Access Token (OAuth-based).

Alternatively, use admin username/password to request a token:

@bash
curl -X POST "https://{storename}.com/rest/V1/integration/admin/token" \
-H "Content-Type: application/json" \
-d '{"username":"admin","password":"yourpassword"}'
@

- Response provides the Access Token.

## Authentication
Use the Access Token in the header:

Authorization: Bearer {access_token}

## Retrieving Categories
To get all categories:

@bash
curl -X GET "https://{storename}.com/rest/V1/categories" \
-H "Authorization: Bearer {access_token}"
@

- Endpoint: `GET /rest/V1/categories`
- Returns a category tree with IDs, names, and levels.

## Retrieving Products
To fetch all products:

@bash
curl -X GET "https://{storename}.com/rest/V1/products" \
-H "Authorization: Bearer {access_token}"
@

- Endpoint: `GET /rest/V1/products`
- Returns product SKUs, names, prices, and category IDs.
- Filter by category: Use search criteria, e.g., `?searchCriteria[filter_groups][0][filters][0][field]=category_id&searchCriteria[filter_groups][0][filters][0][value]={category_id}`.

## Notes
- Magento uses a complex EAV model; expect nested JSON responses.
- Rate limits depend on server setup (no strict default).
- Use `?searchCriteria[pageSize]=100` for pagination.

See [Magento API Docs](https://devdocs.magento.com/guides/v2.4/rest/bk-rest.html) for more.

