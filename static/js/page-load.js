// /static/js/page-load.js
// Purpose: Manages page initialization, event listener attachment for navigation and section handling, and loading overlay behavior.

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
    } else {
        console.warn('hideLoadingOverlay - Loading overlay or layout wrapper not found');
    }
}

// Attaches event listeners for navigation and section handling.
function attachEventListeners() {
    console.log('attachEventListeners - Attaching event listeners');
    const buttons = document.querySelectorAll('button[data-section], button[data-submenu], button[data-href]');
    console.log('attachEventListeners - Found buttons with data attributes:', buttons.length);
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

    // Add delegated listener for logOffBtn
    document.addEventListener('click', (e) => {
        if (e.target.matches('#logOffBtn')) {
            e.preventDefault();
            console.log('Document click - Log Off button clicked');
            logOff();
        }
    });
    console.log('attachEventListeners - Added delegated click listener for logOffBtn');

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

// Common initialize function handling page-specific setup based on page type.
async function initialize(pageType) {
    console.log('initialize - Starting page initialization - Page type:', pageType);
    
    showLoadingOverlay();

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
                updateMenu();
                waitForTinyMCE(initializeTinyMCE);
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
        await hideLoadingOverlay();
        return;
    }
    console.log('initialize - Configuration loaded for page type:', pageType, 'Config:', JSON.stringify(config));

    if (config.permissions && config.permissions.length > 0) {
        console.log('initialize - Performing permission check for:', config.permissions);
        initializePage(config.permissions, async () => {
            console.log('initialize - Permission validated for:', config.permissions);
            await performPageSetup(pageType, config);
            await hideLoadingOverlay();
        });
    } else {
        console.log('initialize - No permissions required for:', pageType);
        await performPageSetup(pageType, config);
        await hideLoadingOverlay();
    }
    console.log('initialize - Initialization process completed for:', pageType);
}

// Attach initialize to the window object to ensure it's globally available
window.initialize = initialize;

// Helper function to perform page setup after permission checks.
async function performPageSetup(pageType, config) {
    console.log('performPageSetup - Starting setup - Page type:', pageType);
    
    console.log('performPageSetup - Loading branding - Type:', config.brandingType);
    await loadBranding(config.brandingType);

    if (config.initialSection) {
        console.log('performPageSetup - Showing initial section - ID:', config.initialSection);
        showSection(config.initialSection);
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
    const target = event.target.closest('button[data-section], button[data-submenu]');
    console.log('handleSectionClick - Event target:', target);
    if (!target) return;

    event.stopPropagation(); // Stop bubbling to parent elements

    const sectionId = target.getAttribute('data-section');
    const submenuId = target.getAttribute('data-submenu');
    console.log(`handleSectionClick - Extracted attributes - Section: ${sectionId} Submenu: ${submenuId}`);

    // Toggle submenu if the button has a data-submenu attribute
    if (submenuId) {
        console.log(`handleSectionClick - Toggling submenu - ID: ${submenuId}`);
        toggleSubmenu(submenuId);
    }

    // Show section if the button has a data-section attribute
    if (sectionId) {
        console.log(`handleSectionClick - Showing section - ID: ${sectionId}`);
        showSection(sectionId);
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

    showLoadingOverlay();
    try {
        console.log('handleHrefClick - Initiating fetch for protected page - Href:', href);
        const startTime = Date.now();
        const html = await fetchProtectedPage(href);
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
                        console.log('handleHrefClick - Executing inline script', index + 1);
                        try {
                            new Function(script.innerHTML)();
                            console.log('handleHrefClick - Inline script', index + 1, 'executed successfully');
                        } catch (e) {
                            console.error('handleHrefClick - Error executing inline script', index + 1, 'Error:', e.message);
                        }
                    }
                });
            } else {
                console.error('handleHrefClick - Content container not found - Selector:', containerSelector);
                toastr.error('Failed to update page content: container missing');
                document.body.innerHTML = html;
                console.log('handleHrefClick - Body updated with full HTML - Href:', href);
            }
        } else {
            console.log('handleHrefClick - Performing full page load - Href:', href);
            document.body.innerHTML = html;
            console.log('handleHrefClick - Body updated with new HTML - Href:', href);
        }

        if (typeof onLoad === 'function') {
            console.log('handleHrefClick - Executing onLoad callback - Href:', href);
            onLoad(href, html);
        }
    } catch (error) {
        console.error('handleHrefClick - Error handling href click - Href:', href, 'Error:', error.message);
        toastr.error('Navigation failed: ' + error.message);
    } finally {
        await hideLoadingOverlay();
    }
    console.log('handleHrefClick - Event handling completed');
}

// Initialize on DOM load (fallback, though fetchProtectedPage should handle it)
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded - Starting initialization');
    const pageType = window.location.pathname.split('/')[1] || 'login';
    console.log('DOMContentLoaded - Determined page type:', pageType);
    initialize(pageType);
});