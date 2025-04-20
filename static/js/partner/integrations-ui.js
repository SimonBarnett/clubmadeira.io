// /static/js/partner/integrations-ui.js
// Purpose: Manages UI rendering for integration settings on the partner page.

import { log } from '../core/logger.js';
import { renderSettingsForm } from '../utils/settings-renderer.js';
import { toggleViewState } from '../utils/dom-manipulation.js';
import { renderMarkdownContent } from '../utils/form-rendering.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from '../utils/initialization.js';
import { createModuleInitializer } from '../utils/initialization.js';

/**
 * Renders integration settings based on the provided data and container.
 * @param {string} context - The context or module name.
 * @param {Array} settings - The integration settings data.
 * @param {string} containerId - The ID of the container to render into.
 * @returns {Promise<void>}
 */
export async function renderIntegrations(context, settings, containerId) {
  log(context, `Rendering integration settings in container: ${containerId}`);
  await withErrorHandling(`${context}:renderIntegrations`, async () => {
    await renderSettingsForm(context, {
      containerId,
      formId: 'integrationsForm',
      fieldsId: 'integrationsFields',
      settings,
      type: 'integrations',
      endpoint: '/client-api',
      iconClass: 'fas fa-plug',
      onIconClick: (setting, fieldsContainer, form) => {
        toggleViewState(context, { integrationsFields: true });
        Array.from(document.getElementById(containerId).children).forEach(child => {
          child.style.color = child.dataset.keyType === setting.keyType ? '#007bff' : '#C0C0C0';
        });
      },
      onReadmeClick: async setting => {
        const readmeLink = setting.docLink?.find(link => link.title === 'readme')?.link;
        if (readmeLink) {
          await renderMarkdownContent(context, readmeLink, `mdContent-${setting.keyType}`);
          toggleViewState(context, { [`mdContent-${setting.keyType}`]: true });
        }
      },
    });
  }, ERROR_MESSAGES.RENDER_FAILED('integrations'));
}

/**
 * Initializes the integrations-ui module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} IntegrationsUi instance with public methods.
 */
export function initializeIntegrationsUiModule(registry) {
  return createModuleInitializer('integrations-ui.js', {
    renderIntegrations,
  });
}

// Initialize module with lifecycle logging
const context = 'integrations-ui.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});