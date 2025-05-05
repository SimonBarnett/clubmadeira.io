// /static/js/merchant/api-keys.js
import { log, warn } from '../core/logger.js';
import { fetchData } from '../utils/data-fetch.js';
import { createIcon } from '../utils/icons.js';
import { withElement, toggleViewState } from '../utils/dom-manipulation.js';
import { error, success } from '../core/notifications.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { renderMarkdown } from '../core/markdown.js'; // Added import for markdown rendering

const context = 'merchant/api-keys.js';

/**
 * Loads API key settings and renders icons for each setting.
 * @param {string} context - Logging context
 */
export async function loadApiKeys(context) {
    log(context, 'Loading API keys');
    await withErrorHandling(`${context}:loadApiKeys`, async () => {
        await withElement(context, 'api-keys-icons', async (iconsContainer) => {
            const data = await fetchData(context, API_ENDPOINTS.API_KEY, { method: 'GET' });
            log(context, `API response for ${API_ENDPOINTS.API_KEY}: ${JSON.stringify(data)}`);
            if (!data.settings || !Array.isArray(data.settings) || data.settings.length === 0) {
                iconsContainer.innerHTML = '<p>No API keys available.</p>';
                error(context, 'No API keys available');
                return;
            }
            log(context, `Number of settings: ${data.settings.length}`);
            await renderApiKeyIcons(context, data.settings, iconsContainer);
            await renderApiKeyFields(context, data.settings[0]);
            // Removed toggleViewState call here; handled by navigation handler
        });
    });
}

/**
 * Renders icons for each API key setting in the provided container.
 * @param {string} context - Logging context
 * @param {Array} settings - Array of API key settings
 * @param {HTMLElement} container - DOM element to render icons into
 */
async function renderApiKeyIcons(context, settings, container) {
    log(context, 'Rendering API key icons');
    container.innerHTML = '';
    for (const [index, setting] of settings.entries()) {
        const iconClass = setting.icon || 'fas fa-key';
        const icon = await createIcon(context, iconClass, { 'data-key-type': setting.key_type });
        icon.classList.add('affiliate-icon');
        if (index === 0) icon.classList.add('selected');
        Object.assign(icon.style, {
            width: '24px',
            height: '24px',
            display: 'inline-block',
            margin: '5px',
            cursor: 'pointer'
        });
        icon.addEventListener('click', async (event) => {
            event.preventDefault();
            log(context, `Icon clicked for ${setting.key_type}`);
            container.querySelectorAll('.affiliate-icon').forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
            await renderApiKeyFields(context, setting);
            document.getElementById('api-keys').style.display = 'block';
        });
        container.appendChild(icon);
    }
}

/**
 * Renders the fields and details for a selected API key setting.
 * @param {string} context - Logging context
 * @param {Object} setting - The API key setting to display
 */
