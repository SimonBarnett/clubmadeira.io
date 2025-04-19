// /static/js/utils/settings-data.js
// Purpose: Provides utilities for fetching settings data.

import { log } from '../core/logger.js';
import { fetchData } from './data-fetch.js';
import { withErrorHandling } from './error.js';
import { ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from './initialization.js';

/**
 * Loads settings data from the specified endpoint.
 * @param {string} context - The context or module name.
 * @param {string} endpoint - The API endpoint to fetch settings from.
 * @returns {Promise<Array>} The fetched settings data.
 */
export async function loadSettings(context, endpoint) {
  log(context, `Loading settings from endpoint: ${endpoint}`);
  return await withErrorHandling(`${context}:loadSettings`, async () => {
    const data = await fetchData(context, endpoint);
    return data.settings || [];
  }, ERROR_MESSAGES.FETCH_FAILED('settings'), () => []);
}

/**
 * Initializes the settings-data module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} SettingsData instance with public methods.
 */
export function initializeSettingsDataModule(registry) {
  const context = 'settings-data.js';
  log(context, 'Initializing settings-data module for module registry');
  return {
    loadSettings: (ctx, ...args) => loadSettings(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'settings-data.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});