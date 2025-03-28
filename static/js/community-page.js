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
    setupNavigation(); // From site-navigation.js
    attachEventListeners(); // From page-load.js

    // Load branding and initial data
    loadBranding('community', 'brandingContent');
    updateMenu();
    showSection('welcome');
    waitForTinyMCE(() => initializeTinyMCE('#aboutCommunity, #stylingDetails, #page1Content'));
    loadVisits();
    loadOrders();
    loadCategories(userId, false); // Added for treeview

    // Fetch and display contact_name in the welcome section
    if (typeof loadSettings === 'function') {
        loadSettings().then(settings => {
            const contactName = settings.contact_name || 'User';
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                const userContactNameSpan = document.getElementById('user-contact-name');
                if (userContactNameSpan) {
                    userContactNameSpan.textContent = contactName;
                    console.log('initializeCommunity - Updated contact name in welcome section:', contactName);
                } else {
                    console.warn('initializeCommunity - user-contact-name span not found in welcome-message');
                }
            } else {
                console.warn('initializeCommunity - welcome-message element not found');
            }
        }).catch(error => {
            console.error('initializeCommunity - Error loading settings for contact name:', error.message);
            toastr.error('Error loading user settings');
        });
    } else {
        console.error('initializeCommunity - loadSettings function not found');
    }

    // Set up collapsible sections for Orders and Visits
    setupCollapsibleSections();

    // Set up shared "Change Password" logic
    if (typeof setupChangePassword === 'function') {
        setupChangePassword(); // From user-management.js
        console.log('initializeCommunity - Change Password logic initialized');
    } else {
        console.error('initializeCommunity - setupChangePassword function not found');
    }

    // Hide loading overlay after initialization
    hideLoadingOverlay(); // From page-load.js
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
                    <span class="button-content"><span class="icon-wix menu-size"></span> Wix</span>
                </button>
                <button data-section="wordpress">
                    <span class="button-content"><span class="icon-wordpress menu-size"></span> WordPress</span>
                </button>
                <button data-section="squarespace">
                    <span class="button-content"><span class="icon-squarespace menu-size"></span> Squarespace</span>
                </button>
                <button data-section="weebly">
                    <span class="button-content"><span class="icon-weebly menu-size"></span> Weebly</span>
                </button>
                <button data-section="joomla">
                    <span class="button-content"><span class="icon-joomla menu-size"></span> Joomla</span>
                </button>
                <button data-section="no_website">
                    <span class="button-content"><i class="fas fa-question-circle menu-size"></i> I Don’t Have a Website Yet</span>
                </button>
            </div>
            <button data-section="categories">
                <span class="button-content"><i class="fas fa-list"></i> My Categories</span>
            </button>
            <button data-submenu="referrals_intro" data-section="referrals_intro">
                <span class="button-content">
                    <span class="icon-community menu-size"></span> My Referrals
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
                <button data-section="contact-details">
                    <span class="button-content"><i class="fas fa-address-book"></i> Contact</span>
                </button>
                <button data-section="change-password">
                    <span class="button-content"><i class="fas fa-key"></i> Change Password</span>
                </button>
            </div>
        `;
        if (window.userPermissions.includes('admin')) {
            menu.innerHTML += `
                <button data-href="/admin" style="background-color: #dc3545;">
                    <span class="button-content"><i class="fas fa-arrow-left"></i> Back to Admin</span>
                </button>
            `;
        }
        menu.innerHTML += `
            <button id="logOffBtn" style="background-color: #dc3545;">
                <span class="button-content"><i class="fas fa-sign-out-alt"></i> Log Off</span>
            </button>
        `;
        console.log('updateMenu - Menu updated');

        // Ensure submenu visibility is handled correctly
        if (typeof initializeNavigation === 'function') {
            initializeNavigation(); // From site-navigation.js to fix submenu hiding
            console.log('updateMenu - initializeNavigation called to fix submenu hiding');
        } else {
            console.error('updateMenu - initializeNavigation function not found');
        }
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
                if (orderDate.getFullYear() === thisYear && orderDate.getMonth() === thisMonth) {
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

function setupCollapsibleSections() {
    console.log('setupCollapsibleSections - Setting up collapsible sections');
    const toggleSections = document.querySelectorAll('.toggle-section');
    toggleSections.forEach(section => {
        section.addEventListener('click', () => {
            const targetId = section.getAttribute('data-toggle');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                const isOpen = targetContent.classList.contains('open');
                // Close all sections in the same group
                const parentSection = section.closest('.section');
                if (parentSection) {
                    parentSection.querySelectorAll('.toggle-content.open').forEach(content => {
                        content.classList.remove('open');
                        content.style.display = 'none';
                    });
                }
                // Toggle the clicked section
                if (!isOpen) {
                    targetContent.classList.add('open');
                    targetContent.style.display = 'block';
                }
                console.log('setupCollapsibleSections - Toggled section:', targetId, 'Is open:', !isOpen);
            } else {
                console.warn('setupCollapsibleSections - Target content not found for ID:', targetId);
            }
        });
    });
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
window.setupCollapsibleSections = setupCollapsibleSections;
window.waitForTinyMCE = waitForTinyMCE;