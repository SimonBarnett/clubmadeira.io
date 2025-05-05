// /static/js/modules/pageSetup.js
// Purpose: Provides utilities for setting up page-specific configurations and navigation.

import { log } from '../core/logger.js';
import { parsePageType } from '../utils/initialization.js';
import { withAuthenticatedUser } from '../core/auth.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from '../utils/logging-utils.js';

/**
 * Sets up a page with role-based navigation and user authentication.
 * @param {string} context - The context or module name.
 * @param {string} role - The role associated with the page (e.g., 'admin', 'merchant').
 * @param {string} defaultSection - The default section to show.
 * @param {Function} setupCallback - Callback to execute after setup.
 * @returns {Promise<void>}
 */
export async function setupPage(context, role, defaultSection, setupCallback) {
  log(context, `Setting up page for role: ${role}, default section: ${defaultSection}`);
  await withAuthenticatedUser(async userId => {
    await withErrorHandling(`${context}:setupPage`, async () => {
      const userIdInput = document.getElementById('userId');
      if (userIdInput) userIdInput.value = userId;
      await setupCallback();
      window.setupCollapsibleSections?.();
    }, ERROR_MESSAGES.MODULE_INIT_FAILED);
  });
}

/**
 * Initializes the pageSetup module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} PageSetup instance with public methods.
 */
export function initializePageSetupModule(registry) {
  const context = 'pageSetup.js';
  log(context, 'Initializing pageSetup module for module registry');
  return {
    setupPage: (ctx, ...args) => setupPage(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'pageSetup.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});