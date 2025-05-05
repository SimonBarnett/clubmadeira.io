// /static/js/admin/users-data.js
import { authenticatedFetch } from '../core/auth.js';
import { log } from '../core/logger.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { parsePageType, shouldInitializeForPageType } from '../utils/initialization.js';

const context = 'users-data.js';

export async function loadUsers(context, role = 'admin') {
    const pageType = parsePageType(context, 'page', 'admin');
    if (pageType !== 'admin') {
        log(context, `Skipping initialization for non-admin page type: ${pageType}`);
        return { users: [], role };
    }
    log(context, `Fetching users for role: ${role}`);
    return await withErrorHandling(`${context}:loadUsers`, async () => {
        const endpoint = API_ENDPOINTS.USERS_ROLE(role);
        const response = await authenticatedFetch(endpoint);
        const data = await response.json();
        if (data.status === 'error') {
            throw new Error(data.message || ERROR_MESSAGES.FETCH_FAILED(`users for role ${role}`));
        }
        return { users: data.users || [], role };
    }, ERROR_MESSAGES.FETCH_FAILED(`users for role ${role}`));
}

export async function updateUserPermission(context, userId, permission, isChecked, role) {
    const pageType = parsePageType(context, 'page', 'admin');
    if (pageType !== 'admin') {
        log(context, `Skipping initialization for non-admin page type: ${pageType}`);
        return { userId, permission, isChecked, role, message: 'Skipped due to page type' };
    }
    log(context, `Updating permission ${permission} for user ${userId}`);
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

export async function fetchUserForPermissions(context, userId) {
    const pageType = parsePageType(context, 'page', 'admin');
    if (pageType !== 'admin') {
        log(context, `Skipping initialization for non-admin page type: ${pageType}`);
        return {};
    }
    log(context, `Fetching user data for ${userId}`);
    return await withErrorHandling(`${context}:fetchUserForPermissions`, async () => {
        const response = await authenticatedFetch(API_ENDPOINTS.USERS_USERID(userId));
        const userData = await response.json();
        if (userData.status === 'error') {
            throw new Error(userData.message || ERROR_MESSAGES.FETCH_FAILED('user details'));
        }
        return userData;
    }, ERROR_MESSAGES.FETCH_FAILED('user details'));
}

export function initializeUsersDataModule(registry) {
    log(context, 'Initializing users data module for module registry');
    return {
        loadUsers: (ctx, ...args) => loadUsers(ctx, ...args),
        updateUserPermission: (ctx, ...args) => updateUserPermission(ctx, ...args),
        fetchUserForPermissions: (ctx, ...args) => fetchUserForPermissions(ctx, ...args),
    };
}

if (shouldInitializeForPageType('admin')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-admin page');
}