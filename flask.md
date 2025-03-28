# Club Madeira API Documentation

This document provides a comprehensive overview of the API endpoints for the Club Madeira platform, organized by blueprint. Each endpoint includes its HTTP method, path, required permissions, and a detailed description. Permissions are indicated with colored badges to quickly identify access levels, and endpoints requiring authentication are marked with a `[JWT]` badge.

## How to Use This Documentation

Each section corresponds to a blueprint (e.g., `authentication_bp`, `content_bp`). For each endpoint, you’ll find:

- **HTTP Method Badge**: Indicates the request type (e.g., `![GET](https://img.shields.io/badge/GET-green)`).
- **Path**: The URL path (e.g., `/login`).
- **Permission Badges**: Show required or allowed permissions (e.g., `[Public]`, `[Self]`, `[Admin]`). If multiple permissions are listed (e.g., `[Partner]` `[Admin]`), having *any one* of those permissions grants access.
- **JWT Badge**: Indicates that a JWT token must be included in the `Authorization` header for authentication.
- **Description**: Explains the endpoint’s purpose.
- **Input**: Parameters or request body (if applicable).
- **Output**: Response format and status codes.
- **Examples**: Sample requests and responses where applicable.

For authenticated endpoints, include the JWT token in the `Authorization` header:

```bash
Authorization: Bearer {{bearer_token}}
```

Obtain the token via the `/login` endpoint.

**Note**: Internal code blocks use `@` delimiters (e.g., `@json`) instead of triple backticks.

## Permissions Overview

