// /static/js/admin/initializer.js
// Purpose: Coordinates initialization of admin feature-specific orchestrators.

import { log } from '../core/logger.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { initializeDealsOrchestrator } from './deals-orchestrator.js';
import { initializeUsersOrchestrator } from './users-orchestrator.js';
import { initializeSettingsOrchestrator } from './settings-orchestrator.js';

/**
 * Initializes admin feature orchestrators for deals, users, and settings.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializeAdminModules(context) {
  log(context, 'Initializing admin feature orchestrators');

  const orchestrators = [
    { name: 'deals', init: initializeDealsOrchestrator },
    { name: 'users', init: initializeUsersOrchestrator },
    { name: 'settings', init: initializeSettingsOrchestrator },
  ];

  for (const { name, init } of orchestrators) {
    await withErrorHandling(`${context}:initialize${name}`, async () => {
      await init(context);
    }, ERROR_MESSAGES.MODULE_INIT_FAILED);
  }
}

/**
 * Initializes the initializer module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Initializer instance with public methods.
 */
export function initializeInitializerModule(registry) {
  return createModuleInitializer('initializer.js', {
    initializeAdminModules,
  });
}

// Initialize module with lifecycle logging
const context = 'initializer.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});