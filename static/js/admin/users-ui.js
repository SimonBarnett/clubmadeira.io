// /static/js/admin/users-ui.js
// Purpose: Manages UI rendering for user management in the admin interface.

import { log, warn } from '../core/logger.js';
import { toggleViewState } from '../utils/dom-manipulation.js';
import { success, error as notifyError } from '../core/notifications.js';
import { renderCheckboxList, renderDataTable, renderModal } from '../utils/ui-components.js';
import { ROLES, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Renders user data in a table.
 * @param {string} context - The context or module name.
 * @param {Object} userData - The user data to render, containing users and role.
 * @param {Object} elements - DOM elements configuration object.
 * @param {HTMLElement} elements.userManagement - The user management section element.
 * @param {HTMLElement} elements.userList - The table body element to render into.
 * @returns {Promise<void>}
 */
export async function renderUsersTable(context, { users, role }, { userManagement, userList }) {
  log(context, `Rendering users for role: ${role}`);
  if (userList.tagName.toLowerCase() !== 'tbody') {
    throw new Error(ERROR_MESSAGES.INVALID_TABLE_BODY);
  }

  const parentTable = userList.closest('table');
  if (!parentTable) {
    throw new Error(ERROR_MESSAGES.TABLE_NOT_FOUND);
  }

  if (!users || users.length === 0) {
    warn(context, `No users found for role ${role}`);
    userList.innerHTML = renderDataTable(context, {
      data: [],
      headers: [],
      rowMapper: () => ['No users found'],
      emptyMessage: ERROR_MESSAGES.USERS_NO_DATA,
    });
    success(context, ERROR_MESSAGES.USERS_NO_DATA);
    return;
  }

  const allowedPermissions = ROLES[role]?.permissions || [];
  const headers = ['ID', 'Name', 'Website', 'Email', 'Phone', 'Permissions', 'Actions'];
  const rowMapper = (user) => {
    const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];
    const permissionsContainer = renderCheckboxList(context, {
      items: allowedPermissions,
      name: 'permissions',
      selected: userPermissions,
      dataAttributes: { userId: user.userId, role },
      containerClass: 'permissions-list',
    }).outerHTML;
    return [
      user.userId,
      user.contactName || '',
      user.websiteUrl || '',
      user.emailAddress || '',
      user.phoneNumber || '',
      permissionsContainer,
      `<button class="modify-permissions" data-userId="${user.userId}" data-role="${role}">Modify Permissions</button>`,
    ];
  };

  userList.innerHTML = renderDataTable(context, {
    data: users,
    headers,
    rowMapper,
    emptyMessage: ERROR_MESSAGES.USERS_NO_DATA,
  });

  if (userList.children.length === 0) {
    warn(context, 'Table body empty after rendering');
    userList.innerHTML = renderDataTable(context, {
      data: [],
      headers: [],
      rowMapper: () => [ERROR_MESSAGES.USERS_RENDER_FAILED],
      emptyMessage: ERROR_MESSAGES.USERS_RENDER_FAILED,
    });
    notifyError(context, ERROR_MESSAGES.USERS_RENDER_FAILED);
  } else {
    log(context, `Successfully rendered ${userList.children.length} users`);
    success(context, SUCCESS_MESSAGES.USERS_RENDERED);
  }
}

/**
 * Renders a permissions modification modal.
 * @param {string} context - The context or module name.
 * @param {string} userId - The user ID.
 * @param {Object} userData - The user data containing permissions.
 * @param {string} role - The user role.
 * @param {string} [formId='permissionsForm'] - The ID of the form in the modal.
 * @returns {Promise<HTMLElement>} The rendered modal element.
 */
export async function renderPermissionsModal(context, userId, userData, role, formId = 'permissionsForm') {
  log(context, `Rendering modal for user ${userId} with role ${role}`);
  const allowedPermissions = ROLES[role]?.permissions || [];
  const currentPermissions = Array.isArray(userData.permissions) ? userData.permissions : [];

  const checkboxList = renderCheckboxList(context, {
    items: allowedPermissions,
    name: 'permissions',
    selected: currentPermissions,
    containerClass: 'permissions-checkboxes',
  }).outerHTML;

  const modal = await renderModal(context, {
    id: `permissionsModal-${userId}`,
    title: `Modify Permissions for User ${userId}`,
    content: checkboxList,
    formId,
    buttons: [
      { type: 'submit', text: 'Save', className: 'save' },
      { type: 'button', text: 'Cancel', className: 'cancel', onclick: 'this.closest(".modal").remove()' },
    ],
  });

  return modal;
}

/**
 * Initializes the users UI module for use with the module registry.
 * @param {Object} registry - The cdecl module registry instance.
 * @returns {Object} Users UI instance with public methods.
 */
export function initializeUsersUiModule(registry) {
  const context = 'users-ui.js';
  log(context, 'Initializing users UI module for module registry');
  return {
    renderUsersTable: (ctx, ...args) => renderUsersTable(ctx, ...args),
    renderPermissionsModal: (ctx, ...args) => renderPermissionsModal(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'users-ui.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});