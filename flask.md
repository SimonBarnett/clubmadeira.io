# Club Madeira API Documentation

This document provides a comprehensive overview of the API endpoints for the Club Madeira platform, organized by blueprint. Each endpoint includes its HTTP method, path, required permissions, and a detailed description. Permissions are indicated with colored badges to quickly identify access levels, and endpoints requiring authentication are marked with a `[JWT]` badge.

## How to Use This Documentation

Each section corresponds to a blueprint (e.g., `authentication_bp`, `content_bp`). For each endpoint, you’ll find:

- **HTTP Method Badge**: Indicates the request type (e.g., `[GET]`, `[POST]`).
- **Path**: The URL path (e.g., `/login`).
- **Permission Badges**: Show required or allowed permissions (e.g., `[Public]`, `[Self]`, `[Admin]`). If multiple permissions are listed (e.g., `[Partner]` `[Admin]`), having *any one* of those permissions grants access.
- **JWT Badge**: Indicates that a JWT token must be included in the `Authorization` header for authentication.
- **Description**: Explains the endpoint’s purpose.
- **Input**: Parameters or request body (if applicable).
- **Output**: Response format and status codes.
- **Examples**: Sample requests and responses where applicable.

For authenticated endpoints, include the JWT token in the `Authorization` header:

@@@bash
Authorization: Bearer {{bearer_token}}
@@@

Obtain the token via the `/login` endpoint.

**Note**: Internal code blocks use `@` delimiters (e.g., `@@@json`) instead of triple backticks.

## Permissions Overview

