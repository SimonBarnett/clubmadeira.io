// /static/js/admin-page.js
import { log, error as logError } from './core/logger.js';
import { authenticatedFetch } from './core/auth.js';
import { initializeUserManagement } from './admin/users-orchestrator.js';
import { loadAffiliates } from './admin/affiliates.js';
import { loadSiteSettings } from './admin/site-settings.js';
import { initializeRoleNavigation, defineSectionHandlers as defineCommonSectionHandlers } from './modules/navigation.js';
import { getMenu } from './config/menus.js';
import { getElements, toggleViewState } from './utils/dom-manipulation.js';
import { withScriptLogging } from './utils/logging-utils.js';
import { getDefaultSectionFromQuery, parsePageType, shouldInitializeForPageType } from './utils/initialization.js';
import { setupAdminEvents } from './admin/admin-events.js';
import { error as notifyError } from './core/notifications.js';

const context = 'admin-page.js';

/**
 * Handles errors by logging them and displaying a notification.
 * @param {string} fnName - The name of the function where the error occurred.
 * @param {Error} error - The error object.
 * @param {string} [toastrMessage] - Optional custom message for the notification.
 */
function handleError(fnName, error, toastrMessage) {
    logError(context, `${fnName} - Error: ${error.message}`, error.stack);
    notifyError(context, toastrMessage || `Error in ${fnName}: ${error.message}`);
}

/**
 * Fetches data from an endpoint with authentication.
 * @param {string} endpoint - The API endpoint to fetch from.
 * @param {Object} [options] - Fetch options.
 * @returns {Promise<Object>} The fetched data.
 */
