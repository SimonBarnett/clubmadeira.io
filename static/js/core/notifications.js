// /static/js/core/notifications.js
// Purpose: Provides notification utilities using Toastr with fallback to alerts.

import { log, error as loggerError, warn as loggerWarn } from './logger.js';
import { withScriptLogging } from '../utils/initialization.js';
import { createModuleInitializer } from '../utils/initialization.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/messages.js'; // Updated import

const context = 'notifications.js';

/**
 * Sets up Toastr with custom logging and configuration.
 * @param {string} context - The context or module name.
 * @returns {boolean} Whether Toastr was successfully set up.
 */
export function setupToastr(context) {
    log(context, 'Setting up Toastr');
    if (typeof toastr === 'undefined') {
        loggerError(context, 'Toastr library not loaded');
        return false;
    }

    const originalSuccess = toastr.success;
    const originalError = toastr.error;
    const originalInfo = toastr.info;
    const originalWarning = toastr.warning;

    toastr.success = (message, title, options) => {
        log(context, `Toastr Success: ${title ? title + ' - ' : ''}${message}`);
        return originalSuccess.call(toastr, message, title, options);
    };
    toastr.error = (message, title, options) => {
        log(context, `Toastr Error: ${title ? title + ' - ' : ''}${message}`);
        return originalError.call(toastr, message, title, options);
    };
    toastr.info = (message, title, options) => {
        log(context, `Toastr Info: ${title ? title + ' - ' : ''}${message}`);
        return originalInfo.call(toastr, message, title, options);
    };
    toastr.warning = (message, title, options) => {
        log(context, `Toastr Warning: ${title ? title + ' - ' : ''}${message}`);
        return originalWarning.call(toastr, message, title, options);
    };

    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: 'toast-top-right',
        timeOut: 5000,
        showMethod: 'slideDown',
        hideMethod: 'slideUp'
    };

    log(context, 'Toastr configured:', toastr.options);
    return true;
}

/**
 * Displays a success notification.
 * @param {string} context - The context or module name.
 * @param {string} message - The message to display.
 * @param {string} [title] - The title of the notification.
 * @param {Object} [options] - Toastr options.
 */
export function success(context, message, title, options) {
    if (typeof toastr !== 'undefined' && setupToastr(context)) {
        toastr.success(message, title, options);
    } else {
        loggerWarn(context, 'Toastr not available, fallback to alert:', message);
        alert(`Success: ${title ? title + ' - ' : ''}${message}`);
    }
}

/**
 * Displays an error notification.
 * @param {string} context - The context or module name.
 * @param {string} message - The message to display.
 * @param {string} [title] - The title of the notification.
 * @param {Object} [options] - Toastr options.
 */
export function error(context, message, title, options) {
    if (typeof toastr !== 'undefined' && setupToastr(context)) {
        toastr.error(message, title, options);
    } else {
        loggerWarn(context, 'Toastr not available, fallback to alert:', message);
        alert(`Error: ${title ? title + ' - ' : ''}${message}`);
    }
}

/**
 * Displays an info notification.
 * @param {string} context - The context or module name.
 * @param {string} message - The message to display.
 * @param {string} [title] - The title of the notification.
 * @param {Object} [options] - Toastr options.
 */
export function info(context, message, title, options) {
    if (typeof toastr !== 'undefined' && setupToastr(context)) {
        toastr.info(message, title, options);
    } else {
        loggerWarn(context, 'Toastr not available, fallback to alert:', message);
        alert(`Info: ${title ? title + ' - ' : ''}${message}`);
    }
}

/**
 * Displays a warning notification.
 * @param {string} context - The context or module name.
 * @param {string} message - The message to display.
 * @param {string} [title] - The title of the notification.
 * @param {Object} [options] - Toastr options.
 */
export function warning(context, message, title, options) {
    if (typeof toastr !== 'undefined' && setupToastr(context)) {
        toastr.warning(message, title, options);
    } else {
        loggerWarn(context, 'Toastr not available, fallback to alert:', message);
        alert(`Warning: ${title ? title + ' - ' : ''}${message}`);
    }
}

/**
 * Notifies the result of an operation with success or error.
 * @param {string} context - The context or module name.
 * @param {Object} params - Operation result parameters.
 * @param {boolean} params.success - Whether the operation was successful.
 * @param {string} [params.message] - The message to display.
 * @param {string} [params.defaultSuccess] - Default success message.
 * @param {string} [params.defaultError] - Default error message.
 */
export function notifyOperationResult(context, { success: isSuccess, message, defaultSuccess = SUCCESS_MESSAGES.DEFAULT, defaultError = ERROR_MESSAGES.DEFAULT }) {
    log(context, `Notifying operation result: ${isSuccess ? 'success' : 'error'}, message: ${message}`);
    const notificationMessage = isSuccess ? (message || defaultSuccess) : (message || defaultError);
    if (isSuccess) {
        success(context, notificationMessage);
    } else {
        error(context, notificationMessage);
    }
}

/**
 * Initializes the notifications module for use with the module registry.
 * @param {Map} registry - The module registry instance.
 * @returns {Object} Module instance with public methods.
 */
export function initializeNotificationsModule(registry) {
    log(context, 'Initializing notifications module for module registry');
    setupToastr(context);
    return {
        success: (ctx, ...args) => success(ctx, ...args),
        error: (ctx, ...args) => error(ctx, ...args),
        info: (ctx, ...args) => info(ctx, ...args),
        warning: (ctx, ...args) => warning(ctx, ...args),
        notifyOperationResult: (ctx, ...args) => notifyOperationResult(ctx, ...args),
    };
}

// Initialize module with lifecycle logging
withScriptLogging(context, () => {
    log(context, 'Module initialized');
    setupToastr(context);
});