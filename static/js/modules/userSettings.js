// /static/js/modules/userSettings.js
// Purpose: Manages user settings form submission and UI rendering.

import { log } from '../core/logger.js';
import { renderSettings } from '../utils/settings-renderer.js';
import { submitConfiguredForm } from '../utils/form-submission.js';
import { setupEventListeners } from '../utils/event-listeners.js';
import { SETTINGS } from '../config/settings.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from '../utils/logging-utils.js';

/**
 * Loads and renders user settings.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function loadUserSettings(context) {
  log(context, 'Loading user settings');
  const settingsConfig = SETTINGS.userSettings || {
    containerId: 'userSettingsIcons',
    formId: 'userSettingsForm',
    fieldsId: 'userSettingsFields',
    endpoint: '/settings/user',
    type: 'user-settings',
    iconClass: 'fas fa-user',
  };
  await renderSettings(context, settingsConfig);
  setupUserSettingsEvents(context);
}

/**
 * Sets up event listeners for user settings form submission.
 * @param {string} context - The context or module name.
 */
function setupUserSettingsEvents(context) {
  log(context, 'Setting up user settings event listeners');
  setupEventListeners(context, [
    {
      eventType: 'submit',
      selector: '#userSettingsForm',
      handler: async event => {
        event.preventDefault();
        await submitConfiguredForm(context, 'userSettingsForm', '/settings/user', 'userSettings');
      },
    },
  ]);
}

/**
 * Initializes the userSettings module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} UserSettings instance with public methods.
 */
export function initializeUserSettingsModule(registry) {
  const context = 'userSettings.js';
  log(context, 'Initializing userSettings module for module registry');
  return {
    loadUserSettings: ctx => loadUserSettings(ctx),
  };
}

// Initialize module with lifecycle logging
const context = 'userSettings.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});