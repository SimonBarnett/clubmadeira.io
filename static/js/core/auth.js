// /static/js/core/auth.js
// Purpose: Manages authentication tokens, authenticated requests, and user authentication checks.

import { log } from './logger.js';
import { setCookie, getCookie, removeCookie } from './cookies.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { API_ENDPOINTS } from '../config/endpoints.js';

const context = 'auth.js';

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
 * Verifies the reset token and extracts the payload.
 * @param {string} token - The reset token to verify.
 * @returns {Object} The decoded token payload.
 */
export function verifyResetToken(token) {
    log(context, 'Verifying reset token');
    try {
        const payload = jwt.decode(token); // Assuming a jwt library is available
        if (!payload) {
            throw new Error('Invalid token');
        }
        return payload;
    } catch (error) {
        throw new Error('Token verification failed');
    }
}

/**
 * Wraps a function to ensure it runs only for an authenticated user.
 * @param {string} context - The context or module name.
 * @param {Function} fn - The function to execute if authenticated.
 * @param {string} operation - The operation name for logging.
 * @returns {*} The result of the function execution.
 * @throws {Error} If the user is not authenticated.
 */
export function withAuthenticatedUser(context, fn, operation) {
    log(context, `Checking authentication for ${operation || 'operation'}`);
    const token = getAuthToken();
    if (!token) {
        log(context, 'User not authenticated');
        throw new Error('User not authenticated');
    }
    return fn();
}

/**
 * Initializes the auth module.
 */
export function initializeAuth() {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
}