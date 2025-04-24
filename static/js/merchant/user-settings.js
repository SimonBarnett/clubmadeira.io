// /static/js/merchant/user-settings.js
// Purpose: Manages user settings for the merchant page, including rendering, form submission, and validation.

import { log } from '../core/logger.js';
import { renderSettingsForm } from '../utils/settings-renderer.js';
import { submitConfiguredForm } from '../utils/form-submission.js';
import { setupEventListeners } from '../utils/event-listeners.js';
import { withErrorHandling } from '../utils/error.js';
import { SETTINGS } from '../config/settings.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { createModuleInitializer } from '../utils/initialization.js';

/**
 * Loads and renders user settings.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function loadUserSettings(context) {
  log(context, 'Loading user settings');
  const settingsConfig = SETTINGS.userSettings || {
    containerId: 'user-settings-icons',
    formId: 'settingsForm',
    fieldsId: 'user-settings-fields',
    endpoint: '/settings/user',
    type: 'user-settings',
    iconClass: 'fas fa-user',
  };
  await withErrorHandling(`${context}:loadUserSettings`, async () => {
    await renderSettingsForm(context, settingsConfig);
    setupUserSettingsEvents(context);
  }, ERROR_MESSAGES.RENDER_FAILED('user settings'));
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
      selector: '#settingsForm',
      handler: async event => {
        event.preventDefault();
        await withErrorHandling(`${context}:submitUserSettings`, async () => {
          await submitConfiguredForm(context, 'settingsForm', '/settings/user', 'userSettings');
        }, ERROR_MESSAGES.FORM_SUBMISSION_FAILED);
      },
    },
  ]);
}

/**
 * Transforms user settings form data for submission.
 * @param {FormData} formData - The form data.
 * @returns {Object} Transformed data for API submission.
 */
export function transformUserSettings(formData) {
  log('user-settings.js', 'Transforming user settings form data');
  return {
    contactName: formData.get('contactName')?.trim(),
    emailAddress: formData.get('emailAddress')?.trim(),
    websiteUrl: formData.get('websiteUrl')?.trim() || null,
    phoneNumber: formData.get('phoneNumber')?.trim() || null,
  };
}

/**
 * Validates user settings form data.
 * @param {FormData} formData - The form data.
 * @returns {boolean} True if valid, false otherwise.
 */
export function validateUserSettings(formData) {
  log('user-settings.js', 'Validating user settings form data');
  return formData.get('contactName')?.trim() && formData.get('emailAddress')?.trim();
}

/**
 * Initializes the user settings module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} User settings instance with public methods.
 */
export function initializeUserSettingsModule(registry) {
  return createModuleInitializer('user-settings.js', {
    loadUserSettings,
    transformUserSettings,
    validateUserSettings,
  });
}

// Initialize module with lifecycle logging
const context = 'user-settings.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});