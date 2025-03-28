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
    if (!window.userPermissions.includes('community')) {
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
    const userIdInput = document.getElementById('userId');
    if (userIdInput) {
        userIdInput.value = userId;
    } else {
        console.warn('initializeCommunity - userId input not found');
    }

    // Set up navigation and event listeners to fix button functionality
    setupNavigation(); // From site-navigation.js (CREQ Requirement 1)
    attachEventListeners(); // From page-load.js (CREQ Requirement 1)

    // Load branding and initial data
    loadBranding('community', 'brandingContent');
    updateMenu();
    showSection('welcome');
    waitForTinyMCE(() => initializeTinyMCE('#aboutCommunity, #stylingDetails, #page1Content'));
    loadVisits();
    loadOrders();
    loadCategories(userId, false); // Added for treeview (Requirement 1)

    // Set up shared "Change Password" logic
    if (typeof setupChangePassword === 'function') {
        setupChangePassword(); // From user-management.js (CREQ Requirement 2)
        console.log('initializeCommunity - Change Password logic initialized');
    } else {
        console.error('initializeCommunity - setupChangePassword function not found');
    }

    // Hide loading overlay after initialization
    hideLoadingOverlay(); // From page-load.js (CREQ Requirement 3)
    console.log('initializeCommunity - Community page initialized successfully');
}

// Updates the menu dynamically based on permissions.
function updateMenu() {
    console.log('updateMenu - Updating menu');
    const menu = document.getElementById('menu');
    const userId = document.getElementById('userId') ? document.getElementById('userId').value : '';
    if (menu) {
        menu.innerHTML = `<input type="text" id="userId" style="display: none;" value="${userId || ''}">`;
        menu.innerHTML += `
            <button data-submenu="my_website_intro" data-section="my_website_intro">
                <span class="button-content"><i class="fas fa-globe"></i> My Web Site</span>
                <i class="fas fa-caret-right caret"></i>
            </button>
            <div id="my_website_intro" class="submenu">
                <button data-section="wix">
                    <span class="button-content"><i class="fab fa-wix-simple"></i> Wix</span>
                </button>
                <button data-section="wordpress">
                    <span class="button-content"><i class="fab fa-wordpress"></i> WordPress</span>
                </button>
                <button data-section="squarespace">
                    <span class="button-content"><i class="fab fa-squarespace"></i> Squarespace</span>
                </button>
                <button data-section="weebly">
                    <span class="button-content"><i class="fab fa-weebly"></i> Weebly</span>
                </button>
                <button data-section="joomla">
                    <span class="button-content"><i class="fab fa-joomla"></i> Joomla</span>
                </button>
                <button data-section="no_website">
                    <span class="button-content"><i class="fas fa-question-circle"></i> I Don’t Have a Website Yet</span>
                </button>
            </div>
            <button data-section="categories">
                <span class="button-content"><i class="fas fa-list"></i> My Categories</span>
            </button>
            <button data-submenu="referrals_intro" data-section="referrals_intro">
                <span class="button-content">
                    <span class="svg-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" preserveAspectRatio="xMidYMid meet">
                            <path d="M72 88a56 56 0 1 1 112 0A56 56 0 1 1 72 88zM64 245.7C54 256.9 48 271.8 48 288s6 31.1 16 42.3l0-84.7zm144.4-49.3C178.7 222.7 160 261.2 160 304c0 34.3 12 65.8 32 90.5l0 21.5c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32l0-26.8C26.2 371.2 0 332.7 0 288c0-61.9 50.1-112 112-112l32 0c24 0 46.2 7.5 64.4 20.3zM448 416l0-21.5c20-24.7 32-56.2 32-90.5c0-42.8-18.7-81.3-48.4-107.7C449.8 183.5 472 176 496 176l32 0c61.9 0 112 50.1 112 112c0 44.7-26.2 83.2-64 101.2l0 26.8c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32zm8-328a56 56 0 1 1 112 0A56 56 0 1 1 456 88zM576 245.7l0 84.7c10-11.3 16-26.1 16-42.3s-6-31.1-16-42.3zM320 32a64 64 0 1 1 0 128 64 64 0 1 1 0-128zM240 304c0 16.2 6 31 16 42.3l0-84.7c-10 11.3-16 26.1-16 42.3zm144-42.3l0 84.7c10-11.3 16-26.1 16-42.3s-6-31.1-16-42.3zM448 304c0 44.7-26.2 83.2-64 101.2l0 42.8c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32l0-42.8c-37.8-18-64-56.5-64-101.2c0-61.9 50.1-112 112-112l32 0c61.9 0 112 50.1 112 112z"/>
                        </svg>
                    </span> My Referrals
                </span>
                <i class="fas fa-caret-right caret"></i>
            </button>
            <div id="referrals_intro" class="submenu">
                <button data-section="visits">
                    <span class="button-content"><i class="fas fa-eye"></i> Visits</span>
                </button>
                <button data-section="orders">
                    <span class="button-content"><i class="fas fa-shopping-cart"></i> Orders</span>
                </button>
            </div>
            <button data-submenu="my-account-submenu" data-section="my-account">
                <span class="button-content"><i class="fas fa-cog"></i> My Account</span>
                <i class="fas fa-caret-right caret"></i>
            </button>
            <div id="my-account-submenu" class="submenu">
                <button data-section="my-account">
                    <span class="button-content"><i class="fas fa-address-book"></i> Contact</span>
                </button>
                <button data-section="change-password">
                    <span class="button-content"><i class="fas fa-key"></i> Change Password</span>
                </button>
            </div>
        `;
        if (window.userPermissions.includes('admin')) {
            menu.innerHTML += `
                <button data-href="/admin" class="btn-admin">
                    <span class="button-content"><i class="fas fa-arrow-left"></i> Back to Admin</span>
                </button>
            `;
        }
        menu.innerHTML += `
            <button id="logOffBtn" class="btn-logoff">
                <span class="button-content"><i class="fas fa-sign-out-alt"></i> Log Off</span>
            </button>
        `;
        console.log('updateMenu - Menu updated');
    } else {
        console.error('updateMenu - Menu element not found');
    }
}

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
    const userId = document.getElementById('userId')?.value || 'unknown'; // Null-safe
    if (codeId) {
        const codeElement = document.getElementById(codeId);
        if (codeElement) {
            codeElement.textContent = `<iframe src="https://clubmadeira.io/discounts?referrer=${userId}" width="100%" height="600"></iframe>`;
            console.log('updateIntegrationCode - Code updated - ID:', codeId);
        } else {
            console.warn('updateIntegrationCode - Code element not found - ID:', codeId);
        }
    }
}

