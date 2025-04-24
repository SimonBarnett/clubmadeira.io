// /static/js/login/login.js
import { log } from '../core/logger.js';
import { submitConfiguredForm } from '../utils/form-submission.js';
import { setCookie } from '../core/cookies.js';
import { setAuthToken } from '../core/auth.js';
import { withElement, toggleViewState } from '../utils/dom-manipulation.js';
import { withScriptLogging } from '../utils/logging-utils.js';

/**
 * Initializes the login form in the welcome section.
 * @param {string} context - The context or module name.
 * @param {string} targetSection - The ID of the section to initialize (e.g., 'welcomeSection').
 * @returns {Promise<void>}
 */
export async function initializeLogin(context, targetSection) {
  log(context, `Initializing login form in section: ${targetSection}`);
  await withElement(context, targetSection, async (section) => {
    // Ensure all other sections are hidden
    document.querySelectorAll('.section').forEach(s => {
      if (s.id !== targetSection) s.style.display = 'none';
    });
    // Show the target section
    section.style.display = 'block';
    toggleViewState(context, { [targetSection]: true });

    // Set up form submission
    submitConfiguredForm(context, 'loginForm', '/', 'login', {
      onSuccess: data => {
        log(context, 'Login successful, setting token and cookie');
        setAuthToken(data.token);
        if (data.user_id) localStorage.setItem('userId', data.user_id);
        setCookie('authToken', data.token, 7);
        window.location.reload();
      },
    });

    // Set up password toggle
    const togglePassword = section.querySelector('.toggle-password, .toggle-password-icon');
    if (togglePassword) {
      log(context, 'Toggle-password element found, binding event listener');
      togglePassword.addEventListener('click', () => {
        log(context, 'Toggle-password clicked');
        const passwordInput = section.querySelector('#loginPassword');
        const icon = togglePassword.querySelector('i') || togglePassword;
        if (passwordInput) {
          if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
            log(context, 'Password visibility toggled to text');
          } else {
            passwordInput.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
            log(context, 'Password visibility toggled to password');
          }
        } else {
          log(context, 'Password input #loginPassword not found');
        }
      });
    } else {
      log(context, 'Toggle-password element not found in section');
    }

    // Set up existing Forgot Password button
    const forgotPasswordButton = document.getElementById('forgotPasswordButton');
    if (forgotPasswordButton) {
      log(context, 'Forgot Password button found, binding event listener');
      forgotPasswordButton.addEventListener('click', (e) => {
        e.preventDefault();
        toggleViewState(context, { forgotPasswordContainer: true });
      });
    } else {
      log(context, 'Forgot Password button not found');
    }
  });
}

/**
 * Initializes the login module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Login instance with public methods.
 */
export function initializeLoginModule(registry) {
  const context = 'login.js';
  log(context, 'Initializing login module for module registry');
  return {
    initializeLogin: (ctx, ...args) => initializeLogin(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'login.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});