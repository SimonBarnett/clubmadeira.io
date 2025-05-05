// /static/js/admin/settings-orchestrator.js
import { log } from '../core/logger.js';
import { loadAdminSettings } from './settings.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { parsePageType, shouldInitializeForPageType } from '../utils/initialization.js';
import { createModuleInitializer } from '../utils/initialization.js';

const context = 'settings-orchestrator.js';

export async function initializeSettingsOrchestrator(context) {
    const pageType = parsePageType(context, 'page', 'admin');
    if (pageType !== 'admin') {
        log(context, `Skipping initialization for non-admin page type: ${pageType}`);
        return;
    }
    log(context, 'Initializing settings orchestrator');
    const settingsTypes = ['affiliates', 'siteSettings', 'apiKeys'];
    for (const type of settingsTypes) {
        await withErrorHandling(`${context}:initialize${type}`, async () => {
            await loadAdminSettings(context, type);
        }, ERROR_MESSAGES.MODULE_INIT_FAILED);
    }
}

export function initializeSettingsOrchestratorModule(registry) {
    return createModuleInitializer(context, {
        initializeSettingsOrchestrator,
    });
}

if (shouldInitializeForPageType('admin')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-admin page');
}