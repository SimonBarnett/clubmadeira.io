// /static/js/community/community-providers.js
// Purpose: Initializes the community providers sub-page.

import { log } from '../core/logger.js';
import { withErrorHandling } from '../utils/error.js';
import { withAuthenticatedUser } from '../utils/auth.js';
import { ERROR_MESSAGES } from '../config/constants.js';
import { initializeProvidersPage } from './providers-page.js';
import { setupCategoriesNavigation } from './categories-navigation.js';
import { setupCollapsibleSections } from '../utils/dom-manipulation.js'; // Added for collapsible sections
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Initializes the community providers page.
 * @param {string} context - The context or module name.
 * @returns {void}
 */
export function initializeProviders(context) {
  log(context, 'Initializing providers page');
  withErrorHandling(`${context}:initializeProviders`, () => {
    withAuthenticatedUser(async userId => {
      const userIdInput = document.getElementById('userId');
      if (userIdInput) userIdInput.value = userId;
      setupCategoriesNavigation(context, 'community', 'providers');
      initializeProvidersPage(context);
      setupCollapsibleSections(context); // Replaced window.setupCollapsibleSections
    });
  }, ERROR_MESSAGES.FETCH_FAILED('providers page initialization'));
}

/**
 * Initializes the community providers module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Community providers instance with public methods.
 */
export function initializeCommunityProvidersModule(registry) {
  const context = 'community-providers.js';
  log(context, 'Initializing community providers module for module registry');
  return {
    initializeProviders: (ctx) => initializeProviders(ctx),
  };
}

// Initialize module with lifecycle logging
const context = 'community-providers.js';
withScriptLogging(context, () => {
  initializeProviders(context);
});