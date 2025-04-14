// menus.js
import { tokenManagerDecode, authenticatedFetch, tokenManagerSetToken, tokenManagerClear } from '../core/auth.js';
import { log as loggerLog, warn as loggerWarn } from '../core/logger.js';
import { resetNavigation } from '../modules/navigation.js';

function hasAdminPermission() {
    const decoded = tokenManagerDecode();
    const hasPermission = decoded && decoded.permissions && decoded.permissions.includes('admin');
    loggerLog(`menus.js - Checking admin permission: ${hasPermission}`);
    return hasPermission;
}

export function getAdminMenu() {
    return [
        {
            section: 'userManagementIntro',
            label: 'User Management',
            icons: ['fas fa-users'],
            submenu: [
                { section: 'user_management', label: 'Admin', icons: ['icon-admin'], role: 'admin' },
                { section: 'user_management', label: 'Partners', icons: ['icon-partner'], role: 'partner' },
                { section: 'user_management', label: 'Communities', icons: ['icon-community'], role: 'community' },
                { section: 'user_management', label: 'Merchants', icons: ['icon-merchant'], role: 'merchant' }
            ]
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
                    action: async () => {
                        loggerLog('menus.js - Test Partner button clicked, showing overlay and calling /set-role');
                        window.showLoadingOverlay();
                        try {
                            const response = await authenticatedFetch('/set-role', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ role: 'partner' })
                            });
                            if (!response.ok) {
                                throw new Error(`Failed to set role: ${response.status}`);
                            }
                            const data = await response.json();
                            loggerLog('menus.js - Successfully set x-role to partner, response:', data);

                            if (data.token) {
                                tokenManagerSetToken(data.token);
                                loggerLog('menus.js - Updated token with new x-role: partner');
                            } else {
                                loggerWarn('menus.js - No token returned in set-role response');
                            }

                            window.location.href = '/';
                        } catch (error) {
                            loggerWarn('menus.js - Error setting role to partner:', error);
                            toastr.error('Failed to switch to partner role');
                            window.hideLoadingOverlay();
                        }
                    }
                },
                {
                    section: 'test_merchant',
                    label: 'Test Merchant',
                    icons: ['icon-merchant', 'fas fa-vial'],
                    action: async () => {
                        loggerLog('menus.js - Test Merchant button clicked, showing overlay and calling /set-role');
                        window.showLoadingOverlay();
                        try {
                            const response = await authenticatedFetch('/set-role', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ role: 'merchant' })
                            });
                            if (!response.ok) {
                                throw new Error(`Failed to set role: ${response.status}`);
                            }
                            const data = await response.json();
                            loggerLog('menus.js - Successfully set x-role to merchant, response:', data);

                            if (data.token) {
                                tokenManagerSetToken(data.token);
                                loggerLog('menus.js - Updated token with new x-role: merchant');
                            } else {
                                loggerWarn('menus.js - No token returned in set-role response');
                            }

                            window.location.href = '/';
                        } catch (error) {
                            loggerWarn('menus.js - Error setting role to merchant:', error);
                            toastr.error('Failed to switch to merchant role');
                            window.hideLoadingOverlay();
                        }
                    }
                },
                {
                    section: 'test_community',
                    label: 'Test Community',
                    icons: ['icon-community', 'fas fa-vial'],
                    action: async () => {
                        loggerLog('menus.js - Test Community button clicked, showing overlay and calling /set-role');
                        window.showLoadingOverlay();
                        try {
                            const response = await authenticatedFetch('/set-role', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ role: 'community' })
                            });
                            if (!response.ok) {
                                throw new Error(`Failed to set role: ${response.status}`);
                            }
                            const data = await response.json();
                            loggerLog('menus.js - Successfully set x-role to community, response:', data);

                            if (data.token) {
                                tokenManagerSetToken(data.token);
                                loggerLog('menus.js - Updated token with new x-role: community');
                            } else {
                                loggerWarn('menus.js - No token returned in set-role response');
                            }

                            window.location.href = '/';
                        } catch (error) {
                            loggerWarn('menus.js - Error setting role to community:', error);
                            toastr.error('Failed to switch to community role');
                            window.hideLoadingOverlay();
                        }
                    }
                },
                {
                    section: 'referralTestsIntro',
                    label: 'Referral Tests',
                    icons: ['fas fa-flask'],
                    submenu: [
                        { section: 'page_visit_test', label: 'Page Visit Test', icons: ['fas fa-eye'] },
                        { section: 'order_test', label: 'Order Test', icons: ['fas fa-shopping-cart'] }
                    ]
                }
            ]
        }
    ];
}

export function getMerchantMenu() {
    return [        
        { section: 'create-store', label: 'Create Store', icons: ['fas fa-store'] },
        { section: 'my-products', label: 'My Products', icons: ['fas fa-box-open'] },
        { section: 'api-keys', label: 'API Keys', icons: ['fas fa-key'] }        
    ];
}

