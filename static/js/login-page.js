// /static/js/login-page.js
import { log } from './core/logger.js';
import { withErrorHandling } from './utils/error.js';
import { toggleViewState, withElement } from './utils/dom-manipulation.js';
import { getMenu } from './config/menus.js';
import { initializeRoleNavigation, defineSectionHandlers } from './modules/navigation.js';
import { withScriptLogging } from './utils/logging-utils.js';
import { initializeLogin } from './login/login.js';
import { initializeSignup } from './login/signup.js';
import { initializeForgotPassword } from './login/forgot-password.js';
import { initializeSetPassword } from './login/set-password.js';

const context = 'login-page.js';

/**
 * Parses the page type from a meta tag, DOM element, or query parameter.
 * @param {string} param - The ID of the element or query parameter containing the page type.
 * @returns {string|Promise<string>} The parsed page type or a Promise resolving to it.
 */
export function parsePageType(param) {
    return withErrorHandling(context, () => {
        log(context, `Parsing page type from param: ${param}`);
        // Prioritize meta tag
        const metaPageType = document.querySelector('meta[name="page-type"]')?.content;
        if (metaPageType && ['admin', 'community', 'merchant', 'partner', 'login'].includes(metaPageType)) {
            log(context, `Page type resolved from meta tag: ${metaPageType}`);
            return metaPageType;
        }
        // Fallback to DOM element
        const pageTypeElement = document.getElementById(param);
        if (pageTypeElement) {
            const pageType = pageTypeElement.value || 'info';
            log(context, `Page type resolved from DOM element: ${pageType}`);
            return pageType;
        }
        // Fallback to query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const pageType = urlParams.get(param) || 'info';
        log(context, `Page type resolved from query parameter: ${pageType}`);
        return pageType;
    }, 'parsePageType');
}

/**
 * Initializes the login page, setting up navigation and form handling.
 * @param {Object} options - Options object containing the module registry.
 * @param {Map} options.registry - The module registry instance.
 */
export async function initializeLoginPage({ registry }) {
    log(context, 'Initializing login page');

    // Resolve the page type
    const pageTypeElement = parsePageType('page');
    const pageType = typeof pageTypeElement === 'string' ? pageTypeElement : await pageTypeElement;
    log(context, `Page type resolved: ${pageType}`);

    // Exit early if not a login page
    if (pageType !== 'login') {
        log(context, `Skipping login page initialization for page type: ${pageType}`);
        return;
    }

    // Set up navigation for the login role
    const role = 'login';
    const defaultSection = pageType === 'login' ? 'info' : pageType;
    log(context, `Initializing navigation for role: ${role}, default section: ${defaultSection}`);

    // Define section handlers for the login role
    const sectionHandlers = defineSectionHandlers(context, role, [
        {
            id: 'info',
            handler: async () => {
                log(context, 'Loading info section with form');
                await withElement(context, 'info', async (infoSection) => {
                    log(context, `Info section found, ensuring visibility`);
                    infoSection.style.display = 'block';
                    toggleViewState(context, {
                        info: true,
                        forgotPasswordContainer: false,
                        verifyOtpSection: false,
                        signupContainer: false,
                    });

                    // Dynamically detect which form is present
                    const loginForm = document.getElementById('loginForm');
                    const setPasswordForm = document.getElementById('setPasswordForm');

                    if (loginForm) {
                        log(context, 'Found loginForm, initializing login');
                        await initializeLogin(context, 'info');
                    } else if (setPasswordForm) {
                        log(context, 'Found setPasswordForm, initializing set password');
                        await initializeSetPassword(context, 'info');
                    } else {
                        log(context, 'No form found in info section');
                    }
                }, 10, 100, false);
            },
        },
        {
            id: 'signup',
            handler: async () => {
                log(context, 'Loading signup section');
                await withElement(context, 'signupContainer', async (signupSection) => {
                    signupSection.style.display = 'block';
                    toggleViewState(context, {
                        info: false,
                        forgotPasswordContainer: false,
                        verifyOtpSection: false,
                        signupContainer: true,
                    });
                    await initializeSignup(context);
                }, 10, 100, false);
            },
        },
        {
            id: 'forgot-password',
            handler: async () => {
                log(context, 'Loading forgot-password section');
                await withElement(context, 'forgotPasswordContainer', async (forgotPasswordSection) => {
                    forgotPasswordSection.style.display = 'block';
                    toggleViewState(context, {
                        info: false,
                        forgotPasswordContainer: true,
                        verifyOtpSection: false,
                        signupContainer: false,
                    });
                    await initializeForgotPassword(context);
                }, 10, 100, false);
            },
        },
    ]);
    log(context, 'Section handlers defined:', Object.keys(sectionHandlers));

    // Retrieve the menu configuration
    const menu = getMenu(role);
    log(context, `Menu retrieved for role ${role}:`, menu);

    // Ensure the menu container exists and render the navigation buttons
    await withElement(context, 'menu', async (menuElement) => {
        if (!menuElement) {
            log(context, 'Menu element not found, creating it');
            menuElement = document.createElement('div');
            menuElement.id = 'menu';
            menuElement.className = 'menu';
            const contentElement = document.querySelector('.content');
            if (contentElement) {
                contentElement.prepend(menuElement);
            } else {
                log(context, 'Error: .content element not found', 'error');
                return;
            }
        }

        if (!menu || menu.length === 0) {
            log(context, `No menu found for role: ${role}, rendering default buttons`);
            menuElement.innerHTML = `
                <button data-section="forgot-password">
                    <i class="fas fa-lock"></i> Forgot Password
                </button>
                <button data-section="signup">
                    <i class="fas fa-user-plus"></i> Sign Up
                </button>
            `;
            menuElement.querySelectorAll('button').forEach(button => {
                const sectionId = button.getAttribute('data-section');
                button.addEventListener('click', () => {
                    log(context, `Navigating to section: ${sectionId}`);
                    const handler = sectionHandlers[sectionId];
                    if (handler) {
                        handler();
                    } else {
                        log(context, `No handler found for section: ${sectionId}`, 'warn');
                    }
                });
            });
        } else {
            log(context, `Setting up navigation with menu:`, menu);
            const navigationOptions = { sectionHandlers, defaultSection };
            await withErrorHandling(context, () => initializeRoleNavigation(menuElement, menu, navigationOptions), 'initializeRoleNavigation');
        }

        // Show layout and hide overlay
        const layoutWrapper = document.querySelector('.layout-wrapper');
        if (layoutWrapper) {
            layoutWrapper.style.display = 'block';
            log(context, 'Layout wrapper displayed');
        } else {
            log(context, 'Warning: Layout wrapper not found', 'warn');
        }
        await hideOverlay();
        log(context, 'Loading overlay hidden');
    }, 10, 100, false);
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
    log(context, 'Starting module initialization');
    await initializeLoginPage({ registry: new Map() });
    log(context, 'Module initialized');
});

/**
 * Hides the loading overlay.
 * Note: This function is assumed to exist elsewhere or should be implemented.
 */
async function hideOverlay() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}