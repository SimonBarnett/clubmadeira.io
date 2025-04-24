// /static/js/partner/integrations-data.js
// Purpose: Manages data fetching for integration settings on the partner page.

import { log } from '../core/logger.js';
import { fetchData } from '../utils/data-fetch.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';

/**
 * Loads integration settings from the server.
 * @param {string} context - The context or module name.
 * @returns {Promise<Array>} The fetched integration settings.
 */
export async function loadIntegrations(context) {
  log(context, 'Loading integration settings');
  return await withErrorHandling(`${context}:loadIntegrations`, async () => {
    const data = await fetchData(context, API_ENDPOINTS.CLIENT_API);
    return data.settings || [];
  }, ERROR_MESSAGES.FETCH_FAILED('integrations'), () => []);
}

/**
 * Initializes the integrations-data module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} IntegrationsData instance with public methods.
 */
export function initializeIntegrationsDataModule(registry) {
  const context = 'integrations-data.js';
  log(context, 'Initializing integrations-data module for module registry');
  return {
    loadIntegrations: ctx => loadIntegrations(ctx),
  };
}

// Initialize module with lifecycle logging
const context = 'integrations-data.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});