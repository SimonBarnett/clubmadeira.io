# Amazon Discount Finder with Flask and Wix Velo

Welcome to the Amazon Discount Finder project! This system allows users to browse discounted products from Amazon based on customizable categories, powered by a Flask backend and a Wix frontend with Velo.

## Project Overview

This project integrates a Flask backend with a Wix frontend to display and manage discounted products from Amazon. The Flask API uses Amazon's Product Advertising API (PAAPI) to fetch product data based on user-defined categories. The Wix site, enhanced with Velo, provides a dynamic interface to browse categories and view discounted products.

## Features

- Fetching discounted products from Amazon with a minimum discount percentage.
- Managing user-specific categories via Flask API endpoints (GET, PUT, PATCH, DELETE).
- Dynamic frontend on Wix using Velo to display categories and products fetched from the Flask API.
- Optional minimum discount input on the Wix site to filter products.

## Documentation

- **[Amazon Affiliation](affiliate.md)**: Becoming an affiliate.
- **[Velo Setup Instructions](velo.md)**: Step-by-step guide to setting up the Wix site with Velo.
- **[Velo Code](velo.js)**: Code Wix site with Velo.
- **[Flask API Documentation](flask.md)**: Detailed information on API endpoints, parameters, and responses.
- **[Flask Code](flask.py)**: Flask service.

## Setup Instructions

### Flask Backend Setup

1. **Install Dependencies**:
   - Ensure you have Python installed.
   - Install required packages using pip:
     ```bash
     pip install flask flask-cors amazon-paapi
     ```

2. **Set Up Amazon PAAPI Credentials**:
   - Open `app.py` in your code editor.
   - Replace the placeholders with your actual Amazon PAAPI credentials:
     ```python
     ACCESS_KEY = "YOUR_ACCESS_KEY"
     SECRET_KEY = "YOUR_SECRET_KEY"
     ASSOCIATE_TAG = "YOUR_ASSOCIATE_TAG"
     ```

3. **Run the Flask App**:
   - Save the Flask code as `app.py`.
   - Start the app from the terminal:
     ```bash
     python app.py
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
