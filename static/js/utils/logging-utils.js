// /static/js/utils/logging-utils.js
// Purpose: Provides logging utilities for script lifecycle management.

import { log } from '../core/logger.js';

/**
 * Wraps a module initialization function with lifecycle logging.
 * @param {string} context - The context or module name.
 * @param {Function} initFn - The initialization function to wrap.
 * @returns {void}
 */
export function withScriptLogging(context, initFn) {
  log(context, 'Starting module initialization');
  try {
    const result = initFn();
    log(context, 'Module initialization completed');
    return result;
  } catch (error) {
    log(context, `Module initialization failed: ${error.message}`);
    throw error;
  }
}

/**
 * Initializes the logging-utils module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} LoggingUtils instance with public methods.
 */
export function initializeLoggingUtilsModule(registry) {
  log('logging-utils.js', 'Initializing logging-utils module for module registry');
  return {
    withScriptLogging,
  };
}

// Initialize module with lifecycle logging
const context = 'logging-utils.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});