// /static/js/config/pages.js
// Purpose: Maps page types to their corresponding module paths for dynamic imports in main.js.

import { log } from '../core/logger.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Page module mappings for dynamic imports.
 * @type {Object.<string, string[]>}
 */
export const PAGE_MODULES = {
  admin: ['./admin/admin-page.js'],
  login: ['./login-page.js'],
  merchant: ['./merchant/category-management.js', './merchant/site-request.js', './merchant/merchant-page.js'],
  partner: ['./partner/partner-page.js'],
  community: ['./community/category-management.js', './community/site-request.js', './community/community-page.js'],
};

/**
 * Initializes the pages module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Pages instance with public mappings.
 */
export function initializePagesModule(registry) {
  const context = 'pages.js';
  log(context, 'Initializing pages module for module registry');
  return {
    PAGE_MODULES,
  };
}

// Initialize module with lifecycle logging
const context = 'pages.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});