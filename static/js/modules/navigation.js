// /static/js/modules/navigation.js
import { log, error as logError } from '../core/logger.js';
import { withErrorHandling } from '../utils/error.js';
import { toggleViewState } from '../utils/dom-manipulation.js';
import { getMenu } from '../config/menus.js';
import { withScriptLogging } from '../utils/logging-utils.js';

const context = 'navigation.js';

// Tracks the currently open menu tree
let activeMenuTree = [];

/**
 * Recursively collects all section IDs from the menu configuration.
 * @param {Array} menu - The menu configuration.
 * @returns {Array} An array of all section IDs.
 */
function getAllSections(menu) {
    let sections = [];
    menu.forEach(item => {
        if (item.section) sections.push(item.section);
        if (item.submenu) {
            sections = sections.concat(getAllSections(item.submenu));
        }
    });
    return sections;
}

/**
 * Resets the navigation state by hiding all sections, clearing active menu states, and re-rendering the menu.
 * @param {string} context - The context or module name for logging.
 * @returns {Promise<void>}
 */
export async function resetNavigation(context) {
    log(context, 'Resetting navigation state');
    await withErrorHandling(`${context}:resetNavigation`, async () => {
        const allSections = document.querySelectorAll('.section');
        allSections.forEach(section => {
            if (section.id !== 'info') {
                section.style.display = 'none';
                log(context, `Hid section: ${section.id}`);
            }
        });

        const menuElement = document.getElementById('menu');
        if (menuElement) {
            menuElement.querySelectorAll('button').forEach(button => {
                button.classList.remove('active');
                log(context, `Cleared active state for button: ${button.dataset.section}`);
            });
        } else {
            logError(context, 'Menu element not found during reset');
        }

        if (menuElement) {
            const role = document.body.dataset.pageType || 'default';
            const defaultSection = 'info';
            const menu = getMenu(role);
            const sectionHandlers = defineSectionHandlers(context, role);
            menuElement.innerHTML = '';
            await initializeRoleNavigation(menuElement, menu, { sectionHandlers, defaultSection });
            log(context, 'Re-rendered menu to reset event listeners');
        }

        const layoutWrapper = document.querySelector('.layout-wrapper');
        if (layoutWrapper) {
            layoutWrapper.style.display = 'block';
            log(context, 'Ensured layout wrapper is visible');
        } else {
            logError(context, 'Layout wrapper not found during reset');
        }

        const infoElement = document.getElementById('info');
        if (infoElement) {
            toggleViewState(context, { info: true });
            log(context, 'Fallback: Ensured info section is visible after reset');
        } else {
            logError(context, 'Fallback failed: Info section not found during reset');
        }
    }, 'Failed to reset navigation state');
}

/**
 * Defines section handlers for a given role, ensuring all sections including common ones and DOM sections have handlers.
 * @param {string} context - The context or module name for logging.
 * @param {string} role - The role for which to define section handlers.
 * @param {Array} handlers - Optional array of custom handler configurations with id and handler properties.
 * @returns {Object} An object mapping section IDs to handler functions.
 */
export function defineSectionHandlers(context, role, handlers = []) {
    log(context, `Defining section handlers for role: ${role}`);
    const menu = getMenu(role);
    const allSections = getAllSections(menu);
    const commonSections = ['my-account', 'contact-details', 'change-password', 'settings'];
    const sectionHandlers = {};

    commonSections.forEach(section => {
        sectionHandlers[section] = async (show = true) => {
            log(context, `Navigating to common section ${section}, show: ${show}`);
            const state = {
                [section]: show,
                info: section === 'info' ? show : false,
            };
            toggleViewState(context, state);
        };
    });

    allSections.forEach(section => {
        if (!commonSections.includes(section)) {
            const handlerConfig = handlers.find(h => h.id === section);
            if (handlerConfig && handlerConfig.handler) {
                sectionHandlers[section] = async (show = true, roleOverride, type) => {
                    log(context, `Navigating to section ${section}, show: ${show}, role: ${roleOverride || role}${type ? `, type: ${type}` : ''}`);
                    const state = {
                        [section]: show,
                        info: section === 'info' ? show : false,
                    };
                    toggleViewState(context, state);
                    await handlerConfig.handler(roleOverride || role, type);
                };
            } else {
                sectionHandlers[section] = async (show = true, roleOverride, type) => {
                    log(context, `Navigating to section ${section} with generic handler, show: ${show}${type ? `, type: ${type}` : ''}`);
                    const state = {
                        [section]: show,
                        info: section === 'info' ? show : false,
                    };
                    toggleViewState(context, state);
                };
            }
        }
    });

    const allDomSections = Array.from(document.querySelectorAll('.section')).map(el => el.id);
    allDomSections.forEach(section => {
        if (!sectionHandlers[section]) {
            sectionHandlers[section] = async (show = true, roleOverride, type) => {
                log(context, `Navigating to section ${section} with default handler, show: ${show}${type ? `, type: ${type}` : ''}`);
                const state = {
                    [section]: show,
                    info: section === 'info' ? show : false,
                };
                toggleViewState(context, state);
            };
        }
    });

    if (!sectionHandlers['info']) {
        sectionHandlers['info'] = async (show = true) => {
            log(context, 'Default info section handler triggered');
            toggleViewState(context, { info: show });
        };
    }

    log(context, `Section handlers defined for role ${role}:`, Object.keys(sectionHandlers));
    return sectionHandlers;
}

