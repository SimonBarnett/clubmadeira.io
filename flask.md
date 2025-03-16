# API Endpoints Documentation

This document outlines the API endpoints for the Flask application, categorized into Velo Endpoints (for frontend integration) and Management Endpoints (for configuration and user category/product management). Each endpoint includes its HTTP method, parameters, descriptions, and default values.

## Velo Endpoints

These endpoints are designed for integration with the Velo frontend, providing category and discounted product data.

### Get Discounted Products
![GET](https://img.shields.io/badge/GET-blue)

- **Endpoint**: `/<USERid>/discounted-products`
- **Description**: Retrieves a list of discounted products across multiple affiliate networks (Amazon UK, eBay UK, Awin UK, CJ UK) based on user categories or a specific category ID. Uses Amazon category titles for searches on non-Amazon providers. Does not include user-defined products.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| `category_id`   | Specific Amazon Browse Node ID to search         | None          |
| `min_discount`  | Minimum discount percentage for products (int)   | 20            |

- **Example Request**:
  ```bash
  curl http://localhost:5000/<USERid>/discounted-products?category_id=283155&min_discount=30
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "count": 5,
    "products": [
      {
        "source": "amazon_uk",
        "id": "B08N5WRWNW",
        "title": "Sample Book",
        "current_price": 15.99,
        "savings": 4.00,
        "original_price": 19.99,
        "discount_percent": 20,
        "product_url": "https://amazon.co.uk/dp/B08N5WRWNW",
        "manufacturer": "Publisher",
        "dimensions": "5 x 8 in",
        "features": ["Hardcover"],
        "image_url": "https://images.amazon.com/sample.jpg"
      }
    ],
    "min_discount": 30
  }
  ```

### Get Categories
![GET](https://img.shields.io/badge/GET-blue)

- **Endpoint**: `/<USERid>/categories`
- **Description**: Fetches either root categories with discounted products or subcategories of a specified parent category, filtered by minimum discount percentage. Checks all providers (Amazon UK, eBay UK, Awin UK, CJ UK) for available products, not just Amazon.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| `parent_id`     | Parent Amazon Browse Node ID for subcategories   | None          |
| `min_discount`  | Minimum discount percentage for products (int)   | 20            |

- **Example Request**:
  ```bash
  curl http://localhost:5000/<USERid>/categories?parent_id=283155
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

### Get Club Products
![GET](https://img.shields.io/badge/GET-blue)

- **Endpoint**: `/club-products`
- **Description**: Retrieves a list of all user-defined products (parts) across all users where `QTY > 0`. Aggregates products from the user-defined product store.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| None            | No parameters required                           | N/A           |

- **Example Request**:
  ```bash
  curl http://localhost:5000/club-products
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "count": 2,
    "products": [
      {
        "source": "user_defined",
        "id": "custom123",
        "title": "Custom Product",
        "current_price": 10.00,
        "original_price": 15.00,
        "product_url": "https://example.com/custom123",
        "image_url": "https://example.com/images/custom123.jpg",
        "QTY": 5
      }
    ]
  }
  ```

## Management Endpoints

These endpoints handle configuration and user category/product management, divided into Config Management, User Settings Management, User Category Management, and User Product Management.

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
- **Description**: Updates the configuration for a specific affiliate network with new values provided in the request body, merging with existing settings.

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
- **Description**: Retrieves the settings for a specific user, including contact information and website details.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| None            | No parameters required                           | N/A           |

- **Example Request**:
  ```bash
  curl http://localhost:5000/<USERid>/user
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "contact_name": "John Doe",
    "website_url": "https://example.com",
    "email_address": "john@example.com",
    "phone_number": "+1234567890"
  }
  ```

#### Replace User Settings
![PUT](https://img.shields.io/badge/PUT-orange)

- **Endpoint**: `/<USERid>/user`
- **Description**: Replaces the entire settings object for a user. Requires all fields: `contact_name`, `website_url`, `email_address`, and `phone_number`.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| None            | Requires JSON body with settings object          | N/A           |

- **Example Request**:
  ```bash
  curl -X PUT -H "Content-Type: application/json" -d '{"contact_name": "Jane Doe", "website_url": "https://janedoe.com", "email_address": "jane@janedoe.com", "phone_number": "+0987654321"}' http://localhost:5000/<USERid>/user
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "message": "Settings for user <USERid> replaced",
    "settings": {
      "contact_name": "Jane Doe",
      "website_url": "https://janedoe.com",
      "email_address": "jane@janedoe.com",
      "phone_number": "+0987654321"
    }
  }
  ```

#### Update User Settings
![PATCH](https://img.shields.io/badge/PATCH-yellow)

- **Endpoint**: `/<USERid>/user`
- **Description**: Updates specific fields in the user’s settings, leaving unspecified fields unchanged.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| None            | Requires JSON body with partial settings object  | N/A           |

- **Example Request**:
  ```bash
  curl -X PATCH -H "Content-Type: application/json" -d '{"email_address": "jane.new@janedoe.com"}' http://localhost:5000/<USERid>/user
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "message": "Settings for user <USERid> updated",
    "settings": {
      "contact_name": "Jane Doe",
      "website_url": "https://janedoe.com",
      "email_address": "jane.new@janedoe.com",
      "phone_number": "+0987654321"
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
  curl http://localhost:5000/<USERid>/mycategories
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
  curl -X PUT -H "Content-Type: application/json" -d '{"categories": ["172282"]}' http://localhost:5000/<USERid>/mycategories
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "message": "Categories for user <USERid> replaced",
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
  curl -X PATCH -H "Content-Type: application/json" -d '{"categories": ["165796011"]}' http://localhost:5000/<USERid>/mycategories
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "message": "Categories for user <USERid> patched",
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
  curl -X DELETE http://localhost:5000/<USERid>/mycategories?category_id=283155
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "message": "Category 283155 removed for user <USERid>",
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

#### Get User Products
![GET](https://img.shields.io/badge/GET-blue)

- **Endpoint**: `/<USERid>/products`
- **Description**: Retrieves the list of user-defined products (parts) for a specific user.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| None            | No parameters required                           | N/A           |

- **Example Request**:
  ```bash
  curl http://localhost:5000/<USERid>/products
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "count": 1,
    "products": [
      {
        "source": "user_defined",
        "id": "custom123",
        "title": "Custom Product",
        "current_price": 10.00,
        "original_price": 15.00,
        "product_url": "https://example.com/custom123",
        "image_url": "https://example.com/images/custom123.jpg",
        "QTY": 5
      }
    ]
  }
  ```

#### Add User Product
![POST](https://img.shields.io/badge/POST-green)

- **Endpoint**: `/<USERid>/products`
- **Description**: Adds a new user-defined product (part) to the user’s list. Requires specific fields in the JSON body, including `image_url` and `QTY`.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| None            | Requires JSON body with "product" object         | N/A           |

- **Example Request**:
  ```bash
  curl -X POST -H "Content-Type: application/json" -d '{"product": {"id": "custom123", "title": "Custom Product", "product_url": "https://example.com/custom123", "current_price": 10.00, "original_price": 15.00, "image_url": "https://example.com/images/custom123.jpg", "QTY": 5}}' http://localhost:5000/<USERid>/products
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "message": "Product added for user <USERid>",
    "product": {
      "source": "user_defined",
      "id": "custom123",
      "title": "Custom Product",
      "current_price": 10.00,
      "original_price": 15.00,
      "product_url": "https://example.com/custom123",
      "image_url": "https://example.com/images/custom123.jpg",
      "QTY": 5
    }
  }
  ```

#### Replace User Products
![PUT](https://img.shields.io/badge/PUT-orange)

- **Endpoint**: `/<USERid>/products`
- **Description**: Replaces the entire list of user-defined products (parts) for a user. Each product must include `image_url` and `QTY`.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| None            | Requires JSON body with "products" list          | N/A           |

- **Example Request**:
  ```bash
  curl -X PUT -H "Content-Type: application/json" -d '{"products": [{"id": "custom123", "title": "Custom Product", "product_url": "https://example.com/custom123", "current_price": 10.00, "original_price": 15.00, "image_url": "https://example.com/images/custom123.jpg", "QTY": 5}]}' http://localhost:5000/<USERid>/products
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "message": "Products for user <USERid> replaced",
    "products": [
      {
        "source": "user_defined",
        "id": "custom123",
        "title": "Custom Product",
        "current_price": 10.00,
        "original_price": 15.00,
        "product_url": "https://example.com/custom123",
        "image_url": "https://example.com/images/custom123.jpg",
        "QTY": 5
      }
    ]
  }
  ```

#### Patch User Products
![PATCH](https://img.shields.io/badge/PATCH-yellow)

- **Endpoint**: `/<USERid>/products`
- **Description**: Updates the user’s product list by adding or replacing products (parts), preserving existing ones not in the new list. Each new product must include `image_url` and `QTY`.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| None            | Requires JSON body with "products" list          | N/A           |

- **Example Request**:
  ```bash
  curl -X PATCH -H "Content-Type: application/json" -d '{"products": [{"id": "custom124", "title": "New Product", "product_url": "https://example.com/custom124", "current_price": 20.00, "original_price": 25.00, "image_url": "https://example.com/images/custom124.jpg", "QTY": 3}]}' http://localhost:5000/<USERid>/products
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "message": "Products for user <USERid> updated",
    "products": [
      {
        "source": "user_defined",
        "id": "custom123",
        "title": "Custom Product",
        "current_price": 10.00,
        "original_price": 15.00,
        "product_url": "https://example.com/custom123",
        "image_url": "https://example.com/images/custom123.jpg",
        "QTY": 5
      },
      {
        "source": "user_defined",
        "id": "custom124",
        "title": "New Product",
        "current_price": 20.00,
        "original_price": 25.00,
        "product_url": "https://example.com/custom124",
        "image_url": "https://example.com/images/custom124.jpg",
        "QTY": 3
      }
    ]
  }
  ```

#### Delete User Product
![DELETE](https://img.shields.io/badge/DELETE-red)

- **Endpoint**: `/<USERid>/products`
- **Description**: Removes a specific user-defined product (part) from the user’s list.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| `product_id`    | Product ID to remove                             | None          |

- **Example Request**:
  ```bash
  curl -X DELETE http://localhost:5000/<USERid>/products?product_id=custom123
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "message": "Product custom123 removed for user <USERid>",
    "products": []
  }
  ```

#### Update Product Quantity
![PUT](https://img.shields.io/badge/PUT-orange)

- **Endpoint**: `/<USERid>/products/<product_id>`
- **Description**: Updates the `QTY` value of a specific user-defined product (part) when a sale is made on the user’s website.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| `product_id`    | Product ID to update (path)                      | None          |
| `qty`           | New quantity value (query, int)                  | None          |

- **Example Request**:
  ```bash
  curl -X PUT http://localhost:5000/<USERid>/products/custom123?qty=4
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "message": "Quantity updated for product custom123 for user <USERid>",
    "product": {
      "source": "user_defined",
      "id": "custom123",
      "title": "Custom Product",
      "current_price": 10.00,
      "original_price": 15.00,
      "product_url": "https://example.com/custom123",
      "image_url": "https://example.com/images/custom123.jpg",
      "QTY": 4
    }
  }
  ```