# API Documentation

## Base URL
`http://<host>:5000`

## Endpoints

### Get Discounted Products
**GET** `/<USERid>/discounted-products`

**Description:** Fetch discounted products for a user.

**Query Parameters:**
- `category_id` (optional): Specific category ID to search within.
- `min_discount` (optional, default=20): Minimum discount percentage.

**Response:**
- `status`: "success" or "error"
- `count`: Number of products found
- `products`: List of discounted products
- `min_discount`: Minimum discount percentage used in the search

### Get Categories
**GET** `/<USERid>/categories`

**Description:** Fetch categories for a user.

**Query Parameters:**
- `parent_id` (optional): Parent category ID to fetch subcategories.
- `min_discount` (optional, default=20): Minimum discount percentage.

**Response:**
- `status`: "success" or "error"
- `count`: Number of categories found
- `categories`: List of categories
- `min_discount`: Minimum discount percentage used in the search

### Replace User Categories
**PUT** `/<USERid>/categories`

**Description:** Replace categories for a user.

**Request Body:**
- `categories`: List of new categories

**Response:**
- `status`: "success" or "error"
- `message`: Description of the result
- `categories`: Updated list of categories

### Patch User Categories
**PATCH** `/<USERid>/categories`

**Description:** Add new categories to a user's existing categories.

**Request Body:**
- `categories`: List of new categories to add

**Response:**
- `status`: "success" or "error"
- `message`: Description of the result
- `categories`: Updated list of categories

### Delete User Category
**DELETE** `/<USERid>/categories`

**Description:** Remove a category from a user's categories.

**Query Parameters:**
- `category_id`: Category ID to remove

**Response:**
- `status`: "success" or "error"
- `message`: Description of the result
- `categories`: Updated list of categories

## Example Requests

### Get Discounted Products
```bash
curl -X GET "http://<host>:5000/12345/discounted-products?category_id=283155&min_discount=30"
curl -X GET "http://<host>:5000/12345/categories?parent_id=172282&min_discount=25"
curl -X PUT "http://<host>:5000/12345/categories" -H "Content-Type: application/json" -d '{"categories": ["283155", "172282"]}'
curl -X PATCH "http://<host>:5000/12345/categories" -H "Content-Type: application/json" -d '{"categories": ["283155"]}'
curl -X DELETE "http://<host>:5000/12345/categories?category_id=283155"
```