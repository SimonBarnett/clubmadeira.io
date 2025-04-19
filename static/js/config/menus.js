// /static/js/config/menus.js
import { log } from '../core/logger.js';
import { tokenManagerDecode } from '../core/auth.js';
import { withErrorHandling } from '../utils/error.js';
import { ROLES, ADMIN_MENU } from './roles.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Common menu items for authenticated roles.
 * @type {Array}
 */
export const COMMON_MENU = [
  {
    section: 'info',
    label: 'Info',
    icons: ['fas fa-info-circle'],
  },
  {
    section: 'my-account',
    label: 'My Account',
    icons: ['fas fa-user'],
  },
  {
    section: 'contact-details',
    label: 'Contact Details',
    icons: ['fas fa-address-book'],
  },
  {
    section: 'change-password',
    label: 'Change Password',
    icons: ['fas fa-key'],
  },
];

/**
 * Checks if the user has admin permission.
 * @param {string} context - The context or module name.
 * @returns {boolean} True if the user has admin permission, false otherwise.
 */
export function hasAdminPermission(context) {
  log(context, 'Checking admin permission');
  const decoded = tokenManagerDecode();
  const hasPermission = decoded && decoded.permissions && decoded.permissions.includes('admin');
  log(context, `Admin permission: ${hasPermission}`);
  return hasPermission;
}

/**
 * Retrieves the admin menu structure.
 * @param {string} context - The context or module name.
 * @returns {Array} The admin menu configuration.
 */
export function getAdminMenu(context) {
  log(context, 'Retrieving admin menu');
  return ADMIN_MENU;
}

/**
 * Retrieves the menu structure for a given role.
 * @param {string} context - The context or module name.
 * @param {string} role - The role (e.g., 'admin', 'merchant', 'community', 'partner', 'login').
 * @returns {Array} The menu configuration.
 */
export function getMenuForRole(context, role) {
  log(context, `Retrieving menu for role: ${role}`);
  if (role === 'login') {
    return []; // Inline nav used in login.html
  }
  const baseMenu = [...COMMON_MENU];
  if (role === 'admin') {
    return [...baseMenu, ...ADMIN_MENU];
  } else if (role === 'merchant') {
    return [
      ...baseMenu,
      { section: 'api_keys', label: 'API Keys', icons: ['fas fa-key'] },
      { section: 'products', label: 'Products', icons: ['fas fa-shopping-cart'] },
      { section: 'user_settings', label: 'User Settings', icons: ['fas fa-cog'] },
      { section: 'documentation', label: 'Documentation', icons: ['fas fa-book'] },
      { section: 'store-request', label: 'Store Request', icons: ['fas fa-store'] },
    ];
  } else if (role === 'community') {
    return [
      ...baseMenu,
      { section: 'categories', label: 'Categories', icons: ['fas fa-tags'] },
      { section: 'providers', label: 'Providers', icons: ['fas fa-plug'] },
      { section: 'referrals', label: 'Referrals', icons: ['fas fa-share-alt'] },
    ];
  } else if (role === 'partner') {
    return [
      ...baseMenu,
      { section: 'integrations', label: 'Integrations', icons: ['fas fa-plug'] },
    ];
  }
  return baseMenu;
}

/**
 * Initializes the menus module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Menus instance with public methods.
 */
export function initializeMenusModule(registry) {
  const context = 'menus.js';
  log(context, 'Initializing menus module for module registry');
  return {
    hasAdminPermission: ctx => hasAdminPermission(ctx),
    getAdminMenu: ctx => getAdminMenu(ctx),
    getMenuForRole: (ctx, role) => getMenuForRole(ctx, role),
  };
}

// Initialize module with lifecycle logging
const context = 'menus.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});