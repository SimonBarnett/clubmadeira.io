// /static/js/community/referrals-page.js
// Purpose: Orchestrates the initialization of the community referrals page.

import { log } from '../core/logger.js';
import { withErrorHandling } from '../utils/error.js';
import { withAuthenticatedUser } from '../core/auth.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { processVisitsAndOrders } from './referrals-data.js';
import { updateVisitsTable, updateOrdersTable } from './referrals-ui.js';
import { setupCategoriesNavigation } from './categories-navigation.js';
import { setupCollapsibleSections } from '../utils/dom-manipulation.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { shouldInitializeForPageType } from '../utils/initialization.js';

const context = 'referrals-page.js';

/**
 * Initializes the referrals page, fetching and rendering visits and orders.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializeReferralsPage(context) {
  log(context, 'Initializing referrals page');
  await withAuthenticatedUser(context, async (userId) => {
    await withErrorHandling(`${context}:initializeReferralsPage`, async () => {
      await setupCategoriesNavigation(context, 'community', 'referrals');
      const { visits, orders } = await processVisitsAndOrders(context);
      updateVisitsTable(context, { visits });
      updateOrdersTable(context, { orders });
      setupCollapsibleSections(context);
    }, ERROR_MESSAGES.FETCH_FAILED('referrals page initialization'));
  }, 'initializeReferralsPage');
}

if (shouldInitializeForPageType('community')) {
  withScriptLogging(context, () => {
    log(context, 'Module initialized');
    initializeReferralsPage(context);
  });
} else {
  log(context, 'Skipping initialization for non-community page');
}