// /static/js/core/user.js
// Purpose: Manages user-related operations, such as fetching user data and validating user IDs.

import { log } from './logger.js';
import { authenticatedFetch } from './auth.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Fetches user data for the specified user ID.
 * @param {string} context - The context or module name.
 * @param {string} userId - The user ID.
 * @returns {Promise<Object>} The user data.
 */
export async function fetchUser(context, userId) {
  log(context, `Fetching user data for userId: ${userId}`);
  return await withErrorHandling(`${context}:fetchUser`, async () => {
    const response = await authenticatedFetch(context, API_ENDPOINTS.USERS_USERID(userId));
    const data = await response.json();
    if (data.status === 'error') {
      throw new Error(data.message || ERROR_MESSAGES.FETCH_FAILED('user'));
    }
    return data;
  }, ERROR_MESSAGES.FETCH_FAILED('user'));
}

/**
 * Validates the user ID from localStorage or DOM.
 * @param {string} context - The context or module name.
 * @returns {Promise<string>} The validated user ID.
 * @throws {Error} If no valid user ID is found.
 */
export async function validateUserId(context) {
  log(context, 'Validating user ID');
  return await withErrorHandling(`${context}:validateUserId`, async () => {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      const userIdInput = document.getElementById('userId');
      userId = userIdInput?.value;
      if (!userId) {
        throw new Error(ERROR_MESSAGES.USER_ID_NOT_FOUND);
      }
      localStorage.setItem('userId', userId);
    }
    log(context, `Validated user ID: ${userId}`);
    return userId;
  }, ERROR_MESSAGES.USER_ID_NOT_FOUND);
}

/**
 * Initializes the user module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} User instance with public methods.
 */
export function initializeUserModule(registry) {
  const context = 'user.js';
  log(context, 'Initializing user module for module registry');
  return {
    fetchUser: (ctx, ...args) => fetchUser(ctx, ...args),
    validateUserId: (ctx, ...args) => validateUserId(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'user.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});