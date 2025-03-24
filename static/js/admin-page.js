// admin-page.js
// Purpose: Manages page-specific functionality for the /admin page.

// Initializes the admin page with permission checks.
function initializeAdmin() {
    console.log('initializeAdmin - Initializing admin page');
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('initializeAdmin - No token found, redirecting to /');
        window.location.href = '/';
        return;
    }
    const decoded = decodeJWT(token);
    if (!decoded) {
        console.error('initializeAdmin - Invalid token, redirecting to /');
        window.location.href = '/';
        return;
    }
    window.userPermissions = decoded.permissions || [];
    if (!window.userPermissions.includes('admin')) {
        toastr.error('Permission denied: Admin permission required');
        console.error('initializeAdmin - No admin permission, redirecting to /');
        window.location.href = '/';
        return;
    }
    loadBranding();
    restoreState();
    attachEventListeners();
    console.log('initializeAdmin - Admin page initialized successfully');
}

// Updates affiliate program credentials.
async function updateAffiliate(affiliate) {
    console.log('updateAffiliate - Updating affiliate - Affiliate:', affiliate);
    let credentials = {};
    if (affiliate === 'amazon_uk') {
        credentials = {
            ACCESS_KEY: document.getElementById('amazonAccessKey').value.trim(),
            SECRET_KEY: document.getElementById('amazonSecretKey').value.trim(),
            ASSOCIATE_TAG: document.getElementById('amazonAssociateTag').value.trim(),
            COUNTRY: document.getElementById('amazonCountry').value.trim()
        };
    } else if (affiliate === 'ebay_uk') {
        credentials = { APP_ID: document.getElementById('ebayAppId').value.trim() };
    } else if (affiliate === 'awin') {
        credentials = { API_TOKEN: document.getElementById('awinApiToken').value.trim() };
    } else if (affiliate === 'cj') {
        credentials = {
            API_KEY: document.getElementById('cjApiKey').value.trim(),
            WEBSITE_ID: document.getElementById('cjWebsiteId').value.trim()
        };
    } else if (affiliate === 'textmagic') {
        credentials = {
            USERNAME: document.getElementById('textmagicUsername').value.trim(),
            API_KEY: document.getElementById('textmagicApiKey').value.trim()
        };
    } else if (affiliate === 'tiny') {
        credentials = { API_KEY: document.getElementById('tinyApiKey').value.trim() };
    }

    credentials = Object.fromEntries(Object.entries(credentials).filter(([_, v]) => v !== ''));
    if (Object.keys(credentials).length === 0) {
        console.warn('updateAffiliate - No changes to update');
        toastr.warning('No changes to update');
        return;
    }

    try {
        console.log('updateAffiliate - Sending update - URL:', `${window.apiUrl}/config/${affiliate}`);
        const response = await authenticatedFetch(`${window.apiUrl}/config/${affiliate}`, {
            method: 'PATCH',
            body: JSON.stringify(credentials)
        });
        if (!response.ok) throw new Error(`Failed to update: ${response.status}`);
        const data = await response.json();
        console.log('updateAffiliate - Update successful - Response:', JSON.stringify(data));
        toastr.success(`Update successful: ${data.message}`);
    } catch (error) {
        console.error('updateAffiliate - Error updating affiliate - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error updating credentials: ${error.message}`);
    }
}

// Submits referral form data (page visits or orders).
async function submitReferral(formId, successMessage) {
    console.log('submitReferral - Setting up referral submission - Form ID:', formId);
    const form = document.getElementById(formId);
    if (form.dataset.listenerAdded) return;
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('submitReferral - Form submitted - Form ID:', formId);
        const formData = new FormData(form);
        const jsonData = Object.fromEntries(formData.entries());
        try {
            console.log('submitReferral - Sending referral data - URL:', `${window.apiUrl}/referal`);
            const response = await authenticatedFetch(`${window.apiUrl}/referal`, {
                method: 'POST',
                body: JSON.stringify(jsonData),
            });
            if (!response.ok) throw new Error((await response.json()).message || 'Unknown error');
            const data = await response.json();
            if (data.status === 'success') {
                console.log('submitReferral - Referral recorded - Referer:', data.referer);
                toastr.success(`${successMessage} - Referer: ${data.referer}`);
            } else {
                throw new Error(data.message || 'Unknown error');
            }
        } catch (error) {
            console.error('submitReferral - Error submitting referral - Error:', error.message, 'Stack:', error.stack);
            toastr.error(error.message || 'Failed to connect to server');
        }
    });
    form.dataset.listenerAdded = 'true';
    console.log('submitReferral - Listener added - Form ID:', formId);
}

