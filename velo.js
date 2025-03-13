import { fetch } from 'wix-fetch';
import wixLocation from 'wix-location';

$w.onReady(async function () {
    // Use the site base URL as the USER identifier, sanitized for Flask
    const siteUrl = wixLocation.baseUrl
        .replace('https://', '')  // Remove protocol
        .replace(/\//g, '-');     // Replace slashes with hyphens
    const USERid = encodeURIComponent(siteUrl); // Ensure it’s URL-safe

    // Get category ID from URL (e.g., "283155" or "root")
    const categoryId = wixLocation.path[1] || 'root';

    // Get min_discount from input if available, default to 20
    const minDiscount = $w('#discountInput') && $w('#discountInput').value 
        ? parseInt($w('#discountInput').value, 10) 
        : 20;

    // Base URL for Flask API using site URL as USERid
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

        // Fetch and display products
        const productsResponse = await fetch(productsEndpoint);
        if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            if (productsData.count > 0) {
                $w('#productsRepeater').data = productsData.products.map(product => ({
                    _id: product.asin,
                    title: product.title,
                    currentPrice: `$${product.current_price.toFixed(2)}`,
                    originalPrice: `$${product.original_price.toFixed(2)}`,
                    discount: `${product.discount_percent}% off (Save $${product.savings.toFixed(2)})`,
                    productUrl: product.product_url
                }));
                $w('#productsRepeater').onItemReady(($item, itemData) => {
                    $item('#titleText').text = itemData.title;
                    $item('#priceText').text = `${itemData.currentPrice} (Was ${itemData.originalPrice})`;
                    $item('#discountText').text = itemData.discount;
                    $item('#productLink').link = itemData.productUrl;
                    $item('#productLink').target = "_blank";
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