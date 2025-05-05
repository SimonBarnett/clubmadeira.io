// /static/js/admin/admin-events.js
import { log } from '../core/logger.js';
import { registerEvents } from '../utils/event-listeners.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { parsePageType, shouldInitializeForPageType } from '../utils/initialization.js';
import { createModuleInitializer } from '../utils/initialization.js';

const context = 'admin-events.js';

export async function setupAdminEvents(context) {
    const pageType = await parsePageType(context, 'page', 'admin');
    if (pageType !== 'admin') {
        log(context, `Skipping initialization for non-admin page type: ${pageType}`);
        return;
    }
    log(context, 'Setting up admin event listeners');
    await withErrorHandling(`${context}:setupAdminEvents`, () => {
        registerEvents(context, [
            'formSubmit',
            'navigationToggle',
            'permissionChange',
            'modifyPermissions',
        ], {
            formId: 'settingsForm',
            endpoint: '/settings/user',
            configKey: 'userSettings',
            navToggleId: 'adminNavToggle',
            navId: 'adminNav',
        });
    }, ERROR_MESSAGES.EVENT_HANDLER_FAILED);
}

export function initializeAdminEventsModule(registry) {
    return createModuleInitializer(context, {
        setupAdminEvents,
    });
}

if (shouldInitializeForPageType('admin')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-admin page');
}