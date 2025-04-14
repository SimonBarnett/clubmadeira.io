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
                console.log(`loadUserSettings - Loading user settings for ${role || 'undefined'}`);
                try {
                    const settings = await (typeof loadSettings === 'function'
                        ? loadSettings()
                        : window.authenticatedFetch(`${window.apiUrl}/settings/user`).then(r => r.json()));
                    if (!settings) {
                        throw new Error('No settings data returned from API');
                    }
                    const contactName = settings.contact_name || 'User';
                    const userContactNameSpan = document.getElementById('user-contact-name');
                    if (userContactNameSpan) {
                        userContactNameSpan.textContent = contactName;
                        console.log(`loadUserSettings - Updated contact name for ${role || 'undefined'}:`, contactName);
                    } else {
                        console.warn(`loadUserSettings - user-contact-name span not found for ${role || 'undefined'}`);
                    }
                    // Store settings in a global variable for reuse
                    window.userSettings = settings;
                } catch (error) {
                    console.error(`loadUserSettings (${role || 'undefined'}) - Error loading settings:`, error.message);
                    toastr.error('Error loading user settings');
                    window.userSettings = null; // Ensure window.userSettings is null on failure
                }
            }

            // Define all buttons for each role
            const roleMenus = {
                admin: [
                    { section: 'userManagementIntro', icon: 'fas fa-users', text: 'User Management', submenu: 'userManagementIntro' },
                    { section: 'deal_listings', icon: 'fas fa-tags', text: 'Deal Listings' },
                    { section: 'affiliates', icon: 'fas fa-link', text: 'Affiliates' },
                    { section: 'site_settings', icon: 'fas fa-cogs', text: 'Site Settings' },
                    { section: 'testScriptsIntro', icon: 'fas fa-flask', text: 'Test Scripts', submenu: 'testScriptsIntro' },
                    { icon: 'fas fa-cog', text: 'My Account', submenu: 'my-account-submenu' }
                ],
                community: [
                    { section: 'my_website_intro_section', icon: 'fas fa-globe', text: 'My Web Site', submenu: 'my_website_submenu' },
                    { section: 'categories', icon: 'fas fa-list', text: 'My Categories' },
                    { section: 'referrals_intro_section', icon: 'icon-community', text: 'My Referrals', submenu: 'referrals_submenu' },
                    { icon: 'fas fa-cog', text: 'My Account', submenu: 'my-account-submenu' }
                ],
                merchant: [
                    { section: 'my-products', icon: 'fas fa-box', text: 'My Products' },
                    { section: 'store-request', icon: 'fas fa-store', text: 'My Store Request', submenu: 'my-store-submenu' },
                    { section: 'documentation-content', icon: 'fas fa-book', text: 'Documentation', submenu: 'documentation-submenu' },
                    { section: 'api-keys', icon: 'fas fa-key', text: 'API Keys' },
                    { icon: 'fas fa-cog', text: 'My Account', submenu: 'my-account-submenu' }
                ],
                partner: [
                    { section: 'integrations', icon: 'fas fa-plug', text: 'Integrations' },
                    { icon: 'fas fa-cog', text: 'My Account', submenu: 'my-account-submenu' }
                ]
            };

            const submenuItems = {
                userManagementIntro: [
                    { section: 'user_management', icon: 'icon-admin', text: 'Admins', role: 'admin' },
                    { section: 'user_management', icon: 'icon-partner', text: 'Partners', role: 'partner' },
                    { section: 'user_management', icon: 'icon-community', text: 'Communities', role: 'community' },
                    { section: 'user_management', icon: 'icon-merchant', text: 'Merchants', role: 'merchant' }
                ],
                testScriptsIntro: [
                    { href: '/', role: 'partner', icon: 'icon-group', text: 'Partner', subIcons: ['icon-partner', 'fas fa-flask small-icon'] },
                    { href: '/', role: 'community', icon: 'icon-group', text: 'Community', subIcons: ['icon-community', 'fas fa-flask small-icon'] },
                    { href: '/', role: 'merchant', icon: 'icon-group', text: 'Merchant', subIcons: ['icon-merchant', 'fas fa-flask small-icon'] },
                    { section: 'referralTestsIntro', icon: 'fas fa-shopping-cart', text: 'Referral Tests', submenu: 'referralTestsIntro' }
                ],
                referralTestsIntro: [
                    { section: 'page_visit_test', icon: 'fas fa-eye', text: 'Page Visit Referral Test' },
                    { section: 'order_test', icon: 'fas fa-shopping-cart', text: 'Order Referral Test' }
                ],
                'my-store-submenu': [
                    { section: 'api-keys', icon: 'fas fa-key', text: 'API Keys' },
                    { section: 'create-store', icon: 'fas fa-store-alt', text: 'Create Store' }
                ],
                'documentation-submenu': [
                    { mdPath: 'merchant/merchant_getting_started', target: 'md-render-target', text: 'Getting Started', icon: 'fas fa-book-open' },
                    { mdPath: 'merchant/merchant_api', target: 'md-render-target', text: 'API Docs', icon: 'fas fa-code' },
                    { mdPath: 'merchant/merchant_faq', target: 'md-render-target', text: 'FAQ', icon: 'fas fa-question-circle' }
                ],
                'my_website_submenu': [
                    { section: 'wix', icon: 'fab fa-wix-simple', text: 'Wix' },
                    { section: 'wordpress', icon: 'fab fa-wordpress', text: 'WordPress' },
                    { section: 'squarespace', icon: 'fab fa-squarespace', text: 'Squarespace' },
                    { section: 'weebly', icon: 'fab fa-weebly', text: 'Weebly' },
                    { section: 'joomla', icon: 'fab fa-joomla', text: 'Joomla' },
                    { section: 'no_website', icon: 'fas fa-question-circle', text: 'I Don’t Have a Website Yet' }
                ],
                'referrals_submenu': [
                    { section: 'visits', icon: 'fas fa-eye', text: 'Visits' },
                    { section: 'orders', icon: 'fas fa-shopping-cart', text: 'Orders' }
                ],
                'my-account-submenu': [
                    { section: 'my_account_intro', icon: 'fas fa-cog', text: 'My Account Intro', hidden: true }, // Hidden submenu item to trigger intro
                    { section: 'contact_details', icon: 'fas fa-address-book', text: 'Contact Details' },
                    { section: 'change_password', icon: 'fas fa-key', text: 'Change Password' }
                ]
            };

            function createButton({ section, href, role, icon, text, submenu, mdPath, target, subIcons, hidden }) {
                console.log(`createButton - Creating button with text: ${text}, section: ${section}, submenu: ${submenu}`);
                if (hidden) return null; // Skip creating buttons for hidden items
                const button = document.createElement('button');
                if (section) button.setAttribute('data-section', section);
                if (href) button.setAttribute('data-href', href);
                if (role) button.setAttribute('data-role', role);
                if (submenu) button.setAttribute('data-submenu', submenu);
                if (mdPath) {
                    button.setAttribute('data-md-path', mdPath);
                    button.setAttribute('data-target', target);
                }

                const contentSpan = document.createElement('span');
                if (icon) {
                    if (icon === 'icon-group' && subIcons) {
                        const iconGroup = document.createElement('span');
                        subIcons.forEach(iconClass => {
                            const iconElement = document.createElement('i');
                            iconElement.className = iconClass;
                            iconElement.setAttribute('aria-hidden', 'true');
                            // Set inline styles for 16x16 pixels on buttons
                            iconElement.style.width = '16px';
                            iconElement.style.height = '16px';
                            iconElement.style.display = 'inline-block'; // Ensure visibility
                            iconElement.style.verticalAlign = 'middle';
                            iconElement.style.marginRight = '8px';
                            iconGroup.appendChild(iconElement);
                        });
                        contentSpan.appendChild(iconGroup);
                        console.log(`createButton - Added icon group for button: ${text}`);
                    } else {
                        const iconElement = document.createElement('i');
                        iconElement.className = icon;
                        iconElement.setAttribute('aria-hidden', 'true');
                        // Set inline styles for 16x16 pixels on buttons
                        iconElement.style.width = '16px';
                        iconElement.style.height = '16px';
                        iconElement.style.display = 'inline-block'; // Ensure visibility
                        iconElement.style.verticalAlign = 'middle';
                        iconElement.style.marginRight = '8px';
                        contentSpan.appendChild(iconElement);
                        console.log(`createButton - Added icon with class: ${icon} for button: ${text}`);
                    }
                } else {
                    console.log(`createButton - No icon specified for button: ${text}`);
                }
                contentSpan.appendChild(document.createTextNode(` ${text}`));
                button.appendChild(contentSpan);

                if (submenu) {
                    const caret = document.createElement('i');
                    caret.className = 'fas fa-caret-right caret';
                    caret.setAttribute('aria-hidden', 'true');
                    // Set inline styles for the caret as well
                    caret.style.width = '16px';
                    caret.style.height = '16px';
                    caret.style.display = 'inline-block';
                    caret.style.verticalAlign = 'middle';
                    button.appendChild(caret);
                }

                // Ensure no inline styles or classes on the button itself
                button.removeAttribute('style');
                button.className = '';

                return button;
            }

            function createSubmenu(submenuId, submenuItemsList, parentMenu) {
                const submenu = document.createElement('div');
                submenu.id = submenuId;
                submenu.className = 'submenu';
                submenu.style.display = 'none';

                const items = submenuItemsList || [];
                console.log(`createSubmenu - Creating submenu ${submenuId} with items:`, items);
                items.forEach(subItem => {
                    const subButton = createButton(subItem);
                    if (subButton) { // Only append if the button is not hidden
                        submenu.appendChild(subButton);
                        console.log(`createSubmenu - Added submenu item: ${subItem.text} for submenu: ${submenuId}`);
                    }

                    // Recursively create nested submenus
                    if (subItem.submenu) {
                        createSubmenu(subItem.submenu, submenuItems[subItem.submenu], submenu);
                    }
                });

                parentMenu.appendChild(submenu);
            }

            function updateMenu(role) {
                console.log(`updateMenu - Updating menu for role: ${role}`);
                let menu = document.getElementById('menu');
                const userId = document.getElementById('userId')?.value || '';

                if (!menu) {
                    console.warn(`updateMenu - Menu element not found for ${role}, attempting to create one`);
                    menu = document.createElement('div');
                    menu.id = 'menu';
                    menu.className = 'menu';
                    let layoutWrapper = document.querySelector('.layout-wrapper');
                    if (!layoutWrapper) {
                        console.warn(`updateMenu - .layout-wrapper not found, falling back to body for ${role}`);
                        layoutWrapper = document.body;
                    }
                    layoutWrapper.insertBefore(menu, layoutWrapper.firstChild);
                    console.log(`updateMenu - Created and appended menu div for ${role} to ${layoutWrapper.tagName}`);
                }

                // Clear all existing buttons to prevent duplicates
                menu.innerHTML = '';

                // Retrieve user permissions
                let userPermissions = null;
                if (userId) {
                    const token = localStorage.getItem('authToken') || window.siteNavigation.getCookie('authToken');
                    if (token) {
                        try {
                            const decoded = window.decodeJWT(token);
                            userPermissions = decoded ? decoded.permissions : null;
                            console.log('updateMenu - Decoded token:', decoded);
                            console.log('updateMenu - User permissions:', userPermissions);
                        } catch (e) {
                            console.error('updateMenu - Failed to decode JWT token:', e);
                        }
                    } else {
                        console.log('updateMenu - No auth token found in localStorage');
                    }
                } else {
                    console.log('updateMenu - No userId found');
                }
                userPermissions = Array.isArray(userPermissions) ? userPermissions : [];
                console.log(`updateMenu - Current role: ${role}, User permissions:`, userPermissions);

                // Add menu items for the role
                if (role && role !== 'login') {
                    const menuItems = roleMenus[role.toLowerCase()] || [];
                    console.log(`updateMenu - Menu items for role ${role}:`, menuItems);
                    menuItems.forEach(item => {
                        const button = createButton(item);
                        menu.appendChild(button);
                        console.log(`updateMenu - Added menu item: ${item.text}`);

                        if (item.submenu) {
                            createSubmenu(item.submenu, submenuItems[item.submenu], menu);
                        }
                    });

                    // Add "Back to Admin" button if user has admin permission and role is partner, merchant, or community
                    console.log(`updateMenu - Checking if Back to Admin should be added - Role: ${role}, Has admin permission: ${userPermissions.includes('admin')}`);
                    if (['partner', 'merchant', 'community'].includes(role.toLowerCase()) && userPermissions.includes('admin')) {
                        const backToAdminButton = document.createElement('button');
                        backToAdminButton.setAttribute('data-href', '/');
                        backToAdminButton.setAttribute('data-role', 'admin');
                        backToAdminButton.style.backgroundColor = '#dc3545'; // Red background inline
                        backToAdminButton.innerHTML = `<span><i class="icon-admin" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 8px;"></i> Back to Admin</span>`;
                        menu.appendChild(backToAdminButton);
                        console.log(`updateMenu - Appended Back to Admin button for ${role}`);
                    } else {
                        console.log(`updateMenu - Back to Admin button not added - Role: ${role}, Admin permission: ${userPermissions.includes('admin')}`);
                    }

                    // Append Log Off button
                    const logOffButton = document.createElement('button');
                    logOffButton.id = 'logOffBtn';
                    logOffButton.style.backgroundColor = '#dc3545'; // Red background inline
                    logOffButton.innerHTML = `<span><i class="fas fa-sign-out-alt" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 8px;"></i> Log Off</span>`;
                    menu.appendChild(logOffButton);
                    console.log(`updateMenu - Appended Log Off button for ${role}`);
                } else {
                    // For login page, clear the menu
                    menu.innerHTML = '';
                    console.log('updateMenu - Cleared menu for login page');
                }

                console.log('updateMenu - Menu updated for', role);
            }

            let navigationInitialized = false;
            function initializeNavigation(role = null) {
                if (navigationInitialized) {
                    console.log(`initializeNavigation - Already initialized for ${role || 'none'}, skipping`);
                    return;
                }
                navigationInitialized = true;
                console.log(`initializeNavigation - Starting navigation setup${role ? ` for ${role}` : ''}`);

                if (role && role !== 'login' && role !== 'none') {
                    console.log(`initializeNavigation - Applying menu updates for role: ${role}`);
                    updateMenu(role);
                } else {
                    console.log(`initializeNavigation - Skipping menu updates for role: ${role || 'none'}`);
                    updateMenu('login'); // Ensure menu is cleared for login page
                }

                closeAllTopLevelSubmenus();
                console.log('initializeNavigation - All top-level submenus collapsed');

                document.querySelectorAll('.menu button[data-section], .menu button[data-submenu], .menu button[data-href], .menu button[href], .md-link').forEach(button => {
                    button.removeEventListener('click', handleSectionClick);
                });

                // Add event listeners to the roles.inc button
                const rolesButton = document.querySelector('.header button[data-section="info"]');
                if (rolesButton) {
                    rolesButton.removeEventListener('click', handleRolesClick);
                    rolesButton.addEventListener('click', handleRolesClick);
                    console.log('initializeNavigation - Added click listener to roles.inc button');
                } else {
                    console.warn('initializeNavigation - Roles button not found in header');
                }

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
                            console.log(`initializeNavigation - Collapsed submenu ${submenuId}, caret set to right`);
                        } else {
                            console.warn(`initializeNavigation - Caret not found for submenu button: ${submenuId}`);
                        }
                    } else {
                        console.warn(`initializeNavigation - No button found for submenu: ${submenuId}`);
                    }
                });

                // Update selector to include buttons in nested submenus
                const buttons = document.querySelectorAll('.menu button[data-section], .menu button[data-submenu], .menu button[data-href], .menu button[href], .submenu button[data-section], .submenu button[data-submenu], .submenu button[data-href], .submenu button[href], .md-link');
                console.log('initializeNavigation - Found buttons to initialize:', buttons.length);
                buttons.forEach(button => {
                    const sectionId = button.getAttribute('data-section');
                    const parentSubmenu = button.closest('.submenu');
                    if (sectionId === 'user_management' || (parentSubmenu && parentSubmenu.id === 'userManagementIntro')) {
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
                            role: button.dataset.role,
                            mdPath: button.dataset.mdPath
                        });
                    }
                });

                const logOffBtn = document.getElementById('logOffBtn');
                if (logOffBtn) {
                    console.log('initializeNavigation - Log Off button found, attaching listener');
                    logOffBtn.removeEventListener('click', handleLogoutClick);
                    logOffBtn.addEventListener('click', handleLogoutClick);
                } else {
                    console.log('initializeNavigation - No Log Off button to attach listener to (expected on login page)');
                }

                // Ensure info section is shown on load
                const waitForElements = (retryCount = 0, maxRetries = 50) => {
                    const infoSection = document.getElementById('info');
                    console.log(`waitForElements - Retry ${retryCount}/${maxRetries}, infoSection: ${infoSection ? 'found' : 'not found'}, role: ${role || 'none'}`);
                    if (infoSection || retryCount >= maxRetries) {
                        if (!infoSection) {
                            console.warn(`initializeNavigation - Info section not found after ${maxRetries} retries, proceeding without it`);
                        } else {
                            console.log('initializeNavigation - Info section found');
                        }
                        if (role && role !== 'login' && role !== 'none') {
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
                    } else {
                        console.log('initializeNavigation - Info section not yet loaded, retrying...');
                        setTimeout(() => waitForElements(retryCount + 1, maxRetries), 100);
                    }
                };

                waitForElements();
            }

            function handleRolesClick(event) {
                console.log('handleRolesClick - Roles button clicked');
                closeAllTopLevelSubmenus(); // Collapse all menus
                showSection('info'); // Show the info section (welcome screen)
            }

            function showMyAccountSections() {
                console.log('showMyAccountSections - Showing My Account sections');
                const allSections = document.querySelectorAll('.section');
                allSections.forEach(s => {
                    if (s.id !== 'my_website_intro_section') {
                        s.classList.remove('active');
                        s.style.display = 'none';
                    }
                });

                // Show the My Account intro and both forms
                const introSection = document.getElementById('my_account_intro');
                const contactSection = document.getElementById('contact_details');
                const passwordSection = document.getElementById('change_password');

                if (introSection) {
                    introSection.style.display = 'block';
                    introSection.classList.add('active');
                } else {
                    console.error('showMyAccountSections - My Account intro section not found');
                }

                if (contactSection) {
                    contactSection.style.display = 'block';
                    contactSection.classList.add('active');
                    loadSection('contact_details');
                } else {
                    console.error('showMyAccountSections - Contact Details section not found');
                }

                if (passwordSection) {
                    passwordSection.style.display = 'block';
                    passwordSection.classList.add('active');
                    loadSection('change_password');
                } else {
                    console.error('showMyAccountSections - Change Password section not found');
                }
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
                const isSubmenuItem = button.parentElement.classList.contains('submenu');

                if (isTopLevel) {
                    closeAllTopLevelSubmenus(submenuId); // Close other top-level menus
                } else if (isSubmenuItem) {
                    // Close other submenus at the same level
                    const parentSubmenu = button.parentElement;
                    const siblingSubmenus = parentSubmenu.querySelectorAll(':scope > .submenu');
                    siblingSubmenus.forEach(submenu => {
                        if (submenu.id !== submenuId) {
                            toggleSubmenu(submenu.id, 'close');
                        }
                    });
                }

                if (submenuId) {
                    toggleSubmenu(submenuId, 'toggle'); // Toggle the submenu (open/close)
                    if (submenuId === 'my-account-submenu' && isTopLevel) {
                        // Special handling for My Account: show intro and both forms
                        showMyAccountSections();
                    }
                }

                if (sectionId && !href) {
                    if (sectionId === 'my_account_intro') {
                        // Show the My Account intro and both forms
                        showMyAccountSections();
                    } else if (mdPath && typeof window.renderMdPage === 'function') {
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
                // Clear the menu before redirecting
                const menu = document.getElementById('menu');
                if (menu) {
                    menu.innerHTML = '';
                    console.log('handleLogoutClick - Cleared menu before logout');
                }
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
                } else if (sectionId === 'contact_details') {
                    // Load user settings to pre-fill the Contact Details form
                    try {
                        // Check if user settings are already loaded
                        if (!window.userSettings) {
                            console.log('loadSection - User settings not yet loaded, fetching...');
                            // Pass the role from the global context (set during initializeNavigation)
                            const role = localStorage.getItem('role') || 'unknown';
                            await loadUserSettings(role);
                        }
                        if (window.userSettings) {
                            console.log('loadSection - Pre-filling Contact Details form with user settings:', window.userSettings);
                            const contactNameInput = document.getElementById('contactName');
                            const websiteUrlInput = document.getElementById('websiteUrl');
                            const emailAddressInput = document.getElementById('emailAddress');

                            if (contactNameInput) contactNameInput.value = window.userSettings.contact_name || '';
                            if (websiteUrlInput) websiteUrlInput.value = window.userSettings.website_url || '';
                            if (emailAddressInput) emailAddressInput.value = window.userSettings.email_address || '';
                        } else {
                            console.warn('loadSection - No user settings available to pre-fill Contact Details form');
                        }
                    } catch (error) {
                        console.error('loadSection - Error pre-filling Contact Details form:', error.message);
                        toastr.error('Error loading contact details');
                    }
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
                    console.log(`toggleSubmenu - Submenu ${submenuId} set to ${isOpen ? 'open' : 'closed'}, display: ${submenu.style.display}`);
                } else {
                    console.error(`toggleSubmenu - Submenu or button not found - Submenu ID: ${submenuId}`);
                }
            }

            function closeAllTopLevelSubmenus(exceptSubmenuId = null) {
                const topLevelSubmenuButtons = document.querySelectorAll('.menu > button[data-submenu]');
                console.log(`closeAllTopLevelSubmenus - Found ${topLevelSubmenuButtons.length} top-level submenu buttons`);
                topLevelSubmenuButtons.forEach(button => {
                    const submenuId = button.getAttribute('data-submenu');
                    if (submenuId && submenuId !== exceptSubmenuId) {
                        const submenu = document.getElementById(submenuId);
                        if (submenu) {
                            closeAllSubmenus(submenu);
                            toggleSubmenu(submenuId, 'close');
                        } else {
                            console.warn(`closeAllTopLevelSubmenus - Submenu not found: ${submenuId}`);
                        }
                    }
                });
            }

            function closeAllSubmenus(container) {
                const submenus = container.querySelectorAll('.submenu');
                console.log(`closeAllSubmenus - Found ${submenus.length} submenus in container`);
                submenus.forEach(submenu => {
                    const submenuId = submenu.id;
                    if (submenuId) {
                        toggleSubmenu(submenuId, 'close');
                    }
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
                loadUserSettings,
                handleRolesClick,
                showMyAccountSections
            };

            document.addEventListener('DOMContentLoaded', () => {
                navigationInitialized = false;
                console.log('DOMContentLoaded - Initializing navigation');
                setTimeout(() => initializeNavigation(), 1500);
            });
        })
        .catch(error => {
            console.error('Failed to initialize navigation due to:', error);
            toastr.error('Navigation initialization failed. Please refresh the page.');
        });
}