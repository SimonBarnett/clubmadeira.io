# Installing Velo Scripts for Community and Seller Websites in Wix

This guide provides step-by-step instructions to install Velo scripts in Wix for two types of websites: a **Community Website** (displaying member discounts) and a **Seller Website** (handling referrals and order callbacks). These scripts interact with a Flask backend API (e.g., running at `http://localhost:5000`) to fetch data or send referral notifications.

## Prerequisites

- A Wix account with two sites created: one for the Community Website and one for the Seller Website.
- The Flask backend running locally (e.g., `http://localhost:5000`) or deployed (e.g., via ngrok or a hosting service).
- Basic familiarity with the Wix Editor and Velo.

## General Setup: Enable Velo in Wix

For both websites, start by enabling Velo:

1. **Log in to Wix**:
   - Go to [wix.com](https://www.wix.com), log in, and select the site (Community or Seller) from the dashboard.

2. **Open the Editor**:
   - Click **Edit Site** to launch the Wix Editor.

3. **Enable Velo**:
   - Click the **Dev Mode** icon (code symbol) in the left sidebar.
   - Toggle **Turn on Dev Mode** to enable Velo, opening the Velo sidebar for code management.

---

## Community Website: Member Discounts Page

This section covers installing a Velo script on the Community Website to display subcategories and discounted products on a dynamic "Category" page.

### Step 1: Create a Dynamic Page

1. **Add a Dynamic Page**:
   - In the Wix Editor, click the **Pages** icon > **+ New Page** > **Dynamic Page** > **Add New Dynamic Page**.
   - Name it "Category" (this sets the page title).

2. **Set the URL Pattern**:
   - In the **Dynamic Page Settings**:
     - Set the **URL** to `/category/{categoryId}`.
     - Leave dataset options blank (data comes from Flask, not Wix Data).
   - Click **Done**.

3. **Switch to the Page**:
   - From the Pages dropdown, select the "Category" dynamic page.

### Step 2: Add Page Elements

Add repeaters and an optional discount input:

1. **Subcategory Repeater**:
   - Click **+ Add** > **List & Grid** > Drag a **Repeater** onto the page.
   - In **Properties** (right-click > Properties):
     - Set **ID** to `subcategoryRepeater`.
   - Inside the repeater:
     - Add a **Text** element, set **ID** to `subcategoryName`.
     - Add a **Button** element, set **ID** to `subcategoryLink`, label it "View".

2. **Products Repeater**:
   - Add another **Repeater** below.
   - In **Properties**:
     - Set **ID** to `productsRepeater`.
   - Inside the repeater, add:
     - **Text** for title, **ID**: `titleText`.
     - **Text** for price, **ID**: `priceText`.
     - **Text** for discount, **ID**: `discountText`.
     - **Button** for link, **ID**: `productLink`, label "Buy Now".
     - **Text** for source, **ID**: `sourceText`.
     - **Image** for product image, **ID**: `image`.
     - **Text** for category, **ID**: `categoryText`.
     - **Text** for manufacturer, **ID**: `manufacturerText`.
     - **Text** for dimensions, **ID**: `dimensionsText`.
     - **Text** for features, **ID**: `featuresText`.
     - **Text** for quantity, **ID**: `qtyText`.
     - **Text** for user ID, **ID**: `userIdText`.

3. **Optional Discount Input**:
   - Click **+ Add** > **Input** > Drag a **Dropdown** onto the page.
   - In **Properties**:
     - Set **ID** to `discountInput`.
     - Click **Manage Choices**, add options (e.g., `10`, `15`, `20`, `25`), set default to `20`.

4. **Layout**:
   - Arrange elements (e.g., subcategories at top, products below, discount input above).
   - Save changes.

### Step 3: Add the Velo Script

1. **Open Code Panel**:
   - In the Velo sidebar, select **Page Code** tab (file named `category.js`).

2. **Paste the Script**:
   - Add this code:

     ```javascript
     import { fetch } from 'wix-fetch';
     import wixLocation from 'wix-location';

     $w.onReady(async function () {
         const siteUrl = wixLocation.baseUrl
             .replace('https://', '')
             .replace(/\//g, '-');
         const USERid = encodeURIComponent(siteUrl);

         const categoryId = wixLocation.path[1] || 'root';
         const minDiscount = $w('#discountInput') && $w('#discountInput').value 
             ? parseInt($w('#discountInput').value, 10) 
             : 20;

         const baseUrl = `http://localhost:5000/${USERid}`;
         const subcategoriesEndpoint = categoryId === 'root' 
             ? `${baseUrl}/categories?min_discount=${minDiscount}`
             : `${baseUrl}/categories?parent_id=${categoryId}&min_discount=${minDiscount}`;
         const productsEndpoint = categoryId === 'root' 
             ? `${baseUrl}/discounted-products?min_discount=${minDiscount}`
             : `${baseUrl}/discounted-products?category_id=${categoryId}&min_discount=${minDiscount}`;

         try {
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

             const productsResponse = await fetch(productsEndpoint);
             if (productsResponse.ok) {
                 const productsData = await productsResponse.json();
                 if (productsData.count > 0) {
                     $w('#productsRepeater').data = productsData.products.map(product => ({
                         _id: product.id,
                         source: product.source,
                         title: product.title,
                         productUrl: product.product_url,
                         currentPrice: `$${product.current_price.toFixed(2)}`,
                         originalPrice: `$${product.original_price.toFixed(2)}`,
                         discount: `${product.discount_percent}% off`,
                         imageUrl: product.image_url,
                         category: product.category,
                         manufacturer: product.manufacturer,
                         dimensions: product.dimensions,
                         features: product.features ? product.features.join(', ') : '',
                         qty: product.qty || 'N/A',
                         userId: product.user_id || 'N/A'
                     }));
                     $w('#productsRepeater').onItemReady(($item, itemData) => {
                         $item('#titleText').text = itemData.title;
                         $item('#priceText').text = `${itemData.currentPrice} (Was ${itemData.originalPrice})`;
                         $item('#discountText').text = itemData.discount;
                         $item('#productLink').link = itemData.productUrl;
                         $item('#productLink').target = "_blank";
                         $item('#sourceText').text = `Source: ${itemData.source}`;
                         $item('#image').src = itemData.imageUrl;
                         $item('#categoryText').text = `Category: ${itemData.category}`;
                         $item('#manufacturerText').text = itemData.manufacturer ? `By: ${itemData.manufacturer}` : '';
                         $item('#dimensionsText').text = itemData.dimensions ? `Size: ${itemData.dimensions}` : '';
                         $item('#featuresText').text = itemData.features ? `Features: ${itemData.features}` : '';
                         $item('#qtyText').text = itemData.qty !== 'N/A' ? `Qty: ${itemData.qty}` : '';
                         $item('#userIdText').text = itemData.userId !== 'N/A' ? `Seller: ${itemData.userId}` : '';
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

     if ($w('#discountInput')) {
         $w('#discountInput').onChange(() => {
             $w.onReady();
         });
     }
     ```

   - **Explanation**:
     - **Imports**: Uses `wix-fetch` for API calls and `wix-location` for URL handling.
     - **USERid**: Derives a unique identifier from the site’s base URL.
     - **Endpoints**: Fetches subcategories and products from Flask based on `categoryId` (from URL) and `minDiscount` (from input or default 20).
     - **Subcategories**: Populates `#subcategoryRepeater` with names and clickable links to subcategories.
     - **Products**: Populates `#productsRepeater` with detailed fields (title, price, discount, etc.).
     - **Error Handling**: Hides repeaters on failure and logs errors.
     - **Discount Input**: Refreshes data when changed.

3. **Update URL**:
   - Replace `http://localhost:5000` with your Flask backend URL if deployed (e.g., `https://your-flask-app.ngrok.io`).

4. **Save**:
   - Click **Save** in the Editor toolbar.

### Step 4: Test
- In the Editor, click **Preview**.
- Visit `/category/root` to see root-level data or `/category/{someId}` for specific categories.
- Verify subcategories and products load with all fields. Test the discount input if added.

---

## Seller Website: Referral Handling

The Seller Website uses two scripts: one to capture a `?referer` query parameter on page load (`public/pages/home.js`) and another to notify the referrer on order placement (`backend/events.js`).

### Step 1: Set Up the Home Page

1. **Select the Home Page**:
   - In the Wix Editor for the Seller site, ensure you’re on the "Home" page (or any page where referrals might occur).

2. **Add the Frontend Script**:
   - In the Velo sidebar, under **Public** > right-click **public** > **New File**, name it `pages/home.js`.
   - Paste this code:

     ```javascript
     import { session } from 'wix-storage';
     import wixLocation from 'wix-location';
     import { fetch } from 'wix-fetch';

     $w.onReady(function () {
         const query = wixLocation.query;
         
         if (query.referer) {
             session.setItem('referer', query.referer);
             console.log('Referer stored:', query.referer);

             const sendCallbackToReferer = async () => {
                 try {
                     const response = await fetch('http://localhost:5000/referal', {
                         method: 'POST',
                         headers: {
                             'Content-Type': 'application/json'
                         },
                         body: JSON.stringify({
                             referer: query.referer,
                             page: wixLocation.url,
                             timestamp: new Date().toISOString()
                         })
                     });

                     if (response.ok) {
                         const result = await response.json();
                         console.log('Callback to referrer successful:', result);
                     } else {
                         console.error('Callback failed with status:', response.status);
                     }
                 } catch (error) {
                     console.error('Error sending callback to referrer:', error);
                 }
             };

             sendCallbackToReferer();
         } else {
             const storedReferer = session.getItem('referer');
             if (storedReferer) {
                 console.log('Using previously stored referer:', storedReferer);
             }
         }
     });
     ```

   - **Explanation**:
     - **Imports**: Uses `wix-storage` for session storage, `wix-location` for URL queries, and `wix-fetch` for HTTP requests.
     - **Referer Check**: If `?referer` exists in the URL (e.g., `?referer=community123`), it’s stored in session storage.
     - **Callback**: Sends a POST request to `/referal` with the referer, current page URL, and timestamp.
     - **Fallback**: Logs if a referer was previously stored but none is in the current URL.

3. **Update URL**:
   - Replace `http://localhost:5000` with your Flask backend URL if deployed.

4. **Save**:
   - Save the file.

### Step 2: Set Up the Backend Order Callback

1. **Create Backend File**:
   - In the Velo sidebar, under **Backend** > right-click **backend** > **New File**, name it `events.js`.

2. **Paste the Script**:
   - Add this code:

     ```javascript
     import { fetch } from 'wix-fetch';
     import { getSessionData } from 'wix-storage-backend';

     export async function wixStores_onOrderPlaced(event) {
         const orderId = event.orderId;
         const buyerInfo = event.buyerInfo;
         const total = event.totals.total;

         let referer;
         try {
             referer = await getSessionData('referer');
         } catch (error) {
             console.error('Failed to retrieve referer from session:', error);
         }

         const callback = async () => {
             try {
                 const payload = {
                     orderId: orderId,
                     buyer: buyerInfo,
                     total: total,
                     referer: referer || 'none',
                     timestamp: new Date().toISOString()
                 };

                 const response = await fetch('http://localhost:5000/referal', {
                     method: 'POST',
                     headers: {
                         'Content-Type': 'application/json'
                     },
                     body: JSON.stringify(payload)
                 });

                 if (response.ok) {
                     const result = await response.json();
                     console.log('Callback successful:', result);
                     return result;
                 } else {
                     throw new Error(`Callback failed with status: ${response.status}`);
                 }
             } catch (error) {
                 console.error('Callback error:', error.message);
                 throw error;
             }
         };

         try {
             await callback();
         } catch (error) {
             console.error('Failed to execute callback on order placed:', error);
         }
     }
     ```

   - **Explanation**:
     - **Imports**: Uses `wix-fetch` for API calls and `wix-storage-backend` for backend session access.
     - **Event Handler**: Triggers on `wixStores_onOrderPlaced` when an order is placed.
     - **Referer Retrieval**: Fetches the referer stored by the frontend script from session storage.
     - **Callback**: Sends a POST request to `/referal` with order details (ID, buyer, total), referer, and timestamp.
     - **Error Handling**: Logs failures at each step.

3. **Update URL**:
   - Replace `http://localhost:5000` with your Flask backend URL if deployed.

4. **Save**:
   - Save the file.

### Step 3: Test the Seller Site

1. **Run Flask Backend**:
   - Ensure Flask is running (e.g., `python app.py` on `localhost:5000`).
   - Use ngrok for local testing if needed (`ngrok http 5000`) and update URLs in scripts.

2. **Test Referral Capture**:
   - In Preview mode, visit the home page with a referer (e.g., append `?referer=community123`).
   - Check the console for "Referer stored" and "Callback to referrer successful" logs.

3. **Test Order Callback**:
   - Place a test order via Wix Stores (requires a store setup).
   - Verify the console logs "Callback successful" with order details sent to Flask.

---

## Final Steps: Publish Both Sites

1. **Publish**:
   - For each site, click **Publish** in the Wix Editor.
   - Confirm live URLs (e.g., `https://yourusername.wixsite.com/communitysite` and `https://yourusername.wixsite.com/sellersite`).

2. **Verify Live**:
   - Community Site: Visit `/category/root` to ensure subcategories and products load.
   - Seller Site: Visit with `?referer=xyz`, place an order, and confirm callbacks to Flask.

---

## Notes

- Replace all instances of `http://localhost:5000` with your live Flask URL before publishing.
- Ensure Flask endpoints (`/categories`, `/discounted-products`, `/referal`) are implemented to handle these requests.
- Test thoroughly in Preview mode before going live.