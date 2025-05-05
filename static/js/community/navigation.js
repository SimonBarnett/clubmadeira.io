// /static/js/community/navigation.js
import { log, warn } from '../core/logger.js';
import { defineSectionHandlers } from '../modules/navigation.js';
import { toggleViewState, withElement } from '../utils/dom-manipulation.js';
import { renderMarkdown } from '../core/markdown.js';
import { initializeCategoriesPage } from './categories-page.js';
import { initializeProvidersPage } from './providers-page.js';
import { initializeReferralsPage } from './referrals-page.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from '../utils/logging-utils.js';

const context = 'community/navigation.js';

/**
 * Defines section handlers for the community page.
 * @param {string} context - The context or module name.
 * @returns {Object} Section handlers object.
 */
export function defineCommunitySectionHandlers(context) {
    log(context, 'Defining community section handlers');

    const specificHandlers = [
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
                await initializeCategoriesPage(context);
                toggleViewState(context, { categories: true });
            },
        },
        {
            id: 'providers',
            handler: async () => {
                log(context, 'Loading providers section');
                await initializeProvidersPage(context);
                toggleViewState(context, { providers: true });
            },
        },
        {
            id: 'referrals',
            handler: async () => {
                log(context, 'Loading referrals section');
                await initializeReferralsPage(context);
                toggleViewState(context, { referrals: true });
            },
        },
        {
            id: 'visits',
            handler: async () => {
                log(context, 'Loading visits section');
                await initializeReferralsPage(context);
                toggleViewState(context, { visits: true });
            },
        },
        {
            id: 'orders',
            handler: async () => {
                log(context, 'Loading orders section');
                await initializeReferralsPage(context);
                toggleViewState(context, { orders: true });
            },
        },
        {
            id: 'my_website_intro_section',
            handler: async () => {
                log(context, 'Loading my_website_intro_section');
                await withErrorHandling(`${context}:my_website_intro_section`, async () => {
                    // Dynamic import for providers initialization
                    const { initializeProviders } = await import('./community-providers.js');
                    log(context, 'Imported initializeProviders from community-providers.js');
                    await initializeProviders(context);
                    await withElement(context, 'markdown-content', async (section) => {
                        try {
                            // Use renderMarkdown from core/markdown.js
                            const htmlContent = await renderMarkdown(context, '/static/md/link_my_website.md');
                            section.innerHTML = htmlContent;
                            toggleViewState(context, { my_website_intro_section: true });
                        } catch (err) {
                            warn(context, `Failed to render markdown: ${err.message}`);
                            section.innerHTML = '<p>Error: Unable to load website integration guide. Please try again later.</p>';
                        }
                    }, 3, 50, false);
                }, ERROR_MESSAGES.MARKDOWN_RENDER_FAILED);
            },
        },
        {
            id: 'no_website',
            handler: async () => {
                log(context, 'Loading no_website section');
                toggleViewState(context, { no_website: true });
            },
        },
        {
            id: 'referrals_intro',
            handler: async () => {
                log(context, 'Loading referrals_intro section');
                await initializeReferralsPage(context);
                toggleViewState(context, { referrals_intro: true });
            },
        },
    ];

    const sectionHandlers = defineSectionHandlers(context, 'community', specificHandlers);
    return sectionHandlers;
}

/**
 * Initializes the navigation module for use with the module registry.
 * @param {Map} registry - The module registry instance.
 * @returns {Object} Module instance with public methods.
 */
export function initializeNavigationModule(registry) {
    log(context, 'Initializing navigation module for module registry');
    return {
        defineCommunitySectionHandlers: ctx => defineCommunitySectionHandlers(ctx),
    };
}

// Initialize the module with lifecycle logging
withScriptLogging(context, () => {
    log(context, 'Module initialized');
});