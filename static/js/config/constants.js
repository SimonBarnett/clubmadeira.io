// /static/js/config/constants.js
// Purpose: Defines centralized constants for the application.

import { log } from '../core/logger.js';
import { withScriptLogging } from '../utils/initialization.js';

const context = 'constants.js';

// No ERROR_MESSAGES or SUCCESS_MESSAGES here; they are now in messages.js

/**
 * Initializes the constants module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Constants instance with public constants.
 */
export function initializeConstantsModule(registry) {
    log(context, 'Initializing constants module for module registry');
    return {};
}

// Initialize module with lifecycle logging
withScriptLogging(context, () => {
    log(context, 'Module initialized');
});