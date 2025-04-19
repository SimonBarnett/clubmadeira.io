// /static/js/login/login.js
import { log } from '../core/logger.js';
import { submitConfiguredForm } from '../utils/form-submission.js';
import { setCookie } from '../core/cookies.js';
import { tokenManagerSetToken } from '../core/auth.js';
import { withElement, toggleViewState } from '../utils/dom-manipulation.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Initializes the login form in the specified section.
 * @param {string} context - The context or module name.
 * @param {string} targetSection - The ID of the section to initialize (e.g., 'infoContainer', 'loginContainer').
 * @returns {Promise<void>}
 */
export async function initializeLogin(context, targetSection) {
  log(context, `Initializing login form in section: ${targetSection}`);
  await withElement(context, targetSection, async (section) => {
    // Ensure all other sections are hidden
    document.querySelectorAll('.container').forEach(s => {
      if (s.id !== targetSection) s.classList.add('hidden');
    });
    // Show the target section
    section.classList.remove('hidden');
    toggleViewState(context, { [targetSection]: true });

    // Set up form submission
    submitConfiguredForm(context, 'loginForm', '/', 'login', {
      onSuccess: data => {
        log(context, 'Login successful, setting token and cookie');
        tokenManagerSetToken(data.token);
        if (data.user_id) localStorage.setItem('userId', data.user_id);
        setCookie(context, 'authToken', data.token, 7);
        window.location.reload();
      },
    });

    // Set up password toggle
    const togglePassword = section.querySelector('.toggle-password');
    if (togglePassword) {
      togglePassword.addEventListener('click', () => {
        const passwordInput = section.querySelector('#loginPassword');
        const icon = togglePassword.querySelector('i');
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
          passwordInput.type = 'password';
          icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
      });
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