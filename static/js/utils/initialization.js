// /static/js/utils/initialization.js
import { log } from '../core/logger.js';
import { withAuthenticatedUser } from './auth.js';
import { withErrorHandling } from './error.js';
import { ERROR_MESSAGES } from '../config/constants.js';
import { defineSectionHandlers } from '../modules/navigation.js';
import { withScriptLogging } from './initialization.js';
import { createModuleInitializer } from './initialization.js';

/**
 * Wraps a module initialization function with lifecycle logging.
 * @param {string} context - The context or module name.
 * @param {Function} initFunction - The initialization function to wrap.
 * @returns {void}
 */
export function withScriptLogging(context, initFunction) {
  log(context, 'Starting module initialization');
  withErrorHandling(`${context}:withScriptLogging`, () => {
    initFunction();
    log(context, 'Module initialization completed');
  }, ERROR_MESSAGES.MODULE_INIT_FAILED);
}

/**
 * Creates a module initializer for the registry with standardized method wrapping.
 * @param {string} context - The context or module name.
 * @param {Object} methods - Object mapping method names to functions.
 * @returns {Object} Module instance with wrapped methods.
 */
export function createModuleInitializer(context, methods) {
  log(context, `Initializing ${context} module for module registry`);
  return Object.keys(methods).reduce((acc, key) => {
    acc[key] = (ctx, ...args) => methods[key](ctx, ...args);
    return acc;
  }, {});
}

/**
 * Parses the page type from a query parameter or defaults to a provided value.
 * @param {string} context - The context or module name.
 * @param {string} param - The query parameter name.
 * @param {string} defaultType - The default page type.
 * @returns {string} The parsed page type.
 */
export function parsePageType(context, param, defaultType) {
  log(context, `Parsing page type from param: ${param}`);
  return withErrorHandling(`${context}:parsePageType`, () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param) || defaultType;
  }, ERROR_MESSAGES.DEFAULT, () => defaultType);
}

/**
 * Initializes role-based navigation for a page.
 * @param {string} context - The context or module name.
 * @param {string} role - The role associated with the page (e.g., 'admin', 'login').
 * @param {string} defaultSection - The default section to show.
 * @returns {Promise<void>}
 */
export async function initializeRoleNavigation(context, role, defaultSection) {
  log(context, `Initializing navigation for role: ${role}, default section: ${defaultSection}`);
  await withErrorHandling(`${context}:initializeRoleNavigation`, async () => {
    if (role === 'login') {
      // Define handlers for login page
      defineSectionHandlers(context, 'login', [
        {
          id: 'info',
          handler: async () => {
            log(context, 'Loading info section with login form');
            await import('../login/login.js').then(m => m.initializeLogin(context, 'info'));
          },
        },
        {
          id: 'signup',
          handler: async () => {
            log(context, 'Loading signup section');
            await import('../login/signup.js').then(m => m.initializeSignup(context));
          },
        },
        {
          id: 'forgot-password',
          handler: async () => {
            log(context, 'Loading forgot-password section');
            await import('../login/forgot-password.js').then(m => m.initializeForgotPassword(context));
          },
        },
      ]);
    }
    const navElement = document.querySelector(`nav[data-role="${role}"]`);
    if (!navElement) {
      log(context, `Navigation element not found for role: ${role}`);
      return;
    }
    const sectionLink = navElement.querySelector(`[data-section="${defaultSection}"]`) || 
                       document.querySelector(`.section-link[data-section="${defaultSection}"]`);
    if (sectionLink) {
      sectionLink.click();
    } else {
      log(context, `Section link not found for default section: ${defaultSection}`);
    }
  }, ERROR_MESSAGES.NAVIGATION_INIT_FAILED);
}

/**
 * Initializes a role-based page with authentication, navigation, and custom setup.
 * @param {string} context - The context or module name.
 * @param {string} role - The role associated with the page (e.g., 'admin', 'merchant').
 * @param {string} pageType - The type of page to initialize (e.g., 'products', 'integrations').
 * @param {Function} callback - The callback to execute for role-specific setup.
 * @returns {Promise<void>}
 */
export async function initializeRolePage(context, role, pageType, callback) {
  log(context, `Initializing ${role} page with type: ${pageType}`);
  if (role === 'login') {
    // Login page does not require authentication
    await withErrorHandling(`${context}:initializeRolePage`, async () => {
      const userIdInput = document.getElementById('userId');
      if (userIdInput) userIdInput.value = localStorage.getItem('userId') || '';
      await callback();
    }, ERROR_MESSAGES.MODULE_INIT_FAILED);
  } else {
    await withAuthenticatedUser(async userId => {
      await withErrorHandling(`${context}:initializeRolePage`, async () => {
        const userIdInput = document.getElementById('userId');
        if (userIdInput) userIdInput.value = userId;
        await callback();
      }, ERROR_MESSAGES.MODULE_INIT_FAILED);
    });
  }
}

/**
 * Initializes the initialization module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Initialization instance with public methods.
 */
export function initializeInitializationModule(registry) {
  return createModuleInitializer('initialization.js', {
    withScriptLogging,
    createModuleInitializer,
    parsePageType,
    initializeRoleNavigation,
    initializeRolePage,
  });
}

// Initialize module with lifecycle logging
const context = 'initialization.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});