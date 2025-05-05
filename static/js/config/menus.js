// /static/js/config/menus.js
// Purpose: Defines menu configurations for each role with nested submenus and provides utilities for dynamic menu generation.

import { log, warn } from '../core/logger.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { authenticatedFetch, getAuthToken, setAuthToken, removeAuthToken } from '../core/auth.js';
import { error as notifyError } from '../core/notifications.js';
import { resetNavigation } from '../modules/navigation.js';

const context = 'menus.js';

// Define menu configurations for each role
export const MENUS = {
    'admin': [
        {
            section: 'user_management',
            label: 'User Management',
            icons: ['icon-admin']
        },
        { section: 'affiliates', label: 'Affiliate Programs', icons: ['icon-amazon-uk'] },
        { section: 'site_settings', label: 'Site Settings', icons: ['fas fa-cog'] },
        {
            section: 'logsIntro',
            label: 'Logs',
            icons: ['fas fa-chart-bar'],
            submenu: [
                { section: 'logs', label: 'Login Events', icons: ['fas fa-sign-in-alt'], type: 'login' },
                { section: 'logs', label: 'Signup Events', icons: ['fas fa-user-plus'], type: 'signup' },
                { section: 'logs', label: 'Click Events', icons: ['fas fa-mouse-pointer'], type: 'click' },
                { section: 'logs', label: 'Order Events', icons: ['fas fa-shopping-cart'], type: 'order' }
            ]
        },
        {
            section: 'testScriptsIntro',
            label: 'Test Scripts',
            icons: ['fas fa-vial'],
            submenu: [
                { section: 'test_partner', label: 'Test Partner', icons: ['icon-partner', 'fas fa-vial'] },
                { section: 'test_merchant', label: 'Test Merchant', icons: ['icon-merchant', 'fas fa-vial'] },
                { section: 'test_community', label: 'Test Community', icons: ['icon-community', 'fas fa-vial'] },
                {
                    section: 'referralTestsIntro',
                    label: 'Referral Tests',
                    icons: ['fas fa-cog', 'fas fa-vial'],
                    submenu: [
                        { section: 'page_visit_test', label: 'Page Visit Test', icons: ['fas fa-eye', 'fas fa-vial'] },
                        { section: 'order_test', label: 'Order Test', icons: ['fas fa-shopping-cart', 'fas fa-vial'] }
                    ]
                }
            ]
        }
    ],
    'merchant': [
        { section: 'create-store', label: 'Create Store', icons: ['fas fa-store'] },
        { section: 'my-products', label: 'My Products', icons: ['fas fa-box-open'] },
        { section: 'api-keys', label: 'API Keys', icons: ['fas fa-key'] }
    ],
    'community': [
        { section: 'categories', label: 'Categories', icons: ['fas fa-list'] },
        { section: 'my_website_intro_section', label: 'Link My Website', icons: ['fas fa-link'] },
        { section: 'no_website', label: 'Create Website', icons: ['fas fa-globe'] },
        {
            section: 'referrals_intro',
            label: 'Referrals',
            icons: ['fas fa-user-friends'],
            submenu: [
                { section: 'visits', label: 'Visits', icons: ['fas fa-eye'] },
                { section: 'orders', label: 'Orders', icons: ['fas fa-shopping-cart'] }
            ]
        }
    ],
    'partner': [
        { section: 'referrals', label: 'Referrals', icons: ['fas fa-link'] },
        { section: 'settings', label: 'Settings', icons: ['fas fa-cog'] }
    ],
    'login': [
        {
            section: 'signupContainer',
            label: 'Sign Up',
            icons: ['fas fa-user-plus']
        },
        {
            section: 'forgotPasswordContainer',
            label: 'Forgot Password',
            icons: ['fas fa-lock']
        }
    ],
    'default': [
        {
            section: 'info',
            label: 'Login',
            icons: ['fas fa-sign-in-alt']
        }
    ]
};

/**
 * Checks if the user has admin permission based on the auth token.
 * @returns {boolean} True if the user has admin permission, false otherwise.
 */
export function hasAdminPermission() {
    const token = getAuthToken();
    if (!token) {
        log(context, 'No auth token found, assuming no admin permission');
        return false;
    }
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const hasPermission = payload && payload.permissions && payload.permissions.includes('admin');
        log(context, `Checking admin permission: ${hasPermission}`);
        return hasPermission;
    } catch (err) {
        warn(context, `Error decoding token: ${err.message}`);
        return false;
    }
}

/**
 * Performs a role switch by calling the /set-role endpoint.
 * @param {string} role - The role to switch to.
 * @returns {Promise<void>}
 */
async function switchRole(role) {
    log(context, `Switching to role: ${role}`);
    window.showLoadingOverlay?.();
    try {
        const response = await authenticatedFetch('/set-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role })
        });
        if (!response.ok) {
            throw new Error(`Failed to set role: ${response.status}`);
        }
        const data = await response.json();
        log(context, `Successfully set x-role to ${role}, response:`, data);

        if (data.token) {
            setAuthToken(data.token);
            log(context, `Updated token with new x-role: ${role}`);
        } else {
            warn(context, 'No token returned in set-role response');
        }

        window.location.href = '/';
    } catch (err) {
        warn(context, `Error setting role to ${role}: ${err.message}`);
        notifyError(context, `Failed to switch to ${role} role`);
        window.hideLoadingOverlay?.();
    }
}

/**
 * Handles logoff by clearing the token and redirecting to /logoff.
 * @returns {Promise<void>}
 */
