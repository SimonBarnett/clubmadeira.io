# Wix Store API Settings

This document explains how to obtain the `API_TOKEN` and `SITE_ID` required to integrate with the Wix Stores API, as outlined in the [Wix Stores API documentation](https://dev.wix.com/api/rest/wix-stores).

## Prerequisites
- A Wix account with a store (e.g., a Wix site with the Stores app installed).
- Administrative access to your Wix site.
- A registered Wix app in the Wix Developers Center.

## Obtaining the API_TOKEN
The `API_TOKEN` is an OAuth access token used to authenticate API requests. Follow these steps:

1. **Log into Wix Developers Center**:
   - Go to [dev.wix.com](https://dev.wix.com/).
   - Sign in with your Wix account credentials.

2. **Create an App**:
   - Navigate to "My Apps" in the Developers Center.
   - Click "Create New App" and provide a name (e.g., "ClubMadeira Integration").
   - Save the app to generate its credentials.

3. **Get Client ID and Client Secret**:
   - In your app’s dashboard, go to the "OAuth" tab.
   - Note the `Client ID` and `Client Secret` (you’ll need these temporarily for OAuth).

4. **Set Up OAuth Flow**:
   - Use an OAuth 2.0 client or script to request an access token.
   - Redirect users to the authorization URL:
     ```
     https://www.wix.com/installer/install?appId={CLIENT_ID}&redirectUrl={YOUR_REDIRECT_URL}
     ```
   - After user approval, Wix redirects to your `redirectUrl` with a `code` parameter.

5. **Exchange Code for API_TOKEN**:
   - Make a POST request to:
     ```
     https://www.wix.com/oauth/access
     ```
     With the body:
     @@@json
     {
         "grant_type": "authorization_code",
         "client_id": "{CLIENT_ID}",
         "client_secret": "{CLIENT_SECRET}",
         "code": "{CODE_FROM_REDIRECT}"
     }
     @@@
   - Response includes the `access_token`, which is your `API_TOKEN`. Example:
     @@@json
     {
         "access_token": "your-api-token-here",
         "refresh_token": "your-refresh-token",
         "expires_in": 3600
     }
     @@@

6. **Store the API_TOKEN**:
   - Save this token securely for use in API requests.

## Obtaining the SITE_ID
The `SITE_ID` is the unique identifier for your Wix site.

1. **Access Your Site Dashboard**:
   - Log into your Wix account and open the site with the store.

2. **Find the Site ID**:
   - In the Wix Dashboard, go to "Settings" > "Developer Tools" (or use the Developers Center).
   - Alternatively, make an API call with your `API_TOKEN` to list sites:
     ```
     GET https://www.wixapis.com/site/v1/sites
     Authorization: Bearer {API_TOKEN}
     ```
   - Response includes site details:
     @@@json
     {
         "sites": [
             {
                 "id": "your-site-id-here",
                 "name": "Your Site Name",
                 ...
             }
         ]
     }
     @@@
   - The `id` field is your `SITE_ID`.

3. **Record the SITE_ID**:
   - Copy this value (e.g., a UUID like `9fa0f271-1600-4282-9fae-d841be6aaff6`) for integration.

## Usage
With `API_TOKEN` and `SITE_ID`, you can make authenticated requests to the Wix Stores API, such as retrieving products:
```
GET https://www.wixapis.com/stores/v1/products
Authorization: Bearer {API_TOKEN}
X-Wix-Site-Id: {SITE_ID}

```
Refer to the [Wix Stores API docs](https://dev.wix.com/api/rest/wix-stores) for full details.



