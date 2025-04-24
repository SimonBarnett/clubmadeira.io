// /static/js/merchant-page.js
// Purpose: Orchestrates the merchant page, coordinating navigation, events, and module initialization.
const context = 'merchant-page.js';
import { log } from './core/logger.js';
import { parsePageType, initializeRolePage } from './utils/initialization.js';
import { withScriptLogging, hideOverlay } from './utils/logging-utils.js';
import { defineMerchantSectionHandlers } from './merchant/navigation.js';
import { initializeMerchantModules } from './merchant/setup.js';

/**
 * Initializes the merchant page.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializeMerchantPage(context) {
  log(context, 'Initializing merchant page');
  const pageType = parsePageType(context, 'page', 'products');
  await initializeRolePage(context, 'merchant', pageType, async () => {
    defineMerchantSectionHandlers(context);
    await initializeMerchantModules(context, pageType);
  });
}

/**
 * Initializes the merchant-page module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} MerchantPage instance with public methods.
 */
export function initializeMerchantPageModule(registry) {
  const context = 'merchant-page.js';
  log(context, 'Initializing merchant-page module for module registry');
  return {
    initializeMerchantPage: ctx => initializeMerchantPage(ctx),
  };
}

// Initialize module with lifecycle logging
withScriptLogging(context, async () => {
    log(context, 'Module initialized');
    await initializeMerchantPage(context);
    hideOverlay();
});