/**
 * Closes all submenus not in the active menu tree.
 * @param {Array} activeTree - The current active menu tree path.
 */
function closeIrrelevantSubmenus(activeTree) {
    document.querySelectorAll('.submenu').forEach(submenu => {
        const menuSection = submenu.previousElementSibling.dataset.section;
        if (!activeTree.includes(menuSection)) {
            submenu.style.display = 'none';
        }
    });
    document.querySelectorAll('#menu button').forEach(btn => {
        const btnSection = btn.dataset.section;
        if (!activeTree.includes(btnSection)) {
            btn.classList.remove('submenu-open');
            const caret = btn.querySelector('.submenu-caret');
            if (caret) {
                caret.classList.replace('fa-caret-down', 'fa-caret-right');
            }
        }
    });
}

/**
 * Renders a menu item and its submenus recursively as buttons with carets.
 * @param {Object} item - The menu item configuration with section, label, icons, action, type, and optional submenu.
 * @param {number} level - The nesting level (0 for top-level items).
 * @param {Object} sectionHandlers - Section handler functions.
 * @param {Array} buttons - Array to collect button elements.
 * @param {Array} parentTree - The parent menu tree path.
 */
function renderMenuItem(item, level, sectionHandlers, buttons, parentTree = []) {
    log(context, `Rendering menu item: ${item.label}, level: ${level}, section: ${item.section || 'none'}`);
    const button = document.createElement('button');
    button.dataset.section = item.section || 'action'; // Fallback to 'action' if no section
    button.dataset.level = level.toString();
    if (item.role) button.dataset.role = item.role;
    if (item.action) button.dataset.action = 'true';
    if (item.type) button.dataset.type = item.type; // Store type in dataset if present

    const iconsHTML = Array.isArray(item.icons)
        ? item.icons.map(icon => 
            `<i class="${icon}" style="width: 16px; height: 16px; font-size: 16px; margin-right: 5px;"></i>`
          ).join('')
        : '';

    const caretHTML = Array.isArray(item.submenu) && item.submenu.length > 0
        ? `<i class="fas fa-caret-right submenu-caret" style="width: 16px; height: 16px; font-size: 16px; margin-left: 5px;"></i>`
        : '';

    button.innerHTML = `${iconsHTML}${item.label}${caretHTML}`;
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.padding = '5px 10px';

    button.addEventListener('click', async () => {
        log(context, `Button clicked: ${item.label}, section: ${item.section || 'none'}${item.role ? `, role: ${item.role}` : ''}${item.type ? `, type: ${item.type}` : ''}`);

        // Handle action-based menu items
        if (item.action) {
            log(context, `Executing action for ${item.label}`);
            item.action();
            return; // Exit early, no section navigation needed
        }

        // Proceed with section navigation if no action is present
        const currentTree = [...parentTree, item.section];
        if (level === 0) {
            closeIrrelevantSubmenus(currentTree);
        }

        const handler = sectionHandlers[item.section];
        if (handler) {
            await handler(true, null, item.type); // Pass the log type to the handler
        } else {
            logError(context, `No handler found for section: ${item.section}`);
        }

        if (Array.isArray(item.submenu) && item.submenu.length > 0) {
            const submenuContainer = button.nextElementSibling;
            const isOpen = submenuContainer.style.display === 'block';
            if (isOpen) {
                submenuContainer.style.display = 'none';
                button.classList.remove('submenu-open');
                const caret = button.querySelector('.submenu-caret');
                if (caret) {
                    caret.classList.replace('fa-caret-down', 'fa-caret-right');
                }
                activeMenuTree = activeMenuTree.filter(section => section !== item.section);
            } else {
                submenuContainer.style.display = 'block';
                button.classList.add('submenu-open');
                const caret = button.querySelector('.submenu-caret');
                if (caret) {
                    caret.classList.replace('fa-caret-right', 'fa-caret-down');
                }
                activeMenuTree = currentTree;
            }
        } else {
            document.querySelectorAll('#menu button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        }
    });

    buttons.push(button);

    if (Array.isArray(item.submenu) && item.submenu.length > 0) {
        const submenuContainer = document.createElement('div');
        submenuContainer.className = 'submenu';
        submenuContainer.style.display = 'none';
        const submenuButtons = [];
        item.submenu.forEach(subItem => {
            renderMenuItem(subItem, level + 1, sectionHandlers, submenuButtons, [...parentTree, item.section]);
        });
        submenuButtons.forEach(btn => submenuContainer.appendChild(btn));
        buttons.push(submenuContainer);
    }
}

/**
 * Initializes navigation for a role by rendering the menu and setting up section handlers.
 * @param {HTMLElement} element - The DOM element to render the menu into.
 * @param {Array} menu - The menu configuration for the role.
 * @param {Object} options - Options for navigation setup.
 * @param {Object} options.sectionHandlers - Section handler functions.
 * @param {string} options.defaultSection - The default section to display.
 */
export async function initializeRoleNavigation(element, menu, { sectionHandlers, defaultSection }) {
    log(context, 'Initializing role navigation with menu:', menu.map(item => item.label));
    log(context, 'Received section handlers:', Object.keys(sectionHandlers));

    await withErrorHandling(`${context}:initializeRoleNavigation`, async () => {
        if (!element) {
            logError(context, 'Navigation element not provided');
            toggleViewState(context, { info: true });
            const infoElement = document.getElementById('info');
            if (infoElement) {
                infoElement.style.display = 'block';
                infoElement.classList.add('active');
                log(context, 'Fallback: Info section set to visible due to missing navigation element');
            }
            return;
        }

        if (!Array.isArray(menu)) {
            logError(context, 'Invalid menu configuration; expected an array');
            toggleViewState(context, { info: true });
            const infoElement = document.getElementById('info');
            if (infoElement) {
                infoElement.style.display = 'block';
                infoElement.classList.add('active');
                log(context, 'Fallback: Info section set to visible due to invalid menu');
            }
            return;
        }

        element.innerHTML = '';
        log(context, 'Cleared existing menu content');

        const buttons = [];
        menu.forEach(item => renderMenuItem(item, 0, sectionHandlers, buttons));
        buttons.forEach(button => element.appendChild(button));
        log(context, `Appended ${buttons.length} buttons to menu element`);

        if (typeof defaultSection !== 'string') {
            logError(context, `Invalid defaultSection: expected string, got ${typeof defaultSection}`);
            toggleViewState(context, { info: true });
            const infoElement = document.getElementById('info');
            if (infoElement) {
                infoElement.style.display = 'block';
                infoElement.classList.add('active');
                log(context, 'Fallback: Info section set to visible due to invalid defaultSection');
            }
            return;
        }

        if (defaultSection && sectionHandlers[defaultSection]) {
            log(context, `Activating default section: ${defaultSection}`);
            await sectionHandlers[defaultSection](true);
            toggleViewState(context, { [defaultSection]: true, info: defaultSection === 'info' });
            if (defaultSection !== 'info') {
                const defaultButton = element.querySelector(`[data-section="${defaultSection}"]`);
                if (defaultButton) {
                    defaultButton.classList.add('active');
                    log(context, `Set active class on default button: ${defaultSection}`);
                } else {
                    logError(context, `Default button for section ${defaultSection} not found in DOM`);
                }
            } else {
                log(context, 'Skipping menu button activation for info section');
            }
        } else {
            logError(context, `No handler found for default section: ${defaultSection}`);
            if (sectionHandlers['info']) {
                await sectionHandlers['info'](true);
                toggleViewState(context, { info: true });
                log(context, 'Info section activated via fallback');
            } else {
                const infoElement = document.getElementById('info');
                if (infoElement) {
                    toggleViewState(context, { info: true });
                    infoElement.style.display = 'block';
                    infoElement.classList.add('active');
                    log(context, 'Ultimate fallback: Info section set to visible via direct DOM manipulation');
                } else {
                    logError(context, 'Ultimate fallback failed: Info section not found');
                }
            }
        }
    }, 'Failed to initialize navigation');
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
        resetNavigation: ctx => resetNavigation(ctx),
    };
}

// Initialize the module with lifecycle logging
withScriptLogging(context, () => {
    log(context, 'Module initialized');
});