// /static/js/admin/affiliates.js
import { log, warn } from '../core/logger.js';
import { fetchData } from '../utils/data-fetch.js';
import { createIcon } from '../utils/icons.js';
import { setupEventListeners } from '../utils/event-listeners.js';
import { toggleViewState, withElement } from '../utils/dom-manipulation.js';
import { error, success } from '../core/notifications.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { parsePageType, shouldInitializeForPageType } from '../utils/initialization.js';
import { createModuleInitializer } from '../utils/initialization.js';
import { renderMarkdown } from '../core/markdown.js'; // Added import for markdown rendering

const context = 'affiliates.js';

export async function loadAffiliates(context) {
    const pageType = await parsePageType(context, 'page', 'admin');
    if (pageType !== 'admin') {
        log(context, `Skipping initialization for non-admin page type: ${pageType}`);
        return;
    }
    log(context, 'Loading affiliate programs');
    await withErrorHandling(`${context}:loadAffiliates`, async () => {
        const data = await fetchData(context, API_ENDPOINTS.SETTINGS_AFFILIATE_KEY);
        log(context, `API response for ${API_ENDPOINTS.SETTINGS_AFFILIATE_KEY}:`, data);
        if (!data.settings || !Array.isArray(data.settings) || data.settings.length === 0) {
            warn(context, 'Invalid or empty affiliate programs data');
            error(context, 'No affiliate programs available');
            return;
        }
        await renderAffiliateIcons(context, data.settings);
        await renderAffiliateFields(context, data.settings[0]);
        toggleViewState(context, { affiliates: true });
    }, ERROR_MESSAGES.FETCH_FAILED('affiliate programs'));
}

async function renderAffiliateIcons(context, settings) {
    log(context, 'Rendering affiliate icons');
    await withElement(context, 'affiliate-icons', async (container) => {
        container.innerHTML = '';
        for (const [index, setting] of settings.entries()) {
            const iconClass = setting.icon || 'fas fa-link';
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
            icon.addEventListener('click', async () => {
                log(context, `Icon clicked for ${setting.key_type}`);
                container.querySelectorAll('.affiliate-icon').forEach(i => i.classList.remove('selected'));
                icon.classList.add('selected');
                await renderAffiliateFields(context, setting);
            });
            container.appendChild(icon);
        }
    });
}

async function renderAffiliateFields(context, setting) {
    log(context, `Rendering fields for affiliate: ${setting.key_type}`);
    const staticContainer = document.getElementById('affiliate-static-content');
    const formContainer = document.getElementById('affiliate-settings-container');
    const readmeContainer = document.getElementById('affiliate-readme-content');

    if (!staticContainer || !formContainer || !readmeContainer) {
        warn(context, 'Missing required DOM elements for affiliate details');
        error(context, 'Missing required DOM elements for affiliate details');
        return;
    }

    staticContainer.innerHTML = '';
    const header = document.createElement('div');
    header.id = 'affiliate-header';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.marginBottom = '15px';

    const icon = document.createElement('i');
    icon.className = `selected-affiliate-icon ${setting.icon || 'fas fa-link'}`;
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
    } else {
        log(context, 'No doc_link array found, skipping links rendering');
    }

    header.appendChild(linksContainer);
    staticContainer.appendChild(header);

    const descriptionText = setting._description || setting.description || 'Use this section to manage your affiliate program credentials.';
    const description = document.createElement('p');
    description.className = 'affiliate-description';
    description.style.marginBottom = '15px';
    description.textContent = descriptionText;
    staticContainer.appendChild(description);

    const readmeLinkObj = setting.doc_link ? setting.doc_link.find(link => link.title === 'readme') : null;
    if (readmeLinkObj) {
        const mdLinkElement = staticContainer.querySelector('.affiliate-readme-link');
        if (mdLinkElement) {
            const keysLinkElement = document.createElement('a');
            keysLinkElement.className = 'affiliate-keys-link';
            keysLinkElement.style.color = 'currentColor';
            keysLinkElement.innerHTML = '<i class="fas fa-key" style="font-size: 16px;"></i>';
            keysLinkElement.style.display = 'none';
            keysLinkElement.title = 'Back to Keys';
            linksContainer.appendChild(keysLinkElement);

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

            formContainer.style.display = 'block';
            readmeContainer.style.display = 'none';
        }
    }

    formContainer.innerHTML = '';
    const form = document.createElement('form');
    form.id = 'affiliate-form';
    form.dataset.keyType = setting.key_type;

    Object.entries(setting.fields || {}).forEach(([name, value]) => {
        const div = document.createElement('div');
        div.style.marginBottom = '10px';
        div.innerHTML = `
            <label for="${name}">${name}:</label>
            <input type="text" id="${name}" name="${name}" value="${value || ''}">
        `;
        form.appendChild(div);
    });

    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.className = 'save-button';
    const saveIcon = document.createElement('i');
    saveIcon.className = 'fas fa-save';
    saveButton.appendChild(saveIcon);
    saveButton.appendChild(document.createTextNode(' Save Affiliate'));
    form.appendChild(saveButton);

    formContainer.appendChild(form);
    setupAffiliateEvents(context);
}

function setupAffiliateEvents(context) {
    log(context, 'Setting up affiliate event listeners');
    setupEventListeners(context, [{
        eventType: 'submit',
        selector: '#affiliate-form',
        handler: async (event) => {
            event.preventDefault();
            const form = event.target;
            const keyType = form.dataset.keyType;
            const fields = {};
            Array.from(form.querySelectorAll('input')).forEach(input => {
                fields[input.name] = input.value;
            });
            try {
                await fetchData(context, `${API_ENDPOINTS.SETTINGS_AFFILIATE_KEY}/${keyType}`, {
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
        },
    }]);
}

export function initializeAffiliatesModule(registry) {
    return createModuleInitializer(context, {
        loadAffiliates,
    });
}

if (shouldInitializeForPageType('admin')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-admin page');
}