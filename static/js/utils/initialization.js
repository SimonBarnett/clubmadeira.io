// /static/js/utils/initialization.js
// Purpose: Provides utilities for module initialization, page setup, and navigation.

import { log, error as logError } from '../core/logger.js';
import { withAuthenticatedUser } from '../core/auth.js';
import { withErrorHandling } from './error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { defineSectionHandlers } from '../modules/navigation.js';
import { withScriptLogging } from './logging-utils.js';
import { toggleViewState } from './dom-manipulation.js';
import { getMenu } from '../config/menus.js';

const context = 'initialization.js';

/**
 * Determines if the module should be initialized based on the current page type.
 * @param {string} expectedPageType - The page type expected for the module.
 * @returns {boolean} True if the current page type matches the expected page type, false otherwise.
 */
export function shouldInitializeForPageType(expectedPageType) {
    const metaPageType = document.querySelector('meta[name="page-type"]')?.content;
    const shouldInitialize = metaPageType === expectedPageType;
    log(context, `Checking page type: current=${metaPageType}, expected=${expectedPageType}, shouldInitialize=${shouldInitialize}`);
    return shouldInitialize;
}

/**
 * Shows the specified section and hides others.
 * @param {string} sectionId - The ID of the section to show.
 */
function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        if (section.id === sectionId) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
}

/**
 * Creates a module initializer for the registry with standardized method wrapping.
 * @param {string} context - The context or module name.
 * @param {Object} methods - Object mapping method names to functions.
 * @returns {Object} Module instance with wrapped methods.
 */
export function createModuleInitializer(context, methods) {
    log(context, `Initializing ${context} module for module registry`);
    return Object.keys(methods).reduce((acc, key) => {
        acc[key] = (ctx, ...args) => methods[key](ctx, ...args);
        return acc;
    }, {});
}

/**
 * Parses the page type from a meta tag, DOM element, or query parameter.
 * @param {string} context - The context or module name.
 * @param {string} param - The query parameter name or DOM element ID.
 * @param {string} defaultType - The default page type.
 * @returns {string} The parsed page type.
 */
export function parsePageType(context, param, defaultType) {
    log(context, `Parsing page type from param: ${param}`);
    try {
        const metaPageType = document.querySelector('meta[name="page-type"]')?.content;
        if (metaPageType && ['admin', 'community', 'merchant', 'partner', 'login'].includes(metaPageType)) {
            log(context, `Page type resolved from meta tag: ${metaPageType}`);
            return metaPageType;
        }
        const pageTypeElement = document.getElementById(param);
        if (pageTypeElement) {
            const pageType = pageTypeElement.value || defaultType;
            log(context, `Page type resolved from DOM element: ${pageType}`);
            return pageType;
        }
        const urlParams = new URLSearchParams(window.location.search);
        const pageType = urlParams.get(param) || defaultType;
        log(context, `Page type resolved from query parameter: ${pageType}`);
        return pageType;
    } catch (error) {
        logError(context, `Error parsing page type: ${error.message}`);
        return defaultType;
    }
}

/**
 * Retrieves and validates the default section from the `section` query parameter.
 * @param {string} context - The context or module name.
 * @param {string} role - The role associated with the page (e.g., 'admin', 'merchant').
 * @param {string} fallbackSection - The fallback section if the query parameter is invalid.
 * @returns {string} The validated section ID.
 */
export function getDefaultSectionFromQuery(context, role, fallbackSection) {
    log(context, `Parsing default section for role: ${role}, fallback: ${fallbackSection}`);
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const sectionParam = urlParams.get('section');
        if (!sectionParam) {
            log(context, `No section query parameter found, using fallback: ${fallbackSection}`);
            return fallbackSection;
        }

        const validSections = role === 'login' 
            ? ['info', 'signupContainer', 'forgotPasswordContainer', 'completeSignup', 'failSignupContainer']
            : getMenu(role).map(item => item.section);

        if (validSections.includes(sectionParam)) {
            log(context, `Valid section found in query: ${sectionParam}`);
            return sectionParam;
        } else {
            log(context, `Invalid section parameter: ${sectionParam}, using fallback: ${fallbackSection}`);
            return fallbackSection;
        }
    } catch (error) {
        logError(context, `Error getting default section: ${error.message}`);
        return fallbackSection;
    }
}

/**
 * Initializes role-based navigation for a page.
 * @param {HTMLElement} element - The DOM element to render the menu into.
 * @param {Array} menu - The menu configuration for the role.
 * @param {Object} options - Options for navigation setup.
 * @param {Object} options.sectionHandlers - Section handler functions.
 * @param {string} options.defaultSection - The default section to display.
 * @returns {Promise<void>}
 */
