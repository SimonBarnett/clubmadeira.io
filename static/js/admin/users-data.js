// /static/js/admin/users-data.js
// Purpose: Manages user data fetching and permission updates for the admin interface.

import { authenticatedFetch } from '../core/auth.js';
import { log } from '../core/logger.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';

/**
 * Fetches user data for a specific role.
 * @param {string} context - The context or module name.
 * @param {string} [role='admin'] - The role to fetch users for.
 * @returns {Promise<{users: Array, role: string}>} The user data and role.
 */
export async function loadUsers(context, role = 'admin') {
  log(context, `Fetching users for role: ${role} at: ${new Date().toISOString()}`);
  return await withErrorHandling(`${context}:loadUsers`, async () => {
    const response = await authenticatedFetch(API_ENDPOINTS.USERS_ROLE(role));
    const data = await response.json();
    log(context, `Users fetched for role ${role}:`, data);

    if (data.status === 'error') {
      throw new Error(ERROR_MESSAGES.FETCH_FAILED('users'));
    }

    if (!data.users || data.users.length === 0) {
      log(context, `No users found for role ${role}`);
      return { users: [], role };
    }

    return { users: data.users, role };
  }, ERROR_MESSAGES.FETCH_FAILED('users'));
}

/**
 * Updates a user's permission.
 * @param {string} context - The context or module name.
 * @param {string} userId - The user ID.
 * @param {string} permission - The permission to update.
 * @param {boolean} isChecked - Whether to add or remove the permission.
 * @param {string} role - The user role.
 * @returns {Promise<{userId: string, permission: string, isChecked: boolean, role: string, message: string}>} The update result.
 */
export async function updateUserPermission(context, userId, permission, isChecked, role) {
  log(context, `Updating permission ${permission} for user ${userId} (role: ${role}): ${isChecked ? 'add' : 'remove'}`);
  const method = isChecked ? 'PATCH' : 'DELETE';
  return await withErrorHandling(`${context}:updateUserPermission`, async () => {
    const response = await authenticatedFetch(API_ENDPOINTS.PERMISSION, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, permission }),
    });
    const data = await response.json();
    return { userId, permission, isChecked, role, message: data.message || 'Permission updated' };
  }, ERROR_MESSAGES.FETCH_FAILED('permission update'));
}

/**
 * Fetches user data for modifying permissions.
 * @param {string} context - The context or module name.
 * @param {string} userId - The user ID.
 * @returns {Promise<Object>} The user data.
 */
export async function fetchUserForPermissions(context, userId) {
  log(context, `Fetching user data for ${userId}`);
  return await withErrorHandling(`${context}:fetchUserForPermissions`, async () => {
    const response = await authenticatedFetch(API_ENDPOINTS.USERS_USERID(userId));
    const userData = await response.json();
    return userData;
  }, ERROR_MESSAGES.FETCH_FAILED('user details'));
}

/**
 * Initializes the users data module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Users data instance with public methods.
 */
export function initializeUsersDataModule(registry) {
  const context = 'users-data.js';
  log(context, 'Initializing users data module for module registry');
  return {
    loadUsers: (ctx, ...args) => loadUsers(ctx, ...args),
    updateUserPermission: (ctx, ...args) => updateUserPermission(ctx, ...args),
    fetchUserForPermissions: (ctx, ...args) => fetchUserForPermissions(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'users-data.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});