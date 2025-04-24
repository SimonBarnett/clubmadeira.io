// /static/js/utils/error.js
// Purpose: Provides error handling utilities.

import { log } from '../core/logger.js';
import { ERROR_MESSAGES } from '../config/messages.js';

const context = 'error.js';

/**
 * Wraps a function with error handling, logging errors and throwing a default message if needed.
 * @param {string} context - The context or module name.
 * @param {Function} fn - The function to execute.
 * @param {string} operation - The operation name for logging.
 * @returns {Promise<*>} The result of the function execution.
 * @throws {Error} If the function fails and no default message is provided.
 */
export async function withErrorHandling(context, fn, operation) {
    log(context, `Executing ${operation || 'operation'} with error handling`);
    try {
        return await fn();
    } catch (error) {
        log(context, `Error during ${operation || 'operation'}: ${error.message}`);
        throw new Error(error.message || ERROR_MESSAGES.DEFAULT);
    }
}

// Note: Lifecycle logging was removed to avoid circular dependencies.
// Original commented code:
// withScriptLogging(context, () => {
//     log(context, 'Module initialized');
// });