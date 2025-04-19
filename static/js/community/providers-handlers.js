// /static/js/community/providers-handlers.js
// Purpose: Manages event listeners for provider form interactions on the community providers page.

import { log } from '../core/logger.js';
import { setupEventListeners } from '../utils/event-listeners.js';
import { submitConfiguredForm } from '../utils/form-submission.js';
import { renderProviderSettings } from './providers-events.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/initialization.js';
import { createModuleInitializer } from '../utils/initialization.js';

/**
 * Sets up event listeners for provider form interactions.
 * @param {string} context - The context or module name.
 * @returns {void}
 */
export function setupProviderEvents(context) {
  log(context, 'Setting up provider form event listeners');
  withErrorHandling(`${context}:setupProviderEvents`, () => {
    setupEventListeners(context, [
      // Form submission for provider settings
      {
        eventType: 'submit',
        selector: '#providerForm',
        handler: async (event) => {
          event.preventDefault();
          await withErrorHandling(`${context}:submitProviderForm`, async () => {
            await submitConfiguredForm(context, 'providerForm', API_ENDPOINTS.CLIENT_API_SETTINGS, 'providerSettings', {
              successMessage: SUCCESS_MESSAGES.SETTINGS_UPDATED,
              onSuccess: async (data) => {
                await renderProviderSettings(context, data.settings || [], 'providerIconsBar');
              },
              onError: (error) => {
                log(context, `Provider settings submission failed: ${error.message}`);
              },
            });
          }, ERROR_MESSAGES.FORM_SUBMISSION_FAILED);
        },
      },
      // Icon click for provider settings
      {
        eventType: 'click',
        selector: '#providerIconsBar i[data-key-type]',
        handler: async (event) => {
          await withErrorHandling(`${context}:selectProviderSetting`, async () => {
            const keyType = event.target.dataset.keyType;
            log(context, `Selected provider setting: ${keyType}`);
            // Trigger rendering of specific provider settings
            const settings = await import('./providers-data.js').then(m => m.loadClientApiSettings(context));
            await renderProviderSettings(context, settings.filter(s => s.keyType === keyType), 'providerIconsBar');
          }, ERROR_MESSAGES.EVENT_HANDLER_FAILED);
        },
      },
    ]);
  }, ERROR_MESSAGES.EVENT_HANDLER_FAILED);
}

/**
 * Initializes the providers handlers module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Providers handlers instance with public methods.
 */
export function initializeProvidersHandlersModule(registry) {
  return createModuleInitializer('providers-handlers.js', {
    setupProviderEvents,
  });
}

// Initialize module with lifecycle logging
const context = 'providers-handlers.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});