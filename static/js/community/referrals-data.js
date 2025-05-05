// /static/js/community/referrals-data.js
// Purpose: Manages data fetching for referral visits and orders, integrating with the referral_bp endpoints.

import { log } from '../core/logger.js';
import { authenticatedFetch } from '../core/auth.js';
import { withErrorHandling } from '../utils/error.js';
import { parsePageType, shouldInitializeForPageType } from '../utils/initialization.js';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';

const context = 'referrals-data.js';

/**
 * Processes visits and orders data for the authenticated user, categorizing by time periods.
 * @param {string} context - The context or module name.
 * @returns {Promise<Object>} Object containing categorized visits and orders.
 */
export async function processVisitsAndOrders(context) {
  const pageType = parsePageType(context, 'page', 'community');
  if (pageType === 'login') {
    log(context, `Skipping authenticated operation on login page`);
    return { visits: { thisMonth: [], lastMonth: [], earlier: [] }, orders: { thisMonth: [], lastMonth: [], earlier: [] } };
  }
  log(context, `Processing visits and orders for authenticated user`);
  return await withErrorHandling(`${context}:processVisitsAndOrders`, async () => {
    const visitsData = await loadVisits(context);
    const ordersData = await loadOrders(context);
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
  }, ERROR_MESSAGES.FETCH_FAILED('visits and orders processing'), () => ({
    visits: { thisMonth: [], lastMonth: [], earlier: [] },
    orders: { thisMonth: [], lastMonth: [], earlier: [] }
  }));
}

/**
 * Fetches referral visits for the authenticated user from the /referral/visits endpoint.
 * @param {string} context - The context or module name.
 * @returns {Promise<Object>} Object containing the visits array.
 */
async function loadVisits(context) {
  const pageType = parsePageType(context, 'page', 'community');
  if (pageType === 'login') {
    log(context, `Skipping visits fetch on login page`);
    return { visits: [] };
  }
  log(context, `Fetching visits for authenticated user`);
  return await withErrorHandling(`${context}:loadVisits`, async () => {
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.REFERRAL_VISITS);
      const data = await response.json();
      if (data.status === 'error') {
        throw new Error(data.message || ERROR_MESSAGES.FETCH_FAILED('visits'));
      }
      return { visits: data.visits || [] };
    } catch (err) {
      if (err.message.includes('404')) {
        log(context, `No visits found, returning empty array`);
        return { visits: [] };
      }
      throw err;
    }
  }, ERROR_MESSAGES.FETCH_FAILED('visits'), () => ({ visits: [] }));
}

/**
 * Fetches referral orders for the authenticated user from the /referral/orders endpoint.
 * @param {string} context - The context or module name.
 * @returns {Promise<Object>} Object containing the orders array.
 */
async function loadOrders(context) {
  const pageType = parsePageType(context, 'page', 'community');
  if (pageType === 'login') {
    log(context, `Skipping orders fetch on login page`);
    return { orders: [] };
  }
  log(context, `Fetching orders for authenticated user`);
  return await withErrorHandling(`${context}:loadOrders`, async () => {
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.REFERRAL_ORDERS);
      const data = await response.json();
      if (data.status === 'error') {
        throw new Error(data.message || ERROR_MESSAGES.FETCH_FAILED('orders'));
      }
      return { orders: data.orders || [] };
    } catch (err) {
      if (err.message.includes('404')) {
        log(context, `No orders found, returning empty array`);
        return { orders: [] };
      }
      throw err;
    }
  }, ERROR_MESSAGES.FETCH_FAILED('orders'), () => ({ orders: [] }));
}

/**
 * Initializes the referrals-data module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} ReferralsData instance with public methods.
 */
export function initializeReferralsDataModule(registry) {
  log(context, 'Initializing referrals data module for module registry');
  return {
    processVisitsAndOrders: (ctx) => processVisitsAndOrders(ctx),
    loadVisits: (ctx) => loadVisits(ctx),
    loadOrders: (ctx) => loadOrders(ctx),
  };
}

if (shouldInitializeForPageType('community')) {
  withScriptLogging(context, () => {
    log(context, 'Module initialized');
  });
} else {
  log(context, 'Skipping initialization for non-community page');
}