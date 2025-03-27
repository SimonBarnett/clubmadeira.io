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
}// category-management.js
// Purpose: Manages treeview functionality for displaying and editing nested category information (used in community.html and admin.html).

// Creates a treeview node for category display with configurable behavior.
function createTreeNode(category, level = 0, isAdmin = false, savedCategories = []) {
    console.log('createTreeNode - Creating node - Category:', JSON.stringify(category), 'Level:', level, 'IsAdmin:', isAdmin);
    const li = document.createElement('li');
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'node';

    const toggle = document.createElement('span');
    toggle.className = 'toggle';
    toggle.setAttribute('data-id', category.id);
    toggle.textContent = '+'; // Default to '+' assuming subcategories may exist
    toggle.addEventListener('click', () => toggleSubcategories(category.id, toggle));

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = category.id;
    if (isAdmin) {
        checkbox.addEventListener('change', () => handleCategorySelection(category.id, checkbox));
    } else {
        checkbox.checked = savedCategories.includes(category.id.toString());
    }

    const span = document.createElement('span');
    span.textContent = `${category.name} (${category.id})`;

    nodeDiv.appendChild(toggle);
    nodeDiv.appendChild(checkbox);
    nodeDiv.appendChild(span);
    li.appendChild(nodeDiv);

    const subUl = document.createElement('ul');
    subUl.className = 'subcategories';
    li.appendChild(subUl);

    console.log('createTreeNode - Node created - Category ID:', category.id);
    return li;
}

// Loads category data for treeview rendering, with options for admin or community context.
async function loadCategories(userId = null, isAdmin = false) {
    console.log('loadCategories - Starting category load - UserID:', userId, 'IsAdmin:', isAdmin);
    let savedCategories = [];
    try {
        console.log('loadCategories - Fetching categories via authenticatedFetch');
        const startTime = Date.now();

        // Load user's saved categories if not admin
        if (!isAdmin && userId) {
            const userResponse = await authenticatedFetch(`${window.apiUrl}/${userId}/mycategories`);
            if (!userResponse.ok) throw new Error(`Failed to fetch user categories: ${userResponse.status}`);
            const userData = await userResponse.json();
            savedCategories = userData.categories || [];
            console.log('loadCategories - Saved categories fetched - Count:', savedCategories.length);
        }

        // Load all categories
        const response = await authenticatedFetch(`${window.apiUrl}/categories`);
        if (!response.ok) throw new Error(`Failed to fetch categories: ${response.status}`);
        const data = await response.json();
        const duration = Date.now() - startTime;
        console.log('loadCategories - Categories fetched - Count:', data.categories?.length, 'Duration:', `${duration}ms`);

        const treeElement = document.getElementById('categoryTree');
        if (!treeElement) {
            console.error('loadCategories - Tree element not found - ID: categoryTree');
            return;
        }
        treeElement.innerHTML = '';
        const ul = document.createElement('ul');

        // Filter top-level categories for community, show all for admin
        const categoriesToRender = isAdmin ? data.categories : data.categories.filter(cat => !cat.parent_id);
        console.log('loadCategories - Categories to render - Count:', categoriesToRender.length);

        categoriesToRender.forEach(category => {
            const node = createTreeNode(category, 0, isAdmin, savedCategories);
            ul.appendChild(node);
        });
        treeElement.appendChild(ul);

        // Reattach listeners for community context
        if (!isAdmin) attachEventListeners();

        console.log('loadCategories - Treeview rendered successfully');
        toastr.success('Categories loaded successfully');
    } catch (error) {
        console.error('loadCategories - Error loading categories - Error:', error.message, 'Stack:', error.stack);
        toastr.error('Failed to load categories');
    }
    console.log('loadCategories - Category load completed');
}

// Toggles visibility of subcategories in treeview and loads them dynamically if needed.
async function toggleSubcategories(categoryId, toggle) {
    console.log('toggleSubcategories - Toggling subcategories - Category ID:', categoryId);
    const li = toggle.closest('li');
    const subUl = li.querySelector('.subcategories');

    if (!subUl) {
        console.error('toggleSubcategories - Subcategories element not found - Category ID:', categoryId);
        return;
    }

    if (subUl.classList.contains('open')) {
        subUl.classList.remove('open');
        toggle.textContent = '+';
        console.log('toggleSubcategories - Subcategories closed - ID:', categoryId);
    } else {
        if (subUl.children.length === 0) {
            try {
                console.log('toggleSubcategories - Fetching subcategories - Parent ID:', categoryId);
                const response = await authenticatedFetch(`${window.apiUrl}/categories?parent_id=${categoryId}`);
                if (!response.ok) throw new Error(`Failed to fetch subcategories: ${response.status}`);
                const data = await response.json();

                if (data.categories && data.categories.length > 0) {
                    data.categories.forEach(cat => {
                        const node = createTreeNode(cat, 1); // Level 1 for subcategories
                        subUl.appendChild(node);
                    });
                    console.log('toggleSubcategories - Subcategories loaded - Count:', data.categories.length, 'Parent ID:', categoryId);
                    toastr.success(`Subcategories for ${categoryId} loaded successfully`);
                } else {
                    toggle.textContent = ' '; // No subcategories
                    console.log('toggleSubcategories - No subcategories found - Parent ID:', categoryId);
                    toastr.info(`No subcategories for ${categoryId}`);
                    return;
                }
            } catch (error) {
                console.error('toggleSubcategories - Error loading subcategories - Error:', error.message, 'Stack:', error.stack);
                toastr.error(`Error loading subcategories: ${error.message}`);
                toggle.textContent = ' ';
                return;
            }
        }
        subUl.classList.add('open');
        toggle.textContent = '-';
        console.log('toggleSubcategories - Subcategories opened - ID:', categoryId);
    }
    console.log('toggleSubcategories - Toggle completed');
}

// Saves updated category structure from treeview (community context).
async function saveCategories(userId) {
    console.log('saveCategories - Starting category save - UserID:', userId);
    if (!userId) {
        console.error('saveCategories - User ID not provided');
        toastr.error('User ID not found in session');
        return;
    }

    const checkedCategories = Array.from(document.querySelectorAll('#categoryTree input[type="checkbox"]:checked')).map(cb => cb.value);
    console.log('saveCategories - Checked categories - Count:', checkedCategories.length, 'Values:', checkedCategories);

    try {
        console.log('saveCategories - Sending categories via authenticatedFetch - URL:', `${window.apiUrl}/${userId}/mycategories`);
        const startTime = Date.now();
        const response = await authenticatedFetch(`${window.apiUrl}/${userId}/mycategories`, {
            method: 'PUT',
            body: JSON.stringify({ categories: checkedCategories })
        });
        const duration = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            console.error('saveCategories - Fetch failed - Status:', response.status, 'Error:', errorText);
            throw new Error(`Failed to save categories: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('saveCategories - Save response received - Result:', JSON.stringify(result), 'Duration:', `${duration}ms`);
        toastr.success('Categories saved successfully');
    } catch (error) {
        console.error('saveCategories - Error saving categories - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Failed to save categories: ${error.message}`);
    }
    console.log('saveCategories - Save process completed');
}

// Handles category selection in admin context to load discounted products.
async function handleCategorySelection(categoryId, checkbox) {
    console.log('handleCategorySelection - Handling selection - Category ID:', categoryId, 'Checked:', checkbox.checked);
    document.querySelectorAll('#categoryTree input[type="checkbox"]').forEach(cb => {
        if (cb !== checkbox) cb.checked = false;
    });

    const tbody = document.getElementById('dealList');
    if (!tbody) {
        console.error('handleCategorySelection - Deal list element not found - ID: dealList');
        return;
    }

    if (checkbox.checked) {
        try {
            console.log('handleCategorySelection - Fetching discounted products - Category ID:', categoryId);
            const response = await authenticatedFetch(`${window.apiUrl}/discounted-products?category_id=${categoryId}&min_discount=20`);
            if (!response.ok) throw new Error(`Failed to fetch discounted products: ${response.status}`);
            const data = await response.json();

            tbody.innerHTML = '';
            data.products.forEach(product => {
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
                tbody.appendChild(tr);
            });
            console.log('handleCategorySelection - Products loaded - Count:', data.products.length);
            toastr.success(`Loaded ${data.products.length} discounted products for category ${categoryId}`);
        } catch (error) {
            console.error('handleCategorySelection - Error loading products - Error:', error.message, 'Stack:', error.stack);
            toastr.error(`Error loading discounted products: ${error.message}`);
            checkbox.checked = false;
            tbody.innerHTML = '';
        }
    } else {
        tbody.innerHTML = '';
        console.log('handleCategorySelection - Cleared deal list - Category deselected');
    }
    console.log('handleCategorySelection - Selection handling completed');
}// category-management.js
// Purpose: Manages treeview functionality for displaying and editing nested category information (used in community.html and admin.html).

// Creates a treeview node for category display with configurable behavior.
function createTreeNode(category, level = 0, isAdmin = false, savedCategories = []) {
    console.log('createTreeNode - Creating node - Category:', JSON.stringify(category), 'Level:', level, 'IsAdmin:', isAdmin);
    const li = document.createElement('li');
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'node';

    const toggle = document.createElement('span');
    toggle.className = 'toggle';
    toggle.setAttribute('data-id', category.id);
    toggle.textContent = '+'; // Default to '+' assuming subcategories may exist
    toggle.addEventListener('click', () => toggleSubcategories(category.id, toggle));

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = category.id;
    if (isAdmin) {
        checkbox.addEventListener('change', () => handleCategorySelection(category.id, checkbox));
    } else {
        checkbox.checked = savedCategories.includes(category.id.toString());
    }

    const span = document.createElement('span');
    span.textContent = `${category.name} (${category.id})`;

    nodeDiv.appendChild(toggle);
    nodeDiv.appendChild(checkbox);
    nodeDiv.appendChild(span);
    li.appendChild(nodeDiv);

    const subUl = document.createElement('ul');
    subUl.className = 'subcategories';
    li.appendChild(subUl);

    console.log('createTreeNode - Node created - Category ID:', category.id);
    return li;
}

// Loads category data for treeview rendering, with options for admin or community context.
async function loadCategories(userId = null, isAdmin = false) {
    console.log('loadCategories - Starting category load - UserID:', userId, 'IsAdmin:', isAdmin);
    let savedCategories = [];
    try {
        console.log('loadCategories - Fetching categories via authenticatedFetch');
        const startTime = Date.now();

        // Load user's saved categories if not admin
        if (!isAdmin && userId) {
            const userResponse = await authenticatedFetch(`${window.apiUrl}/${userId}/mycategories`);
            if (!userResponse.ok) throw new Error(`Failed to fetch user categories: ${userResponse.status}`);
            const userData = await userResponse.json();
            savedCategories = userData.categories || [];
            console.log('loadCategories - Saved categories fetched - Count:', savedCategories.length);
        }

        // Load all categories
        const response = await authenticatedFetch(`${window.apiUrl}/categories`);
        if (!response.ok) throw new Error(`Failed to fetch categories: ${response.status}`);
        const data = await response.json();
        const duration = Date.now() - startTime;
        console.log('loadCategories - Categories fetched - Count:', data.categories?.length, 'Duration:', `${duration}ms`);

        const treeElement = document.getElementById('categoryTree');
        if (!treeElement) {
            console.error('loadCategories - Tree element not found - ID: categoryTree');
            return;
        }
        treeElement.innerHTML = '';
        const ul = document.createElement('ul');

        // Filter top-level categories for community, show all for admin
        const categoriesToRender = isAdmin ? data.categories : data.categories.filter(cat => !cat.parent_id);
        console.log('loadCategories - Categories to render - Count:', categoriesToRender.length);

        categoriesToRender.forEach(category => {
            const node = createTreeNode(category, 0, isAdmin, savedCategories);
            ul.appendChild(node);
        });
        treeElement.appendChild(ul);

        // Reattach listeners for community context
        if (!isAdmin) attachEventListeners();

        console.log('loadCategories - Treeview rendered successfully');
        toastr.success('Categories loaded successfully');
    } catch (error) {
        console.error('loadCategories - Error loading categories - Error:', error.message, 'Stack:', error.stack);
        toastr.error('Failed to load categories');
    }
    console.log('loadCategories - Category load completed');
}

