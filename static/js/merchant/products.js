// /static/js/merchant/products.js
// Purpose: Manages product data fetching and rendering for the merchant page.

import { log } from '../core/logger.js';
import { fetchData } from '../utils/data-fetch.js';
import { renderDataTable } from '../utils/ui-components.js';
import { withElement } from '../utils/dom-manipulation.js';
import { notifyError } from '../core/notifications.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Loads and renders product data in a table.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function loadProducts(context) {
  log(context, 'Loading products');
  await withErrorHandling(`${context}:loadProducts`, async () => {
    await withElement(context, 'productList', async productList => {
      const data = await fetchData(API_ENDPOINTS.PRODUCTS, { method: 'GET' });
      if (!data.products || data.products.length === 0) {
        productList.innerHTML = '<p>No products available.</p>';
        notifyError(context, ERROR_MESSAGES.NO_DATA('products'));
        return;
      }

      const headers = ['ID', 'Name', 'Price', 'Category', 'Stock'];
      const rowMapper = product => [
        product.id || 'N/A',
        product.name || 'N/A',
        product.price || 'N/A',
        product.category || 'N/A',
        product.stock || 'N/A',
      ];

      productList.innerHTML = renderDataTable(context, {
        data: data.products,
        headers,
        rowMapper,
        emptyMessage: ERROR_MESSAGES.NO_DATA('products'),
      });
    });
  }, ERROR_MESSAGES.FETCH_FAILED('products'));
}

/**
 * Initializes the products module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Products instance with public methods.
 */
export function initializeProductsModule(registry) {
  const context = 'products.js';
  log(context, 'Initializing products module for module registry');
  return {
    loadProducts: ctx => loadProducts(ctx),
  };
}

// Initialize module with lifecycle logging
const context = 'products.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});