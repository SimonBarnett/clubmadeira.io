# Shopify API Integration for Categories and Products

This guide explains how to integrate with Shopify to retrieve category and product information programmatically using the Shopify Admin API.

Below is a simple shopping cart icon to visualize the process:

<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTUuNTMgMi43M2wtMS4zOS0xLjM5Yy0uMzktLjM5LTEuMDMtLjM5LTEuNDIgMGwtMS4zOSAxLjM5IDQuMjMgNC4yM2gxMy42OHYtNS40NWgtMTMuN2MtLjI4IDAtLjU0LS4xMS0uNzUtLjMxeiIvPjxwYXRoIGQ9Ik0xOCAxOGMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTItLjktMiAyLTJzMiAuOSAyIDJoNGMxLjEgMCAyLS45IDItMnMtLjktMi0yLTJ6Ii8+PHBhdGggZD0iTTcgMTguMWMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTItLjktMiAyLTJzMiAuOSAyIDJoNGMxLjEgMCAyLS45IDItMnMtLjktMi0yLTJ6Ii8+PHBhdGggZD0iTTAgMjEuNDVsNy03LjI5IDExIDcuMjkiLz48L3N2Zz4=" alt="Shopping Cart Icon" width="24" height="24">

## Prerequisites
- A Shopify store with admin access.
- An app created in the Shopify Partner Dashboard or store settings to generate API credentials.

## Required Credentials
- **API Key**: Generated when you create a custom app in your Shopify store.
- **API Secret Key**: Paired with the API Key for authentication.
- **Access Token**: Obtained via OAuth or directly for private/custom apps.
- **Store URL**: Your Shopify store domain (e.g., `mystorename.myshopify.com`).

To get credentials:
1. Log in to your Shopify admin.
2. Go to **Settings > Apps and sales channels > Develop apps**.
3. Create a custom app, enable Admin API access with scopes `read_products` and `read_product_listings`.
4. Save to generate API Key, Secret Key, and Access Token.

## Authentication
Shopify uses HTTP Basic Auth or OAuth. For simplicity, use the Access Token in the header: