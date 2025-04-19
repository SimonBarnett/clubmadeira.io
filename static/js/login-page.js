// /static/js/login-page.js
import { log } from './core/logger.js';
import { initializeLogin } from './login/login.js';
import { initializeSignup } from './login/signup.js';
import { initializeForgotPassword } from './login/forgot-password.js';
import { parsePageType, initializeRoleNavigation } from './utils/initialization.js';
import { toggleViewState } from './utils/dom-manipulation.js';
import { withScriptLogging } from './utils/initialization.js';

/**
 * Initializes the login page.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializeLoginPage(context) {
  log(context, 'Initializing login page');
  const pageType = parsePageType(context, 'page', 'info'); // Default to 'info'
  
  // Hide my-account, contact-details, and change-password sections
  toggleViewState(context, {
    'my-account': false,
    'contact-details': false,
    'change-password': false,
    'info': false, // Hide base.inc info section
  });

  // Set up navigation for login page
  await initializeRoleNavigation(context, 'login', pageType);
  
  switch (pageType) {
    case 'info':
      log(context, 'Initializing info section with login form');
      await initializeLogin(context, 'infoContainer');
      break;
    case 'login':
      log(context, 'Initializing login section');
      await initializeLogin(context, 'loginContainer');
      break;
    case 'signup':
      log(context, 'Initializing signup section');
      await initializeSignup(context);
      break;
    case 'forgot-password':
      log(context, 'Initializing forgot-password section');
      await initializeForgotPassword(context);
      break;
    default:
      log(context, `Unknown page type: ${pageType}`);
      await initializeLogin(context, 'infoContainer'); // Fallback to info
  }
}

/**
 * Initializes the login-page module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} LoginPage instance with public methods.
 */
export function initializeLoginPageModule(registry) {
  const context = 'login-page.js';
  log(context, 'Initializing login-page module for module registry');
  return {
    initializeLoginPage: ctx => initializeLoginPage(ctx),
  };
}

// Initialize module with lifecycle logging
const context = 'login-page.js';
withScriptLogging(context, () => {
  initializeLoginPage(context);
});