// Toggles visibility of subcategories in treeview and loads them dynamically if needed.
async function toggleSubcategories(categoryId, toggle) {
    console.log('toggleSubcategories - Toggling subcategories - Category ID:', categoryId);
    const li = toggle.closest('li');
    const subUl = li.querySelector('.subcategories');

    if (!subUl) {
        console.error('toggleSubcategories - Subcategories element not found - Category ID:', categoryId);
        return;
    }

    if (subUl.classList.contains('open')) {
        subUl.classList.remove('open');
        toggle.textContent = '+';
        console.log('toggleSubcategories - Subcategories closed - ID:', categoryId);
    } else {
        if (subUl.children.length === 0) {
            try {
                console.log('toggleSubcategories - Fetching subcategories - Parent ID:', categoryId);
                const response = await authenticatedFetch(`${window.apiUrl}/categories?parent_id=${categoryId}`);
                if (!response.ok) throw new Error(`Failed to fetch subcategories: ${response.status}`);
                const data = await response.json();

                if (data.categories && data.categories.length > 0) {
                    data.categories.forEach(cat => {
                        const node = createTreeNode(cat, 1); // Level 1 for subcategories
                        subUl.appendChild(node);
                    });
                    console.log('toggleSubcategories - Subcategories loaded - Count:', data.categories.length, 'Parent ID:', categoryId);
                    toastr.success(`Subcategories for ${categoryId} loaded successfully`);
                } else {
                    toggle.textContent = ' '; // No subcategories
                    console.log('toggleSubcategories - No subcategories found - Parent ID:', categoryId);
                    toastr.info(`No subcategories for ${categoryId}`);
                    return;
                }
            } catch (error) {
                console.error('toggleSubcategories - Error loading subcategories - Error:', error.message, 'Stack:', error.stack);
                toastr.error(`Error loading subcategories: ${error.message}`);
                toggle.textContent = ' ';
                return;
            }
        }
        subUl.classList.add('open');
        toggle.textContent = '-';
        console.log('toggleSubcategories - Subcategories opened - ID:', categoryId);
    }
    console.log('toggleSubcategories - Toggle completed');
}

// Saves updated category structure from treeview (community context).
async function saveCategories(userId) {
    console.log('saveCategories - Starting category save - UserID:', userId);
    if (!userId) {
        console.error('saveCategories - User ID not provided');
        toastr.error('User ID not found in session');
        return;
    }

    const checkedCategories = Array.from(document.querySelectorAll('#categoryTree input[type="checkbox"]:checked')).map(cb => cb.value);
    console.log('saveCategories - Checked categories - Count:', checkedCategories.length, 'Values:', checkedCategories);

    try {
        console.log('saveCategories - Sending categories via authenticatedFetch - URL:', `${window.apiUrl}/${userId}/mycategories`);
        const startTime = Date.now();
        const response = await authenticatedFetch(`${window.apiUrl}/${userId}/mycategories`, {
            method: 'PUT',
            body: JSON.stringify({ categories: checkedCategories })
        });
        const duration = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            console.error('saveCategories - Fetch failed - Status:', response.status, 'Error:', errorText);
            throw new Error(`Failed to save categories: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('saveCategories - Save response received - Result:', JSON.stringify(result), 'Duration:', `${duration}ms`);
        toastr.success('Categories saved successfully');
    } catch (error) {
        console.error('saveCategories - Error saving categories - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Failed to save categories: ${error.message}`);
    }
    console.log('saveCategories - Save process completed');
}

// Handles category selection in admin context to load discounted products.
async function handleCategorySelection(categoryId, checkbox) {
    console.log('handleCategorySelection - Handling selection - Category ID:', categoryId, 'Checked:', checkbox.checked);
    document.querySelectorAll('#categoryTree input[type="checkbox"]').forEach(cb => {
        if (cb !== checkbox) cb.checked = false;
    });

    const tbody = document.getElementById('dealList');
    if (!tbody) {
        console.error('handleCategorySelection - Deal list element not found - ID: dealList');
        return;
    }

    if (checkbox.checked) {
        try {
            console.log('handleCategorySelection - Fetching discounted products - Category ID:', categoryId);
            const response = await authenticatedFetch(`${window.apiUrl}/discounted-products?category_id=${categoryId}&min_discount=20`);
            if (!response.ok) throw new Error(`Failed to fetch discounted products: ${response.status}`);
            const data = await response.json();

            tbody.innerHTML = '';
            data.products.forEach(product => {
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
                tbody.appendChild(tr);
            });
            console.log('handleCategorySelection - Products loaded - Count:', data.products.length);
            toastr.success(`Loaded ${data.products.length} discounted products for category ${categoryId}`);
        } catch (error) {
            console.error('handleCategorySelection - Error loading products - Error:', error.message, 'Stack:', error.stack);
            toastr.error(`Error loading discounted products: ${error.message}`);
            checkbox.checked = false;
            tbody.innerHTML = '';
        }
    } else {
        tbody.innerHTML = '';
        console.log('handleCategorySelection - Cleared deal list - Category deselected');
    }
    console.log('handleCategorySelection - Selection handling completed');
}// common.js
// Purpose: Provides core shared utilities for all pages, specifically Toastr configuration.

// Configures Toastr for consistent toast notifications across the application.
function setupToastr() {
    console.log('setupToastr - Initiating Toastr configuration');
    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: 'toast-top-right',
        timeOut: 5000,
        showMethod: 'slideDown',
        hideMethod: 'slideUp'
    };
    console.log('setupToastr - Toastr options configured:', JSON.stringify(toastr.options));
    console.log('setupToastr - Configuration completed');
}// community-page.js
// Purpose: Manages page-specific functionality for the /community page.

// Initializes the community page with permission checks.
function initializeCommunity() {
    console.log('initializeCommunity - Initializing community page');
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    if (!token) {
        console.error('initializeCommunity - No token found, redirecting to /');
        window.location.href = '/';
        return;
    }
    const decoded = decodeJWT(token);
    if (!decoded) {
        console.error('initializeCommunity - Invalid token, redirecting to /');
        window.location.href = '/';
        return;
    }
    window.userPermissions = decoded.permissions || [];
    if (!window.userPermissions.includes('admin') && !window.userPermissions.includes('community')) {
        toastr.error('Permission denied: Community permission required');
        console.error('initializeCommunity - No community permission, redirecting to /');
        window.location.href = '/';
        return;
    }
    if (!userId) {
        toastr.error('User ID not found in session, redirecting to login');
        console.error('initializeCommunity - No userId found in localStorage');
        window.location.href = '/';
        return;
    }
    document.getElementById('userId').value = userId;
    updateMenu();
    loadBranding();
    showSection('welcome');
    waitForTinyMCE(initializeTinyMCE);
    attachEventListeners();
    console.log('initializeCommunity - Community page initialized successfully');
}

// Updates the menu dynamically based on permissions.
function updateMenu() {
    console.log('updateMenu - Updating menu');
    const menu = document.getElementById('menu');
    const userId = document.getElementById('userId').value;
    menu.innerHTML = `<input type="text" id="userId" style="display: none;" value="${userId || ''}">`;
    menu.innerHTML += `
        <button data-submenu="my_website" data-section="my_website_intro">My Web Site <i class="fas fa-caret-down"></i></button>
        <div id="my_website" class="submenu">
            <button data-section="wix">Wix</button>
            <button data-section="wordpress">WordPress</button>
            <button data-section="squarespace">Squarespace</button>
            <button data-section="weebly">Weebly</button>
            <button data-section="joomla">Joomla</button>
            <button data-section="no_website">I Don’t Have a Website Yet</button>
        </div>
        <button data-section="categories">My Categories</button>
        <button data-submenu="referrals" data-section="referrals_intro">My Referrals <i class="fas fa-caret-down"></i></button>
        <div id="referrals" class="submenu">
            <button data-section="visits">Visits</button>
            <button data-section="orders">Orders</button>
        </div>
        <button data-section="settings">My Account</button>
    `;
    if (window.userPermissions.includes('admin')) {
        menu.innerHTML += '<button data-href="/admin" class="btn-admin">Back to Admin</button>';
    }
    menu.innerHTML += '<button id="logOffBtn" class="btn-logoff">Log Off</button>';
    console.log('updateMenu - Menu updated');
}

// Updates integration code for web platforms.
function updateIntegrationCode(section) {
    console.log('updateIntegrationCode - Updating integration code - Section:', section);
    const codeElements = {
        'wix': 'wixCode',
        'wordpress': 'wordpressCode',
        'squarespace': 'squarespaceCode',
        'weebly': 'weeblyCode',
        'joomla': 'joomlaCode'
    };
    const codeId = codeElements[section];
    const userId = document.getElementById('userId').value;
    if (codeId) {
        const codeElement = document.getElementById(codeId);
        if (codeElement) {
            codeElement.textContent = `<iframe src="https://clubmadeira.io/discounts?referrer=${userId || 'unknown'}" width="100%" height="600"></iframe>`;
            console.log('updateIntegrationCode - Code updated - ID:', codeId);
        } else {
            console.warn('updateIntegrationCode - Code element not found - ID:', codeId);
        }
    }
}

