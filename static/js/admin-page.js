// /static/js/admin-page.js
console.log('admin-page.js - Script loaded at:', new Date().toISOString());

// Initialize window.markdownCache
window.markdownCache = window.markdownCache || {};

import { authenticatedFetch } from './core/auth.js';
import { loadInitialData } from './admin/deals.js';
import { loadUserData, updatePermission, modifyPermissions } from './admin/users.js';
import { loadAffiliates, displayAffiliateFields } from './admin/affiliates.js';
import { loadSiteSettings, displaySiteSettingsFields } from './admin/site-settings.js';
import { loadApiKeys, displayApiKeyFields } from './admin/api-keys.js';

try {
    console.log('admin-page.js - Script execution started at:', new Date().toISOString());

    // Common error handler
    function handleError(fnName, error, toastrMessage) {
        console.error(`${fnName} - Error:`, error.message, error.stack);
        toastr.error(toastrMessage || `Error in ${fnName}: ${error.message}`);
    }

    // Common API fetch wrapper
    async function fetchData(endpoint, options = {}) {
        try {
            const response = await authenticatedFetch(`${window.apiUrl}${endpoint}`, {
                headers: { 'Content-Type': 'application/json' },
                ...options,
            });
            if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    // Common settings form submission
    async function submitSettingsForm(formId, endpoint, keyType, successMessage, reloadFn) {
        const form = document.getElementById(formId);
        if (!form) {
            console.warn(`submitSettingsForm - ${formId} not found`);
            return;
        }
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fields = {};
            Array.from(form.querySelectorAll('input')).forEach(input => {
                fields[input.name] = input.value;
            });
            try {
                await fetchData(`${endpoint}/${keyType}`, {
                    method: 'PATCH',
                    body: JSON.stringify(fields),
                });
                toastr.success(successMessage);
                if (reloadFn) reloadFn();
            } catch (error) {
                handleError('submitSettingsForm', error, `Failed to update ${keyType}`);
            }
        });
    }

    // Common settings UI renderer
    function renderSettingsFields(setting, fieldsContainer, form, type, extraLinks = []) {
        fieldsContainer.innerHTML = '';
        form.style.display = 'block';
        form.dataset.keyType = setting.key_type;

        const container = document.createElement('div');
        container.className = `${type}-settings`;
        fieldsContainer.appendChild(container);

        const heading = document.createElement('h3');
        heading.textContent = setting.comment || `${type} Settings`;
        heading.className = `${type}-comment-heading`;
        container.appendChild(heading);

        extraLinks.forEach(link => container.appendChild(link));

        const description = document.createElement('p');
        description.textContent = setting.description || '';
        description.className = `${type}-description`;
        container.appendChild(description);

        Object.entries(setting.fields).forEach(([name, value]) => {
            const div = document.createElement('div');
            div.className = `${type}-field`;
            div.innerHTML = `
                <label for="${name}">${name}:</label>
                <input type="text" id="${name}" name="${name}" value="${value}">
            `;
            container.appendChild(div);
        });
    }

    // Common markdown rendering
    async function renderMarkdown(readmePath, contentId, toggleLinks) {
        const contentContainer = document.getElementById(contentId);
        const { mdLink, keysLink, settingsContainer, form } = toggleLinks;
        try {
            if (!window.markdownCache) {
                window.markdownCache = {};
            }
            if (!window.markdownCache[readmePath]) {
                const response = await fetch(readmePath);
                if (!response.ok) throw new Error(`Failed to fetch markdown: ${response.status}`);
                const markdownText = await response.text();
                contentContainer.innerHTML = marked.parse(markdownText);
                window.markdownCache[readmePath] = contentContainer.innerHTML;
            } else {
                contentContainer.innerHTML = window.markdownCache[readmePath];
            }
            // Toggle visibility of dynamic content only
            form.style.display = 'block';
            settingsContainer.style.display = 'none';
            contentContainer.style.display = 'block';
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.style.display = 'none';
            }
            mdLink.style.display = 'none';
            keysLink.style.display = 'inline-block';
            // Ensure static content remains visible
            const staticContentContainer = form.parentElement.querySelector('#affiliate-static-content');
            if (staticContentContainer) {
                staticContentContainer.style.display = 'block';
            }
        } catch (error) {
            console.error(`renderMarkdown - Error rendering ${readmePath}:`, error.message, error.stack);
            contentContainer.innerHTML = `<p>Error rendering markdown: ${error.message}</p>`;
            handleError('renderMarkdown', error, 'Failed to render documentation');
            // Reset visibility on error
            form.style.display = 'block';
            settingsContainer.style.display = 'block';
            contentContainer.style.display = 'none';
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.style.display = 'block';
            }
            mdLink.style.display = 'inline-block';
            keysLink.style.display = 'none';
            // Ensure static content remains visible
            const staticContentContainer = form.parentElement.querySelector('#affiliate-static-content');
            if (staticContentContainer) {
                staticContentContainer.style.display = 'block';
            }
        }
    }

    // Initialize admin page
    window.initializeAdmin = async function (pageType) {
        console.log('initializeAdmin - Initializing admin page with type:', pageType);
        const initFunctions = [
            loadInitialData,
            () => loadUserData('admin'),
            // Removed loadAffiliates to prevent loading affiliate programs on initial setup
            loadSiteSettings,
            loadApiKeys,
            setupEventListeners,
        ];
        for (const fn of initFunctions) {
            try {
                await fn();
            } catch (error) {
                console.error(`initializeAdmin - Error in ${fn.name}:`, error.message, error.stack);
                handleError(fn.name, error);
            }
        }
    };

    // Setup event listeners
    function setupEventListeners() {
        console.log('setupEventListeners - Setting up admin event listeners');

        // Generic settings form
        const settingsForm = document.getElementById('settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const userId = document.getElementById('userId')?.value || '';
                const contactName = document.getElementById('contactName')?.value || '';
                const websiteUrl = document.getElementById('websiteUrl')?.value || '';
                const emailAddress = document.getElementById('emailAddress')?.value || '';
                try {
                    await fetchData('/settings/user', {
                        method: 'PATCH',
                        body: JSON.stringify({ contact_name: contactName, website_url: websiteUrl, email_address: emailAddress }),
                    });
                    toastr.success('Settings updated successfully');
                } catch (error) {
                    handleError('setupEventListeners', error, 'Failed to save settings');
                }
            });
        } else {
            console.warn('setupEventListeners - settings-form not found');
        }

        // Feature-specific form submissions
        submitSettingsForm('api-keys-form', '/settings/api_key', document.getElementById('api-keys-form')?.dataset.keyType, 'API key updated successfully', loadApiKeys);
        submitSettingsForm('affiliate-form', '/settings/affiliate_key', document.getElementById('affiliate-form')?.dataset.keyType, 'Affiliate settings updated successfully', loadAffiliates);
        submitSettingsForm('site-settings-form', '/settings/settings_key', document.getElementById('site-settings-form')?.dataset.keyType, 'Site settings updated successfully', loadSiteSettings);

        // User management events
        document.addEventListener('change', (e) => {
            if (e.target.matches('#user_list input[data-userid][data-permission]')) {
                const { userid, permission, role } = e.target.dataset;
                updatePermission(userid, permission, e.target.checked, role);
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.matches('#user_list .modify-permissions')) {
                const { userid, role } = e.target.dataset;
                modifyPermissions(userid, role);
            }
        });
    }

    // Set up sectionChange listener immediately
    console.log('admin-page.js - Setting up sectionChange listener at:', new Date().toISOString());
    let pendingSectionChanges = [];
    const handleSectionChange = async (e) => {
        const { section, role } = e.detail || {};
        console.log(`sectionChange - Section: ${section}, Role: ${role}, Timestamp:`, new Date().toISOString());
        try {
            if (section === 'user_management' && role) {
                console.log(`sectionChange - Calling loadUserData for role: ${role}`);
                if (typeof loadUserData !== 'function') {
                    console.warn('sectionChange - loadUserData not available, adding to pending events');
                    pendingSectionChanges.push({ section, role });
                    return;
                }
                await loadUserData(role);
                console.log(`sectionChange - loadUserData completed for role: ${role}`);
            } else if (section === 'affiliates') {
                console.log('sectionChange - Calling loadAffiliates');
                if (typeof loadAffiliates !== 'function') {
                    console.warn('sectionChange - loadAffiliates not available, adding to pending events');
                    pendingSectionChanges.push({ section, role });
                    return;
                }
                await loadAffiliates();
                console.log('sectionChange - loadAffiliates completed');
            } else if (section === 'site_settings') {
                console.log('sectionChange - Calling loadSiteSettings');
                if (typeof loadSiteSettings !== 'function') {
                    console.warn('sectionChange - loadSiteSettings not available, adding to pending events');
                    pendingSectionChanges.push({ section, role });
                    return;
                }
                await loadSiteSettings();
                console.log('sectionChange - loadSiteSettings completed');
            } else if (section === 'api_keys') {
                console.log('sectionChange - Calling loadApiKeys');
                if (typeof loadApiKeys !== 'function') {
                    console.warn('sectionChange - loadApiKeys not available, adding to pending events');
                    pendingSectionChanges.push({ section, role });
                    return;
                }
                await loadApiKeys();
                console.log('sectionChange - loadApiKeys completed');
            } else if (section === 'deals') {
                console.log('sectionChange - Calling loadInitialData');
                if (typeof loadInitialData !== 'function') {
                    console.warn('sectionChange - loadInitialData not available, adding to pending events');
                    pendingSectionChanges.push({ section, role });
                    return;
                }
                await loadInitialData();
                console.log('sectionChange - loadInitialData completed');
            } else {
                console.warn(`sectionChange - Unhandled section: ${section}`);
            }
        } catch (error) {
            console.error(`sectionChange - Error handling section ${section} with role ${role}:`, error.message, error.stack);
            handleError('sectionChange', error, `Failed to load section ${section}`);
        }
    };

    document.addEventListener('sectionChange', handleSectionChange);
    console.log('admin-page.js - sectionChange listener setup completed at:', new Date().toISOString());

    // Export common functions for features
    window.handleError = handleError;
    window.fetchData = fetchData;
    window.renderSettingsFields = renderSettingsFields;
    window.renderMarkdown = renderMarkdown;
    window.initializeAdmin = window.initializeAdmin;
    window.setupEventListeners = setupEventListeners;

    // Auto-initialize and handle pending events
    console.log('admin-page.js - Initializing admin at:', new Date().toISOString());
    const initialize = async () => {
        await window.initializeAdmin('admin');
        if (pendingSectionChanges.length > 0) {
            console.log('admin-page.js - Handling pending sectionChanges:', pendingSectionChanges);
            for (const pending of pendingSectionChanges) {
                const event = new CustomEvent('sectionChange', { detail: pending });
                document.dispatchEvent(event);
            }
            pendingSectionChanges = [];
        }
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log('admin-page.js - Document already loaded, initializing immediately');
        initialize();
    } else {
        console.log('admin-page.js - Waiting for DOMContentLoaded to initialize');
        document.addEventListener('DOMContentLoaded', () => {
            console.log('admin-page.js - DOMContentLoaded fired, initializing');
            initialize();
        });
    }

    console.log('admin-page.js - Script execution completed at:', new Date().toISOString());
} catch (error) {
    console.error('Error in admin-page.js:', error.message, error.stack);
    window.initializeAdmin = function () {
        console.error('initializeAdmin - Failed to initialize due to an error:', error.message);
    };
}