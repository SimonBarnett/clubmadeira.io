// File path: /static/js/merchant/navigation.js
import { log, error as logError } from '../core/logger.js';
import { defineSectionHandlers } from '../modules/navigation.js';
import { toggleViewState } from '../utils/dom-manipulation.js';
import { loadApiKeys } from './api-keys.js';
import { loadProducts } from './products.js';
import { initializeReferralsPage } from './referrals-page.js';
import { selectPeriod, renderPeriodIcons } from './referrals-ui.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { error as notifyError } from '../core/notifications.js';

const context = 'merchant/navigation.js';

const topLevelSections = ['info', 'my-products', 'api-keys', 'logsIntro'];
const allSections = ['info', 'my-products', 'api-keys', 'logsIntro', 'logs'];

export function defineMerchantSectionHandlers(contextParameter) {
    log(contextParameter, 'Defining section handlers for the merchant interface');

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
            id: 'my-products',
            handler: async function() {
                log(contextParameter, 'Loading the my products section');
                await loadProducts(contextParameter);
                const state = allSections.reduce(function(accumulator, section) {
                    accumulator[section] = section === 'my-products';
                    return accumulator;
                }, {});
                toggleViewState(contextParameter, state);
            },
        },
        {
            id: 'api-keys',
            handler: async function() {
                log(contextParameter, 'Loading the API keys section');
                await loadApiKeys(contextParameter);
                const state = allSections.reduce(function(accumulator, section) {
                    accumulator[section] = section === 'api-keys';
                    return accumulator;
                }, {});
                toggleViewState(contextParameter, state);
            },
        },
        {
            id: 'logsIntro',
            handler: async function(show) {
                log(contextParameter, 'Loading the logs introduction section');
                toggleViewState(contextParameter, { logsIntro: show });
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
    ];

    const sectionHandlers = defineSectionHandlers(contextParameter, 'merchant', specificHandlers);
    return sectionHandlers;
}

export function initializeNavigationModule(registry) {
    log(context, 'Initializing the navigation module for the module registry');
    return {
        defineMerchantSectionHandlers: function(contextParameter) {
            return defineMerchantSectionHandlers(contextParameter);
        },
    };
}

withScriptLogging(context, function() {
    log(context, 'Module initialized');
});