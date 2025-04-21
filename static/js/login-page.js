// /static/js/login-page.js
import { log } from './core/logger.js';
import { withErrorHandling } from './utils/error.js';
import { toggleViewState, withElement } from './utils/dom-manipulation.js';
import { getMenu } from './config/menus.js';
import { initializeRoleNavigation, defineSectionHandlers } from './modules/navigation.js';
import { withScriptLogging, hideOverlay } from './utils/initialization.js';
import { initializeLogin } from './login/login.js';
import { initializeSignup } from './login/signup.js';
import { initializeForgotPassword } from './login/forgot-password.js';

const context = 'login-page.js';

/**
 * Parses the page type from a DOM element or query parameter.
 * @param {string} param - The ID of the element or query parameter containing the page type.
 * @returns {string|Promise<string>} The parsed page type or a Promise resolving to it.
 */
export function parsePageType(param) {
    return withErrorHandling(context, () => {
        log(context, `Parsing page type from param: ${param}`);
        const pageTypeElement = document.getElementById(param);
        if (pageTypeElement) {
            return pageTypeElement.value;
        }
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param) || 'info';
    }, 'parsePageType');
}

/**
 * Initializes the login page, setting up navigation.
 * @param {Object} options - Options object containing the module registry.
 * @param {Map} options.registry - The module registry instance.
 */
export async function initializeLoginPage({ registry }) {
    log(context, 'Initializing login page');

    // Resolve the page type
    const pageTypeElement = parsePageType('page');
    const pageType = typeof pageTypeElement === 'string' ? pageTypeElement : await pageTypeElement;
    log(context, `Page type resolved: ${pageType}`);

    // Set up navigation for the login role
    const role = 'login';
    const defaultSection = pageType || 'info'; // Default to 'info' as per base.inc
    log(context, `Initializing navigation for role: ${role}, default section: ${defaultSection}`);

    // Define section handlers for the login role
    const sectionHandlers = defineSectionHandlers(context, role, [
        {
            id: 'info',
            handler: async () => {
                log(context, 'Loading info section with login form');
                await initializeLogin(context, 'info');
            },
        },
        {
            id: 'signup',
            handler: async () => {
                log(context, 'Loading signup section');
                await initializeSignup(context);
            },
        },
        {
            id: 'forgot-password',
            handler: async () => {
                log(context, 'Loading forgot-password section');
                await initializeForgotPassword(context);
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
            document.querySelector('.content').prepend(menuElement);
        }

        if (!menu || menu.length === 0) {
            log(context, `No menu found for role: ${role}, rendering default buttons`);
            // Fallback: manually render the buttons if the menu fails to load
            menuElement.innerHTML = `
                <button data-section="forgot-password">
                    <i class="fas fa-lock"></i> Forgot Password
                </button>
                <button data-section="signup">
                    <i class="fas fa-user-plus"></i> Sign Up
                </button>
            `;
            // Manually attach event listeners
            menuElement.querySelectorAll('button').forEach(button => {
                const sectionId = button.getAttribute('data-section');
                button.addEventListener('click', () => {
                    log(context, `Navigating to section: ${sectionId}`);
                    const handler = sectionHandlers[sectionId];
                    if (handler) {
                        handler();
                    } else {
                        log(context, `No handler found for section: ${sectionId}`);
                    }
                });
            });
        } else {
            log(context, `Setting up navigation with menu:`, menu);
            const navigationOptions = { sectionHandlers, defaultSection };
            withErrorHandling(context, () => initializeRoleNavigation(menuElement, menu, navigationOptions), 'initializeRoleNavigation');
        }
    }, 10, 100, false);

    // Initialize the info section with the login form
    log(context, `Initializing info section with login form`);
    await withElement(context, 'info', async (infoSection) => {
        log(context, `Info section found, ensuring visibility`);
        // Ensure the section is visible by setting the display directly
        infoSection.style.display = 'block';
        // Hide other sections
        toggleViewState(context, {
            info: true,
            forgotPasswordContainer: false,
            verifyOtpSection: false,
            signupContainer: false,
        });
        await initializeLogin(context, 'info');
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
    log(context, 'Module initialized');
    await initializeLoginPage({ registry: new Map() });
    hideOverlay();
});