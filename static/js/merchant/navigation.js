// /static/js/merchant/navigation.js
import { log } from '../core/logger.js';
import { defineSectionHandlers } from '../modules/navigation.js';
import { toggleViewState } from '../utils/dom-manipulation.js';
import { loadApiKeys } from './api-keys.js';
import { loadProducts } from './products.js';
import { withScriptLogging } from '../utils/logging-utils.js';

const context = 'merchant/navigation.js';

/**
 * Defines and returns section handlers for the merchant page.
 * @param {string} context - The context or module name.
 * @returns {Object} An object mapping section IDs to handler functions.
 */
export function defineMerchantSectionHandlers(context) {
    log(context, 'Defining merchant section handlers');

    const specificHandlers = [
        {
            id: 'info',
            handler: async () => {
                log(context, 'Loading info section');
                toggleViewState(context, { info: true });
            },
        },
        {
            id: 'my-products',
            handler: async () => {
                log(context, 'Loading my-products section');
                await loadProducts(context);
                toggleViewState(context, { 'my-products': true });
            },
        },
        {
            id: 'api-keys',
            handler: async () => {
                log(context, 'Loading api-keys section');
                await loadApiKeys(context);
                toggleViewState(context, { 'api-keys': true });
            },
        },
    ];

    const sectionHandlers = defineSectionHandlers(context, 'merchant', specificHandlers);
    return sectionHandlers;
}

/**
 * Initializes the navigation module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Module instance with public methods.
 */
export function initializeNavigationModule(registry) {
    log(context, 'Initializing navigation module for module registry');
    return {
        defineMerchantSectionHandlers: ctx => defineMerchantSectionHandlers(ctx),
    };
}

// Initialize module with lifecycle logging
withScriptLogging(context, () => {
    log(context, 'Module initialized');
});