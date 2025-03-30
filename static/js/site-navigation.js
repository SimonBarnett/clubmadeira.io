// /static/js/site-navigation.js
// Purpose: Handles navigation, content loading, section/submenu management, and logout across the site.

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
                window.showLoadingOverlay(); // Use the global function
                try {
                    const token = localStorage.getItem('authToken');
                    if (!token) {
                        toastr.error('No authentication token found. Please log in.');
                        window.location.href = '/login'; // Hard redirect to ensure full initialization
                        return;
                    }
                    const response = await window.authenticatedFetch(`${window.apiUrl}${url}`, {
                        method: 'GET',
                        headers: { 'Accept': 'text/html' }
                    });
                    if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
                    const html = await response.text();
                    console.log('fetchProtectedPage - Response status:', response.status);

                    // Update only the content within layout-wrapper
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const newContent = doc.querySelector('.layout-wrapper');
                    if (!newContent) throw new Error('No .layout-wrapper found in response HTML');
                    const layoutWrapper = document.querySelector('.layout-wrapper');
                    if (!layoutWrapper) throw new Error('No .layout-wrapper found in current DOM');
                    layoutWrapper.innerHTML = newContent.innerHTML;

                    // Extract and execute inline scripts from the new content
                    const scripts = doc.querySelectorAll('script:not([src])');
                    scripts.forEach(script => {
                        const newScript = document.createElement('script');
                        newScript.textContent = script.textContent;
                        document.body.appendChild(newScript);
                        document.body.removeChild(newScript); // Clean up after execution
                        console.log('fetchProtectedPage - Executed inline script');
                    });

                    // Reinitialize page
                    const pageType = url.split('/')[1] || 'default';
                    if (typeof window.initialize === 'function') {
                        console.log('fetchProtectedPage - Triggering initialize for:', pageType);
                        window.initialize(pageType);
                    } else {
                        console.warn('fetchProtectedPage - window.initialize not found, page may not fully initialize');
                    }

                    // Reinitialize navigation to attach event listeners to new buttons
                    console.log('fetchProtectedPage - Reinitializing navigation after content load');
                    initializeNavigation();

                    // Reattach branding header listener
                    attachBrandingHeaderListener();
                } catch (error) {
                    console.error('fetchProtectedPage - Error:', error);
                    toastr.error(error.message || 'Failed to load page');
                    window.location.href = '/login'; // Fallback to full reload
                } finally {
                    window.hideLoadingOverlay();
                }
            }

            // Load content for a specific section
            async function loadSection(sectionId) {
                console.log('loadSection - Starting section load - Section ID:', sectionId);
                if (['api-keys', 'my-products', 'create-store', 'my-store-info'].includes(sectionId)) {
                    console.log('loadSection - Skipping fetch for custom section:', sectionId);
                    return;
                }
                if (sectionId === 'deal_listings') {
                    await loadCategories();
                } else if (sectionId === 'merchants') {
                    await loadMerchants();
                } else {
                    try {
                        const response = await window.authenticatedFetch(`${window.apiUrl}/settings/user`);
                        if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
                        const data = await response.json();
                        console.log('loadSection - User settings fetched:', JSON.stringify(data));
                        const settings = {};
                        data.settings.forEach(item => settings[item.field] = item.value);
                        const el = document.getElementById(`${sectionId}Field`);
                        if (el && settings[sectionId]) {
                            el.value = settings[sectionId];
                            console.log(`loadSection - Updated ${sectionId}Field with value:`, settings[sectionId]);
                        }
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
                const mdPath = button.getAttribute('data-md-path');

                console.log(`handleSectionClick - Clicked:`, { sectionId, submenuId, href, mdPath });

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

                if (sectionId && !href) {
                    if (mdPath && typeof window.renderMdPage === 'function') {
                        showSection(sectionId, () => window.renderMdPage(mdPath, 'md-render-target'));
                    } else {
                        showSection(sectionId);
                    }
                }
                if (href) fetchProtectedPage(href);
            }

            // Initialize navigation and logout
            function initializeNavigation() {
                console.log('initializeNavigation - Starting navigation setup');
                // Reset existing event listeners
                document.querySelectorAll('.menu button[data-section], .menu button[data-submenu], .menu button[data-href]').forEach(button => {
                    button.removeEventListener('click', handleSectionClick);
                });
                // Reset submenu states
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

                // Handle Log Off button
                const logOffBtn = document.getElementById('logOffBtn'); // Corrected ID to match templates
                if (logOffBtn) {
                    console.log('initializeNavigation - Log Off button found, attaching listener');
                    logOffBtn.removeEventListener('click', handleLogoutClick);
                    logOffBtn.addEventListener('click', handleLogoutClick);
                } else {
                    console.error('initializeNavigation - Log Off button not found in DOM');
                }

                // Explicitly show the #info section on load
                if (document.getElementById('info')) {
                    console.log('initializeNavigation - Showing info section on load');
                    showSection('info');
                } else {
                    console.error('initializeNavigation - Info section not found on page load');
                }
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
                const header = document.querySelector('.header');
                if (header) {
                    // Remove any existing listeners to prevent duplicates
                    header.removeEventListener('click', handleHeaderClick);
                    header.addEventListener('click', handleHeaderClick);
                    console.log('attachBrandingHeaderListener - Header click listener attached');
                } else {
                    console.error('attachBrandingHeaderListener - Header element not found');
                }
            }

            // Handle header click to show #info section
            function handleHeaderClick(event) {
                const sectionId = event.currentTarget.getAttribute('data-section');
                if (sectionId) {
                    console.log('handleHeaderClick - Header clicked, showing section:', sectionId);
                    showSection(sectionId);
                } else {
                    console.error('handleHeaderClick - No data-section attribute found on header');
                }
            }

            // Export navigation functions
            window.siteNavigation = {
                showSection,
                toggleSubmenu,
                initializeNavigation,
                fetchProtectedPage,
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