// Loads referral visits specific to community page.
async function loadVisits() {
    console.log('loadVisits - Loading visits');
    const userId = document.getElementById('userId').value;
    if (!userId) {
        console.error('loadVisits - User ID not found in session');
        toastr.error('User ID not found in session');
        return;
    }
    try {
        console.log('loadVisits - Fetching visits - URL:', `${window.apiUrl}/${userId}/visits`);
        const response = await authenticatedFetch(`${window.apiUrl}/${userId}/visits`);
        if (!response.ok) throw new Error(`Failed to fetch visits: ${response.status}`);
        const data = await response.json();
        console.log('loadVisits - Visits fetched - Data:', JSON.stringify(data));
        if (data.status === 'success') {
            const now = new Date();
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();
            const visitsThisMonth = [];
            const visitsLastMonth = [];
            const visitsEarlier = [];
            data.visits.forEach(visit => {
                const visitDate = new Date(visit.timestamp);
                if (visitDate.getFullYear() === thisYear && visitDate.getMonth() === thisMonth) visitsThisMonth.push(visit);
                else if ((visitDate.getFullYear() === thisYear && visitDate.getMonth() === thisMonth - 1) || 
                         (visitDate.getFullYear() === thisYear - 1 && thisMonth === 0 && visitDate.getMonth() === 11)) visitsLastMonth.push(visit);
                else visitsEarlier.push(visit);
            });
            updateVisitsTable('visitsListThisMonth', visitsThisMonth);
            updateVisitsTable('visitsListLastMonth', visitsLastMonth);
            updateVisitsTable('visitsListEarlier', visitsEarlier);
            console.log('loadVisits - Visits loaded - Counts:', { thisMonth: visitsThisMonth.length, lastMonth: visitsLastMonth.length, earlier: visitsEarlier.length });
        }
    } catch (error) {
        console.error('loadVisits - Error loading visits - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error loading visits: ${error.message}`);
    }
}

// Updates the visits table.
function updateVisitsTable(tableId, visits) {
    console.log('updateVisitsTable - Updating table - Table ID:', tableId, 'Visits:', visits.length);
    const tbody = document.getElementById(tableId);
    if (tbody) {
        tbody.innerHTML = visits.length === 0 ? '<tr><td colspan="2">No visits found</td></tr>' : '';
        visits.forEach(visit => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${visit.page}</td><td>${visit.timestamp}</td>`;
            tbody.appendChild(row);
        });
        console.log('updateVisitsTable - Table updated - ID:', tableId);
    } else {
        console.warn('updateVisitsTable - Table element not found - ID:', tableId);
    }
}

// Loads referral orders specific to community page.
async function loadOrders() {
    console.log('loadOrders - Loading orders');
    const userId = document.getElementById('userId').value;
    if (!userId) {
        console.error('loadOrders - User ID not found in session');
        toastr.error('User ID not found in session');
        return;
    }
    try {
        console.log('loadOrders - Fetching orders - URL:', `${window.apiUrl}/${userId}/orders`);
        const response = await authenticatedFetch(`${window.apiUrl}/${userId}/orders`);
        if (!response.ok) throw new Error(`Failed to fetch orders: ${response.status}`);
        const data = await response.json();
        console.log('loadOrders - Orders fetched - Data:', JSON.stringify(data));
        if (data.status === 'success') {
            const now = new Date();
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();
            const ordersThisMonth = [];
            const ordersLastMonth = [];
            const ordersEarlier = [];
            data.orders.forEach(order => {
                const orderDate = new Date(order.timestamp);
                if (orderDate.getFullYear() === thisYear && orderDate.getMonth() === thisMonth) ordersThisMonth.push(order);
                else if ((orderDate.getFullYear() === thisYear && orderDate.getMonth() === thisMonth - 1) || 
                         (orderDate.getFullYear() === thisYear - 1 && thisMonth === 0 && orderDate.getMonth() === 11)) ordersLastMonth.push(order);
                else ordersEarlier.push(order);
            });
            updateOrdersTable('ordersListThisMonth', ordersThisMonth);
            updateOrdersTable('ordersListLastMonth', ordersLastMonth);
            updateOrdersTable('ordersListEarlier', ordersEarlier);
            console.log('loadOrders - Orders loaded - Counts:', { thisMonth: ordersThisMonth.length, lastMonth: ordersLastMonth.length, earlier: ordersEarlier.length });
        }
    } catch (error) {
        console.error('loadOrders - Error loading orders - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error loading orders: ${error.message}`);
    }
}

// Updates the orders table.
function updateOrdersTable(tableId, orders) {
    console.log('updateOrdersTable - Updating table - Table ID:', tableId, 'Orders:', orders.length);
    const tbody = document.getElementById(tableId);
    if (tbody) {
        tbody.innerHTML = orders.length === 0 ? '<tr><td colspan="4">No orders found</td></tr>' : '';
        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${order.orderId}</td><td>${order.buyer}</td><td>$${order.total}</td><td>${order.timestamp}</td>`;
            tbody.appendChild(row);
        });
        console.log('updateOrdersTable - Table updated - ID:', tableId);
    } else {
        console.warn('updateOrdersTable - Table element not found - ID:', tableId);
    }
}

// Waits for TinyMCE to load before initializing (specific invocation).
function waitForTinyMCE(callback) {
    console.log('waitForTinyMCE - Checking if TinyMCE is loaded');
    if (typeof tinymce !== 'undefined' && tinymce.init) {
        console.log('waitForTinyMCE - TinyMCE is loaded, executing callback');
        callback();
    } else {
        console.log('waitForTinyMCE - Waiting for TinyMCE to load...');
        const script = document.querySelector('script[src*="tinymce.min.js"]');
        if (script) {
            script.onload = () => {
                console.log('waitForTinyMCE - TinyMCE script loaded');
                callback();
            };
            script.onerror = () => console.error('waitForTinyMCE - TinyMCE failed to load');
        } else {
            setTimeout(() => waitForTinyMCE(callback), 100);
        }
    }
}// merchant-page.js
// Purpose: Manages page-specific functionality for the /merchant page.

// Initializes the merchant page with permission checks.
function initializeMerchant() {
    console.log('initializeMerchant - Initializing merchant page');
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    if (!token) {
        console.error('initializeMerchant - No token found, redirecting to /');
        window.location.href = '/';
        return;
    }
    const decoded = decodeJWT(token);
    if (!decoded) {
        console.error('initializeMerchant - Invalid token, redirecting to /');
        window.location.href = '/';
        return;
    }
    window.userPermissions = decoded.permissions || [];
    if (!window.userPermissions.includes('merchant') && !window.userPermissions.includes('admin')) {
        toastr.error('Permission denied: Merchant or Admin permission required');
        console.error('initializeMerchant - No merchant/admin permission, redirecting to /');
        window.location.href = '/';
        return;
    }
    if (userId) document.getElementById('userId').value = userId;
    checkAdminPermission();
    loadBranding();
    showSection('info');
    attachEventListeners();
    console.log('initializeMerchant - Merchant page initialized successfully');
}

// Checks and toggles visibility of admin-specific elements.
function checkAdminPermission() {
    console.log('checkAdminPermission - Checking admin permission');
    const backButton = document.querySelector('button[data-href="/admin"]');
    if (backButton) {
        backButton.style.display = window.userPermissions.includes('admin') ? 'block' : 'none';
        console.log('checkAdminPermission - Back button visibility:', backButton.style.display);
    } else {
        console.warn('checkAdminPermission - Back button not found');
    }
}

// Loads and displays merchant products.
async function loadProducts() {
    console.log('loadProducts - Loading products');
    const userId = document.getElementById('userId').value;
    if (!userId) {
        console.error('loadProducts - User ID not found in session');
        toastr.error('User ID not found in session');
        return;
    }
    try {
        console.log('loadProducts - Fetching products - URL:', `${window.apiUrl}/${userId}/products`);
        const response = await authenticatedFetch(`${window.apiUrl}/${userId}/products`);
        if (!response.ok) throw new Error(`Failed to fetch products: ${response.status}`);
        const data = await response.json();
        console.log('loadProducts - Products fetched - Data:', JSON.stringify(data));
        
        const tbody = document.getElementById('productList');
        if (tbody) {
            tbody.innerHTML = '';
            data.products.forEach(product => tbody.appendChild(createProductRow(product)));
            console.log('loadProducts - Product table updated - Count:', data.products.length);
        } else {
            console.warn('loadProducts - Product list element not found');
        }
    } catch (error) {
        console.error('loadProducts - Error loading products - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error loading products: ${error.message}`);
    }
}

// Creates a table row for a product.
function createProductRow(product) {
    console.log('createProductRow - Creating row - Product:', JSON.stringify(product));
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="hidden">${product.id}</td>
        <td>${product.category || 'N/A'}</td>
        <td>${product.title}</td>
        <td><a href="${product.product_url}" target="_blank">Link</a></td>
        <td>${product.current_price}</td>
        <td>${product.original_price}</td>
        <td><img src="${product.image_url}" width="50" onerror="this.src='https://via.placeholder.com/50';"></td>
        <td>${product.qty || 'N/A'}</td>
    `;
    return tr;
}

// Loads store request data specific to merchant page.
async function loadStoreRequest() {
    console.log('loadStoreRequest - Loading store request');
    const userId = document.getElementById('userId').value;
    if (!userId) {
        console.error('loadStoreRequest - User ID not found in session');
        toastr.error('User ID not found in session');
        return;
    }
    try {
        console.log('loadStoreRequest - Fetching store request - URL:', `${window.apiUrl}/${userId}/siterequest`);
        const response = await authenticatedFetch(`${window.apiUrl}/${userId}/siterequest`);
        if (!response.ok) throw new Error(`Failed to fetch store request: ${response.status}`);
        const data = await response.json();
        const storeRequest = data.site_request || {};
        console.log('loadStoreRequest - Store request fetched - Data:', JSON.stringify(storeRequest));

        document.getElementById('storeName').value = storeRequest.storeName || '';
        if (window.tinyMCELoaded) {
            tinymce.get('aboutStore')?.setContent(storeRequest.aboutStore || '');
        } else {
            document.getElementById('aboutStore').value = storeRequest.aboutStore || '';
        }
        document.getElementById('colorPrefs').value = storeRequest.colorPrefs || '';
        document.getElementById('stylingDetails').value = storeRequest.stylingDetails || '';
        document.getElementById('preferredDomain').value = storeRequest.preferredDomain || 'mystore.uk';

        const emails = storeRequest.emails || ['info'];
        window.emailCount = 0;
        const emailsContainer = document.getElementById('emailsContainer');
        emailsContainer.innerHTML = '';
        emails.forEach((email, index) => {
            window.emailCount++;
            const emailDiv = document.createElement('div');
            emailDiv.className = 'email-section';
            emailDiv.dataset.email = window.emailCount;
            emailDiv.innerHTML = `
                <label for="email${window.emailCount}Name">Email Name:</label>
                <input type="text" id="email${window.emailCount}Name" name="email${window.emailCount}Name" value="${email}">
                <span id="email${window.emailCount}Domain">@${storeRequest.preferredDomain || 'mystore.uk'}</span>
                ${window.emailCount > 1 ? `<button type="button" class="remove-email-btn" onclick="removeEmail(${window.emailCount})">Remove Email</button>` : ''}
            `;
            emailsContainer.appendChild(emailDiv);
        });

        const pages = storeRequest.pages && storeRequest.pages.length >= 2 ? storeRequest.pages : [
            { name: 'Home', content: '' },
            { name: 'Returns Policy', content: '' }
        ];
        window.pageCount = 0;
        const pagesContainer = document.getElementById('pagesContainer');
        pagesContainer.innerHTML = '';
        pages.forEach((page, index) => {
            window.pageCount++;
            const pageDiv = document.createElement('div');
            pageDiv.className = 'page-section';
            pageDiv.dataset.page = window.pageCount;
            pageDiv.innerHTML = `
                <label for="page${window.pageCount}Name">Page Name:</label>
                <input type="text" id="page${window.pageCount}Name" name="page${window.pageCount}Name" value="${page.name || ''}" ${window.pageCount <= 2 ? 'readonly' : ''}>
                <br><br>
                <label for="page${window.pageCount}Content">${window.pageCount === 1 ? 'Home Page' : window.pageCount === 2 ? 'Returns Policy' : 'Page'} Content:</label>
                <textarea id="page${window.pageCount}Content" name="page${window.pageCount}Content">${page.content || ''}</textarea>
                <label for="page${window.pageCount}Images">Additional Images:</label>
                <input type="file" id="page${window.pageCount}Images" name="page${window.pageCount}Images" accept="image/*" multiple>
                ${window.pageCount > 2 ? `<button type="button" class="remove-page-btn" onclick="removePage(${window.pageCount})">Remove Page</button>` : ''}
            `;
            pagesContainer.appendChild(pageDiv);
            if (window.tinyMCELoaded) {
                tinymce.init({
                    selector: `#page${window.pageCount}Content`,
                    height: 200,
                    menubar: false,
                    plugins: 'lists',
                    toolbar: 'bold italic | bullist numlist',
                    setup: editor => {
                        editor.on('init', () => console.log(`TinyMCE editor initialized for page${window.pageCount}`));
                    }
                });
            }
        });

        const widgets = storeRequest.widgets || [];
        document.querySelectorAll('input[name="widgets"]').forEach(checkbox => {
            checkbox.checked = widgets.includes(checkbox.value);
        });

        updateDomainPreview();
        console.log('loadStoreRequest - Store request loaded successfully');
    } catch (error) {
        console.error('loadStoreRequest - Error loading store request - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error loading store request: ${error.message}`);
    }
}// page-load.js
// Purpose: Manages page initialization and event listener attachment for navigation and section handling.

