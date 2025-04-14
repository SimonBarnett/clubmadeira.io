// pageSetup.js
import { tokenManagerGetToken, tokenManagerDecode, tokenManagerClear } from '/static/js/core/auth.js';
import { initialize as navInitialize, showSection } from '/static/js/modules/navigation.js';
import { load as userSettingsLoad } from './userSettings.js';
import { load as dataLoaderLoad } from './dataLoader.js';
import { log as loggerLog, warn as loggerWarn } from '../core/logger.js';

// Define all exported functions at the top level
export async function initialize(pageType) {
    if (window.pageSetupInitialized) {
        loggerLog('pageSetup.js - Already initialized, skipping initialize');
        return;
    }

    loggerLog(`pageSetup.js - Starting for ${pageType}`);
    window.showLoadingOverlay();

    try {
        const token = tokenManagerGetToken();
        const currentPath = window.location.pathname;

        if (!token) {
            if (pageType === 'login' || currentPath === '/' || currentPath === '/login') {
                loggerLog('pageSetup.js - No token, showing login page');
                const layoutWrapper = document.querySelector('.layout-wrapper');
                if (layoutWrapper) {
                    layoutWrapper.style.display = 'block';
                    loggerLog('pageSetup.js - Layout wrapper made visible for login page');
                } else {
                    loggerWarn('pageSetup.js - Layout wrapper not found');
                }
                // Set role to 'login' to render login-specific menu
                const role = 'login';
                loggerLog(`pageSetup.js - Initializing navigation for ${role}`);
                navInitialize(role);
                showSection('login');
                window.pageSetupInitialized = true;
            } else {
                loggerLog('pageSetup.js - No token, showing login');
                showSection('login');
            }
        } else {
            const decoded = tokenManagerDecode();
            if (!decoded) {
                loggerLog('pageSetup.js - Invalid token, clearing and showing login');
                tokenManagerClear();
                showSection('login');
            } else {
                const userId = decoded.user_id;
                const role = decoded['x-role'] || 'default';
                loggerLog(`pageSetup.js - User: ${userId}, Role: ${role}`);

                // Check user permissions based on x-role
                const permissions = decoded.permissions || [];
                const hasPermissions = checkUserPermissions(role, permissions);
                if (!hasPermissions) {
                    loggerWarn(`pageSetup.js - User lacks required permissions for role: ${role}`);
                    showSection('login');
                } else {
                    await userSettingsLoad(role);
                    try {
                        const data = await dataLoaderLoad(role);
                        if (data) {
                            loggerLog(`pageSetup.js - Data loaded for ${role}:`, data);
                        } else {
                            loggerLog(`pageSetup.js - No data available for ${role}, continuing setup`);
                        }
                    } catch (error) {
                        loggerWarn(`pageSetup.js - Failed to load data for ${role}:`, error);
                    }

                    const userData = { contact_name: decoded.contact_name || 'User' };
                    updateUserInfo(userData);

                    // Default section is always 'info' on page load
                    const section = 'info';
                    loggerLog(`pageSetup.js - Initializing navigation for ${role}, default section: ${section}`);

                    const initializeNavigation = () => {
                        loggerLog('pageSetup.js - Executing initializeNavigation');
                        navInitialize(role);
                        loggerLog(`pageSetup.js - Navigation initialized for ${role}`);
                        showSection(section);
                        loggerLog(`pageSetup.js - Section ${section} shown`);
                    };

                    // Ensure DOM is fully loaded before initializing navigation
                    if (document.readyState === 'loading') {
                        loggerLog('pageSetup.js - Waiting for DOMContentLoaded to initialize navigation');
                        document.addEventListener('DOMContentLoaded', () => {
                            loggerLog('pageSetup.js - DOMContentLoaded event fired');
                            initializeNavigation();
                        });
                    } else {
                        loggerLog('pageSetup.js - DOM already ready, initializing navigation now');
                        setTimeout(() => {
                            loggerLog('pageSetup.js - Delayed execution of initializeNavigation to ensure DOM readiness');
                            initializeNavigation();
                        }, 100); // Small delay to ensure DOM is fully ready
                    }

                    initializePageElements(role);
                    setupRoleSpecificFeatures(role);
                    setupFormListeners();
                    setupErrorHandling();
                    setupAnalytics();

                    const theme = decoded.theme || 'default-theme';
                    setupTheme(theme);

                    const layoutWrapper = document.querySelector('.layout-wrapper');
                    if (layoutWrapper) {
                        layoutWrapper.style.display = 'block';
                        loggerLog(`pageSetup.js - Layout wrapper made visible for ${role}`);
                    } else {
                        loggerWarn('pageSetup.js - Layout wrapper not found');
                    }
                    loggerLog(`pageSetup.js - Page setup complete for ${role}`);
                    window.pageSetupInitialized = true;
                }
            }
        }

        // Ensure the DOM is fully updated before hiding the overlay
        const hideOverlayAfterRender = () => {
            window.hideLoadingOverlay();
            loggerLog('pageSetup.js - Loading overlay hidden after page render');
        };

        if (document.readyState === 'loading') {
            loggerLog('pageSetup.js - Waiting for DOMContentLoaded to hide overlay');
            document.addEventListener('DOMContentLoaded', () => {
                loggerLog('pageSetup.js - DOMContentLoaded event fired for page render');
                setTimeout(hideOverlayAfterRender, 100); // Small delay to ensure rendering
            });
        } else {
            loggerLog('pageSetup.js - DOM already ready, delaying hide overlay');
            setTimeout(hideOverlayAfterRender, 100); // Small delay to ensure rendering
        }
    } catch (error) {
        loggerLog(`pageSetup.js - Error during setup for ${pageType}:`, error);
        showSection('login');
        loggerLog('pageSetup.js - Showing login section after error');

        // Ensure the DOM is fully updated before hiding the overlay in case of error
        const hideOverlayAfterRender = () => {
            window.hideLoadingOverlay();
            loggerLog('pageSetup.js - Loading overlay hidden after error page render');
        };

        if (document.readyState === 'loading') {
            loggerLog('pageSetup.js - Waiting for DOMContentLoaded to hide overlay after error');
            document.addEventListener('DOMContentLoaded', () => {
                loggerLog('pageSetup.js - DOMContentLoaded event fired for error page render');
                setTimeout(hideOverlayAfterRender, 100); // Small delay to ensure rendering
            });
        } else {
            loggerLog('pageSetup.js - DOM already ready, delaying hide overlay after error');
            setTimeout(hideOverlayAfterRender, 100); // Small delay to ensure rendering
        }
    }
}

