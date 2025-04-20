// /static/js/config/endpoints.js
// Purpose: Defines API endpoints for the application, centralizing all API routes for consistent usage.

import { log } from '../core/logger.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * API endpoint definitions with parameterized routes where applicable.
 * @type {Object.<string, string|Function>}
 */
export const API_ENDPOINTS = {
  // Admin endpoints
  SETTINGS_AFFILIATE: '/settings/affiliate',
  SETTINGS_API_KEY: '/settings/api-key',
  SETTINGS_KEY: '/settings/site',
  USERS_ROLE: role => `/users/role/${role}`,
  USERS_USERID: userId => `/users/${userId}`,
  PERMISSION: '/permissions',
  DEALS: '/deals',

  // Community endpoints
  CATEGORIES: '/categories',
  SAVE_CATEGORIES: '/categories/save',
  RESET_CATEGORIES: '/categories/reset',
  CLIENT_API_SETTINGS: '/settings/client_api',
  CHECK_DOMAIN: '/check-domain',
  VISITS: userId => `/visits/${userId}`,
  ORDERS: userId => `/orders/${userId}`,

  // Partner endpoints
  CLIENT_API: '/client-api',

  // User settings endpoints
  SETTINGS_USER: '/settings/user',
  UPDATE_PASSWORD: '/update-password',

  // Site request endpoint
  SITE_REQUEST: userId => `/site-request/${userId}`,

  // Merchant endpoints
  API_KEY: '/settings/api_key',
  PRODUCTS: '/settings/products',

  // Login endpoints
  LOGIN: '/',
  RESET_PASSWORD: '/reset-password',
  VERIFY_RESET_CODE: '/verify-reset-code',
  SIGNUP: '/signup',
  VERIFY_TOKEN: '/verify-token',
};

/**
 * Initializes the endpoints module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Endpoints instance with public endpoints.
 */
export function initializeEndpointsModule(registry) {
  const context = 'endpoints.js';
  log(context, 'Initializing endpoints module for module registry');
  return {
    API_ENDPOINTS,
  };
}

/**
 * Initializes the endpoints module.
 */
export function initializeEndpoints() {
  withScriptLogging('endpoints.js', () => {
    log('endpoints.js', 'Module initialized');
  });
}