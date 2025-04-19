// /static/js/merchant/setup.js
// Purpose: Handles additional initialization tasks for the merchant page.

import { log } from '../core/logger.js';
import { hasAdminPermission } from '../config/menus.js';
import { toggleViewState } from '../utils/dom-manipulation.js';
import { initializeSiteRequest } from '../modules/site-request.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Initializes merchant-specific modules and performs additional setup tasks.
 * @param {string} context - The context or module name.
 * @param {string} pageType - The type of page to initialize (e.g., 'info', 'store-request').
 * @returns {Promise<void>}
 */
export async function initializeMerchantModules(context, pageType) {
  log(context, `Initializing merchant modules for pageType: ${pageType}`);
  await withErrorHandling(`${context}:initializeMerchantModules`, async () => {
    // Check admin permission and toggle back button visibility
    if (hasAdminPermission(context)) {
      log(context, 'Admin permission detected, showing back button');
      toggleViewState(context, { 'button[data-role="admin"]': true });
    } else {
      toggleViewState(context, { 'button[data-role="admin"]': false });
    }

    // Initialize site request if pageType is store-request
    if (pageType === 'store-request') {
      log(context, 'Initializing site request module');
      await initializeSiteRequest(context, 'store-request');
    }

    // Additional setup (e.g., collapsible sections, other modules)
    if (typeof window.setupCollapsibleSections === 'function') {
      window.setupCollapsibleSections();
    }
  }, ERROR_MESSAGES.MODULE_INIT_FAILED);
}

/**
 * Initializes the setup module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Setup instance with public methods.
 */
export function initializeSetupModule(registry) {
  const context = 'setup.js';
  log(context, 'Initializing setup module for module registry');
  return {
    initializeMerchantModules: (ctx, ...args) => initializeMerchantModules(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'setup.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});