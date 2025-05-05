// /static/js/login-page.js
import { log, warn, error as logError } from './core/logger.js';
import { withErrorHandling } from './utils/error.js';
import { toggleViewState, withElement } from './utils/dom-manipulation.js';
import { getMenu } from './config/menus.js';
import { initializeRoleNavigation, defineSectionHandlers } from './modules/navigation.js';
import { hideOverlay, getDefaultSectionFromQuery, shouldInitializeForPageType } from './utils/initialization.js';
import { withScriptLogging } from './utils/logging-utils.js';
import { initializeLogin } from './login/login.js';
import { initializeSignup } from './login/signup.js';
import { initializeForgotPassword } from './login/forgot-password.js';
import { initializeSetPassword } from './login/set-password.js';
import { error as notifyError } from './core/notifications.js';
import { submitConfiguredForm } from './utils/form-submission.js';

const context = 'login-page.js';

export async function initializeLoginPage({ registry }) {
    log(context, 'Starting initializeLoginPage');
    try {
        const metaPageType = document.querySelector('meta[name="page-type"]')?.content || 'login';
        log(context, `Page type: ${metaPageType}`);
        if (metaPageType !== 'login') {
            log(context, 'Skipping initialization for non-login page');
            return;
        }
        const loginForms = document.querySelectorAll('#loginForm');
        if (loginForms.length > 1) {
            log(context, `Found ${loginForms.length} loginForms, removing duplicates`);
            Array.from(loginForms).slice(1).forEach(form => form.remove());
        }
        const sectionHandlers = {
            'info': async () => {
                log(context, 'Initializing info section (login form)');
                await initializeLogin(context, 'info');
            },
            'signupContainer': async () => {
                log(context, 'Initializing signup section');
                await initializeSignup(context);
            },
            'forgotPasswordContainer': async () => {
                log(context, 'Initializing forgot-password section');
                await initializeForgotPassword(context);
            },
            'completeSignup': async () => {
                log(context, 'Initializing completeSignup section');
                toggleViewState(context, { completeSignup: true });
                await initializeSetPassword(context, 'completeSignup');
                submitConfiguredForm(context, 'setPasswordForm', '/complete-signup', 'completeSignup', {
                    onSuccess: async (response) => {
                        log(context, 'Complete signup successful, response:', response);
                        window.location.href = '/';
                    },
                    onError: (err) => {
                        logError(context, 'Complete signup error:', err.message);
                        notifyError(context, err.message || 'Error completing signup');
                    }
                });
            },
            'failSignupContainer': async () => {
                log(context, 'Initializing failSignup section');
                toggleViewState(context, { failSignupContainer: true });
                notifyError(context, 'Signup failed. Please try again.');
            }
        };
        log(context, 'Defined section handlers:', Object.keys(sectionHandlers));
        const role = 'login';
        const initialSection = await getDefaultSectionFromQuery(context, role, 'info');
        log(context, `Initial section from query: ${initialSection}`);
        const menu = getMenu(role);
        log(context, `Menu for role ${role}: ${JSON.stringify(menu)}`);
        await withElement(context, 'menu', async (menuElement) => {
            log(context, 'Menu element found, rendering buttons');
            menuElement.innerHTML = '';
            menuElement.style.display = 'block';
            if (!menu || !Array.isArray(menu) || menu.length === 0) {
                warn(context, `Invalid or empty menu for role: ${role}, rendering fallback buttons`);
                menuElement.innerHTML = `
                    <button data-section="forgotPasswordContainer" style="display: inline-block; margin: 5px;">
                        <i class="fas fa-lock"></i> Forgot Password
                    </button>
                    <button data-section="signupContainer" style="display: inline-block; margin: 5px;">
                        <i class="fas fa-user-plus"></i> Sign Up
                    </button>
                `;
            } else {
                try {
                    await initializeRoleNavigation(menuElement, menu, { 
                        sectionHandlers, 
                        defaultSection: initialSection 
                    });
                    log(context, 'Menu rendering completed');
                } catch (error) {
                    logError(context, `Menu rendering failed: ${error.message}`);
                    menuElement.innerHTML = `
                        <button data-section="forgotPasswordContainer" style="display: inline-block; margin: 5px;">
                            <i class="fas fa-lock"></i> Forgot Password
                        </button>
                        <button data-section="signupContainer" style="display: inline-block; margin: 5px;">
                            <i class="fas fa-user-plus"></i> Sign Up
                        </button>
                    `;
                }
                const buttons = menuElement.querySelectorAll('button');
                if (buttons.length === 0) {
                    warn(context, 'No buttons rendered, forcing fallback');
                    menuElement.innerHTML = `
                        <button data-section="forgotPasswordContainer" style="display: inline-block; margin: 5px;">
                            <i class="fas fa-lock"></i> Forgotten Password
                        </button>
                        <button data-section="signupContainer" style="display: inline-block; margin: 5px;">
                            <i class="fas fa-user-plus"></i> Sign Up
                        </button>
                    `;
                } else {
                    log(context, `Rendered ${buttons.length} menu buttons`);
                }
            }
            if (initialSection && sectionHandlers[initialSection]) {
                log(context, `Triggering initial section handler for: ${initialSection}`);
                await sectionHandlers[initialSection]();
            } else {
                log(context, `No handler found for initial section: ${initialSection}, defaulting to info`);
                await sectionHandlers['info']();
            }
        }, 3, 50, false);
        hideOverlay();
    } catch (err) {
        logError(context, `initializeLoginPage failed: ${err.message}, ${err.stack}`);
    }
    log(context, 'initializeLoginPage completed');
}

export function initializeLoginPageModule(registry) {
    log(context, 'Initializing login page for module registry');
    return {
        initializeLoginPage: (options) => initializeLoginPage(options),
    };
}

if (shouldInitializeForPageType('login')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-login page');
}