export async function initializeRoleNavigation(element, menu, { sectionHandlers, defaultSection }) {
    log(context, 'Initializing role navigation with menu:', menu);
    await withErrorHandling(`${context}:initializeRoleNavigation`, async () => {
        if (!element) {
            log(context, 'Navigation element not provided');
            return;
        }
        if (!Array.isArray(menu)) {
            log(context, 'Invalid menu configuration; expected an array');
            return;
        }
        element.innerHTML = '';
        log(context, 'Cleared existing menu content');
        const buttons = [];
        menu.forEach(item => {
            const button = document.createElement('button');
            button.dataset.section = item.section;
            button.innerHTML = `
                ${item.icons ? item.icons.map(icon => `<i class="${icon}"></i>`).join('') : ''}
                ${item.label}
            `;
            button.addEventListener('click', () => {
                log(context, `Navigating to section: ${item.section}`);
                const handler = sectionHandlers[item.section];
                if (handler) {
                    handler(true, item.role);
                    toggleViewState(context, { [item.section]: true });
                } else if (item.action) {
                    item.action();
                } else {
                    log(context, `No handler or action found for section: ${item.section}`);
                }
            });
            buttons.push(button);
        });
        buttons.forEach(button => element.appendChild(button));
        log(context, `Appended ${buttons.length} buttons to menu element`);
        const resolvedDefaultSection = defaultSection;
        if (resolvedDefaultSection && sectionHandlers[resolvedDefaultSection]) {
            log(context, `Activating default section: ${resolvedDefaultSection}`);
            await sectionHandlers[resolvedDefaultSection](true);
            toggleViewState(context, { [resolvedDefaultSection]: true });
            const defaultButton = element.querySelector(`[data-section="${resolvedDefaultSection}"]`);
            if (defaultButton) {
                defaultButton.classList.add('active');
                log(context, `Set active class on default button: ${resolvedDefaultSection}`);
            }
        } else {
            log(context, `No handler found for default section: ${resolvedDefaultSection}`);
        }
    }, ERROR_MESSAGES.NAVIGATION_INIT_FAILED);
}

/**
 * Initializes a role-based page with authentication, navigation, and custom setup.
 * @param {string} context - The context or module name.
 * @param {string} role - The role associated with the page (e.g., 'admin', 'merchant').
 * @param {string} pageType - The type of page to initialize (e.g., 'products', 'integrations').
 * @param {Function} callback - The callback to execute for role-specific setup.
 * @returns {Promise<void>}
 */
export async function initializeRolePage(context, role, pageType, callback) {
    log(context, `Initializing ${role} page with type: ${pageType}`);
    if (role === 'login') {
        await withErrorHandling(`${context}:initializeRolePage`, async () => {
            const userIdInput = document.getElementById('userId');
            if (userIdInput) userIdInput.value = localStorage.getItem('userId') || '';
            await callback();
        }, ERROR_MESSAGES.MODULE_INIT_FAILED);
    } else {
        await withAuthenticatedUser(context, async () => {
            await withErrorHandling(`${context}:initializeRolePage`, async () => {
                const userIdInput = document.getElementById('userId');
                if (userIdInput) userIdInput.value = localStorage.getItem('userId') || '';
                await callback();
            }, ERROR_MESSAGES.MODULE_INIT_FAILED);
        }, 'initializeRolePage');
    }
}

/**
 * Hides the loading overlay and shows the layout wrapper with fallback.
 */
export function hideOverlay() {
    log(context, 'Attempting to hide loadingOverlay');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const layoutWrapper = document.querySelector('.layout-wrapper');
    if (!loadingOverlay) {
        log(context, 'Error: loadingOverlay element not found');
        return;
    }
    if (!layoutWrapper) {
        log(context, 'Error: layoutWrapper element not found');
        return;
    }
    log(context, 'Hiding loadingOverlay and showing layoutWrapper');
    loadingOverlay.classList.add('hidden');
    loadingOverlay.style.display = 'none';
    layoutWrapper.style.display = '';
    setTimeout(() => {
        if (loadingOverlay.style.display !== 'none') {
            log(context, 'Fallback: Forcing loadingOverlay to hide');
            loadingOverlay.style.display = 'none';
        }
    }, 2000);
}

/**
 * Initializes the initialization module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Initialization instance with public methods.
 */
export function initializeInitializationModule(registry) {
    return createModuleInitializer('initialization.js', {
        withScriptLogging,
        createModuleInitializer,
        parsePageType,
        getDefaultSectionFromQuery,
        initializeRoleNavigation,
        initializeRolePage,
        hideOverlay,
        shouldInitializeForPageType
    });
}

// Global event listener for the button in roles.inc
document.addEventListener('click', (event) => {
    const infoButton = event.target.closest('button[data-section="info"]');
    if (infoButton) {
        console.log('Info button clicked');
        showSection('info');
    }
});

// Initialize module with lifecycle logging
withScriptLogging(context, () => {
    log(context, 'Module initialized');
});