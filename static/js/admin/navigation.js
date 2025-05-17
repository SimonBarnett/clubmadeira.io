// /static/js/admin/navigation.js
import { log, error as logError } from '../core/logger.js';
import { defineSectionHandlers } from '../modules/navigation.js';
import { loadDeals } from './deals.js';
import { initializeUserManagement } from './users-orchestrator.js';
import { loadAdminSettings } from './settings.js';
import { initializeAdminModules } from './initializer.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { toggleViewState } from '../utils/dom-manipulation.js';
import { parsePageType, shouldInitializeForPageType } from '../utils/initialization.js';
import { loadSiteRequests, viewSiteRequest } from './site-requests.js';

const context = 'navigation.js';

let lastSection = null; // Track the last section to prevent duplicate events
const DEBOUNCE_MS = 100; // Debounce events within 100ms

export function defineAdminSectionHandlers(context) {
    const pageType = parsePageType(context, 'page', 'admin');
    if (pageType !== 'admin') {
        log(context, `Skipping initialization for non-admin page type: ${pageType}`);
        return;
    }
    log(context, 'Defining section handlers');
    defineSectionHandlers(context, 'admin', [
        {
            id: 'info',
            handler: async (show) => {
                if (show && lastSection !== 'info') {
                    log(context, 'Loading info section');
                    lastSection = 'info';
                    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_MS));
                    toggleViewState(context, { info: show });
                } else if (!show) {
                    lastSection = null;
                    toggleViewState(context, { info: false });
                }
            },
        },
        {
            id: 'user_management',
            handler: async (show) => {
                if (show && lastSection !== 'user_management') {
                    log(context, 'Loading user management section');
                    lastSection = 'user_management';
                    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_MS));
                    await initializeUserManagement(context);
                    toggleViewState(context, { user_management: show });
                } else if (!show) {
                    lastSection = null;
                    toggleViewState(context, { user_management: false });
                }
            },
        },
        {
            id: 'affiliates',
            handler: async (show) => {
                if (show && lastSection !== 'affiliates') {
                    log(context, 'Calling loadAdminSettings for affiliates');
                    lastSection = 'affiliates';
                    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_MS));
                    await loadAdminSettings(context, 'affiliates');
                    toggleViewState(context, { affiliates: show });
                } else if (!show) {
                    lastSection = null;
                    toggleViewState(context, { affiliates: false });
                }
            },
        },
        {
            id: 'site_settings',
            handler: async (show) => {
                if (show && lastSection !== 'site_settings') {
                    log(context, 'Calling initializeAdminModules');
                    lastSection = 'site_settings';
                    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_MS));
                    await initializeAdminModules(context);
                    toggleViewState(context, { site_settings: show });
                } else if (!show) {
                    lastSection = null;
                    toggleViewState(context, { site_settings: false });
                }
            },
        },
        {
            id: 'api_keys',
            handler: async (show) => {
                if (show && lastSection !== 'api_keys') {
                    log(context, 'Calling loadAdminSettings for apiKeys');
                    lastSection = 'api_keys';
                    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_MS));
                    await loadAdminSettings(context, 'apiKeys');
                    toggleViewState(context, { api_keys: show });
                } else if (!show) {
                    lastSection = null;
                    toggleViewState(context, { api_keys: false });
                }
            },
        },
        {
            id: 'deals',
            handler: async (show) => {
                if (show && lastSection !== 'deals') {
                    log(context, 'Calling loadDeals');
                    lastSection = 'deals';
                    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_MS));
                    const elements = await import('../utils/dom-manipulation.js').then(m => m.getElements(context, ['dealList']));
                    await loadDeals(context, elements);
                    toggleViewState(context, { deals: show });
                } else if (!show) {
                    lastSection = null;
                    toggleViewState(context, { deals: false });
                }
            },
        },
        {
            id: 'site_requests',
            handler: async (show) => {
                if (show && lastSection !== 'site_requests') {
                    log(context, 'Loading site requests section');
                    lastSection = 'site_requests';
                    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_MS));
                    await loadSiteRequests(context);
                    toggleViewState(context, { site_requests: show });
                } else if (!show) {
                    log(context, 'Hiding site requests section');
                    lastSection = null;
                    toggleViewState(context, { site_requests: false });
                }
            },
        },
        {
            id: 'view-site-request',
            handler: async (show) => {
                if (show && lastSection !== 'view-site-request') {
                    log(context, 'Loading view site request section');
                    lastSection = 'view-site-request';
                    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_MS));
                    toggleViewState(context, { 'view-site-request': show });
                } else if (!show) {
                    log(context, 'Hiding view site request section');
                    lastSection = null;
                    toggleViewState(context, { 'view-site-request': false });
                }
            },
        },
        {
            id: 'logsIntro',
            handler: async (show) => {
                if (show && lastSection !== 'logsIntro') {
                    log(context, 'Loading logsIntro section');
                    lastSection = 'logsIntro';
                    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_MS));
                    toggleViewState(context, { logsIntro: show });
                } else if (!show) {
                    lastSection = null;
                    toggleViewState(context, { logsIntro: false });
                }
            },
        },
        {
            id: 'logs',
            handler: async (show, role, type) => {
                if (show && lastSection !== 'logs') {
                    log(context, `Loading logs section with type: ${type || 'none'}`);
                    lastSection = 'logs';
                    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_MS));
                    toggleViewState(context, { logs: true });
                    if (type) {
                        await loadLogs(type);
                    } else {
                        logError(context, 'No log type specified');
                    }
                } else if (!show) {
                    lastSection = null;
                    toggleViewState(context, { logs: false });
                }
            },
        },
    ]);
}

export function initializeNavigationModule(registry) {
    log(context, 'Initializing navigation module for module registry');
    return {
        defineAdminSectionHandlers: ctx => defineAdminSectionHandlers(ctx),
    };
}

if (shouldInitializeForPageType('admin')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-admin page');
}