// Base initialization function ensuring permission checks before page setup.
function initializePage(permissionRequired, callback) {
    console.log('initializePage - Starting initialization - Permission required:', permissionRequired);
    const token = localStorage.getItem('authToken');
    console.log('initializePage - Retrieved token from localStorage:', token || 'None');
    if (!token) {
        console.warn('initializePage - No auth token found - Redirecting to /');
        window.location.href = '/';
        return;
    }
    const decoded = decodeJWT(token); // Assumes decodeJWT is available from site-auth.js
    console.log('initializePage - Decoded token:', JSON.stringify(decoded));
    if (!decoded) {
        console.warn('initializePage - Failed to decode token - Redirecting to /');
        window.location.href = '/';
        return;
    }
    window.userPermissions = decoded.permissions || [];
    console.log('initializePage - User permissions set:', JSON.stringify(window.userPermissions));
    if (!window.userPermissions.includes(permissionRequired)) {
        console.warn('initializePage - Required permission not found - Required:', permissionRequired, 'Permissions:', window.userPermissions);
        toastr.error(`Permission denied: ${permissionRequired} permission required`);
        window.location.href = '/';
        return;
    }
    console.log('initializePage - Permission check passed - Executing callback');
    callback();
    console.log('initializePage - Initialization completed for permission:', permissionRequired);
}

// Common initialize function handling page-specific setup based on page type.
function initialize(pageType) {
    console.log('initialize - Starting page initialization - Page type:', pageType);
    
    const pageConfigs = {
        'partner': {
            permission: 'admin',
            brandingType: 'partner',
            initialSection: null,
            requiresUserId: false,
            extraSteps: () => {
                console.log('initialize - Executing partner-specific steps');
                attachEventListeners();
                console.log('initialize - Partner-specific steps completed');
            }
        },
        'merchant': {
            permission: 'merchant',
            brandingType: 'merchant',
            initialSection: 'info',
            requiresUserId: true,
            extraSteps: () => {
                console.log('initialize - Executing merchant-specific steps');
                const userId = localStorage.getItem('userId');
                console.log('initialize - Retrieved userId from localStorage:', userId || 'None');
                if (userId) {
                    console.log('initialize - Setting userId in DOM - ID:', userId);
                    document.getElementById('userId').value = userId;
                } else {
                    console.warn('initialize - No userId found for merchant - Proceeding without setting');
                }
                checkAdminPermission(); // From merchant.js stub
                attachEventListeners();
                console.log('initialize - Merchant-specific steps completed');
            }
        },
        'community': {
            permission: 'community',
            brandingType: 'community',
            initialSection: 'welcome',
            requiresUserId: true,
            extraSteps: () => {
                console.log('initialize - Executing community-specific steps');
                const userId = localStorage.getItem('userId');
                console.log('initialize - Retrieved userId from localStorage:', userId || 'None');
                if (!userId) {
                    console.warn('initialize - User ID not found for community - Redirecting to /');
                    toastr.error('User ID not found in session');
                    window.location.href = '/';
                    return;
                }
                console.log('initialize - Setting userId in DOM - ID:', userId);
                document.getElementById('userId').value = userId;
                updateMenu(); // From community.js stub
                waitForTinyMCE(initializeTinyMCE); // From site-request.js
                attachEventListeners();
                console.log('initialize - Community-specific steps completed');
            }
        },
        'admin': {
            permission: 'admin',
            brandingType: 'admin',
            initialSection: null,
            requiresUserId: false,
            extraSteps: () => {
                console.log('initialize - Executing admin-specific steps');
                attachEventListeners();
                console.log('initialize - Admin-specific steps completed');
            }
        },
        'login': {
            permission: null,
            brandingType: 'login',
            initialSection: null,
            requiresUserId: false,
            extraSteps: () => {
                console.log('initialize - Executing login-specific steps');
                // Minimal setup for login page
                console.log('initialize - Login-specific steps completed');
            }
        },
        'signup': {
            permission: null,
            brandingType: 'signup',
            initialSection: null,
            requiresUserId: false,
            extraSteps: () => {
                console.log('initialize - Executing signup-specific steps');
                // Minimal setup for signup page
                console.log('initialize - Signup-specific steps completed');
            }
        }
    };

    const config = pageConfigs[pageType];
    if (!config) {
        console.error('initialize - Invalid page type provided - Type:', pageType);
        toastr.error('Invalid page type');
        return;
    }
    console.log('initialize - Configuration loaded for page type:', pageType, 'Config:', JSON.stringify(config));

    if (config.permission) {
        console.log('initialize - Performing permission check for:', pageType);
        initializePage(config.permission, () => {
            console.log('initialize - Permission validated for:', pageType);
            performPageSetup(pageType, config);
        });
    } else {
        console.log('initialize - No permission required for:', pageType);
        performPageSetup(pageType, config);
    }
    console.log('initialize - Initialization process completed for:', pageType);
}

// Helper function to perform page setup after permission checks.
function performPageSetup(pageType, config) {
    console.log('performPageSetup - Starting setup - Page type:', pageType);
    
    console.log('performPageSetup - Loading branding - Type:', config.brandingType);
    loadBranding(config.brandingType); // From site-navigation.js

    if (config.initialSection) {
        console.log('performPageSetup - Showing initial section - ID:', config.initialSection);
        showSection(config.initialSection); // From site-navigation.js
    } else {
        console.log('performPageSetup - No initial section specified for:', pageType);
    }

    if (typeof config.extraSteps === 'function') {
        console.log('performPageSetup - Executing extra steps for:', pageType);
        config.extraSteps();
    } else {
        console.log('performPageSetup - No extra steps defined for:', pageType);
    }

    console.log('performPageSetup - Page setup completed for:', pageType);
}

// Attaches click event listeners for section navigation.
function handleSectionClick(event) {
    console.log('handleSectionClick - Section click event triggered');
    const target = event.currentTarget;
    console.log('handleSectionClick - Event target:', target);
    const section = target.getAttribute('data-section');
    const submenu = target.getAttribute('data-submenu');
    console.log('handleSectionClick - Extracted attributes - Section:', section, 'Submenu:', submenu);
    if (submenu) {
        console.log('handleSectionClick - Toggling submenu - ID:', submenu);
        toggleSubmenu(submenu); // From site-navigation.js
    }
    if (section) {
        console.log('handleSectionClick - Showing section - ID:', section);
        showSection(section); // From site-navigation.js
    }
    if (!section && !submenu) {
        console.warn('handleSectionClick - No section or submenu attribute found - Target:', target);
    }
    console.log('handleSectionClick - Event handling completed');
}

// Attaches click event listeners for href navigation with SPA support.
async function handleHrefClick(event, options = {}) {
    console.log('handleHrefClick - Href click event triggered');
    const target = event.currentTarget;
    console.log('handleHrefClick - Event target:', target);
    const href = target.getAttribute('data-href');
    console.log('handleHrefClick - Extracted href:', href);
    console.log('handleHrefClick - Options provided:', JSON.stringify(options));
    if (!href) {
        console.warn('handleHrefClick - No href attribute found - Target:', target);
        return;
    }

    try {
        console.log('handleHrefClick - Initiating fetch for protected page - Href:', href);
        const startTime = Date.now();
        const html = await fetchProtectedPage(href); // From site-navigation.js
        const duration = Date.now() - startTime;
        if (!html) {
            console.error('handleHrefClick - No HTML returned - Href:', href);
            return;
        }
        console.log('handleHrefClick - HTML fetched successfully - Length:', html.length, 'Duration:', `${duration}ms`);

        const { spaPaths = ['/partner'], containerSelector = '.content-container', onLoad = null } = options;
        console.log('handleHrefClick - SPA paths:', spaPaths, 'Container selector:', containerSelector);

        if (spaPaths.includes(href)) {
            console.log('handleHrefClick - Initiating SPA redirect - Href:', href);
            history.pushState({ page: href.slice(1) }, `${href} Page`, href);
            console.log('handleHrefClick - URL updated via history.pushState - New URL:', window.location.href);
            const contentContainer = document.querySelector(containerSelector);
            console.log('handleHrefClick - Content container:', contentContainer);
            if (contentContainer) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const content = doc.querySelector(containerSelector) || doc.body;
                console.log('handleHrefClick - Extracted content element:', content.tagName);
                contentContainer.innerHTML = content.innerHTML;
                console.log('handleHrefClick - Content container updated - Href:', href);
                const scripts = doc.querySelectorAll('script:not([src])');
                console.log('handleHrefClick - Found inline scripts:', scripts.length);
                scripts.forEach((script, index) => {
                    if (script.innerHTML.trim()) {
                        console.log('handleHrefClick - Executing inline script', index + 1, 'Content:', script.innerHTML.substring(0, 100) + '...');
                        try {
                            new Function(script.innerHTML)();
                            console.log('handleHrefClick - Inline script', index + 1, 'executed successfully');
                        } catch (e) {
                            console.error('handleHrefClick - Error executing inline script', index + 1, 'Error:', e.message, 'Stack:', e.stack);
                        }
                    }
                });
            } else {
                console.error('handleHrefClick - Content container not found - Selector:', containerSelector, 'Falling back to full reload');
                toastr.error('Failed to update page content: container missing');
                document.body.innerHTML = html;
                console.log('handleHrefClick - Body updated with full HTML - Href:', href);
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const scripts = doc.querySelectorAll('script:not([src])');
                console.log('handleHrefClick - Found inline scripts for full reload:', scripts.length);
                scripts.forEach((script, index) => {
                    if (script.innerHTML.trim()) {
                        console.log('handleHrefClick - Executing inline script (full reload)', index + 1);
                        try {
                            new Function(script.innerHTML)();
                            console.log('handleHrefClick - Inline script (full reload)', index + 1, 'executed successfully');
                        } catch (e) {
                            console.error('handleHrefClick - Error executing inline script (full reload)', index + 1, 'Error:', e.message, 'Stack:', e.stack);
                        }
                    }
                });
                if (typeof window.initPage === 'function') {
                    console.log('handleHrefClick - Calling window.initPage after full reload');
                    window.initPage();
                }
            }
        } else {
            console.log('handleHrefClick - Performing full page load - Href:', href);
            document.body.innerHTML = html;
            console.log('handleHrefClick - Body updated with new HTML - Href:', href);
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const scripts = doc.querySelectorAll('script:not([src])');
            console.log('handleHrefClick - Found inline scripts for full reload:', scripts.length);
            scripts.forEach((script, index) => {
                if (script.innerHTML.trim()) {
                    console.log('handleHrefClick - Executing inline script (full reload)', index + 1);
                    try {
                        new Function(script.innerHTML)();
                        console.log('handleHrefClick - Inline script (full reload)', index + 1, 'executed successfully');
                    } catch (e) {
                        console.error('handleHrefClick - Error executing inline script (full reload)', index + 1, 'Error:', e.message, 'Stack:', e.stack);
                    }
                }
            });
            if (typeof window.initPage === 'function') {
                console.log('handleHrefClick - Calling window.initPage after full reload');
                window.initPage();
            }
        }

        if (typeof onLoad === 'function') {
            console.log('handleHrefClick - Executing onLoad callback - Href:', href);
            onLoad(href, html);
        }
    } catch (error) {
        console.error('handleHrefClick - Error handling href click - Href:', href, 'Error:', error.message, 'Stack:', error.stack);
        toastr.error('Navigation failed: ' + error.message);
    }
    console.log('handleHrefClick - Event handling completed');
}// partner-page.js
// Purpose: Manages page-specific functionality for the /partner page.

