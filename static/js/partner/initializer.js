// /static/js/partner/initializer.js
// Purpose: Initializes partner-specific modules and navigation for the partner page.

import { log } from '../core/logger.js';
import { withAuthenticatedUser } from '../utils/auth.js';
import { withErrorHandling } from '../utils/error.js';
import { definePartnerSectionHandlers } from './navigation.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from '../utils/logging-utils.js';

/**
 * Initializes partner modules and sets up navigation.
 * @param {string} context - The context or module name.
 * @param {string} pageType - The type of page to initialize (e.g., 'integrations').
 * @returns {Promise<void>}
 */
export async function initializePartnerModules(context, pageType) {
  log(context, `Initializing partner modules for page type: ${pageType}`);
  await withAuthenticatedUser(async userId => {
    await withErrorHandling(`${context}:initializePartnerModules`, async () => {
      const userIdInput = document.getElementById('userId');
      if (userIdInput) userIdInput.value = userId;
      definePartnerSectionHandlers(context);
      window.setupCollapsibleSections?.();
    }, ERROR_MESSAGES.MODULE_INIT_FAILED);
  });
}

/**
 * Initializes the initializer module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Initializer instance with public methods.
 */
export function initializeInitializerModule(registry) {
  const context = 'initializer.js';
  log(context, 'Initializing initializer module for module registry');
  return {
    initializePartnerModules: (ctx, ...args) => initializePartnerModules(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'initializer.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});