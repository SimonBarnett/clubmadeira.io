// /static/js/utils/settings-ui.js
// Purpose: Provides low-level utilities for rendering settings fields and UI components.

import { log } from '../core/logger.js';
import { createLinkIcons } from './ui-components.js';
import { setupSettingsEvents } from './settings-events.js';
import { withElement } from './dom-manipulation.js';
import { withErrorHandling } from './error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from './logging-utils.js';

/**
 * Renders settings fields based on the provided settings and configuration.
 * @param {string} context - The context or module name.
 * @param {Array} settings - Array of settings data.
 * @param {Object} config - Configuration object for rendering.
 * @returns {Promise<void>}
 */
export async function renderSettingsFields(context, settings, config) {
  log(context, `Rendering settings fields for type: ${config.type}`);
  await withErrorHandling(`${context}:renderSettingsFields`, async () => {
    await withElement(context, config.containerId, async container => {
      await withElement(context, config.fieldsId, async fieldsContainer => {
        await withElement(context, config.formId, async form => {
          container.innerHTML = '';
          fieldsContainer.innerHTML = '';

          // Ensure settings is an array
          const validSettings = Array.isArray(settings) ? settings : [];
          const linkIcons = createLinkIcons(context, validSettings, config.type, config.onReadmeClick, config.onIconClick);
          
          // Only append if linkIcons is an array
          if (Array.isArray(linkIcons)) {
            container.append(...linkIcons);
          } else {
            log(context, 'No link icons to append; settings may be empty or invalid');
          }

          if (validSettings.length > 0 && validSettings[0].fields) {
            fieldsContainer.innerHTML = validSettings[0].fields
              .map(field => `
                <div>
                  <label for="${field.name}">${field.label || field.name}</label>
                  <input type="${field.type || 'text'}" name="${field.name}" value="${field.value || ''}">
                </div>
              `)
              .join('');
            if (config.onIconClick) {
              config.onIconClick(validSettings[0], fieldsContainer, form);
            }
          } else {
            fieldsContainer.innerHTML = '<p>No settings available for this type.</p>';
            log(context, `No settings data available for type: ${config.type}`);
          }

          setupSettingsEvents(context, config.formId, config.endpoint || '/settings', config.type);
        });
      });
    });
  }, ERROR_MESSAGES.RENDER_FAILED('settings fields'));
}

/**
 * Initializes the settings-ui module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} SettingsUi instance with public methods.
 */
export function initializeSettingsUiModule(registry) {
  const context = 'settings-ui.js';
  log(context, 'Initializing settings-ui module for module registry');
  return {
    renderSettingsFields: (ctx, ...args) => renderSettingsFields(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'settings-ui.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});