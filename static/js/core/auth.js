// auth.js
import { log as loggerLog, error as loggerError } from './logger.js';
import { getCookie as cookiesGetCookie, setCookie as cookiesSetCookie, deleteCookie as cookiesDeleteCookie } from './cookies.js';
import { success as notificationsSuccess, error as notificationsError } from './notifications.js';

let token = null;
let decoded = null;
let redirectCount = 0;
const maxRedirects = 2;

export function tokenManagerGetToken() {
    if (!token) {
        token = localStorage.getItem('authToken') || cookiesGetCookie('authToken') || sessionStorage.getItem('authToken');
        loggerLog(`tokenManagerGetToken - Token: ${token ? '[present]' : 'none'}`);
    }
    return token;
}

export function tokenManagerDecode() {
    if (!decoded && tokenManagerGetToken()) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid JWT format');
            }
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            decoded = JSON.parse(jsonPayload);
            loggerLog('tokenManagerDecode - Decoded JWT:', decoded);
        } catch (error) {
            loggerError('tokenManagerDecode - Error decoding JWT:', error, 'Token:', token);
            decoded = null;
        }
    } else if (!tokenManagerGetToken()) {
        // Reset decoded if no token is present
        decoded = null;
        loggerLog('tokenManagerDecode - No token present, resetting decoded state');
    }
    return decoded;
}

export function tokenManagerSetToken(newToken) {
    token = newToken;
    localStorage.setItem('authToken', newToken);
    sessionStorage.setItem('authToken', newToken); // Also store in sessionStorage for redundancy
    cookiesSetCookie('authToken', newToken, 7);
    decoded = null;
    loggerLog('tokenManagerSetToken - Token updated');
}

export function tokenManagerClear() {
    // Clear from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('redirectCount');
    
    // Clear from sessionStorage
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('redirectCount');
    
    // Clear from cookies
    cookiesDeleteCookie('authToken');
    cookiesDeleteCookie('session');
    
    // Reset internal state
    token = null;
    decoded = null;
    redirectCount = 0;
    
    loggerLog('tokenManagerClear - Auth data cleared from localStorage, sessionStorage, and cookies');
}

export function tokenManagerIncrementRedirect() {
    redirectCount++;
    localStorage.setItem('redirectCount', redirectCount);
    sessionStorage.setItem('redirectCount', redirectCount); // Also store in sessionStorage
    loggerLog(`tokenManagerIncrementRedirect - Count: ${redirectCount}`);
    return redirectCount;
}

export function tokenManagerResetRedirect() {
    redirectCount = 0;
    localStorage.setItem('redirectCount', redirectCount);
    sessionStorage.setItem('redirectCount', redirectCount); // Also store in sessionStorage
    loggerLog('tokenManagerResetRedirect - Count reset');
}

export function tokenManagerCanRedirect() {
    const can = redirectCount <= maxRedirects;
    loggerLog(`tokenManagerCanRedirect - Count: ${redirectCount}, Max: ${maxRedirects}, Can: ${can}`);
    return can;
}

export async function authenticatedFetch(url, options = {}) {
    loggerLog(`authenticatedFetch - Fetching: ${url}`);
    const publicEndpoints = ['/', '/signup', '/logoff']; // Added /logoff to public endpoints
    const isPublic = publicEndpoints.some(endpoint => url.includes(endpoint));
    loggerLog(`authenticatedFetch - Is public: ${isPublic}`);

    const token = tokenManagerGetToken();
    if (!token && !isPublic) {
        if (!tokenManagerCanRedirect()) {
            loggerError('authenticatedFetch - Redirect loop detected, clearing token');
            tokenManagerClear();
            window.location.href = '/';
            return null;
        }
        tokenManagerIncrementRedirect();
        loggerError('authenticatedFetch - No token, redirecting to /');
        notificationsError('Please log in to continue');
        window.location.href = '/';
        return null;
    }

    const headers = new Headers(options.headers || {});
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');

    const fetchOptions = {
        ...options,
        headers
    };

    try {
        const response = await fetch(url, fetchOptions);
        loggerLog(`authenticatedFetch - Response status: ${response.status}`);
        if (!response.ok && !isPublic) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }
        tokenManagerResetRedirect();
        return response;
    } catch (error) {
        loggerError('authenticatedFetch - Error:', error);
        if (!isPublic && tokenManagerCanRedirect()) {
            tokenManagerIncrementRedirect();
            notificationsError('Session expired, please log in');
            window.location.href = '/';
            return null;
        }
        throw error;
    }
}

