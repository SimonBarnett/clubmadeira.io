// /static/js/config/roles.js
// Purpose: Centralizes role definitions, permissions, and menu structures for consistent use across the application.

import { log } from '../core/logger.js';
import { setAuthToken } from '../core/auth.js'; // Use setAuthToken from core/auth.js
import { authenticatedFetch } from '../core/auth.js'; // authenticatedFetch is in utils/auth.js
import { withErrorHandling } from '../utils/error.js';
import { withScriptLogging } from '../utils/logging-utils.js';

const context = 'roles.js';

/**
 * Role definitions with associated permissions.
 * @type {Object.<string, {permissions: string[], label: string}>}
 */
export const ROLES = {
    admin: {
        permissions: ['admin', 'validated', 'debug'],
        label: 'Admin',
    },
    partner: {
        permissions: ['partner', 'validated', 'verified'],
        label: 'Partner',
    },
    community: {
        permissions: ['community', 'validated'],
        label: 'Community',
    },
    merchant: {
        permissions: ['merchant', 'validated', 'verified'],
        label: 'Merchant',
    },
    login: { // Added login role to match config/menus.js
        permissions: [],
        label: 'Login',
    },
};

/**
 * Menu structure for admin role.
 * @type {Array}
 */
export const ADMIN_MENU = [
    {
        section: 'userManagementIntro',
        label: 'User Management',
        icons: ['fas fa-users'],
        submenu: [
            { section: 'user_management', label: 'Admin', icons: ['icon-admin'], role: 'admin' },
            { section: 'user_management', label: 'Partners', icons: ['icon-partner'], role: 'partner' },
            { section: 'user_management', label: 'Communities', icons: ['icon-community'], role: 'community' },
            { section: 'user_management', label: 'Merchants', icons: ['icon-merchant'], role: 'merchant' },
        ],
    },
    { section: 'affiliates', label: 'Affiliate Programs', icons: ['fas fa-link'] },
    { section: 'site_settings', label: 'Site Settings', icons: ['fas fa-cog'] },
    {
        section: 'testScriptsIntro',
        label: 'Test Scripts',
        icons: ['fas fa-vial'],
        submenu: [
            {
                section: 'test_partner',
                label: 'Test Partner',
                icons: ['icon-partner', 'fas fa-vial'],
                action: async context => {
                    log(context, 'Test Partner button clicked, showing overlay and calling /set-role');
                    window.showLoadingOverlay?.();
                    await withErrorHandling(`${context}:testPartnerAction`, async () => {
                        const response = await authenticatedFetch('/set-role', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ role: 'partner' }),
                        });
                        if (!response.ok) {
                            throw new Error(`Failed to set role: ${response.status}`);
                        }
                        const data = await response.json();
                        log(context, 'Successfully set x-role to partner, response:', data);

                        if (data.token) {
                            setAuthToken(data.token); // Replaced tokenManagerSetToken with setAuthToken
                            log(context, 'Updated token with new x-role: partner');
                        }
                    }, 'Failed to set partner role');
                },
            },
        ],
    },
];

/**
 * Fetches the user's role from the server.
 * @returns {Promise<string>} The user's role.
 */
export async function fetchUserRole() {
    log(context, 'Fetching user role');
    try {
        const response = await authenticatedFetch('/api/user/role');
        const data = await response.json();
        return data.role || ROLES.LOGIN;
    } catch (error) {
        log(context, `Error fetching user role: ${error.message}`);
        return ROLES.LOGIN; // Default to login role if fetching fails
    }
}

/**
 * Initializes the roles module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Roles instance with public definitions.
 */
export function initializeRolesModule(registry) {
    log(context, 'Initializing roles module for module registry');
    return {
        ROLES,
        ADMIN_MENU,
        fetchUserRole,
    };
}

// Initialize module with lifecycle logging
withScriptLogging(context, () => {
    log(context, 'Module initialized');
});