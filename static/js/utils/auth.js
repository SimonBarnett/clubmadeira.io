// /static/js/utils/auth.js
// Purpose: Provides authentication utilities for validating user sessions and roles.

import { log } from '../core/logger.js';
import { tokenManagerDecode } from '../core/auth.js';
import { validateUserId } from '../core/user.js';
import { withErrorHandling } from './error.js';
import { ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from './initialization.js';

/**
 * Executes a callback if the user is authenticated.
 * @param {Function} callback - The callback to execute with the user ID.
 * @returns {Promise<void>}
 */
export async function withAuthenticatedUser(callback) {
  const context = 'auth.js';
  log(context, 'Checking authenticated user');
  await withErrorHandling(`${context}:withAuthenticatedUser`, async () => {
    const userId = await validateUserId(context);
    const decoded = tokenManagerDecode();
    if (!decoded) {
      throw new Error('No valid authentication token found');
    }
    await callback(userId);
  }, ERROR_MESSAGES.USER_ID_NOT_FOUND);
}

/**
 * Initializes the auth utilities module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Auth utilities instance with public methods.
 */
export function initializeAuthModule(registry) {
  const context = 'auth.js';
  log(context, 'Initializing auth utilities module for module registry');
  return {
    withAuthenticatedUser,
  };
}

// Initialize module with lifecycle logging
const context = 'auth.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});