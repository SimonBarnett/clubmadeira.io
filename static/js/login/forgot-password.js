// /static/js/login/forgot-password.js
import { log } from '../core/logger.js';
import { submitConfiguredForm } from '../utils/form-submission.js';
import { toggleViewState, withElement } from '../utils/dom-manipulation.js';
import { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';

/**
 * Initializes the forgot password form in the specified section.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializeForgotPassword(context) {
  log(context, 'Initializing forgot password form');
  await withElement(context, 'forgotPasswordContainer', async (section) => {
    // Ensure all other sections are hidden
    document.querySelectorAll('.section').forEach(s => {
      if (s.id !== 'forgotPasswordContainer') s.style.display = 'none';
    });
    // Show the target section
    section.style.display = 'block';
    toggleViewState(context, { forgotPasswordContainer: true });

    // Set up forgot password form submission
    submitConfiguredForm(context, 'forgotPasswordForm', API_ENDPOINTS.RESET_PASSWORD, 'forgotPassword', {
      onSuccess: async (data) => {
        log(context, 'Forgot password request successful, showing OTP section');
        if (data.otp_token) {
          localStorage.setItem('resetToken', data.otp_token);  // Correctly use otp_token
          log(context, 'Stored resetToken:', data.otp_token);
        } else {
          log(context, 'No otp_token in response');
          alert('Failed to receive OTP token from server.');
          return;
        }
        await withElement(context, 'verifyOtpSection', async otpSection => {
          toggleViewState(context, { verifyOtpSection: true });
          // Populate the otpToken field with the stored token
          const otpTokenInput = document.getElementById('otpToken');
          if (otpTokenInput) {
            const token = localStorage.getItem('resetToken');
            if (token) {
              otpTokenInput.value = token;
              log(context, `Set otpToken to: ${token}`);
            } else {
              log(context, 'No reset token found in localStorage');
            }
          } else {
            log(context, 'otpToken input not found');
          }
        });
      },
      onError: (error) => {
        log(context, 'Forgot password error:', error.message);
        alert(ERROR_MESSAGES.FORM_SUBMISSION_FAILED || 'Failed to send OTP. Please try again.');
      },
    });

    // Set up verify OTP form submission
    submitConfiguredForm(context, 'verifyOtpForm', API_ENDPOINTS.VERIFY_RESET_CODE, 'verifyOtp', {
      onSuccess: (data) => {
        log(context, 'OTP verified, redirecting to login');
        localStorage.removeItem('resetToken');
        window.location.href = '/';
      },
      onError: (error) => {
        log(context, 'OTP verification error:', error.message);
        alert(ERROR_MESSAGES.FORM_SUBMISSION_FAILED || 'Failed to verify OTP. Please try again.');
      },
    });

    // Set up password toggle for verify OTP form
    const verifyOtpSection = document.getElementById('verifyOtpSection');
    if (verifyOtpSection) {
      const toggleButtons = verifyOtpSection.querySelectorAll('.toggle-password, .toggle-password-icon');
      toggleButtons.forEach(toggleButton => {
        toggleButton.addEventListener('click', () => {
          const passwordInput = toggleButton.closest('.password-wrapper').querySelector('input[type="password"], input[type="text"]');
          const icon = toggleButton.querySelector('i') || toggleButton;
          if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
          } else {
            passwordInput.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
          }
        });
      });
    }
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