// /static/js/merchant-page.js
import { log } from './core/logger.js';
import { parsePageType, initializeRolePage, hideOverlay, getDefaultSectionFromQuery, shouldInitializeForPageType } from './utils/initialization.js';
import { toggleViewState } from './utils/dom-manipulation.js';
import { withScriptLogging } from './utils/logging-utils.js';
import { defineMerchantSectionHandlers } from './merchant/navigation.js';
import { initializeMerchantModules } from './merchant/setup.js';
import { getMenu } from './config/menus.js';
import { initializeRoleNavigation } from './modules/navigation.js';

const context = 'merchant-page.js';

/**
 * Initializes the merchant page with navigation and default section visibility.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializeMerchantPage(context) {
    log(context, 'Initializing merchant page');
    const pageType = parsePageType(context, 'page', 'products');
    if (pageType === 'login') {
        log(context, 'Skipping merchant page initialization for login page');
        return;
    }
    const role = 'merchant';
    const fallbackSection = 'info'; // Default to 'info' as per requirement
    const defaultSection = getDefaultSectionFromQuery(context, role, fallbackSection);

    await initializeRolePage(context, role, pageType, async () => {
        const sectionHandlers = defineMerchantSectionHandlers(context);
        
        const menuElement = document.getElementById('menu');
        if (menuElement) {
            const menu = getMenu(role);
            await initializeRoleNavigation(menuElement, menu, { sectionHandlers, defaultSection });
            log(context, 'Navigation initialized with default section:', defaultSection);
        } else {
            log(context, 'Menu element not found, skipping navigation setup');
        }

        await initializeMerchantModules(context, pageType);

        toggleViewState(context, { [defaultSection]: true });
        log(context, `Default section '${defaultSection}' set to visible`);
    });
}

export function initializeMerchantPageModule(registry) {
    log(context, 'Initializing merchant-page module for module registry');
    return {
        initializeMerchantPage: ctx => initializeMerchantPage(ctx),
    };
}

if (shouldInitializeForPageType('merchant')) {
    withScriptLogging(context, async () => {
        log(context, 'Module initialized');
        await initializeMerchantPage(context);
        hideOverlay();
    });
} else {
    log(context, 'Skipping initialization for non-merchant page');
}