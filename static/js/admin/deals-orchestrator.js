// /static/js/admin/deals-orchestrator.js
import { log } from '../core/logger.js';
import { loadDeals } from './deals.js';
import { getElements } from '../utils/dom-manipulation.js';
import { withErrorHandling } from '../utils/error.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { parsePageType, shouldInitializeForPageType } from '../utils/initialization.js';
import { createModuleInitializer } from '../utils/initialization.js';

const context = 'deals-orchestrator.js';

export async function initializeDealsOrchestrator(context) {
    const pageType = parsePageType(context, 'page', 'admin');
    if (pageType !== 'admin') {
        log(context, `Skipping initialization for non-admin page type: ${pageType}`);
        return;
    }
    log(context, 'Initializing deals orchestrator (stub feature)');
    await withErrorHandling(`${context}:initializeDealsOrchestrator`, async () => {
        const elements = await getElements(context, ['dealList']);
        await loadDeals(context, elements);
    }, 'Failed to initialize deals orchestrator (stub)');
}

export function initializeDealsOrchestratorModule(registry) {
    return createModuleInitializer(context, {
        initializeDealsOrchestrator,
    });
}

if (shouldInitializeForPageType('admin')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-admin page');
}