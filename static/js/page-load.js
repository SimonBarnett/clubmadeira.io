// /static/js/page-load.js
// Purpose: Manages page initialization, event listener attachment for navigation and section handling, and loading overlay behavior.

// Guard against multiple inclusions
if (window.pageLoadInitialized) {
    console.log('page-load.js - Already initialized, skipping');
} else {
    window.pageLoadInitialized = true;

    // Queue for Toastr messages to delay display until overlay is hidden
    let toastrQueue = [];

    // Override Toastr methods to queue messages during initial load
    (function() {
        const originalSuccess = toastr.success;
        const originalError = toastr.error;
        const originalInfo = toastr.info;
        const originalWarning = toastr.warning;

        function queueMessage(type, message, title, options) {
            toastrQueue.push({ type, message, title, options });
            console.log(`Toastr ${type} queued: ${title ? title + ' - ' : ''}${message}`);
        }

        toastr.success = function(message, title, options) {
            if (!window.overlayHidden) {
                queueMessage('success', message, title, options);
            } else {
                return originalSuccess.call(toastr, message, title, options);
            }
        };

        toastr.error = function(message, title, options) {
            if (!window.overlayHidden) {
                queueMessage('error', message, title, options);
            } else {
                return originalError.call(toastr, message, title, options);
            }
        };

        toastr.info = function(message, title, options) {
            if (!window.overlayHidden) {
                queueMessage('info', message, title, options);
            } else {
                return originalInfo.call(toastr, message, title, options);
            }
        };

        toastr.warning = function(message, title, options) {
            if (!window.overlayHidden) {
                queueMessage('warning', message, title, options);
            } else {
                return originalWarning.call(toastr, message, title, options);
            }
        };
    })();

    // Function to process queued Toastr messages
    function processToastrQueue() {
        while (toastrQueue.length > 0) {
            const { type, message, title, options } = toastrQueue.shift();
            toastr[type](message, title, options);
        }
    }

    // Function to show the loading overlay
    function showLoadingOverlay() {
        let loadingOverlay = document.getElementById('loadingOverlay');
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'loadingOverlay';
            loadingOverlay.innerHTML = `
                <div class="multicircle-loader">
                    <div class="circle circle1"></div>
                    <div class="circle circle2"></div>
                    <div class="circle circle3"></div>
                    <div class="circle circle4"></div>
                </div>
            `;
            document.body.prepend(loadingOverlay);
            console.log('showLoadingOverlay - Created and prepended loading overlay');
        }
        loadingOverlay.style.display = 'flex';
        console.log('showLoadingOverlay - Loading overlay set to visible');
        return loadingOverlay;
    }

    // Function to hide the loading overlay and show the main content with a minimum visibility delay
    async function hideLoadingOverlay(minDelay = 1000) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const layoutWrapper = document.querySelector('.layout-wrapper');
        
        if (loadingOverlay && layoutWrapper) {
            await new Promise(resolve => setTimeout(resolve, minDelay));
            loadingOverlay.style.display = 'none';
            layoutWrapper.style.display = 'block';
            console.log('hideLoadingOverlay - Loading overlay hidden, main content displayed');
            window.overlayHidden = true;
            processToastrQueue();
        } else {
            console.warn('hideLoadingOverlay - Loading overlay or layout wrapper not found');
        }
    }

    // Function to wait for /static/css/icons.css to load
    function waitForCssLoad() {
        return new Promise((resolve) => {
            const link = document.querySelector('link[href="/static/css/icons.css"]');
            if (link && link.sheet) {
                console.log('waitForCssLoad - /static/css/icons.css already loaded');
                resolve();
            } else if (link) {
                link.addEventListener('load', () => {
                    console.log('waitForCssLoad - /static/css/icons.css loaded');
                    resolve();
                });
                link.addEventListener('error', () => {
                    console.warn('waitForCssLoad - /static/css/icons.css failed to load');
                    resolve(); // Proceed even if CSS fails
                });
                setTimeout(() => {
                    console.warn('waitForCssLoad - CSS load timeout after 5 seconds');
                    resolve(); // Fallback after 5 seconds
                }, 10000);
            } else {
                console.warn('waitForCssLoad - /static/css/icons.css link not found');
                resolve(); // Proceed if link isn’t found
            }
        });
    }

    // Attaches event listeners for logoff only (navigation handled by site-navigation.js)
    function attachEventListeners() {
        console.log('attachEventListeners - Attaching event listeners');
        const contentWrapper = document.querySelector('.content-wrapper');
        if (contentWrapper) {
            contentWrapper.addEventListener('click', (event) => {
                if (event.target.id === 'logOffBtn') handleLogOff(event);
            });
            console.log('attachEventListeners - Logoff listener attached');
        }
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
        const decoded = decodeJWT(token);
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

    // Dispatcher function to call the appropriate initialization function based on page type
    function dispatchInitialize(pageType) {
        const initFunctions = {
            'partner': window.initializePartner,
            'merchant': window.initializeMerchant,
            'community': window.initializeCommunity,
            'admin': window.initializeAdmin
        };

        const initFunction = initFunctions[pageType];
        if (typeof initFunction === 'function') {
            if (pageType === 'admin') {
                initFunction('admin'); // Special case for admin, which takes a parameter
            } else {
                initFunction();
            }
        } else {
            console.error(`Initialization function for page type "${pageType}" is not defined`);
        }
    }

    // Common initialize function handling page-specific setup based on page type.
    let isInitializing = false;

    async function initialize(pageType) {
        if (isInitializing) {
            console.log(`initialize - Already initializing, skipping for: ${pageType}`);
            return;
        }
        isInitializing = true;
        console.log('initialize - Starting page initialization - Page type:', pageType);

        // Show the loading overlay
        showLoadingOverlay();

        // Wait for /static/css/icons.css to load
        await waitForCssLoad();

        const pageConfigs = {
            'partner': {
                permissions: ["wixpro", "admin"],
                initialSection: null,
                requiresUserId: false,
                extraSteps: () => {
                    console.log('initialize - Executing partner-specific steps');
                    dispatchInitialize('partner');
                    attachEventListeners();
                    console.log('initialize - Partner-specific steps completed');
                }
            },
            'merchant': {
                permissions: ["merchant", "admin"],
                initialSection: 'info',
                requiresUserId: true,
                extraSteps: () => {
                    console.log('initialize - Executing merchant-specific steps');
                    dispatchInitialize('merchant');
                    attachEventListeners();
                    console.log('initialize - Merchant-specific steps completed');
                }
            },
            'community': {
                permissions: ["community", "admin"],
                initialSection: 'welcome',
                requiresUserId: true,
                extraSteps: () => {
                    console.log('initialize - Executing community-specific steps');
                    dispatchInitialize('community');
                    attachEventListeners();
                    console.log('initialize - Community-specific steps completed');
                }
            },
            'admin': {
                permissions: ["admin"],
                initialSection: 'welcome',
                requiresUserId: false,
                extraSteps: () => {
                    console.log('initialize - Executing admin-specific steps');
                    dispatchInitialize('admin');
                    attachEventListeners();
                    console.log('initialize - Admin-specific steps completed');
                }
            },
            'login': {
                permissions: [],
                initialSection: null,
                requiresUserId: false,
                extraSteps: () => {
                    console.log('initialize - Executing login-specific steps');
                    console.log('initialize - Login-specific steps completed');
                }
            },
            'signup': {
                permissions: [],
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
            await hideLoadingOverlay();
            isInitializing = false;
            return;
        }
        console.log('initialize - Configuration loaded for page type:', pageType, 'Config:', JSON.stringify(config));

        if (config.permissions && config.permissions.length > 0) {
            console.log('initialize - Performing permission check for:', config.permissions);
            await new Promise(resolve => {
                initializePage(config.permissions, async () => {
                    console.log('initialize - Permission validated for:', config.permissions);
                    await performPageSetup(pageType, config);
                    resolve();
                });
            });
        } else {
            console.log('initialize - No permissions required for:', pageType);
            await performPageSetup(pageType, config);
        }

        // Hide the overlay after setup is complete
        await hideLoadingOverlay();
        isInitializing = false;
        console.log('initialize - Initialization process completed for:', pageType);
    }

    // Attach initialize to the window object to ensure it's globally available
    window.initialize = initialize;

    // Helper function to perform page setup after permission checks.
    async function performPageSetup(pageType, config) {
        console.log('performPageSetup - Starting setup - Page type:', pageType);
        
        if (config.initialSection) {
            console.log('performPageSetup - Showing initial section - ID:', config.initialSection);
            siteNavigation.showSection(config.initialSection);
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

    // Initialize on DOM load
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded - Starting initialization');
        const pageType = window.location.pathname.split('/')[1] || 'login';
        console.log('DOMContentLoaded - Determined page type:', pageType);
        initialize(pageType);
    });

    // Expose necessary functions globally
    window.showLoadingOverlay = showLoadingOverlay;
    window.hideLoadingOverlay = hideLoadingOverlay;
}