// Initializes the partner page with permission checks.
function initializePartner() {
    console.log('initializePartner - Initializing partner page');
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    if (!token) {
        console.error('initializePartner - No token found, redirecting to /');
        window.location.href = '/';
        return;
    }
    const decoded = decodeJWT(token);
    if (!decoded) {
        console.error('initializePartner - Invalid token, redirecting to /');
        window.location.href = '/';
        return;
    }
    window.userPermissions = decoded.permissions || [];
    if (!window.userPermissions.includes('wixpro') && !window.userPermissions.includes('admin')) {
        toastr.error('Permission denied: WixPro or Admin permission required');
        console.error('initializePartner - No wixpro/admin permission, redirecting to /');
        window.location.href = '/';
        return;
    }
    if (userId) document.getElementById('userId').value = userId;
    checkAdminPermission();
    loadBranding();
    showSection('welcome');
    attachEventListeners();
    console.log('initializePartner - Partner page initialized successfully');
}

// Checks and toggles visibility of admin-specific elements.
function checkAdminPermission() {
    console.log('checkAdminPermission - Checking admin permission');
    const backButton = document.querySelector('button[data-href="/admin"]');
    if (backButton) {
        backButton.style.display = window.userPermissions.includes('admin') ? 'block' : 'none';
        console.log('checkAdminPermission - Back button visibility:', backButton.style.display);
    } else {
        console.warn('checkAdminPermission - Back button not found');
    }
}

// Loads and displays partner-specific integrations or tests.
async function loadPartnerIntegrations() {
    console.log('loadPartnerIntegrations - Loading partner integrations');
    const userId = document.getElementById('userId').value;
    if (!userId) {
        console.error('loadPartnerIntegrations - User ID not found in session');
        toastr.error('User ID not found in session');
        return;
    }
    try {
        console.log('loadPartnerIntegrations - Fetching integrations - URL:', `${window.apiUrl}/${userId}/integrations`);
        const response = await authenticatedFetch(`${window.apiUrl}/${userId}/integrations`);
        if (!response.ok) throw new Error(`Failed to fetch integrations: ${response.status}`);
        const data = await response.json();
        console.log('loadPartnerIntegrations - Integrations fetched - Data:', JSON.stringify(data));

        const integrationList = document.getElementById('integrationList');
        if (integrationList) {
            integrationList.innerHTML = '';
            data.integrations.forEach(integration => {
                const li = document.createElement('li');
                li.textContent = `${integration.name} - Status: ${integration.status}`;
                integrationList.appendChild(li);
            });
            console.log('loadPartnerIntegrations - Integration list updated - Count:', data.integrations.length);
        } else {
            console.warn('loadPartnerIntegrations - Integration list element not found');
        }
    } catch (error) {
        console.error('loadPartnerIntegrations - Error loading integrations - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error loading integrations: ${error.message}`);
    }
}// site-auth.js
// Purpose: Manages authentication-related functionality, including password visibility toggling, 
// user logout, JWT token decoding, and password saving for user management.

// Toggles the visibility of a password input field, updating associated icon.
function togglePassword(fieldId) {
    console.log('togglePassword - Initiating visibility toggle - Field ID:', fieldId);
    const input = document.getElementById(fieldId);
    const icon = input ? input.nextElementSibling : null;
    console.log('togglePassword - Input element retrieved:', input, 'Icon element:', icon);

    if (!input) {
        console.error('togglePassword - Password input not found - Field ID:', fieldId);
        return;
    }
    if (!icon) {
        console.error('togglePassword - Icon element not found for input - Field ID:', fieldId);
        return;
    }

    const isPassword = input.type === 'password';
    console.log('togglePassword - Current input type:', input.type);
    if (isPassword) {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        console.log('togglePassword - Changed to text visibility - Field ID:', fieldId);
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        console.log('togglePassword - Changed to password visibility - Field ID:', fieldId);
    }
    console.log('togglePassword - Toggle completed - New type:', input.type);
}

// Logs the user out, clearing session data and redirecting to home.
function logOff() {
    console.log('logOff - Initiating logout process');
    const confirmed = confirm('Are you sure you want to log off?');
    console.log('logOff - User confirmation received:', confirmed);

    if (confirmed) {
        console.log('logOff - User confirmed logout - Clearing session data');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        console.log('logOff - Auth token and userId removed from localStorage - Current localStorage:', JSON.stringify(localStorage));
        toastr.success('Logged off successfully');
        console.log('logOff - Success toast displayed');

        setTimeout(() => {
            console.log('logOff - Redirecting to / after 1-second delay');
            window.location.href = '/';
            console.log('logOff - Redirect executed');
        }, 1000);
    } else {
        console.log('logOff - Logout cancelled by user');
    }
    console.log('logOff - Logout process completed');
}

// Decodes a JWT token to extract user data, such as permissions.
function decodeJWT(token) {
    console.log('decodeJWT - Starting JWT decoding - Input token:', token);
    if (!token || typeof token !== 'string') {
        console.warn('decodeJWT - Invalid token: null or not a string - Token:', token);
        return null;
    }
    if (!token.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)) {
        console.warn('decodeJWT - Token does not match JWT format - Token:', token);
        return null;
    }
    console.log('decodeJWT - Token format validated - Proceeding with decode');

    const parts = token.split('.');
    console.log('decodeJWT - Token split into parts:', parts);

    try {
        const base64Url = parts[1];
        console.log('decodeJWT - Extracted base64Url from token:', base64Url);
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        console.log('decodeJWT - Converted to base64:', base64);
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        console.log('decodeJWT - Decoded JSON payload:', jsonPayload);
        const decoded = JSON.parse(jsonPayload);
        console.log('decodeJWT - Parsed JWT payload:', JSON.stringify(decoded));
        return decoded;
    } catch (error) {
        console.error('decodeJWT - Error decoding JWT - Error:', error.message, 'Stack:', error.stack, 'Token:', token);
        return null;
    }
}

// Saves an updated user password via an authenticated request.
async function savePassword(newPassword) {
    console.log('savePassword - Starting password save - New password length:', newPassword ? newPassword.length : 'None');
    if (!newPassword || typeof newPassword !== 'string') {
        console.error('savePassword - Invalid password provided - Password:', newPassword);
        toastr.error('Invalid password provided');
        return;
    }

    try {
        console.log('savePassword - Sending password update via authenticatedFetch');
        const startTime = Date.now();
        const response = await authenticatedFetch('/update-password', { // Assumes endpoint exists
            method: 'POST',
            body: JSON.stringify({ password: newPassword })
        });
        const duration = Date.now() - startTime;

        if (!response) {
            console.error('savePassword - No response from fetch');
            toastr.error('Failed to save password: No server response');
            return;
        }

        console.log('savePassword - Response received - Status:', response.status, 'Duration:', `${duration}ms`);
        const result = await response.json();
        console.log('savePassword - Save response data:', JSON.stringify(result));

        if (result.status === 'success') {
            console.log('savePassword - Password saved successfully');
            toastr.success('Password updated successfully');
        } else {
            console.error('savePassword - Server reported failure - Message:', result.message);
            toastr.error(result.message || 'Failed to save password');
        }
    } catch (error) {
        console.error('savePassword - Error saving password - Error:', error.message, 'Stack:', error.stack);
        toastr.error('Failed to save password: ' + error.message);
    }
    console.log('savePassword - Password save process completed');
}// site-navigation.js
// Purpose: Handles navigation and content loading across the site, including authenticated fetch requests, 
// protected page loading, branding, and section/submenu management.

const apiUrl = 'https://clubmadeira.io'; // Default API URL, override if needed

// Performs authenticated fetch requests for protected resources, ensuring proper authorization headers.
async function authenticatedFetch(url, options = {}) {
    console.log('authenticatedFetch - Initiating fetch - URL:', url);
    const token = localStorage.getItem('authToken');
    console.log('authenticatedFetch - Token retrieved from localStorage:', token || 'None');
    console.log('authenticatedFetch - Options provided:', JSON.stringify(options));

    if (!token) {
        console.warn('authenticatedFetch - No authentication token found - Redirecting to /');
        toastr.error('No authentication token found. Please log in.');
        window.location.href = '/';
        return null;
    }

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': options.body instanceof FormData ? undefined : 'application/json'
    };
    console.log('authenticatedFetch - Request headers constructed:', JSON.stringify(headers));

    const finalOptions = {
        ...options,
        headers: headers
    };
    console.log('authenticatedFetch - Final fetch options:', JSON.stringify(finalOptions));

    try {
        console.log('authenticatedFetch - Sending fetch request to:', url);
        const startTime = Date.now();
        const response = await fetch(url, finalOptions);
        const duration = Date.now() - startTime;
        console.log('authenticatedFetch - Fetch response received - Status:', response.status, 'Duration:', `${duration}ms`);
        console.log('authenticatedFetch - Response headers:', JSON.stringify([...response.headers.entries()]));
        console.log('authenticatedFetch - Response URL:', response.url);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('authenticatedFetch - Fetch failed - Status:', response.status, 'Error text:', errorText);
            throw new Error(`Server returned ${response.status}: ${errorText}`);
        }

        if (response.status === 401) {
            console.warn('authenticatedFetch - Unauthorized response (401) - Clearing token and redirecting to /');
            toastr.error('Session expired. Please log in again.');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            window.location.href = '/';
            return null;
        }

        console.log('authenticatedFetch - Fetch successful - Response OK');
        return response;
    } catch (error) {
        console.error('authenticatedFetch - Error during fetch - URL:', url, 'Error:', error.message, 'Stack:', error.stack);
        toastr.error(error.message || 'Failed to connect to server');
        return null;
    }
}

// Fetches protected page content for navigation, ensuring cache-busting with timestamps.
async function fetchProtectedPage(url, options = {}) {
    console.log('fetchProtectedPage - Starting fetch - URL:', url);
    const token = localStorage.getItem('authToken');
    console.log('fetchProtectedPage - Token:', token || 'None');
    console.log('fetchProtectedPage - Options:', JSON.stringify(options));
    if (!token) {
        console.warn('fetchProtectedPage - No token found - Redirecting to /');
        toastr.error('No authentication token found. Please log in.');
        window.location.href = '/';
        return null;
    }
    try {
        const timestamp = Date.now();
        const fetchUrl = `${apiUrl}${url}?t=${timestamp}`;
        console.log('fetchProtectedPage - Constructed fetch URL with timestamp:', fetchUrl);
        const startTime = Date.now();
        const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'text/html'
            }
        });
        const duration = Date.now() - startTime;
        console.log('fetchProtectedPage - Response received - Status:', response.status, 'Duration:', `${duration}ms`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('fetchProtectedPage - Fetch failed - Status:', response.status, 'Error text:', errorText);
            throw new Error(`Server returned ${response.status}: ${errorText}`);
        }
        const html = await response.text();
        console.log('fetchProtectedPage - Fetched HTML (first 100 chars):', html.substring(0, 100) + '...', 'Total length:', html.length);
        return html;
    } catch (error) {
        console.error('fetchProtectedPage - Error fetching page - URL:', url, 'Error:', error.message, 'Stack:', error.stack);
        toastr.error(error.message || 'Failed to load protected page');
        return null;
    }
}