async function handleLogoff() {
    log(context, 'Logoff button clicked');
    try {
        const confirmed = confirm('Are you sure you want to log out?');
        if (confirmed) {
            window.showLoadingOverlay?.();
            log(context, 'Showing loading overlay during logoff');
            removeAuthToken();
            resetNavigation(context);
            window.location.href = '/logoff';
            log(context, 'Redirected to /logoff');
        } else {
            log(context, 'Logoff cancelled by user');
        }
    } catch (err) {
        warn(context, `Error during logoff: ${err.message}`);
        notifyError(context, 'Failed to log out');
        window.hideLoadingOverlay?.();
    }
}

/**
 * Recursively attaches actions to menu items based on their section.
 * @param {Array} menu - The menu array to process.
 * @param {string} role - The role for which the menu is being generated.
 * @returns {Array} The menu with actions attached where applicable.
 */
function addActionsToMenu(menu, role) {
    return menu.map(item => {
        let newItem = { ...item };
        if (role !== 'login') {
            if (newItem.section === 'test_partner') {
                newItem.action = () => switchRole('partner');
            } else if (newItem.section === 'test_merchant') {
                newItem.action = () => switchRole('merchant');
            } else if (newItem.section === 'test_community') {
                newItem.action = () => switchRole('community');
            }
        } else {
            newItem.action = undefined;
        }
        if (newItem.submenu) {
            newItem.submenu = addActionsToMenu(newItem.submenu, role);
        }
        return newItem;
    });
}

/**
 * Retrieves the menu configuration for a given role, adding dynamic buttons and actions.
 * @param {string} role - The role for which to retrieve the menu.
 * @returns {Array} The menu configuration for the role.
 */
export function getMenu(role) {
    log(context, `Retrieving menu for role: ${role}`);
    let baseMenu = MENUS[role] || MENUS['default'];
    if (!baseMenu || !Array.isArray(baseMenu)) {
        warn(context, `No valid menu found for role: ${role}, using default`);
        baseMenu = MENUS['default'];
    }

    // Attach actions to menu items recursively
    const menuWithActions = addActionsToMenu(baseMenu, role);

    const additionalButtons = [];

    // Add "My Account" button with submenu for all roles except 'login'
    if (role !== 'login') {
        additionalButtons.push({
            section: 'my-account',
            label: 'My Account',
            icons: ['fas fa-user'],
            submenu: [
                { section: 'contact-details', label: 'Contact Details', icons: ['fas fa-address-card'] },
                { section: 'change-password', label: 'Change Password', icons: ['fas fa-key'] }
            ]
        });
    }

    // Determine page type for "Back to Admin" button logic
    let pageType = document.body.getAttribute('data-page-type') || document.body.dataset.pageType;
    if (role === 'login') {
        pageType = 'login'; // Force pageType to 'login' for login role
        log(context, 'Forcing pageType to "login" for login role');
    } else if (!pageType) {
        const token = getAuthToken();
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                pageType = payload['x-role'] || 'unknown';
            } catch (err) {
                warn(context, `Error decoding token for page type: ${err.message}`);
                pageType = 'unknown';
            }
        } else {
            pageType = 'unknown';
        }
    }
    log(context, `Page type determined: ${pageType}, hasAdminPermission: ${hasAdminPermission()}`);

    // Add "Back to Admin" button if user has admin permission and page_type is not 'admin' or 'login'
    const shouldAddBackToAdmin = hasAdminPermission() && pageType.toLowerCase() !== 'admin' && pageType.toLowerCase() !== 'login';
    log(context, `Should add Back to Admin button: ${shouldAddBackToAdmin}`);
    if (shouldAddBackToAdmin) {
        log(context, 'Adding Back to Admin button');
        additionalButtons.push({
            section: 'back-to-admin',
            label: 'Back to Admin',
            icons: ['icon-admin'],
            action: () => switchRole('admin')
        });
    } else {
        log(context, 'Back to Admin button not added');
    }

    // Add "Logoff" button for all roles except 'login'
    if (role !== 'login') {
        additionalButtons.push({
            label: 'Logoff',
            icons: ['fas fa-sign-out-alt'],
            action: handleLogoff
        });
    }

    const finalMenu = [...menuWithActions, ...additionalButtons];
    log(context, `Final menu for role ${role}:`, finalMenu.map(item => item.label));

    // Validate login menu
    if (role === 'login') {
        const requiredSections = ['signupContainer', 'forgotPasswordContainer'];
        const hasRequired = requiredSections.every(section => 
            finalMenu.some(item => item.section === section)
        );
        if (!hasRequired) {
            warn(context, 'Login menu missing required sections, using default login menu');
            return [
                {
                    section: 'signupContainer',
                    label: 'Sign Up',
                    icons: ['fas fa-user-plus']
                },
                {
                    section: 'forgotPasswordContainer',
                    label: 'Forgot Password',
                    icons: ['fas fa-lock']
                }
            ];
        }
    }

    return finalMenu;
}

/**
 * Initializes the menus module for use with the module registry.
 * @param {Map} registry - The module registry instance.
 * @returns {Object} Module instance with public methods.
 */
export function initializeMenusModule(registry) {
    log(context, 'Initializing menus module for module registry');
    return {
        getMenu: (role) => getMenu(role)
    };
}

// Initialize the module with lifecycle logging
withScriptLogging(context, () => {
    log(context, 'Module initialized');
    // Debug: Retrieve and log the login menu during initialization
    const loginMenu = getMenu('login');
    log(context, 'Login menu during initialization:', loginMenu.map(item => item.label));
    if (!loginMenu.some(item => item.section === 'signupContainer') || 
        !loginMenu.some(item => item.section === 'forgotPasswordContainer')) {
        warn(context, 'Sign Up or Forgot Password missing in login menu');
    }
});