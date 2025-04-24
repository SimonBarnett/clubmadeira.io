// /static/js/admin/deals.js
// Purpose: Manages deals data, including fetching and rendering deals in a table.

import { log } from '../core/logger.js';
import { withErrorHandling } from '../utils/error.js';
import { load as dataLoaderLoad } from '../modules/dataLoader.js';
import { fetchData } from '../utils/data-fetch.js';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../config/constants.js';
import { renderDataTable } from '../utils/ui-components.js';
import { withScriptLogging } from '../utils/logging-utils.js';

/**
 * Fetches and renders deals data in a table.
 * @param {string} context - The context or module name.
 * @param {Object} elements - DOM elements configuration object.
 * @param {HTMLElement} elements.dealList - The element to render the deals table into.
 * @returns {Promise<void>}
 */
export async function loadDeals(context, { dealList }) {
  log(context, `Loading deals data at: ${new Date().toISOString()}`);
  await withErrorHandling(`${context}:loadDeals`, async () => {
    try {
      // Fetch deals data using dataLoader (retained for compatibility)
      const data = await dataLoaderLoad(context, 'initial');
      log(context, 'Deals fetched:', data);

      // Check for error status
      if (data.status === 'error') {
        throw new Error(ERROR_MESSAGES.FETCH_FAILED('deals'));
      }

      // Prepare table data
      const headers = [
        'Category',
        'Title',
        'URL',
        'Price',
        'Original',
        'Discount',
        'Image',
        'Quantity',
      ];
      const rowMapper = (deal) => [
        deal.category || 'N/A',
        deal.title || 'N/A',
        `<a href="${deal.url || '#'}" target="_blank">Link</a>`,
        deal.price || 'N/A',
        deal.original || 'N/A',
        deal.discount || 'N/A',
        `<img src="${deal.image || ''}" alt="Product Image" style="width: 50px;" onerror="this.src='/static/images/placeholder.png';">`,
        deal.quantity || 'N/A',
      ];

      // Render deals table
      dealList.innerHTML = renderDataTable(context, {
        data: data.data,
        headers,
        rowMapper,
        emptyMessage: ERROR_MESSAGES.DEALS_NO_DATA,
      });
    } catch (err) {
      dealList.innerHTML = renderDataTable(context, {
        data: [],
        headers: [],
        rowMapper: () => [ERROR_MESSAGES.FETCH_FAILED('deals')],
        emptyMessage: ERROR_MESSAGES.FETCH_FAILED('deals'),
      });
      throw err;
    }
  }, ERROR_MESSAGES.ELEMENT_NOT_FOUND);
}

/**
 * Initializes the deals module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Deals instance with public methods.
 */
export function initializeDealsModule(registry) {
  const context = 'deals.js';
  log(context, 'Initializing deals module for module registry');
  return {
    loadDeals: (ctx, ...args) => loadDeals(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'deals.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});