// /static/js/utils/error.js
// Purpose: Provides centralized error handling utilities.

import { log, error as logError } from '../core/logger.js';
import { notifyError } from '../core/notifications.js';
import { ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from './initialization.js';

/**
 * Executes a callback with error handling, logging errors and notifying the user.
 * @param {string} context - The context or module name.
 * @param {Function} callback - The callback to execute.
 * @param {string} [defaultErrorMessage=ERROR_MESSAGES.DEFAULT] - The default error message.
 * @param {Function} [onError] - Optional callback to execute on error.
 * @returns {Promise<any>} The result of the callback or default value on error.
 */
export async function withErrorHandling(context, callback, defaultErrorMessage = ERROR_MESSAGES.DEFAULT, onError) {
  log(context, `Executing with error handling`);
  try {
    return await callback();
  } catch (err) {
    const errorMessage = err.message || defaultErrorMessage;
    logError(context, `Error: ${errorMessage}`);
    notifyError(context, errorMessage);
    if (onError) {
      onError(err);
    }
    throw err;
  }
}

/**
 * Initializes the error module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Error instance with public methods.
 */
export function initializeErrorModule(registry) {
  const context = 'error.js';
  log(context, 'Initializing error module for module registry');
  return {
    withErrorHandling: (ctx, ...args) => withErrorHandling(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'error.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});