// Populates the referer dropdown with community users.
async function populateRefererDropdown(selectId) {
    console.log('populateRefererDropdown - Populating dropdown - Select ID:', selectId);
    try {
        const usersResponse = await authenticatedFetch(`${window.apiUrl}/users`);
        if (!usersResponse.ok) throw new Error(`Failed to fetch users: ${usersResponse.status}`);
        const usersData = await usersResponse.json();
        const users = usersData.users;
        console.log('populateRefererDropdown - Users fetched - Count:', users.length);

        const communityUsers = [];
        for (const user of users) {
            const userResponse = await authenticatedFetch(`${window.apiUrl}/users/${user.USERid}`);
            if (!userResponse.ok) continue;
            const userData = await userResponse.json();
            const permissions = userData.user.permissions || [];
            if (permissions.includes('community') && !permissions.includes('admin')) {
                communityUsers.push({ USERid: user.USERid, contact_name: user.contact_name });
            }
        }
        console.log('populateRefererDropdown - Community users filtered - Count:', communityUsers.length);

        const select = document.getElementById(selectId);
        select.innerHTML = '';
        communityUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user.USERid;
            option.text = user.contact_name;
            select.appendChild(option);
        });
        if (communityUsers.length === 0) {
            select.innerHTML = '<option value="">No community users found</option>';
        }
        console.log('populateRefererDropdown - Dropdown populated - Select ID:', selectId);
    } catch (error) {
        console.error('populateRefererDropdown - Error loading referer options - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error loading referer options: ${error.message}`);
        document.getElementById(selectId).innerHTML = '<option value="">Error loading users</option>';
    }
}

