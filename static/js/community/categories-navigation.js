// /static/js/community/categories-navigation.js
import { log } from '../core/logger.js';
import { defineSectionHandlers } from '../modules/navigation.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { toggleViewState } from '../utils/dom-manipulation.js';
import { shouldInitializeForPageType } from '../utils/initialization.js';

const context = 'categories-navigation.js';

export async function setupCategoriesNavigation(context, role, defaultSection) {
    log(context, `Setting up navigation for role ${role}, section ${defaultSection}`);
    await withErrorHandling(`${context}:setupCategoriesNavigation`, async () => {
        defineSectionHandlers(context, 'community', [
            {
                id: 'info',
                handler: async () => {
                    log(context, 'Loading info section');
                    toggleViewState(context, { info: true });
                },
            },
            {
                id: 'categories',
                handler: async () => {
                    log(context, 'Loading categories section');
                    await import('./categories-page.js').then(m => m.initializeCategoriesPage(context));
                },
            },
            {
                id: 'providers',
                handler: async () => {
                    log(context, 'Loading providers section');
                    await import('./providers-page.js').then(m => m.initializeProvidersPage(context));
                },
            },
            {
                id: 'referrals',
                handler: async () => {
                    log(context, 'Loading referrals section');
                    await import('./referrals-page.js').then(m => m.initializeReferralsPage(context));
                },
            },
        ]);
    }, ERROR_MESSAGES.NAVIGATION_INIT_FAILED);
}

export function initializeCategoriesNavigationModule(registry) {
    log(context, 'Initializing categories-navigation module for module registry');
    return {
        setupCategoriesNavigation: (ctx, ...args) => setupCategoriesNavigation(ctx, ...args),
    };
}

if (shouldInitializeForPageType('community')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-community page');
}