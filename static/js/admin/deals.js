// /static/js/admin/deals.js
import { log } from '../core/logger.js';
import { withErrorHandling } from '../utils/error.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { parsePageType, shouldInitializeForPageType } from '../utils/initialization.js';

const context = 'deals.js';

export async function loadDeals(context, { dealList }) {
    const pageType = parsePageType(context, 'page', 'admin');
    if (pageType !== 'admin') {
        log(context, `Skipping initialization for non-admin page type: ${pageType}`);
        return;
    }
    log(context, 'Deals feature is a stub and not currently active');
    await withErrorHandling(`${context}:loadDeals`, async () => {
        if (dealList) {
            dealList.innerHTML = '<p>Deals feature is currently under development.</p>';
        }
    }, 'Failed to initialize deals stub');
}

export function initializeDealsModule(registry) {
    log(context, 'Initializing deals module for module registry');
    return {
        loadDeals: (ctx, ...args) => loadDeals(ctx, ...args),
    };
}

if (shouldInitializeForPageType('admin')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-admin page');
}