async function loadVisits() {
    console.log('loadVisits - Loading visits');
    const userId = document.getElementById('userId')?.value || '';
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
                if (visitDate.getFullYear() === thisYear && visitDate.getMonth() === thisMonth) {
                    visitsThisMonth.push(visit);
                } else if ((visitDate.getFullYear() === thisYear && visitDate.getMonth() === thisMonth - 1) ||
                          (visitDate.getFullYear() === thisYear - 1 && thisMonth === 0 && visitDate.getMonth() === 11)) {
                    visitsLastMonth.push(visit);
                } else {
                    visitsEarlier.push(visit);
                }
            });
            updateVisitsTable('visitsListThisMonth', visitsThisMonth);
            updateVisitsTable('visitsListLastMonth', visitsLastMonth);
            updateVisitsTable('visitsListEarlier', visitsEarlier);
            console.log('loadVisits - Visits loaded - Counts:', { 
                thisMonth: visitsThisMonth.length, 
                lastMonth: visitsLastMonth.length, 
                earlier: visitsEarlier.length 
            });
        }
    } catch (error) {
        console.error('loadVisits - Error loading visits:', error.message, error.stack);
        toastr.error(`Error loading visits: ${error.message}`);
    }
}

function updateVisitsTable(tableId, visits) {
    console.log('updateVisitsTable - Updating table - Table ID:', tableId, 'Visits:', visits.length);
    const tbody = document.getElementById(tableId);
    if (tbody) {
        tbody.innerHTML = visits.length === 0 ? '<tr><td colspan="2">No visits found</td></tr>' : '';
        visits.forEach(visit => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${visit.page || 'N/A'}</td><td>${visit.timestamp || 'N/A'}</td>`;
            tbody.appendChild(row);
        });
        console.log('updateVisitsTable - Table updated - ID:', tableId);
    } else {
        console.warn('updateVisitsTable - Table element not found - ID:', tableId);
    }
}

async function loadOrders() {
    console.log('loadOrders - Loading orders');
    const userId = document.getElementById('userId')?.value || '';
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
                if (orderDate.getFullYear() === thisYear && orderDate.getMonth())  {
                    ordersThisMonth.push(order);
                } else if ((orderDate.getFullYear() === thisYear && orderDate.getMonth() === thisMonth - 1) ||
                          (orderDate.getFullYear() === thisYear - 1 && thisMonth === 0 && orderDate.getMonth() === 11)) {
                    ordersLastMonth.push(order);
                } else {
                    ordersEarlier.push(order);
                }
            });
            updateOrdersTable('ordersListThisMonth', ordersThisMonth);
            updateOrdersTable('ordersListLastMonth', ordersLastMonth);
            updateOrdersTable('ordersListEarlier', ordersEarlier);
            console.log('loadOrders - Orders loaded - Counts:', { 
                thisMonth: ordersThisMonth.length, 
                lastMonth: ordersLastMonth.length, 
                earlier: ordersEarlier.length 
            });
        }
    } catch (error) {
        console.error('loadOrders - Error loading orders:', error.message, error.stack);
        toastr.error(`Error loading orders: ${error.message}`);
    }
}

function updateOrdersTable(tableId, orders) {
    console.log('updateOrdersTable - Updating table - Table ID:', tableId, 'Orders:', orders.length);
    const tbody = document.getElementById(tableId);
    if (tbody) {
        tbody.innerHTML = orders.length === 0 ? '<tr><td colspan="4">No orders found</td></tr>' : '';
        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${order.orderId || 'N/A'}</td><td>${order.buyer || 'N/A'}</td><td>$${order.total || '0.00'}</td><td>${order.timestamp || 'N/A'}</td>`;
            tbody.appendChild(row);
        });
        console.log('updateOrdersTable - Table updated - ID:', tableId);
    } else {
        console.warn('updateOrdersTable - Table element not found - ID:', tableId);
    }
}

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

// Export for use in other scripts
window.initializeCommunity = initializeCommunity;
window.updateMenu = updateMenu;
window.updateIntegrationCode = updateIntegrationCode;
window.loadVisits = loadVisits;
window.updateVisitsTable = updateVisitsTable;
window.loadOrders = loadOrders;
window.updateOrdersTable = updateOrdersTable;
window.waitForTinyMCE = waitForTinyMCE;