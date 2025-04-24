// /static/js/utils/settings-events.js
// Purpose: Provides utilities for setting up settings-related event listeners.

import { log } from '../core/logger.js';
import { setupEventListeners } from './event-listeners.js';
import { fetchData } from './data-fetch.js';
import { success } from '../core/notifications.js';
import { withScriptLogging } from './logging-utils.js';

/**
 * Sets up event listeners for settings form submissions.
 * @param {string} context - The context or module name.
 * @param {string} formId - The ID of the form.
 * @param {string} endpoint - The API endpoint for submission.
 * @param {string} settingType - The type of setting (e.g., 'api', 'affiliate').
 * @returns {void}
 */
export function setupSettingsEvents(context, formId, endpoint, settingType) {
  log(context, `Setting up settings events for form: ${formId}`);
  setupEventListeners(context, [
    {
      eventType: 'submit',
      selector: `#${formId}`,
      handler: async e => {
        e.preventDefault();
        const fields = {};
        Array.from(e.target.querySelectorAll('input')).forEach(input => {
          fields[input.name] = input.value;
        });
        await fetchData(context, `${endpoint}/${settingType}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fields),
        });
        success(context, `Settings for ${settingType} updated successfully`);
      },
    },
  ]);
}

/**
 * Initializes the settings-events module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} SettingsEvents instance with public methods.
 */
export function initializeSettingsEventsModule(registry) {
  const context = 'settings-events.js';
  log(context, 'Initializing settings-events module for module registry');
  return {
    setupSettingsEvents: (ctx, ...args) => setupSettingsEvents(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'settings-events.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});