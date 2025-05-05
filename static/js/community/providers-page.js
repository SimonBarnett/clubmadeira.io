// /static/js/community/providers-page.js
import { log, warn } from '../core/logger.js';
import { withErrorHandling } from '../utils/error.js';
import { withAuthenticatedUser } from '../core/auth.js';
import { error as notifyError } from '../core/notifications.js';
import { loadClientApiSettings } from './providers-data.js';
import { renderProviderSettings } from './providers-events.js';
import { setupCategoriesNavigation } from './categories-navigation.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { shouldInitializeForPageType } from '../utils/initialization.js';

const context = 'providers-page.js';

/**
 * Initializes the providers page.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializeProvidersPage(context) {
    log(context, 'Initializing providers page');
    await withAuthenticatedUser(context, async (userId) => {
        await withErrorHandling(`${context}:initializeProvidersPage`, async () => {
            // Set up navigation
            await setupCategoriesNavigation(context, 'community', 'providers');

            // Set user ID input
            const userIdInput = document.getElementById('userId');
            if (userIdInput) {
                userIdInput.value = userId;
            } else {
                warn(context, 'userId input not found');
            }

            // Fetch and render the settings
            const settings = await loadClientApiSettings(context);
            await renderProviderSettings(context, settings, 'providerIconsBar', 'client-api-settings');
        });
    }, 'initializeProvidersPage');
}

if (shouldInitializeForPageType('community')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
        initializeProvidersPage(context);
    });
} else {
    log(context, 'Skipping initialization for non-community page');
}