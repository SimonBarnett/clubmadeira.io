// notifications.js
import { log as loggerLog, error as loggerError, warn as loggerWarn } from './logger.js';

export function setup() {
    loggerLog('notifications.js - Setting up Toastr');
    if (typeof toastr === 'undefined') {
        loggerError('notifications.js - Toastr library not loaded');
        return;
    }

    const originalSuccess = toastr.success;
    const originalError = toastr.error;
    const originalInfo = toastr.info;
    const originalWarning = toastr.warning;

    toastr.success = (message, title, options) => {
        loggerLog(`Toastr Success: ${title ? title + ' - ' : ''}${message}`);
        return originalSuccess.call(toastr, message, title, options);
    };
    toastr.error = (message, title, options) => {
        loggerLog(`Toastr Error: ${title ? title + ' - ' : ''}${message}`);
        return originalError.call(toastr, message, title, options);
    };
    toastr.info = (message, title, options) => {
        loggerLog(`Toastr Info: ${title ? title + ' - ' : ''}${message}`);
        return originalInfo.call(toastr, message, title, options);
    };
    toastr.warning = (message, title, options) => {
        loggerLog(`Toastr Warning: ${title ? title + ' - ' : ''}${message}`);
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

    loggerLog('notifications.js - Toastr configured:', toastr.options);
}

export function success(message, title, options) {
    if (typeof toastr !== 'undefined') {
        toastr.success(message, title, options);
    } else {
        loggerWarn('notifications.js - Toastr not available, fallback to alert:', message);
        alert(`Success: ${title ? title + ' - ' : ''}${message}`);
    }
}

export function error(message, title, options) {
    if (typeof toastr !== 'undefined') {
        toastr.error(message, title, options);
    } else {
        loggerWarn('notifications.js - Toastr not available, fallback to alert:', message);
        alert(`Error: ${title ? title + ' - ' : ''}${message}`);
    }
}

export function info(message, title, options) {
    if (typeof toastr !== 'undefined') {
        toastr.info(message, title, options);
    } else {
        loggerWarn('notifications.js - Toastr not available, fallback to alert:', message);
        alert(`Info: ${title ? title + ' - ' : ''}${message}`);
    }
}

export function warning(message, title, options) {
    if (typeof toastr !== 'undefined') {
        toastr.warning(message, title, options);
    } else {
        loggerWarn('notifications.js - Toastr not available, fallback to alert:', message);
        alert(`Warning: ${title ? title + ' - ' : ''}${message}`);
    }
}

if (!window.notificationsInitialized) {
    window.notificationsInitialized = true;
    loggerLog('notifications.js - Loaded successfully');
    loggerLog('notifications.js - Notifications utility initialized');
}