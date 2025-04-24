// /static/js/main.js
// Purpose: Centralizes module loading and registration for the application.

import { log } from './core/logger.js';
import { withErrorHandling } from './utils/error.js';
import { PAGE_MODULES } from './config/pages.js';
import { ERROR_MESSAGES } from './config/messages.js';
import { withScriptLogging } from './utils/logging-utils.js';
import { createModuleInitializer } from './utils/initialization.js';

/**
 * Module registry for managing loaded modules.
 * @type {Map<string, Object>}
 */
const moduleRegistry = new Map();

/**
 * Registers a module in the registry.
 * @param {string} name - The module name.
 * @param {Object} module - The module instance.
 */
function registerModule(name, module) {
    log('main.js', `Registering module: ${name}`);
    moduleRegistry.set(name, module);
}

/**
 * Initializes core modules that are required by all pages.
 * @returns {Promise<void>}
 */
export async function initializeCoreModules() {
    const context = 'main.js';
    log(context, 'Initializing core modules');
    await withErrorHandling(`${context}:initializeCoreModules`, async () => {
        // Initialize logger
        const loggerModule = await import('./core/logger.js');
        registerModule('logger', loggerModule.initializeLoggerModule(moduleRegistry));

        // Initialize cookies
        const cookiesModule = await import('./core/cookies.js');
        await cookiesModule.initializeCookies();
        registerModule('cookies', {
            setCookie: cookiesModule.setCookie,
            getCookie: cookiesModule.getCookie,
            removeCookie: cookiesModule.removeCookie,
        });

        // Initialize endpoints
        const endpointsModule = await import('./config/endpoints.js');
        await endpointsModule.initializeEndpoints();
        registerModule('endpoints', endpointsModule.initializeEndpointsModule(moduleRegistry));

        // Initialize auth
        const authModule = await import('./core/auth.js');
        await authModule.initializeAuth();
        registerModule('auth', {
            setAuthToken: authModule.setAuthToken,
            getAuthToken: authModule.getAuthToken,
            removeAuthToken: authModule.removeAuthToken,
            authenticatedFetch: authModule.authenticatedFetch,
            withAuthenticatedUser: authModule.withAuthenticatedUser,
        });
    }, ERROR_MESSAGES.MODULE_INIT_FAILED);
}

/**
 * Initializes all modules for the specified page type.
 * @param {string} pageType - The type of page to initialize (e.g., 'admin', 'login').
 * @returns {Promise<void>}
 */
async function initializeModules(pageType) {
    const context = 'main.js';
    log(context, `Initializing modules for page type: ${pageType}`);
    await withErrorHandling(`${context}:initializeModules`, async () => {
        const modules = PAGE_MODULES[pageType] || [];
        for (const modulePath of modules) {
            try {
                const module = await import(modulePath);
                const moduleName = modulePath.split('/').pop().replace('.js', '');
                const initializer = Object.values(module).find(val => typeof val === 'function' && val.name.startsWith('initialize'));
                if (initializer) {
                    const moduleInstance = await initializer(moduleRegistry);
                    registerModule(moduleName, moduleInstance);
                } else {
                    log(context, `No initializer found for module: ${moduleName}`);
                }
            } catch (err) {
                log(context, `Failed to load module: ${modulePath}`, err);
            }
        }
    }, ERROR_MESSAGES.MODULE_INIT_FAILED);
}

/**
 * Initializes the application by loading modules based on the page type.
 * @returns {Promise<void>}
 */
async function initializeApplication() {
    const context = 'main.js';
    log(context, 'Initializing application');
    await initializeCoreModules();
    const pageType = new URLSearchParams(window.location.search).get('page') || 'login';
    await initializeModules(pageType);
}

/**
 * Initializes the main module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Main instance with public methods.
 */
export function initializeMainModule(registry) {
    return createModuleInitializer('main.js', {
        initializeApplication,
        registerModule,
    });
}

// Initialize module with lifecycle logging
withScriptLogging('main.js', () => {
    initializeApplication();
});