async function fetchData(endpoint, options = {}) {
    if (typeof endpoint !== 'string') {
        logError(context, `fetchData - Invalid endpoint: ${endpoint}`);
        throw new Error('Endpoint must be a string');
    }
    try {
        const cleanEndpoint = endpoint.startsWith('http') ? new URL(endpoint).pathname : endpoint;
        const response = await authenticatedFetch(cleanEndpoint, {
            headers: { 'Content-Type': 'application/json' },
            ...options,
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch ${cleanEndpoint}: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        log(context, `Fetched data from ${cleanEndpoint}:`, data);
        if (data.status === 'error') {
            throw new Error(data.message || `Error fetching data from ${cleanEndpoint}`);
        }
        return data;
    } catch (error) {
        logError(context, `fetchData - Failed for ${endpoint}: ${error.message}`);
        throw error;
    }
}

/**
 * Fetches and loads logs based on the specified type.
 * @param {string} type - The type of logs to load (e.g., 'login', 'signup').
 */
async function loadLogs(type) {
    try {
        const response = await fetchData(`/logs/${type}`);
        const logs = response.data;
        renderLogs(logs, type);
    } catch (error) {
        handleError('loadLogs', error, `Failed to load ${type} logs`);
    }
}

/**
 * Renders log data into the logs section.
 * @param {Array} logs - The log data to render.
 * @param {string} type - The type of logs being rendered.
 */
function renderLogs(logs, type) {
    const logsContainer = document.getElementById('logs-table-container');
    if (!logsContainer) {
        logError(context, 'Logs table container not found');
        return;
    }
    logsContainer.innerHTML = ''; // Clear existing content
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Details</th>
            </tr>
        </thead>
        <tbody>
            ${logs.map(log => `
                <tr>
                    <td>${log.timestamp}</td>
                    <td>${log.user}</td>
                    <td>${log.details}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    logsContainer.appendChild(table);
    const description = document.getElementById('logs-description');
    if (description) {
        description.textContent = `Displaying ${type.charAt(0).toUpperCase() + type.slice(1)} Events`;
    }
}

/**
 * Initializes the admin page based on the page type.
 * @param {string} pageType - The type of page to initialize.
 */
export async function initializeAdmin(pageType) {
    const resolvedPageType = await parsePageType(context, 'page', 'admin');
    log(context, `initializeAdmin - Initializing admin page with type: ${resolvedPageType}`);
    if (resolvedPageType !== 'admin') {
        log(context, 'Skipping initialization for non-admin page');
        return;
    }
    try {
        const elements = await getElements(context, [
            'user_management', 'user_list', 'user_role_icon', 'user_role_title',
            'affiliate-icons', 'affiliate-settings-container', 'affiliate-static-content', 'affiliate-readme-content',
            'site-settings-icons', 'site-settings-form', 'site-settings-fields',
            'logs', 'logs-table-container', 'logs-description', 'logsIntro' // Added logsIntro
        ]);

        Object.entries(elements).forEach(([key, value]) => {
            if (!value) logError(context, `DOM element not found: ${key}`);
        });

        const initFunctions = [
            {
                name: 'userManagement',
                fn: async () => {
                    log(context, 'Initializing User Management');
                    if (elements.user_management && elements.user_list && elements.user_role_icon && elements.user_role_title) {
                        await initializeUserManagement(context);
                    } else {
                        logError(context, 'Skipping User Management initialization due to missing elements');
                        notifyError(context, 'User Management section not properly configured');
                        document.getElementById('user_management')?.appendChild(createFallbackContent('User management unavailable'));
                    }
                }
            },
            {
                name: 'affiliates',
                fn: async () => {
                    log(context, 'Initializing Affiliates');
                    if (elements['affiliate-icons'] && elements['affiliate-settings-container'] && elements['affiliate-static-content']) {
                        await loadAffiliates(context);
                    } else {
                        logError(context, 'Skipping Affiliates initialization due to missing elements');
                        notifyError(context, 'Affiliates section not properly configured');
                        document.getElementById('affiliates')?.appendChild(createFallbackContent('Affiliate programs unavailable'));
                    }
                }
            },
            {
                name: 'siteSettings',
                fn: async () => {
                    log(context, 'Initializing Site Settings');
                    if (elements['site-settings-icons'] && elements['site-settings-form'] && elements['site-settings-fields']) {
                        await loadSiteSettings(context);
                    } else {
                        logError(context, 'Skipping Site Settings initialization due to missing elements');
                        notifyError(context, 'Site Settings section not properly configured');
                        document.getElementById('site_settings')?.appendChild(createFallbackContent('Site settings unavailable'));
                    }
                }
            },
            {
                name: 'events',
                fn: async () => {
                    log(context, 'Setting up admin events');
                    await setupAdminEvents(context);
                }
            }
        ];

        for (const { name, fn } of initFunctions) {
            try {
                await fn();
                log(context, `${name} initialized successfully`);
            } catch (error) {
                handleError(name, error, `Failed to initialize ${name} module`);
            }
        }

        const defaultSection = await getDefaultSectionFromQuery(context, 'admin', 'info');
        toggleViewState(context, { [defaultSection]: true });
        log(context, `Set default section to ${defaultSection}`);
    } catch (error) {
        handleError('initializeAdmin', error, 'Failed to initialize admin page');
    }
}

/**
 * Creates fallback content for unavailable sections.
 * @param {string} message - The message to display.
 * @returns {HTMLElement} The created div element.
 */
function createFallbackContent(message) {
    const div = document.createElement('div');
    div.innerHTML = `<p>${message}</p>`;
    return div;
}

/**
 * Defines section handlers for the admin page.
 * @returns {Object} An object mapping section names to their handlers.
 */
function defineAdminSectionHandlers() {
    return {
        'info': async (show, role) => {
            log(context, 'Handler - Info triggered');
            toggleViewState(context, { info: show });
        },
        'user_management': async (show, role = 'admin') => {
            log(context, `Handler - User Management triggered with role: ${role}`);
            try {
                const elements = await getElements(context, ['user_management', 'user_list', 'user_role_icon', 'user_role_title']);
                if (!elements.user_management || !elements.user_list || !elements.user_role_icon || !elements.user_role_title) {
                    logError(context, 'Required user management elements not found');
                    notifyError(context, 'User management section not properly configured');
                    elements.user_management?.appendChild(createFallbackContent('User management unavailable due to configuration issues'));
                    return;
                }
                await initializeUserManagement(context);
                toggleViewState(context, { user_management: show, info: false });
                log(context, `User management initialized for role ${role}`);
            } catch (error) {
                handleError('user_management', error, 'Failed to load user management');
            }
        },
        'affiliates': async (show, role) => {
            log(context, 'Handler - Affiliates triggered');
            try {
                const elements = await getElements(context, ['affiliate-icons', 'affiliate-settings-container', 'affiliate-static-content', 'affiliate-readme-content']);
                if (!elements['affiliate-icons'] || !elements['affiliate-settings-container'] || !elements['affiliate-static-content']) {
                    logError(context, 'Required affiliates elements not found');
                    notifyError(context, 'Affiliates section not properly configured');
                    elements.affiliates?.appendChild(createFallbackContent('Affiliate programs unavailable due to configuration issues'));
                    return;
                }
                await loadAffiliates(context);
                toggleViewState(context, { affiliates: show, info: false });
                log(context, 'Affiliates section loaded');
            } catch (error) {
                handleError('affiliates', error, 'Failed to load affiliates');
            }
        },
        'site_settings': async (show, role) => {
            log(context, 'Handler - Site Settings triggered');
            try {
                const elements = await getElements(context, ['site-settings-icons', 'site-settings-form', 'site-settings-fields']);
                if (!elements['site-settings-icons'] || !elements['site-settings-form'] || !elements['site-settings-fields']) {
                    logError(context, 'Required site settings elements not found');
                    notifyError(context, 'Site settings section not properly configured');
                    elements.site_settings?.appendChild(createFallbackContent('Site settings unavailable due to configuration issues'));
                    return;
                }
                await loadSiteSettings(context);
                toggleViewState(context, { site_settings: show, info: false });
                log(context, 'Site settings section loaded');
            } catch (error) {
                handleError('site_settings', error, 'Failed to load site settings');
            }
        },
        'userManagementIntro': async (show, role) => {
            log(context, 'Handler - User Management Intro triggered');
            toggleViewState(context, { userManagementIntro: show, info: false });
        },
        'testScriptsIntro': async (show, role) => {
            log(context, 'Handler - Test Scripts Intro triggered');
            toggleViewState(context, { testScriptsIntro: show, info: false });
        },
        'referralTestsIntro': async (show, role) => {
            log(context, 'Handler - Referral Tests Intro triggered');
            toggleViewState(context, { referralTestsIntro: show, info: false });
        },
        'page_visit_test': async (show, role) => {
            log(context, 'Handler - Page Visit Test triggered');
            toggleViewState(context, { page_visit_test: show, info: false });
        },
        'order_test': async (show, role) => {
            log(context, 'Handler - Order Test triggered');
            toggleViewState(context, { order_test: show, info: false });
        },
        'test_partner': async (show, role) => {
            log(context, 'Handler - Test Partner triggered');
            toggleViewState(context, { test_partner: show, info: false });
        },
        'test_merchant': async (show, role) => {
            log(context, 'Handler - Test Merchant triggered');
            toggleViewState(context, { test_merchant: show, info: false });
        },
        'test_community': async (show, role) => {
            log(context, 'Handler - Test Community triggered');
            toggleViewState(context, { test_community: show, info: false });
        },
        'logsIntro': async (show, role) => {
            log(context, 'Handler - Logs Intro triggered');
            toggleViewState(context, { logsIntro: show, info: false });
        },
        'logs': async (show, role, type) => {
            log(context, `Handler - Logs triggered with type: ${type}`);
            if (show) {
                toggleViewState(context, { logs: true, info: false });
                if (type) {
                    await loadLogs(type);
                } else {
                    logError(context, 'No log type specified for logs section');
                    notifyError(context, 'Log type not specified');
                }
            } else {
                toggleViewState(context, { logs: false });
            }
        },
    };
}

// Initialize the admin page if the page type is 'admin'
if (shouldInitializeForPageType('admin')) {
    document.addEventListener('DOMContentLoaded', async () => {
        log(context, 'admin-page.js - DOMContentLoaded, initializing');
        try {
            const role = 'admin';
            const defaultSection = await getDefaultSectionFromQuery(context, role, 'info');

            // Combine common and admin-specific section handlers
            const commonHandlers = defineCommonSectionHandlers(context, role);
            const adminHandlers = defineAdminSectionHandlers();
            const sectionHandlers = { ...commonHandlers, ...adminHandlers };

            const menuElement = document.getElementById('menu');
            if (menuElement) {
                const menu = getMenu('admin');
                log(context, `Menu items: ${menu.map(item => item.section).join(', ')}`);
                await initializeRoleNavigation(menuElement, menu, { sectionHandlers, defaultSection });
                log(context, `Triggering default section: ${defaultSection}`);
                if (sectionHandlers[defaultSection]) {
                    await sectionHandlers[defaultSection](true, role);
                } else {
                    logError(context, `No handler for default section: ${defaultSection}`);
                    await sectionHandlers.info(true, role);
                }
            } else {
                logError(context, 'Menu element not found');
                notifyError(context, 'Navigation menu not found');
                toggleViewState(context, { info: true });
            }

            document.addEventListener('sectionChange', async (e) => {
                const { section, role, type } = e.detail || {};
                log(context, `sectionChange - Section: ${section}, Role: ${role}, Type: ${type || 'none'}`);
                const handler = sectionHandlers[section];
                if (handler) {
                    await handler(true, role, type);
                } else {
                    logError(context, `No handler for section: ${section}`);
                    notifyError(context, `Section ${section} not found`);
                    await sectionHandlers.info(true, role);
                }
            });

            await initializeAdmin('admin');
        } catch (error) {
            handleError('navigationSetup', error, 'Failed to set up navigation');
            toggleViewState(context, { info: true });
        }
    });
} else {
    log(context, 'Skipping initialization for non-admin page');
}

// Expose functions to the global scope
window.handleError = handleError;
window.fetchData = fetchData;
window.initializeAdmin = initializeAdmin;

/**
 * Initializes the admin page module for a registry.
 * @param {Object} registry - The module registry.
 * @returns {Object} The module interface.
 */
export function initializeAdminPageModule(registry) {
    log(context, 'Initializing admin page module for module registry');
    return {
        initializeAdmin: (pageType) => initializeAdmin(pageType),
    };
}

// Log script initialization
withScriptLogging(context, () => {
    log(context, 'Module initialized');
});