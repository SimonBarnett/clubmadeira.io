// /static/js/admin/site-settings.js
import { log, warn } from '../core/logger.js';
import { fetchData } from '../utils/data-fetch.js';
import { withElement } from '../utils/dom-manipulation.js';
import { error, success } from '../core/notifications.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { parsePageType, shouldInitializeForPageType } from '../utils/initialization.js';

const context = 'admin/site-settings.js';
let isSubmitting = false;

export async function loadSiteSettings(context) {
    const pageType = await parsePageType(context, 'page', 'admin');
    if (pageType !== 'admin') {
        log(context, `Skipping initialization for non-admin page type: ${pageType}`);
        return;
    }
    log(context, 'Loading site settings');
    await withErrorHandling(`${context}:loadSiteSettings`, async () => {
        await withElement(context, 'site-settings-icons', async (iconsContainer) => {
            const data = await fetchData(context, API_ENDPOINTS.SETTINGS_KEY, { method: 'GET' });
            log(context, `API response for ${API_ENDPOINTS.SETTINGS_KEY}:`, data);
            if (!data.settings || !Array.isArray(data.settings) || data.settings.length === 0) {
                iconsContainer.innerHTML = '<p>No site settings available.</p>';
                error(context, 'No site settings available');
                return;
            }
            iconsContainer.innerHTML = '';
            data.settings.forEach((setting, index) => {
                const safeKeyType = setting.key_type.replace(/[^a-zA-Z0-9-_]/g, '-');
                const iconContainer = document.createElement('span');
                iconContainer.style.width = '24px';
                iconContainer.style.height = '24px';
                iconContainer.style.display = 'inline-flex';
                iconContainer.style.justifyContent = 'center';
                iconContainer.style.alignItems = 'center';
                iconContainer.style.cursor = 'pointer';
                iconContainer.dataset.index = index;
                const icon = document.createElement('i');
                const iconClasses = (setting.icon || 'fas fa-cog').split(' ');
                iconClasses.forEach(cls => icon.classList.add(cls));
                icon.classList.add('site-settings-icon', `icon-${safeKeyType}`);
                icon.style.fontSize = '24px';
                iconContainer.appendChild(icon);
                iconsContainer.appendChild(iconContainer);
                iconContainer.addEventListener('click', (event) => {
                    event.stopPropagation();
                    iconsContainer.querySelectorAll('.site-settings-icon').forEach(i => i.classList.remove('selected'));
                    icon.classList.add('selected');
                    displaySiteSettingsFields(context, setting);
                });
            });
            const allIcons = iconsContainer.querySelectorAll('.site-settings-icon');
            if (allIcons.length > 0) {
                allIcons[0].classList.add('selected');
                await displaySiteSettingsFields(context, data.settings[0]);
            }
        });
    }, ERROR_MESSAGES.FETCH_FAILED('site settings'));
}

export async function displaySiteSettingsFields(context, setting) {
    log(context, `Rendering fields for site setting with key_type: ${setting.key_type}`);
    const form = document.getElementById('site-settings-form');
    const fieldsContainer = document.getElementById('site-settings-fields');
    if (!form || !fieldsContainer) {
        warn(context, 'Missing required DOM elements for site settings details');
        error(context, 'Missing required DOM elements for site settings details');
        return;
    }
    fieldsContainer.innerHTML = '';
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.marginBottom = '15px';
    const icon = document.createElement('i');
    const iconClasses = (setting.icon || 'fas fa-cog').split(' ');
    iconClasses.forEach(cls => icon.classList.add(cls));
    icon.classList.add('selected-setting-icon');
    icon.style.fontSize = '16px';
    icon.style.color = 'currentColor';
    icon.style.marginRight = '10px';
    header.appendChild(icon);
    const title = document.createElement('h3');
    title.className = 'site-settings-comment-heading';
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
        setting.doc_link.forEach((doc) => {
            const linkElement = document.createElement('a');
            linkElement.className = `site-settings-${doc.title}-link`;
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
    fieldsContainer.appendChild(header);
    const descriptionText = setting._description || setting.description || 'Use this section to manage your site settings.';
    const description = document.createElement('p');
    description.className = 'site-settings-description';
    description.style.marginBottom = '15px';
    description.textContent = descriptionText;
    fieldsContainer.appendChild(description);
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
    form.style.display = 'block';
}

async function handleFormSubmit(event) {
    if (isSubmitting) return;
    isSubmitting = true;
    event.preventDefault();
    const form = document.getElementById('site-settings-form');
    const keyType = form.dataset.keyType;
    log(context, `Form submission - keyType: ${keyType}`);
    if (!keyType) {
        warn(context, 'No keyType set for form submission');
        error(context, 'Failed to update settings: No keyType specified');
        isSubmitting = false;
        return;
    }
    const fields = {};
    Array.from(form.querySelectorAll('input')).forEach((input) => {
        fields[input.name] = input.value;
    });
    try {
        await fetchData(context, `${API_ENDPOINTS.SETTINGS_KEY}/${keyType}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fields),
        });
        success(context, SUCCESS_MESSAGES.SETTINGS_UPDATED);
        log(context, `Settings updated for ${keyType}`);
    } catch (err) {
        error(context, ERROR_MESSAGES.FORM_SUBMISSION_FAILED);
        log(context, `Error updating settings: ${err.message}`);
    } finally {
        isSubmitting = false;
    }
}

if (shouldInitializeForPageType('admin')) {
    const form = document.getElementById('site-settings-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    } else {
        warn(context, 'Form element not found');
    }
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-admin page');
}