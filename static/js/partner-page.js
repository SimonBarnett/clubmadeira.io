// /static/js/partner-page.js
import { log } from './core/logger.js';
import { parsePageType, initializeRolePage, hideOverlay, getDefaultSectionFromQuery, shouldInitializeForPageType } from './utils/initialization.js';
import { toggleViewState } from './utils/dom-manipulation.js';
import { withScriptLogging } from './utils/logging-utils.js';
import { definePartnerSectionHandlers } from './partner/navigation.js';
import { initializePartnerModules } from './partner/initializer.js';
import { getMenu } from './config/menus.js';
import { initializeRoleNavigation } from './modules/navigation.js';

const context = 'partner-page.js';

/**
 * Initializes the partner page with navigation and default section visibility.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializePartnerPage(context) {
    log(context, 'Initializing partner page');
    const pageType = parsePageType(context, 'page', 'integrations');
    if (pageType === 'login') {
        log(context, 'Skipping partner page initialization for login page');
        return;
    }
    const role = 'partner';
    const fallbackSection = 'info';
    const defaultSection = getDefaultSectionFromQuery(context, role, fallbackSection);

    await initializeRolePage(context, role, pageType, async () => {
        // Define section handlers
        const sectionHandlers = definePartnerSectionHandlers(context);
        
        // Set up navigation
        const menuElement = document.getElementById('menu');
        if (menuElement) {
            const menu = getMenu(role);
            log(context, `Menu items for ${role}: ${menu.map(item => item.section).join(', ')}`);
            await initializeRoleNavigation(menuElement, menu, { sectionHandlers, defaultSection });
            log(context, 'Navigation initialized with default section:', defaultSection);
        } else {
            log(context, 'Menu element not found, skipping navigation setup');
        }

        // Initialize additional partner modules
        await initializePartnerModules(context, pageType);

        // Ensure the default section is visible
        toggleViewState(context, { [defaultSection]: true });
        log(context, `Default section '${defaultSection}' set to visible`);
    });
}

/**
 * Initializes the partner page module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Partner page module instance.
 */
export function initializePartnerPageModule(registry) {
    log(context, 'Initializing partner-page module for module registry');
    return {
        initializePartnerPage: ctx => initializePartnerPage(ctx),
    };
}

if (shouldInitializeForPageType('partner')) {
    withScriptLogging(context, async () => {
        log(context, 'Module initialized');
        await initializePartnerPage(context);
        hideOverlay();
    });
} else {
    log(context, 'Skipping initialization for non-partner page');
}