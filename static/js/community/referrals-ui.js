// /static/js/community/referrals-ui.js
// Purpose: Manages UI rendering for the community referrals page, including visits and orders tables.

import { log } from '../core/logger.js';
import { withErrorHandling } from '../utils/error.js';
import { notifyOperationResult } from '../core/notifications.js';
import { renderDataTable } from '../utils/ui-components.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';

const context = 'referrals-ui.js';

/**
 * Updates the visits table with the provided data.
 * @param {string} context - The context or module name.
 * @param {Object} data - The visits data, with properties thisMonth, lastMonth, and earlier.
 * @returns {void}
 */
export function updateVisitsTable(context, data) {
  log(context, 'Updating visits table');
  withErrorHandling(`${context}:updateVisitsTable`, () => {
    const visitList = document.getElementById('visitList');
    if (!visitList) {
      throw new Error(ERROR_MESSAGES.ELEMENT_NOT_FOUND);
    }

    const headers = ['Date', 'Page'];
    const rowMapper = visit => [
      visit.timestamp || 'N/A',
      visit.page || 'N/A',
    ];

    const visits = [
      ...(data.visits?.thisMonth || []),
      ...(data.visits?.lastMonth || []),
      ...(data.visits?.earlier || []),
    ];

    visitList.innerHTML = renderDataTable(context, {
      data: visits,
      headers,
      rowMapper,
      emptyMessage: ERROR_MESSAGES.NO_DATA('visits'),
    });

    notifyOperationResult(context, {
      success: true,
      message: visits.length ? `${visits.length} visits loaded` : ERROR_MESSAGES.NO_DATA('visits'),
      defaultSuccess: SUCCESS_MESSAGES.DEFAULT,
    });
  }, ERROR_MESSAGES.ELEMENT_NOT_FOUND);
}

/**
 * Updates the orders table with the provided data.
 * @param {string} context - The context or module name.
 * @param {Object} data - The orders data, with properties thisMonth, lastMonth, and earlier.
 * @returns {void}
 */
export function updateOrdersTable(context, data) {
  log(context, 'Updating orders table');
  withErrorHandling(`${context}:updateOrdersTable`, () => {
    const orderList = document.getElementById('orderList');
    if (!orderList) {
      throw new Error(ERROR_MESSAGES.ELEMENT_NOT_FOUND);
    }

    const headers = ['Order ID', 'Buyer', 'Total', 'Date'];
    const rowMapper = order => [
      order.orderId || 'N/A',
      order.buyer || 'N/A',
      order.total != null ? `$${order.total.toFixed(2)}` : 'N/A',
      order.timestamp || 'N/A',
    ];

    const orders = [
      ...(data.orders?.thisMonth || []),
      ...(data.orders?.lastMonth || []),
      ...(data.orders?.earlier || []),
    ];

    orderList.innerHTML = renderDataTable(context, {
      data: orders,
      headers,
      rowMapper,
      emptyMessage: ERROR_MESSAGES.NO_DATA('orders'),
    });

    notifyOperationResult(context, {
      success: true,
      message: orders.length ? `${orders.length} orders loaded` : ERROR_MESSAGES.NO_DATA('orders'),
      defaultSuccess: SUCCESS_MESSAGES.DEFAULT,
    });
  }, ERROR_MESSAGES.ELEMENT_NOT_FOUND);
}

/**
 * Initializes the referrals-ui module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} ReferralsUi instance with public methods.
 */
export function initializeReferralsUiModule(registry) {
  log(context, 'Initializing referrals-ui module for module registry');
  return {
    updateVisitsTable: (ctx, ...args) => updateVisitsTable(ctx, ...args),
    updateOrdersTable: (ctx, ...args) => updateOrdersTable(ctx, ...args),
  };
}

withScriptLogging(context, () => {
  log(context, 'Module initialized');
});