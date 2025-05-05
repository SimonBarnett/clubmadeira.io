// /static/js/admin/api-keys.js
import { log } from '../core/logger.js';
import { fetchData } from '../utils/data-fetch.js';
import { withElement, toggleViewState } from '../utils/dom-manipulation.js';
import { error } from '../core/notifications.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { parsePageType, shouldInitializeForPageType } from '../utils/initialization.js';

const context = 'admin/api-keys.js';

export async function loadApiKeys(context) {
    const pageType = parsePageType(context, 'page', 'admin');
    if (pageType !== 'admin') {
        log(context, `Skipping initialization for non-admin page type: ${pageType}`);
        return;
    }
    log(context, 'Loading API keys');
    await withErrorHandling(`${context}:loadApiKeys`, async () => {
        await withElement(context, 'api-keys-icons', async iconsContainer => {
            await withElement(context, 'api-keys-fields', async fieldsContainer => {
                await withElement(context, 'api-keys-form', async form => {
                    const data = await fetchData(context, API_ENDPOINTS.SETTINGS_KEY, { method: 'GET' });
                    if (!data.settings || data.settings.length === 0) {
                        iconsContainer.innerHTML = '<p>No API keys available.</p>';
                        error(context, ERROR_MESSAGES.NO_DATA('API keys'));
                        return;
                    }
                    await displayApiKeyFields(context, data.settings[0], fieldsContainer, form);
                });
            });
        });
    }, ERROR_MESSAGES.FETCH_FAILED('API keys'));
}

export async function displayApiKeyFields(context, setting, fieldsContainer, form) {
    log(context, 'Rendering API key fields');
    fieldsContainer.innerHTML = '';
    form.style.display = 'block';
    form.dataset.keyType = setting.key_type;

    const container = document.createElement('div');
    container.className = 'api-keys-settings';
    fieldsContainer.appendChild(container);

    const heading = document.createElement('h3');
    heading.textContent = setting.comment || 'API Keys Settings';
    heading.className = 'api-keys-comment-heading';
    container.appendChild(heading);

    const description = document.createElement('p');
    description.textContent = setting.description || '';
    description.className = 'api-keys-description';
    container.appendChild(description);

    Object.entries(setting.fields).forEach(([name, value]) => {
        const div = document.createElement('div');
        div.className = 'api-keys-field';
        div.innerHTML = `
            <label for="${name}">${name}:</label>
            <input type="text" id="${name}" name="${name}" value="${value}">
        `;
        container.appendChild(div);
    });

    toggleViewState(context, { 'api-keys-fields': true });
}

if (shouldInitializeForPageType('admin')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-admin page');
}