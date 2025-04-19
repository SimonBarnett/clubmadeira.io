// /static/js/utils/data-fetch.js
// Purpose: Provides a centralized utility for fetching data from API endpoints.

import { log } from '../core/logger.js';
import { authenticatedFetch } from '../core/auth.js';
import { withErrorHandling } from './error.js';
import { ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from './initialization.js';

/**
 * Fetches data from the specified endpoint with optional fetch options.
 * @param {string} context - The context or module name.
 * @param {string} endpoint - The API endpoint URL.
 * @param {Object} [options={}] - Fetch options (e.g., method, headers, body).
 * @returns {Promise<Object>} The fetched data.
 */
export async function fetchData(context, endpoint, options = {}) {
  log(context, `Fetching data from endpoint: ${endpoint}`);
  return await withErrorHandling(`${context}:fetchData`, async () => {
    const response = await authenticatedFetch(context, endpoint, options);
    const data = await response.json();
    if (data.status === 'error') {
      throw new Error(data.message || ERROR_MESSAGES.FETCH_FAILED(endpoint));
    }
    return data;
  }, ERROR_MESSAGES.FETCH_FAILED(endpoint));
}

/**
 * Initializes the data-fetch module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} DataFetch instance with public methods.
 */
export function initializeDataFetchModule(registry) {
  const context = 'data-fetch.js';
  log(context, 'Initializing data-fetch module for module registry');
  return {
    fetchData: (ctx, ...args) => fetchData(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'data-fetch.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});