// /static/js/merchant/referrals-page.js
import { log } from '../core/logger.js';
import { withErrorHandling } from '../utils/error.js';
import { withAuthenticatedUser } from '../core/auth.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { renderPeriodIcons } from './referrals-ui.js';
import { shouldInitializeForPageType } from '../utils/initialization.js';
import { withScriptLogging } from '../utils/logging-utils.js';

const context = 'merchant/referrals-page.js';

/**
 * Initializes the referrals page with the specified log type ('referral' or 'sale').
 * @param {string} logType - The type of logs to display ('referral' or 'sale').
 * @returns {Promise<void>}
 */
export async function initializeReferralsPage(logType) {
    log(context, `Initializing referrals page for log type: ${logType}`);
    await withAuthenticatedUser(context, async () => {
        await withErrorHandling(`${context}:initializeReferralsPage`, async () => {
            const logsSection = document.getElementById('logs');
            if (logsSection) {
                logsSection.dataset.type = logType;
                renderPeriodIcons();
            } else {
                log(context, 'Error: logs section not found.');
            }
        }, ERROR_MESSAGES.FETCH_FAILED('referrals page initialization'));
    }, 'initializeReferralsPage');
}

if (shouldInitializeForPageType('merchant')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-merchant page');
}