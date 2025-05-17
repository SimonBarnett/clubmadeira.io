// /static/js/admin/initializer.js
import { log } from '../core/logger.js';
import { withErrorHandling } from '../utils/error.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { initializeDealsOrchestrator } from './deals-orchestrator.js';
import { initializeUsersOrchestratorModule } from './users-orchestrator.js';
import { initializeSettingsOrchestrator } from './settings-orchestrator.js';
import { initializeReferralTest } from './referral-test.js'; // Added import
import { parsePageType, shouldInitializeForPageType } from '../utils/initialization.js';

const context = 'initializer.js';

export async function initializeAdminModules(context) {
    const pageType = parsePageType(context, 'page', 'admin');
    if (pageType !== 'admin') {
        log(context, `Skipping initialization for non-admin page type: ${pageType}`);
        return;
    }
    log(context, 'Initializing admin feature orchestrators');
    const orchestrators = [
        { name: 'deals', init: initializeDealsOrchestrator },
        { name: 'users', init: initializeUsersOrchestratorModule },
        { name: 'settings', init: initializeSettingsOrchestrator },
        { name: 'referralTest', init: initializeReferralTest }, // Added referralTest
    ];
    for (const { name, init } of orchestrators) {
        await withErrorHandling(`${context}:initialize${name}`, async () => {
            await init(context);
        }, `Failed to initialize ${name} orchestrator (continuing with other orchestrators)`);
    }
}

export function initializeInitializerModule(registry) {
    return createModuleInitializer(context, {
        initializeAdminModules,
    });
}

if (shouldInitializeForPageType('admin')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-admin page');
}