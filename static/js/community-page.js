// /static/js/community-page.js
// Purpose: Orchestrates the community page, coordinating navigation, events, and module initialization.

import { log } from './core/logger.js';
import { parsePageType, initializeRolePage } from './utils/initialization.js';
import { setupCategoriesNavigation } from './community/categories-navigation.js';
import { initializeCategoriesPage } from './community/categories-page.js';
import { initializeProvidersPage } from './community/providers-page.js';
import { initializeReferralsPage } from './community/referrals-page.js';
import { withScriptLogging } from './utils/initialization.js';

/**
 * Initializes the community page.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializeCommunityPage(context) {
  log(context, 'Initializing community page');
  const pageType = parsePageType(context, 'page', 'categories');
  await initializeRolePage(context, 'community', pageType, async () => {
    setupCategoriesNavigation(context, 'community', pageType);
    switch (pageType) {
      case 'categories':
        await initializeCategoriesPage(context);
        break;
      case 'providers':
        await initializeProvidersPage(context);
        break;
      case 'referrals':
        await initializeReferralsPage(context);
        break;
      default:
        log(context, `Unknown page type: ${pageType}`);
    }
  });
}

/**
 * Initializes the community-page module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} CommunityPage instance with public methods.
 */
export function initializeCommunityPageModule(registry) {
  const context = 'community-page.js';
  log(context, 'Initializing community-page module for module registry');
  return {
    initializeCommunityPage: ctx => initializeCommunityPage(ctx),
  };
}

// Initialize module with lifecycle logging
const context = 'community-page.js';
withScriptLogging(context, () => {
  initializeCommunityPage(context);
});