// Loads page-specific branding content into a specified container.
async function loadBranding(brandingType, containerId = 'brandingContent') {
    console.log('loadBranding - Starting branding load - Type:', brandingType, 'Container ID:', containerId);
    const defaultContents = {
        'partner': '<h1>Partner Dashboard</h1>',
        'merchant': '<h1>Merchant Dashboard</h1>',
        'community': '<h1>Community Dashboard</h1>',
        'admin': '<h1>Admin Dashboard</h1>',
        'login': '<h1>Login</h1>',
        'signup': '<h1>Signup</h1>'
    };
    const defaultContent = defaultContents[brandingType] || '<h1>Dashboard</h1>';
    console.log('loadBranding - Default content for type:', brandingType, 'is:', defaultContent);

    const container = document.getElementById(containerId);
    console.log('loadBranding - Container element:', container);
    if (!container) {
        console.error('loadBranding - Container not found - ID:', containerId);
        return;
    }

    try {
        console.log('loadBranding - Fetching branding from:', `${apiUrl}/branding`);
        const startTime = Date.now();
        const response = await authenticatedFetch(`${apiUrl}/branding`);
        const duration = Date.now() - startTime;
        if (!response) {
            console.warn('loadBranding - No response from fetch - Using default content - Type:', brandingType);
            container.innerHTML = defaultContent;
            return;
        }
        console.log('loadBranding - Fetch completed - Duration:', `${duration}ms`);
        const data = await response.json();
        console.log('loadBranding - Branding data received:', JSON.stringify(data));
        const brandingContent = data.content || defaultContent;
        console.log('loadBranding - Setting branding content:', brandingContent);
        container.innerHTML = brandingContent;
        console.log('loadBranding - Branding content updated in container:', containerId);
    } catch (error) {
        console.error('loadBranding - Error loading branding - Type:', brandingType, 'Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error loading ${brandingType} branding: ${error.message}`);
        container.innerHTML = defaultContent;
        console.log('loadBranding - Fallback to default content applied - Container ID:', containerId);
    }
}

// Displays a specific section while hiding others, with optional load callback.
function showSection(sectionId, onSectionLoad = null) {
    console.log('showSection - Starting section display - Section ID:', sectionId);
    console.log('showSection - Callback provided:', typeof onSectionLoad === 'function' ? 'Yes' : 'No');
    const allSections = document.querySelectorAll('.section');
    console.log('showSection - Found sections to hide:', allSections.length);
    allSections.forEach(s => {
        console.log('showSection - Hiding section - ID:', s.id);
        s.classList.remove('active');
        s.style.display = 'none';
    });
    const activeSection = document.getElementById(sectionId);
    console.log('showSection - Target section element:', activeSection);
    if (!activeSection) {
        console.error('showSection - Section not found - ID:', sectionId);
        return;
    }
    activeSection.classList.add('active');
    activeSection.style.display = 'block';
    console.log('showSection - Section activated - ID:', sectionId);
    if (typeof onSectionLoad === 'function') {
        console.log('showSection - Executing onSectionLoad callback for:', sectionId);
        onSectionLoad(sectionId);
    } else {
        console.log('showSection - No callback provided, calling loadSection directly');
        loadSection(sectionId);
    }
    console.log('showSection - Section display completed');
}

// Loads content or configures DOM elements for a specific section based on its ID.
async function loadSection(sectionId) {
    console.log('loadSection - Starting section load - Section ID:', sectionId);

    // Handle static or test sections
    if (['welcome', 'page_visit_test', 'order_test', 'affiliateProgramsIntro', 'userManagementIntro', 'testScriptsIntro', 'referralTestsIntro'].includes(sectionId)) {
        console.log('loadSection - Processing static/test section:', sectionId);
        if (sectionId === 'page_visit_test' || sectionId === 'order_test') {
            const timestampId = sectionId === 'page_visit_test' ? 'pageTimestamp' : 'orderTimestamp';
            const timestampElement = document.getElementById(timestampId);
            console.log('loadSection - Timestamp element for', timestampId, ':', timestampElement);

            if (timestampElement) {
                const timestamp = getCurrentTimestamp(); // From site-request.js
                timestampElement.value = timestamp;
                console.log('loadSection - Set timestamp for', timestampId, 'to:', timestamp);
            } else {
                console.error('loadSection - Timestamp element not found - ID:', timestampId);
            }

            const refererId = sectionId === 'page_visit_test' ? 'pageReferer' : 'orderReferer';
            console.log('loadSection - Populating referer dropdown - ID:', refererId);
            await populateRefererDropdown(refererId); // Page-specific stub
        }
        console.log('loadSection - Static/test section load completed');
        return;
    }

    // Handle category listings
    if (sectionId === 'deal_listings') {
        console.log('loadSection - Loading deal listings');
        await loadCategories(); // From category-management.js
        console.log('loadSection - Deal listings loaded');
        return;
    }

    // Handle entity lists
    if (sectionId === 'merchants') {
        console.log('loadSection - Loading merchants');
        await loadMerchants(); // Page-specific stub
        console.log('loadSection - Merchants loaded');
        return;
    }
    if (sectionId === 'communities') {
        console.log('loadSection - Loading communities');
        await loadCommunities(); // Page-specific stub
        console.log('loadSection - Communities loaded');
        return;
    }
    if (sectionId === 'partners') {
        console.log('loadSection - Loading partners');
        await loadPartners(); // Page-specific stub
        console.log('loadSection - Partners loaded');
        return;
    }

    // Handle configuration sections
    console.log('loadSection - Attempting to load config for section:', sectionId);
    try {
        const fetchUrl = `${window.apiUrl || apiUrl}/config`;
        console.log('loadSection - Fetching config from:', fetchUrl);
        const startTime = Date.now();
        const response = await authenticatedFetch(fetchUrl);
        const duration = Date.now() - startTime;

        if (!response) {
            console.error('loadSection - No response from fetch for config - Section:', sectionId);
            toastr.error('Failed to load section credentials: No response');
            return;
        }
        if (!response.ok) {
            const errorText = await response.text();
            console.error('loadSection - Fetch failed - Status:', response.status, 'Error text:', errorText);
            throw new Error(`Failed to fetch /config: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('loadSection - Config data received - Duration:', `${duration}ms`, 'Data:', JSON.stringify(data));
        const config = data.config[sectionId] || {};
        console.log('loadSection - Config for section:', sectionId, 'is:', JSON.stringify(config));

        // Populate fields based on section
        if (sectionId === 'amazon_uk') {
            const elements = {
                amazonAccessKey: 'ACCESS_KEY',
                amazonSecretKey: 'SECRET_KEY',
                amazonAssociateTag: 'ASSOCIATE_TAG',
                amazonCountry: 'COUNTRY'
            };
            Object.entries(elements).forEach(([id, key]) => {
                const el = document.getElementById(id);
                console.log('loadSection - Checking element - ID:', id, 'Element:', el);
                if (el) {
                    el.value = config[key] || '';
                    console.log('loadSection - Set', id, 'to:', el.value);
                } else {
                    console.error('loadSection - Element not found - ID:', id);
                }
            });
        } else if (sectionId === 'ebay_uk') {
            const el = document.getElementById('ebayAppId');
            console.log('loadSection - eBay App ID element:', el);
            if (el) {
                el.value = config.APP_ID || '';
                console.log('loadSection - Set ebayAppId to:', el.value);
            } else {
                console.error('loadSection - Element not found - ID: ebayAppId');
            }
        } else if (sectionId === 'awin') {
            const el = document.getElementById('awinApiToken');
            console.log('loadSection - Awin API Token element:', el);
            if (el) {
                el.value = config.API_TOKEN || '';
                console.log('loadSection - Set awinApiToken to:', el.value);
            } else {
                console.error('loadSection - Element not found - ID: awinApiToken');
            }
        } else if (sectionId === 'cj') {
            const elements = {
                cjApiKey: 'API_KEY',
                cjWebsiteId: 'WEBSITE_ID'
            };
            Object.entries(elements).forEach(([id, key]) => {
                const el = document.getElementById(id);
                console.log('loadSection - Checking element - ID:', id, 'Element:', el);
                if (el) {
                    el.value = config[key] || '';
                    console.log('loadSection - Set', id, 'to:', el.value);
                } else {
                    console.error('loadSection - Element not found - ID:', id);
                }
            });
        } else if (sectionId === 'textmagic') {
            const elements = {
                textmagicUsername: 'USERNAME',
                textmagicApiKey: 'API_KEY'
            };
            Object.entries(elements).forEach(([id, key]) => {
                const el = document.getElementById(id);
                console.log('loadSection - Checking element - ID:', id, 'Element:', el);
                if (el) {
                    el.value = config[key] || '';
                    console.log('loadSection - Set', id, 'to:', el.value);
                } else {
                    console.error('loadSection - Element not found - ID:', id);
                }
            });
        } else if (sectionId === 'tiny') {
            const el = document.getElementById('tinyApiKey');
            console.log('loadSection - Tiny API Key element:', el);
            if (el) {
                el.value = config.API_KEY || '';
                console.log('loadSection - Set tinyApiKey to:', el.value);
            } else {
                console.error('loadSection - Element not found - ID: tinyApiKey');
            }
        }

        console.log('loadSection - Successfully loaded credentials for:', sectionId);
        toastr.success(`Loaded credentials for ${sectionId}`);
    } catch (error) {
        console.error('loadSection - Error loading section credentials - Section:', sectionId, 'Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error loading credentials: ${error.message}`);
    }
    console.log('loadSection - Section load completed - Section ID:', sectionId);
}

// Toggles submenu visibility for navigation menus.
function toggleSubmenu(submenuId) {
    console.log('toggleSubmenu - Starting toggle - Submenu ID:', submenuId);
    const submenu = document.getElementById(submenuId);
    console.log('toggleSubmenu - Submenu element retrieved:', submenu);
    if (!submenu) {
        console.warn('toggleSubmenu - Submenu element not found - ID:', submenuId);
        return;
    }
    const wasOpen = submenu.classList.contains('open');
    submenu.classList.toggle('open');
    const isOpen = submenu.classList.contains('open');
    console.log('toggleSubmenu - Toggled state - ID:', submenuId, 'Was open:', wasOpen, 'Now open:', isOpen);
    console.log('toggleSubmenu - Toggle completed');
}// site-request.js
// Purpose: Manages site request functionality for merchants and communities (e.g., merchant.html, community.html), 
// including page/email management, domain handling, and TinyMCE integration.

// Adds a page to the site request form based on type (merchant/community).
function addPage(type = 'merchant') {
    console.log('addPage - Adding page to site request - Type:', type);
    const maxPages = 5;
    let pageCount = parseInt(localStorage.getItem(`${type}PageCount`) || (type === 'merchant' ? 2 : 1));
    console.log('addPage - Current page count:', pageCount);

    if (pageCount >= maxPages) {
        console.warn('addPage - Maximum pages reached - Max:', maxPages);
        toastr.error(`Maximum of ${maxPages} pages allowed`);
        return;
    }

    pageCount++;
    console.log('addPage - Incrementing page count to:', pageCount);
    localStorage.setItem(`${type}PageCount`, pageCount);

    const container = document.getElementById('pagesContainer');
    console.log('addPage - Pages container:', container);
    if (!container) {
        console.error('addPage - Pages container not found');
        return;
    }

    const pageDiv = document.createElement('div');
    pageDiv.className = 'page-section';
    pageDiv.dataset.page = pageCount;
    const isMerchantDefault = type === 'merchant' && pageCount <= 2;
    const pageName = isMerchantDefault ? (pageCount === 1 ? 'Home' : 'Returns Policy') : '';
    pageDiv.innerHTML = `
        <label for="page${pageCount}Name">Page Name:</label>
        <input type="text" id="page${pageCount}Name" name="page${pageCount}Name" value="${pageName}" ${isMerchantDefault ? 'readonly' : ''} placeholder="e.g., ${type === 'merchant' ? 'Products' : 'Events'}">
        <br><br>
        <label for="page${pageCount}Content">${isMerchantDefault ? (pageCount === 1 ? 'Home Page' : 'Returns Policy') : 'Page'} Content:</label>
        <textarea id="page${pageCount}Content" name="page${pageCount}Content" placeholder="Describe this page"></textarea>
        <label for="page${pageCount}Images">Additional Images:</label>
        <input type="file" id="page${pageCount}Images" name="page${pageCount}Images" accept="image/*" multiple>
        ${pageCount > (type === 'merchant' ? 2 : 1) ? `<button type="button" class="remove-page-btn" data-page="${pageCount}">Remove Page</button>` : ''}
    `;
    container.appendChild(pageDiv);
    console.log('addPage - New page section added - Page number:', pageCount);

    tinymce.remove(`#page${pageCount}Content`);
    initializeTinyMCE(`#page${pageCount}Content`);
    console.log('addPage - TinyMCE initialized for new page');
    console.log('addPage - Page addition completed');
}

// Removes a page from the site request form based on type (merchant/community).
function removePage(pageNum, type = 'merchant') {
    console.log('removePage - Removing page - Page number:', pageNum, 'Type:', type);
    let pageCount = parseInt(localStorage.getItem(`${type}PageCount`) || (type === 'merchant' ? 2 : 1));
    console.log('removePage - Current page count:', pageCount);
    const minPages = type === 'merchant' ? 2 : 1;

    if (pageCount <= minPages) {
        console.warn('removePage - Cannot remove below minimum pages - Min:', minPages);
        toastr.error(`Cannot remove the last ${type === 'merchant' ? 'Home or Returns Policy' : ''} page${minPages > 1 ? 's' : ''}`);
        return;
    }

    const pageSection = document.querySelector(`.page-section[data-page="${pageNum}"]`);
    console.log('removePage - Page section to remove:', pageSection);
    if (pageSection) {
        tinymce.get(`page${pageNum}Content`)?.remove();
        console.log('removePage - Removed TinyMCE instance for page:', pageNum);
        pageSection.remove();
        pageCount--;
        localStorage.setItem(`${type}PageCount`, pageCount);
        console.log('removePage - Page removed, new page count:', pageCount);
    } else {
        console.error('removePage - Page section not found - Page number:', pageNum);
    }
    console.log('removePage - Removal completed');
}

// Adds an email to the site request form.
function addEmail(type = 'merchant') {
    console.log('addEmail - Adding email to site request - Type:', type);
    const maxEmails = 5;
    let emailCount = parseInt(localStorage.getItem(`${type}EmailCount`) || 1);
    console.log('addEmail - Current email count:', emailCount);

    if (emailCount >= maxEmails) {
        console.warn('addEmail - Maximum emails reached - Max:', maxEmails);
        toastr.error(`Maximum of ${maxEmails} email addresses allowed`);
        return;
    }

    emailCount++;
    console.log('addEmail - Incrementing email count to:', emailCount);
    localStorage.setItem(`${type}EmailCount`, emailCount);

    const container = document.getElementById('emailsContainer');
    console.log('addEmail - Emails container:', container);
    if (!container) {
        console.error('addEmail - Emails container not found');
        return;
    }

    const domain = document.getElementById('preferredDomain')?.value || (type === 'merchant' ? 'mystore.uk' : 'mycommunity.org');
    console.log('addEmail - Using domain:', domain);
    const emailDiv = document.createElement('div');
    emailDiv.className = 'email-section';
    emailDiv.dataset.email = emailCount;
    emailDiv.innerHTML = `
        <label for="email${emailCount}Name">Email Name:</label>
        <input type="text" id="email${emailCount}Name" name="email${emailCount}Name" placeholder="e.g., contact">
        <span id="email${emailCount}Domain">@${domain}</span>
        <button type="button" class="remove-email-btn" data-email="${emailCount}">Remove Email</button>
    `;
    container.appendChild(emailDiv);
    console.log('addEmail - New email section added - Email number:', emailCount);

    updateDomainPreview(type);
    console.log('addEmail - Email addition completed');
}

// Removes an email from the site request form.
function removeEmail(emailNum, type = 'merchant') {
    console.log('removeEmail - Removing email - Email number:', emailNum, 'Type:', type);
    let emailCount = parseInt(localStorage.getItem(`${type}EmailCount`) || 1);
    console.log('removeEmail - Current email count:', emailCount);

    if (emailCount <= 1) {
        console.warn('removeEmail - Cannot remove the last email');
        toastr.error('Cannot remove the last email');
        return;
    }

    const emailSection = document.querySelector(`.email-section[data-email="${emailNum}"]`);
    console.log('removeEmail - Email section to remove:', emailSection);
    if (emailSection) {
        emailSection.remove();
        emailCount--;
        localStorage.setItem(`${type}EmailCount`, emailCount);
        console.log('removeEmail - Email removed, new email count:', emailCount);
        updateDomainPreview(type);
    } else {
        console.error('removeEmail - Email section not found - Email number:', emailNum);
    }
    console.log('removeEmail - Removal completed');
}

// Updates the domain preview and email domain spans for the site request.
function updateDomainPreview(type = 'merchant') {
    console.log('updateDomainPreview - Updating domain preview - Type:', type);
    const domain = document.getElementById('preferredDomain')?.value || (type === 'merchant' ? 'mystore.uk' : 'mycommunity.org');
    console.log('updateDomainPreview - Domain value:', domain);

    const previewElement = document.getElementById('domainPreview');
    if (previewElement) {
        previewElement.textContent = `@${domain}`;
        console.log('updateDomainPreview - Updated domain preview to:', `@${domain}`);
    }

    let emailCount = parseInt(localStorage.getItem(`${type}EmailCount`) || 1);
    console.log('updateDomainPreview - Email count:', emailCount);
    for (let i = 1; i <= emailCount; i++) {
        const domainSpan = document.getElementById(`email${i}Domain`);
        console.log('updateDomainPreview - Checking domain span - ID:', `email${i}Domain`, 'Element:', domainSpan);
        if (domainSpan) {
            domainSpan.textContent = `@${domain}`;
            console.log('updateDomainPreview - Updated email domain - ID:', `email${i}Domain`, 'to:', `@${domain}`);
        }
    }
    console.log('updateDomainPreview - Update completed');
}

// Checks domain availability for the site request.
async function checkDomainAvailability() {
    console.log('checkDomainAvailability - Starting domain availability check');
    const domainInput = document.getElementById('preferredDomain');
    const domain = domainInput?.value;
    console.log('checkDomainAvailability - Domain to check:', domain);

    const domainRegex = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
    if (!domain) {
        console.warn('checkDomainAvailability - No domain provided');
        toastr.error('Please enter a preferred domain name');
        return false;
    }
    if (!domainRegex.test(domain)) {
        console.warn('checkDomainAvailability - Invalid domain format - Domain:', domain);
        toastr.error('Invalid domain name (e.g., mystore.uk)');
        return false;
    }

    console.log('checkDomainAvailability - Domain format valid, proceeding with check');
    toastr.info(`Checking availability for ${domain}...`);

    try {
        const startTime = Date.now();
        const response = await fetch(`https://clubmadeira.io/check-domain?domain=${encodeURIComponent(domain)}`, {
            method: 'GET',
            credentials: 'same-origin'
        });
        const duration = Date.now() - startTime;
        console.log('checkDomainAvailability - Fetch response received - Status:', response.status, 'Duration:', `${duration}ms`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('checkDomainAvailability - Fetch failed - Status:', response.status, 'Error text:', errorText);
            if (response.status === 403) {
                throw new Error('Permission denied - please log in');
            }
            throw new Error(`Server error: ${errorText}`);
        }

        const result = await response.json();
        console.log('checkDomainAvailability - Availability result:', JSON.stringify(result));
        if (result.available) {
            console.log('checkDomainAvailability - Domain available:', domain);
            toastr.success(`${result.domain} is available!`);
            return true;
        } else {
            console.warn('checkDomainAvailability - Domain not available:', domain);
            toastr.error(`${result.domain} is not available`);
            if (domainInput) domainInput.value = '';
            return false;
        }
    } catch (error) {
        console.error('checkDomainAvailability - Error checking domain - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Failed to check domain availability: ${error.message}`);
        return false;
    }
}

// Loads TinyMCE editor for site request content editing.
async function loadTinyMCE() {
    console.log('loadTinyMCE - Starting TinyMCE load');
    if (typeof tinymce !== 'undefined' && tinymce.init) {
        console.log('loadTinyMCE - TinyMCE already loaded');
        initializeTinyMCE();
        return;
    }

    console.log('loadTinyMCE - Loading TinyMCE script');
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.tiny.cloud/1/ml1wlwr128qsm8hn8d86e5mhs3y2fuvjr9ztknrsh23x6krp/tinymce/5/tinymce.min.js';
        script.referrerpolicy = 'origin';
        document.head.appendChild(script);
        console.log('loadTinyMCE - Script element added to head:', script.src);

        script.onload = () => {
            console.log('loadTinyMCE - TinyMCE script loaded successfully');
            initializeTinyMCE();
            resolve();
        };
        script.onerror = () => {
            console.error('loadTinyMCE - Failed to load TinyMCE script');
            toastr.error('Failed to load rich text editor');
            reject(new Error('TinyMCE load failed'));
        };
    });
}

// Initializes TinyMCE editor for site request content editing with a specific selector.
function initializeTinyMCE(selector = 'textarea[name$="Content"], #aboutStore, #aboutCommunity') {
    console.log('initializeTinyMCE - Starting TinyMCE initialization - Selector:', selector);
    if (!window.tinymce) {
        console.error('initializeTinyMCE - TinyMCE not available');
        return;
    }

    tinymce.remove(selector);
    console.log('initializeTinyMCE - Removed existing TinyMCE instances for selector:', selector);

    tinymce.init({
        selector: selector,
        height: 200,
        menubar: false,
        plugins: 'lists',
        toolbar: 'bold italic | bullist numlist',
        setup: editor => {
            editor.on('init', () => {
                console.log('initializeTinyMCE - TinyMCE editor initialized for:', editor.id);
            });
        }
    });
    console.log('initializeTinyMCE - TinyMCE initialization completed');
}

// Generates a formatted timestamp for site request forms.
function getCurrentTimestamp() {
    console.log('getCurrentTimestamp - Generating current timestamp');
    const now = new Date();
    console.log('getCurrentTimestamp - Current date object:', now);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    console.log('getCurrentTimestamp - Extracted components - Year:', year, 'Month:', month, 'Day:', day, 'Hours:', hours, 'Minutes:', minutes, 'Seconds:', seconds);
    const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    console.log('getCurrentTimestamp - Generated timestamp:', timestamp);
    return timestamp;
}

// Saves the site request form data for either a merchant store or community site.
async function saveSiteRequest(type = 'merchant') {
    console.log('saveSiteRequest - Starting site request save - Type:', type);
    const userId = document.getElementById('userId')?.value || localStorage.getItem('userId');
    console.log('saveSiteRequest - Retrieved userId:', userId);

    if (!userId) {
        console.error('saveSiteRequest - User ID not found in session or DOM');
        toastr.error('User ID not found in session');
        return;
    }

    const nameField = type === 'merchant' ? 'storeName' : 'communityName';
    const aboutField = type === 'merchant' ? 'aboutStore' : 'aboutCommunity';
    const logoField = type === 'merchant' ? 'storeLogos' : 'communityLogos';
    const defaultDomain = type === 'merchant' ? 'mystore.uk' : 'mycommunity.org';

    const siteRequest = {
        userId: userId,
        type: type,
        [nameField]: document.getElementById(nameField)?.value.trim() || '',
        [aboutField]: tinymce.get(aboutField)?.getContent() || document.getElementById(aboutField)?.value || '',
        [logoField]: [],
        colorPrefs: document.getElementById('colorPrefs')?.value.trim() || '',
        stylingDetails: document.getElementById('stylingDetails')?.value.trim() || '',
        preferredDomain: document.getElementById('preferredDomain')?.value.trim() || defaultDomain,
        emails: [],
        pages: [],
        widgets: Array.from(document.querySelectorAll('input[name="widgets"]:checked')).map(cb => cb.value)
    };
    console.log('saveSiteRequest - Initial site request object:', JSON.stringify(siteRequest));

    // Validation
    if (!siteRequest[nameField]) {
        console.warn('saveSiteRequest - Name field is empty - Field:', nameField);
        toastr.error(`${type === 'merchant' ? 'Store' : 'Community'} name is required`);
        return;
    }

    const domainRegex = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(siteRequest.preferredDomain)) {
        console.warn('saveSiteRequest - Invalid domain format - Domain:', siteRequest.preferredDomain);
        toastr.error(`Invalid domain name (e.g., ${defaultDomain})`);
        return;
    }

    // Handle logos
    const logoFiles = document.getElementById(logoField)?.files || [];
    console.log('saveSiteRequest - Logo files count:', logoFiles.length);
    if (logoFiles.length > 5) {
        console.warn('saveSiteRequest - Too many logos - Count:', logoFiles.length);
        toastr.error('Maximum of 5 logos allowed');
        return;
    }
    for (let i = 0; i < logoFiles.length; i++) {
        const reader = new FileReader();
        await new Promise(resolve => {
            reader.onload = () => {
                siteRequest[logoField].push(reader.result);
                console.log('saveSiteRequest - Added logo - Index:', i, 'Result length:', reader.result.length);
                resolve();
            };
            reader.readAsDataURL(logoFiles[i]);
        });
    }

    // Collect emails
    let emailCount = parseInt(localStorage.getItem(`${type}EmailCount`) || 1);
    console.log('saveSiteRequest - Collecting emails - Email count:', emailCount);
    for (let i = 1; i <= emailCount; i++) {
        const emailInput = document.getElementById(`email${i}Name`);
        if (emailInput && emailInput.value.trim()) {
            siteRequest.emails.push(emailInput.value.trim());
            console.log('saveSiteRequest - Added email - Index:', i, 'Value:', emailInput.value.trim());
        }
    }

    // Collect pages
    let pageCount = parseInt(localStorage.getItem(`${type}PageCount`) || (type === 'merchant' ? 2 : 1));
    console.log('saveSiteRequest - Collecting pages - Page count:', pageCount);
    for (let i = 1; i <= pageCount; i++) {
        const nameInput = document.getElementById(`page${i}Name`);
        const contentEditor = tinymce.get(`page${i}Content`);
        const contentFallback = document.getElementById(`page${i}Content`);
        const imagesInput = document.getElementById(`page${i}Images`);
        if (nameInput && nameInput.value.trim()) {
            const page = {
                name: nameInput.value.trim(),
                content: contentEditor ? contentEditor.getContent() : (contentFallback?.value || ''),
                images: []
            };
            console.log('saveSiteRequest - Processing page - Index:', i, 'Name:', page.name);

            if (imagesInput && imagesInput.files.length > 0) {
                for (let j = 0; j < imagesInput.files.length; j++) {
                    const reader = new FileReader();
                    await new Promise(resolve => {
                        reader.onload = () => {
                            page.images.push(reader.result);
                            console.log('saveSiteRequest - Added image to page - Page:', i, 'Image index:', j, 'Result length:', reader.result.length);
                            resolve();
                        };
                        reader.readAsDataURL(imagesInput.files[j]);
                    });
                }
            }
            siteRequest.pages.push(page);
        }
    }

    const minPages = type === 'merchant' ? 2 : 1;
    if (siteRequest.pages.length < minPages || (type === 'merchant' && (!siteRequest.pages.some(p => p.name === 'Home') || !siteRequest.pages.some(p => p.name === 'Returns Policy')))) {
        console.warn('saveSiteRequest - Insufficient or missing required pages - Pages:', siteRequest.pages.length, 'Required:', minPages);
        toastr.error(type === 'merchant' ? 'Home and Returns Policy pages are required' : 'At least one page is required');
        return;
    }

    // Save to server
    try {
        console.log('saveSiteRequest - Sending site request to server - URL:', `${apiUrl}/${userId}/siterequest`);
        const startTime = Date.now();
        const response = await authenticatedFetch(`${apiUrl}/${userId}/siterequest`, {
            method: 'POST',
            body: JSON.stringify(siteRequest)
        });
        const duration = Date.now() - startTime;

        if (!response) {
            console.error('saveSiteRequest - No response from fetch');
            toastr.error('Failed to save site request: No server response');
            return;
        }
        if (!response.ok) {
            const errorText = await response.text();
            console.error('saveSiteRequest - Fetch failed - Status:', response.status, 'Error text:', errorText);
            throw new Error(`Failed to save site request: ${response.status} - ${errorText}`);
        }

        console.log('saveSiteRequest - Save successful - Duration:', `${duration}ms`);
        toastr.success(`${type === 'merchant' ? 'Store' : 'Site'} request saved successfully`);
    } catch (error) {
        console.error('saveSiteRequest - Error saving site request - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error saving ${type === 'merchant' ? 'store' : 'site'} request: ${error.message}`);
    }
    console.log('saveSiteRequest - Save process completed');
}// user-management.js
// Purpose: Manages user-specific settings and Wix client ID operations.

// Loads user settings into the DOM.
async function loadSettings() {
    console.log('loadSettings - Starting settings load');
    const userId = localStorage.getItem('userId');
    console.log('loadSettings - Retrieved userId:', userId);

    if (!userId) {
        console.error('loadSettings - User ID not found in session');
        toastr.error('User ID not found in session');
        return;
    }

    try {
        console.log('loadSettings - Fetching settings via authenticatedFetch - URL:', `${window.apiUrl}/${userId}/user`);
        const startTime = Date.now();
        const response = await authenticatedFetch(`${window.apiUrl}/${userId}/user`);
        const duration = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            console.error('loadSettings - Fetch failed - Status:', response.status, 'Error:', errorText);
            throw new Error(`Failed to fetch settings: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('loadSettings - Settings fetched - Data:', JSON.stringify(data), 'Duration:', `${duration}ms`);

        // Update DOM with settings
        const referrerId = document.getElementById('referrerId');
        const contactName = document.getElementById('contactName');
        const websiteUrl = document.getElementById('websiteUrl');
        const emailAddress = document.getElementById('emailAddress');
        const phoneNumber = document.getElementById('phoneNumber');

        if (referrerId) referrerId.textContent = userId;
        if (contactName) contactName.value = data.contact_name || '';
        if (websiteUrl) websiteUrl.value = data.website_url || '';
        if (emailAddress) emailAddress.value = data.email_address || '';
        if (phoneNumber) phoneNumber.value = data.phone_number || '';

        console.log('loadSettings - DOM updated - Fields:', {
            referrerId: userId,
            contactName: data.contact_name || '',
            websiteUrl: data.website_url || '',
            emailAddress: data.email_address || '',
            phoneNumber: data.phone_number || ''
        });
    } catch (error) {
        console.error('loadSettings - Error loading settings - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error loading settings: ${error.message}`);
    }
    console.log('loadSettings - Settings load completed');
}

// Saves user settings from the DOM.
async function saveSettings(settings) {
    console.log('saveSettings - Starting settings save - Settings:', JSON.stringify(settings));
    const userId = localStorage.getItem('userId');
    console.log('saveSettings - Retrieved userId:', userId);

    if (!userId) {
        console.error('saveSettings - User ID not found in session');
        toastr.error('User ID not found in session');
        return;
    }

    try {
        console.log('saveSettings - Sending settings via authenticatedFetch - URL:', `${window.apiUrl}/${userId}/user`);
        const startTime = Date.now();
        const response = await authenticatedFetch(`${window.apiUrl}/${userId}/user`, {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
        const duration = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            console.error('saveSettings - Fetch failed - Status:', response.status, 'Error:', errorText);
            throw new Error(`Failed to save settings: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('saveSettings - Save response received - Result:', JSON.stringify(result), 'Duration:', `${duration}ms`);
        toastr.success('Settings saved successfully');
    } catch (error) {
        console.error('saveSettings - Error saving settings - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Failed to save settings: ${error.message}`);
    }
    console.log('saveSettings - Save process completed');
}

// Loads Wix client ID into the DOM.
async function loadWixClientId() {
    console.log('loadWixClientId - Starting Wix client ID load');
    const userId = localStorage.getItem('userId');
    console.log('loadWixClientId - Retrieved userId:', userId);

    if (!userId) {
        console.error('loadWixClientId - User ID not found in session');
        toastr.error('User ID not found in session');
        return;
    }

    try {
        console.log('loadWixClientId - Fetching Wix client ID via authenticatedFetch - URL:', `${window.apiUrl}/${userId}/wix-client-id`);
        const startTime = Date.now();
        const response = await authenticatedFetch(`${window.apiUrl}/${userId}/wix-client-id`);
        const duration = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            console.error('loadWixClientId - Fetch failed - Status:', response.status, 'Error:', errorText);
            throw new Error(`Failed to fetch Wix client ID: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('loadWixClientId - Wix client ID fetched - Data:', JSON.stringify(data), 'Duration:', `${duration}ms`);

        // Update DOM with Wix client ID
        const wixClientIdField = document.getElementById('wixClientId');
        if (wixClientIdField) {
            wixClientIdField.value = data.client_id || data.clientId || ''; // Flexible key name
            console.log('loadWixClientId - DOM updated - wixClientId:', data.client_id || data.clientId || '');
        } else {
            console.warn('loadWixClientId - Wix client ID field not found - ID: wixClientId');
        }
    } catch (error) {
        console.error('loadWixClientId - Error loading Wix client ID - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error loading Wix client ID: ${error.message}`);
    }
    console.log('loadWixClientId - Wix client ID load completed');
}

// Saves Wix client ID from the DOM.
async function saveWixClientId(clientId) {
    console.log('saveWixClientId - Starting Wix client ID save - Client ID:', clientId);
    const userId = localStorage.getItem('userId');
    console.log('saveWixClientId - Retrieved userId:', userId);

    if (!userId) {
        console.error('saveWixClientId - User ID not found in session');
        toastr.error('User ID not found in session');
        return;
    }

    try {
        console.log('saveWixClientId - Sending Wix client ID via authenticatedFetch - URL:', `${window.apiUrl}/${userId}/wix-client-id`);
        const startTime = Date.now();
        const response = await authenticatedFetch(`${window.apiUrl}/${userId}/wix-client-id`, {
            method: 'POST',
            body: JSON.stringify({ clientId })
        });
        const duration = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            console.error('saveWixClientId - Fetch failed - Status:', response.status, 'Error:', errorText);
            throw new Error(`Failed to save Wix client ID: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('saveWixClientId - Save response received - Result:', JSON.stringify(result), 'Duration:', `${duration}ms`);
        toastr.success('Wix client ID saved successfully');
    } catch (error) {
        console.error('saveWixClientId - Error saving Wix client ID - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Failed to save Wix client ID: ${error.message}`);
    }
    console.log('saveWixClientId - Save process completed');
}