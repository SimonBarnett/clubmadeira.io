// /static/js/site-navigation.js
// Purpose: Handles navigation, content loading, branding, and section/submenu management across the site.

// Guard against multiple inclusions
if (window.siteNavigationInitialized) {
    console.log('site-navigation.js - Already initialized, skipping');
} else {
    window.siteNavigationInitialized = true;

    // Check if window.apiUrl is defined, throw an error if not
    if (!window.apiUrl) {
        console.error('site-navigation.js - window.apiUrl is not defined. Please set window.apiUrl before loading this script.');
        throw new Error('window.apiUrl is not defined');
    }
    console.log('site-navigation.js - Using apiUrl:', window.apiUrl);

    // Performs authenticated fetch requests for protected resources
    async function authenticatedFetch(url, options = {}) {
        console.log('authenticatedFetch - Initiating fetch - URL:', url);
        const token = localStorage.getItem('authToken');
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
        const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
        try {
            const response = await fetch(fetchUrl, { ...options, headers });
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
            return response;
        } catch (error) {
            console.error('authenticatedFetch - Error during fetch:', error.message);
            toastr.error(error.message || 'Failed to connect to server');
            return null;
        }
    }

    // Expose authenticatedFetch globally
    window.authenticatedFetch = authenticatedFetch;

    // Fetches protected page content for navigation
    async function fetchProtectedPage(url, targetContainer = null) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            toastr.error('No authentication token found. Please log in.');
            showLogin(); // Assumes showLogin is defined elsewhere
            return;
        }
        const overlay = showLoadingOverlay(); // Assumes showLoadingOverlay is defined
        try {
            const response = await authenticatedFetch(`${window.apiUrl}${url}`, {
                method: 'GET',
                headers: { 'Accept': 'text/html' }
            });
            if (!response) throw new Error('No response from server');
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const scripts = doc.querySelectorAll('script');

            if (targetContainer) {
                const container = document.querySelector(targetContainer);
                if (!container) throw new Error(`Target container not found: ${targetContainer}`);
                
                // Clear existing content
                container.innerHTML = '';

                // Inject new content
                const newContent = doc.querySelector('.content-wrapper');
                if (!newContent) throw new Error('No .content-wrapper found in fetched content');
                container.innerHTML = newContent.innerHTML;

                // Update menu to match target page layout
                const newMenu = doc.querySelector('.menu-container');
                const currentMenu = document.querySelector('.menu-container');
                if (newMenu && currentMenu) {
                    currentMenu.innerHTML = newMenu.innerHTML;
                }

                // Re-execute scripts selectively
                await Promise.all([...scripts].map(script => {
                    if (script.src && !script.src.includes('site-navigation.js')) {
                        return new Promise(resolve => {
                            const newScript = document.createElement('script');
                            newScript.src = script.src;
                            newScript.async = false;
                            newScript.onload = resolve;
                            newScript.onerror = () => console.error(`Failed to load script: ${script.src}`);
                            document.head.appendChild(newScript);
                        });
                    } else if (script.innerHTML.trim()) {
                        new Function(script.innerHTML)();
                    }
                }));

                // Reinitialize page with navigation flag
                const pageType = url.split('/')[1] || 'admin';
                if (typeof window.initialize === 'function') {
                    window.isNavigating = true;
                    window.initialize(pageType);
                }
                await new Promise(resolve => setTimeout(resolve, 100)); // Wait for DOM to settle
                initializeNavigation();
                
                // Update branding after DOM injection
                console.log('fetchProtectedPage - Updating branding for:', pageType);
                await loadBranding(pageType);
                console.log('fetchProtectedPage - Branding update completed for:', pageType);

                setTimeout(() => hideLoadingOverlay(), 500);
                return html;
            } else {
                document.documentElement.innerHTML = doc.documentElement.innerHTML;
                setTimeout(() => hideLoadingOverlay(), 1000);
                return html;
            }
        } catch (error) {
            console.error('fetchProtectedPage - Error:', error);
            toastr.error(error.message || 'Failed to load protected page');
            hideLoadingOverlay();
        }
    }

    // Loads page-specific branding content
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
            if (!response) {
                console.warn('loadBranding - No response, using default content');
                container.innerHTML = defaultContent;
                return;
            }
            const data = await response.json();
            console.log('loadBranding - Fetched branding data:', data);
            if (data.status === 'success' && data.branding) {
                container.innerHTML = data.branding;
                console.log('loadBranding - Branding loaded successfully - Type:', brandingType);
            } else {
                console.warn('loadBranding - Invalid response, using default content');
                container.innerHTML = defaultContent;
            }
        } catch (error) {
            console.error('loadBranding - Error fetching branding:', error.message);
            container.innerHTML = defaultContent;
            console.log('loadBranding - Fallback branding applied - Type:', brandingType);
        }
    }

    // Loads content for a specific section
    async function loadSection(sectionId) {
        console.log('loadSection - Starting section load - Section ID:', sectionId);
        if (sectionId === 'deal_listings') {
            await loadCategories(); // Assumes loadCategories is defined elsewhere
        } else if (sectionId === 'merchants') {
            await loadMerchants(); // Assumes loadMerchants is defined elsewhere
        } else {
            try {
                const response = await window.authenticatedFetch(`${window.apiUrl}/config`);
                if (!response) throw new Error('No response from fetch');
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

    // Function to show a section and hide others
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
            if (typeof onSectionLoad === 'function') {
                console.log('showSection - Executing callback for:', sectionId);
                onSectionLoad(sectionId);
            } else {
                loadSection(sectionId); // Default to loadSection if no callback
            }
        } else {
            console.error('showSection - Section not found - ID:', sectionId);
        }
    }

    // Function to toggle a submenu with explicit action control
    function toggleSubmenu(submenuId, action = 'toggle') {
        console.log(`toggleSubmenu - Starting ${action} - Submenu ID: ${submenuId}`);
        const submenu = document.getElementById(submenuId);
        const button = document.querySelector(`button[data-submenu="${submenuId}"]`);
        const caret = button ? button.querySelector('.caret') : null;
        if (submenu && button && caret) {
            let isOpen = submenu.classList.contains('open');
            if (action === 'toggle') {
                isOpen = !isOpen;
            } else if (action === 'close') {
                isOpen = false;
            } else if (action === 'open') {
                isOpen = true;
            }
            submenu.classList.toggle('open', isOpen);
            submenu.style.display = isOpen ? 'block' : 'none';
            caret.classList.toggle('fa-caret-down', isOpen);
            caret.classList.toggle('fa-caret-right', !isOpen);
            button.setAttribute('aria-expanded', isOpen);
            console.log(`toggleSubmenu - Submenu ${submenuId} set to ${isOpen ? 'open' : 'closed'}`, {
                inlineDisplay: submenu.style.display,
                computedDisplay: window.getComputedStyle(submenu).display,
                height: window.getComputedStyle(submenu).height,
                maxHeight: window.getComputedStyle(submenu).maxHeight,
                className: submenu.className
            });
        } else {
            console.error(`toggleSubmenu - Submenu or button not found - Submenu ID: ${submenuId}`, {
                submenuExists: !!submenu,
                buttonExists: !!button,
                caretExists: !!caret
            });
        }
    }

    // Function to close all submenus within a given container
    function closeAllSubmenus(container) {
        const submenus = container.querySelectorAll('.submenu');
        submenus.forEach(submenu => {
            const submenuId = submenu.id;
            if (submenuId) {
                toggleSubmenu(submenuId, 'close');
            }
        });
    }

    // Function to handle clicks on navigation buttons
    function handleSectionClick(event) {
        event.stopPropagation(); // Prevent bubbling to ensure isolated handling
        const button = event.currentTarget;
        const sectionId = button.getAttribute('data-section');
        const submenuId = button.getAttribute('data-submenu');
        const href = button.getAttribute('data-href');

        console.log(`handleSectionClick - Clicked:`, { sectionId, submenuId, href });

        // Find all top-level submenu buttons
        const topLevelSubmenuButtons = document.querySelectorAll('.menu > button[data-submenu]');
        console.log(`handleSectionClick - Found top-level submenu buttons:`, topLevelSubmenuButtons.length);

        // Determine if this is a top-level button
        const isTopLevel = button.parentElement.classList.contains('menu');

        // Handle submenu toggling first
        if (submenuId) {
            console.log(`handleSectionClick - Toggling submenu: ${submenuId}`);
            toggleSubmenu(submenuId, 'toggle');
            if (isTopLevel) {
                // Close other top-level submenus
                topLevelSubmenuButtons.forEach(topButton => {
                    const otherSubmenuId = topButton.getAttribute('data-submenu');
                    if (otherSubmenuId && otherSubmenuId !== submenuId) {
                        console.log(`handleSectionClick - Closing top-level submenu: ${otherSubmenuId}`);
                        closeAllSubmenus(document.getElementById(otherSubmenuId));
                        toggleSubmenu(otherSubmenuId, 'close');
                    }
                });
            }
        }

        // Handle section display if no href
        if (sectionId && !href) {
            console.log(`handleSectionClick - Showing section: ${sectionId}`);
            showSection(sectionId);
        }

        // Handle SPA navigation if href exists
        if (href) {
            console.log(`handleSectionClick - Navigating to: ${href}`);
            fetchProtectedPage(href, '.content-wrapper');
        }
    }

    // Main function to initialize navigation
    function initializeNavigation() {
        console.log('initializeNavigation - Starting navigation setup');
        // Clean up existing listeners
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
    }

    // Function to attach branding header click listener
    function attachBrandingHeaderListener() {
        if (!window.brandingHeaderListenerAttached) {
            const brandingContent = document.getElementById('brandingContent');
            if (brandingContent) {
                brandingContent.addEventListener('click', function() {
                    const sectionToShow = window.currentPageType === 'merchant' ? 'info' : 'welcome';
                    showSection(sectionToShow);
                });
                window.brandingHeaderListenerAttached = true;
                console.log('Branding header click listener attached');
            } else {
                console.warn('Branding header element not found');
            }
        }
    }

    // Export navigation functions under a namespace
    window.siteNavigation = {
        showSection,
        toggleSubmenu,
        initializeNavigation,
        authenticatedFetch,
        fetchProtectedPage,
        loadBranding,
        loadSection
    };

    // Initialize navigation and attach branding header listener based on document readiness
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
}