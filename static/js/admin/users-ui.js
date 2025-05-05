import { log, warn, error as logError } from '../core/logger.js';
import { toggleViewState } from '../utils/dom-manipulation.js';
import { success, error } from '../core/notifications.js';
import { renderCheckboxList, renderDataTable, renderModal } from '../utils/ui-components.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../config/constants.js';
import { ROLES } from '../config/roles.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { loadUsers } from './users-data.js';
import { parsePageType, shouldInitializeForPageType } from '../utils/initialization.js';

const context = 'users-ui.js';

export async function renderRoleIcons(context) {
    const pageType = await parsePageType(context, 'page', 'admin');
    if (pageType !== 'admin') {
        log(context, `Skipping initialization for non-admin page type: ${pageType}`);
        return;
    }
    log(context, 'Rendering role icons for user management');
    const roles = [
        { name: 'admin', icon: 'fa-solid fa-headset', label: 'Admin' },
        { name: 'community', icon: 'fa-solid fa-people-group', label: 'Community' },
        { name: 'merchant', icon: 'fa-solid fa-user-tie', label: 'Merchant' },
        { name: 'partner', icon: 'fa-solid fa-palette', label: 'Partner' }
    ];
    const roleIconsContainer = document.getElementById('user_role_icon');
    if (!roleIconsContainer) {
        logError(context, 'User role icon container (user_role_icon) not found');
        error(context, 'User role icon container not found');
        return;
    }
    const roleTitleElement = document.getElementById('user_role_title');
    if (!roleTitleElement) {
        logError(context, 'User role title element (user_role_title) not found');
        error(context, 'User role title element not found');
        return;
    }
    roleIconsContainer.innerHTML = '';
    roles.forEach((role, index) => {
        const icon = document.createElement('i');
        icon.className = `${role.icon} affiliate-icon`;
        Object.assign(icon.style, {
            width: '24px',
            height: '24px',
            display: 'inline-block',            
            cursor: 'pointer'
        });
        icon.dataset.role = role.name;
        if (index === 0) icon.classList.add('selected');
        icon.addEventListener('click', async (event) => {
            event.preventDefault(); // Prevent any default behavior that might hide the section
            roleIconsContainer.querySelectorAll('.affiliate-icon').forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
            roleTitleElement.textContent = role.label;
            const userData = await loadUsers(context, role.name);
            await renderUsersTable(context, userData, { 
                userManagement: document.getElementById('user_management'), 
                userList: document.getElementById('user_list') 
            });
            // Ensure the user_management section remains visible
            document.getElementById('user_management').style.display = 'block';
        });
        roleIconsContainer.appendChild(icon);
    });
    if (roles.length > 0) {
        const firstRole = roles[0];
        roleTitleElement.textContent = firstRole.label;
        const userData = await loadUsers(context, firstRole.name);
        await renderUsersTable(context, userData, { 
            userManagement: document.getElementById('user_management'), 
            userList: document.getElementById('user_list') 
        });
        // Ensure the user_management section remains visible on initial load
        document.getElementById('user_management').style.display = 'block';
    }
}

