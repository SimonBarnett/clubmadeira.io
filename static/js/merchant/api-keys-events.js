// /static/js/merchant/api-keys-events.js
import { log } from '../core/logger.js';
import { setupEventListeners } from '../utils/event-listeners.js';
import { fetchData } from '../utils/data-fetch.js';
import { success, error } from '../core/notifications.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';

const context = 'merchant/api-keys-events.js';

export function setupApiKeyEvents(context) {
    log(context, 'Setting up API key event listeners');
    setupEventListeners(context, [
        {
            eventType: 'submit',
            selector: '#api-keys-form',
            handler: async (event) => {
                event.preventDefault();
                await withErrorHandling(`${context}:submitApiKeyForm`, async () => {
                    const form = event.target;
                    const keyType = form.dataset.keyType;
                    const fields = {};
                    Array.from(form.querySelectorAll('input')).forEach(input => {
                        fields[input.name] = input.value;
                    });
                    await fetchData(context, `/settings/api_key/${keyType}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(fields),
                    });
                    success(context, SUCCESS_MESSAGES.SETTINGS_UPDATED);
                    log(context, `Settings updated for ${keyType}`);
                }, ERROR_MESSAGES.FORM_SUBMISSION_FAILED, (err) => {
                    error(context, `Failed to update API key settings: ${err.message}`);
                });
            },
        },
    ]);
}

withScriptLogging(context, () => {
    log(context, 'Module initialized');
    setupApiKeyEvents(context);
});