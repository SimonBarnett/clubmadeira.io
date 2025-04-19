// /static/js/modules/dataLoader.js
// Purpose: Provides a centralized data loading utility for fetching data from API endpoints.

import { log } from '../core/logger.js';
import { fetchData } from '../utils/data-fetch.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Loads data from the specified endpoint, retained for compatibility with existing modules.
 * @param {string} context - The context or module name.
 * @param {string} endpoint - The API endpoint to fetch data from.
 * @returns {Promise<Object>} The fetched data.
 */
export async function load(context, endpoint) {
  log(context, `Loading data from endpoint: ${endpoint}`);
  return await withErrorHandling(`${context}:load`, async () => {
    const data = await fetchData(endpoint, { method: 'GET' });
    if (data.status === 'error') {
      throw new Error(ERROR_MESSAGES.FETCH_FAILED(endpoint));
    }
    return data;
  }, ERROR_MESSAGES.FETCH_FAILED(endpoint));
}

/**
 * Initializes the dataLoader module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} DataLoader instance with public methods.
 */
export function initializeDataLoaderModule(registry) {
  const context = 'dataLoader.js';
  log(context, 'Initializing dataLoader module for module registry');
  return {
    load: (ctx, ...args) => load(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'dataLoader.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});