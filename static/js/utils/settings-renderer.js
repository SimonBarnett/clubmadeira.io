// /static/js/utils/settings-renderer.js
// Purpose: Provides utilities for rendering settings UI components.

import { log } from '../core/logger.js';
import { renderSettingsFields } from './settings-ui.js';
import { setupSettingsEvents } from './settings-events.js';
import { withErrorHandling } from './error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from './logging-utils.js';
import { createModuleInitializer } from '../utils/initialization.js';

/**
 * Renders a settings form based on the provided configuration.
 * @param {string} context - The context or module name.
 * @param {Object} config - Settings configuration object.
 * @returns {Promise<void>}
 */
export async function renderSettingsForm(context, config) {
  log(context, `Rendering settings form for type: ${config.type}`);
  await withErrorHandling(`${context}:renderSettingsForm`, async () => {
    await renderSettingsFields(context, config.settings || [], {
      containerId: config.containerId,
      formId: config.formId,
      fieldsId: config.fieldsId,
      type: config.type,
      iconClass: config.iconClass,
      onIconClick: config.onIconClick,
      onReadmeClick: config.onReadmeClick,
    });
    setupSettingsEvents(context, config.formId, config.endpoint || '/settings', config.type);
  }, ERROR_MESSAGES.RENDER_FAILED('settings form'));
}

/**
 * Renders settings based on the provided configuration (legacy, prefer renderSettingsForm).
 * @param {string} context - The context or module name.
 * @param {Object} config - Settings configuration object.
 * @returns {Promise<void>}
 */
export async function renderSettings(context, config) {
  log(context, `Rendering settings for type: ${config.type} (legacy)`);
  await renderSettingsForm(context, config);
}

/**
 * Initializes the settings-renderer module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} SettingsRenderer instance with public methods.
 */
export function initializeSettingsRendererModule(registry) {
  return createModuleInitializer('settings-renderer.js', {
    renderSettings,
    renderSettingsForm,
  });
}

// Initialize module with lifecycle logging
const context = 'settings-renderer.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});