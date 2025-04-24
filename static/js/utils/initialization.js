// /static/js/utils/initialization.js
// Purpose: Provides utilities for module initialization, page setup, and navigation.

import { log } from '../core/logger.js';
import { withAuthenticatedUser } from '../core/auth.js'; // Updated import to core/auth.js
import { withErrorHandling } from './error.js';
import { ERROR_MESSAGES } from '../config/messages.js'; // Updated import to messages.js
import { defineSectionHandlers } from '../modules/navigation.js';
import { withScriptLogging } from './logging-utils.js'; // Changed from re-export to direct import

const context = 'initialization.js';

/**
 * Shows the specified section and hides others.
 * @param {string} sectionId - The ID of the section to show.
 */
async function showSection(sectionId) {
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
 * Parses the page type from a query parameter or defaults to a provided value.
 * @param {string} context - The context or module name.
 * @param {string} param - The query parameter name.
 * @param {string} defaultType - The default page type.
 * @returns {string} The parsed page type.
 */
export function parsePageType(context, param, defaultType) {
    log(context, `Parsing page type from param: ${param}`);
    return withErrorHandling(`${context}:parsePageType`, () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param) || defaultType;
    }, ERROR_MESSAGES.DEFAULT, () => defaultType);
}

/**
 * Initializes role-based navigation for a page.
 * @param {string} context - The context or module name.
 * @param {string} role - The role associated with the page (e.g., 'admin', 'login').
 * @param {string} defaultSection - The default section to show.
 * @returns {Promise<void>}
 */
export async function initializeRoleNavigation(context, role, defaultSection) {
    log(context, `Initializing navigation for role: ${role}, default section: ${defaultSection}`);
    await withErrorHandling(`${context}:initializeRoleNavigation`, async () => {
        let sectionHandlers = {};
        if (role === 'login') {
            sectionHandlers = defineSectionHandlers(context, 'login', [
                {
                    id: 'info',
                    handler: () => {
                        log(context, 'Showing info section');
                        showSection('info');
                    },
                },
                {
                    id: 'signup',
                    handler: () => {
                        log(context, 'Showing signup section');
                        showSection('signupContainer');
                    },
                },
                {
                    id: 'forgot-password',
                    handler: () => {
                        log(context, 'Showing forgot-password section');
                        showSection('forgotPasswordContainer');
                    },
                },
            ]);
        }
        const navElement = document.querySelector(`nav[data-role="${role}"]`);
        if (!navElement) {
            log(context, `Navigation element not found for role: ${role}`);
            return;
        }
        const sectionLink = navElement.querySelector(`[data-section="${defaultSection}"]`) || 
                           document.querySelector(`.section-link[data-section="${defaultSection}"]`);
        if (sectionLink) {
            sectionLink.click();
        } else {
            log(context, `Section link not found for default section: ${defaultSection}`);
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
        // Login page does not require authentication
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
 * Initializes the initialization module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Initialization instance with public methods.
 */
export function initializeInitializationModule(registry) {
    return createModuleInitializer('initialization.js', {
        withScriptLogging,
        createModuleInitializer,
        parsePageType,
        initializeRoleNavigation,
        initializeRolePage,
    });
}

/**
 * Hides the loading overlay and shows the layout wrapper.
 */
export function hideOverlay() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const layoutWrapper = document.querySelector('.layout-wrapper');
    if (loadingOverlay && layoutWrapper) {
        loadingOverlay.style.display = 'none';
        layoutWrapper.style.display = '';
    }
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