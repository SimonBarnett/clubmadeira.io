// /static/js/modules/navigation.js
// Purpose: Handles navigation setup and section toggling for different roles.

import { log } from '../core/logger.js';
import { withErrorHandling } from '../utils/error.js';
import { toggleViewState, withElement } from '../utils/dom-manipulation.js';
import { getMenu } from '../config/menus.js';
import { withScriptLogging } from '../utils/initialization.js';

const context = 'navigation.js';

/**
 * Defines section handlers for a given role.
 * @param {string} role - The role for which to define section handlers.
 * @returns {Object} An object mapping section IDs to handler functions.
 */
export function defineSectionHandlers(role) {
    log(context, `Defining section handlers for role: ${role}`);
    const menu = getMenu(role);
    const handlers = {};

    menu.forEach(item => {
        handlers[item.section] = () => {
            log(context, `Handling navigation to section: ${item.section}`);
            const viewState = {};
            menu.forEach(menuItem => {
                viewState[menuItem.section] = menuItem.section === item.section;
            });
            toggleViewState(context, viewState);
        };
    });

    return handlers;
}

/**
 * Initializes navigation for a role by rendering the menu and setting up section handlers.
 * @param {HTMLElement} element - The DOM element to render the menu into.
 * @param {Array} menu - The menu configuration for the role.
 * @param {Object} options - Options for navigation setup.
 * @param {Object} options.sectionHandlers - Section handler functions.
 * @param {string} options.defaultSection - The default section to display.
 */
export function initializeRoleNavigation(element, menu, { sectionHandlers, defaultSection }) {
    log(context, `Initializing role navigation with menu:`, menu);

    if (!element) {
        log(context, 'Navigation element not provided');
        return;
    }

    // Render menu buttons
    element.innerHTML = menu.map(item => `
        <button data-section="${item.section}">
            ${item.label}
        </button>
    `).join('');

    // Set up click event listeners for menu buttons
    menu.forEach(item => {
        const button = element.querySelector(`[data-section="${item.section}"]`);
        if (button) {
            button.addEventListener('click', () => {
                log(context, `Navigating to section: ${item.section}`);
                const handler = sectionHandlers[item.section];
                if (handler) {
                    handler();
                } else {
                    log(context, `No handler found for section: ${item.section}`);
                }
            });
        }
    });

    // Activate the default section
    if (defaultSection) {
        log(context, `Activating default section: ${defaultSection}`);
        const defaultHandler = sectionHandlers[defaultSection];
        if (defaultHandler) {
            defaultHandler();
        } else {
            log(context, `No handler found for default section: ${defaultSection}`);
        }
    }
}

/**
 * Initializes the navigation module for use with the module registry.
 * @param {Map} registry - The module registry instance.
 * @returns {Object} Module instance with public methods.
 */
export function initializeNavigationModule(registry) {
    log(context, 'Initializing navigation module for module registry');
    return {
        defineSectionHandlers: (role) => defineSectionHandlers(role),
        initializeRoleNavigation: (element, menu, options) => initializeRoleNavigation(element, menu, options),
    };
}

// Initialize the module with lifecycle logging
withScriptLogging(context, () => {
    log(context, 'Module initialized');
});