async function renderApiKeyFields(context, setting) {
    log(context, `Rendering fields for API key: ${setting.key_type}`);

    const staticContainer = document.getElementById('api-keys-static-content');
    const formContainer = document.getElementById('api-keys-settings-container');
    const readmeContainer = document.getElementById('api-keys-readme-content');
    const form = document.getElementById('api-keys-form');

    if (!staticContainer || !formContainer || !readmeContainer || !form) {
        warn(context, 'Missing required DOM elements for API keys details');
        error(context, 'Missing required DOM elements for API keys details');
        return;
    }

    staticContainer.innerHTML = '';
    const header = document.createElement('div');
    header.id = 'api-keys-header';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.marginBottom = '15px';

    const icon = document.createElement('i');
    icon.className = `selected-affiliate-icon ${setting.icon || 'fas fa-key'}`;
    icon.style.fontSize = '16px';
    icon.style.color = 'currentColor';
    icon.style.marginRight = '10px';
    header.appendChild(icon);

    const title = document.createElement('h3');
    title.className = 'affiliate-comment-heading';
    title.style.display = 'inline-block';
    title.style.verticalAlign = 'middle';
    title.style.margin = '0';
    title.textContent = setting.comment || `${setting.key_type} Settings`;
    header.appendChild(title);

    const linksContainer = document.createElement('div');
    linksContainer.style.marginLeft = 'auto';
    linksContainer.style.display = 'flex';
    linksContainer.style.gap = '10px';

    if (Array.isArray(setting.doc_link) && setting.doc_link.length > 0) {
        setting.doc_link.forEach(doc => {
            const linkElement = document.createElement('a');
            linkElement.className = `affiliate-${doc.title}-link`;
            linkElement.style.color = 'currentColor';
            linkElement.innerHTML = `<i class="fas fa-${doc.title === 'api' ? 'link' : doc.title === 'signup' ? 'user-plus' : 'book'}" style="font-size: 16px;"></i>`;
            linkElement.href = doc.link;
            linkElement.style.display = 'inline-block';
            linkElement.target = '_blank';
            linkElement.title = doc.title.charAt(0).toUpperCase() + doc.title.slice(1);
            linksContainer.appendChild(linkElement);
        });
    }

    header.appendChild(linksContainer);
    staticContainer.appendChild(header);

    const descriptionText = setting._description || setting.description || 'Use this section to manage your API key settings.';
    const description = document.createElement('p');
    description.className = 'affiliate-description';
    description.style.marginBottom = '15px';
    description.textContent = descriptionText;
    staticContainer.appendChild(description);

    const readmeLinkObj = setting.doc_link ? setting.doc_link.find(link => link.title === 'readme') : null;
    if (readmeLinkObj) {
        const mdLinkElement = staticContainer.querySelector('.affiliate-readme-link');
        const keysLinkElement = document.createElement('a');
        keysLinkElement.className = 'affiliate-keys-link';
        keysLinkElement.style.color = 'currentColor';
        keysLinkElement.innerHTML = '<i class="fas fa-key" style="font-size: 16px;"></i>';
        keysLinkElement.style.display = 'none';
        keysLinkElement.title = 'Back to Keys';
        linksContainer.appendChild(keysLinkElement);

        if (mdLinkElement) {
            mdLinkElement.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const markdown = await renderMarkdown(context, readmeLinkObj.link);
                    readmeContainer.innerHTML = markdown;
                    formContainer.style.display = 'none';
                    readmeContainer.style.display = 'block';
                    mdLinkElement.style.display = 'none';
                    keysLinkElement.style.display = 'inline-block';
                    log(context, `Readme loaded for ${setting.key_type}`);
                } catch (err) {
                    error(context, 'Failed to load readme');
                    log(context, `Error loading readme: ${err.message}`);
                }
            });

            keysLinkElement.addEventListener('click', (e) => {
                e.preventDefault();
                formContainer.style.display = 'block';
                readmeContainer.style.display = 'none';
                keysLinkElement.style.display = 'none';
                mdLinkElement.style.display = 'inline-block';
                log(context, `Returned to form view for ${setting.key_type}`);
            });
        }
    }

    const fieldsContainer = form.querySelector('#api-keys-fields');
    if (fieldsContainer) {
        fieldsContainer.innerHTML = '';
        Object.entries(setting.fields || {}).forEach(([name, value]) => {
            const div = document.createElement('div');
            div.style.marginBottom = '10px';
            div.innerHTML = `
                <label for="${name}">${name}:</label>
                <input type="text" id="${name}" name="${name}" value="${value || ''}">
            `;
            fieldsContainer.appendChild(div);
        });
        form.dataset.keyType = setting.key_type;
    }

    formContainer.style.display = 'block';
    readmeContainer.style.display = 'none';

    if (!form._submitListenerAttached) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const keyType = form.dataset.keyType;
            log(context, `Form submission - keyType: ${keyType}`);
            if (!keyType) {
                warn(context, 'No keyType set for form submission');
                error(context, 'Failed to update settings: No keyType specified');
                return;
            }
            const fields = {};
            Array.from(form.querySelectorAll('input')).forEach(input => {
                fields[input.name] = input.value;
            });
            try {
                await fetchData(context, `${API_ENDPOINTS.API_KEY}/${keyType}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fields),
                });
                success(context, SUCCESS_MESSAGES.SETTINGS_UPDATED);
                log(context, `Settings updated for ${keyType}`);
            } catch (err) {
                error(context, ERROR_MESSAGES.FORM_SUBMISSION_FAILED);
                log(context, `Error updating settings: ${err.message}`);
            }
        });
        form._submitListenerAttached = true;
        log(context, 'Submit event listener attached to form');
    }
}

// Initialize the script with logging (no automatic loadApiKeys call)
withScriptLogging(context, () => {
    log(context, 'Module initialized');
});