export function getCommunityMenu() {
    return [        
        { section: 'categories', label: 'Categories', icons: ['fas fa-list'] },
        { section: 'my_website_intro_section', label: 'Link My Website', icons: ['fas fa-link'] },
        { section: 'no_website', label: 'Create Website', icons: ['fas fa-globe'] },
        { section: 'referrals_intro', label: 'Referals', icons: ['fas fa-user-friends'],
            submenu: [
                { section: 'visits', label: 'Visits', icons: ['fas fa-eye'] },
                { section: 'orders', label: 'Orders', icons: ['fas fa-shopping-cart'] }
            ]
         }
    ];
}

export function getPartnerMenu() {
    return [
        { section: 'referrals', label: 'Referrals', icons: ['fas fa-link'] },
        { section: 'settings', label: 'Settings', icons: ['fas fa-cog'] }
    ];
}

export function getDefaultMenu() {
    return [
        { section: 'info', label: 'Info', icons: ['fas fa-info-circle'] }
    ];
}

export function getLoginMenu() {
    return [
        {
            section: 'signup',
            label: 'Sign Up',
            icons: ['fas fa-user-plus'],
            action: () => {
                loggerLog('menus.js - Sign Up button clicked');
                window.location.href = '/signup';
            }
        },
        {
            section: 'forgot-password',
            label: 'Forgot Password',
            icons: ['fas fa-lock'],
            action: () => {
                loggerLog('menus.js - Forgot Password button clicked');
                window.location.href = '/forgot-password';
            }
        }
    ];
}

export function getMenu(role) {
    let baseMenu = [];
    if (role === 'login') {
        baseMenu = getLoginMenu();
    } else if (role === 'admin') {
        baseMenu = getAdminMenu();
    } else if (role === 'merchant') {
        baseMenu = getMerchantMenu();
    } else if (role === 'community') {
        baseMenu = getCommunityMenu();
    } else if (role === 'partner') {
        baseMenu = getPartnerMenu();
    } else {
        baseMenu = getDefaultMenu();
    }

    const additionalButtons = [];

    // Add "My Account" button for all roles except login
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

    // Get page type synchronously, prioritizing DOM attribute, then token
    let pageType = document.body.getAttribute('data-page-type') || document.body.dataset.pageType;
    let pageTypeSource = pageType ? 'DOM' : 'none';
    if (!pageType) {
        const decoded = tokenManagerDecode();
        pageType = decoded && decoded['x-role'] ? decoded['x-role'] : 'unknown';
        pageTypeSource = decoded && decoded['x-role'] ? 'token' : 'fallback';
    }
    loggerLog(`menus.js - Page type retrieved: ${pageType} (source: ${pageTypeSource})`);

    // Add "Back to Admin" button if user has admin permission and page_type is not admin
    if (hasAdminPermission() && pageType.toLowerCase() !== 'admin') {
        loggerLog('menus.js - Adding Back to Admin button');
        additionalButtons.push({
            section: 'back-to-admin',
            label: 'Back to Admin',
            icons: ['icon-admin'],
            action: async () => {
                loggerLog('menus.js - Back to Admin button clicked, showing overlay and calling /set-role');
                // Show loading overlay as soon as the role change begins
                window.showLoadingOverlay();
                try {
                    const response = await authenticatedFetch('/set-role', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role: 'admin' })
                    });
                    if (!response.ok) {
                        throw new Error(`Failed to set role: ${response.status}`);
                    }
                    const data = await response.json();
                    loggerLog('menus.js - Successfully set x-role to admin, response:', data);

                    if (data.token) {
                        tokenManagerSetToken(data.token);
                        loggerLog('menus.js - Updated token with new x-role: admin');
                    } else {
                        loggerWarn('menus.js - No token returned in set-role response');
                    }

                    window.location.href = '/';
                } catch (error) {
                    loggerWarn('menus.js - Error setting role to admin:', error);
                    toastr.error('Failed to switch to admin role');
                    // Hide overlay on error
                    window.hideLoadingOverlay();
                }
            }
        });
    } else {
        loggerLog('menus.js - Back to Admin button not added', {
            hasAdminPermission: hasAdminPermission(),
            pageType: pageType
        });
    }

    // Add "Logoff" button for all roles except login
    if (role !== 'login') {
        additionalButtons.push({
            section: 'logoff',
            label: 'Logoff',
            icons: ['fas fa-sign-out-alt'],
            action: async () => {
                loggerLog('menus.js - Logoff button clicked');
                try {
                    const confirmed = confirm('Are you sure you want to log out?');
                    if (confirmed) {
                        // Show the loading overlay before logoff
                        window.showLoadingOverlay();
                        loggerLog('menus.js - Showing loading overlay during logoff');
                        // Clear client-side token
                        tokenManagerClear();
                        // Reset navigation state
                        resetNavigation();
                        // Redirect to /logoff endpoint, which will handle server-side session clearing and redirection to /
                        window.location.href = '/logoff';
                        loggerLog('menus.js - Redirected to /logoff');
                    } else {
                        loggerLog('menus.js - Logoff cancelled by user');
                    }
                } catch (error) {
                    loggerWarn('menus.js - Error during logoff:', error);
                    toastr.error('Failed to log out');
                    // Hide the overlay in case of an error
                    window.hideLoadingOverlay();
                }
            }
        });
    }

    return [...baseMenu, ...additionalButtons];
}