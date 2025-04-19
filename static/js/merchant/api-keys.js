// /static/js/merchant/api-keys.js
// Purpose: Orchestrates the API keys settings page, coordinating data fetching, UI rendering, and event setup.

import { log } from '../core/logger.js';
import { fetchData } from '../utils/data-fetch.js';
import { renderSettingsFields } from '../utils/settings-ui.js';
import { setupApiKeyEvents } from './api-keys-events.js';
import { withElement, toggleViewState } from '../utils/dom-manipulation.js';
import { notifyError } from '../core/notifications.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Loads and renders API keys data.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function loadApiKeys(context) {
  log(context, 'Loading API keys');
  await withErrorHandling(`${context}:loadApiKeys`, async () => {
    await withElement(context, 'api-keys-icons', async iconsContainer => {
      await withElement(context, 'api-keys-fields', async fieldsContainer => {
        await withElement(context, 'api-keys-form', async form => {
          const data = await fetchData(API_ENDPOINTS.API_KEY, { method: 'GET' });
          if (!data.settings || data.settings.length === 0) {
            iconsContainer.innerHTML = '<p>No API keys available.</p>';
            notifyError(context, ERROR_MESSAGES.NO_DATA('API keys'));
            return;
          }
          await displayApiKeyFields(context, data.settings[0], fieldsContainer, form);
          setupApiKeyEvents(context, 'api-keys-form', API_ENDPOINTS.API_KEY);
        });
      });
    });
  }, ERROR_MESSAGES.FETCH_FAILED('API keys'));
}

/**
 * Renders API key fields for a specific setting.
 * @param {string} context - The context or module name.
 * @param {Object} setting - The API key setting data.
 * @param {HTMLElement} fieldsContainer - The container for the fields.
 * @param {HTMLElement} form - The form element.
 * @returns {Promise<void>}
 */
async function displayApiKeyFields(context, setting, fieldsContainer, form) {
  log(context, 'Rendering API key fields');
  await renderSettingsFields(context, [setting], {
    containerId: 'api-keys-icons',
    formId: 'api-keys-form',
    fieldsId: 'api-keys-fields',
    type: 'api',
    iconClass: 'fas fa-key',
    onIconClick: (setting, fieldsContainer, form) => {
      toggleViewState(context, { 'api-keys-fields': true });
    },
    onReadmeClick: async setting => {
      await renderMarkdownContent(context, setting.readmePath, `mdContent-${setting.keyType}`);
      toggleViewState(context, { [`mdContent-${setting.keyType}`]: true });
    },
  });
}

/**
 * Initializes the API keys module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} API keys instance with public methods.
 */
export function initializeApiKeysModule(registry) {
  const context = 'api-keys.js';
  log(context, 'Initializing API keys module for module registry');
  return {
    loadApiKeys: ctx => loadApiKeys(ctx),
  };
}

// Initialize module with lifecycle logging
const context = 'api-keys.js';
withScriptLogging(context, () => {
  loadApiKeys(context);
});