// /static/js/login/set-password.js
import { log } from '../core/logger.js';
import { submitConfiguredForm } from '../utils/form-submission.js';
import { withElement } from '../utils/dom-manipulation.js';
import { withScriptLogging } from '../utils/logging-utils.js';

const context = 'set-password.js';

/**
 * Initializes the set password form in the specified section.
 * @param {string} context - The context or module name.
 * @param {string} sectionId - The ID of the section containing the form.
 * @returns {Promise<void>}
 */
export async function initializeSetPassword(context, sectionId) {
  log(context, `Initializing set password form in section: ${sectionId}`);
  await withElement(context, sectionId, async (section) => {
    // Hide other sections
    document.querySelectorAll('.section').forEach(s => {
      if (s.id !== sectionId) s.style.display = 'none';
    });
    // Show the target section
    section.style.display = 'block';

    // Set up form submission to the correct endpoint
    submitConfiguredForm(context, 'setPasswordForm', '/complete-signup', 'setPassword', {
      onSuccess: (data) => {
        log(context, 'Password set successfully');
        // Redirect or update UI as needed
        window.location.href = '/';
      },
      onError: (err) => {
        log(context, 'Error setting password:', err.message);
      },
    });
  });
}

/**
 * Initializes the set password module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Module instance with public methods.
 */
export function initializeSetPasswordModule(registry) {
  log(context, 'Initializing set password module');
  return {
    initializeSetPassword: (ctx, ...args) => initializeSetPassword(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});