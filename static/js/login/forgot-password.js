// /static/js/login/forgot-password.js
import { log } from '../core/logger.js';
import { submitConfiguredForm } from '../utils/form-submission.js';
import { setupEventListeners } from '../utils/event-listeners.js';
import { withElement, toggleViewState } from '../utils/dom-manipulation.js';
import { renderForm } from '../utils/form-rendering.js';
import { getFormConfig } from '../config/form-configs.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Initializes the forgot password page.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializeForgotPassword(context) {
  log(context, 'Initializing forgot password page');
  await withElement(context, 'forgot-password', async (section) => {
    // Render forgot password form
    section.innerHTML = renderForm(getFormConfig(context, 'forgotPassword')) + `
      <div id="otpSection" style="display: none;">
        ${renderForm(getFormConfig(context, 'verifyOtp'))}
      </div>
    `;
    // Hide other sections, including info
    document.querySelectorAll('.section').forEach(s => {
      if (s.id !== 'forgot-password') s.style.display = 'none';
    });
    toggleViewState(context, { 'forgot-password': true });

    // Set up event listeners
    setupEventListeners(context, [
      {
        eventType: 'submit',
        selector: '#forgotPasswordForm',
        handler: async event => {
          event.preventDefault();
          await submitConfiguredForm(context, 'forgotPasswordForm', '/reset-password', 'forgotPassword', {
            onSuccess: async () => {
              await withElement(context, 'otpSection', async otpSection => {
                toggleViewState(context, { otpSection: true });
              });
            },
          });
        },
      },
      {
        eventType: 'submit',
        selector: '#verifyOtpForm',
        handler: async event => {
          event.preventDefault();
          await submitConfiguredForm(context, 'verifyOtpForm', '/verify-reset-code', 'verifyOtp', {
            onSuccess: () => {
              log(context, 'OTP verified, redirecting to login');
              window.location.href = '/';
            },
          });
        },
      },
    ]);
  });
}

/**
 * Initializes the forgot password module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Forgot password instance with public methods.
 */
export function initializeForgotPasswordModule(registry) {
  const context = 'forgot-password.js';
  log(context, 'Initializing forgot password module for module registry');
  return {
    initializeForgotPassword: ctx => initializeForgotPassword(ctx),
  };
}

// Initialize module with lifecycle logging
const context = 'forgot-password.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});