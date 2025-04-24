// /static/js/login/signup.js
import { log } from '../core/logger.js';
import { submitConfiguredForm } from '../utils/form-submission.js';
import { setupFormFieldEvents } from '../utils/event-listeners.js';
import { toggleViewState, withElement } from '../utils/dom-manipulation.js';
import { withScriptLogging } from '../utils/logging-utils.js';

const context = 'signup';

/**
 * Initializes the signup page.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializeSignup(context) {
    log(context, 'Initializing signup page');

    await withElement(context, 'signupContainer', async (section) => {
        // Hide other sections and show signupContainer
        document.querySelectorAll('.section').forEach(s => {
            if (s.id !== 'signupContainer') s.style.display = 'none';
        });
        toggleViewState(context, { signupContainer: true });

        // Configure the signup form submission
        await withElement(context, 'signupForm', async (form) => {
            // Ensure "Community" is the default signup type
            document.querySelectorAll('.option').forEach(option => option.classList.remove('selected'));
            const communityOption = form.querySelector('input[value="community"]');
            if (communityOption) {
                communityOption.checked = true;
                communityOption.closest('.option').classList.add('selected');
            }

            log(context, 'Configuring signup form submission');
            submitConfiguredForm(context, 'signupForm', '/signup', 'signup', {
                onSuccess: async (response) => {
                    log(context, 'Signup successful, response:', response);
                    if (response.signup_type === 'partner') {
                        log(context, 'Showing verifyOtpSection for partner');
                        toggleViewState(context, {
                            signupContainer: false,
                            verifyOtpSection: true,
                            forgotPasswordContainer: false,
                            info: false
                        });
                        const otpTokenInput = document.getElementById('otpToken');
                        if (otpTokenInput) otpTokenInput.value = response.otp_token || '';
                        const verifyForm = document.getElementById('verifyOtpForm');
                        if (verifyForm) verifyForm.action = '/verify-signup-otp';
                    } else if (response.account_link) {
                        log(context, 'Redirecting to Stripe:', response.account_link);
                        window.location.href = response.account_link;
                    } else {
                        log(context, 'Error: account_link missing in response');
                        alert('Signup successful, but unable to redirect to Stripe. Please try again later.');
                    }
                },
                onError: (err) => {
                    log(context, 'Signup error:', err.message);
                }
            });

            // Set up radio button events for signup type selection
            setupFormFieldEvents(context, {
                selector: 'input[name="signup_type"]',
                eventType: 'change',
                handler: e => {
                    document.querySelectorAll('.option').forEach(option => {
                        option.classList.toggle('selected', option.contains(e.target));
                    });
                    log(context, 'Selected signup type:', e.target.value);
                },
            });
        }, 10, 100, false);
    }, 10, 100, false);
}

/**
 * Initializes the signup module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Signup instance with public methods.
 */
export function initializeSignupModule(registry) {
    log(context, 'Initializing signup module for module registry');
    return {
        initializeSignup: ctx => initializeSignup(ctx),
    };
}

// Initialize module with lifecycle logging
withScriptLogging(context, () => {
    log(context, 'Module initialized');
});