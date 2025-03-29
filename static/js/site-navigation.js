// /static/js/site-navigation.js
// Purpose: Handles navigation, content loading, branding, section/submenu management, and logout across the site.

// Guard against multiple inclusions
if (window.siteNavigationInitialized) {
    console.log('site-navigation.js - Already initialized, skipping');
} else {
    window.siteNavigationInitialized = true;

    // Check if window.apiUrl is defined
    if (!window.apiUrl) {
        console.error('site-navigation.js - window.apiUrl is not defined. Please set window.apiUrl before loading this script.');
        throw new Error('window.apiUrl is not defined');
    }
    console.log('site-navigation.js - Using apiUrl:', window.apiUrl);

    // Wait for window.authenticatedFetch to be defined using a Promise
    function waitForAuthFetch() {
        return new Promise((resolve, reject) => {
            const maxAttempts = 50;
            const delay = 100;
            let attempts = 0;

            function check() {
                if (typeof window.authenticatedFetch === 'function') {
                    console.log('waitForAuthFetch - window.authenticatedFetch is now defined');
                    resolve();
                } else if (attempts < maxAttempts) {
                    attempts++;
                    console.log(`waitForAuthFetch - Attempt ${attempts}: window.authenticatedFetch not defined yet, retrying in ${delay}ms`);
                    setTimeout(check, delay);
                } else {
                    console.error('waitForAuthFetch - Max attempts reached, window.authenticatedFetch still not defined');
                    reject(new Error('window.authenticatedFetch is not defined after maximum attempts'));
                }
            }
            check();
        });
    }

    // Initialize navigation once window.authenticatedFetch is available
    waitForAuthFetch()
        .then(() => {
            // Fetch protected page content for navigation
            async function fetchProtectedPage(url) {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    toastr.error('No authentication token found. Please log in.');
                    showLogin();
                    return;
                }
                showLoadingOverlay();
                try {
                    const response = await window.authenticatedFetch(`${window.apiUrl}${url}`, {
                        method: 'GET',
                        headers: { 'Accept': 'text/html' }
                    });
                    if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
                    const html = await response.text();
                    console.log('fetchProtectedPage - Response status:', response.status);
                    console.log('fetchProtectedPage - Full HTML response:', html.substring(0, 200));

                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    document.documentElement.innerHTML = doc.documentElement.innerHTML;

                    // Reattach scripts synchronously
                    const scripts = doc.querySelectorAll('script');
                    for (const oldScript of scripts) {
                        const newScript = document.createElement('script');
                        if (oldScript.src) {
                            newScript.src = oldScript.src;
                            newScript.async = false;
                            document.body.appendChild(newScript);
                            await new Promise(resolve => {
                                newScript.onload = () => {
                                    console.log('fetchProtectedPage - Script loaded:', oldScript.src);
                                    resolve();
                                };
                                newScript.onerror = () => {
                                    console.error('fetchProtectedPage - Script load failed:', oldScript.src);
                                    resolve();
                                };
                            });
                        } else {
                            newScript.textContent = oldScript.textContent;
                            document.body.appendChild(newScript);
                            console.log('fetchProtectedPage - Inline script executed');
                        }
                    }

                    // Trigger page-specific initialization
                    const pageType = url.split('/')[1] || 'admin';
                    if (typeof window.initialize === 'function') {
                        console.log('fetchProtectedPage - Triggering initialize for:', pageType);
                        window.initialize(pageType);
                    }
                    setTimeout(() => hideLoadingOverlay(), 1000);
                } catch (error) {
                    console.error('fetchProtectedPage - Error:', error);
                    toastr.error(error.message || 'Failed to load protected page');
                    hideLoadingOverlay();
                }
            }

            // Load page-specific branding content
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
                const container = document.getElementById(containerId);
                if (!container) {
                    console.error('loadBranding - Container not found - ID:', containerId);
                    return;
                }
                try {
                    const response = await window.authenticatedFetch(`${window.apiUrl}/branding?type=${encodeURIComponent(brandingType)}`);
                    if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
                    const data = await response.json();
                    container.innerHTML = data.status === 'success' && data.branding ? data.branding : defaultContent;
                    console.log('loadBranding - Branding loaded - Type:', brandingType);
                } catch (error) {
                    console.error('loadBranding - Error:', error.message);
                    container.innerHTML = defaultContent;
                }
            }

            // Load content for a specific section
            async function loadSection(sectionId) {
                console.log('loadSection - Starting section load - Section ID:', sectionId);
                if (sectionId === 'deal_listings') {
                    await loadCategories();
                } else if (sectionId === 'merchants') {
                    await loadMerchants();
                } else {
                    try {
                        const response = await window.authenticatedFetch(`${window.apiUrl}/config`);
                        if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
                        const data = await response.json();
                        const config = data.config[sectionId] || {};
                        const el = document.getElementById(`${sectionId}Field`);
                        if (el) el.value = config.value || '';
                    } catch (error) {
                        console.error('loadSection - Error:', error.message);
                        toastr.error(`Error loading ${sectionId}: ${error.message}`);
                    }
                }
            }

            // Show a section and hide others
            function showSection(sectionId, onSectionLoad = null) {
                console.log('showSection - Starting section display - Section ID:', sectionId);
                const allSections = document.querySelectorAll('.section');
                allSections.forEach(s => {
                    s.classList.remove('active');
                    s.style.display = 'none';
                });
                const section = document.getElementById(sectionId);
                if (section) {
                    section.style.display = 'block';
                    section.classList.add('active');
                    if (typeof onSectionLoad === 'function') onSectionLoad(sectionId);
                    else loadSection(sectionId);
                } else {
                    console.error('showSection - Section not found - ID:', sectionId);
                }
            }

            // Toggle a submenu
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

            // Close all submenus
            function closeAllSubmenus(container) {
                const submenus = container.querySelectorAll('.submenu');
                submenus.forEach(submenu => {
                    const submenuId = submenu.id;
                    if (submenuId) toggleSubmenu(submenuId, 'close');
                });
            }

            // Handle section button clicks
            function handleSectionClick(event) {
                event.stopPropagation();
                const button = event.currentTarget;
                const sectionId = button.getAttribute('data-section');
                const submenuId = button.getAttribute('data-submenu');
                const href = button.getAttribute('data-href');

                console.log(`handleSectionClick - Clicked:`, { sectionId, submenuId, href });

                const topLevelSubmenuButtons = document.querySelectorAll('.menu > button[data-submenu]');
                const isTopLevel = button.parentElement.classList.contains('menu');

                if (submenuId) {
                    toggleSubmenu(submenuId, 'toggle');
                    if (isTopLevel) {
                        topLevelSubmenuButtons.forEach(topButton => {
                            const otherSubmenuId = topButton.getAttribute('data-submenu');
                            if (otherSubmenuId && otherSubmenuId !== submenuId) {
                                closeAllSubmenus(document.getElementById(otherSubmenuId));
                                toggleSubmenu(otherSubmenuId, 'close');
                            }
                        });
                    }
                }

                if (sectionId && !href) showSection(sectionId);
                if (href) fetchProtectedPage(href);
            }

            // Initialize navigation and logout
            function initializeNavigation() {
                console.log('initializeNavigation - Starting navigation setup');
                document.querySelectorAll('.menu button[data-section], .menu button[data-submenu], .menu button[data-href]').forEach(button => {
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
                const buttons = document.querySelectorAll('.menu button[data-section], .menu button[data-submenu], .menu button[data-href]');
                console.log('initializeNavigation - Found buttons to initialize:', buttons.length);
                buttons.forEach(button => {
                    button.addEventListener('click', handleSectionClick);
                    console.log('initializeNavigation - Added click listener to button:', {
                        section: button.dataset.section,
                        submenu: button.dataset.submenu,
                        href: button.dataset.href
                    });
                });

                setTimeout(() => {
                    const logOffBtn = document.getElementById('logOffBtn');
                    if (logOffBtn) {
                        console.log('initializeNavigation - Log Off button found, attaching listener');
                        logOffBtn.removeEventListener('click', handleLogoutClick);
                        logOffBtn.addEventListener('click', handleLogoutClick);
                    } else {
                        console.error('initializeNavigation - Log Off button not found in DOM');
                    }
                }, 100);
            }

            // Handle logout click
            function handleLogoutClick(e) {
                e.preventDefault();
                console.log('handleLogoutClick - Log Off clicked');
                localStorage.removeItem('authToken');
                sessionStorage.clear();
                window.location.href = '/';
            }

            // Attach branding header listener
            function attachBrandingHeaderListener() {
                if (!window.brandingHeaderListenerAttached) {
                    const brandingContent = document.getElementById('brandingContent');
                    if (brandingContent) {
                        brandingContent.addEventListener('click', () => {
                            const sectionToShow = window.currentPageType === 'merchant' ? 'info' : 'welcome';
                            showSection(sectionToShow);
                        });
                        window.brandingHeaderListenerAttached = true;
                        console.log('Branding header click listener attached');
                    }
                }
            }

            // Export navigation functions
            window.siteNavigation = {
                showSection,
                toggleSubmenu,
                initializeNavigation,
                fetchProtectedPage,
                loadBranding,
                loadSection
            };

            // Initialize on document readiness
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    console.log('DOMContentLoaded - Initializing navigation');
                    initializeNavigation();
                    attachBrandingHeaderListener();
                });
            } else {
                console.log('Document already loaded - Initializing navigation immediately');
                initializeNavigation();
                attachBrandingHeaderListener();
            }
        })
        .catch(error => {
            console.error('Failed to initialize navigation due to:', error);
            toastr.error('Navigation initialization failed. Please refresh the page.');
        });
}