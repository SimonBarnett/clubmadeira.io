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

const context = 'navigation.js';

// Placeholder for loadLogs; in practice, this should be imported or defined elsewhere
async function loadLogs(type) {
    console.log(`Loading logs for type: ${type}`);
    // Implementation to load logs would go here
}

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
                log(context, 'Loading info section');
                toggleViewState(context, { info: show });
            },
        },
        {
            id: 'user_management',
            handler: async (show) => {
                log(context, 'Loading user management section');
                await initializeUserManagement(context);
                toggleViewState(context, { user_management: show });
            },
        },
        {
            id: 'affiliates',
            handler: async (show) => {
                log(context, 'Calling loadAdminSettings for affiliates');
                await loadAdminSettings(context, 'affiliates');
                toggleViewState(context, { affiliates: show });
            },
        },
        {
            id: 'site_settings',
            handler: async (show) => {
                log(context, 'Calling initializeAdminModules');
                await initializeAdminModules(context);
                toggleViewState(context, { site_settings: show });
            },
        },
        {
            id: 'api_keys',
            handler: async (show) => {
                log(context, 'Calling loadAdminSettings for apiKeys');
                await loadAdminSettings(context, 'apiKeys');
                toggleViewState(context, { api_keys: show });
            },
        },
        {
            id: 'deals',
            handler: async (show) => {
                log(context, 'Calling loadDeals');
                const elements = await import('../utils/dom-manipulation.js').then(m => m.getElements(context, ['dealList']));
                await loadDeals(context, elements);
                toggleViewState(context, { deals: show });
            },
        },
        {
            id: 'logsIntro',
            handler: async (show) => {
                log(context, 'Loading logsIntro section');
                toggleViewState(context, { logsIntro: show });
            },
        },
        {
            id: 'logs',
            handler: async (show, role, type) => {
                log(context, `Loading logs section with type: ${type || 'none'}`);
                if (show) {
                    toggleViewState(context, { logs: true });
                    if (type) {
                        await loadLogs(type);
                    } else {
                        logError(context, 'No log type specified');
                    }
                } else {
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