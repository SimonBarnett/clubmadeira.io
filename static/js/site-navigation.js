// /static/js/site-navigation.js
if (window.siteNavigationInitialized) {
    console.log('site-navigation.js - Already initialized, skipping');
} else {
    window.siteNavigationInitialized = true;

    if (!window.apiUrl) {
        console.error('site-navigation.js - window.apiUrl is not defined. Please set window.apiUrl before loading this script.');
        throw new Error('window.apiUrl is not defined');
    }
    console.log('site-navigation.js - Using apiUrl:', window.apiUrl);

    function waitForAuthFetch() {
        return new Promise((resolve, reject) => {
            if (typeof window.authenticatedFetch === 'function') {
                console.log('waitForAuthFetch - window.authenticatedFetch is already defined');
                resolve();
                return;
            }
            console.log('waitForAuthFetch - Waiting for siteAuthReady event');
            window.addEventListener('siteAuthReady', () => {
                if (typeof window.authenticatedFetch === 'function') {
                    console.log('waitForAuthFetch - siteAuthReady received, window.authenticatedFetch is defined');
                    resolve();
                } else {
                    console.error('waitForAuthFetch - siteAuthReady received, but window.authenticatedFetch is still not defined');
                    reject(new Error('window.authenticatedFetch is not defined after siteAuthReady'));
                }
            }, { once: true });
        });
    }

    waitForAuthFetch()
        .then(() => {
            function initializePage(role, requiredPermissions, setupFunctions = []) {
                console.log(`initializePage - Initializing ${role} page`);
                const token = localStorage.getItem('authToken') || window.siteNavigation.getCookie('authToken');
                const userId = localStorage.getItem('userId');
                if (!token) {
                    console.error(`initialize${role} - No token found, redirecting to /`);
                    window.location.href = '/';
                    return;
                }
                const decoded = window.decodeJWT(token);
                if (!decoded) {
                    console.error(`initialize${role} - Invalid token, redirecting to /`);
                    window.location.href = '/';
                    return;
                }
                window.userPermissions = decoded.permissions || [];
                console.log(`initializePage - User permissions for ${role}:`, window.userPermissions);
                if (!requiredPermissions.some(perm => window.userPermissions.includes(perm))) {
                    toastr.error(`Permission denied: ${requiredPermissions.join(' or ')} required`);
                    console.error(`initialize${role} - No ${requiredPermissions.join(' or ')} permission, redirecting to /`);
                    window.location.href = '/';
                    return;
                }
                const userIdInput = document.getElementById('userId');
                if (userIdInput && userId) {
                    userIdInput.value = userId;
                } else if (!userId) {
                    console.warn(`initialize${role} - No userId found in localStorage`);
                } else {
                    console.warn(`initialize${role} - userId input element not found`);
                }

                initializeNavigation(role);
                setupFunctions.forEach(fn => fn && typeof fn === 'function' && fn());
                loadUserSettings(role);
                typeof attachEventListeners === 'function' && attachEventListeners();
                typeof setupChangePassword === 'function' && setupChangePassword();
                window.hideLoadingOverlay && window.hideLoadingOverlay();
                showSection('info');
                console.log(`initializePage - ${role} page initialized successfully`);
            }

            async function loadUserSettings(role) {
                console.log(`loadUserSettings - Loading user settings for ${role}`);
                try {
                    const settings = await (typeof loadSettings === 'function'
                        ? loadSettings()
                        : window.authenticatedFetch(`${window.apiUrl}/settings/user`).then(r => r.json()));
                    const contactName = settings.contact_name || 'User';
                    const userContactNameSpan = document.getElementById('user-contact-name');
                    if (userContactNameSpan) {
                        userContactNameSpan.textContent = contactName;
                        console.log(`loadUserSettings - Updated contact name for ${role}:`, contactName);
                    } else {
                        console.warn(`loadUserSettings - user-contact-name span not found for ${role}`);
                    }
                } catch (error) {
                    console.error(`loadUserSettings (${role}) - Error loading settings:`, error.message);
                    toastr.error('Error loading user settings');
                }
            }

            const roleMenus = {
                admin: [
                    { section: 'info', icon: 'fa-home', text: 'Dashboard' },
                    { section: 'user_management', icon: 'fa-users', text: 'Admins', role: 'admin' },
                    { section: 'user_management', icon: 'fa-handshake', text: 'Partners', role: 'partner' },
                    { section: 'user_management', icon: 'fa-users', text: 'Communities', role: 'community' },
                    { section: 'user_management', icon: 'fa-store', text: 'Merchants', role: 'merchant' },
                    { section: 'affiliates', icon: 'fa-link', text: 'Affiliates' },
                    { section: 'site_settings', icon: 'fa-cogs', text: 'Site Settings' },
                    { section: 'api_keys', icon: 'fa-key', text: 'API Keys' }
                ],
                community: [
                    { section: 'info', icon: 'fa-home', text: 'Dashboard' },
                    { section: 'my_website_intro_section', icon: 'fa-globe', text: 'My Web Site', submenu: 'my_website_submenu' },
                    { section: 'categories', icon: 'fa-list', text: 'My Categories' },
                    { section: 'referrals_intro_section', icon: 'icon-community', text: 'My Referrals', submenu: 'referrals_submenu' },
                    { section: 'my-account', icon: 'fa-cog', text: 'My Account', submenu: 'my-account-submenu' }
                ],
                merchant: [
                    { section: 'info', icon: 'fa-home', text: 'Dashboard' },
                    { section: 'my-products', icon: 'fa-box', text: 'My Products' },
                    { section: 'store-request', icon: 'fa-store', text: 'My Store Request', submenu: 'my-store-submenu' },
                    { section: 'documentation-content', icon: 'fa-book', text: 'Documentation', submenu: 'documentation-submenu' },
                    { section: 'api-keys', icon: 'fa-key', text: 'API Keys' },
                    { section: 'my-account', icon: 'fa-cog', text: 'My Account', submenu: 'my_account_submenu' }
                ],
                partner: [
                    { section: 'info', icon: 'fa-home', text: 'Dashboard' },
                    { section: 'integrations', icon: 'fa-plug', text: 'Integrations' },
                    { section: 'my-account', icon: 'fa-cog', text: 'My Account' }
                ]
            };

            const roleSwitches = [
                { perm: 'admin', role: 'admin', icon: 'fa-arrow-left', text: 'Back to Admin', color: '#dc3545' },
                { perm: 'community', role: 'community', icon: 'fa-users', text: 'Community Dashboard', color: '#007bff' },
                { perm: 'merchant', role: 'merchant', icon: 'fa-store', text: 'Merchant Dashboard', color: '#007bff' },
                { perm: 'partner', role: 'partner', icon: 'fa-handshake', text: 'Partner Dashboard', color: '#007bff' }
            ];

            function updateMenu(role) {
                console.log(`updateMenu - Updating menu for ${role}`);
                let menu = document.getElementById('menu');
                const userId = document.getElementById('userId')?.value || '';

                // Fallback: Create menu element if it doesn't exist
                if (!menu) {
                    console.warn(`updateMenu - Menu element not found for ${role}, creating one`);
                    menu = document.createElement('div');
                    menu.id = 'menu';
                    menu.className = 'menu';
                    const layoutWrapper = document.querySelector('.layout-wrapper');
                    if (layoutWrapper) {
                        layoutWrapper.insertBefore(menu, layoutWrapper.firstChild);
                        console.log(`updateMenu - Created and appended menu div for ${role}`);
                    } else {
                        console.error(`updateMenu - No .layout-wrapper found to append menu for ${role}`);
                        return;
                    }
                }

                // Remove outdated dynamic buttons, preserve static ones
                const dynamicButtons = menu.querySelectorAll('button[data-role], button[href="/admin"]');
                dynamicButtons.forEach(button => {
                    console.log(`updateMenu - Removing dynamic button:`, button.getAttribute('data-role') || button.getAttribute('href'));
                    button.remove();
                });

                // Remove any existing Log Off buttons to prevent duplication
                const existingLogOffButtons = menu.querySelectorAll('#logOffBtn');
                existingLogOffButtons.forEach(button => {
                    console.log(`updateMenu - Removing existing Log Off button to prevent duplication`);
                    button.remove();
                });

                console.log(`updateMenu - Appending role-switching buttons for ${role}`);
                roleSwitches.forEach(switchItem => {
                    if (window.userPermissions.includes(switchItem.perm) && switchItem.role !== role.toLowerCase()) {
                        const button = document.createElement('button');
                        button.setAttribute('data-href', '/');
                        button.setAttribute('data-role', switchItem.role);
                        button.style.backgroundColor = switchItem.color;
                        button.innerHTML = `<span class="button-content"><i class="fas ${switchItem.icon}"></i> ${switchItem.text}</span>`;
                        menu.appendChild(button);
                        console.log(`updateMenu - Appended ${switchItem.text} button for ${role}`);
                    }
                });

                // Always append Log Off button at the end
                const logOffButton = document.createElement('button');
                logOffButton.id = 'logOffBtn';
                logOffButton.style.backgroundColor = '#dc3545';
                logOffButton.innerHTML = `<span class="button-content"><i class="fas fa-sign-out-alt"></i> Log Off</span>`;
                menu.appendChild(logOffButton);
                console.log(`updateMenu - Appended Log Off button for ${role}`);

                console.log('updateMenu - Menu updated for', role);
            }

            function initializeNavigation(role = null) {
                console.log(`initializeNavigation - Starting navigation setup${role ? ` for ${role}` : ''}`);

                // For non-login pages, immediately update the menu to add Log Off button
                if (role && role !== 'login') {
                    console.log(`initializeNavigation - Applying menu updates for role: ${role}`);
                    updateMenu(role);
                } else {
                    console.log(`initializeNavigation - Skipping menu updates for role: ${role || 'none'}`);
                }

                const waitForElements = (retryCount = 0, maxRetries = 50) => {
                    const infoSection = document.getElementById('info');
                    console.log(`waitForElements - Retry ${retryCount}/${maxRetries}, infoSection: ${infoSection ? 'found' : 'not found'}, role: ${role || 'none'}`);
                    if (infoSection || retryCount >= maxRetries) {
                        if (!infoSection) {
                            console.warn(`initializeNavigation - Info section not found after ${maxRetries} retries, proceeding without it`);
                        } else {
                            console.log('initializeNavigation - Info section found, proceeding with setup');
                        }
                        const logOffBtn = document.getElementById('logOffBtn');
                        setupNavigation(logOffBtn, infoSection, role);
                    } else {
                        console.log('initializeNavigation - Info section not yet loaded, retrying...');
                        setTimeout(() => waitForElements(retryCount + 1, maxRetries), 100);
                    }
                };

                function setupNavigation(logOffBtn, infoSection, role) {
                    // Ensure all submenus are collapsed on initial load
                    closeAllTopLevelSubmenus();
                    console.log('initializeNavigation - All top-level submenus collapsed');

                    document.querySelectorAll('.menu button[data-section], .menu button[data-submenu], .menu button[data-href], .menu button[href]').forEach(button => {
                        button.removeEventListener('click', handleSectionClick);
                    });
                    document.querySelectorAll('.submenu').forEach(submenu => {
                        submenu.style.display = 'none';
                        submenu.classList.remove('open');
                        const submenuId = submenu.id;
                        const button = document.querySelector(`button[data-submenu="${submenuId}"]`);
                        if (button) {
                            button.setAttribute('aria-expanded', 'false');
                            const caret = button.querySelector('.caret');
                            if (caret) {
                                caret.classList.remove('fa-caret-down');
                                caret.classList.add('fa-caret-right');
                            }
                        } else {
                            console.warn(`initializeNavigation - No button found for submenu: ${submenuId}`);
                        }
                    });

                    const buttons = document.querySelectorAll('.menu button[data-section], .menu button[data-submenu], .menu button[data-href], .menu button[href]');
                    console.log('initializeNavigation - Found buttons to initialize:', buttons.length);
                    buttons.forEach(button => {
                        const sectionId = button.getAttribute('data-section');
                        const parentSubmenu = button.closest('.submenu');
                        if (sectionId === 'user_management' || (parentSubmenu && parentSubmenu.id === 'userManagement')) {
                            console.log('initializeNavigation - Skipped click listener for userManagement-related button:', {
                                section: button.dataset.section,
                                role: button.dataset.role,
                                parentSubmenu: parentSubmenu?.id
                            });
                        } else {
                            button.addEventListener('click', handleSectionClick);
                            console.log('initializeNavigation - Added click listener to button:', {
                                section: button.dataset.section,
                                submenu: button.dataset.submenu,
                                href: button.dataset.href || button.getAttribute('href'),
                                role: button.dataset.role
                            });
                        }
                    });

                    if (logOffBtn) {
                        console.log('initializeNavigation - Log Off button found, attaching listener');
                        logOffBtn.removeEventListener('click', handleLogoutClick);
                        logOffBtn.addEventListener('click', handleLogoutClick);
                    } else {
                        console.log('initializeNavigation - No Log Off button to attach listener to (expected on login page)');
                    }

                    // Skip showing info section on login page; handled by page-load.js
                    if (role && role !== 'login') {
                        if (infoSection) {
                            console.log('initializeNavigation - Showing info section on load');
                            showSection('info');
                        } else {
                            console.error('initializeNavigation - Info section not found on page load');
                            const firstSection = document.querySelector('.section');
                            if (firstSection) {
                                console.log('initializeNavigation - Falling back to first available section:', firstSection.id);
                                showSection(firstSection.id);
                            }
                        }
                    }
                }

                waitForElements();
            }

            async function fetchProtectedPage(url, role = null) {
                const redirectCount = parseInt(localStorage.getItem('fetchRedirectCount') || '0');
                if (redirectCount > 2) {
                    console.error('fetchProtectedPage - Redirect loop detected, clearing token');
                    localStorage.removeItem('authToken');
                    localStorage.setItem('fetchRedirectCount', '0');
                    window.location.replace('/');
                    return;
                }
                window.showLoadingOverlay && window.showLoadingOverlay();
                try {
                    let token = localStorage.getItem('authToken') || window.siteNavigation.getCookie('authToken');
                    console.log('fetchProtectedPage - Initial token:', token ? '[present]' : 'null');
                    if (!token) {
                        console.log('fetchProtectedPage - No token found, redirecting to /');
                        toastr.error('No authentication token found. Please log in.');
                        localStorage.setItem('fetchRedirectCount', redirectCount + 1);
                        localStorage.setItem('pendingRole', role || '');
                        window.location.replace('/');
                        return;
                    }
                    if (role) {
                        const decoded = window.decodeJWT(token);
                        if (!decoded) {
                            console.error('fetchProtectedPage - Invalid token, redirecting to /');
                            toastr.error('Invalid authentication token. Please log in again.');
                            localStorage.removeItem('authToken');
                            window.siteNavigation.deleteCookie('authToken');
                            localStorage.setItem('fetchRedirectCount', redirectCount + 1);
                            window.location.replace('/');
                            return;
                        }
                        if (!decoded.permissions.includes('admin')) {
                            console.error('fetchProtectedPage - Only admins can change roles');
                            toastr.error('Permission denied: Only admins can test roles');
                            window.hideLoadingOverlay && window.hideLoadingOverlay();
                            return;
                        }
                        console.log('fetchProtectedPage - Switching role to:', role);
                        const setRoleResponse = await window.authenticatedFetch(`${window.apiUrl}/set-role`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ role: role }),
                            credentials: 'include'
                        });
                        if (!setRoleResponse.ok) {
                            const errorData = await setRoleResponse.json();
                            console.error('fetchProtectedPage - Failed to set role:', errorData);
                            throw new Error(errorData.message || 'Failed to set role');
                        }
                        const setRoleData = await setRoleResponse.json();
                        console.log('fetchProtectedPage - Role set successfully:', setRoleData);
                        token = setRoleData.token || token;
                        if (!token) {
                            throw new Error('No token returned from /set-role');
                        }
                        localStorage.setItem('authToken', token);
                        window.siteNavigation.setCookie('authToken', token, 7);
                        console.log('fetchProtectedPage - Updated token:', token);
                        localStorage.setItem('fetchRedirectCount', '0');
                        window.location.href = '/';
                        return;
                    }
                    const fetchOptions = {
                        method: 'GET',
                        headers: { 'Accept': 'text/html' }
                    };
                    const response = await window.authenticatedFetch(`${window.apiUrl}${url}`, fetchOptions);
                    if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
                    const html = await response.text();
                    console.log('fetchProtectedPage - Response status:', response.status);

                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const newContent = doc.querySelector('.layout-wrapper');
                    if (!newContent) throw new Error('No .layout-wrapper found in response HTML');
                    const layoutWrapper = document.querySelector('.layout-wrapper');
                    if (!layoutWrapper) throw new Error('No .layout-wrapper found in current DOM');
                    layoutWrapper.innerHTML = newContent.innerHTML;

                    const scripts = doc.querySelectorAll('script:not([src])');
                    scripts.forEach(script => {
                        const newScript = document.createElement('script');
                        newScript.textContent = script.textContent;
                        document.body.appendChild(newScript);
                        document.body.removeChild(newScript);
                        console.log('fetchProtectedPage - Executed inline script');
                    });

                    const pageType = role || (url.split('/')[1] || 'default');
                    if (typeof window.initialize === 'function') {
                        console.log('fetchProtectedPage - Triggering initialize for:', pageType);
                        window.initialize(pageType);
                    } else {
                        console.warn('fetchProtectedPage - window.initialize not found, page may not fully initialize');
                    }

                    console.log('fetchProtectedPage - Reinitializing navigation after content load');
                    initializeNavigation();

                    localStorage.setItem('fetchRedirectCount', '0');
                } catch (error) {
                    console.error('fetchProtectedPage - Error:', error);
                    toastr.error(error.message || 'Failed to load page');
                    localStorage.setItem('fetchRedirectCount', redirectCount + 1);
                    window.location.replace('/');
                } finally {
                    window.hideLoadingOverlay && window.hideLoadingOverlay();
                }
            }

            async function loadSection(sectionId) {
                console.log('loadSection - Starting section load - Section ID:', sectionId);
                if (sectionId === 'my-products') {
                    try {
                        const response = await window.authenticatedFetch(`${window.apiUrl}/settings/products`);
                        if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
                        const data = await response.json();
                        console.log('loadSection - Products fetched:', JSON.stringify(data));
                        if (data.products && Array.isArray(data.products)) {
                            const tbody = document.getElementById('productList');
                            if (!tbody) {
                                console.error('loadSection - Table body with id "productList" not found');
                                toastr.error('Error: Product table not found in the page');
                                return;
                            }
                            tbody.innerHTML = '';
                            data.products.forEach(product => {
                                const tr = document.createElement('tr');
                                const idTd = document.createElement('td');
                                idTd.className = 'hidden';
                                idTd.textContent = product.id || 'N/A';
                                tr.appendChild(idTd);
                                const categoryTd = document.createElement('td');
                                categoryTd.textContent = product.category || 'N/A';
                                tr.appendChild(categoryTd);
                                const titleTd = document.createElement('td');
                                titleTd.textContent = product.title || 'N/A';
                                tr.appendChild(titleTd);
                                const urlTd = document.createElement('td');
                                const urlLink = document.createElement('a');
                                urlLink.href = product.product_url || '#';
                                urlLink.textContent = product.product_url ? 'Link' : 'N/A';
                                urlLink.target = '_blank';
                                urlTd.appendChild(urlLink);
                                tr.appendChild(urlTd);
                                const priceTd = document.createElement('td');
                                priceTd.textContent = product.current_price !== undefined ? product.current_price : 'N/A';
                                tr.appendChild(priceTd);
                                const originalPriceTd = document.createElement('td');
                                originalPriceTd.textContent = product.original_price !== undefined ? product.original_price : 'N/A';
                                tr.appendChild(originalPriceTd);
                                const imageTd = document.createElement('td');
                                const img = document.createElement('img');
                                img.src = product.image_url || '';
                                img.width = 50;
                                img.onerror = function() { this.src = 'https://via.placeholder.com/50'; };
                                imageTd.appendChild(img);
                                tr.appendChild(imageTd);
                                const qtyTd = document.createElement('td');
                                qtyTd.textContent = product.qty !== undefined ? product.qty : 'N/A';
                                tr.appendChild(qtyTd);
                                tbody.appendChild(tr);
                            });
                        } else {
                            console.error('loadSection - Expected an array of products but got:', data.products);
                            toastr.error('Error loading products: Invalid data format from server');
                        }
                    } catch (error) {
                        console.error('loadSection - Error fetching products:', error.message);
                        toastr.error(`Error loading products: ${error.message}`);
                    }
                } else if (sectionId === 'categories' && typeof window.loadCategories === 'function') {
                    const userId = localStorage.getItem('userId');
                    const isAdmin = window.userPermissions?.includes('admin') || false;
                    window.loadCategories(userId, isAdmin);
                } else if (sectionId === 'integrations' && typeof window.loadPartnerIntegrations === 'function') {
                    window.loadPartnerIntegrations();
                } else if (sectionId === 'visits' && typeof window.loadVisits === 'function') {
                    window.loadVisits();
                } else if (sectionId === 'orders' && typeof window.loadOrders === 'function') {
                    window.loadOrders();
                } else {
                    console.log('loadSection - No dynamic content to load for section:', sectionId);
                }
            }

            function showSection(sectionId, onSectionLoad = null) {
                console.log('showSection - Starting section display - Section ID:', sectionId, 'Has custom callback:', !!onSectionLoad);
                const allSections = document.querySelectorAll('.section');
                allSections.forEach(s => {
                    if (s.id !== 'my_website_intro_section') {
                        s.classList.remove('active');
                        s.style.display = 'none';
                    }
                });
                const section = document.getElementById(sectionId);
                if (section) {
                    section.style.display = 'block';
                    section.classList.add('active');
                    if (typeof onSectionLoad === 'function') {
                        console.log('showSection - Calling custom onSectionLoad callback for:', sectionId);
                        onSectionLoad(sectionId);
                    } else {
                        loadSection(sectionId);
                    }
                } else {
                    console.error('showSection - Section not found - ID:', sectionId);
                    const fallbackSection = document.getElementById('info');
                    if (fallbackSection) {
                        console.log('showSection - Falling back to info section');
                        fallbackSection.style.display = 'block';
                        fallbackSection.classList.add('active');
                    } else {
                        console.error('showSection - Fallback info section not found');
                        toastr.error('Section not found: ' + sectionId);
                    }
                }
            }

            function toggleSubmenu(submenuId, action = 'toggle') {
                console.log(`toggleSubmenu - Starting ${action} - Submenu ID: ${submenuId}`);
                const submenu = document.getElementById(submenuId);
                const button = document.querySelector(`button[data-submenu="${submenuId}"]`);
                const caret = button?.querySelector('.caret');
                if (submenu && button && caret) {
                    let isOpen = submenu.classList.contains('open');
                    if (action === 'toggle') isOpen = !isOpen;
                    else if (action === 'close') isOpen = false;
                    else if (action === 'open') isOpen = true;
                    submenu.classList.toggle('open', isOpen);
                    submenu.style.display = isOpen ? 'block' : 'none';
                    caret.classList.toggle('fa-caret-down', isOpen);
                    caret.classList.toggle('fa-caret-right', !isOpen);
                    button.setAttribute('aria-expanded', isOpen);
                    console.log(`toggleSubmenu - Submenu ${submenuId} set to ${isOpen ? 'open' : 'closed'}`);
                } else {
                    console.error(`toggleSubmenu - Submenu or button not found - Submenu ID: ${submenuId}`);
                }
            }

            function closeAllTopLevelSubmenus(exceptSubmenuId = null) {
                const topLevelSubmenuButtons = document.querySelectorAll('.menu > button[data-submenu]');
                topLevelSubmenuButtons.forEach(button => {
                    const submenuId = button.getAttribute('data-submenu');
                    if (submenuId && submenuId !== exceptSubmenuId) {
                        const submenu = document.getElementById(submenuId);
                        if (submenu) {
                            closeAllSubmenus(submenu);
                            toggleSubmenu(submenuId, 'close');
                        }
                    }
                });
            }

            function closeAllSubmenus(container) {
                const submenus = container.querySelectorAll('.submenu');
                submenus.forEach(submenu => {
                    const submenuId = submenu.id;
                    if (submenuId) toggleSubmenu(submenuId, 'close');
                });
            }

            function handleSectionClick(event) {
                const button = event.currentTarget;
                const sectionId = button.getAttribute('data-section');
                const submenuId = button.getAttribute('data-submenu');
                const href = button.getAttribute('data-href') || button.getAttribute('href');
                const mdPath = button.getAttribute('data-md-path');
                const role = button.getAttribute('data-role');

                console.log(`handleSectionClick - Clicked:`, { sectionId, submenuId, href, mdPath, role });

                const isTopLevel = button.parentElement.classList.contains('menu');
                if (isTopLevel) {
                    closeAllTopLevelSubmenus(submenuId);
                }

                if (submenuId) {
                    toggleSubmenu(submenuId, 'open');
                }

                if (sectionId && !href && sectionId !== 'user_management') {
                    if (mdPath && typeof window.renderMdPage === 'function') {
                        showSection(sectionId, () => window.renderMdPage(mdPath, 'md-render-target'));
                    } else {
                        showSection(sectionId);
                    }
                }
                if (href) {
                    fetchProtectedPage(href, role);
                }
            }

            function handleLogoutClick(e) {
                e.preventDefault();
                console.log('handleLogoutClick - Log Off clicked');
                fetch('/logoff', { method: 'GET' })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            localStorage.removeItem('authToken');
                            sessionStorage.clear();
                            window.location.href = data.redirect_url;
                        } else {
                            toastr.error(data.message);
                        }
                    })
                    .catch(error => {
                        console.error('Logout failed:', error);
                        toastr.error('Logout failed');
                    });
            }

            function setCookie(name, value, days) {
                let expires = "";
                if (days) {
                    const date = new Date();
                    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                    expires = "; expires=" + date.toUTCString();
                }
                document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax; Secure";
                console.log('setCookie - Set cookie:', name);
            }

            function deleteCookie(name) {
                document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; SameSite=Lax; Secure';
                console.log('deleteCookie - Deleted cookie:', name);
            }

            function getCookie(name) {
                const nameEQ = name + "=";
                const ca = document.cookie.split(';');
                for (let i = 0; i < ca.length; i++) {
                    let c = ca[i];
                    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
                }
                return null;
            }

            window.siteNavigation = {
                showSection,
                toggleSubmenu,
                initializeNavigation,
                fetchProtectedPage,
                loadSection,
                setCookie,
                deleteCookie,
                getCookie,
                initializePage,
                updateMenu,
                loadUserSettings
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    console.log('DOMContentLoaded - Initializing navigation');
                    setTimeout(() => initializeNavigation(), 1000); // Increased delay to ensure DOM is fully loaded
                });
            } else {
                console.log('Document already loaded - Initializing navigation with delay');
                setTimeout(() => initializeNavigation(), 1000); // Increased delay to ensure DOM is fully loaded
            }
        })
        .catch(error => {
            console.error('Failed to initialize navigation due to:', error);
            toastr.error('Navigation initialization failed. Please refresh the page.');
        });
}