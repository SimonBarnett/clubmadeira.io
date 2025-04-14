// page-load.js
if (!window.pageLoadInitialized) {
    window.pageLoadInitialized = true;

    const ENABLE_LOGGING = true;

    const config = {
        login: { permissions: [], initialSection: null, requiresUserId: false },
        admin: { permissions: ['admin'], initialSection: 'dashboard', requiresUserId: true },
        merchant: { permissions: ['merchant'], initialSection: 'deals', requiresUserId: true },
        community: { permissions: ['community'], initialSection: 'group', requiresUserId: true },
        partner: { permissions: ['partner'], initialSection: 'clients', requiresUserId: true }
    };

    function log(message, ...args) {
        if (ENABLE_LOGGING) console.log(message, ...args);
    }

    function error(message, ...args) {
        if (ENABLE_LOGGING) console.error(message, ...args);
    }

    function showLoadingOverlay() {
        log('showLoadingOverlay - Displaying loading overlay');
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'flex';
    }

    function hideLoadingOverlay() {
        log('hideLoadingOverlay - Hiding loading overlay');
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            document.querySelector('.layout-wrapper').style.display = 'block';
        }
    }

    async function waitForCssLoad(cssUrl) {
        log('waitForCssLoad - Checking CSS load:', cssUrl);
        const link = document.querySelector(`link[href*="${cssUrl}"]`);
        if (!link) {
            error('waitForCssLoad - CSS link not found:', cssUrl);
            return;
        }
        return new Promise(resolve => {
            link.onload = () => { log('waitForCssLoad - CSS loaded:', cssUrl); resolve(); };
            link.onerror = () => { error('waitForCssLoad - CSS failed to load:', cssUrl); resolve(); };
            if (link.sheet) { log('waitForCssLoad - CSS already loaded:', cssUrl); resolve(); }
        });
    }

    let isInitializing = false;

    async function initialize(pageType) {
        if (isInitializing) return;
        isInitializing = true;
        log('initialize - Starting page initialization - Page type:', pageType);

        try {
            showLoadingOverlay();
            await waitForCssLoad('/static/css/icons.css');

            const token = localStorage.getItem('authToken');
            const decoded = token ? window.decodeJWT(token) : null;
            const currentRole = decoded?.['x-role'] || 'login';

            log('initialize - Token:', token ? '[present]' : 'null', 'Current Role:', currentRole);

            if (token && currentRole !== 'login') {
                log('initialize - Valid token with role:', currentRole, 'Proceeding with setup');
                await performPageSetup(currentRole, config[currentRole] || { permissions: [], initialSection: null, requiresUserId: false });
            } else {
                log('initialize - No valid role, setting up login');
                localStorage.removeItem('authToken');
                localStorage.setItem('loginRedirectCount', '0');
                localStorage.setItem('fetchRedirectCount', '0');
                window.siteNavigation.deleteCookie('authToken');
                await performPageSetup('login', config['login']);
            }
        } catch (err) {
            error('initialize - Error during initialization:', err);
            throw err;
        } finally {
            hideLoadingOverlay();
            isInitializing = false;
        }
    }

    async function performPageSetup(pageType, pageConfig) {
        log('performPageSetup - Starting setup - Page type:', pageType);
        const domPageType = document.body.getAttribute('data-page-type') || 'login';
        if (domPageType !== pageType) {
            log('performPageSetup - DOM mismatch detected - DOM:', domPageType, 'Expected:', pageType);
            const token = localStorage.getItem('authToken');
            const decoded = token ? window.decodeJWT(token) : null;
            const currentRole = decoded?.['x-role'] || 'login';
            if (currentRole === pageType) {
                log('performPageSetup - Role matches x-role, proceeding without redirect');
            } else {
                log('performPageSetup - Role mismatch, redirecting to:', pageType);
                window.location.href = '/';
                return;
            }
        }

        if (pageConfig.initialSection) {
            log('performPageSetup - Setting initial section:', pageConfig.initialSection);
            if (typeof window.siteNavigation?.showSection === 'function') {
                window.siteNavigation.showSection(pageConfig.initialSection);
            } else {
                log('performPageSetup - siteNavigation.showSection not available');
            }
        } else {
            log('performPageSetup - No initial section specified for:', pageType);
        }

        log('performPageSetup - Executing extra steps for:', pageType);
        if (pageType === 'login') {
            log('performPageSetup - Executing login-specific steps');
            log('performPageSetup - Login-specific steps completed');
        }

        // Ensure the role is passed to initializeNavigation
        if (typeof window.siteNavigation?.initializeNavigation === 'function') {
            log('performPageSetup - Calling initializeNavigation with role:', pageType);
            window.siteNavigation.initializeNavigation(pageType);
        } else {
            log('performPageSetup - siteNavigation.initializeNavigation not available');
        }

        log('performPageSetup - Page setup completed for:', pageType);
    }

    document.addEventListener('DOMContentLoaded', function() {
        log('DOMContentLoaded - Starting initialization');
        const pageType = document.body.getAttribute('data-page-type') || 'login';
        log('DOMContentLoaded - Determined page type from DOM:', pageType);

        const token = localStorage.getItem('authToken');
        const decoded = token ? window.decodeJWT(token) : null;
        const currentRole = decoded?.['x-role'] || 'login';

        log('Page load check - Token:', token ? '[present]' : 'null', 'Current Role:', currentRole);

        if (token && currentRole !== 'login') {
            log('Initializing with role:', currentRole);
            initialize(currentRole);
        } else {
            log('No valid token or role, initializing as login');
            localStorage.removeItem('authToken');
            localStorage.setItem('loginRedirectCount', '0');
            localStorage.setItem('fetchRedirectCount', '0');
            window.siteNavigation.deleteCookie('authToken');
            initialize('login');
        }

        // Additional call to initializeNavigation to ensure menu updates
        if (typeof window.siteNavigation?.initializeNavigation === 'function') {
            log('DOMContentLoaded - Ensuring menu updates with role:', currentRole);
            window.siteNavigation.initializeNavigation(currentRole);
        } else {
            log('DOMContentLoaded - siteNavigation.initializeNavigation not available');
        }
    });

    window.initialize = initialize;
}