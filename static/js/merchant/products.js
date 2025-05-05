// /static/js/merchant/products.js
// Purpose: Manages product data fetching and rendering for the merchant page.

import { log } from '../core/logger.js';
import { fetchData } from '../utils/data-fetch.js';
import { renderDataTable } from '../utils/ui-components.js';
import { withElement } from '../utils/dom-manipulation.js';
import { error } from '../core/notifications.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';

const context = 'products.js';

/**
 * Loads and renders product data in a table.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function loadProducts(context) {
    log(context, 'Loading products');
    log(context, 'API_ENDPOINTS.PRODUCTS:', API_ENDPOINTS.PRODUCTS);
    await withErrorHandling(`${context}:loadProducts`, async () => {
        await withElement(context, 'productList', async productList => {
            log(context, 'Accessing productList element');
            const endpoint = typeof API_ENDPOINTS.PRODUCTS === 'string' ? API_ENDPOINTS.PRODUCTS : '/settings/products';
            log(context, 'Using endpoint:', endpoint);
            const data = await fetchData(context, endpoint, { method: 'GET' });
            log(context, 'Fetch response:', data);
            if (!data.products || data.products.length === 0) {
                log(context, 'No products found in response');
                productList.innerHTML = '<p>No products available.</p>';
                error(context, ERROR_MESSAGES.NO_DATA('products'));
                return;
            }

            // Define headers to match merchant.html table structure, including hidden ID column
            const headers = ['ID', 'Category', 'Title', 'URL', 'Price', 'Original', 'Image', 'QTY'];

            const rowMapper = product => {
                log(context, 'Mapping product:', product);
                const imageElement = document.createElement('img');
                imageElement.src = product.image_url || '';
                imageElement.alt = product.title || 'Product Image';
                imageElement.style.width = '50px';
                imageElement.style.height = '50px';
                imageElement.onerror = () => {
                    log(context, `Image failed to load: ${product.image_url}, using fallback`);
                    imageElement.src = 'https://via.placeholder.com/50?text=Image+Not+Found';
                    imageElement.alt = 'Image Not Available';
                };

                return [
                    product.id || 'N/A', // Include ID to match headers
                    product.category || 'N/A',
                    product.title || product.name || 'N/A',
                    product.product_url ? `<a href="${product.product_url}" target="_blank">Link</a>` : 'N/A',
                    product.current_price != null ? product.current_price : 'N/A',
                    product.original_price != null ? product.original_price : 'N/A',
                    imageElement,
                    product.qty != null ? product.qty : 'N/A',
                ];
            };

            log(context, 'Rendering table with products:', data.products);
            const tableContent = await renderDataTable(context, {
                data: data.products,
                headers,
                rowMapper,
                emptyMessage: ERROR_MESSAGES.NO_DATA('products'),
            });
            log(context, 'Rendered table content:', tableContent.outerHTML);
            productList.innerHTML = '';
            while (tableContent.firstChild) {
                productList.appendChild(tableContent.firstChild);
            }
            log(context, 'Table rows appended to productList');
        });
    }, ERROR_MESSAGES.FETCH_FAILED('products'));
}

/**
 * Initializes the products module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Products instance with public methods.
 */
export function initializeProductsModule(registry) {
    log(context, 'Initializing products module for module registry');
    return {
        loadProducts: ctx => loadProducts(ctx),
    };
}

// Initialize module with lifecycle logging
withScriptLogging(context, () => {
    log(context, 'Module initialized');
});