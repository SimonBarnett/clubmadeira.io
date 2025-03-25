// community-page.js
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
    if (!window.userPermissions.includes('admin') || window.userPermissions.includes('community')) {
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
}