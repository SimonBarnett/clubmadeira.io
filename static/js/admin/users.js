// /static/js/admin/users.js
console.log('users.js - Script loaded at:', new Date().toISOString());

const permissionLists = {
    admin: ['admin', 'validated', 'debug'],
    partner: ['partner', 'validated', 'verified'],
    community: ['community', 'validated'],
    merchant: ['merchant', 'validated', 'verified'],
};

export async function loadUserData(role = 'admin') {
    console.log(`loadUserData - Entry point reached for role: ${role} at:`, new Date().toISOString());

    // Retry mechanism to ensure #user_management section and #user_list are available
    let userManagementSection = document.getElementById('user_management');
    let userList = document.getElementById('user_list');
    let attempts = 0;
    const maxAttempts = 10;
    const retryDelay = 100; // 100ms delay between retries

    while ((!userManagementSection || !userList) && attempts < maxAttempts) {
        console.log(`loadUserData - user_management or user_list not found, retrying (${attempts + 1}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        userManagementSection = document.getElementById('user_management');
        userList = document.getElementById('user_list');
        attempts++;
    }

    if (!userManagementSection || !userList) {
        console.error('loadUserData - user_management or user_list element not found after retries', {
            userManagementSection: !!userManagementSection,
            userList: !!userList,
        });
        return;
    }

    console.log('loadUserData - user_management and user_list elements found:', { userManagementSection, userList });

    // Ensure the section is visible
    attempts = 0;
    while (userManagementSection.style.display === 'none' && attempts < maxAttempts) {
        console.log(`loadUserData - user_management section is hidden, retrying (${attempts + 1}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        attempts++;
    }

    if (userManagementSection.style.display === 'none') {
        console.error('loadUserData - user_management section is still hidden after retries');
        return;
    }

    console.log('loadUserData - user_management section is visible');

    // Ensure userList is a tbody within a table
    if (userList.tagName.toLowerCase() !== 'tbody') {
        console.error('loadUserData - user_list is not a tbody element:', userList);
        return;
    }

    const parentTable = userList.closest('table');
    if (!parentTable) {
        console.error('loadUserData - user_list is not inside a table:', userList);
        return;
    }

    // Retry until window.fetchData is available
    attempts = 0;
    while (!window.fetchData && attempts < maxAttempts) {
        console.log(`loadUserData - window.fetchData not available, retrying (${attempts + 1}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        attempts++;
    }

    if (!window.fetchData) {
        console.error('loadUserData - window.fetchData is not available after retries');
        userList.innerHTML = '<tr><td colspan="7">Error: Fetch function not available</td></tr>';
        return;
    }

    try {
        // Use window.fetchData directly instead of dataLoader
        const data = await window.fetchData(`/users/${role}`);
        console.log(`loadUserData - Users fetched for role ${role}:`, data);

        if (data.status === 'error') throw new Error(`Failed to load users for ${role}: ${data.message || 'Unknown error'}`);

        if (!data.users || data.users.length === 0) {
            console.warn(`loadUserData - No users found for role ${role}`);
            userList.innerHTML = '<tr><td colspan="7">No users found</td></tr>';
            return;
        }

        const allowedPermissions = permissionLists[role] || [];
        const html = data.users.map(user => {
            const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];
            const permissionsHtml = allowedPermissions.map(perm => `
                <label class="permission-label">
                    <input type="checkbox" 
                           data-userid="${user.USERid}" 
                           data-permission="${perm}" 
                           data-role="${role}"
                           ${userPermissions.includes(perm) ? 'checked' : ''}>
                    ${perm}
                </label>
            `).join('');
            return `
                <tr data-userid="${user.USERid}">
                    <td>${user.USERid}</td>
                    <td>${user.contact_name || ''}</td>
                    <td>${user.website_url || ''}</td>
                    <td>${user.email_address || ''}</td>
                    <td>${user.phone_number || ''}</td>
                    <td>${permissionsHtml}</td>
                    <td><button class="modify-permissions" data-userid="${user.USERid}" data-role="${role}">Modify Permissions</button></td>
                </tr>
            `;
        }).join('');

        console.log('loadUserData - Generated HTML:', html);
        userList.innerHTML = ''; // Clear existing content
        userList.insertAdjacentHTML('beforeend', html);

        if (userList.children.length === 0) {
            console.warn('loadUserData - Table body is empty after rendering');
            userList.innerHTML = '<tr><td colspan="7">Failed to render users</td></tr>';
        } else {
            console.log(`loadUserData - Successfully rendered ${userList.children.length} users`);
            console.log('loadUserData - Final user_list HTML:', userList.innerHTML);
        }
    } catch (error) {
        console.error('loadUserData - Fetch error:', error.message, error.stack);
        userList.innerHTML = '<tr><td colspan="7">Error loading data: ' + error.message + '</td></tr>';
    }
}

export async function updatePermission(userId, permission, isChecked, role) {
    console.log(`updatePermission - Updating permission ${permission} for user ${userId} (role: ${role}): ${isChecked ? 'add' : 'remove'}`);
    const method = isChecked ? 'PATCH' : 'DELETE';
    try {
        const response = await window.fetchData('/permission', {
            method: method,
            body: JSON.stringify({ USERid: userId, permission: permission }),
        });
        toastr.success(response.message || 'Permission updated');
        if (!isChecked && permission === role) {
            const userRow = document.querySelector(`#user_list tr[data-userid="${userId}"]`);
            if (userRow) userRow.remove();
        }
    } catch (error) {
        window.handleError('updatePermission', error, `Failed to update permission: ${error.message}`);
        const checkbox = document.querySelector(`input[data-userid="${userId}"][data-permission="${permission}"]`);
        if (checkbox) checkbox.checked = !isChecked;
    }
}

export async function modifyPermissions(userId, role) {
    console.log(`modifyPermissions - Modifying permissions for user ${userId} with role ${role}`);
    const allowedPermissions = permissionLists[role] || [];
    try {
        const userData = await window.fetchData(`/users/${userId}`);
        const currentPermissions = Array.isArray(userData.permissions) ? userData.permissions : [];

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Modify Permissions for User ${userId}</h3>
                <form id="permissions-form">
                    ${allowedPermissions.map(perm => `
                        <label>
                            <input type="checkbox" name="${perm}" ${currentPermissions.includes(perm) ? 'checked' : ''}>
                            ${perm}
                        </label>
                    `).join('')}
                    <button type="submit">Save</button>
                    <button type="button" class="cancel">Cancel</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        const form = modal.querySelector('#permissions-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPermissions = Array.from(form.querySelectorAll('input:checked')).map(input => input.name);
            try {
                await window.fetchData(`/users/${userId}/permissions`, {
                    method: 'PATCH',
                    body: JSON.stringify({ permissions: newPermissions }),
                });
                toastr.success('Permissions updated successfully');
                loadUserData(role);
                modal.remove();
            } catch (error) {
                window.handleError('modifyPermissions', error, 'Failed to update permissions');
            }
        });

        modal.querySelector('.cancel').addEventListener('click', () => modal.remove());
    } catch (error) {
        window.handleError('modifyPermissions', error, 'Failed to fetch user data');
    }
}

// Manual trigger for testing
window.loadUserDataManually = async (role) => {
    console.log('loadUserDataManually - Triggered with role:', role);
    await loadUserData(role);
};

console.log('users.js - Script execution completed at:', new Date().toISOString());