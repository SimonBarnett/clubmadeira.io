// /static/js/admin/users-orchestrator.js
import { log, error as logError } from '../core/logger.js';
import { renderRoleIcons } from './users-ui.js';
import { setupAdminEvents } from './admin-events.js';
import { getElements } from '../utils/dom-manipulation.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { parsePageType, shouldInitializeForPageType } from '../utils/initialization.js';
import { createModuleInitializer } from '../utils/initialization.js';

const context = 'users-orchestrator.js';

export async function initializeUserManagement(context) {
    const pageType = await parsePageType(context, 'page', 'admin');
    if (pageType !== 'admin') {
        log(context, `Skipping initialization for non-admin page type: ${pageType}`);
        return;
    }
    log(context, 'Initializing user management');
    await withErrorHandling(`${context}:initializeUserManagement`, async () => {
        const elements = await getElements(context, ['user_management', 'user_list']);
        if (!elements.user_management || !elements.user_list) {
            logError(context, 'Required elements not found');
            throw new Error(ERROR_MESSAGES.ELEMENT_NOT_FOUND);
        }
        await renderRoleIcons(context);
        log(context, 'Events setup for user management');
        await setupAdminEvents(context);
    }, ERROR_MESSAGES.MODULE_INIT_FAILED);
}

export function initializeUsersOrchestratorModule(registry) {
    return createModuleInitializer(context, {
        initializeUserManagement,
    });
}

if (shouldInitializeForPageType('admin')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-admin page');
}