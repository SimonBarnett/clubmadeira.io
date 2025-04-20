// /static/js/partner/integrations.js
// Purpose: Orchestrates the integrations settings page, coordinating data fetching, UI rendering, and event setup.

import { log } from '../core/logger.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { loadIntegrations } from './integrations-data.js';
import { renderIntegrations } from './integrations-ui.js';
import { setupPartnerEvents } from './partner-events.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Loads and renders integration settings.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function loadIntegrationsSettings(context) {
  log(context, 'Loading integration settings');
  await withErrorHandling(`${context}:loadIntegrationsSettings`, async () => {
    const settings = await loadIntegrations(context);
    await renderIntegrations(context, settings, 'integrationsIconsBar');
    setupPartnerEvents(context);
  }, ERROR_MESSAGES.FETCH_FAILED('integrations'));
}

/**
 * Initializes the integrations module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Integrations instance with public methods.
 */
export function initializeIntegrationsModule(registry) {
  const context = 'integrations.js';
  log(context, 'Initializing integrations module for module registry');
  return {
    loadIntegrationsSettings: ctx => loadIntegrationsSettings(ctx),
  };
}

// Initialize module with lifecycle logging
const context = 'integrations.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});