// /static/js/partner-page.js
// Purpose: Orchestrates the partner page, coordinating navigation, events, and module initialization.
const context = 'partner-page.js';
import { log } from './core/logger.js';
import { parsePageType, initializeRolePage } from './utils/initialization.js';
import { definePartnerSectionHandlers } from './partner/navigation.js';
import { setupPartnerEvents } from './partner/partner-events.js';
import { initializePartnerModules } from './partner/initializer.js';
import { withScriptLogging , hideOverlay} from './utils/initialization.js';

/**
 * Initializes the partner page.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializePartnerPage(context) {
  log(context, 'Initializing partner page');
  const pageType = parsePageType(context, 'page', 'integrations');
  await initializeRolePage(context, 'partner', pageType, async () => {
    definePartnerSectionHandlers(context);
    initializePartnerModules(context, pageType);
    setupPartnerEvents(context);
  });
}

/**
 * Initializes the partner-page module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} PartnerPage instance with public methods.
 */
export function initializePartnerPageModule(registry) {
  const context = 'partner-page.js';
  log(context, 'Initializing partner-page module for module registry');
  return {
    initializePartnerPage: ctx => initializePartnerPage(ctx),
  };
}

// Initialize module with lifecycle logging
withScriptLogging(context, async () => {
    log(context, 'Module initialized');
    await initializeLoginPage({ registry: new Map() });
    hideOverlay();
});