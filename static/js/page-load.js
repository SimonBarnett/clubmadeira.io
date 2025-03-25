// /static/js/page-load.js
// Purpose: Manages page initialization, event listener attachment for navigation and section handling, and loading overlay behavior.

// Function to hide the loading overlay and show the main content
function hideLoadingOverlay() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const layoutWrapper = document.querySelector('.layout-wrapper');
    
    if (loadingOverlay && layoutWrapper) {
        loadingOverlay.style.display = 'none';
        layoutWrapper.style.display = 'block';
        console.log('hideLoadingOverlay - Loading overlay hidden, main content displayed');
    } else {
        console.warn('hideLoadingOverlay - Loading overlay or layout wrapper not found');
    }
}

// Attaches event listeners for navigation and section handling.
function attachEventListeners() {
    console.log('attachEventListeners - Attaching event listeners');
    const buttons = document.querySelectorAll('button[data-section], button[data-submenu], button[data-href]');
    console.log('attachEventListeners - Found buttons:', buttons.length);
    buttons.forEach(button => {
        if (button.dataset.section || button.dataset.submenu) {
            button.addEventListener('click', handleSectionClick);
            console.log('attachEventListeners - Added click listener to button with data-section/submenu:', button.dataset.section || button.dataset.submenu);
        }
        if (button.dataset.href) {
            button.addEventListener('click', handleHrefClick);
            console.log('attachEventListeners - Added click listener to button with data-href:', button.dataset.href);
        }
    });
    const logOffBtn = document.getElementById('logOffBtn');
    if (logOffBtn) {
        logOffBtn.addEventListener('click', logOff);
        console.log('attachEventListeners - Added click listener to logOffBtn');
    }
    console.log('attachEventListeners - Event listeners attached');
}

// Base initialization function ensuring permission checks before page setup.
function initializePage(requiredPermissions, callback) {
    console.log('initializePage - Starting initialization - Permissions required:', requiredPermissions);
    const token = localStorage.getItem('authToken');
    console.log('initializePage - Retrieved token from localStorage:', token || 'None');
    if (!token) {
        console.warn('initializePage - No auth token found - Redirecting to /');
        window.location.href = '/';
        return;
    }
    const decoded = decodeJWT(token); // Assumes decodeJWT is available from site-auth.js
    console.log('initializePage - Decoded token:', decoded ? JSON.stringify(decoded) : 'null');
    if (!decoded) {
        console.warn('initializePage - Failed to decode token - Redirecting to /');
        window.location.href = '/';
        return;
    }
    window.userPermissions = decoded.permissions || [];
    console.log('initializePage - User permissions set:', JSON.stringify(window.userPermissions));
    if (!requiredPermissions.some(perm => window.userPermissions.includes(perm))) {
        console.warn('initializePage - Required permissions not found - Required:', requiredPermissions, 'Permissions:', window.userPermissions);
        toastr.error(`Permission denied: one of ${requiredPermissions.join(', ')} required`);
        window.location.href = '/';
        return;
    }
    console.log('initializePage - Permission check passed - Executing callback');
    callback();
    console.log('initializePage - Initialization completed for permissions:', requiredPermissions);
}

