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
 * @returns {*} The result of the function execution.
 * @throws {Error} If the function fails and no default message is provided.
 */
export function withErrorHandling(context, fn, operation) {
    log(context, `Executing ${operation || 'operation'} with error handling`);
    try {
        return fn();
    } catch (error) {
        log(context, `Error during ${operation || 'operation'}: ${error.message}`);
        throw new Error(error.message || ERROR_MESSAGES.DEFAULT);
    }
}

// Removed lifecycle logging to break circular dependency
// withScriptLogging(context, () => {
//     log(context, 'Module initialized');
// });s