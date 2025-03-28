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

// Loads branding content into #brandingContent
async function loadBranding(brandingType) {
    console.log('loadBranding - Loading branding - Type:', brandingType);
    const brandingContent = document.getElementById('brandingContent');
    if (!brandingContent) {
        console.error('loadBranding - Branding container not found - ID: brandingContent');
        return;
    }
    try {
        console.log('loadBranding - Fetching branding from /branding - Type:', brandingType);
        const response = await authenticatedFetch(`${window.apiUrl}/branding?type=${brandingType}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to fetch branding: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }
        const data = await response.json();
        if (data.status === 'success' && data.branding) {
            brandingContent.innerHTML = data.branding;
            console.log('loadBranding - Branding loaded successfully - Type:', brandingType);
        } else {
            throw new Error('Invalid branding response');
        }
    } catch (error) {
        console.error('loadBranding - Error fetching branding:', error.message);
        brandingContent.innerHTML = `<h1>${brandingType.charAt(0).toUpperCase() + brandingType.slice(1)} Dashboard</h1>`;
        console.log('loadBranding - Fallback branding applied - Type:', brandingType);
    }
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

// Common initialize function handling page-specific setup based on page type.
let isInitializing = false;

async function initialize(pageType) {
    if (isInitializing) {
        console.log(`initialize - Already initializing, skipping for: ${pageType}`);
        return;
    }
    isInitializing = true;
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
                initializePartner(); // From partner-page.js
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
                initializeMerchant(); // From merchant-page.js
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
                initializeCommunity(); // From community-page.js
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
                initializeAdmin('admin'); // From admin-page.js
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
        isInitializing = false;
        return;
    }
    console.log('initialize - Configuration loaded for page type:', pageType, 'Config:', JSON.stringify(config));

    if (config.permissions && config.permissions.length > 0) {
        console.log('initialize - Performing permission check for:', config.permissions);
        initializePage(config.permissions, async () => {
            console.log('initialize - Permission validated for:', config.permissions);
            await performPageSetup(pageType, config);
            await hideLoadingOverlay();
            isInitializing = false;
        });
    } else {
        console.log('initialize - No permissions required for:', pageType);
        await performPageSetup(pageType, config);
        await hideLoadingOverlay();
        isInitializing = false;
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