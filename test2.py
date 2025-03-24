
        // Global variables defined once
        if (typeof window.apiUrl === 'undefined') window.apiUrl = 'https://clubmadeira.io';
        if (typeof window.userPermissions === 'undefined') window.userPermissions = [];

        (function() { // Self-executing function to isolate scope
            console.log('Admin inline script running'); // Debug log to confirm script execution

            function decodeJWT(token) {
                if (!token || typeof token !== 'string') return null;
                if (!token.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)) return null;
                const parts = token.split('.');
                try {
                    const base64Url = parts[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                    return JSON.parse(jsonPayload);
                } catch (error) {
                    console.error('Error decoding JWT:', error.message);
                    return null;
                }
            }

            function initializeAdmin() {
                console.log('Initializing admin page'); // Debug log
                const token = localStorage.getItem('authToken');
                if (!token) {
                    window.location.href = '/';
                    return;
                }
                const decoded = decodeJWT(token);
                if (!decoded) {
                    window.location.href = '/';
                    return;
                }
                window.userPermissions = decoded.permissions || [];
                if (!window.userPermissions.includes('admin')) {
                    toastr.error('Permission denied: Admin permission required');
                    window.location.href = '/';
                    return;
                }
                loadBranding();
                attachEventListeners();
            }

            // Define window.initPage for dynamic initialization
            window.initPage = function() {
                initializeAdmin();
            };

            toastr.options = { closeButton: true, progressBar: true, positionClass: 'toast-top-right', timeOut: 5000, showMethod: 'slideDown', hideMethod: 'slideUp' };

            async function fetchProtectedPage(url) {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    toastr.error('No authentication token found. Please log in.');
                    window.location.href = '/';
                    return;
                }
                try {
                    console.log('Requested URL:', url); // Debug: Log requested URL
                    const timestamp = Date.now();
                    const fetchUrl = `${window.apiUrl}${url}?t=${timestamp}`; // Prevent caching
                    console.log('Fetching from:', fetchUrl); // Debug: Log fetch URL with timestamp
                    const response = await fetch(fetchUrl, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'text/html'
                        }
                    });
                    console.log('Response status:', response.status); // Debug: Log response status
                    console.log('Fetched URL:', response.url); // Debug: Log final URL after redirects
                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Server returned ${response.status}: ${errorText}`);
                    }
                    const html = await response.text();
                    console.log('Fetched HTML for', url, ':', html); // Debug: Log fetched HTML
                    document.body.innerHTML = html;
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const scripts = doc.querySelectorAll('script:not([src])');
                    scripts.forEach((script, index) => {
                        if (script.innerHTML.trim()) {
                            console.log(`Executing inline script ${index + 1}`); // Debug: Before script execution
                            try {
                                new Function(script.innerHTML)();
                                console.log(`Inline script ${index + 1} executed successfully`); // Debug: After successful execution
                            } catch (e) {
                                console.error(`Error executing inline script ${index + 1}:`, e); // Debug: Log execution errors
                            }
                        }
                    });
                    if (typeof window.initPage === 'function') {
                        console.log('Calling window.initPage'); // Debug: Before calling initPage
                        window.initPage();
                    } else {
                        console.warn('No initPage function found for this page'); // Debug: Warn if initPage is missing
                    }
                } catch (error) {
                    console.error('Error fetching protected page:', error);
                    toastr.error(error.message || 'Failed to load protected page');
                    setTimeout(() => window.location.href = '/', 3000);
                }
            }

            function handleSectionClick(event) {
                const section = this.getAttribute('data-section');
                const submenu = this.getAttribute('data-submenu');
                if (submenu) toggleSubmenu(submenu);
                if (section) showSection(section);
            }

            function handleHrefClick() {
                const href = this.getAttribute('data-href');
                fetchProtectedPage(href);
            }

            function handleAffiliateClick() {
                const affiliate = this.getAttribute('data-affiliate');
                updateAffiliate(affiliate);
            }

            function attachEventListeners() {
                const sectionButtons = document.querySelectorAll('.menu button[data-section]');
                sectionButtons.forEach(button => {
                    button.removeEventListener('click', handleSectionClick);
                    button.addEventListener('click', handleSectionClick);
                });

                const hrefButtons = document.querySelectorAll('.menu button[data-href]');
                hrefButtons.forEach(button => {
                    button.removeEventListener('click', handleHrefClick);
                    button.addEventListener('click', handleHrefClick);
                });

                const affiliateButtons = document.querySelectorAll('.form button[data-affiliate]');
                affiliateButtons.forEach(button => {
                    button.removeEventListener('click', handleAffiliateClick);
                    button.addEventListener('click', handleAffiliateClick);
                });

                const logOffBtn = document.getElementById('logOffBtn');
                if (logOffBtn) {
                    logOffBtn.removeEventListener('click', logOff);
                    logOffBtn.addEventListener('click', logOff);
                }

                submitReferral('pageVisitForm', 'Page visit recorded successfully');
                submitReferral('orderForm', 'Order recorded successfully');
            }

            async function loadBranding() {
                try {
                    const response = await authenticatedFetch(`${window.apiUrl}/branding`);
                    if (!response.ok) throw new Error(`Failed to fetch branding: ${response.status}`);
                    const data = await response.json();
                    document.getElementById('brandingContent').innerHTML = data.content || '<h1>Admin Dashboard</h1>';
                } catch (error) {
                    toastr.error(`Error loading branding: ${error.message}`);
                    document.getElementById('brandingContent').innerHTML = '<h1>Admin Dashboard</h1>';
                }
            }

            function getCurrentTimestamp() {
                const now = new Date();
                return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            }

            async function authenticatedFetch(url, options = {}) {
                const token = localStorage.getItem('authToken');
                options.headers = {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
                const response = await fetch(url, options);
                if (response.status === 401) {
                    toastr.error('Session expired. Please log in again.');
                    localStorage.removeItem('authToken');
                    window.location.href = '/';
                }
                return response;
            }

            function toggleSubmenu(submenuId) {
                const submenu = document.getElementById(submenuId);
                if (submenu) {
                    submenu.classList.toggle('open');
                }
            }

            function showSection(section) {
                document.querySelectorAll('.section').forEach(s => {
                    s.classList.remove('active');
                    s.style.display = 'none';
                });
                const activeSection = document.getElementById(section);
                if (activeSection) {
                    activeSection.classList.add('active');
                    activeSection.style.display = 'block';
                    loadSection(section);
                }
            }

            async function loadSection(section) {
                if (section === 'welcome' || section === 'page_visit_test' || section === 'order_test' || 
                    section === 'affiliateProgramsIntro' || section === 'userManagementIntro' || 
                    section === 'testScriptsIntro' || section === 'referralTestsIntro') {
                    if (section === 'page_visit_test' || section === 'order_test') {
                        document.getElementById(section === 'page_visit_test' ? 'pageTimestamp' : 'orderTimestamp').value = getCurrentTimestamp();
                        await populateRefererDropdown(section === 'page_visit_test' ? 'pageReferer' : 'orderReferer');
                    }
                    return;
                }

                if (section === 'deal_listings') {
                    await loadCategories();
                    return;
                }

                if (section === 'merchants') {
                    await loadMerchants();
                    return;
                }

                if (section === 'communities') {
                    await loadCommunities();
                    return;
                }

                if (section === 'partners') {
                    await loadPartners();
                    return;
                }

                try {
                    const response = await authenticatedFetch(`${window.apiUrl}/config`);
                    if (!response.ok) throw new Error(`Failed to fetch /config: ${response.status}`);
                    const data = await response.json();
                    const config = data.config[section] || {};

                    if (section === 'amazon_uk') {
                        document.getElementById('amazonAccessKey').value = config.ACCESS_KEY || '';
                        document.getElementById('amazonSecretKey').value = config.SECRET_KEY || '';
                        document.getElementById('amazonAssociateTag').value = config.ASSOCIATE_TAG || '';
                        document.getElementById('amazonCountry').value = config.COUNTRY || '';
                    } else if (section === 'ebay_uk') {
                        document.getElementById('ebayAppId').value = config.APP_ID || '';
                    } else if (section === 'awin') {
                        document.getElementById('awinApiToken').value = config.API_TOKEN || '';
                    } else if (section === 'cj') {
                        document.getElementById('cjApiKey').value = config.API_KEY || '';
                        document.getElementById('cjWebsiteId').value = config.WEBSITE_ID || '';
                    } else if (section === 'textmagic') {
                        document.getElementById('textmagicUsername').value = config.USERNAME || '';
                        document.getElementById('textmagicApiKey').value = config.API_KEY || '';
                    } else if (section === 'tiny') {
                        document.getElementById('tinyApiKey').value = config.API_KEY || '';
                    }
                    toastr.success(`Loaded credentials for ${section}`);
                } catch (error) {
                    toastr.error(`Error loading credentials: ${error.message}`);
                }
            }

            async function populateRefererDropdown(selectId) {
                try {
                    const usersResponse = await authenticatedFetch(`${window.apiUrl}/users`);
                    if (!usersResponse.ok) throw new Error(`Failed to fetch users: ${usersResponse.status}`);
                    const usersData = await usersResponse.json();
                    const users = usersData.users;

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
                } catch (error) {
                    toastr.error(`Error loading referer options: ${error.message}`);
                    document.getElementById(selectId).innerHTML = '<option value="">Error loading users</option>';
                }
            }

            async function loadMerchants() {
                try {
                    const usersResponse = await authenticatedFetch(`${window.apiUrl}/users`);
                    if (!usersResponse.ok) throw new Error(`Failed to fetch users: ${usersResponse.status}`);
                    const usersData = await usersResponse.json();
                    const users = usersData.users;

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

                    updateUserTable('merchantsList', merchants, 'merchants');
                    toastr.success('Merchants loaded successfully');
                } catch (error) {
                    toastr.error(`Error loading merchants: ${error.message}`);
                }
            }

            async function loadCommunities() {
                try {
                    const usersResponse = await authenticatedFetch(`${window.apiUrl}/users`);
                    if (!usersResponse.ok) throw new Error(`Failed to fetch users: ${usersResponse.status}`);
                    const usersData = await usersResponse.json();
                    const users = usersData.users;

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

                    updateUserTable('communitiesList', communities, 'communities');
                    toastr.success('Communities loaded successfully');
                } catch (error) {
                    toastr.error(`Error loading communities: ${error.message}`);
                }
            }

            async function loadPartners() {
                try {
                    const usersResponse = await authenticatedFetch(`${window.apiUrl}/users`);
                    if (!usersResponse.ok) throw new Error(`Failed to fetch users: ${usersResponse.status}`);
                    const usersData = await usersResponse.json();
                    const users = usersData.users;

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

                    updateUserTable('partnersList', partners, 'partners');
                    toastr.success('Partners loaded successfully');
                } catch (error) {
                    toastr.error(`Error loading partners: ${error.message}`);
                }
            }

            function updateUserTable(tableId, users, section) {
                const tbody = document.getElementById(tableId);
                tbody.innerHTML = '';
                if (users.length === 0) {
                    const colspan = section === 'communities' ? 3 : 4;
                    tbody.innerHTML = `<tr><td colspan="${colspan}">No users found</td></tr>`;
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
            }

            async function togglePermission(userId, permission, section, isChecked) {
                try {
                    const method = isChecked ? 'POST' : 'DELETE';
                    const response = await authenticatedFetch(`${window.apiUrl}/permissions/${userId}`, {
                        method: method,
                        body: JSON.stringify({ permission })
                    });
                    if (!response.ok) throw new Error(`Failed to ${isChecked ? 'add' : 'remove'} permission: ${response.status}`);
                    const data = await response.json();
                    toastr.success(data.message || `${isChecked ? 'Added' : 'Removed'} ${permission} permission for user ${userId}`);
                    loadSection(section);
                } catch (error) {
                    toastr.error(`Error: ${error.message}`);
                    loadSection(section);
                }
            }

            async function updateAffiliate(affiliate) {
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
                    toastr.warning('No changes to update');
                    return;
                }

                try {
                    const response = await authenticatedFetch(`${window.apiUrl}/config/${affiliate}`, {
                        method: 'PATCH',
                        body: JSON.stringify(credentials)
                    });
                    if (!response.ok) throw new Error(`Failed to update: ${response.status}`);
                    const data = await response.json();
                    toastr.success(`Update successful: ${data.message}`);
                } catch (error) {
                    toastr.error(`Error updating credentials: ${error.message}`);
                }
            }

            async function submitReferral(formId, successMessage) {
                const form = document.getElementById(formId);
                if (form.dataset.listenerAdded) return;
                form.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    const formData = new FormData(form);
                    const jsonData = Object.fromEntries(formData.entries());
                    try {
                        const response = await authenticatedFetch(`${window.apiUrl}/referal`, {
                            method: 'POST',
                            body: JSON.stringify(jsonData),
                        });
                        if (!response.ok) throw new Error((await response.json()).message || 'Unknown error');
                        const data = await response.json();
                        if (data.status === 'success') {
                            toastr.success(`${successMessage} - Referer: ${data.referer}`);
                        } else {
                            toastr.error(data.message || 'Unknown error');
                        }
                    } catch (error) {
                        toastr.error(error.message || 'Failed to connect to server');
                    }
                });
                form.dataset.listenerAdded = 'true';
            }

            function logOff() {
                if (confirm('Are you sure you want to log off?')) {
                    localStorage.removeItem('authToken');
                    toastr.success('Logged off successfully');
                    setTimeout(() => window.location.href = '/', 1000);
                }
            }

            async function loadCategories() {
                try {
                    const response = await authenticatedFetch(`${window.apiUrl}/categories`);
                    if (!response.ok) throw new Error(`Failed to fetch /categories: ${response.status}`);
                    const data = await response.json();
                    const tree = document.getElementById('categoryTree');
                    tree.innerHTML = '';
                    const ul = document.createElement('ul');
                    data.categories.forEach(cat => ul.appendChild(createTreeNode(cat)));
                    tree.appendChild(ul);
                    toastr.success('Categories loaded successfully');
                } catch (error) {
                    toastr.error(`Error loading categories: ${error.message}`);
                }
            }

            function createTreeNode(category) {
                const li = document.createElement('li');
                const nodeDiv = document.createElement('div');
                nodeDiv.className = 'node';

                const toggle = document.createElement('span');
                toggle.className = 'toggle';
                toggle.textContent = '+';
                toggle.onclick = () => toggleSubcategories(category.id, toggle);

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = category.id;
                checkbox.onchange = () => handleCategorySelection(category.id, checkbox);

                const span = document.createElement('span');
                span.textContent = `${category.name} (${category.id})`;

                nodeDiv.appendChild(toggle);
                nodeDiv.appendChild(checkbox);
                nodeDiv.appendChild(span);
                li.appendChild(nodeDiv);

                const subUl = document.createElement('ul');
                subUl.className = 'subcategories';
                li.appendChild(subUl);

                return li;
            }

            async function toggleSubcategories(parentId, toggle) {
                const li = toggle.closest('li');
                const subUl = li.querySelector('.subcategories');

                if (subUl.classList.contains('open')) {
                    subUl.classList.remove('open');
                    toggle.textContent = '+';
                } else {
                    if (subUl.children.length === 0) {
                        try {
                            const response = await authenticatedFetch(`${window.apiUrl}/categories?parent_id=${parentId}`);
                            if (!response.ok) throw new Error(`Failed to fetch subcategories: ${response.status}`);
                            const data = await response.json();
                            if (data.categories.length === 0) {
                                toastr.info(`No subcategories for ${parentId}`);
                                return;
                            }
                            data.categories.forEach(cat => subUl.appendChild(createTreeNode(cat)));
                            toastr.success(`Subcategories for ${parentId} loaded successfully`);
                        } catch (error) {
                            toastr.error(`Error loading subcategories: ${error.message}`);
                            return;
                        }
                    }
                    subUl.classList.add('open');
                    toggle.textContent = '-';
                }
            }

            async function handleCategorySelection(categoryId, checkbox) {
                document.querySelectorAll('#categoryTree input[type="checkbox"]').forEach(cb => {
                    if (cb !== checkbox) cb.checked = false;
                });

                if (checkbox.checked) {
                    try {
                        const response = await authenticatedFetch(`${window.apiUrl}/discounted-products?category_id=${categoryId}&min_discount=20`);
                        if (!response.ok) throw new Error(`Failed to fetch discounted products: ${response.status}`);
                        const data = await response.json();
                        const tbody = document.getElementById('dealList');
                        tbody.innerHTML = '';
                        data.products.forEach(product => tbody.appendChild(createDealRow(product)));
                        toastr.success(`Loaded ${data.count} discounted products for category ${categoryId}`);
                    } catch (error) {
                        toastr.error(`Error loading discounted products: ${error.message}`);
                        checkbox.checked = false;
                    }
                } else {
                    document.getElementById('dealList').innerHTML = '';
                }
            }

            function createDealRow(product) {
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
                return tr;
            }

            // Initial page load
            initializeAdmin();
        })();
    