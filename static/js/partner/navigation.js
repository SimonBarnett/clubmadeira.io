// /static/js/partner/navigation.js
import { log } from '../core/logger.js';
import { defineSectionHandlers } from '../modules/navigation.js';
import { toggleViewState } from '../utils/dom-manipulation.js';
import { withScriptLogging } from '../utils/logging-utils.js';

const context = 'partner/navigation.js';

/**
 * Defines section handlers for the partner page.
 * @param {string} context - The context or module name.
 * @returns {Object} Section handlers object.
 */
export function definePartnerSectionHandlers(context) {
    log(context, 'Defining partner section handlers');

    const specificHandlers = [
        {
            id: 'info',
            handler: async () => {
                log(context, 'Loading info section');
                toggleViewState(context, { info: true });
            },
        },
        {
            id: 'integrations',
            handler: async () => {
                log(context, 'Loading integrations section');
                await import('./integrations.js').then(m => m.loadIntegrationsSettings(context));
                toggleViewState(context, { integrations: true });
            },
        },
        {
            id: 'settings',
            handler: async () => {
                log(context, 'Loading settings section');
                toggleViewState(context, { settings: true });
            },
        },
        {
            id: 'referrals',
            handler: async () => {
                log(context, 'Loading referrals section');
                toggleViewState(context, { referrals: true });
            },
        },
    ];

    // Use defineSectionHandlers to include generic handlers for all menu sections
    const sectionHandlers = defineSectionHandlers(context, 'partner', specificHandlers);
    log(context, `Section handlers defined: ${Object.keys(sectionHandlers).join(', ')}`);
    return sectionHandlers;
}

/**
 * Initializes the navigation module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Navigation module instance.
 */
export function initializeNavigationModule(registry) {
    log(context, 'Initializing navigation module for module registry');
    return {
        definePartnerSectionHandlers: ctx => definePartnerSectionHandlers(ctx),
    };
}

withScriptLogging(context, () => {
    log(context, 'Module initialized');
});