# Installing the Velo Script in Wix

This guide provides step-by-step instructions to install a Velo script in a Wix site. The script fetches subcategories and discounted products from a Flask backend API, using the site's base URL as an identifier. Follow these steps to set it up.

## Prerequisites

- A Wix account with a site created.
- The Flask backend running locally (e.g., `http://localhost:5000`) or deployed (e.g., via ngrok or a hosting service).
- Basic familiarity with the Wix Editor.

## Step 1: Enable Velo in Wix

1. **Log in to Wix**:
   - Go to [wix.com](https://www.wix.com) and log in to your account.
   - Select the site you want to work on from the dashboard.

2. **Open the Editor**:
   - Click **Edit Site** to open the Wix Editor for your site.

3. **Enable Velo**:
   - In the Wix Editor, click the **Dev Mode** icon (a code symbol) in the left sidebar.
   - Toggle the **Turn on Dev Mode** switch to enable Velo.
   - This opens the Velo sidebar, where you’ll manage your code.

## Step 2: Create a Dynamic Page

The script uses a dynamic page to display categories and products based on a URL parameter (`/category/{categoryId}`).

1. **Add a Dynamic Page**:
   - In the Wix Editor, click the **Pages** icon (a stack of pages) in the left sidebar.
   - Click **+ New Page** > **Dynamic Page** > **Add New Dynamic Page**.
   - Name it something like "Category" (this will be the page title).

2. **Set the URL Pattern**:
   - In the **Dynamic Page Settings** panel:
     - Set the **URL** field to `/category/{categoryId}`.
     - Leave the dataset options blank (we’re not using Wix Data here; the script fetches from Flask).
   - Click **Done** to create the page.

3. **Switch to the Dynamic Page**:
   - In the Pages dropdown, select your new "Category" dynamic page to edit it.

## Step 3: Add Page Elements

The script interacts with repeaters and an optional input. Add these elements to the dynamic page to display all available Flask fields.

1. **Add Subcategory Repeater**:
   - Click the **+ Add** button in the left sidebar > **List & Grid** > Drag a **Repeater** onto the page.
   - In the repeater’s **Properties** panel (right-click the repeater > Properties):
     - Set the **ID** to `subcategoryRepeater`.
   - Inside the repeater:
     - Add a **Text** element, set its ID to `subcategoryName`.
     - Add a **Button** element, set its ID to `subcategoryLink`, and label it (e.g., "View").

2. **Add Products Repeater**:
   - Add another **Repeater** below the first one.
   - In its **Properties** panel:
     - Set the **ID** to `productsRepeater`.
   - Inside the repeater, add elements for all Flask fields:
     - Add a **Text** element for the title, set its ID to `titleText`.
     - Add a **Text** element for the price, set its ID to `priceText`.
     - Add a **Text** element for the discount, set its ID to `discountText`.
     - Add a **Button** element for the product link, set its ID to `productLink`, and label it (e.g., "Buy Now").
     - Add a **Text** element for the ASIN, set its ID to `asinText`.
     - Add a **Text** element for the manufacturer, set its ID to `manufacturerText`.
     - Add a **Text** element for the dimensions, set its ID to `dimensionsText`.
     - Add a **Text** element for the features, set its ID to `featuresText`.
     - Add an **Image** element for the product image, set its ID to `productImage`.
     - Add a **Text** element for the browse node ID, set its ID to `browseNodeText`.

3. **Optional: Add Discount Input**:
   - Click **+ Add** > **Input** > Drag a **Dropdown** or **Text Input** onto the page.
   - In its **Properties** panel:
     - Set the **ID** to `discountInput`.
   - For a dropdown:
     - Click **Manage Choices** and add options (e.g., `10`, `15`, `20`, `25`) to set the minimum discount percentage.
     - Set the default value to `20`.

4. **Design the Layout**:
   - Arrange the repeaters and input as desired (e.g., subcategories at the top, products below with all fields, discount input above).
   - Save your changes in the Editor.

## Step 4: Add the Velo Script

1. **Open the Code Panel**:
   - In the Velo sidebar (bottom of the screen), ensure the **Page Code** tab is selected.
   - The file should be named `category.js` (matches the dynamic page name "Category").

2. **Paste the Script**:
   - Copy the following Velo code and paste it into the `category.js` file:

     ```javascript
     import { fetch } from 'wix-fetch';
     import wixLocation from 'wix-location';

     $w.onReady(async function () {
         // Use the site base URL as the USER identifier, sanitized for Flask
         const siteUrl = wixLocation.baseUrl
             .replace('https://', '')
             .replace(/\//g, '-');
         const USERid = encodeURIComponent(siteUrl);

         // Get category ID from URL (e.g., "283155" or "root")
         const categoryId = wixLocation.path[1] || 'root';

         // Get min_discount from input if available, default to 20
         const minDiscount = $w('#discountInput') && $w('#discountInput').value 
             ? parseInt($w('#discountInput').value, 10) 
             : 20;

         // Base URL for Flask API
         const baseUrl = `http://localhost:5000/${USERid}`; // Replace with deployed URL

         // Construct API endpoints
         const subcategoriesEndpoint = categoryId === 'root' 
             ? `${baseUrl}/categories?min_discount=${minDiscount}`
             : `${baseUrl}/categories?parent_id=${categoryId}&min_discount=${minDiscount}`;
         const productsEndpoint = categoryId === 'root' 
             ? `${baseUrl}/discounted-products?min_discount=${minDiscount}`
             : `${baseUrl}/discounted-products?category_id=${categoryId}&min_discount=${minDiscount}`;

         try {
             // Fetch and display subcategories
             const subcatResponse = await fetch(subcategoriesEndpoint);
             if (subcatResponse.ok) {
                 const subcatData = await subcatResponse.json();
                 if (subcatData.count > 0) {
                     $w('#subcategoryRepeater').data = subcatData.categories.map(category => ({
                         _id: category.id,
                         name: category.name,
                         categoryId: category.id
                     }));
                     $w('#subcategoryRepeater').onItemReady(($item, itemData) => {
                         $item('#subcategoryName').text = itemData.name;
                         $item('#subcategoryLink').onClick(() => {
                             wixLocation.to(`/category/${itemData.categoryId}`);
                         });
                     });
                     $w('#subcategoryRepeater').show();
                 } else {
                     $w('#subcategoryRepeater').hide();
                     console.log("No subcategories found:", subcatData.message);
                 }
             } else {
                 throw new Error(`Subcategories fetch failed: ${subcatResponse.status}`);
             }

             // Fetch and display products with all Flask fields
             const productsResponse = await fetch(productsEndpoint);
             if (productsResponse.ok) {
                 const productsData = await productsResponse.json();
                 if (productsData.count > 0) {
                     $w('#productsRepeater').data = productsData.products.map(product => ({
                         _id: product.asin,
                         title: product.title,
                         currentPrice: product.current_price ? `$${product.current_price.toFixed(2)}` : "N/A",
                         originalPrice: product.original_price ? `$${product.original_price.toFixed(2)}` : "N/A",
                         discount: product.discount_percent ? `${product.discount_percent}% off (Save $${product.savings.toFixed(2)})` : "N/A",
                         productUrl: product.product_url || "",
                         asin: product.asin || "N/A",
                         manufacturer: product.manufacturer || "Unknown",
                         dimensions: product.dimensions || "Not specified",
                         features: product.features && product.features.length > 0 ? product.features.join(", ") : "None",
                         imageUrl: product.image_url || "",
                         browseNodeId: product.browse_node_id || "N/A"
                     }));
                     $w('#productsRepeater').onItemReady(($item, itemData) => {
                         $item('#titleText').text = itemData.title;
                         $item('#priceText').text = `${itemData.currentPrice} (Was ${itemData.originalPrice})`;
                         $item('#discountText').text = itemData.discount;
                         $item('#productLink').link = itemData.productUrl;
                         $item('#productLink').target = "_blank";
                         $item('#asinText').text = `ASIN: ${itemData.asin}`;
                         $item('#manufacturerText').text = `Manufacturer: ${itemData.manufacturer}`;
                         $item('#dimensionsText').text = `Dimensions: ${itemData.dimensions}`;
                         $item('#featuresText').text = `Features: ${itemData.features}`;
                         $item('#productImage').src = itemData.imageUrl;
                         $item('#browseNodeText').text = `Category ID: ${itemData.browseNodeId}`;
                     });
                     $w('#productsRepeater').show();
                 } else {
                     $w('#productsRepeater').hide();
                     console.log("No products found:", productsData.message);
                 }
             } else {
                 throw new Error(`Products fetch failed: ${productsResponse.status}`);
             }
         } catch (error) {
             console.error("Error loading data:", error);
             $w('#subcategoryRepeater').hide();
             $w('#productsRepeater').hide();
         }
     });

     // Refresh data when min_discount changes
     if ($w('#discountInput')) {
         $w('#discountInput').onChange(() => {
             $w.onReady();
         });
     }
     ```

   - **Note**: Replace `http://localhost:5000` with your Flask backend URL if it’s deployed (e.g., `https://your-flask-app.ngrok.io`).

