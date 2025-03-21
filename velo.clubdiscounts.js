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
        // Subcategories fetch remains unchanged
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

        // Updated products fetch with new fields
        const productsResponse = await fetch(productsEndpoint);
        if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            if (productsData.count > 0) {
                $w('#productsRepeater').data = productsData.products.map(product => ({
                    _id: product.id,  // Changed from asin to id
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
                    // Add new fields to display
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