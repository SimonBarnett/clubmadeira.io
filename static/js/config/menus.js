// /static/js/config/menus.js
import { log } from '../core/logger.js';
import { withScriptLogging } from '../utils/initialization.js';
import { ROLES } from './roles.js';

log('menus.js', 'ROLES at import:', ROLES, 'ROLES.login:', ROLES.login);

// Define menu configurations for each role using string keys
export const MENUS = {
    'admin': [
        { id: 'users', label: 'Users', section: 'usersSection' },
        { id: 'deals', label: 'Deals', section: 'dealsSection' },
        { id: 'settings', label: 'Settings', section: 'settingsSection' },
        { id: 'my-account', label: 'My Account', section: 'my-account' },
        { id: 'contact-details', label: 'Contact Details', section: 'contact-details' },
        { id: 'change-password', label: 'Change Password', section: 'change-password' },
    ],
    'merchant': [
        { id: 'store-request', label: 'Store Request', section: 'storeRequestSection' },
        { id: 'api-keys', label: 'API Keys', section: 'apiKeysSection' },
        { id: 'products', label: 'Products', section: 'productsSection' },
        { id: 'documentation', label: 'Documentation', section: 'documentationSection' },
        { id: 'my-account', label: 'My Account', section: 'my-account' },
        { id: 'contact-details', label: 'Contact Details', section: 'contact-details' },
        { id: 'change-password', label: 'Change Password', section: 'change-password' },
    ],
    'community': [
        { id: 'site-request', label: 'Site Request', section: 'siteRequestSection' },
        { id: 'categories', label: 'Categories', section: 'categoriesSection' },
        { id: 'providers', label: 'Providers', section: 'providersSection' },
        { id: 'referrals', label: 'Referrals', section: 'referralsSection' },
        { id: 'my-account', label: 'My Account', section: 'my-account' },
        { id: 'contact-details', label: 'Contact Details', section: 'contact-details' },
        { id: 'change-password', label: 'Change Password', section: 'change-password' },
    ],
    'partner': [
        { id: 'integrations', label: 'Integrations', section: 'integrationsSection' },
        { id: 'my-account', label: 'My Account', section: 'my-account' },
        { id: 'contact-details', label: 'Contact Details', section: 'contact-details' },
        { id: 'change-password', label: 'Change Password', section: 'change-password' },
    ],
    'login': [
        { id: 'forgot-password', label: 'Forgot Password', section: 'forgotPasswordContainer', icon: 'fas fa-lock' },
        { id: 'signup', label: 'Sign Up', section: 'signupContainer', icon: 'fas fa-user-plus' },
    ],
};

/**
 * Retrieves the menu configuration for a given role.
 * @param {string} role - The role for which to retrieve the menu.
 * @returns {Array} The menu configuration for the role, or an empty array if not found.
 */
export function getMenu(role) {
    log(`menus.js - Retrieving menu for role: ${role}`);
    const menu = MENUS[role] || [];
    if (!menu.length) {
        log(`menus.js - No menu found for role: ${role}`);
    }
    return menu;
}

/**
 * Initializes the menus module for use with the module registry.
 * @param {Map} registry - The module registry instance.
 * @returns {Object} Module instance with public methods.
 */
export function initializeMenusModule(registry) {
    const context = 'menus.js';
    log(context, 'Initializing menus module for module registry');
    return {
        getMenu: (role) => getMenu(role),
    };
}

// Initialize the module with lifecycle logging
const context = 'menus.js';
withScriptLogging(context, () => {
    log(context, 'Module initialized');
});