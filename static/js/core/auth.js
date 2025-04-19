// /static/js/core/auth.js
// Purpose: Manages authentication-related operations, including token handling and authenticated requests.

import { log } from './logger.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Sets the authentication token in localStorage.
 * @param {string} token - The authentication token.
 */
export function tokenManagerSetToken(token) {
  const context = 'auth.js';
  log(context, 'Setting auth token');
  localStorage.setItem('authToken', token);
}

/**
 * Decodes the authentication token from localStorage.
 * @returns {Object|null} The decoded token data or null if invalid.
 */
export function tokenManagerDecode() {
  const context = 'auth.js';
  log(context, 'Decoding auth token');
  const token = localStorage.getItem('authToken');
  if (!token) {
    log(context, 'No auth token found');
    return null;
  }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    log(context, 'Token decoded successfully');
    return payload;
  } catch (err) {
    log(context, 'Failed to decode token:', err.message);
    return null;
  }
}

/**
 * Performs an authenticated fetch request with the auth token.
 * @param {string} context - The context or module name.
 * @param {string} url - The API endpoint URL.
 * @param {Object} [options={}] - Fetch options.
 * @returns {Promise<Response>} The fetch response.
 */
export async function authenticatedFetch(context, url, options = {}) {
  log(context, `Performing authenticated fetch to ${url}`);
  return await withErrorHandling(`${context}:authenticatedFetch`, async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    return response;
  }, ERROR_MESSAGES.FETCH_FAILED('authenticated request'));
}

/**
 * Initializes the auth module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Auth instance with public methods.
 */
export function initializeAuthModule(registry) {
  const context = 'auth.js';
  log(context, 'Initializing auth module for module registry');
  return {
    tokenManagerSetToken,
    tokenManagerDecode,
    authenticatedFetch: (ctx, ...args) => authenticatedFetch(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'auth.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});