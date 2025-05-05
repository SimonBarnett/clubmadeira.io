// /static/js/community/community-providers.js
import { log } from '../core/logger.js';
import { withErrorHandling } from '../utils/error.js';
import { withAuthenticatedUser } from '../core/auth.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { initializeProvidersPage } from './providers-page.js';
import { setupCategoriesNavigation } from './categories-navigation.js';
import { setupCollapsibleSections } from '../utils/dom-manipulation.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { shouldInitializeForPageType } from '../utils/initialization.js';

const context = 'community-providers.js';

export function initializeProviders(context) {
    log(context, 'Initializing providers page');
    withErrorHandling(`${context}:initializeProviders`, () => {
        withAuthenticatedUser(context, async (userId) => {  // Fixed syntax with parentheses
            const userIdInput = document.getElementById('userId');
            if (userIdInput) userIdInput.value = userId;
            setupCategoriesNavigation(context, 'community', 'providers');
            initializeProvidersPage(context);
            setupCollapsibleSections(context);
        }, 'initializeProviders');
    }, ERROR_MESSAGES.FETCH_FAILED('providers page initialization'));
}

export function initializeCommunityProvidersModule(registry) {
    log(context, 'Initializing community providers module for module registry');
    return {
        initializeProviders: (ctx) => initializeProviders(ctx),
    };
}

if (shouldInitializeForPageType('community')) {
    withScriptLogging(context, () => {
        initializeProviders(context);
    });
} else {
    log(context, 'Skipping initialization for non-community page');
}