export async function logout() {
    loggerLog('logout - Initiating');
    const confirmed = confirm('Are you sure you want to log off?');
    if (!confirmed) {
        loggerLog('logout - Cancelled by user');
        return;
    }

    try {
        loggerLog('logout - Sending /logoff request');
        const response = await fetch('/logoff', { method: 'GET' });
        const data = await response.json();
        if (data.status === 'success') {
            loggerLog('logout - Server confirmed logout');
            tokenManagerClear();
            sessionStorage.clear();
            notificationsSuccess('Logged off successfully');
            setTimeout(() => {
                window.location.href = data.redirect_url || '/';
                loggerLog('logout - Redirected to:', data.redirect_url || '/');
            }, 1000);
        } else {
            loggerError('logout - Server error:', data.message);
            notificationsError(data.message || 'Logout failed');
        }
    } catch (error) {
        loggerError('logout - Error:', error);
        notificationsError('Logout failed: ' + error.message);
        tokenManagerClear();
        window.location.href = '/';
    }
}

export function togglePassword(fieldId) {
    loggerLog(`togglePassword - Toggling field: ${fieldId}`);
    const input = document.getElementById(fieldId);
    const icon = input?.nextElementSibling;

    if (!input) {
        loggerError(`togglePassword - Input not found: ${fieldId}`);
        return;
    }
    if (!icon) {
        loggerError(`togglePassword - Icon not found for: ${fieldId}`);
        return;
    }

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    icon.classList.toggle('fa-eye', !isPassword);
    icon.classList.toggle('fa-eye-slash', isPassword);
    loggerLog(`togglePassword - Set type to: ${input.type}`);
}

export async function savePassword() {
    loggerLog('savePassword - Starting');
    const newPassword = document.getElementById('changeNewPassword')?.value;
    const confirmPassword = document.getElementById('changeConfirmPassword')?.value;

    if (!newPassword || typeof newPassword !== 'string') {
        loggerError('savePassword - Invalid new password');
        notificationsError('Please enter a valid new password');
        return;
    }
    if (newPassword !== confirmPassword) {
        loggerError('savePassword - Passwords do not match');
        notificationsError('Passwords do not match');
        return;
    }

    try {
        loggerLog('savePassword - Sending update');
        const response = await authenticatedFetch('/update-password', {
            method: 'POST',
            body: JSON.stringify({ password: newPassword })
        });
        if (!response) {
            loggerError('savePassword - No response');
            notificationsError('Failed to save password');
            return;
        }
        const result = await response.json();
        loggerLog('savePassword - Response:', result);
        if (result.status === 'success') {
            loggerLog('savePassword - Success');
            notificationsSuccess('Password updated successfully');
            document.getElementById('currentPassword').value = '';
            document.getElementById('changeNewPassword').value = '';
            document.getElementById('changeConfirmPassword').value = '';
        } else {
            loggerError('savePassword - Failed:', result.message);
            notificationsError(result.message || 'Failed to save password');
        }
    } catch (error) {
        loggerError('savePassword - Error:', error);
        notificationsError('Failed to save password: ' + error.message);
    }
}

export function setupEventListeners() {
    loggerLog('setupEventListeners - Adding auth-related listeners');
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const targetId = toggle.getAttribute('data-target');
            togglePassword(targetId);
        });
    });

    const savePasswordBtn = document.querySelector('[data-action="savePassword"]');
    if (savePasswordBtn) {
        savePasswordBtn.addEventListener('click', savePassword);
        loggerLog('setupEventListeners - Added savePassword listener');
    } else {
        loggerLog('setupEventListeners - Save password button not found');
    }
}

if (!window.authInitialized) {
    window.authInitialized = true;
    document.addEventListener('DOMContentLoaded', () => {
        setupEventListeners();
    });

    window.dispatchEvent(new Event('siteAuthReady'));
    loggerLog('auth.js - Auth utility initialized');
}