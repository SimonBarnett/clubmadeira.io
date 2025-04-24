// /static/js/config/constants.js
// Purpose: Centralizes constants for the application by re-exporting from other modules.

import { log } from '../core/logger.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { API_ENDPOINTS } from './endpoints.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from './messages.js';

const context = 'constants.js';

// Export the constants for use in other modules
export { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES };

/**
 * Initializes the constants module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Constants instance with public constants.
 */
export function initializeConstantsModule(registry) {
    log(context, 'Initializing constants module for module registry');
    return {
        API_ENDPOINTS,
        ERROR_MESSAGES,
        SUCCESS_MESSAGES,
    };
}

// Initialize module with lifecycle logging
withScriptLogging(context, () => {
    log(context, 'Module initialized');
});