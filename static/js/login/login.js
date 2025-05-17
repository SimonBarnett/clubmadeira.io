// /static/js/login/login.js
import { log } from '../core/logger.js';
import { submitConfiguredForm } from '../utils/form-submission.js';
import { setCookie } from '../core/cookies.js';
import { setAuthToken } from '../core/auth.js';
import { withElement, toggleViewState } from '../utils/dom-manipulation.js';
import { API_ENDPOINTS } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';

/**
 * Initializes the login form in the specified section.
 * @param {string} context - The context or module name.
 * @param {string} targetSection - The ID of the section to initialize (e.g., 'info').
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

    // Locate the login form
    const form = document.getElementById('loginForm');
    if (form) {
      // Add event listener for form submission
      form.addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevent default form submission behavior
        const formData = new FormData(this);
        const email = formData.get('email')?.trim();
        const password = formData.get('password');

        // Perform basic client-side validation
        if (email && password) {
          await submitConfiguredForm(context, 'loginForm', API_ENDPOINTS.LOGIN, 'login', {
            onSuccess: data => {
              log(context, 'Login successful, setting token and cookie');
              setAuthToken(data.token);
              if (data.user_id) localStorage.setItem('userId', data.user_id);
              setCookie('authToken', data.token, 7);
              window.location.reload();
            },
          });
        } else {
          notifyError(context, 'Please enter both email and password');
        }
      });
    } else {
      log(context, 'Login form not found');
    }

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