3. **Save the Code**:
   - Click the **Save** button in the Wix Editor toolbar (top right).
   - Optionally, click **Preview** to test locally, but full testing requires the Flask backend.

## Step 5: Test the Installation

1. **Run the Flask Backend**:
   - Ensure your Flask app is running (e.g., `python app.py` on `localhost:5000`).
   - For local testing, use a tool like ngrok:
     - Run `ngrok http 5000` in a terminal.
     - Update `baseUrl` in the script to the ngrok URL (e.g., `https://abc123.ngrok.io`).

2. **Preview the Site**:
   - In the Wix Editor, click **Preview** (top right).
   - Navigate to `/category/root` (e.g., append `/category/root` to the preview URL).
   - Verify that:
     - Subcategories appear in `#subcategoryRepeater`.
     - Products appear in `#productsRepeater` with all fields (title, price, discount, ASIN, manufacturer, dimensions, features, image, browse node ID).
     - Clicking a `#subcategoryLink` updates the URL (e.g., `/category/283155`) and refreshes the content.

3. **Test with Discount Input** (if added):
   - Change the `#discountInput` value (e.g., from 20 to 15).
   - Ensure the repeaters update with products filtered by the new `min_discount`.

## Step 6: Publish the Site

1. **Publish**:
   - Click **Publish** in the Wix Editor (top right).
   - Confirm the site updates on your live URL (e.g., `https://yourusername.wixsite.com/mysite`).

2. **Verify Live**:
   - Visit `https://yourusername.wixsite.com/mysite/category/root`.
   - Ensure subcategories and products load correctly with all fields displayed.
