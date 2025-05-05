// /static/js/community-page.js
import { log } from './core/logger.js';
import { parsePageType, initializeRolePage, hideOverlay, getDefaultSectionFromQuery, shouldInitializeForPageType } from './utils/initialization.js';
import { toggleViewState } from './utils/dom-manipulation.js';
import { withScriptLogging } from './utils/logging-utils.js';
import { defineCommunitySectionHandlers } from './community/navigation.js';
import { initializeCommunityModules } from './community/setup.js'; // Assuming a setup module exists or can be created
import { getMenu } from './config/menus.js';
import { initializeRoleNavigation } from './modules/navigation.js';

const context = 'community-page.js';

/**
 * Initializes the community page with navigation and default section visibility.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializeCommunityPage(context) {
    log(context, 'Initializing community page');
    const pageType = parsePageType(context, 'page', 'categories');
    if (pageType === 'login') {
        log(context, 'Skipping community page initialization for login page');
        return;
    }
    const role = 'community';
    const fallbackSection = 'info'; // Default to 'info' as per requirement
    const defaultSection = getDefaultSectionFromQuery(context, role, fallbackSection);

    await initializeRolePage(context, role, pageType, async () => {
        // Get section handlers
        const sectionHandlers = defineCommunitySectionHandlers(context);
        
        // Set up navigation
        const menuElement = document.getElementById('menu');
        if (menuElement) {
            const menu = getMenu(role);
            await initializeRoleNavigation(menuElement, menu, { sectionHandlers, defaultSection });
            log(context, 'Navigation initialized with default section:', defaultSection);
        } else {
            log(context, 'Menu element not found, skipping navigation setup');
        }

        // Initialize additional community modules (if any)
        await initializeCommunityModules(context, pageType);

        // Ensure the default section is visible
        toggleViewState(context, { [defaultSection]: true });
        log(context, `Default section '${defaultSection}' set to visible`);
    });
}

export function initializeCommunityPageModule(registry) {
    log(context, 'Initializing community-page module for module registry');
    return {
        initializeCommunityPage: ctx => initializeCommunityPage(ctx),
    };
}

if (shouldInitializeForPageType('community')) {
    withScriptLogging(context, async () => {
        log(context, 'Module initialized');
        await initializeCommunityPage(context);
        hideOverlay();
    });
} else {
    log(context, 'Skipping initialization for non-community page');
}