// /static/js/partner/initializer.js
import { log } from '../core/logger.js';
import { withAuthenticatedUser } from '../core/auth.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from '../utils/logging-utils.js';

const context = 'initializer.js';

/**
 * Initializes partner modules and sets up additional page elements.
 * @param {string} context - The context or module name.
 * @param {string} pageType - The type of page to initialize (e.g., 'integrations').
 * @returns {Promise<void>}
 */
export async function initializePartnerModules(context, pageType) {
    log(context, `Initializing partner modules for page type: ${pageType}`);
    await withAuthenticatedUser(context, async (userId) => {
        await withErrorHandling(`${context}:initializePartnerModules`, async () => {
            const userIdInput = document.getElementById('userId');
            if (userIdInput) {
                userIdInput.value = userId;
                log(context, `Set userId input to: ${userId}`);
            } else {
                log(context, 'userId input not found');
            }
            // Additional initialization can be added here if needed
            window.setupCollapsibleSections?.();
            log(context, 'Collapsible sections setup completed');
        }, ERROR_MESSAGES.MODULE_INIT_FAILED);
    }, 'initializePartnerModules');
}

/**
 * Initializes the initializer module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Initializer module instance.
 */
export function initializeInitializerModule(registry) {
    log(context, 'Initializing initializer module for module registry');
    return {
        initializePartnerModules: (ctx, pageType) => initializePartnerModules(ctx, pageType),
    };
}

withScriptLogging(context, () => {
    log(context, 'Module initialized');
});