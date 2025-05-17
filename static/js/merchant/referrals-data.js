// /static/js/merchant/referrals-data.js
import { log } from '../core/logger.js';
import { authenticatedFetch } from '../core/auth.js';
import { withErrorHandling } from '../utils/error.js';
import { parsePageType, shouldInitializeForPageType } from '../utils/initialization.js';
import { ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';

const context = 'merchant/referrals-data.js';

/**
 * Fetches events for the given event type and period.
 * @param {string} eventType - 'referral' or 'sale'
 * @param {string} period - Temporal filter (e.g., 'today')
 * @returns {Promise<Array>} Array of event objects
 */
export async function fetchEvents(eventType, period) {
    const pageType = parsePageType(context, 'page', 'merchant');
    if (pageType === 'login') {
        log(context, `Skipping ${eventType} events fetch on login page`);
        return [];
    }
    log(context, `Fetching ${eventType} events for period: ${period}`);
    return await withErrorHandling(`${context}:fetchEvents`, async () => {
        const response = await authenticatedFetch(`/events/${eventType}?period=${period}`);
        const data = await response.json();
        if (data.status === 'error') {
            throw new Error(data.message || ERROR_MESSAGES.FETCH_FAILED(`${eventType} events`));
        }
        return data.events || [];
    }, ERROR_MESSAGES.FETCH_FAILED(`${eventType} events`), () => []);
}

if (shouldInitializeForPageType('merchant')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-merchant page');
}