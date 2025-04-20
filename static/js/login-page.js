// /static/js/login-page.js
// Purpose: Initializes the login page, sets up navigation, and handles login form submission.

import { log } from './core/logger.js';
import { withErrorHandling } from './utils/error.js';
import { toggleViewState, withElement } from './utils/dom-manipulation.js';
import { getMenu } from './config/menus.js';
import { renderForm } from './utils/form-rendering.js';
import { submitConfiguredForm } from './utils/form-submission.js';
import { initializeRoleNavigation, defineSectionHandlers } from './modules/navigation.js';
import { withScriptLogging } from './utils/initialization.js';
import { initializeCoreModules } from './main.js';

const context = 'login-page.js';

/**
 * Parses the page type from a DOM element.
 * @param {string} param - The ID of the element containing the page type.
 * @returns {string|Promise<string>} The parsed page type or a Promise resolving to it.
 */
export function parsePageType(param) {
    return withErrorHandling(context, () => {
        log(context, `Parsing page type from param: ${param}`);
        const pageTypeElement = document.getElementById(param);
        return pageTypeElement ? pageTypeElement.value : 'info';
    }, 'parsePageType');
}

/**
 * Initializes the login page, setting up navigation and the login form.
 * @param {Object} options - Options object containing the module registry.
 * @param {Map} options.registry - The module registry instance.
 */
export async function initializeLoginPage({ registry }) {
    log(context, 'Initializing login page');

    // Initialize core modules first
    await initializeCoreModules();

    // Resolve the page type
    const pageTypeElement = parsePageType('page');
    const pageType = typeof pageTypeElement === 'string' ? pageTypeElement : await pageTypeElement;
    log(context, `Page type resolved: ${pageType}`);

    // Set up navigation for the login role
    const role = 'login';
    const defaultSection = pageType || 'info';
    log(context, `Initializing navigation for role: ${role}, default section: ${defaultSection}`);

    // Define section handlers for the login role
    const sectionHandlers = withErrorHandling(context, () => defineSectionHandlers(role), 'defineSectionHandlers');

    // Retrieve the menu element and menu configuration
    await withElement(context, 'menu', async (menuElement) => {
        const menu = getMenu(role);

        if (!menu || menu.length === 0) {
            log(context, `Navigation element not found for role: ${role}`);
            return;
        }

        log(context, `Retrieved menu for role: ${role}`, menu);

        // Initialize navigation with the menu and default section
        const navigationOptions = { sectionHandlers, defaultSection };
        withErrorHandling(context, () => initializeRoleNavigation(menuElement, menu, navigationOptions), 'initializeRoleNavigation');

        // Initialize the login form in the info section
        log(context, `Initializing login form in section: info`);
        await withElement(context, 'info', async (infoSection) => {
            // Toggle visibility of the info section
            toggleViewState(context, { info: true });

            // Render and submit the login form
            renderForm('loginForm', 'login', infoSection);
            withErrorHandling(context, () => submitConfiguredForm(context, 'loginForm', '/api/login', 'login'), 'submitConfiguredForm');
        }, 10, 100, true);
    }, 10, 100, true);
}

/**
 * Initializes the login page module for use with the module registry.
 * @param {Map} registry - The module registry instance.
 * @returns {Object} Module instance with public methods.
 */
export function initializeLoginPageModule(registry) {
    log(context, 'Initializing login page for module registry');
    return {
        initializeLoginPage: (options) => initializeLoginPage(options),
    };
}

// Initialize module with lifecycle logging
withScriptLogging(context, async () => {
    log(context, 'Module initialized');
    await initializeLoginPage({ registry: new Map() });
});