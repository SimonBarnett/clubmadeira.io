// userSettings.js
import { log as loggerLog, error as loggerError, warn as loggerWarn } from '../core/logger.js';
import { success as notificationsSuccess, error as notificationsError } from '../core/notifications.js';
import { authenticatedFetch } from '../core/auth.js';

let settings = null;

/**
 * Loads user settings from the API and populates the form.
 * @param {string} role - The role of the user (used for logging).
 * @returns {Promise<Object>} The settings object.
 */
export async function load(role) {
    loggerLog(`userSettingsLoad - Fetching settings for ${role}`);
    if (settings) {
        loggerLog(`userSettingsLoad - Using cached settings`);
        updateDOM(role);
        return settings;
    }

    try {
        const response = await authenticatedFetch(`${window.apiUrl}/settings/user`);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        if (!data || !data.settings) {
            throw new Error('No settings returned');
        }
        settings = data.settings;
        loggerLog(`userSettingsLoad - Settings loaded:`, settings);
        updateDOM(role);
        return settings;
    } catch (error) {
        loggerError(`userSettingsLoad - Error for ${role}:`, error);
        // Fallback to an empty object instead of hardcoded defaults for flexibility
        settings = {};
        updateDOM(role);
        notificationsError('Failed to load user settings, using defaults');
        return settings;
    }
}

/**
 * Saves the contact details form data to the API using PATCH method.
 * Collects all fields dynamically from the form.
 */
export async function save() {
    loggerLog('userSettingsSave - Starting');
    const contactDetailsForm = document.getElementById('contactDetailsForm');
    if (!contactDetailsForm) {
        loggerWarn('userSettingsSave - Contact details form not found');
        notificationsError('Contact details form not found');
        return;
    }

    const formData = new FormData(contactDetailsForm);
    const updatedSettings = {};
    formData.forEach((value, key) => {
        updatedSettings[key] = value;
    });

    try {
        const response = await authenticatedFetch('https://clubmadeira.io/settings/user', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedSettings)
        });
        const data = await response.json();
        if (data.status === 'success') {
            settings = { ...settings, ...updatedSettings };
            loggerLog('userSettingsSave - Settings saved:', updatedSettings);
            notificationsSuccess('Settings updated successfully');
            updateDOM('unknown');
        } else {
            throw new Error('Failed to save settings');
        }
    } catch (error) {
        loggerError('userSettingsSave - Error:', error);
        notificationsError('Failed to save settings');
    }
}

/**
 * Updates the password using the API.
 */
export async function updatePassword() {
    loggerLog('userSettingsUpdatePassword - Starting');
    const myAccountForm = document.getElementById('myAccountForm');
    if (!myAccountForm) {
        loggerWarn('userSettingsUpdatePassword - Password form not found');
        notificationsError('Password form not found');
        return;
    }

    const formData = new FormData(myAccountForm);
    const passwordData = {
        current_password: formData.get('current_password'),
        new_password: formData.get('new_password')
    };

    // Basic validation
    if (!passwordData.current_password || !passwordData.new_password) {
        loggerWarn('userSettingsUpdatePassword - Missing required fields');
        notificationsError('Current and new password are required');
        return;
    }

    try {
        const response = await authenticatedFetch('https://clubmadeira.io/update-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(passwordData)
        });
        const data = await response.json();
        if (data.status === 'success') {
            loggerLog('userSettingsUpdatePassword - Password updated successfully');
            notificationsSuccess('Password updated successfully');
            myAccountForm.reset(); // Clear the form
        } else {
            throw new Error('Failed to update password');
        }
    } catch (error) {
        loggerError('userSettingsUpdatePassword - Error:', error);
        notificationsError('Failed to update password');
    }
}

/**
 * Updates the DOM with settings data, dynamically populating fields based on their IDs.
 * @param {string} role - The role of the user (used for logging).
 */
export function updateDOM(role) {
    loggerLog(`userSettingsUpdateDOM - Updating DOM for ${role}`);
    const contactDetailsForm = document.getElementById('contactDetailsForm');
    if (contactDetailsForm && settings) {
        const formElements = contactDetailsForm.elements;
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (element.id && settings.hasOwnProperty(element.id) && element.id !== 'password') {
                element.value = settings[element.id] || '';
                loggerLog(`userSettingsUpdateDOM - Set ${element.id}: ${settings[element.id]}`);
            }
        }
    } else {
        loggerWarn('userSettingsUpdateDOM - Form or settings missing');
    }

    // Preserve original behavior for user-contact-name element
    const contactName = document.getElementById('user-contact-name');
    if (contactName && settings?.contact_name) {
        contactName.textContent = settings.contact_name;
        loggerLog(`userSettingsUpdateDOM - Set contact name: ${settings.contact_name}`);
    } else if (!contactName) {
        loggerWarn(`userSettingsUpdateDOM - Contact name element missing`);
    }
}

/**
 * Clears the cached settings.
 */
export function clear() {
    settings = null;
    loggerLog('userSettingsClear - Settings cleared');
}

/**
 * Sets up event listeners for section changes and form submission.
 */
export function setupEventListeners() {
    loggerLog('userSettingsSetupEventListeners - Adding settings-related listeners');

    // Load settings when the contact-details section is displayed
    document.addEventListener('sectionChange', function(event) {
        const { section } = event.detail || {};
        if (section === 'contact-details') {
            load('unknown'); // Trigger loading and populating settings
        }
    });

    // Handle contact details form submission
    const contactDetailsForm = document.getElementById('contactDetailsForm');
    if (contactDetailsForm) {
        contactDetailsForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            await save();
        });
        loggerLog('userSettingsSetupEventListeners - Added contact details form submit listener');
    } else {
        loggerWarn('userSettingsSetupEventListeners - Contact details form not found');
    }

    // Handle password form submission
    const myAccountForm = document.getElementById('myAccountForm');
    if (myAccountForm) {
        myAccountForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            await updatePassword();
        });
        loggerLog('userSettingsSetupEventListeners - Added password form submit listener');
    } else {
        loggerWarn('userSettingsSetupEventListeners - Password form not found');
    }
}

// Initialize the module
if (!window.userSettingsInitialized) {
    window.userSettingsInitialized = true;
    setupEventListeners(); // Call directly instead of waiting for DOMContentLoaded
    loggerLog('userSettings.js - UserSettings module initialized');
}