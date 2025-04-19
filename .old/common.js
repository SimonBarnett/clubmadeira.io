// /static/js/common.js
// Purpose: Centralizes shared utilities for DOM manipulation, error handling, rendering, and initialization across the application.
import { log, error as loggerError } from './core/logger.js';
import { error as notificationsError } from './core/notifications.js';
import { authenticatedFetch } from './core/auth.js';
import { renderMarkdown } from './core/markdown.js';
import { ERROR_MESSAGES } from './config/constants.js';

// Function to wait for a DOM element to be available
// Used in: admin/affiliates.js, admin/users.js, admin/api-keys.js, admin/site-settings.js, partner/integrations.js, modules/site-request.js, community/categories-page.js
export async function waitForElement(elementId, maxAttempts = 10, retryDelay = 100) {
    let attempts = 0;
    while (attempts < maxAttempts) {
        const element = document.getElementById(elementId);
        if (element) {
            log(`waitForElement - Found element ${elementId} after ${attempts + 1} attempts`);
            return element;
        }
        log(`waitForElement - Element ${elementId} not found, retrying (${attempts + 1}/${maxAttempts})...`);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
    throw new Error(`Element ${elementId} not found after ${maxAttempts} attempts`);
}

// Function to handle errors consistently across the application
// Used in: admin/affiliates.js, admin/api-keys.js, admin/deals.js, admin/site-settings.js, admin/users.js,
//          merchant-page.js, modules/dataLoader.js, modules/navigation.js, modules/pageSetup.js,
//          modules/site-request.js, modules/userSettings.js, partner/integrations.js, partner-page.js, community/categories-page.js
export function handleError(context, error, message) {
    loggerError(`${context} - Error:`, error);
    notificationsError(message);
}

// Function to render settings fields for admin forms
// Used in: admin/affiliates.js, admin/api-keys.js, admin/site-settings.js
export function renderSettingsFields(setting, fieldsContainer, form, type, extraLinks = [], staticContent = {}) {
    fieldsContainer.innerHTML = '';
    form.innerHTML = '';
    form.dataset.keyType = setting.key_type;

    // Render static content (e.g., header, description)
    if (staticContent.header) {
        const header = document.createElement('div');
        header.innerHTML = staticContent.header;
        fieldsContainer.appendChild(header);
    }
    if (staticContent.description) {
        const desc = document.createElement('p');
        desc.className = `${type}-description`;
        desc.style.marginBottom = '15px';
        desc.textContent = staticContent.description;
        fieldsContainer.appendChild(desc);
    }

    // Render fields
    Object.entries(setting.fields).forEach(([name, value]) => {
        const div = document.createElement('div');
        div.className = `${type}-field`;
        div.innerHTML = `
            <label for="${name}">${name}:</label>
            <input type="text" id="${name}" name="${name}" value="${value}">
        `;
        form.appendChild(div);
    });

    // Add save button
    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.className = 'btn';
    saveButton.style.marginTop = '10px';
    saveButton.style.color = 'currentColor';
    saveButton.style.padding = '5px 10px';
    saveButton.innerHTML = `
        <i class="fas fa-save" style="margin-right: 5px;"></i>Save Settings
    `;
    form.appendChild(saveButton);

    // Add extra links to the header's links container or fieldsContainer
    if (extraLinks.length > 0) {
        const linksContainer = fieldsContainer.querySelector('#affiliate-header > div');
        if (linksContainer) {
            extraLinks.forEach(link => linksContainer.appendChild(link));
        } else {
            extraLinks.forEach(link => fieldsContainer.appendChild(link));
        }
    }
}

// Function to render markdown content into a container
// Used in: admin/affiliates.js, admin/api-keys.js, admin/site-settings.js
export async function renderMarkdownContent(url, containerId) {
    try {
        await renderMarkdown(url, containerId);
    } catch (error) {
        handleError('renderMarkdownContent', error, ERROR_MESSAGES.FETCH_FAILED(error.status));
        document.getElementById(containerId).innerHTML = `<p>Error rendering markdown: ${error.message}</p>`;
    }
}

// Function to create an icon element with specified classes, title, and styles
// Used in: modules/navigation.js
export function createIcon(classes, title = '', styles = {}) {
    const icon = document.createElement('i');
    icon.className = classes;
    icon.title = title;
    Object.assign(icon.style, styles);
    return icon;
}

// Function to toggle visibility of an element
// Used in: modules/navigation.js, admin/affiliates.js, admin/api-keys.js, admin/site-settings.js
export function toggleVisibility(element, isVisible) {
    if (element) {
        element.style.display = isVisible ? 'block' : 'none';
    }
}

// Function to initialize a page, ensuring DOM readiness
// Used in: merchant-page.js, modules/pageSetup.js, modules/userSettings.js, partner-page.js, admin-page.js
export function initializePage(pageType, callback) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
}

// Function to disable a button during async operations
// Used in: modules/site-request.js, community/categories-page.js
export async function withButtonDisabled(button, callback) {
    if (!button) return await callback();
    button.disabled = true;
    try {
        return await callback();
    } finally {
        button.disabled = false;
    }
}

// Function to submit a form with authenticatedFetch
// Used in: modules/userSettings.js, modules/site-request.js
export async function submitForm(formId, endpoint, method = 'POST', successMessage = 'Saved successfully') {
    let form;
    try {
        form = await waitForElement(formId);
    } catch (err) {
        handleError('submitForm', err, ERROR_MESSAGES.ELEMENT_NOT_FOUND);
        notificationsError(ERROR_MESSAGES.ELEMENT_NOT_FOUND);
        return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    try {
        const response = await authenticatedFetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.status === 'success') {
            notificationsSuccess(successMessage);
            return result;
        } else {
            throw new Error(result.message || 'Failed to submit form');
        }
    } catch (err) {
        handleError('submitForm', err, ERROR_MESSAGES.FETCH_FAILED(err.status));
        notificationsError(`Failed to submit form: ${err.message}`);
    }
}

// Global functions for legacy compatibility (replacing window assignments)
// Used in: admin/users.js, merchant-page.js, partner-page.js
export const globalFunctions = {
    // From admin/users.js
    loadUserDataManually: async (role) => {
        const { loadUserData } = await import('./admin/users.js');
        log(`loadUserDataManually - Triggered with role: ${role}`);
        await loadUserData(role);
    },

    // From merchant-page.js
    loadProducts: async () => {
        const { loadProducts } = await import('./merchant/products.js');
        await loadProducts();
    },
    createProductRow: async () => {
        const { createProductRow } = await import('./merchant/products.js');
        await createProductRow();
    },
    loadApiKeys: async () => {
        const { loadApiKeys } = await import('./merchant/api-keys.js');
        await loadApiKeys();
    },
    displayApiKeyFields: async () => {
        const { displayApiKeyFields } = await import('./merchant/api-keys.js');
        await displayApiKeyFields();
    },
    loadUserSettings: async () => {
        const { loadUserSettings } = await import('./merchant/user-settings.js');
        await loadUserSettings();
    },
    loadDocumentationMenu: async () => {
        const { loadDocumentationMenu } = await import('./merchant/documentation.js');
        await loadDocumentationMenu();
    },

    // From partner-page.js
    loadPartnerIntegrations: async () => {
        const { loadPartnerIntegrations } = await import('./partner/integrations.js');
        await loadPartnerIntegrations();
    },
};

// Assign global functions to window for legacy compatibility
Object.assign(window, globalFunctions);