// Other exported functions remain unchanged
export function showLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        loggerLog('pageSetup.js - Loading overlay shown');
    } else {
        loggerWarn('pageSetup.js - Loading overlay element not found');
    }
}

export function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        loggerLog('pageSetup.js - Loading overlay hidden');
    } else {
        loggerWarn('pageSetup.js - Loading overlay element not found');
    }
}

export function checkUserPermissions(role, permissions) {
    loggerLog(`pageSetup.js - Checking permissions for role: ${role}`);
    const userPermissions = permissions || [];
    loggerLog(`pageSetup.js - User permissions:`, userPermissions);
    // Allow admins to access any role
    if (userPermissions.includes('admin')) {
        loggerLog(`pageSetup.js - Admin permission detected, allowing access to role: ${role}`);
        return true;
    }
    const requiredPermissions = {
        admin: ['admin'],
        merchant: ['merchant'],
        community: ['community'],
        partner: ['partner']
    };
    const hasRequiredPermissions = requiredPermissions[role]?.every(perm => userPermissions.includes(perm)) || false;
    loggerLog(`pageSetup.js - Role ${role} has required permissions: ${hasRequiredPermissions}`);
    return hasRequiredPermissions;
}

export function initializePageElements(role) {
    loggerLog(`pageSetup.js - Initializing page elements for role: ${role}`);
    const roleSpecificElements = {
        admin: [], // Removed #adminDashboard and #userManagement, as they do not exist
        merchant: ['#dealListings', '#storeSettings'],
        community: ['#postsSection', '#communitySettings'],
        partner: ['#referralsSection', '#partnerSettings']
    };

    const elements = roleSpecificElements[role] || [];
    elements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.style.display = 'block';
            loggerLog(`pageSetup.js - Made element visible: ${selector}`);
        } else {
            loggerWarn(`pageSetup.js - Element not found: ${selector}`);
        }
    });
}