export async function renderUsersTable(context, { users, role }, { userManagement, userList }) {
    log(context, `Rendering users for role: ${role}`);
    if (!userList || userList.tagName.toLowerCase() !== 'tbody') {
        logError(context, 'Invalid table body element (userList)');
        throw new Error(ERROR_MESSAGES.INVALID_TABLE_BODY);
    }
    const parentTable = userList.closest('table');
    if (!parentTable) {
        logError(context, 'Parent table not found for userList');
        throw new Error(ERROR_MESSAGES.TABLE_NOT_FOUND);
    }
    toggleViewState(context, { userManagement: true });
    if (!users || !Array.isArray(users) || users.length === 0) {
        warn(context, `No users found for role ${role}`);
        userList.innerHTML = `<tr><td colspan="7">No users available for role ${role}. Please check the user database or contact support.</td></tr>`;
        log(context, 'Logging API response for debugging: /users/admin');
        const userData = await loadUsers(context, 'admin');
        log(context, `API response for /users/admin:`, userData);
        return;
    }
    const allowedPermissions = ROLES[role]?.permissions || [];
    const headers = ['ID', 'Name', 'Website', 'Email', 'Phone', 'Permissions', 'Actions'];
    const rowMapper = async (user) => {
        const normalizedUser = {
            userId: user.USERid || user.userId || 'N/A',
            contactName: user.contact_name || user.contactName || 'N/A',
            websiteUrl: user.website_url || user.websiteUrl || 'N/A',
            emailAddress: user.email_address || user.emailAddress || 'N/A',
            phoneNumber: user.phone_number || user.phoneNumber || 'N/A',
            permissions: Array.isArray(user.permissions) ? user.permissions : [],
        };
        const userPermissions = normalizedUser.permissions;
        const permissionsContainer = await renderCheckboxList(context, {
            items: allowedPermissions.map(perm => ({ value: perm, label: perm })),
            name: `permissions-${normalizedUser.userId}`,
            selected: userPermissions,
            dataAttributes: { userId: normalizedUser.userId, role },
            containerClass: 'permissions-list',
        });
        const modifyButton = document.createElement('button');
        modifyButton.className = 'modify-permissions';
        modifyButton.dataset.userId = normalizedUser.userId;
        modifyButton.dataset.role = role;
        modifyButton.textContent = 'Modify Permissions';
        return [
            normalizedUser.userId,
            normalizedUser.contactName,
            normalizedUser.websiteUrl,
            normalizedUser.emailAddress,
            normalizedUser.phoneNumber,
            permissionsContainer,
            modifyButton,
        ];
    };
    const tbody = await renderDataTable(context, {
        data: users,
        headers,
        rowMapper,
        emptyMessage: `No users available for role ${role}.`,
    });
    userList.innerHTML = '';
    while (tbody.firstChild) {
        userList.appendChild(tbody.firstChild);
    }
    if (userList.children.length === 0) {
        warn(context, 'Table body empty after rendering');
        userList.innerHTML = `<tr><td colspan="7">${ERROR_MESSAGES.USERS_RENDER_FAILED}</td></tr>`;
        error(context, ERROR_MESSAGES.USERS_RENDER_FAILED);
    } else {
        log(context, `Successfully rendered ${users.length} users for role ${role}`);
        //success(context, SUCCESS_MESSAGES.USERS_RENDERED);
    }
}

export async function renderPermissionsModal(context, userId, userData, role, formId = 'permissionsForm') {
    log(context, `Rendering modal for user ${userId} with role ${role}`);
    const allowedPermissions = ROLES[role]?.permissions || [];
    const currentPermissions = Array.isArray(userData.permissions) ? userData.permissions : [];
    const checkboxList = await renderCheckboxList(context, {
        items: allowedPermissions.map(perm => ({ value: perm, label: perm })),
        name: 'permissions',
        selected: currentPermissions,
        dataAttributes: { userId, role },
        containerClass: 'permissions-checkboxes',
    });
    const modal = await renderModal(context, {
        id: `permissionsModal-${userId}`,
        title: `Modify Permissions for User ${userId} (${role})`,
        content: checkboxList,
        formId,
        buttons: [
            { type: 'submit', text: 'Save', className: 'save' },
            { type: 'button', text: 'Cancel', className: 'cancel', onclick: 'this.closest(".modal").remove()' },
        ],
    });
    return modal;
}

export function initializeUsersUiModule(registry) {
    log(context, 'Initializing users UI module for module registry');
    return {
        renderRoleIcons: (ctx) => renderRoleIcons(ctx),
        renderUsersTable: (ctx, ...args) => renderUsersTable(ctx, ...args),
        renderPermissionsModal: (ctx, ...args) => renderPermissionsModal(ctx, ...args),
    };
}

if (shouldInitializeForPageType('admin')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-admin page');
}