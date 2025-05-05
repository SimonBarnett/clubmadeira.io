// /static/js/community/providers-data.js
import { log } from '../core/logger.js';
import { fetchData } from '../utils/data-fetch.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { shouldInitializeForPageType } from '../utils/initialization.js';

const context = 'providers-data.js';

/**
 * Fetches client API settings from the /settings/client_api endpoint.
 * @param {string} context - The context or module name.
 * @returns {Promise<Array>} The fetched settings data.
 * @throws {Error} If the data is missing or invalid.
 */
export async function loadClientApiSettings(context) {
    log(context, 'Loading client API settings');
    return await withErrorHandling(`${context}:loadClientApiSettings`, async () => {
        const data = await fetchData(context, API_ENDPOINTS.CLIENT_API_SETTINGS);
        if (!data.settings || !Array.isArray(data.settings) || data.settings.length === 0) {
            throw new Error('Settings data is missing or invalid');
        }
        return data.settings;
    });
}

if (shouldInitializeForPageType('community')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-community page');
}