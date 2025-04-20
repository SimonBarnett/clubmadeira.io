// /static/js/admin/users-orchestrator.js
// Purpose: Orchestrates user management for the admin interface, coordinating data, UI, and events.

import { log } from '../core/logger.js';
import { loadUsers } from './users-data.js';
import { renderUsersTable } from './users-ui.js';
import { setupAdminEvents } from './admin-events.js';
import { getElements } from '../utils/dom-manipulation.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from '../utils/initialization.js';
import { createModuleInitializer } from '../utils/initialization.js';

/**
 * Initializes user management for the admin interface.
 * @param {string} context - The context or module name.
 * @param {string} [role='admin'] - The role to manage users for.
 * @returns {Promise<void>}
 */
export async function initializeUserManagement(context, role = 'admin') {
  log(context, `Initializing user management for role: ${role}`);
  await withErrorHandling(`${context}:initializeUserManagement`, async () => {
    const userData = await loadUsers(context, role);
    const elements = await getElements(context, ['userManagement', 'userList']);
    await renderUsersTable(context, userData, elements);
    setupAdminEvents(context);
  }, ERROR_MESSAGES.MODULE_INIT_FAILED);
}

/**
 * Initializes the users-orchestrator module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} UsersOrchestrator instance with public methods.
 */
export function initializeUsersOrchestratorModule(registry) {
  return createModuleInitializer('users-orchestrator.js', {
    initializeUserManagement,
  });
}

// Initialize module with lifecycle logging
const context = 'users-orchestrator.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});