// /static/js/main.js
// Purpose: Entry point for the application, initializing modules based on page type.

import { log, error as logError } from './core/logger.js';
import { withErrorHandling } from './utils/error.js';
import { parsePageType, hideOverlay } from './utils/initialization.js';
import { initializeNotificationsModule } from './core/notifications.js';
import { initializeLoggerModule } from './core/logger.js';
import { initializeCookies } from './core/cookies.js';
import { initializeEndpointsModule } from './config/endpoints.js';
import { initializePagesModule } from './config/pages.js';
import * as auth from './core/auth.js'; // Import all exports from auth.js
import { initializeMenusModule } from './config/menus.js';
import { initializeNavigationModule } from './modules/navigation.js';
import { initializeIconsModule } from './utils/icons.js';
import { initializeDomManipulationModule } from './utils/dom-manipulation.js';
import { initializeInitializationModule } from './utils/initialization.js';
import { initializeLoginPageModule } from './login-page.js';
import { initializeAdminPageModule } from './admin-page.js';
import { initializeMerchantPageModule } from './merchant-page.js';
import { initializeCommunityPageModule } from './community-page.js';
import { initializePartnerPageModule } from './partner-page.js';
import { error as notifyError } from './core/notifications.js';
import { withScriptLogging } from './utils/logging-utils.js';
import { initializeMarkdownModule } from './core/markdown.js'; // Added import for markdown module

const context = 'main.js';

// Module registry to store initialized modules
const registry = new Map();

// Define page-specific module initialization configurations
const PAGE_MODULES = {
    login: [
        { name: 'login-page', initializer: initializeLoginPageModule },
    ],
    admin: [
        { name: 'admin-page', initializer: initializeAdminPageModule },
    ],
    merchant: [
        { name: 'merchant-page', initializer: initializeMerchantPageModule },
    ],
    community: [
        { name: 'community-page', initializer: initializeCommunityPageModule },
    ],
    partner: [
        { name: 'partner-page', initializer: initializePartnerPageModule },
    ],
};

/**
 * Initializes core modules required for all pages.
 */
async function initializeCoreModules() {
    log(context, 'Initializing core modules');
    await withErrorHandling(`${context}:initializeCoreModules`, async () => {
        registry.set('logger', initializeLoggerModule(registry));
        registry.set('cookies', {
            setCookie: (name, value, days) => import('./core/cookies.js').then(m => m.setCookie(name, value, days)),
            getCookie: name => import('./core/cookies.js').then(m => m.getCookie(name)),
            removeCookie: name => import('./core/cookies.js').then(m => m.removeCookie(name)),
        });
        initializeCookies();
        registry.set('endpoints', initializeEndpointsModule(registry));
        registry.set('pages', initializePagesModule(registry));
        registry.set('auth', {
            setAuthToken: auth.setAuthToken,
            getAuthToken: auth.getAuthToken,
            removeAuthToken: auth.removeAuthToken,
            authenticatedFetch: auth.authenticatedFetch,
            withAuthenticatedUser: auth.withAuthenticatedUser,
        });
        registry.set('notifications', initializeNotificationsModule(registry));
        registry.set('menus', initializeMenusModule(registry));
        registry.set('navigation', initializeNavigationModule(registry));
        registry.set('icons', initializeIconsModule(registry));
        registry.set('dom-manipulation', initializeDomManipulationModule(registry));
        registry.set('initialization', initializeInitializationModule(registry));
        registry.set('markdown', initializeMarkdownModule(registry)); // Added markdown module to registry
    }, 'Failed to initialize core modules');
}

/**
 * Initializes the application by setting up core modules and page-specific modules.
 */
async function initializeApp() {
    log(context, 'Initializing application');

    await initializeCoreModules();

    // Resolve page type from meta tag first, then fallback to DOM or query
    let pageType = document.querySelector('meta[name="page-type"]')?.content || 'login';
    log(context, `Initial page type from meta: ${pageType}`);

    // Validate page type
    const validPageTypes = ['login', 'admin', 'merchant', 'community', 'partner'];
    if (!validPageTypes.includes(pageType)) {
        log(context, `Invalid page type from meta: ${pageType}, falling back to parsePageType`);
        pageType = await parsePageType(context, 'page', 'login');
    }

    log(context, `Resolved page type: ${pageType}`);

    // Handle invalid page types by redirecting to login
    if (!validPageTypes.includes(pageType)) {
        log(context, `Invalid page type: ${pageType}, redirecting to login with section`);
        const section = pageType === 'signup' ? 'signupContainer' : 'info';
        window.location.href = `/?section=${section}`;
        return;
    }

    // Initialize only the modules for the current page type
    const modules = PAGE_MODULES[pageType] || [];
    if (modules.length === 0) {
        logError(context, `No modules defined for page type: ${pageType}`);
        notifyError(context, `Failed to load ${pageType} page. Please refresh the page.`);
        return;
    }

    // If pageType is 'login', skip authentication checks and initialize login modules
    if (pageType === 'login') {
        for (const module of modules) {
            try {
                log(context, `Initializing module: ${module.name}`);
                const instance = module.initializer(registry);
                registry.set(module.name, instance);
                await instance.initializeLoginPage({ registry });
                log(context, `Module ${module.name} initialized successfully`);
            } catch (err) {
                logError(context, `Failed to initialize module ${module.name}: ${err.message}, ${err.stack}`);
                notifyError(context, `Failed to load ${module.name} module. Please refresh the page.`);
            }
        }
    } else {
        // For non-login pages, check if user is authenticated
        const token = auth.getAuthToken();
        if (!token) {
            log(context, 'No auth token found, redirecting to login');
            window.location.href = '/?section=info';
            return;
        }

        for (const module of modules) {
            try {
                log(context, `Initializing module: ${module.name}`);
                const instance = module.initializer(registry);
                registry.set(module.name, instance);
                if (pageType === 'admin') {
                    log(context, 'Calling initializeAdmin');
                    await instance.initializeAdmin('admin');
                } else if (pageType === 'merchant') {
                    log(context, 'Calling initializeMerchantPage');
                    await instance.initializeMerchantPage(context);
                } else if (pageType === 'community') {
                    log(context, 'Calling initializeCommunityPage');
                    await instance.initializeCommunityPage(context);
                } else if (pageType === 'partner') {
                    log(context, 'Calling initializePartnerPage');
                    await instance.initializePartnerPage(context);
                }
                log(context, `Module ${module.name} initialized successfully`);
            } catch (err) {
                logError(context, `Failed to initialize module ${module.name}: ${err.message}, ${err.stack}`);
                notifyError(context, `Failed to load ${module.name} module. Please refresh the page.`);
            }
        }
    }

    log(context, 'All modules initialized');
    hideOverlay();
}

/**
 * Initializes the main module with lifecycle logging.
 */
withScriptLogging(context, async () => {
    await initializeApp();
    log(context, 'Module initialized');
});