// /static/js/core/cookies.js
// Purpose: Manages cookie operations for the application.

import { log } from './logger.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Sets a cookie with the specified name, value, and expiration days.
 * @param {string} context - The context or module name.
 * @param {string} name - The cookie name.
 * @param {string} value - The cookie value.
 * @param {number} days - The number of days until the cookie expires.
 */
export function setCookie(context, name, value, days) {
  log(context, `Setting cookie: ${name}`);
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict`;
}

/**
 * Initializes the cookies module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Cookies instance with public methods.
 */
export function initializeCookiesModule(registry) {
  const context = 'cookies.js';
  log(context, 'Initializing cookies module for module registry');
  return {
    setCookie: (ctx, ...args) => setCookie(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'cookies.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});