// Loads and displays merchant users.
async function loadMerchants() {
    console.log('loadMerchants - Loading merchants');
    try {
        const usersResponse = await authenticatedFetch(`${window.apiUrl}/users`);
        if (!usersResponse.ok) throw new Error(`Failed to fetch users: ${usersResponse.status}`);
        const usersData = await usersResponse.json();
        const users = usersData.users;
        console.log('loadMerchants - Users fetched - Count:', users.length);

        const merchants = [];
        for (const user of users) {
            const userResponse = await authenticatedFetch(`${window.apiUrl}/users/${user.USERid}`);
            if (!userResponse.ok) continue;
            const userData = await userResponse.json();
            const permissions = userData.user.permissions || [];
            if (permissions.includes('merchant') && !permissions.includes('admin')) {
                merchants.push({ USERid: user.USERid, contact_name: user.contact_name, email_address: user.email_address, permissions });
            }
        }
        console.log('loadMerchants - Merchants filtered - Count:', merchants.length);

        updateUserTable('merchantsList', merchants, 'merchants');
        toastr.success('Merchants loaded successfully');
    } catch (error) {
        console.error('loadMerchants - Error loading merchants - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error loading merchants: ${error.message}`);
    }
}

// Loads and displays community users.
async function loadCommunities() {
    console.log('loadCommunities - Loading communities');
    try {
        const usersResponse = await authenticatedFetch(`${window.apiUrl}/users`);
        if (!usersResponse.ok) throw new Error(`Failed to fetch users: ${usersResponse.status}`);
        const usersData = await usersResponse.json();
        const users = usersData.users;
        console.log('loadCommunities - Users fetched - Count:', users.length);

        const communities = [];
        for (const user of users) {
            const userResponse = await authenticatedFetch(`${window.apiUrl}/users/${user.USERid}`);
            if (!userResponse.ok) continue;
            const userData = await userResponse.json();
            const permissions = userData.user.permissions || [];
            if (permissions.includes('community') && !permissions.includes('admin')) {
                communities.push({ USERid: user.USERid, contact_name: user.contact_name, email_address: user.email_address, permissions });
            }
        }
        console.log('loadCommunities - Communities filtered - Count:', communities.length);

        updateUserTable('communitiesList', communities, 'communities');
        toastr.success('Communities loaded successfully');
    } catch (error) {
        console.error('loadCommunities - Error loading communities - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error loading communities: ${error.message}`);
    }
}

// Loads and displays partner users.
async function loadPartners() {
    console.log('loadPartners - Loading partners');
    try {
        const usersResponse = await authenticatedFetch(`${window.apiUrl}/users`);
        if (!usersResponse.ok) throw new Error(`Failed to fetch users: ${usersResponse.status}`);
        const usersData = await usersResponse.json();
        const users = usersData.users;
        console.log('loadPartners - Users fetched - Count:', users.length);

        const partners = [];
        for (const user of users) {
            const userResponse = await authenticatedFetch(`${window.apiUrl}/users/${user.USERid}`);
            if (!userResponse.ok) continue;
            const userData = await userResponse.json();
            const permissions = userData.user.permissions || [];
            if (permissions.includes('wixpro')) {
                partners.push({ USERid: user.USERid, contact_name: user.contact_name, email_address: user.email_address, permissions });
            }
        }
        console.log('loadPartners - Partners filtered - Count:', partners.length);

        updateUserTable('partnersList', partners, 'partners');
        toastr.success('Partners loaded successfully');
    } catch (error) {
        console.error('loadPartners - Error loading partners - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error loading partners: ${error.message}`);
    }
}

// Updates the user table for merchants, communities, or partners.
function updateUserTable(tableId, users, section) {
    console.log('updateUserTable - Updating table - Table ID:', tableId, 'Section:', section, 'User count:', users.length);
    const tbody = document.getElementById(tableId);
    tbody.innerHTML = '';
    if (users.length === 0) {
        const colspan = section === 'communities' ? 3 : 4;
        tbody.innerHTML = `<tr><td colspan="${colspan}">No users found</td></tr>`;
        console.log('updateUserTable - No users found - Table ID:', tableId);
        return;
    }
    users.forEach(user => {
        const row = document.createElement('tr');
        let actionsHtml = '';
        if (section !== 'communities') {
            const hasValidated = user.permissions.includes('validated');
            actionsHtml = `
                <input type="checkbox" ${hasValidated ? 'checked' : ''} 
                    onchange="togglePermission('${user.USERid}', 'validated', '${section}', this.checked)">
                Validated
            `;
            if (section === 'partners') {
                const hasAdmin = user.permissions.includes('admin');
                const hasMerchant = user.permissions.includes('merchant');
                actionsHtml = `
                    <input type="checkbox" ${hasAdmin ? 'checked' : ''} 
                        onchange="togglePermission('${user.USERid}', 'admin', '${section}', this.checked)">
                    Admin
                    <input type="checkbox" ${hasMerchant ? 'checked' : ''} 
                        onchange="togglePermission('${user.USERid}', 'merchant', '${section}', this.checked)">
                    Merchant
                ` + actionsHtml;
            }
        }
        row.innerHTML = `
            <td>${user.USERid}</td>
            <td>${user.contact_name}</td>
            <td>${user.email_address}</td>
            ${section !== 'communities' ? `<td class="action-cell">${actionsHtml}</td>` : ''}
        `;
        tbody.appendChild(row);
    });
    console.log('updateUserTable - Table updated - Table ID:', tableId);
}

// Toggles a user’s permission status.
async function togglePermission(userId, permission, section, isChecked) {
    console.log('togglePermission - Toggling permission - User ID:', userId, 'Permission:', permission, 'Section:', section, 'Checked:', isChecked);
    try {
        const method = isChecked ? 'POST' : 'DELETE';
        const response = await authenticatedFetch(`${window.apiUrl}/permissions/${userId}`, {
            method: method,
            body: JSON.stringify({ permission })
        });
        if (!response.ok) throw new Error(`Failed to ${isChecked ? 'add' : 'remove'} permission: ${response.status}`);
        const data = await response.json();
        console.log('togglePermission - Permission toggled - Response:', JSON.stringify(data));
        toastr.success(data.message || `${isChecked ? 'Added' : 'Removed'} ${permission} permission for user ${userId}`);
        loadSection(section); // Refresh section
    } catch (error) {
        console.error('togglePermission - Error toggling permission - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error: ${error.message}`);
        loadSection(section); // Refresh on error
    }
}

// Creates a deal row for discounted products (admin-specific).
function createDealRow(product) {
    console.log('createDealRow - Creating deal row - Product:', JSON.stringify(product));
    const tr = document.createElement('tr');
    const discountPercent = product.discount_percent || 
        (product.original_price > product.current_price 
            ? ((product.original_price - product.current_price) / product.original_price * 100).toFixed(2) 
            : 'N/A');
    tr.innerHTML = `
        <td>${product.category || 'N/A'}</td>
        <td>${product.title}</td>
        <td><a href="${product.product_url}" target="_blank">Link</a></td>
        <td>${product.current_price}</td>
        <td>${product.original_price}</td>
        <td>${discountPercent}</td>
        <td><img src="${product.image_url}" width="50" onerror="this.src='https://via.placeholder.com/50';"></td>
        <td>${product.QTY || 'N/A'}</td>
    `;
    console.log('createDealRow - Deal row created - Product ID:', product.id || 'N/A');
    return tr;
}