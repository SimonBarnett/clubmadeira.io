// /static/js/modules/navigation.js
import { log } from '../core/logger.js';
import { withErrorHandling } from '../utils/error.js';
import { toggleViewState, withElement } from '../utils/dom-manipulation.js';
import { getMenu } from '../config/menus.js';
import { withScriptLogging } from '../utils/initialization.js';

const context = 'navigation.js';

/**
 * Defines section handlers for a given role.
 * @param {string} context - The context or module name.
 * @param {string} role - The role for which to define section handlers.
 * @param {Array} handlers - Array of handler configurations.
 * @returns {Object} An object mapping section IDs to handler functions.
 */
export function defineSectionHandlers(context, role, handlers = []) {
    log(context, `Defining section handlers for role: ${role}`);
    const menu = getMenu(role);
    const sectionHandlers = {};

    // Map menu items to handlers based on section IDs
    menu.forEach(item => {
        // Find the handler whose ID matches the menu item's ID
        const handlerConfig = handlers.find(h => h.id === item.id);
        if (handlerConfig && handlerConfig.handler) {
            // Map the section from the menu to the handler
            sectionHandlers[item.section] = async () => {
                log(context, `Navigating to section ${item.section}, hiding others`);
                // Hide all other sections and show the target section
                toggleViewState(context, {
                    [item.section]: true,
                    ...menu.reduce((acc, menuItem) => {
                        if (menuItem.section !== item.section) {
                            acc[menuItem.section] = false;
                        }
                        return acc;
                    }, {}),
                    info: item.section === 'info' ? true : false,
                });
                await handlerConfig.handler();
            };
        }
    });

    // Add a handler for the 'info' section if not already present
    if (!sectionHandlers['info']) {
        const infoHandler = handlers.find(h => h.id === 'info');
        if (infoHandler) {
            sectionHandlers['info'] = async () => {
                log(context, `Navigating to section info, hiding others`);
                toggleViewState(context, {
                    info: true,
                    forgotPasswordContainer: false,
                    signupContainer: false,
                });
                await infoHandler.handler();
            };
        }
    }

    // Log the defined handlers for debugging
    log(context, `Section handlers defined for role ${role}:`, Object.keys(sectionHandlers));
    return sectionHandlers;
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

    // Render menu buttons with icons sized to 16x16 pixels
    element.innerHTML = menu.map(item => `
        <button data-section="${item.section}">
            ${item.icon ? `<i class="${item.icon}" style="width: 16px; height: 16px; font-size: 16px; margin-right: 5px;"></i>` : ''} ${item.label}
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
        defineSectionHandlers: (ctx, role, handlers) => defineSectionHandlers(ctx, role, handlers),
        initializeRoleNavigation: (element, menu, options) => initializeRoleNavigation(element, menu, options),
    };
}

// Initialize the module with lifecycle logging
withScriptLogging(context, () => {
    log(context, 'Module initialized');
});