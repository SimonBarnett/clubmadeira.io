# API Endpoints Documentation

This document outlines the API endpoints for the Flask application, categorized into **Velo Endpoints** (for frontend integration) and **Management Endpoints** (for configuration and user category/product management). Each endpoint includes its HTTP method, parameters, descriptions, and default values where applicable.

---

## Velo Endpoints

These endpoints are designed for integration with the Velo frontend, providing category and discounted product data.

### Get Discounted Products
![GET](https://img.shields.io/badge/GET-blue)

- **Endpoint**: `/<USERid>/discounted-products`
- **Description**: Retrieves a list of discounted products across multiple affiliate networks (Amazon UK, eBay UK, Awin UK, CJ UK, Wix) based on user categories or a specific category ID. Uses Amazon category titles for searches on non-Amazon providers. Includes Wix products from all users if they match the category and discount criteria.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| `category_id`   | Specific Amazon Browse Node ID to search         | None          |
| `min_discount`  | Minimum discount percentage for products (int)   | 20            |

- **Example Request**:
  ```bash
  curl http://localhost:5000/user123/discounted-products?category_id=283155&min_discount=30
  ```

- **Example Response**:
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

### Get Categories
![GET](https://img.shields.io/badge/GET-blue)

- **Endpoint**: `/<USERid>/categories`
- **Description**: Fetches either root categories with discounted products or subcategories of a specified parent category, filtered by minimum discount percentage. Checks all providers (Amazon UK, eBay UK, Awin UK, CJ UK, Wix) for available products.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| `parent_id`     | Parent Amazon Browse Node ID for subcategories   | None          |
| `min_discount`  | Minimum discount percentage for products (int)   | 20            |

- **Example Request**:
  ```bash
  curl http://localhost:5000/user123/categories?parent_id=283155
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "count": 2,
    "categories": [
      {"id": "1025616", "name": "Fiction"},
      {"id": "1025612", "name": "Non-Fiction"}
    ],
    "min_discount": 20
  }
  ```

### Get All Products (No User Constraint)
![GET](https://img.shields.io/badge/GET-blue)

- **Endpoint**: `/discounted-products`
- **Description**: Retrieves a list of all products (discounted or not) across all affiliate networks (Amazon UK, eBay UK, Awin UK, CJ UK, Wix) for a specific category ID. Does not filter by user categories or minimum discount percentage.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| `category_id`   | Specific Amazon Browse Node ID to search (required) | None       |

- **Example Request**:
  ```bash
  curl http://localhost:5000/discounted-products?category_id=283155
  ```

- **Example Response**:
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
    ]
  }
  ```

---

## Management Endpoints

These endpoints handle configuration and user category/product management, divided into **Config Management**, **User Settings Management**, **User Category Management**, and **User Product Management**.

### Config Management

#### Get Config
![GET](https://img.shields.io/badge/GET-blue)

- **Endpoint**: `/config`
- **Description**: Retrieves the current configuration for all affiliate networks.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| None            | No parameters required                           | N/A           |

- **Example Request**:
  ```bash
  curl http://localhost:5000/config
  ```

- **Example Response**:
  ```json
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
  ```

#### Replace Config
![PATCH](https://img.shields.io/badge/PATCH-yellow)

- **Endpoint**: `/config/<affiliate>`
- **Description**: Replaces the configuration for a specific affiliate network with new values provided in the request body, overwriting existing settings.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| `affiliate`     | Name of the affiliate network (e.g., amazon_uk)  | None          |

- **Example Request**:
  ```bash
  curl -X PATCH -H "Content-Type: application/json" -d '{"APP_ID": "new_id"}' http://localhost:5000/config/ebay_uk
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "message": "Credentials for ebay_uk replaced",
    "credentials": {"APP_ID": "new_id"}
  }
  ```

### User Settings Management

#### Get User Settings
![GET](https://img.shields.io/badge/GET-blue)

- **Endpoint**: `/<USERid>/user`
- **Description**: Retrieves the settings for a specific user, including contact information, website details, and Wix Client ID.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| None            | No parameters required                           | N/A           |

- **Example Request**:
  ```bash
  curl http://localhost:5000/user123/user
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "contact_name": "John Doe",
    "website_url": "https://example.com",
    "email_address": "john@example.com",
    "phone_number": "+1234567890",
    "wixClientId": "wix-client-id-123"
  }
  ```

#### Replace User Settings
![PUT](https://img.shields.io/badge/PUT-orange)

- **Endpoint**: `/<USERid>/user`
- **Description**: Replaces the entire settings object for a user. Requires all fields: `contact_name`, `website_url`, `email_address`, `phone_number`, and `wixClientId`.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| None            | Requires JSON body with settings object          | N/A           |

- **Example Request**:
  ```bash
  curl -X PUT -H "Content-Type: application/json" -d '{"contact_name": "Jane Doe", "website_url": "https://janedoe.com", "email_address": "jane@janedoe.com", "phone_number": "+0987654321", "wixClientId": "wix-client-id-456"}' http://localhost:5000/user123/user
  ```

- **Example Response**:
  ```json
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
  ```

#### Update User Settings
![PATCH](https://img.shields.io/badge/PATCH-yellow)

- **Endpoint**: `/<USERid>/user`
- **Description**: Updates specific fields in the user’s settings, leaving unspecified fields unchanged. Valid fields are `contact_name`, `website_url`, `email_address`, `phone_number`, and `wixClientId`.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| None            | Requires JSON body with partial settings object  | N/A           |

- **Example Request**:
  ```bash
  curl -X PATCH -H "Content-Type: application/json" -d '{"email_address": "jane.new@janedoe.com", "wixClientId": "wix-client-id-789"}' http://localhost:5000/user123/user
  ```

- **Example Response**:
  ```json
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
  ```

### User Category Management

#### Get User Categories
![GET](https://img.shields.io/badge/GET-blue)

- **Endpoint**: `/<USERid>/mycategories`
- **Description**: Retrieves the list of categories associated with a specific user.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| None            | No parameters required                           | N/A           |

- **Example Request**:
  ```bash
  curl http://localhost:5000/user123/mycategories
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "count": 2,
    "categories": ["283155", "172282"]
  }
  ```

#### Replace User Categories
![PUT](https://img.shields.io/badge/PUT-orange)

- **Endpoint**: `/<USERid>/mycategories`
- **Description**: Replaces the list of categories for a user.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| None            | Requires JSON body with "categories" list        | N/A           |

- **Example Request**:
  ```bash
  curl -X PUT -H "Content-Type: application/json" -d '{"categories": ["172282"]}' http://localhost:5000/user123/mycategories
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "message": "Categories for user user123 replaced",
    "categories": ["172282"]
  }
  ```

#### Patch User Categories
![PATCH](https://img.shields.io/badge/PATCH-yellow)

- **Endpoint**: `/<USERid>/mycategories`
- **Description**: Adds new categories to a user’s existing list, avoiding duplicates.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| None            | Requires JSON body with "categories" list        | N/A           |

- **Example Request**:
  ```bash
  curl -X PATCH -H "Content-Type: application/json" -d '{"categories": ["165796011"]}' http://localhost:5000/user123/mycategories
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "message": "Categories for user user123 patched",
    "categories": ["283155", "172282", "165796011"]
  }
  ```

#### Delete User Category
![DELETE](https://img.shields.io/badge/DELETE-red)

- **Endpoint**: `/<USERid>/mycategories`
- **Description**: Removes a specific category from a user’s list.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| `category_id`   | Category ID to remove                            | None          |

- **Example Request**:
  ```bash
  curl -X DELETE http://localhost:5000/user123/mycategories?category_id=283155
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "message": "Category 283155 removed for user user123",
    "categories": ["172282"]
  }
  ```

#### Get All Categories
![GET](https://img.shields.io/badge/GET-blue)

- **Endpoint**: `/categories`
- **Description**: Retrieves all available categories, either top-level or subcategories of a specified parent, using Amazon API if configured, otherwise pseudo data.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| `parent_id`     | Parent category ID to fetch subcategories        | None          |

- **Example Request**:
  ```bash
  curl http://localhost:5000/categories?parent_id=283155
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "count": 2,
    "categories": [
      {"id": "1025616", "name": "Fiction"},
      {"id": "1025612", "name": "Non-Fiction"}
    ]
  }
  ```

### User Product Management

User-defined products are fetched from Wix using the `wixClientId` stored in user settings.

#### Get User Products
![GET](https://img.shields.io/badge/GET-blue)

- **Endpoint**: `/<USERid>/products`
- **Description**: Retrieves the list of products for a specific user from their Wix store, including category and quantity information.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| None            | No parameters required                           | N/A           |

- **Example Request**:
  ```bash
  curl http://localhost:5000/user123/products
  ```

- **Example Response**:
  ```json
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
  ```

#### Reduce Product Quantity
![GET](https://img.shields.io/badge/GET-blue)

- **Endpoint**: `/<USERid>/products/<product_id>`
- **Description**: Reduces the `qty` value of a specific Wix product by the amount specified in the `qty` query parameter. The `qty` must be a negative integer. The quantity will not go below zero. Note: This does not update the Wix store directly but modifies the local cache.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| `product_id`    | Product ID to update (path)                      | None          |
| `qty`           | Negative integer to reduce the quantity by (query)| None         |

- **Example Request**:
  ```bash
  curl "http://localhost:5000/user123/products/wix123?qty=-2"
  ```

- **Example Response**:
  ```json
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
  ```

- **Notes**:
  - The `qty` parameter must be a negative integer. Positive values or zero will result in a **400 Bad Request** error.
  - If the reduction would cause `qty` to go below zero, it will be set to zero.
  - This endpoint uses GET for modification, which is unconventional but implemented as per specific requirements.
  - Returns a **400 Bad Request** if `qty` is missing, not an integer, or not negative.
  - Returns a **404 Not Found** if the user or product does not exist.

---

## Key Updates

- **Wix Integration**: Products are sourced from Wix using the `wixClientId` from user settings. The `/<USERid>/products` endpoint fetches from Wix instead of a local store.
- **New Endpoint**: `/discounted-products` (no USERid) retrieves all products for a given category ID across all providers without discount filtering.
- **Discounted Products**: The `/<USERid>/discounted-products` endpoint includes Wix products from all users matching the category and discount criteria.
- **User Settings**: Added `wixClientId` as a required field for user settings to enable Wix API integration.
- **Product Fields**: Wix products include `source` (set to `user_id`), `qty` (instead of `QTY`), and `product_url` with `?referer={user_id}` suffix. Non-Wix products exclude `savings` field, with discount calculated from `original_price` and `current_price`.

Replace `<USERid>` with the actual user ID when making requests.