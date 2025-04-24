// /static/js/admin/settings-orchestrator.js
// Purpose: Orchestrates settings feature initialization for affiliates, site settings, and API keys in the admin interface.

import { log } from '../core/logger.js';
import { loadAdminSettings } from './settings.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { createModuleInitializer } from '../utils/initialization.js';

/**
 * Initializes the settings feature for affiliates, site settings, and API keys.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializeSettingsOrchestrator(context) {
  log(context, 'Initializing settings orchestrator');
  const settingsTypes = ['affiliates', 'siteSettings', 'apiKeys'];
  for (const type of settingsTypes) {
    await withErrorHandling(`${context}:initialize${type}`, async () => {
      await loadAdminSettings(context, type);
    }, ERROR_MESSAGES.MODULE_INIT_FAILED);
  }
}

/**
 * Initializes the settings orchestrator module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Settings orchestrator instance with public methods.
 */
export function initializeSettingsOrchestratorModule(registry) {
  return createModuleInitializer('settings-orchestrator.js', {
    initializeSettingsOrchestrator,
  });
}

// Initialize module with lifecycle logging
const context = 'settings-orchestrator.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});