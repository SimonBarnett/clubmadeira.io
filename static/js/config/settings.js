// /static/js/config/settings.js
// Purpose: Defines centralized configuration for settings across the application.

import { log } from '../core/logger.js';
import { API_ENDPOINTS } from './endpoints.js';
import { withScriptLogging } from '../utils/logging-utils.js';

/**
 * Settings configuration registry for admin and provider settings.
 * @type {Object.<string, Object>}
 */
export const SETTINGS = {
  affiliates: {
    containerId: 'affiliate-icons',
    formId: 'affiliate-form',
    fieldsId: 'affiliate-settings-container',
    endpoint: API_ENDPOINTS.SETTINGS_AFFILIATE,
    type: 'affiliate',
    iconClass: 'fas fa-link',
  },
  apiKeys: {
    containerId: 'api-keys-icons',
    formId: 'api-keys-form',
    fieldsId: 'api-keys-fields',
    endpoint: API_ENDPOINTS.SETTINGS_API_KEY,
    type: 'api-keys',
    iconClass: 'fas fa-key',
  },
  siteSettings: {
    containerId: 'site-settings-icons',
    formId: 'site-settings-form',
    fieldsId: 'site-settings-fields',
    endpoint: API_ENDPOINTS.SETTINGS_KEY,
    type: 'site-settings',
    iconClass: 'fas fa-cog',
  },
  provider: {
    containerId: 'provider-icons',
    formId: 'providerForm',
    fieldsId: 'providerContentArea',
    endpoint: API_ENDPOINTS.CLIENT_API_SETTINGS,
    type: 'provider',
    iconClass: 'fas fa-cog',
  },
};

/**
 * Retrieves a settings configuration by type.
 * @param {string} context - The context or module name.
 * @param {string} type - The type of settings (e.g., 'affiliates', 'apiKeys', 'siteSettings', 'provider').
 * @returns {Object} The settings configuration.
 * @throws {Error} If the settings type is unknown.
 */
export function getSettingsConfig(context, type) {
  log(context, `Retrieving settings config for type: ${type}`);
  const config = SETTINGS[type];
  if (!config) {
    throw new Error(`Unknown settings type: ${type}`);
  }
  return config;
}

/**
 * Initializes the settings module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Settings instance with public methods.
 */
export function initializeSettingsModule(registry) {
  const context = 'settings.js';
  log(context, 'Initializing settings module for module registry');
  return {
    SETTINGS,
    getSettingsConfig: (ctx, ...args) => getSettingsConfig(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'settings.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});