// Common initialize function handling page-specific setup based on page type.
function initialize(pageType) {
    console.log('initialize - Starting page initialization - Page type:', pageType);
    
    // Ensure overlay is visible at the start of initialization
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        console.log('initialize - Loading overlay set to visible');
    } else {
        console.warn('initialize - Loading overlay not found');
    }

    const pageConfigs = {
        'partner': {
            permissions: ["wixpro", "admin"],
            brandingType: 'partner',
            initialSection: null,
            requiresUserId: false,
            extraSteps: () => {
                console.log('initialize - Executing partner-specific steps');
                attachEventListeners();
                console.log('initialize - Partner-specific steps completed');
            }
        },
        'merchant': {
            permissions: ["merchant", "admin"],
            brandingType: 'merchant',
            initialSection: 'info',
            requiresUserId: true,
            extraSteps: () => {
                console.log('initialize - Executing merchant-specific steps');
                const userId = localStorage.getItem('userId');
                console.log('initialize - Retrieved userId from localStorage:', userId || 'None');
                if (userId) {
                    console.log('initialize - Setting userId in DOM - ID:', userId);
                    document.getElementById('userId').value = userId;
                } else {
                    console.warn('initialize - No userId found for merchant - Proceeding without setting');
                }                
                attachEventListeners();
                console.log('initialize - Merchant-specific steps completed');
            }
        },
        'community': {
            permissions: ["community", "admin"],
            brandingType: 'community',
            initialSection: 'welcome',
            requiresUserId: true,
            extraSteps: () => {
                console.log('initialize - Executing community-specific steps');
                const userId = localStorage.getItem('userId');
                console.log('initialize - Retrieved userId from localStorage:', userId || 'None');
                if (!userId) {
                    console.warn('initialize - User ID not found for community - Redirecting to /');
                    toastr.error('User ID not found in session');
                    window.location.href = '/';
                    return;
                }
                console.log('initialize - Setting userId in DOM - ID:', userId);
                document.getElementById('userId').value = userId;
                updateMenu(); // From community.js stub
                waitForTinyMCE(initializeTinyMCE); // From site-request.js
                attachEventListeners();
                console.log('initialize - Community-specific steps completed');
            }
        },
        'admin': {
            permissions: ["admin"],
            brandingType: 'admin',
            initialSection: 'welcome',
            requiresUserId: false,
            extraSteps: () => {
                console.log('initialize - Executing admin-specific steps');
                attachEventListeners();
                console.log('initialize - Admin-specific steps completed');
            }
        },
        'login': {
            permissions: [],
            brandingType: 'login',
            initialSection: null,
            requiresUserId: false,
            extraSteps: () => {
                console.log('initialize - Executing login-specific steps');
                console.log('initialize - Login-specific steps completed');
            }
        },
        'signup': {
            permissions: [],
            brandingType: 'signup',
            initialSection: null,
            requiresUserId: false,
            extraSteps: () => {
                console.log('initialize - Executing signup-specific steps');
                console.log('initialize - Signup-specific steps completed');
            }
        }
    };

    const config = pageConfigs[pageType];
    if (!config) {
        console.error('initialize - Invalid page type provided - Type:', pageType);
        toastr.error('Invalid page type');
        hideLoadingOverlay(); // Ensure overlay is hidden on failure
        return;
    }
    console.log('initialize - Configuration loaded for page type:', pageType, 'Config:', JSON.stringify(config));

    if (config.permissions && config.permissions.length > 0) {
        console.log('initialize - Performing permission check for:', config.permissions);
        initializePage(config.permissions, () => {
            console.log('initialize - Permission validated for:', config.permissions);
            performPageSetup(pageType, config);
            // Delay hiding the overlay slightly to ensure visibility
            setTimeout(() => {
                hideLoadingOverlay();
            }, 500); // 500ms delay, adjustable
        });
    } else {
        console.log('initialize - No permissions required for:', pageType);
        performPageSetup(pageType, config);
        // Delay hiding the overlay slightly to ensure visibility
        setTimeout(() => {
            hideLoadingOverlay();
        }, 500); // 500ms delay, adjustable
    }
    console.log('initialize - Initialization process completed for:', pageType);
}

// Attach initialize to the window object to ensure it's globally available
window.initialize = initialize;

// Helper function to perform page setup after permission checks.
function performPageSetup(pageType, config) {
    console.log('performPageSetup - Starting setup - Page type:', pageType);
    
    console.log('performPageSetup - Loading branding - Type:', config.brandingType);
    loadBranding(config.brandingType); // From site-navigation.js

    if (config.initialSection) {
        console.log('performPageSetup - Showing initial section - ID:', config.initialSection);
        showSection(config.initialSection); // From site-navigation.js
    } else {
        console.log('performPageSetup - No initial section specified for:', pageType);
    }

    if (typeof config.extraSteps === 'function') {
        console.log('performPageSetup - Executing extra steps for:', pageType);
        config.extraSteps();
    } else {
        console.log('performPageSetup - No extra steps defined for:', pageType);
    }

    console.log('performPageSetup - Page setup completed for:', pageType);
}

// Attaches click event listeners for section navigation.
function handleSectionClick(event) {
    console.log('handleSectionClick - Section click event triggered');
    const target = event.currentTarget;
    console.log('handleSectionClick - Event target:', target);
    const section = target.getAttribute('data-section');
    const submenu = target.getAttribute('data-submenu');
    console.log('handleSectionClick - Extracted attributes - Section:', section, 'Submenu:', submenu);
    if (submenu) {
        console.log('handleSectionClick - Toggling submenu - ID:', submenu);
        toggleSubmenu(submenu); // From site-navigation.js
    }
    if (section) {
        console.log('handleSectionClick - Showing section - ID:', section);
        showSection(section); // From site-navigation.js
    }
    if (!section && !submenu) {
        console.warn('handleSectionClick - No section or submenu attribute found - Target:', target);
    }
    console.log('handleSectionClick - Event handling completed');
}

