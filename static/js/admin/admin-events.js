// /static/js/admin/admin-events.js
// Purpose: Centralizes event listener setup for the admin page.

import { log } from '../core/logger.js';
import { registerEvents } from '../utils/event-listeners.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/initialization.js';
import { createModuleInitializer } from '../utils/initialization.js';

/**
 * Sets up all event listeners for the admin page.
 * @param {string} context - The context or module name.
 * @returns {void}
 */
export function setupAdminEvents(context) {
  log(context, 'Setting up admin event listeners');
  withErrorHandling(`${context}:setupAdminEvents`, () => {
    registerEvents(context, [
      'formSubmit',
      'navigationToggle',
      'permissionChange',
      'modifyPermissions',
    ], {
      formId: 'settingsForm',
      endpoint: '/settings/user',
      configKey: 'userSettings',
      navToggleId: 'adminNavToggle',
      navId: 'adminNav',
    });
  }, ERROR_MESSAGES.EVENT_HANDLER_FAILED);
}

/**
 * Initializes the admin events module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Events instance with public methods.
 */
export function initializeAdminEventsModule(registry) {
  return createModuleInitializer('admin-events.js', {
    setupAdminEvents,
  });
}

// Initialize module with lifecycle logging
const context = 'admin-events.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});