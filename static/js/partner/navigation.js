// /static/js/partner/navigation.js
import { log } from '../core/logger.js';
import { defineSectionHandlers } from '../modules/navigation.js';
import { loadIntegrationsSettings } from './integrations.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { toggleViewState } from '../utils/dom-manipulation.js';

/**
 * Defines section handlers for the partner page.
 * @param {string} context - The context or module name.
 * @returns {void}
 */
export function definePartnerSectionHandlers(context) {
  log(context, 'Defining partner section handlers');
  defineSectionHandlers(context, 'partner', [
    {
      id: 'info',
      handler: async () => {
        log(context, 'Loading info section');
        toggleViewState(context, { info: true });
      },
    },
    {
      id: 'integrations',
      handler: async () => {
        log(context, 'Loading integrations section');
        await loadIntegrationsSettings(context);
      },
    },
  ]);
}

/**
 * Initializes the navigation module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Navigation instance with public methods.
 */
export function initializeNavigationModule(registry) {
  const context = 'navigation.js';
  log(context, 'Initializing navigation module for module registry');
  return {
    definePartnerSectionHandlers: ctx => definePartnerSectionHandlers(ctx),
  };
}

// Initialize module with lifecycle logging
const context = 'navigation.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});