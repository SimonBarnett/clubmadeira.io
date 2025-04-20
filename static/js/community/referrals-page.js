// /static/js/community/referrals-page.js
// Purpose: Orchestrates the community referrals page by coordinating data and UI updates.

import { log } from '../core/logger.js';
import { withErrorHandling } from '../utils/error.js';
import { withAuthenticatedUser } from '../utils/auth.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { processVisitsAndOrders } from './referrals-data.js';
import { updateVisitsTable, updateOrdersTable } from './referrals-ui.js';
import { setupCategoriesNavigation } from './categories-navigation.js';
import { setupCollapsibleSections } from '../utils/dom-manipulation.js'; // Added for collapsible sections
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Initializes the referrals page.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializeReferralsPage(context) {
  log(context, 'Initializing referrals page');
  await withAuthenticatedUser(async userId => {
    await withErrorHandling(`${context}:initializeReferralsPage`, async () => {
      await setupCategoriesNavigation(context, 'community', 'referrals');
      const { visits, orders } = await processVisitsAndOrders(context, userId);
      updateVisitsTable(context, { visits });
      updateOrdersTable(context, { orders });
      setupCollapsibleSections(context); // Replaced window.setupCollapsibleSections
    }, ERROR_MESSAGES.FETCH_FAILED('referrals page initialization'));
  });
}

/**
 * Initializes the referrals page module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Referrals page instance with public methods.
 */
export function initializeReferralsPageModule(registry) {
  const context = 'referrals-page.js';
  log(context, 'Initializing referrals page module for module registry');
  return {
    initializeReferralsPage: (ctx) => initializeReferralsPage(ctx),
  };
}

// Initialize module with lifecycle logging
const context = 'referrals-page.js';
withScriptLogging(context, () => {
  initializeReferralsPage(context);
});