// Attaches click event listeners for href navigation with SPA support.
async function handleHrefClick(event, options = {}) {
    console.log('handleHrefClick - Href click event triggered');
    const target = event.currentTarget;
    console.log('handleHrefClick - Event target:', target);
    const href = target.getAttribute('data-href');
    console.log('handleHrefClick - Extracted href:', href);
    console.log('handleHrefClick - Options provided:', JSON.stringify(options));
    if (!href) {
        console.warn('handleHrefClick - No href attribute found - Target:', target);
        return;
    }

    try {
        console.log('handleHrefClick - Initiating fetch for protected page - Href:', href);
        const startTime = Date.now();
        const html = await fetchProtectedPage(href); // From site-navigation.js
        const duration = Date.now() - startTime;
        if (!html) {
            console.error('handleHrefClick - No HTML returned - Href:', href);
            return;
        }
        console.log('handleHrefClick - HTML fetched successfully - Length:', html.length, 'Duration:', `${duration}ms`);

        const { spaPaths = ['/partner'], containerSelector = '.content-container', onLoad = null } = options;
        console.log('handleHrefClick - SPA paths:', spaPaths, 'Container selector:', containerSelector);

        if (spaPaths.includes(href)) {
            console.log('handleHrefClick - Initiating SPA redirect - Href:', href);
            history.pushState({ page: href.slice(1) }, `${href} Page`, href);
            console.log('handleHrefClick - URL updated via history.pushState - New URL:', window.location.href);
            const contentContainer = document.querySelector(containerSelector);
            console.log('handleHrefClick - Content container:', contentContainer);
            if (contentContainer) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const content = doc.querySelector(containerSelector) || doc.body;
                console.log('handleHrefClick - Extracted content element:', content.tagName);
                contentContainer.innerHTML = content.innerHTML;
                console.log('handleHrefClick - Content container updated - Href:', href);
                const scripts = doc.querySelectorAll('script:not([src])');
                console.log('handleHrefClick - Found inline scripts:', scripts.length);
                scripts.forEach((script, index) => {
                    if (script.innerHTML.trim()) {
                        console.log('handleHrefClick - Executing inline script', index + 1, 'Content:', script.innerHTML.substring(0, 100) + '...');
                        try {
                            new Function(script.innerHTML)();
                            console.log('handleHrefClick - Inline script', index + 1, 'executed successfully');
                        } catch (e) {
                            console.error('handleHrefClick - Error executing inline script', index + 1, 'Error:', e.message, 'Stack:', e.stack);
                        }
                    }
                });
            } else {
                console.error('handleHrefClick - Content container not found - Selector:', containerSelector, 'Falling back to full reload');
                toastr.error('Failed to update page content: container missing');
                document.body.innerHTML = html;
                console.log('handleHrefClick - Body updated with full HTML - Href:', href);
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const scripts = doc.querySelectorAll('script:not([src])');
                console.log('handleHrefClick - Found inline scripts for full reload:', scripts.length);
                scripts.forEach((script, index) => {
                    if (script.innerHTML.trim()) {
                        console.log('handleHrefClick - Executing inline script (full reload)', index + 1);
                        try {
                            new Function(script.innerHTML)();
                            console.log('handleHrefClick - Inline script (full reload)', index + 1, 'executed successfully');
                        } catch (e) {
                            console.error('handleHrefClick - Error executing inline script (full reload)', index + 1, 'Error:', e.message, 'Stack:', e.stack);
                        }
                    }
                });
                if (typeof window.initPage === 'function') {
                    console.log('handleHrefClick - Calling window.initPage after full reload');
                    window.initPage();
                }
            }
        } else {
            console.log('handleHrefClick - Performing full page load - Href:', href);
            document.body.innerHTML = html;
            console.log('handleHrefClick - Body updated with new HTML - Href:', href);
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const scripts = doc.querySelectorAll('script:not([src])');
            console.log('handleHrefClick - Found inline scripts for full reload:', scripts.length);
            scripts.forEach((script, index) => {
                if (script.innerHTML.trim()) {
                    console.log('handleHrefClick - Executing inline script (full reload)', index + 1);
                    try {
                        new Function(script.innerHTML)();
                        console.log('handleHrefClick - Inline script (full reload)', index + 1, 'executed successfully');
                    } catch (e) {
                        console.error('handleHrefClick - Error executing inline script (full reload)', index + 1, 'Error:', e.message, 'Stack:', e.stack);
                    }
                }
            });
            if (typeof window.initPage === 'function') {
                console.log('handleHrefClick - Calling window.initPage after full reload');
                window.initPage();
            }
        }

        if (typeof onLoad === 'function') {
            console.log('handleHrefClick - Executing onLoad callback - Href:', href);
            onLoad(href, html);
        }
    } catch (error) {
        console.error('handleHrefClick - Error handling href click - Href:', href, 'Error:', error.message, 'Stack:', error.stack);
        toastr.error('Navigation failed: ' + error.message);
    }
    console.log('handleHrefClick - Event handling completed');
}

// Remove redundant window.load and DOMContentLoaded listeners since waitForInitialize in admin.html handles initialization