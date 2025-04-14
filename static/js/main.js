// /static/js/main.js
console.log('main.js - Script loaded at:', new Date().toISOString());

// Import common utilities
import './common.js';

export function checkModuleSupport() {
    console.log('main.js - Checking module support');
    const supportsModules = 'noModule' in HTMLScriptElement.prototype;
    console.log('main.js - Supports modules:', supportsModules);
    return supportsModules;
}

export async function initializeApplication() {
    if (window.mainInitialized) {
        console.log('main.js - Already initialized, skipping');
        return;
    }
    window.mainInitialized = true;
    console.log('main.js - Starting initialization');

    if (checkModuleSupport()) {
        console.log('main.js - Before imports');
        try {
            // Load all modules in parallel using Promise.all for better performance
            const [
                loggerModule,
                notificationsModule,
                pageSetupModule,
                authModule,
                navigationModule
            ] = await Promise.all([
                import('/static/js/core/logger.js').catch(err => {
                    console.error('main.js - Failed to load logger.js:', err);
                    return { log: console.log, error: console.error, warn: console.warn, info: console.info };
                }),
                import('/static/js/core/notifications.js').catch(err => {
                    console.error('main.js - Failed to load notifications.js:', err);
                    return { setup: () => {}, success: console.log, error: console.error, info: console.info, warning: console.warn };
                }),
                import('/static/js/modules/pageSetup.js').catch(err => {
                    console.error('main.js - Failed to load pageSetup.js:', err);
                    return { initialize: () => console.warn('pageSetup.js - Initialize failed'), showLoadingOverlay: () => console.warn('pageSetup.js - showLoadingOverlay failed'), hideLoadingOverlay: () => console.warn('pageSetup.js - hideLoadingOverlay failed') };
                }),
                import('/static/js/core/auth.js').catch(err => {
                    console.error('main.js - Failed to load auth.js:', err);
                    return { authenticatedFetch: fetch };
                }),
                import('/static/js/modules/navigation.js').catch(err => {
                    console.error('main.js - Failed to load navigation.js:', err);
                    return { initialize: () => console.warn('navigation.js - Initialize failed'), showSection: () => console.warn('navigation.js - Show section failed'), showLogin: () => console.warn('navigation.js - Show login failed') };
                })
            ]);

            console.log('main.js - All modules loaded successfully');

            // Organize global functions under window.app to avoid namespace pollution
            window.app = {
                authenticatedFetch: authModule.authenticatedFetch || fetch,
                navigationShowLogin: navigationModule.showLogin || (() => console.warn('navigationShowLogin not available')),
                initializeApplication: initializeApplication,
                notificationsSetup: notificationsModule.setup || (() => {}),
                notificationsSuccess: notificationsModule.success || console.log,
                notificationsError: notificationsModule.error || console.error,
                notificationsInfo: notificationsModule.info || console.info,
                notificationsWarning: notificationsModule.warning || console.warn,
                loggerLog: loggerModule.log || console.log,
                loggerError: loggerModule.error || console.error,
                showLoadingOverlay: pageSetupModule.showLoadingOverlay || (() => console.warn('showLoadingOverlay not available')),
                hideLoadingOverlay: pageSetupModule.hideLoadingOverlay || (() => console.warn('hideLoadingOverlay not available'))
            };

            console.log('main.js - Global functions assigned to window.app:', {
                authenticatedFetch: !!window.app.authenticatedFetch,
                navigationShowLogin: !!window.app.navigationShowLogin,
                initializeApplication: !!window.app.initializeApplication,
                notificationsSetup: !!window.app.notificationsSetup,
                notificationsSuccess: !!window.app.notificationsSuccess,
                notificationsError: !!window.app.notificationsError,
                notificationsInfo: !!window.app.notificationsInfo,
                notificationsWarning: !!window.app.notificationsWarning,
                loggerLog: !!window.app.loggerLog,
                loggerError: !!window.app.loggerError,
                showLoadingOverlay: !!window.app.showLoadingOverlay,
                hideLoadingOverlay: !!window.app.hideLoadingOverlay
            });

            // Define initialization logic
            const initializeApp = () => {
                window.app.loggerLog('main.js - Initializing application');
                try {
                    window.app.notificationsSetup();
                    window.app.loggerLog('main.js - Notifications configured');

                    const pageType = document.body.getAttribute('data-page-type') || 'login';
                    window.app.loggerLog('main.js - Page type:', pageType);

                    pageSetupModule.initialize(pageType);
                    window.app.loggerLog('main.js - Page setup initiated for:', pageType);

                    // Dynamically load page-specific scripts
                    if (pageType === 'admin') {
                        import('./admin/admin-page.js').then(module => {
                            console.log('main.js - Loaded admin-page.js for admin page');
                        }).catch(err => {
                            console.error('main.js - Failed to load admin-page.js:', err.message, err.stack);
                        });
                    } else if (pageType === 'login') {
                        import('./login-page.js').then(module => {
                            console.log('main.js - Loaded login-page.js for login page');
                        });
                    } else if (pageType === 'merchant') {
                        Promise.all([
                            import('./category-management.js'),
                            import('./site-request.js'),
                            import('./merchant-page.js')
                        ]).then(() => {
                            console.log('main.js - Loaded scripts for merchant page');
                        });
                    } else if (pageType === 'partner') {
                        import('./partner-page.js').then(() => {
                            console.log('main.js - Loaded partner-page.js for partner page');
                        });
                    } else if (pageType === 'community') {
                        Promise.all([
                            import('./category-management.js'),
                            import('./site-request.js'),
                            import('./community-page.js')
                        ]).then(() => {
                            console.log('main.js - Loaded scripts for community page');
                        });
                    }

                    // Dispatch an event to signal that the application is fully initialized
                    console.log('main.js - Dispatching appInitialized event');
                    window.dispatchEvent(new Event('appInitialized'));
                } catch (error) {
                    window.app.loggerError('main.js - Initialization error:', error);
                    if (window.app.notificationsError) {
                        window.app.notificationsError('Failed to initialize application');
                    } else {
                        console.error('main.js - Failed to initialize application:', error);
                    }
                    console.log('main.js - Dispatching appInitialized event despite error');
                    window.dispatchEvent(new Event('appInitialized'));
                }
            };

            if (document.readyState === 'loading') {
                console.log('main.js - Waiting for DOMContentLoaded');
                document.addEventListener('DOMContentLoaded', initializeApp);
            } else {
                console.log('main.js - DOM already ready, initializing now');
                initializeApp();
            }
        } catch (error) {
            console.error('main.js - Error during module loading:', error);
            window.app = window.app || {
                authenticatedFetch: fetch,
                navigationShowLogin: () => console.warn('navigationShowLogin not available'),
                initializeApplication: initializeApplication,
                notificationsSetup: () => {},
                notificationsSuccess: console.log,
                notificationsError: console.error,
                notificationsInfo: console.info,
                notificationsWarning: console.warn,
                loggerLog: console.log,
                loggerError: console.error,
                showLoadingOverlay: () => console.warn('showLoadingOverlay not available'),
                hideLoadingOverlay: () => console.warn('hideLoadingOverlay not available')
            };
            document.addEventListener('DOMContentLoaded', () => {
                const wrapper = document.querySelector('.layout-wrapper');
                if (wrapper) {
                    wrapper.style.display = 'block';
                }
                if (typeof toastr !== 'undefined') {
                    toastr.error('Application failed to initialize. Please refresh or contact support.');
                } else {
                    console.warn('main.js - toastr not available for error message');
                    alert('Application failed to initialize. Please refresh or contact support.');
                }
                console.log('main.js - Dispatching appInitialized event after module loading error');
                window.dispatchEvent(new Event('appInitialized'));
            });
        }
    } else {
        console.error('main.js - Browser does not support ES modules');
        document.addEventListener('DOMContentLoaded', () => {
            const wrapper = document.querySelector('.layout-wrapper');
            if (wrapper) {
                wrapper.style.display = 'block';
            }
            if (typeof toastr !== 'undefined') {
                toastr.error('Your browser does not support modern JavaScript features. Please update your browser.');
            } else {
                console.warn('main.js - toastr not available for error message');
                alert('Your browser does not support modern JavaScript features. Please update your browser.');
            }
            console.log('main.js - Dispatching appInitialized event despite ES module support error');
            window.dispatchEvent(new Event('appInitialized'));
        });
    }
    console.log('main.js - Initialization completed');
}

initializeApplication()
    .catch(err => {
        console.error('main.js - Initialization failed:', err);
        console.log('main.js - Dispatching appInitialized event after uncaught error');
        window.dispatchEvent(new Event('appInitialized'));
    });