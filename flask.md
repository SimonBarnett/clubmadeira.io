# API Endpoints Documentation

This document outlines the API endpoints for the Flask application, categorized into Velo Endpoints (for frontend integration) and Management Endpoints (for configuration and user category/product management). Each endpoint includes its HTTP method, parameters, descriptions, and default values.

## Velo Endpoints

These endpoints are designed for integration with the Velo frontend, providing category and discounted product data.

### Get Discounted Products
![GET](https://img.shields.io/badge/GET-blue)

- **Endpoint**: `/<USERid>/discounted-products`
- **Description**: Retrieves a list of discounted products across multiple affiliate networks (Amazon UK, eBay UK, Awin UK, CJ UK) and user-defined products based on user categories or a specific category ID. Uses Amazon category titles for searches on non-Amazon providers.

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
      },
      {
        "source": "user_defined",
        "id": "custom123",
        "title": "Custom Product",
        "current_price": 10.00,
        "original_price": 15.00,
        "discount_percent": 33,
        "product_url": "https://example.com/custom123"
      }
    ],
    "min_discount": 30
  }
  ```

### Get Categories
![GET](https://img.shields.io/badge/GET-blue)

- **Endpoint**: `/<USERid>/categories`
- **Description**: Fetches either root categories with discounted products or subcategories of a specified parent category, filtered by minimum discount percentage.

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

## Management Endpoints

These endpoints handle configuration and user category/product management, divided into Config Management, User Category Management, and User Product Management.

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
      "ebay_uk": {"APP_ID": "id"}
    }
  }
  ```

#### Replace Config
![PUT](https://img.shields.io/badge/PUT-orange)

- **Endpoint**: `/config/<affiliate>`
- **Description**: Replaces the configuration for a specific affiliate network.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| `affiliate`     | Name of the affiliate network (e.g., amazon_uk)  | None          |

- **Example Request**:
  ```bash
  curl -X PUT -H "Content-Type: application/json" -d '{"APP_ID": "new_id"}' http://localhost:5000/config/ebay_uk
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "message": "Credentials for ebay_uk replaced",
    "credentials": {"APP_ID": "new_id"}
  }
  ```

#### Delete Config
![DELETE](https://img.shields.io/badge/DELETE-red)

- **Endpoint**: `/config/<affiliate>`
- **Description**: Deletes the configuration for a specific affiliate network.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| `affiliate`     | Name of the affiliate network (e.g., amazon_uk)  | None          |

- **Example Request**:
  ```bash
  curl -X DELETE http://localhost:5000/config/ebay_uk
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "message": "Credentials for ebay_uk deleted",
    "config": {"amazon_uk": {"ACCESS_KEY": "key", "SECRET_KEY": "secret", "ASSOCIATE_TAG": "tag", "COUNTRY": "UK"}}
  }
  ```

### User Category Management

#### Replace User Categories
![PUT](https://img.shields.io/badge/PUT-orange)

- **Endpoint**: `/<USERid>/categories`
- **Description**: Replaces the list of categories for a user.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| None            | Requires JSON body with "categories" list        | N/A           |

- **Example Request**:
  ```bash
  curl -X PUT -H "Content-Type: application/json" -d '{"categories": ["172282"]}' http://localhost:5000/<USERid>/categories
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

- **Endpoint**: `/<USERid>/categories`
- **Description**: Adds new categories to a user’s existing list, avoiding duplicates.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| None            | Requires JSON body with "categories" list        | N/A           |

- **Example Request**:
  ```bash
  curl -X PATCH -H "Content-Type: application/json" -d '{"categories": ["165796011"]}' http://localhost:5000/<USERid>/categories
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

- **Endpoint**: `/<USERid>/categories`
- **Description**: Removes a specific category from a user’s list.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| `category_id`   | Category ID to remove                            | None          |

- **Example Request**:
  ```bash
  curl -X DELETE http://localhost:5000/<USERid>/categories?category_id=283155
  ```

- **Example Response**:
  ```json
  {
    "status": "success",
    "message": "Category 283155 removed for user <USERid>",
    "categories": ["172282"]
  }
  ```

### User Product Management

#### Get User Products
![GET](https://img.shields.io/badge/GET-blue)

- **Endpoint**: `/<USERid>/products`
- **Description**: Retrieves the list of user-defined products for a specific user.

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
        "discount_percent": 33,
        "product_url": "https://example.com/custom123"
      }
    ]
  }
  ```

#### Add User Product
![POST](https://img.shields.io/badge/POST-green)

- **Endpoint**: `/<USERid>/products`
- **Description**: Adds a new user-defined product to the user’s list. Requires specific fields in the JSON body.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| None            | Requires JSON body with "product" object         | N/A           |

- **Example Request**:
  ```bash
  curl -X POST -H "Content-Type: application/json" -d '{"product": {"id": "custom123", "title": "Custom Product", "product_url": "https://example.com/custom123", "current_price": 10.00, "original_price": 15.00, "discount_percent": 33}}' http://localhost:5000/<USERid>/products
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
      "discount_percent": 33,
      "product_url": "https://example.com/custom123"
    }
  }
  ```

#### Replace User Products
![PUT](https://img.shields.io/badge/PUT-orange)

- **Endpoint**: `/<USERid>/products`
- **Description**: Replaces the entire list of user-defined products for a user.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| None            | Requires JSON body with "products" list          | N/A           |

- **Example Request**:
  ```bash
  curl -X PUT -H "Content-Type: application/json" -d '{"products": [{"id": "custom123", "title": "Custom Product", "product_url": "https://example.com/custom123", "current_price": 10.00, "original_price": 15.00, "discount_percent": 33}]}' http://localhost:5000/<USERid>/products
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
        "discount_percent": 33,
        "product_url": "https://example.com/custom123"
      }
    ]
  }
  ```

#### Patch User Products
![PATCH](https://img.shields.io/badge/PATCH-yellow)

- **Endpoint**: `/<USERid>/products`
- **Description**: Updates the user’s product list by adding or replacing products, preserving existing ones not in the new list.

| Parameter       | Description                                      | Default Value |
|-----------------|--------------------------------------------------|---------------|
| None            | Requires JSON body with "products" list          | N/A           |

- **Example Request**:
  ```bash
  curl -X PATCH -H "Content-Type: application/json" -d '{"products": [{"id": "custom124", "title": "New Product", "product_url": "https://example.com/custom124", "current_price": 20.00, "original_price": 25.00, "discount_percent": 20}]}' http://localhost:5000/<USERid>/products
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
        "discount_percent": 33,
        "product_url": "https://example.com/custom123"
      },
      {
        "source": "user_defined",
        "id": "custom124",
        "title": "New Product",
        "current_price": 20.00,
        "original_price": 25.00,
        "discount_percent": 20,
        "product_url": "https://example.com/custom124"
      }
    ]
  }
  ```

#### Delete User Product
![DELETE](https://img.shields.io/badge/DELETE-red)

- **Endpoint**: `/<USERid>/products`
- **Description**: Removes a specific user-defined product from the user’s list.

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