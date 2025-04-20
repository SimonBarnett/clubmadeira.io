// /static/js/admin/deals-orchestrator.js
// Purpose: Orchestrates deals feature initialization for the admin interface.

import { log } from '../core/logger.js';
import { loadDeals } from './deals.js';
import { getElements } from '../utils/dom-manipulation.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from '../utils/initialization.js';
import { createModuleInitializer } from '../utils/initialization.js';

/**
 * Initializes the deals feature by loading and rendering deals data.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializeDealsOrchestrator(context) {
  log(context, 'Initializing deals orchestrator');
  await withErrorHandling(`${context}:initializeDealsOrchestrator`, async () => {
    const elements = await getElements(context, ['dealList']);
    await loadDeals(context, elements);
  }, ERROR_MESSAGES.MODULE_INIT_FAILED);
}

/**
 * Initializes the deals orchestrator module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Deals orchestrator instance with public methods.
 */
export function initializeDealsOrchestratorModule(registry) {
  return createModuleInitializer('deals-orchestrator.js', {
    initializeDealsOrchestrator,
  });
}

// Initialize module with lifecycle logging
const context = 'deals-orchestrator.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});