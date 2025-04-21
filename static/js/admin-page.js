// /static/js/admin-page.js
// Purpose: Orchestrates the admin page, coordinating navigation, events, and module initialization.
const context = 'admin-page.js';
import { log } from './core/logger.js';
import { parsePageType, initializeRolePage } from './utils/initialization.js';
import { defineAdminSectionHandlers } from './admin/navigation.js';
import { setupAdminEvents } from './admin/admin-events.js';
import { initializeAdminModules } from './admin/initializer.js';
import { withScriptLogging ,hideOverlay} from './utils/initialization.js';

/**
 * Initializes the admin page.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializeAdminPage(context) {
  log(context, 'Initializing admin page');
  const pageType = parsePageType(context, 'page', 'deals');
  await initializeRolePage(context, 'admin', pageType, async () => {
    defineAdminSectionHandlers(context);
    initializeAdminModules(context);
    setupAdminEvents(context);
  });
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
    initializeAdminPage: ctx => initializeAdminPage(ctx),
  };
}

// Initialize module with lifecycle logging
withScriptLogging(context, async () => {
    log(context, 'Module initialized');
    await initializeLoginPage({ registry: new Map() });
    hideOverlay();
});