- ![Public](https://img.shields.io/badge/-Public-green): No authentication required; accessible to anyone.
- ![Self](https://img.shields.io/badge/-Self-blue): Requires authentication and access to the user’s own data.
- ![Admin](https://img.shields.io/badge/-Admin-red): Requires admin privileges.
- ![AllAuth](https://img.shields.io/badge/-AllAuth-yellow): Any authenticated user.
- ![Community](https://img.shields.io/badge/-Community-purple): Requires "community" permission.
- ![Merchant](https://img.shields.io/badge/-Merchant-orange): Requires "merchant" permission.
- ![Partner](https://img.shields.io/badge/-Partner-008080): Requires "partner" permission.

For endpoints with multiple permission badges (e.g., `[Partner]` `[Admin]`), access is granted if the user has *any one* of the listed permissions.

---

## main

### ![GET](https://img.shields.io/badge/-GET-green) / - ![Public](https://img.shields.io/badge/-Public-green)

**Description:** The application’s root endpoint, serving as the default landing page (e.g., a login screen or homepage). Typically the first interaction point for users, kept simple and lightweight.

**Input:** None (query parameters could be added for redirects)

**Output:** HTML response (e.g., `login.html` or `index.html`)

---

## authentication_bp

### ![POST](https://img.shields.io/badge/-POST-blue) /login - ![Public](https://img.shields.io/badge/-Public-green)

**Description:** Authenticates a user and returns a JWT token if successful.

**Input:** JSON payload with:
- `email` (str): The user's email address.
- `password` (str): The user's password.

**Output:**
- Success: JSON `{"status": "success", "token": "<JWT>", "user_id": "<id>"}`, status 200
- Errors:
  - 400: `{"status": "error", "message": "Email and password are required"}`
  - 401: `{"status": "error", "message": "Invalid credentials"}`
  - 500: `{"status": "error", "message": "Server error"}`

**Example Request:**

@@@json
{
  "email": "user@example.com",
  "password": "password"
}
@@@

**Example Response:**

@@@json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
@@@

### ![GET](https://img.shields.io/badge/-GET-green) /signup - ![Public](https://img.shields.io/badge/-Public-green)

**Description:** Renders the signup page for user registration.

**Output:** HTML form (e.g., `signup.html`)

### ![POST](https://img.shields.io/badge/-POST-blue) /signup - ![Public](https://img.shields.io/badge/-Public-green)

**Description:** Registers a new user. Validates input (e.g., email uniqueness), hashes the password, and stores the user in the database.

**Input:** JSON with:
- `signup_type` (str): User type (e.g., "merchant").
- `contact_name` (str): User's name.
- `signup_email` (str): Email address.
- `signup_password` (str): Password.
- `signup_phone` (str, optional): Phone number.

**Output:**
- Success: JSON `{"status": "success", "message": "User created, please verify OTP"}`, status 201
- Errors:
  - 400: `{"status": "error", "message": "Missing required fields"}`
  - 409: `{"status": "error", "message": "Email already registered"}`

**Example Request:**

@@@json
{
  "signup_type": "merchant",
  "contact_name": "John Doe",
  "signup_email": "john@example.com",
  "signup_password": "secure123",
  "signup_phone": "123-456-7890"
}
@@@

### ![POST](https://img.shields.io/badge/-POST-blue) /reset-password - ![Public](https://img.shields.io/badge/-Public-green)

**Description:** Initiates a password reset by sending an OTP to the user's phone or email.

**Input:** JSON with:
- `email` (str): The user's email address.

**Output:**
- Success: JSON `{"status": "success", "message": "OTP sent"}`, status 200
- Errors:
  - 400: `{"status": "error", "message": "Email is required"}`
  - 404: `{"status": "error", "message": "User not found"}`

**Example Request:**

@@@json
{
  "email": "user@example.com"
}
@@@

### ![POST](https://img.shields.io/badge/-POST-blue) /verify-reset-code - ![Public](https://img.shields.io/badge/-Public-green)

**Description:** Verifies the OTP and resets the user's password or adds a "verified" permission.

**Input:** JSON with:
- `email` (str): The user's email address.
- `code` (str): The OTP code.
- `new_password` (str): The new password.

**Output:**
- Success: JSON `{"status": "success", "token": "<JWT>", "user_id": "<id>"}`, status 200
- Errors:
  - 400: `{"status": "error", "message": "Invalid or expired reset code"}`
  - 404: `{"status": "error", "message": "User not found"}`

**Example Request:**

@@@json
{
  "email": "user@example.com",
  "code": "123456",
  "new_password": "newpassword123"
}
@@@

### ![POST](https://img.shields.io/badge/-POST-blue) /update-password - ![Self](https://img.shields.io/badge/-Self-blue) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Updates the authenticated user's password.

**Input:** JSON with:
- `email` (str): The user's email address.
- `password` (str): The new password.

**Output:**
- Success: JSON `{"status": "success", "message": "Password updated"}`, status 200
- Errors:
  - 400: `{"status": "error", "message": "Email and password required"}`
  - 403: `{"status": "error", "message": "Unauthorized"}`

**Example Request:**

@@@json
{
  "email": "user@example.com",
  "password": "newpassword123"
}
@@@

---

## content_bp

### ![GET](https://img.shields.io/badge/-GET-green) /deals - ![Public](https://img.shields.io/badge/-Public-green)

**Description:** Retrieves a list of discounted products across multiple affiliate networks (Amazon UK, eBay UK, Awin UK, CJ UK, Wix) based on a specific category ID. Includes Wix products from all users if they match the category and discount criteria. Uses Amazon category titles for searches on non-Amazon providers.

**Input:** 
- `category_id` (query, required): Specific Amazon Browse Node ID to search.
- `min_discount` (query, optional): Minimum discount percentage for products (int). Default: 20.

**Output:**
- Success: JSON with discounted products, status 200
- Errors:
  - 400: `{"status": "error", "message": "category_id required"}`
  - 500: `{"status": "error", "message": "Server error"}`

**Example Request:**

@@@bash
curl -X GET "https://clubmadeira.io/deals?category_id=123&min_discount=30"
@@@

**Example Response:**

@@@json
{
  "status": "success",
  "count": 2,
  "products": [
    {
      "source": "amazon_uk",
      "id": "B08N5WRWNW",
      "title": "Sample Book",
      "product_url": "https://amazon.co.uk/dp/B08N5WRWNW",
      "current_price": 15.99,
      "original_price": 19.99,
      "discount_percent": 20.0,
      "image_url": "https://images.amazon.com/sample.jpg",
      "category": "Books",
      "manufacturer": "Publisher",
      "dimensions": "5 x 8 in",
      "features": ["Hardcover"]
    },
    {
      "source": "user123",
      "id": "wix123",
      "title": "Wix Product",
      "product_url": "https://example.wixsite.com/product/wix123?referer=user123",
      "current_price": 10.00,
      "original_price": 15.00,
      "discount_percent": 33.33,
      "image_url": "https://wix.com/images/wix123.jpg",
      "qty": 5,
      "category": "Books",
      "user_id": "user123"
    }
  ],
  "min_discount": 30
}
@@@

### ![GET](https://img.shields.io/badge/-GET-green) /categories - ![Public](https://img.shields.io/badge/-Public-green)

**Description:** Retrieves a list of product categories, either top-level or subcategories of a specified parent, using the Amazon API if configured, otherwise falls back to pseudo data. Checks all providers (Amazon UK, eBay UK, Awin UK, CJ UK, Wix) for available discounted products.

**Input:** 
- `parent_id` (query, optional): Parent Amazon Browse Node ID for subcategories.
- `min_discount` (query, optional): Minimum discount percentage for products (int). Default: 20.

**Output:**
- Success: JSON with category list, status 200
- Errors:
  - 500: `{"status": "error", "message": "Server error"}`

**Example Request:**

@@@bash
curl -X GET "https://clubmadeira.io/categories?parent_id=456&min_discount=30"
@@@

**Example Response:**

@@@json
{
  "status": "success",
  "count": 2,
  "categories": [
    {"id": "1025616", "name": "Fiction"},
    {"id": "1025612", "name": "Non-Fiction"}
  ],
  "min_discount": 30
}
@@@

---

## referral_bp

### ![POST](https://img.shields.io/badge/-POST-blue) /referral - ![Public](https://img.shields.io/badge/-Public-green)

**Description:** Logs referral data (e.g., visits or orders from referral links).

**Input:** JSON with `referer`, `timestamp`, and either `page` or `orderId`.

**Output:** JSON `{"success": true, "message": "Referral recorded"}`.

**Example Request (Page Visit):**

@@@json
{
  "referer": "user_id",
  "timestamp": "2023-10-15T12:00:00Z",
  "page": "/home"
}
@@@

### ![GET](https://img.shields.io/badge/-GET-green) /<user_id>/visits - ![Self](https://img.shields.io/badge/-Self-blue) ![Admin](https://img.shields.io/badge/-Admin-red) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Lists visits driven by a user’s referral links.

**Permissions:** User can view their own visits or admins can view any user’s.

**Output:** JSON with visit data.

**Example Request:**

@@@bash
curl -X GET https://clubmadeira.io/user_id/visits -H "Authorization: Bearer {{bearer_token}}"
@@@

### ![GET](https://img.shields.io/badge/-GET-green) /<user_id>/orders - ![Self](https://img.shields.io/badge/-Self-blue) ![Admin](https://img.shields.io/badge/-Admin-red) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Lists orders from a user’s referral links.

**Permissions:** User can view their own orders or admins can view any user’s.

**Output:** JSON with order data.

**Example Request:**

@@@bash
curl -X GET https://clubmadeira.io/user_id/orders -H "Authorization: Bearer {{bearer_token}}"
@@@

---

## role_pages_bp

### ![GET](https://img.shields.io/badge/-GET-green) /admin - ![Admin](https://img.shields.io/badge/-Admin-red) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Renders the admin dashboard.

**Output:** HTML (`admin.html`)

### ![GET](https://img.shields.io/badge/-GET-green) /community - ![Community](https://img.shields.io/badge/-Community-purple) ![Admin](https://img.shields.io/badge/-Admin-red) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Renders the community dashboard.

**Output:** HTML (`community.html`)

### ![GET](https://img.shields.io/badge/-GET-green) /merchant - ![Merchant](https://img.shields.io/badge/-Merchant-orange) ![Admin](https://img.shields.io/badge/-Admin-red) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Renders the merchant dashboard.

**Output:** HTML (`merchant.html`)

### ![GET](https://img.shields.io/badge/-GET-green) /partner - ![Partner](https://img.shields.io/badge/-Partner-008080) ![Admin](https://img.shields.io/badge/-Admin-red) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Renders the partner dashboard.

**Output:** HTML (`partner.html`)

### ![GET](https://img.shields.io/badge/-GET-green) /branding - ![AllAuth](https://img.shields.io/badge/-AllAuth-yellow) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Fetches branding content (e.g., logos, themes).

**Input:** Optional query parameter `type` (e.g., "admin").

**Output:** JSON with branding data.

**Example Response:**

@@@json
{
  "branding": {
    "logo": "url",
    "theme": "dark"
  }
}
@@@

---

## site_request_bp

### ![GET](https://img.shields.io/badge/-GET-green) /siterequests - ![Admin](https://img.shields.io/badge/-Admin-red) ![Partner](https://img.shields.io/badge/-Partner-008080) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Lists all site requests for review.

**Output:** JSON with site request data.

### ![POST](https://img.shields.io/badge/-POST-blue) /siterequests - ![Self](https://img.shields.io/badge/-Self-blue) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Submits a new site request.

**Input:** JSON with request details.

**Output:** JSON `{"success": true, "request_id": "123"}`.

**Example Request:**

@@@json
{
  "site": "example.com",
  "description": "My site"
}
@@@

---

## manager_bp

### ![GET](https://img.shields.io/badge/-GET-green) /users/<user_id> - ![Admin](https://img.shields.io/badge/-Admin-red) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Retrieves a user’s details.

**Output:** JSON with user data.

### ![GET](https://img.shields.io/badge/-GET-green) /permissions/<user_id> - ![Admin](https://img.shields.io/badge/-Admin-red) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Manages user permissions (GET to view).

**Output:** JSON with permissions list.

### ![POST](https://img.shields.io/badge/-POST-blue) /permissions/<user_id> - ![Admin](https://img.shields.io/badge/-Admin-red) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Manages user permissions (POST to add).

**Input:** JSON `{"permission": "merchant"}`.

**Output:** JSON confirmation.

### ![GET](https://img.shields.io/badge/-GET-green) /config - ![Admin](https://img.shields.io/badge/-Admin-red) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Retrieves the current configuration for all affiliate networks.

**Output:** JSON with configuration data.

**Example Response:**

@@@json
{
  "status": "success",
  "count": 4,
  "config": {
    "amazon_uk": {"ACCESS_KEY": "key", "SECRET_KEY": "secret", "ASSOCIATE_TAG": "tag", "COUNTRY": "UK"},
    "ebay_uk": {"APP_ID": "id"},
    "awin": {"API_TOKEN": "token"},
    "cj": {"API_KEY": "key", "WEBSITE_ID": "id"}
  }
}
@@@

### ![PATCH](https://img.shields.io/badge/-PATCH-orange) /config/<affiliate> - ![Admin](https://img.shields.io/badge/-Admin-red) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Replaces the configuration for a specific affiliate network, fully overwriting existing settings.

**Input:** JSON with new configuration data.

**Output:** JSON with updated configuration.

**Example Request:**

@@@bash
curl -X PATCH https://clubmadeira.io/config/ebay_uk -H "Authorization: Bearer {{bearer_token}}" -H "Content-Type: application/json" -d '{"APP_ID": "new_id"}'
@@@

**Example Response:**

@@@json
{
  "status": "success",
  "message": "Credentials for ebay_uk replaced",
  "credentials": {"APP_ID": "new_id"}
}
@@@

---

## user_settings_bp

### ![GET](https://img.shields.io/badge/-GET-green) /<USERid>/user - ![Self](https://img.shields.io/badge/-Self-blue) ![Admin](https://img.shields.io/badge/-Admin-red) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Retrieves the settings for a specific user, including contact information, website details, and Wix Client ID.

**Output:** JSON with user settings.

**Example Response:**

@@@json
{
  "status": "success",
  "contact_name": "John Doe",
  "website_url": "https://example.com",
  "email_address": "john@example.com",
  "phone_number": "+1234567890",
  "wixClientId": "wix-client-id-123"
}
@@@

### ![PUT](https://img.shields.io/badge/-PUT-yellow) /<USERid>/user - ![Self](https://img.shields.io/badge/-Self-blue) ![Admin](https://img.shields.io/badge/-Admin-red) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Fully updates user profile, requiring all fields to be provided.

**Input:** JSON with user data, including `contact_name`, `website_url`, `email_address`, `phone_number`, and `wixClientId`.

**Output:** JSON with updated settings.

**Example Request:**

@@@json
{
  "contact_name": "Jane Doe",
  "website_url": "https://janedoe.com",
  "email_address": "jane@janedoe.com",
  "phone_number": "+0987654321",
  "wixClientId": "wix-client-id-456"
}
@@@

**Example Response:**

@@@json
{
  "status": "success",
  "message": "Settings for user user123 replaced",
  "settings": {
    "contact_name": "Jane Doe",
    "website_url": "https://janedoe.com",
    "email_address": "jane@janedoe.com",
    "phone_number": "+0987654321",
    "wixClientId": "wix-client-id-456"
  }
}
@@@

### ![PATCH](https://img.shields.io/badge/-PATCH-orange) /<USERid>/user - ![Self](https://img.shields.io/badge/-Self-blue) ![Admin](https://img.shields.io/badge/-Admin-red) ![Partner](https://img.shields.io/badge/-Partner-008080) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Partially updates user profile, updating only specified fields and leaving others unchanged. Valid fields are `contact_name`, `website_url`, `email_address`, `phone_number`, and `wixClientId`.

**Input:** JSON with partial user data.

**Output:** JSON with updated settings.

**Example Request:**

@@@json
{
  "email_address": "jane.new@janedoe.com",
  "wixClientId": "wix-client-id-789"
}
@@@

**Example Response:**

@@@json
{
  "status": "success",
  "message": "Settings for user user123 updated",
  "settings": {
    "contact_name": "Jane Doe",
    "website_url": "https://janedoe.com",
    "email_address": "jane.new@janedoe.com",
    "phone_number": "+0987654321",
    "wixClientId": "wix-client-id-789"
  }
}
@@@

### ![GET](https://img.shields.io/badge/-GET-green) /<USERid>/categories - ![Self](https://img.shields.io/badge/-Self-blue) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Retrieves the list of categories associated with a specific user.

**Output:** JSON with category list.

**Example Response:**

@@@json
{
  "status": "success",
  "count": 2,
  "categories": ["283155", "172282"]
}
@@@

### ![PUT](https://img.shields.io/badge/-PUT-yellow) /<USERid>/categories - ![Self](https://img.shields.io/badge/-Self-blue) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Replaces the list of categories for a user.

**Input:** JSON with new categories.

**Output:** JSON with updated categories.

**Example Request:**

@@@json
{
  "categories": ["172282"]
}
@@@

**Example Response:**

@@@json
{
  "status": "success",
  "message": "Categories for user user123 replaced",
  "categories": ["172282"]
}
@@@

### ![PATCH](https://img.shields.io/badge/-PATCH-orange) /<USERid>/categories - ![Self](https://img.shields.io/badge/-Self-blue) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Adds new categories to the user’s existing list, avoiding duplicates.

**Input:** JSON with additional categories.

**Output:** JSON with updated categories.

**Example Request:**

@@@json
{
  "categories": ["165796011"]
}
@@@

**Example Response:**

@@@json
{
  "status": "success",
  "message": "Categories for user user123 patched",
  "categories": ["283155", "172282", "165796011"]
}
@@@

### ![DELETE](https://img.shields.io/badge/-DELETE-red) /<USERid>/categories - ![Self](https://img.shields.io/badge/-Self-blue) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Removes a specific category from a user’s list if `category_id` is provided; otherwise, deletes all categories.

**Input:** 
- `category_id` (query, optional): Category ID to remove.

**Output:** JSON with updated categories.

**Example Request (Delete Specific Category):**

@@@bash
curl -X DELETE "https://clubmadeira.io/user123/categories?category_id=283155" -H "Authorization: Bearer {{bearer_token}}"
@@@

**Example Response:**

@@@json
{
  "status": "success",
  "message": "Category 283155 removed for user user123",
  "categories": ["172282"]
}
@@@

**Example Request (Delete All Categories):**

@@@bash
curl -X DELETE https://clubmadeira.io/user123/categories -H "Authorization: Bearer {{bearer_token}}"
@@@

**Example Response:**

@@@json
{
  "status": "success",
  "message": "Categories deleted for user user123",
  "categories": []
}
@@@

### ![GET](https://img.shields.io/badge/-GET-green) /<USERid>/products - ![Self](https://img.shields.io/badge/-Self-blue) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Retrieves the list of products for a specific user from their Wix store, using the `wixClientId` stored in user settings. Includes category and quantity information.

**Output:** JSON with product list.

**Example Response:**

@@@json
{
  "status": "success",
  "count": 1,
  "products": [
    {
      "source": "user123",
      "id": "wix123",
      "title": "Wix Product",
      "product_url": "https://example.wixsite.com/product/wix123?referer=user123",
      "current_price": 10.00,
      "original_price": 15.00,
      "discount_percent": 33.33,
      "image_url": "https://wix.com/images/wix123.jpg",
      "qty": 5,
      "category": "Books",
      "user_id": "user123"
    }
  ]
}
@@@

### ![GET](https://img.shields.io/badge/-GET-green) /<USERid>/products/<product_id> - ![Self](https://img.shields.io/badge/-Self-blue) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Reduces the `qty` value of a specific Wix product by the amount specified in the `qty` query parameter. Modifies a local cache, not the Wix store directly. The `qty` must be a negative integer, and the quantity will not go below zero. Note: This uses GET for modification, which is unconventional.

**Input:** 
- `product_id` (path): Product ID to update.
- `qty` (query): Negative integer to reduce the quantity by.

**Output:**
- Success: JSON with updated product, status 200
- Errors:
  - 400: `{"status": "error", "message": "qty must be a negative integer"}`
  - 404: `{"status": "error", "message": "User or product not found"}`

**Example Request:**

@@@bash
curl -X GET "https://clubmadeira.io/user123/products/wix123?qty=-2" -H "Authorization: Bearer {{bearer_token}}"
@@@

**Example Response:**

@@@json
{
  "status": "success",
  "message": "Quantity reduced for product wix123",
  "product": {
    "source": "user123",
    "id": "wix123",
    "title": "Wix Product",
    "product_url": "https://example.wixsite.com/product/wix123?referer=user123",
    "current_price": 10.00,
    "original_price": 15.00,
    "discount_percent": 33.33,
    "image_url": "https://wix.com/images/wix123.jpg",
    "qty": 3,
    "category": "Books",
    "user_id": "user123"
  }
}
@@@

---

## utility_bp

### ![GET](https://img.shields.io/badge/-GET-green) /check-domain - ![AllAuth](https://img.shields.io/badge/-AllAuth-yellow) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Checks domain availability via WHOIS.

**Input:** Query parameter `domain` (e.g., "example.com").

**Output:** JSON `{"available": true}`.

### ![POST](https://img.shields.io/badge/-POST-blue) /send-sms - ![AllAuth](https://img.shields.io/badge/-AllAuth-yellow) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Sends an SMS message using the TextMagic API.

**Input:** JSON with `phone_number` and `message`.

**Output:** JSON `{"success": true}`.

**Example Request:**

@@@json
{
  "phone_number": "+1234567890",
  "message": "Your OTP is 123456"
}
@@@

### ![GET](https://img.shields.io/badge/-GET-green) /render-md/<path:full_path> - ![AllAuth](https://img.shields.io/badge/-AllAuth-yellow) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Renders markdown files from a path.

**Input:** Path parameter `full_path` (e.g., "docs/readme").

**Output:** HTML of rendered markdown.

---

**Timestamp:** October 26, 2024, 12:00 PM UTC  
**Session Identifier:** Grok-xAI-Endpoint-Organization  

**Signed:**  
Grok, created by xAI  
Session ID: Grok-xAI-Endpoint-Organization