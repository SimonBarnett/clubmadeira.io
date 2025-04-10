// community-page.js
// Purpose: Manages page-specific functionality for the /community page.

try {
    // Initialize Community page using unified site-navigation.js function
    window.initializeCommunity = function() {
        console.log('initializeCommunity - Initializing community page');
        window.siteNavigation.initializePage('Community', ['community', 'admin'], [
            () => {
                // Replicate original userId logic
                const token = localStorage.getItem('authToken');
                const decoded = token ? window.decodeJWT(token) : null;
                window.userPermissions = decoded?.permissions || [];
                console.log('initializeCommunity - User permissions:', window.userPermissions);
                let userId = localStorage.getItem('userId') || decoded?.userId;
                if (userId) {
                    localStorage.setItem('userId', userId);
                    const userIdInput = document.getElementById('userId');
                    if (userIdInput) {
                        userIdInput.value = userId;
                    } else {
                        console.warn('initializeCommunity - userId input not found');
                    }
                    console.log('initializeCommunity - Calling loadCategories with userId:', userId);
                    loadCategories(userId, false);
                }
            },
            () => waitForTinyMCE(() => initializeTinyMCE('#aboutCommunity, #stylingDetails, #page1Content')),
            loadVisits,
            loadOrders,
            setupCollapsibleSections,
            setupProviderIconListeners
        ]);

        // Attach provider icon listeners separately due to DOM timing
        console.log('initializeCommunity - Calling setupProviderIconListeners');
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupProviderIconListeners);
        } else {
            setupProviderIconListeners();
        }
    };

    async function loadClientApiSettings() {
        console.log('loadClientApiSettings - Loading client API settings');
        if (typeof authenticatedFetch !== 'function') {
            console.error('loadClientApiSettings - authenticatedFetch is not defined');
            toastr.error('Authentication function not available');
            return [];
        }
        try {
            const response = await authenticatedFetch('https://clubmadeira.io/settings/client_api');
            if (!response.ok) throw new Error(`Failed to fetch client API settings: ${response.status}`);
            const data = await response.json();
            console.log('loadClientApiSettings - Client API settings fetched:', JSON.stringify(data));
            return data.settings;
        } catch (error) {
            console.error('loadClientApiSettings - Error loading client API settings:', error.message);
            toastr.error(`Error loading client API settings: ${error.message}`);
            return [];
        }
    }

    function displayClientApiSettings(setting, fieldsContainer) {
        console.log('displayClientApiSettings - Displaying settings for:', setting.key_type);
        fieldsContainer.innerHTML = '';

        const selectedIcon = document.createElement('i');
        selectedIcon.className = `selected-setting-icon ${setting.icon}`;
        selectedIcon.style.fontSize = '16px';
        selectedIcon.style.color = 'currentColor';
        selectedIcon.style.marginRight = '10px';
        selectedIcon.style.verticalAlign = 'middle';
        fieldsContainer.appendChild(selectedIcon);

        const heading = document.createElement('h3');
        heading.textContent = setting.comment || 'Client API Settings';
        heading.className = 'client-api-comment-heading';
        heading.style.display = 'inline-block';
        heading.style.verticalAlign = 'middle';
        fieldsContainer.appendChild(heading);

        const apiLink = setting.doc_link.find(link => link.title === 'api')?.link;
        if (apiLink) {
            const apiIcon = document.createElement('a');
            apiIcon.href = apiLink;
            apiIcon.className = 'client-api-link';
            apiIcon.style.marginLeft = '10px';
            apiIcon.style.display = 'inline-block';
            apiIcon.style.verticalAlign = 'middle';
            apiIcon.style.color = 'currentColor';
            apiIcon.innerHTML = '<i class="fas fa-link" style="font-size: 16px;"></i>';
            apiIcon.target = '_blank';
            fieldsContainer.appendChild(apiIcon);
        }

        const signupLink = setting.doc_link.find(link => link.title === 'signup')?.link;
        if (signupLink) {
            const signupIcon = document.createElement('a');
            signupIcon.href = signupLink;
            signupIcon.className = 'client-api-signup-link';
            signupIcon.style.marginLeft = '10px';
            signupIcon.style.display = 'inline-block';
            signupIcon.style.verticalAlign = 'middle';
            signupIcon.style.color = 'currentColor';
            signupIcon.innerHTML = '<i class="fas fa-user-plus" style="font-size: 16px;"></i>';
            signupIcon.target = '_blank';
            fieldsContainer.appendChild(signupIcon);
        }

        const readmeLink = setting.doc_link.find(link => link.title === 'readme')?.link;
        if (readmeLink) {
            const readmeIcon = document.createElement('a');
            readmeIcon.href = '#';
            readmeIcon.className = 'client-api-readme-link';
            readmeIcon.style.marginLeft = '10px';
            readmeIcon.style.display = 'inline-block';
            readmeIcon.style.verticalAlign = 'middle';
            readmeIcon.style.color = 'currentColor';
            readmeIcon.innerHTML = '<i class="fas fa-book" style="font-size: 16px;"></i>';
            fieldsContainer.appendChild(readmeIcon);

            const mdContentContainer = document.createElement('div');
            mdContentContainer.id = `md-content-${setting.key_type}`;
            mdContentContainer.className = 'client-api-md-content';
            mdContentContainer.style.display = 'none';
            mdContentContainer.style.marginTop = '15px';
            fieldsContainer.appendChild(mdContentContainer);

            readmeIcon.addEventListener('click', async (e) => {
                e.preventDefault();
                console.log('displayClientApiSettings - Readme icon clicked for:', setting.key_type);
                if (mdContentContainer.style.display === 'none') {
                    if (!mdContentContainer.innerHTML) {
                        await renderMdPage(readmeLink, `md-content-${setting.key_type}`);
                    }
                    mdContentContainer.style.display = 'block';
                    readmeIcon.innerHTML = '<i class="fas fa-book-open" style="font-size: 16px;"></i>';
                } else {
                    mdContentContainer.style.display = 'none';
                    readmeIcon.innerHTML = '<i class="fas fa-book" style="font-size: 16px;"></i>';
                }
            });
        }

        const description = document.createElement('p');
        description.textContent = setting.fields._description || 'No description available.';
        description.className = 'client-api-description';
        description.style.marginBottom = '15px';
        fieldsContainer.appendChild(description);
    }

    function setupProviderIconListeners() {
        console.log('setupProviderIconListeners - Setting up provider icon listeners');
        const providerIconsContainer = document.getElementById('website-provider-icons');
        if (!providerIconsContainer) {
            console.warn('setupProviderIconListeners - Provider icons container not found - ID: website-provider-icons');
            return;
        }
        const providerIcons = providerIconsContainer.querySelectorAll('i');
        if (providerIcons.length === 0) {
            console.warn('setupProviderIconListeners - No provider icons found in container');
            return;
        }

        console.log('setupProviderIconListeners - Found provider icons:', providerIcons.length);

        loadClientApiSettings().then(settings => {
            console.log('setupProviderIconListeners - Client API settings loaded:', settings);
            if (!settings || settings.length === 0) {
                console.warn('setupProviderIconListeners - No client API settings available');
                return;
            }

            const settingsMap = {};
            settings.forEach(setting => {
                settingsMap[setting.key_type] = setting;
            });

            providerIcons.forEach((icon, index) => {
                console.log(`setupProviderIconListeners - Attaching listener to icon ${index}:`, icon.className);
                icon.addEventListener('click', function() {
                    console.log('setupProviderIconListeners - Icon clicked:', icon.className);
                    providerIcons.forEach(i => i.style.color = '#C0C0C0');
                    this.style.color = 'currentColor';
                    const sectionId = this.getAttribute('data-section');
                    console.log('setupProviderIconListeners - Section ID:', sectionId);
                    if (sectionId && typeof window.siteNavigation?.showSection === 'function') {
                        window.siteNavigation.showSection(sectionId);
                        console.log('setupProviderIconListeners - Section shown:', sectionId);
                        if (sectionId !== 'no_website') {
                            const setting = settingsMap[sectionId];
                            if (setting) {
                                console.log('setupProviderIconListeners - Setting found:', setting);
                                const fieldsContainer = document.getElementById('client-api-settings');
                                if (fieldsContainer) {
                                    displayClientApiSettings(setting, fieldsContainer);
                                    console.log('setupProviderIconListeners - Displayed settings for:', sectionId);
                                } else {
                                    console.warn('setupProviderIconListeners - Client API settings container not found');
                                }
                            } else {
                                console.warn('setupProviderIconListeners - No settings found for key_type:', sectionId);
                            }
                        } else {
                            const fieldsContainer = document.getElementById('client-api-settings');
                            if (fieldsContainer) {
                                fieldsContainer.innerHTML = '';
                                console.log('setupProviderIconListeners - Cleared settings container for no_website');
                            }
                        }
                    } else {
                        console.error('setupProviderIconListeners - siteNavigation.showSection not available or sectionId missing');
                    }
                });
            });
        }).catch(error => {
            console.error('setupProviderIconListeners - Failed to load client API settings:', error);
            toastr.error('Failed to load provider settings');
        });
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
                    const parentSection = section.closest('.section');
                    if (parentSection) {
                        parentSection.querySelectorAll('.toggle-content.open').forEach(content => {
                            content.classList.remove('open');
                            content.style.display = 'none';
                        });
                    }
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
    window.initializeCommunity = window.initializeCommunity; // Already assigned above
    window.loadVisits = loadVisits;
    window.updateVisitsTable = updateVisitsTable;
    window.loadOrders = loadOrders;
    window.updateOrdersTable = updateOrdersTable;
    window.setupCollapsibleSections = setupCollapsibleSections;
    window.setupProviderIconListeners = setupProviderIconListeners;
    window.waitForTinyMCE = waitForTinyMCE;
    window.loadClientApiSettings = loadClientApiSettings;
    window.displayClientApiSettings = displayClientApiSettings;

    // Auto-initialize with error handling
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        window.initializeCommunity();
    } else {
        document.addEventListener('DOMContentLoaded', window.initializeCommunity);
    }
} catch (error) {
    console.error('Error in community-page.js:', error.message, error.stack);
    window.initializeCommunity = function() {
        console.error('initializeCommunity - Failed to initialize due to an error:', error.message);
    };
}