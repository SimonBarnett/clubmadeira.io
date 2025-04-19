// /static/js/login/signup.js
import { log } from '../core/logger.js';
import { submitConfiguredForm } from '../utils/form-submission.js';
import { setupFormFieldEvents } from '../utils/event-listeners.js';
import { toggleViewState } from '../utils/dom-manipulation.js';
import { renderForm } from '../utils/form-rendering.js';
import { getFormConfig } from '../config/form-configs.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Initializes the signup page.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializeSignup(context) {
  log(context, 'Initializing signup page');
  await withElement(context, 'signup', async (section) => {
    // Render signup form
    section.innerHTML = renderForm(getFormConfig(context, 'signup'));
    // Hide other sections, including info
    document.querySelectorAll('.section').forEach(s => {
      if (s.id !== 'signup') s.style.display = 'none';
    });
    toggleViewState(context, { signup: true });

    // Set up form submission
    submitConfiguredForm(context, 'signupForm', '/signup', 'signup', {
      onSuccess: async () => {
        log(context, 'Signup successful, showing OTP section');
        toggleViewState(context, { signupOtpSection: true });
      },
    });

    // Set up OTP verification
    submitConfiguredForm(context, 'signupOtpSection', '/verify-reset-code', 'verifySignupOtp', {
      onSuccess: () => {
        log(context, 'OTP verified, redirecting to login');
        window.location.href = '/';
      },
    });

    // Set up radio button events
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
  });
}

/**
 * Initializes the signup module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Signup instance with public methods.
 */
export function initializeSignupModule(registry) {
  const context = 'signup.js';
  log(context, 'Initializing signup module for module registry');
  return {
    initializeSignup: ctx => initializeSignup(ctx),
  };
}

// Initialize module with lifecycle logging
const context = 'signup.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});