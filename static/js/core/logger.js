// logger.js
const ENABLE_LOGGING = true;

export function log(...args) {
    if (ENABLE_LOGGING) console.log(...args);
}

export function error(...args) {
    if (ENABLE_LOGGING) console.error(...args);
}

export function warn(...args) {
    if (ENABLE_LOGGING) console.warn(...args);
}

export function info(...args) {
    if (ENABLE_LOGGING) console.info(...args);
}

if (!window.loggerInitialized) {
    window.loggerInitialized = true;
    log('logger.js - Logger initialized');
}