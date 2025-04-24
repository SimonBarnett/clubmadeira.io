// /static/js/admin-page.js
// Purpose: Orchestrates the admin page, coordinating navigation, events, and module initialization.
const context = 'admin-page.js';
import { log } from './core/logger.js';
import { parsePageType, hideOverlay } from './utils/initialization.js';
import { withScriptLogging } from './utils/logging-utils.js';
import { initializeRoleNavigation } from './admin/navigation.js';
import { ROLES } from './config/menus.js';
import { setupAdminEvents } from './admin/admin-events.js';
import { initializeAdminModules } from './admin/initializer.js';

/**
 * Defines section handlers for the admin role.
 * @param {string} context - The context or module name.
 * @returns {Object} Section handlers for admin sections.
 */
function defineAdminSectionHandlers(context) {
    log(context, 'Defining section handlers for admin role');
    return {
        info: (show) => {
            const infoSection = document.getElementById('info');
            if (infoSection) {
                infoSection.style.display = show ? 'block' : 'none';
                const userIdInput = document.getElementById('userId');
                if (userIdInput && document.getElementById('user-contact-name')) {
                    document.getElementById('user-contact-name').innerText = userIdInput.value;
                }
            } else {
                log(context, 'Warning: info section not found', 'warn');
            }
        },
        userManagementIntro: (show) => {
            const section = document.getElementById('userManagementIntro');
            if (section) {
                section.style.display = show ? 'block' : 'none';
            } else {
                log(context, 'Warning: userManagementIntro section not found', 'warn');
            }
        },
        user_management: (show) => {
            const section = document.getElementById('user_management');
            if (section) {
                section.style.display = show ? 'block' : 'none';
            } else {
                log(context, 'Warning: user_management section not found', 'warn');
            }
        },
        deals: (show) => {
            const section = document.getElementById('deals');
            if (section) {
                section.style.display = show ? 'block' : 'none';
            } else {
                log(context, 'Warning: deals section not found', 'warn');
            }
        },
        testScriptsIntro: (show) => {
            const section = document.getElementById('testScriptsIntro');
            if (section) {
                section.style.display = show ? 'block' : 'none';
            } else {
                log(context, 'Warning: testScriptsIntro section not found', 'warn');
            }
        },
        referralTestsIntro: (show) => {
            const section = document.getElementById('referralTestsIntro');
            if (section) {
                section.style.display = show ? 'block' : 'none';
            } else {
                log(context, 'Warning: referralTestsIntro section not found', 'warn');
            }
        },
        page_visit_test: (show) => {
            const section = document.getElementById('page_visit_test');
            if (section) {
                section.style.display = show ? 'block' : 'none';
            } else {
                log(context, 'Warning: page_visit_test section not found', 'warn');
            }
        },
        order_test: (show) => {
            const section = document.getElementById('order_test');
            if (section) {
                section.style.display = show ? 'block' : 'none';
            } else {
                log(context, 'Warning: order_test section not found', 'warn');
            }
        },
        test_partner: (show) => {
            const section = document.getElementById('test_partner');
            if (section) {
                section.style.display = show ? 'block' : 'none';
            } else {
                log(context, 'Warning: test_partner section not found', 'warn');
            }
        },
        test_merchant: (show) => {
            const section = document.getElementById('test_merchant');
            if (section) {
                section.style.display = show ? 'block' : 'none';
            } else {
                log(context, 'Warning: test_merchant section not found', 'warn');
            }
        },
        test_community: (show) => {
            const section = document.getElementById('test_community');
            if (section) {
                section.style.display = show ? 'block' : 'none';
            } else {
                log(context, 'Warning: test_community section not found', 'warn');
            }
        },
        api_keys: (show) => {
            const section = document.getElementById('api_keys');
            if (section) {
                section.style.display = show ? 'block' : 'none';
            } else {
                log(context, 'Warning: api_keys section not found', 'warn');
            }
        },
        site_settings: (show) => {
            const section = document.getElementById('site_settings');
            if (section) {
                section.style.display = show ? 'block' : 'none';
            } else {
                log(context, 'Warning: site_settings section not found', 'warn');
            }
        },
        settings: (show) => {
            const section = document.getElementById('settings');
            if (section) {
                section.style.display = show ? 'block' : 'none';
            } else {
                log(context, 'Warning: settings section not found', 'warn');
            }
        },
        my_account: (show) => {
            const section = document.getElementById('my-account');
            if (section) {
                section.style.display = show ? 'block' : 'none';
            } else {
                log(context, 'Warning: my-account section not found', 'warn');
            }
        },
        contact_details: (show) => {
            const section = document.getElementById('contact-details');
            if (section) {
                section.style.display = show ? 'block' : 'none';
            } else {
                log(context, 'Warning: contact-details section not found', 'warn');
            }
        },
        change_password: (show) => {
            const section = document.getElementById('change-password');
            if (section) {
                section.style.display = show ? 'block' : 'none';
            } else {
                log(context, 'Warning: change-password section not found', 'warn');
            }
        }
    };
}

/**
 * Initializes the admin page.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializeAdminPage(context) {
    log(context, 'Initializing admin page');
    const pageType = parsePageType(context, 'page', 'info'); // Default to 'info' for admin
    log(context, `Parsed page type: ${pageType}`);

    // Ensure admin role and menu are defined
    const role = 'admin';
    const menu = ROLES.admin?.menu || [];
    if (!menu.length) {
        log(context, 'Error: Admin menu not defined', 'error');
        return;
    }
    log(context, 'Menu retrieved for role admin:', menu);

    // Define section handlers
    const sectionHandlers = defineAdminSectionHandlers(context);
    log(context, 'Section handlers defined:', Object.keys(sectionHandlers));

    // Initialize navigation
    await initializeRoleNavigation(role, menu, sectionHandlers, pageType);
    log(context, 'Navigation initialized for admin role');

    // Initialize admin-specific modules
    await initializeAdminModules(context);
    log(context, 'Admin modules initialized');

    // Setup admin-specific events
    await setupAdminEvents(context);
    log(context, 'Admin events setup');

    // Show layout and hide overlay
    const layoutWrapper = document.querySelector('.layout-wrapper');
    if (layoutWrapper) {
        layoutWrapper.style.display = 'block';
        log(context, 'Layout wrapper displayed');
    } else {
        log(context, 'Warning: Layout wrapper not found', 'warn');
    }
    await hideOverlay();
    log(context, 'Loading overlay hidden');
}

/**
 * Initializes the admin-page module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} AdminPage instance with public methods.
 */
export function initializeAdminPageModule(registry) {
    const context = 'admin-page.js';
    log(context, 'Initializing admin-page module for module registry');
    return {
        initializeAdminPage: ctx => initializeAdminPage(ctx || context),
    };
}

// Initialize module with lifecycle logging
withScriptLogging(context, async () => {
    log(context, 'Starting module initialization');
    await initializeAdminPage(context);
    log(context, 'Module initialized');
});