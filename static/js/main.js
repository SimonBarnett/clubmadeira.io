// /static/js/main.js
// Purpose: Entry point for the application, initializing modules based on page type and handling referral tracking.

import { log, error as logError } from './core/logger.js';
import { withErrorHandling } from './utils/error.js';
import { parsePageType, hideOverlay } from './utils/initialization.js';
import { initializeNotificationsModule } from './core/notifications.js';
import { initializeLoggerModule } from './core/logger.js';
import { initializeCookies } from './core/cookies.js';
import { initializeEndpointsModule } from './config/endpoints.js';
import { initializePagesModule } from './config/pages.js';
import * as auth from './core/auth.js';
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
import { initializeMarkdownModule } from './core/markdown.js';
import { API_ENDPOINTS } from './config/endpoints.js';

const context = 'main.js';

// Module registry to store initialized modules
const registry = new Map();

// Define page-specific module initialization configurations
const PAGE_MODULES = {
    login: [{ name: 'login-page', initializer: initializeLoginPageModule }],
    admin: [{ name: 'admin-page', initializer: initializeAdminPageModule }],
    merchant: [{ name: 'merchant-page', initializer: initializeMerchantPageModule }],
    community: [{ name: 'community-page', initializer: initializeCommunityPageModule }],
    partner: [{ name: 'partner-page', initializer: initializePartnerPageModule }],
};

/**
 * Sends a click event to the /event endpoint based on URL query parameters.
 */
async function trackReferralClick(context) {
    log(context, 'Checking for referral tracking parameters');
    const urlParams = new URLSearchParams(window.location.search);
    const sourceUserId = urlParams.get('source_user_id');
    const destinationUserId = urlParams.get('destination_user_id');

    if (!sourceUserId || !destinationUserId) {
        log(context, 'No source_user_id or destination_user_id in URL, skipping referral tracking');
        return;
    }

    await withErrorHandling(`${context}:trackReferralClick`, async () => {
        const data = { source_user_id: sourceUserId, destination_user_id: destinationUserId };
        log(context, `Sending click event to ${API_ENDPOINTS.EVENT}:`, data);

        const response = await fetch(API_ENDPOINTS.EVENT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        if (response.ok && result.status === 'success') {
            log(context, 'Click event recorded successfully:', result.message);
        } else {
            throw new Error(result.message || 'Failed to record click event');
        }
    }, 'Failed to track referral click', (err) => {
        logError(context, `Referral tracking error: ${err.message}`);
        notifyError(context, 'Failed to track referral');
    });
}

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
        registry.set('markdown', initializeMarkdownModule(registry));
    }, 'Failed to initialize core modules');
}

/**
 * Initializes the application by setting up core modules and page-specific modules.
 */
async function initializeApp() {
    log(context, 'Initializing application');

    await initializeCoreModules();
    await trackReferralClick(context);

    let pageType = document.querySelector('meta[name="page-type"]')?.content || 'login';
    log(context, `Initial page type from meta: ${pageType}`);

    const validPageTypes = ['login', 'admin', 'merchant', 'community', 'partner'];
    if (!validPageTypes.includes(pageType)) {
        log(context, `Invalid page type from meta: ${pageType}, falling back to parsePageType`);
        pageType = await parsePageType(context, 'page', 'login');
    }
    log(context, `Resolved page type: ${pageType}`);

    if (!validPageTypes.includes(pageType)) {
        log(context, `Invalid page type: ${pageType}, redirecting to login with section`);
        const section = pageType === 'signup' ? 'signupContainer' : 'info';
        window.location.href = `/?section=${section}`;
        return;
    }

    const modules = PAGE_MODULES[pageType] || [];
    if (modules.length === 0) {
        logError(context, `No modules defined for page type: ${pageType}`);
        notifyError(context, `Failed to load ${pageType} page. Please refresh the page.`);
        return;
    }

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
                    await instance.initializeAdmin('admin');
                } else if (pageType === 'merchant') {
                    await instance.initializeMerchantPage(context);
                } else if (pageType === 'community') {
                    await instance.initializeCommunityPage(context);
                } else if (pageType === 'partner') {
                    await instance.initializePartnerPage(context);
                }
                log(context, `Module ${module.name} initialized successfully`);
            } catch (err) {
                logError(context, `Failed to initialize module ${module.name}: ${err.message}, ${err.stack}`);
                notifyError(context, `Failed to load ${module.name} module. Please refresh the page.`);
            }
        }
    }

    // Allow specific form submissions handled by their respective modules
    document.addEventListener('submit', event => {
        const form = event.target;
        if ((form.id === 'siteRequestForm' && form.dataset.siteRequestHandled) || 
            form.id === 'category-form') {
            log(context, `Allowing submission for form ID: ${form.id}, handled by respective module`);
            // Do not prevent default or stop propagation, let module-specific handlers manage
        } else {
            log(context, `Form submission detected for form ID: ${form.id || 'unknown'}`);
            event.preventDefault(); // Prevent direct submission for unhandled forms
        }
    }, { capture: true });

    // Prevent redundant click handlers for saveSiteRequest
    document.addEventListener('click', event => {
        if (event.target.dataset.action === 'saveSiteRequest') {
            const form = document.querySelector('#siteRequestForm');
            if (form && form.dataset.saveSiteRequestHandled) {
                log(context, 'Save Site Request button already handled, ignoring');
                event.preventDefault();
                event.stopPropagation();
            }
        }
    }, { capture: true });

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