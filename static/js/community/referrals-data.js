// /static/js/community/referrals-data.js
// Purpose: Manages data fetching and processing for the community referrals page.

import { log } from '../core/logger.js';
import { authenticatedFetch } from '../core/auth.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Processes visits and orders data, splitting them by time periods.
 * @param {string} context - The context or module name.
 * @param {string} userId - The user ID.
 * @returns {Promise<{visits: Object, orders: Object}>} The processed visits and orders data.
 */
export async function processVisitsAndOrders(context, userId) {
  log(context, `Processing visits and orders for user: ${userId}`);
  return await withErrorHandling(`${context}:processVisitsAndOrders`, async () => {
    const visitsData = await loadVisits(context, userId);
    const ordersData = await loadOrders(context, userId);

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const visits = {
      thisMonth: [],
      lastMonth: [],
      earlier: [],
    };
    visitsData.visits.forEach(visit => {
      const visitDate = new Date(visit.timestamp);
      if (visitDate.getFullYear() === thisYear && visitDate.getMonth() === thisMonth) {
        visits.thisMonth.push(visit);
      } else if (
        (visitDate.getFullYear() === thisYear && visitDate.getMonth() === thisMonth - 1) ||
        (visitDate.getFullYear() === thisYear - 1 && thisMonth === 0 && visitDate.getMonth() === 11)
      ) {
        visits.lastMonth.push(visit);
      } else {
        visits.earlier.push(visit);
      }
    });

    const orders = {
      thisMonth: [],
      lastMonth: [],
      earlier: [],
    };
    ordersData.orders.forEach(order => {
      const orderDate = new Date(order.timestamp);
      if (orderDate.getFullYear() === thisYear && orderDate.getMonth() === thisMonth) {
        orders.thisMonth.push(order);
      } else if (
        (orderDate.getFullYear() === thisYear && orderDate.getMonth() === thisMonth - 1) ||
        (orderDate.getFullYear() === thisYear - 1 && thisMonth === 0 && orderDate.getMonth() === 11)
      ) {
        orders.lastMonth.push(order);
      } else {
        orders.earlier.push(order);
      }
    });

    return { visits, orders };
  }, ERROR_MESSAGES.FETCH_FAILED('visits and orders processing'));
}

/**
 * Fetches visits data for the specified user.
 * @param {string} context - The context or module name.
 * @param {string} userId - The user ID.
 * @returns {Promise<Object>} The visits data.
 */
async function loadVisits(context, userId) {
  log(context, `Fetching visits for user: ${userId}`);
  return await withErrorHandling(`${context}:loadVisits`, async () => {
    const response = await authenticatedFetch(API_ENDPOINTS.VISITS(userId));
    const data = await response.json();
    if (data.status === 'error') {
      throw new Error(data.message || ERROR_MESSAGES.FETCH_FAILED('visits'));
    }
    return data;
  }, ERROR_MESSAGES.FETCH_FAILED('visits'));
}

/**
 * Fetches orders data for the specified user.
 * @param {string} context - The context or module name.
 * @param {string} userId - The user ID.
 * @returns {Promise<Object>} The orders data.
 */
async function loadOrders(context, userId) {
  log(context, `Fetching orders for user: ${userId}`);
  return await withErrorHandling(`${context}:loadOrders`, async () => {
    const response = await authenticatedFetch(API_ENDPOINTS.ORDERS(userId));
    const data = await response.json();
    if (data.status === 'error') {
      throw new Error(data.message || ERROR_MESSAGES.FETCH_FAILED('orders'));
    }
    return data;
  }, ERROR_MESSAGES.FETCH_FAILED('orders'));
}

/**
 * Initializes the referrals data module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Referrals data instance with public methods.
 */
export function initializeReferralsDataModule(registry) {
  const context = 'referrals-data.js';
  log(context, 'Initializing referrals data module for module registry');
  return {
    processVisitsAndOrders: (ctx, ...args) => processVisitsAndOrders(ctx, ...args),
    loadVisits: (ctx, ...args) => loadVisits(ctx, ...args),
    loadOrders: (ctx, ...args) => loadOrders(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'referrals-data.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});