export function setupFormListeners() {
    loggerLog('pageSetup.js - Setting up form listeners');
    const settingsForm = document.querySelector('#settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(settingsForm);
            const settings = {};
            formData.forEach((value, key) => {
                settings[key] = value;
            });
            try {
                const response = await fetch(`${window.apiUrl}/settings/user`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(settings)
                });
                if (!response.ok) throw new Error('Failed to save settings');
                loggerLog('pageSetup.js - Settings saved successfully');
            } catch (error) {
                loggerWarn('pageSetup.js - Error saving settings:', error);
            }
        });
    }

    const logoutButton = document.querySelector('#logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
}

export function handleLogout() {
    loggerLog('pageSetup.js - Handling logout');
    const confirmed = confirm('Are you sure you want to log out?');
    if (confirmed) {
        tokenManagerClear();
        showSection('login');
        loggerLog('pageSetup.js - User logged out and showing login section');
    }
}

export function updateUserInfo(userData) {
    loggerLog('pageSetup.js - Updating user info in DOM');
    const userInfoElement = document.querySelector('#userInfo');
    if (userInfoElement && userData && userData.contact_name) {
        userInfoElement.textContent = `Welcome, ${userData.contact_name}!`;
        loggerLog('pageSetup.js - User info updated in DOM');
    } else {
        loggerWarn('pageSetup.js - User info element or data not found');
    }
}

export function setupRoleSpecificFeatures(role) {
    loggerLog(`pageSetup.js - Setting up role-specific features for ${role}`);
    switch (role) {
        case 'admin':
            setupAdminFeatures();
            break;
        case 'merchant':
            setupMerchantFeatures();
            break;
        case 'community':
            setupCommunityFeatures();
            break;
        case 'partner':
            setupPartnerFeatures();
            break;
        default:
            loggerWarn('pageSetup.js - No role-specific features for role:', role);
    }
}

function setupAdminFeatures() {
    loggerLog('pageSetup.js - Setting up admin features');
    // No adminDashboard section to display, as the default section is info
}

function setupMerchantFeatures() {
    loggerLog('pageSetup.js - Setting up merchant features');
    const dealListings = document.querySelector('#dealListings');
    if (dealListings) {
        dealListings.style.display = 'block';
        loggerLog('pageSetup.js - Deal listings made visible');
    }
}

function setupCommunityFeatures() {
    loggerLog('pageSetup.js - Setting up community features');
    const postsSection = document.querySelector('#postsSection');
    if (postsSection) {
        postsSection.style.display = 'block';
        loggerLog('pageSetup.js - Posts section made visible');
    }
}

function setupPartnerFeatures() {
    loggerLog('pageSetup.js - Setting up partner features');
    const referralsSection = document.querySelector('#referralsSection');
    if (referralsSection) {
        referralsSection.style.display = 'block';
        loggerLog('pageSetup.js - Referrals section made visible');
    }
}

export function handleSectionChange(section) {
    loggerLog(`pageSetup.js - Handling section change to: ${section}`);
    showSection(section);
    window.history.pushState({}, '', `#${section}`);
}

export function setupErrorHandling() {
    loggerLog('pageSetup.js - Setting up error handling');
    window.addEventListener('error', (event) => {
        loggerWarn('pageSetup.js - Uncaught error:', event.message);
    });
}

export function setupTheme(theme) {
    loggerLog('pageSetup.js - Setting up theme:', theme);
    document.body.className = theme || 'default-theme';
}

export function setupAnalytics() {
    loggerLog('pageSetup.js - Setting up analytics');
    // Placeholder for analytics setup
}

window.pageSetupInitialized = false;
window.showLoadingOverlay = showLoadingOverlay;
window.hideLoadingOverlay = hideLoadingOverlay;