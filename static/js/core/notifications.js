// /static/js/core/notifications.js
// Purpose: Manages UI notifications for success, error, and operation results.

import { log } from './logger.js';
import { withElement, toggleViewState } from '../utils/dom-manipulation.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Displays a success notification.
 * @param {string} context - The context or module name.
 * @param {string} message - The success message.
 */
export function success(context, message) {
  log(context, `Displaying success notification: ${message}`);
  withElement(context, 'notification', element => {
    element.textContent = message;
    element.classList.remove('error');
    element.classList.add('success');
    toggleViewState(context, { notification: true });
    setTimeout(() => toggleViewState(context, { notification: false }), 3000);
  }, 10, 100, false);
}

/**
 * Displays an error notification.
 * @param {string} context - The context or module name.
 * @param {string} message - The error message.
 */
export function error(context, message) {
  log(context, `Displaying error notification: ${message}`);
  withElement(context, 'notification', element => {
    element.textContent = message;
    element.classList.remove('success');
    element.classList.add('error');
    toggleViewState(context, { notification: true });
    setTimeout(() => toggleViewState(context, { notification: false }), 5000);
  }, 10, 100, false);
}

/**
 * Notifies the result of an operation, handling success or error states.
 * @param {string} context - The context or module name.
 * @param {Object} options - Notification options.
 * @param {boolean} options.success - Whether the operation was successful.
 * @param {string} options.message - The notification message.
 * @param {string} [options.defaultSuccess] - Default success message if none provided.
 * @param {string} [options.defaultError] - Default error message if none provided.
 */
export function notifyOperationResult(context, { success, message, defaultSuccess = SUCCESS_MESSAGES.DEFAULT, defaultError = ERROR_MESSAGES.DEFAULT }) {
  log(context, `Notifying operation result: ${success ? 'success' : 'error'}, message: ${message}`);
  const notificationMessage = success ? (message || defaultSuccess) : (message || defaultError);
  if (success) {
    success(context, notificationMessage);
  } else {
    error(context, notificationMessage);
  }
}

/**
 * Initializes the notifications module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Notifications instance with public methods.
 */
export function initializeNotificationsModule(registry) {
  const context = 'notifications.js';
  log(context, 'Initializing notifications module for module registry');
  return {
    success: (ctx, ...args) => success(ctx, ...args),
    error: (ctx, ...args) => error(ctx, ...args),
    notifyOperationResult: (ctx, ...args) => notifyOperationResult(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'notifications.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});