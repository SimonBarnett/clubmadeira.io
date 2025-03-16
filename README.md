# Amazon Discount Finder with Flask and Wix Velo

Welcome to the Amazon Discount Finder project! This system allows users to browse discounted products from Amazon based on customizable categories, powered by a Flask backend and a Wix frontend with Velo. Named after the Madeira River, a major tributary of the Amazon, this project reflects its role as a conduit for delivering Amazon product data to users.

## Project Overview

This project integrates a Flask backend with a Wix frontend to display and manage discounted products from Amazon. The Flask API uses Amazon's Product Advertising API (PAAPI) to fetch product data based on user-defined categories. The Wix site, enhanced with Velo, provides a dynamic interface to browse categories and view discounted products.

## Features

- Fetching discounted products from Amazon with a minimum discount percentage.
- Managing user-specific categories via Flask API endpoints (GET, PUT, PATCH, DELETE).
- Dynamic frontend on Wix using Velo to display categories and products fetched from the Flask API.
- Optional minimum discount input on the Wix site to filter products.
- User-defined product gateway for managing custom parts and stock updates.

## Documentation

- **[Amazon Affiliation](affiliate.md)**: Becoming an affiliate and joining the Amazon Associates program.
- **[Velo Setup Instructions](velo.md)**: Step-by-step guide to setting up the Wix site with Velo.
- **[Velo Code](velo.js)**: Code Wix site with Velo.
- **[Flask API Documentation](flask.md)**: Detailed information on API endpoints, parameters, and responses.
- **[Flask Code](madeira.py)**: Flask service.
- **[Madeira Scratch Card Authentication](checksum.md)**: Describes the cost of a scratch card authentication model for Madeira.

## Setup Instructions

### Flask Backend Setup

1. **Install Dependencies**:
   - Ensure you have Python installed.
   - Install required packages using pip:
     ```bash
     pip install flask flask-cors amazon-paapi requests
     ```

2. **Set Up Amazon PAAPI Credentials**:
   - Open `madeira.py` in your code editor.
   - Replace the placeholders with your actual Amazon PAAPI credentials and other affiliate network credentials:
     ```python
     "amazon_uk": {
         "ACCESS_KEY": "YOUR_ACCESS_KEY",
         "SECRET_KEY": "YOUR_SECRET_KEY",
         "ASSOCIATE_TAG": "YOUR_ASSOCIATE_TAG",
         "COUNTRY": "UK"
     },
     "ebay_uk": {
         "APP_ID": "YOUR_EBAY_APP_ID"
     },
     "awin": {
         "API_TOKEN": "YOUR_AWIN_API_TOKEN"
     },
     "cj": {
         "API_KEY": "YOUR_CJ_API_KEY",
         "WEBSITE_ID": "YOUR_CJ_WEBSITE_ID"
     }
     ```

3. **Run the Flask App**:
   - Save the Flask code as `madeira.py`.
   - Start the app from the terminal:
     ```bash
     python madeira.py
     ```
   - The API will be available at `http://localhost:5000`.

### Wix Frontend with Velo Setup

1. **Enable Velo**:
   - Log in to your Wix account and open the Wix Editor for your site.
   - Click the **Dev Mode** icon in the toolbar and turn on **Dev Mode**.

2. **Create a Dynamic Page**:
   - Add a new dynamic page named "Category" with the URL pattern `/category/{categoryId}`.

3. **Add Page Elements**:
   - Add repeaters to display subcategories and products.
   - Optionally, add an input field for setting the minimum discount percentage.

4. **Add Velo Script**:
   - In the Velo sidebar, open the `category.js` file.
   - Paste the provided Velo script into this file.
   - Update the `baseUrl` variable in the script to point to your Flask API (e.g., `http://localhost:5000` or your ngrok URL).

## User Part Gateway and Stock Updates

![NEW](https://img.shields.io/badge/NEW-green)

The User Part Gateway introduces a powerful feature for users to manage their own custom products (referred to as "parts") alongside the affiliate-sourced discounted products. This system allows users to define and maintain a personal inventory of products, which can be shared across a community via the `/club-products` endpoint, and includes a callback mechanism to update stock levels when sales occur.

- **Managing User Parts**:
  - Users can add, update, or delete custom products via the `/<USERid>/products` endpoints (POST, PUT, PATCH, DELETE).
  - Each product requires fields like `id`, `title`, `product_url`, `current_price`, `original_price`, `image_url`, and `QTY` (quantity).
  - These products are stored in a user-specific list and can be retrieved with the GET `/<USERid>/products` endpoint.

- **Club Products**:
  - The `/club-products` endpoint aggregates all user-defined products with a `QTY > 0` across all users, enabling a community-driven marketplace.

- **Stock Update Callback**:
  - When a sale occurs on a user’s website, the stock quantity (`QTY`) can be updated via the `GET /<USERid>/products/<product_id>` endpoint.
  - Example: After selling one unit of a product with ID `custom123`, a request like `GET /<USERid>/products/custom123?qty=-4` reduces the quantity by 4.
  - This ensures real-time stock management, reflecting availability accurately in the Wix frontend.

This feature enhances the project by allowing users to contribute their own products to the ecosystem, complementing the Amazon discount finder with a personalized inventory system.