| Permission   | Description                                            | Badge                                             |
|--------------|--------------------------------------------------------|---------------------------------------------------|
| Public       | No authentication required; accessible to anyone.      | ![Public](https://img.shields.io/badge/-Public-green) |
| Self         | Requires authentication and access to the user’s own data. | ![Self](https://img.shields.io/badge/-Self-blue) |
| Admin        | Requires admin privileges.                             | ![Admin](https://img.shields.io/badge/-Admin-red) |
| AllAuth      | Any authenticated user.                                | ![AllAuth](https://img.shields.io/badge/-AllAuth-yellow) |
| Community    | Requires "community" permission.                       | ![Community](https://img.shields.io/badge/-Community-purple) |
| Merchant     | Requires "merchant" permission.                        | ![Merchant](https://img.shields.io/badge/-Merchant-orange) |
| Partner      | Requires "partner" permission.                         | ![Partner](https://img.shields.io/badge/-Partner-008080) |

---

## main

#### / ![GET](https://img.shields.io/badge/GET-green) - ![Public](https://img.shields.io/badge/-Public-green)

**Description:** The application’s root endpoint, serving as the default landing page (e.g., a login screen or homepage). Typically the first interaction point for users, kept simple and lightweight.

**Input:** None (query parameters could be added for redirects)

**Output:** HTML response (e.g., `login.html` or `index.html`)

---

## authentication_bp

#### /login ![POST](https://img.shields.io/badge/POST-blue) - ![Public](https://img.shields.io/badge/-Public-green)

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

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Example Response:**

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": "123"
}
```

**Response Fields:**

| Field     | Type   | Description          |
|-----------|--------|----------------------|
| status    | string | Status of the request|
| token     | string | JWT token            |
| user_id   | string | User ID              |

#### /signup ![GET](https://img.shields.io/badge/GET-green) - ![Public](https://img.shields.io/badge/-Public-green)

**Description:** Renders the signup page for user registration.

**Output:** HTML form (e.g., `signup.html`)

#### /signup ![POST](https://img.shields.io/badge/POST-blue) - ![Public](https://img.shields.io/badge/-Public-green)

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

```json
{
  "signup_type": "merchant",
  "contact_name": "John Doe",
  "signup_email": "john@example.com",
  "signup_password": "secure123",
  "signup_phone": "123-456-7890"
}
```

**Example Response:**

```json
{
  "status": "success",
  "message": "User created, please verify OTP"
}
```

**Response Fields:**

| Field     | Type   | Description          |
|-----------|--------|----------------------|
| status    | string | Status of the request|
| message   | string | Confirmation message |

#### /reset-password ![POST](https://img.shields.io/badge/POST-blue) - ![Public](https://img.shields.io/badge/-Public-green)

**Description:** Initiates a password reset by sending an OTP to the user's phone or email.

**Input:** JSON with:
- `email` (str): The user's email address.

**Output:**
- Success: JSON `{"status": "success", "message": "OTP sent"}`, status 200
- Errors:
  - 400: `{"status": "error", "message": "Email is required"}`
  - 404: `{"status": "error", "message": "User not found"}`

**Example Request:**

```json
{
  "email": "user@example.com"
}
```

**Example Response:**

```json
{
  "status": "success",
  "message": "OTP sent"
}
```

**Response Fields:**

| Field     | Type   | Description          |
|-----------|--------|----------------------|
| status    | string | Status of the request|
| message   | string | Confirmation message |

#### /verify-reset-code ![POST](https://img.shields.io/badge/POST-blue) - ![Public](https://img.shields.io/badge/-Public-green)

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

```json
{
  "email": "user@example.com",
  "code": "123456",
  "new_password": "newpassword123"
}
```

**Example Response:**

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": "123"
}
```

**Response Fields:**

| Field     | Type   | Description          |
|-----------|--------|----------------------|
| status    | string | Status of the request|
| token     | string | New JWT token        |
| user_id   | string | User ID              |

#### /update-password ![POST](https://img.shields.io/badge/POST-blue) - ![Self](https://img.shields.io/badge/-Self-blue) ![JWT](https://img.shields.io/badge/-JWT-gray)

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

```json
{
  "email": "user@example.com",
  "password": "newpassword123"
}
```

**Example Response:**

```json
{
  "status": "success",
  "message": "Password updated"
}
```

**Response Fields:**

| Field     | Type   | Description          |
|-----------|--------|----------------------|
| status    | string | Status of the request|
| message   | string | Confirmation message |

---

## content_bp

#### /deals ![GET](https://img.shields.io/badge/GET-green) - ![Public](https://img.shields.io/badge/-Public-green)

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

```bash
curl -X GET "https://clubmadeira.io/deals?category_id=123&min_discount=30"
```

**Example Response:**

```json
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
```

**Response Fields:**

| Field     | Type   | Description          |
|-----------|--------|----------------------|
| status    | string | Status of the request|
| count     | int    | Number of products   |
| products  | array  | List of product objects |
| min_discount | int | Minimum discount applied |

#### /categories ![GET](https://img.shields.io/badge/GET-green) - ![Public](https://img.shields.io/badge/-Public-green)

**Description:** Retrieves a list of product categories, either top-level or subcategories of a specified parent, using the Amazon API if configured, otherwise falls back to pseudo data. Checks all providers (Amazon UK, eBay UK, Awin UK, CJ UK, Wix) for available discounted products.

**Input:** 
- `parent_id` (query, optional): Parent Amazon Browse Node ID for subcategories.
- `min_discount` (query, optional): Minimum discount percentage for products (int). Default: 20.

**Output:**
- Success: JSON with category list, status 200
- Errors:
  - 500: `{"status": "error", "message": "Server error"}`

**Example Request:**

```bash
curl -X GET "https://clubmadeira.io/categories?parent_id=456&min_discount=30"
```

**Example Response:**

```json
{
  "status": "success",
  "count": 2,
  "categories": [
    {"id": "1025616", "name": "Fiction"},
    {"id": "1025612", "name": "Non-Fiction"}
  ],
  "min_discount": 30
}
```

**Response Fields:**

| Field     | Type   | Description          |
|-----------|--------|----------------------|
| status    | string | Status of the request|
| count     | int    | Number of categories |
| categories| array  | List of category objects |
| min_discount | int | Minimum discount applied |

---

## referral_bp

#### /<user_id>/visits ![GET](https://img.shields.io/badge/GET-green) - ![Self](https://img.shields.io/badge/-Self-blue) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Tracks visits to a user’s referral link and returns visit statistics.

**Input:** None

**Output:**
- Success: JSON with visit data, status 200
- Errors:
  - 403: `{"status": "error", "message": "Unauthorized"}`

**Example Response:**

```json
{
  "status": "success",
  "visits": 150,
  "user_id": "user123"
}
```

#### /<user_id>/referrals ![GET](https://img.shields.io/badge/GET-green) - ![Self](https://img.shields.io/badge/-Self-blue) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Retrieves referral statistics for the authenticated user.

**Input:** None

**Output:**
- Success: JSON with referral data, status 200
- Errors:
  - 403: `{"status": "error", "message": "Unauthorized"}`

**Example Response:**

```json
{
  "status": "success",
  "referrals": 10,
  "user_id": "user123"
}
```

---

## role_pages_bp

#### /dashboard ![GET](https://img.shields.io/badge/GET-green) - ![Self](https://img.shields.io/badge/-Self-blue) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Renders the user dashboard page.

**Output:** HTML response (e.g., `dashboard.html`)

#### /admin ![GET](https://img.shields.io/badge/GET-green) - ![Admin](https://img.shields.io/badge/-Admin-red) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Renders the admin dashboard page.

**Output:** HTML response (e.g., `admin.html`)

---

## site_request_bp

#### /site-request ![POST](https://img.shields.io/badge/POST-blue) - ![Self](https://img.shields.io/badge/-Self-blue) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Submits a site creation request for the authenticated user.

**Input:** JSON with:
- `site_type` (str): Type of site requested.
- `description` (str): Description of the site.

**Output:**
- Success: JSON `{"status": "success", "message": "Request submitted"}`, status 201
- Errors:
  - 400: `{"status": "error", "message": "Missing fields"}`

**Example Request:**

```json
{
  "site_type": "blog",
  "description": "A personal blog site"
}
```

**Example Response:**

```json
{
  "status": "success",
  "message": "Request submitted"
}
```

---

## manager_bp

#### /manage/users ![GET](https://img.shields.io/badge/GET-green) - ![Admin](https://img.shields.io/badge/-Admin-red) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Retrieves a list of all users for admin management.

**Output:**
- Success: JSON with user list, status 200
- Errors:
  - 403: `{"status": "error", "message": "Unauthorized"}`

**Example Response:**

```json
{
  "status": "success",
  "users": [
    {"id": "123", "email": "user@example.com"},
    {"id": "124", "email": "admin@example.com"}
  ]
}
```

---

## user_settings_bp

#### /settings ![GET](https://img.shields.io/badge/GET-green) - ![Self](https://img.shields.io/badge/-Self-blue) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Retrieves the authenticated user’s settings.

**Output:**
- Success: JSON with settings data, status 200
- Errors:
  - 403: `{"status": "error", "message": "Unauthorized"}`

**Example Response:**

```json
{
  "status": "success",
  "settings": {
    "email_notifications": true,
    "theme": "dark"
  }
}
```

#### /settings ![POST](https://img.shields.io/badge/POST-blue) - ![Self](https://img.shields.io/badge/-Self-blue) ![JWT](https://img.shields.io/badge/-JWT-gray)

**Description:** Updates the authenticated user’s settings.

**Input:** JSON with settings fields (e.g., `email_notifications`, `theme`).

**Output:**
- Success: JSON `{"status": "success", "message": "Settings updated"}`, status 200

**Example Request:**

```json
{
  "email_notifications": false,
  "theme": "light"
}
```

---

## utility_bp

#### /health ![GET](https://img.shields.io/badge/GET-green) - ![Public](https://img.shields.io/badge/-Public-green)

**Description:** Checks the health status of the API.

**Output:**
- Success: JSON `{"status": "success", "message": "API is healthy"}`, status 200

**Example Response:**

```json
{
  "status": "success",
  "message": "API is healthy"
}
```