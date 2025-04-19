// /static/js/merchant/navigation.js
import { log } from '../core/logger.js';
import { defineSectionHandlers } from '../modules/navigation.js';
import { loadApiKeys } from './api-keys.js';
import { loadProducts } from './products.js';
import { loadUserSettings } from './user-settings.js';
import { renderDocumentation } from './documentation.js';
import { withScriptLogging } from '../utils/initialization.js';
import { toggleViewState } from '../utils/dom-manipulation.js';

/**
 * Defines section handlers for the merchant page.
 * @param {string} context - The context or module name.
 * @returns {void}
 */
export function defineMerchantSectionHandlers(context) {
  log(context, 'Defining merchant section handlers');
  defineSectionHandlers(context, 'merchant', [
    {
      id: 'info',
      handler: async () => {
        log(context, 'Loading info section');
        toggleViewState(context, { info: true });
      },
    },
    {
      id: 'api_keys',
      handler: async () => {
        log(context, 'Loading API keys section');
        await loadApiKeys(context);
      },
    },
    {
      id: 'products',
      handler: async () => {
        log(context, 'Loading products section');
        await loadProducts(context);
      },
    },
    {
      id: 'user_settings',
      handler: async () => {
        log(context, 'Loading user settings section');
        await loadUserSettings(context);
      },
    },
    {
      id: 'documentation',
      handler: async () => {
        log(context, 'Loading documentation section');
        await renderDocumentation(context, '/docs/merchant.md', 'documentationContent');
      },
    },
    {
      id: 'store-request',
      handler: async () => {
        log(context, 'Loading store request section');
        await import('../modules/site-request.js').then(m => m.initializeSiteRequest(context, 'store-request'));
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
    defineMerchantSectionHandlers: ctx => defineMerchantSectionHandlers(ctx),
  };
}

// Initialize module with lifecycle logging
const context = 'navigation.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});