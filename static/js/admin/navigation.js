// /static/js/admin/navigation.js
import { log } from '../core/logger.js';
import { defineSectionHandlers } from '../modules/navigation.js';
import { loadDeals } from './deals.js';
import { initializeUserManagement } from './users-orchestrator.js';
import { loadAdminSettings } from './settings.js';
import { initializeAdminModules } from './initializer.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { toggleViewState } from '../utils/dom-manipulation.js';

/**
 * Defines section handlers for the admin page.
 * @param {string} context - The context or module name.
 * @returns {void}
 */
export function defineAdminSectionHandlers(context) {
  log(context, 'Defining section handlers');
  defineSectionHandlers(context, 'admin', [
    {
      id: 'info',
      handler: async () => {
        log(context, 'Loading info section');
        toggleViewState(context, { info: true });
      },
    },
    {
      id: 'user_management',
      handler: async (role) => {
        log(context, `Calling initializeUserManagement for role: ${role}`);
        await initializeUserManagement(context, role || 'admin');
      },
    },
    {
      id: 'affiliates',
      handler: async () => {
        log(context, 'Calling loadAdminSettings for affiliates');
        await loadAdminSettings(context, 'affiliates');
      },
    },
    {
      id: 'site_settings',
      handler: async () => {
        log(context, 'Calling initializeAdminModules');
        await initializeAdminModules(context);
      },
    },
    {
      id: 'api_keys',
      handler: async () => {
        log(context, 'Calling loadAdminSettings for apiKeys');
        await loadAdminSettings(context, 'apiKeys');
      },
    },
    {
      id: 'deals',
      handler: async () => {
        log(context, 'Calling loadDeals');
        const elements = await import('../utils/dom-manipulation.js').then(m => m.getElements(context, ['dealList']));
        await loadDeals(context, elements);
      },
    },
  ]);
}

/**
 * Initializes the navigation module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Navigation instance with public methods.
 */
export function initializeNavigationModule(registry) {
  const context = 'navigation.js';
  log(context, 'Initializing navigation module for module registry');
  return {
    defineAdminSectionHandlers: ctx => defineAdminSectionHandlers(ctx),
  };
}

// Initialize module with lifecycle logging
const context = 'navigation.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});