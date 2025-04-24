// /static/js/merchant/api-keys-events.js
// Purpose: Manages event listeners for API key form interactions on the merchant page.

import { log } from '../core/logger.js';
import { setupEventListeners } from '../utils/event-listeners.js';
import { fetchData } from '../utils/data-fetch.js';
import { success } from '../core/notifications.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';

/**
 * Sets up event listeners for API key form submissions.
 * @param {string} context - The context or module name.
 * @param {string} formId - The ID of the form.
 * @param {string} endpoint - The API endpoint for submission.
 * @returns {void}
 */
export function setupApiKeyEvents(context, formId, endpoint) {
  log(context, `Setting up API key event listeners for form: ${formId}`);
  setupEventListeners(context, [
    {
      eventType: 'submit',
      selector: `#${formId}`,
      handler: async e => {
        e.preventDefault();
        await withErrorHandling(`${context}:submitApiKeyForm`, async () => {
          const keyType = e.target.dataset.keyType;
          const fields = {};
          Array.from(e.target.querySelectorAll('input')).forEach(input => {
            fields[input.name] = input.value;
          });
          await fetchData(context, `${endpoint}/${keyType}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fields),
          });
          success(context, SUCCESS_MESSAGES.SUBMITTED(`API key for ${keyType}`));
          await import('./api-keys.js').then(module => module.loadApiKeys(context));
        }, ERROR_MESSAGES.FORM_SUBMISSION_FAILED);
      },
    },
  ]);
}

/**
 * Initializes the api-keys-events module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} ApiKeysEvents instance with public methods.
 */
export function initializeApiKeysEventsModule(registry) {
  const context = 'api-keys-events.js';
  log(context, 'Initializing api-keys-events module for module registry');
  return {
    setupApiKeyEvents: (ctx, ...args) => setupApiKeyEvents(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'api-keys-events.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});