// File path: /static/js/community/navigation.js
import { log, error as logError } from '../core/logger.js';
import { defineSectionHandlers } from '../modules/navigation.js';
import { toggleViewState } from '../utils/dom-manipulation.js';
import { renderMarkdown } from '../core/markdown.js';
import { initializeCategoriesPage } from './categories-page.js';
import { initializeProvidersPage } from './providers-page.js';
import { initializeReferralsPage } from './referrals-page.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { initializeSiteRequest } from '../modules/site-request.js';
import { error as notifyError } from '../core/notifications.js';

const context = 'community/navigation.js';

// Define arrays for section management
const topLevelSections = ['info', 'categories', 'logs', 'my_website_intro_section', 'no_website'];
const allSections = ['info', 'categories', 'logs', 'my_website_intro_section', 'no_website', 'providers'];

// Function to define handlers for each section in the community interface
export function defineCommunitySectionHandlers(contextParameter) {
    log(contextParameter, 'Defining section handlers for the community interface');

    const specificHandlers = [
        {
            id: 'info',
            handler: async function() {
                log(contextParameter, 'Loading the information section');
                const state = allSections.reduce(function(accumulator, section) {
                    accumulator[section] = section === 'info';
                    return accumulator;
                }, {});
                toggleViewState(contextParameter, state);
            },
        },
        {
            id: 'categories',
            handler: async function() {
                log(contextParameter, 'Loading the categories section');
                await initializeCategoriesPage(contextParameter);
                const state = allSections.reduce(function(accumulator, section) {
                    accumulator[section] = section === 'categories';
                    return accumulator;
                }, {});
                toggleViewState(contextParameter, state);
            },
        },
        {
            id: 'providers',
            handler: async function() {
                log(contextParameter, 'Loading the providers section');
                await initializeProvidersPage(contextParameter);
                const state = allSections.reduce(function(accumulator, section) {
                    accumulator[section] = section === 'providers';
                    return accumulator;
                }, {});
                toggleViewState(contextParameter, state);
            },
        },
        {
            id: 'logs',
            handler: async function(show, role, type) {
                log(contextParameter, `Loading logs section with type: ${type || 'none'}`);
                if (show) {
                    if (!type || !['click', 'order'].includes(type)) {
                        logError(contextParameter, `Invalid or missing log type: ${type}`);
                        notifyError(contextParameter, 'Please select a log type (Click or Order Events)');
                        toggleViewState(contextParameter, { logs: false, logsIntro: true });
                        return;
                    }

                    const logsSection = document.getElementById('logs');
                    if (!logsSection) {
                        logError(contextParameter, 'Logs section element not found');
                        notifyError(contextParameter, 'Logs section not found');
                        return;
                    }

                    logsSection.dataset.type = type;
                    log(contextParameter, `Set data-type="${type}" on logs section`);

                    toggleViewState(contextParameter, { logs: true, info: false });

                    try {
                        await initializeReferralsPage(type);
                        const { renderPeriodIcons } = await import('./referrals-ui.js');
                        renderPeriodIcons();
                        log(contextParameter, `Initialized logs UI for type: ${type}`);
                    } catch (err) {
                        logError(contextParameter, `Failed to initialize logs UI: ${err.message}`);
                        notifyError(contextParameter, 'Failed to load logs');
                    }
                } else {
                    toggleViewState(contextParameter, { logs: false });
                }
            },
        },
        {
            id: 'my_website_intro_section',
            handler: async function() {
                log(contextParameter, 'Loading the my website introduction section');
                await withErrorHandling(`${contextParameter}:my_website_intro_section`, async function() {
                    const { initializeProviders } = await import('./community-providers.js');
                    await initializeProviders(contextParameter);
                    await withElement(contextParameter, 'markdown-content', async function(section) {
                        try {
                            const htmlContent = await renderMarkdown(contextParameter, '/static/md/link_my_website.md');
                            section.innerHTML = htmlContent;
                            const state = allSections.reduce(function(accumulator, sectionIdentifier) {
                                accumulator[sectionIdentifier] = sectionIdentifier === 'my_website_intro_section';
                                return accumulator;
                            }, {});
                            toggleViewState(contextParameter, state);
                        } catch (error) {
                            log(contextParameter, `Failed to render markdown content: ${error.message}`);
                            section.innerHTML = '<p>Error: Unable to load website integration guide.</p>';
                        }
                    }, 3, 50, false);
                }, ERROR_MESSAGES.MARKDOWN_RENDER_FAILED);
            },
        },
        {
            id: 'no_website',
            handler: async function() {
                log(contextParameter, 'Loading the no website section');
                await withErrorHandling(`${contextParameter}:no_website`, async function() {
                    await initializeSiteRequest(contextParameter, 'no_website');
                }, 'Failed to initialize the site request');
            },
        },
    ];

    const sectionHandlers = defineSectionHandlers(contextParameter, 'community', specificHandlers);
    return sectionHandlers;
}

// Function to initialize the navigation module for the registry
export function initializeNavigationModule(registry) {
    log(context, 'Initializing the navigation module for the module registry');
    return {
        defineCommunitySectionHandlers: function(contextParameter) {
            return defineCommunitySectionHandlers(contextParameter);
        },
    };
}

// Execute script logging
withScriptLogging(context, function() {
    log(context, 'Module has been initialized');
});