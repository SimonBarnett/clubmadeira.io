// /static/js/community/providers-page.js
// Purpose: Orchestrates the community providers sub-page.

import { log } from '../core/logger.js';
import { withErrorHandling } from '../utils/error.js';
import { withAuthenticatedUser } from '../utils/auth.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { loadClientApiSettings } from './providers-data.js';
import { renderProviderSettings } from './providers-events.js';
import { setupCategoriesNavigation } from './categories-navigation.js';
import { setupCollapsibleSections } from '../utils/dom-manipulation.js';
import { initializeTinyMCE } from '../core/mce.js';
import { withScriptLogging } from '../utils/logging-utils.js';

/**
 * Initializes the community providers page.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializeProvidersPage(context) {
  log(context, 'Initializing providers page');
  await withAuthenticatedUser(async userId => {
    await withErrorHandling(`${context}:initializeProvidersPage`, async () => {
      await setupCategoriesNavigation(context, 'community', 'providers');
      const userIdInput = document.getElementById('userId');
      if (userIdInput) userIdInput.value = userId;
      const settings = await loadClientApiSettings(context);
      await renderProviderSettings(context, settings, 'providerIconsBar');
      setupCollapsibleSections(context);
      await initializeTinyMCE(context, '#aboutCommunity, #stylingDetails, #page1Content');
    }, ERROR_MESSAGES.FETCH_FAILED('providers page initialization'));
  });
}

/**
 * Initializes the providers page module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Providers page instance with public methods.
 */
export function initializeProvidersPageModule(registry) {
  const context = 'providers-page.js';
  log(context, 'Initializing providers page module for module registry');
  return {
    initializeProvidersPage: (ctx) => initializeProvidersPage(ctx),
  };
}

// Initialize module with lifecycle logging
const context = 'providers-page.js';
withScriptLogging(context, () => {
  initializeProvidersPage(context);
});