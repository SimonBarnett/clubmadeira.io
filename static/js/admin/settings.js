// /static/js/admin/settings.js
// Purpose: Manages loading of admin settings for affiliates, API keys, and site settings.

import { log } from '../core/logger.js';
import { renderSettingsForm } from '../utils/settings-renderer.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { SETTINGS } from '../config/settings.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { createModuleInitializer } from '../utils/initialization.js';

/**
 * Loads admin settings for the specified type (e.g., affiliates, apiKeys, siteSettings).
 * @param {string} context - The context or module name.
 * @param {string} type - The type of settings to load (e.g., 'affiliates', 'apiKeys', 'siteSettings').
 * @returns {Promise<void>}
 * @throws {Error} If the settings type is unknown.
 */
export async function loadAdminSettings(context, type) {
  log(context, `Loading ${type} settings`);
  const settingsConfig = SETTINGS[type];
  if (!settingsConfig) {
    throw new Error(`Unknown settings type: ${type}`);
  }
  await renderSettingsForm(context, settingsConfig);
}

/**
 * Initializes the settings module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Settings instance with public methods.
 */
export function initializeSettingsModule(registry) {
  return createModuleInitializer('settings.js', {
    loadAdminSettings,
  });
}

// Initialize module with lifecycle logging
const context = 'settings.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});