// /static/js/core/auth.js
// Purpose: Manages authentication tokens, authenticated requests, and user authentication checks.

import { log } from './logger.js';
import { setCookie, getCookie, removeCookie } from './cookies.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { API_ENDPOINTS } from '../config/endpoints.js';

const context = 'auth.js';

/**
 * Decodes the payload from a JWT token.
 * @param {string} token - The JWT token.
 * @returns {Object|null} The decoded payload or null if invalid.
 */
function decodeToken(token) {
    log(context, 'Decoding JWT token');
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
    } catch (e) {
        log(context, `Token decoding failed: ${e.message}`);
        return null;
    }
}

/**
 * Sets the authentication token in a cookie.
 * @param {string} token - The authentication token.
 */
export function setAuthToken(token) {
    log(context, 'Setting auth token');
    setCookie('auth_token', token, 7);
}

/**
 * Retrieves the authentication token from a cookie.
 * @returns {string|null} The authentication token, or null if not found.
 */
export function getAuthToken() {
    log(context, 'Getting auth token');
    return getCookie('auth_token');
}

/**
 * Removes the authentication token from cookies.
 */
export function removeAuthToken() {
    log(context, 'Removing auth token');
    removeCookie('auth_token');
}

/**
 * Makes an authenticated fetch request using the stored token.
 * @param {string} endpoint - The API endpoint to fetch from.
 * @param {Object} [options={}] - Fetch options.
 * @returns {Promise<Response>} The fetch response.
 * @throws {Error} If no token is found or the request fails.
 */
export async function authenticatedFetch(endpoint, options = {}) {
    log(context, `Making authenticated fetch to ${endpoint}`);
    const token = getAuthToken();
    if (!token) {
        throw new Error('No auth token found');
    }

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    const response = await fetch(`${API_ENDPOINTS.BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        throw new Error(`Authenticated fetch failed: ${response.statusText}`);
    }

    return response;
}

/**
 * Wraps a function to ensure it runs only for an authenticated user, passing the userId.
 * @param {string} context - The context or module name.
 * @param {Function} fn - The async function to execute if authenticated, accepting userId.
 * @param {string} operation - The operation name for logging.
 * @returns {Promise<*>} The result of the function execution.
 * @throws {Error} If the user is not authenticated or the token is invalid.
 */
export async function withAuthenticatedUser(context, fn, operation) {
    log(context, `Checking authentication for ${operation || 'operation'}`);
    const token = getAuthToken();
    if (!token) {
        log(context, 'User not authenticated');
        throw new Error('User not authenticated');
    }
    const payload = decodeToken(token);
    if (!payload || (!payload.userId && !payload.user_id)) {
        log(context, 'Invalid token or missing userId');
        throw new Error('Invalid token');
    }
    const userId = payload.userId || payload.user_id;
    log(context, `Authenticated user with userId: ${userId} for operation: ${operation}`);
    return await fn(userId);
}

// Initialize module with lifecycle logging
withScriptLogging(context, () => {
    log(context, 'Module initialized');
});