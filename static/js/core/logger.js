// /static/js/core/logger.js
import { withScriptLogging } from '../utils/logging-utils.js';

/**
 * Logs a message to the console with the specified context.
 * @param {string} context - The context or module name.
 * @param {...any} args - Arguments to log.
 */
export function log(context, ...args) {
    console.log(`[${context}]`, ...args);
}

/**
 * Logs a warning to the console with the specified context.
 * @param {string} context - The context or module name.
 * @param {...any} args - Arguments to log.
 */
export function warn(context, ...args) {
    console.warn(`[${context}]`, ...args);
}

/**
 * Logs an error to the console with the specified context.
 * @param {string} context - The context or module name.
 * @param {...any} args - Arguments to log.
 */
export function error(context, ...args) {
    console.error(`[${context}]`, ...args);
}

/**
 * Initializes the logger module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Logger instance with public methods.
 */
export function initializeLoggerModule(registry) {
    const context = 'logger.js';
    log(context, 'Initializing logger module for module registry');
    return {
        log,
        warn,
        error,
    };
}

// Initialize module with lifecycle logging
const context = 'logger.js';
withScriptLogging(context, () => {
    log(context, 'Module initialized');
});