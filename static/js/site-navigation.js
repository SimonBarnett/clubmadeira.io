// site-navigation.js
// Purpose: Handles navigation and content loading across the site, including authenticated fetch requests, 
// protected page loading, branding, and section/submenu management.

// Check if window.apiUrl is defined, throw an error if not
if (!window.apiUrl) {
    console.error('site-navigation.js - window.apiUrl is not defined. Please set window.apiUrl before loading this script.');
    throw new Error('window.apiUrl is not defined');
}
console.log('site-navigation.js - Using apiUrl:', window.apiUrl);

// Performs authenticated fetch requests for protected resources, ensuring proper authorization headers.
async function authenticatedFetch(url, options = {}) {
    console.log('authenticatedFetch - Initiating fetch - URL:', url);
    const token = localStorage.getItem('authToken');
    console.log('authenticatedFetch - Token retrieved from localStorage:', token || 'None');
    console.log('authenticatedFetch - Options provided:', JSON.stringify(options));

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
    console.log('authenticatedFetch - Request headers constructed:', JSON.stringify(headers));

    const finalOptions = {
        ...options,
        headers: headers
    };
    console.log('authenticatedFetch - Final fetch options:', JSON.stringify(finalOptions));

    // Add timestamp to the URL to prevent caching
    const timestamp = Date.now();
    const separator = url.includes('?') ? '&' : '?';
    const fetchUrl = `${url}${separator}t=${timestamp}`;
    console.log('authenticatedFetch - Sending fetch request to:', fetchUrl);

    try {
        const startTime = Date.now();
        const response = await fetch(fetchUrl, finalOptions);
        const duration = Date.now() - startTime;
        console.log('authenticatedFetch - Fetch response received - Status:', response.status, 'Duration:', `${duration}ms`);
        console.log('authenticatedFetch - Response headers:', JSON.stringify([...response.headers.entries()]));
        console.log('authenticatedFetch - Response URL:', response.url);

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

        console.log('authenticatedFetch - Fetch successful - Response OK');
        return response;
    } catch (error) {
        console.error('authenticatedFetch - Error during fetch - URL:', url, 'Error:', error.message, 'Stack:', error.stack);
        toastr.error(error.message || 'Failed to connect to server');
        return null;
    }
}

// Fetches protected page content for navigation, with an option to load into a specific container
async function fetchProtectedPage(url, targetContainer = null) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        toastr.error('No authentication token found. Please log in.');
        showLogin();
        return;
    }

    const overlay = showLoadingOverlay();
    try {
        const response = await fetch(`${window.apiUrl}${url}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'text/html'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server returned ${response.status}: ${errorText}`);
        }

        const html = await response.text();

        // Parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const scripts = doc.querySelectorAll('script');
        scripts.forEach(script => script.remove()); // Remove scripts to avoid double execution

        if (targetContainer) {
            // Load content into the specified container (e.g., .content-wrapper)
            const container = document.querySelector(targetContainer);
            if (!container) {
                console.error(`fetchProtectedPage - Target container not found: ${targetContainer}`);
                toastr.error('Failed to load page content: Container not found');
                hideLoadingOverlay();
                return;
            }

            // Extract the main content (assuming the target page has a .content-wrapper or similar structure)
            const newContent = doc.querySelector('.content-wrapper') || doc.body;
            container.innerHTML = newContent.innerHTML;

            // Load and execute scripts manually
            const scriptPromises = [];
            scripts.forEach(script => {
                if (script.src) {
                    const newScript = document.createElement('script');
                    newScript.src = script.src;
                    newScript.async = false;
                    scriptPromises.push(
                        new Promise(resolve => {
                            newScript.onload = resolve;
                            newScript.onerror = () => console.error(`Failed to load script: ${script.src}`);
                            document.head.appendChild(newScript);
                        })
                    );
                } else if (script.innerHTML.trim()) {
                    try {
                        const scriptFn = new Function(script.innerHTML);
                        scriptFn();
                    } catch (e) {
                        console.error('Error executing inline script:', e);
                    }
                }
            });

            // Wait for scripts to load
            await Promise.all(scriptPromises);

            // Reinitialize navigation and other scripts
            if (typeof window.initialize === 'function') {
                const pageType = url.split('/')[1] || 'admin';
                console.log('fetchProtectedPage - Triggering window.initialize for page type:', pageType);
                window.initialize(pageType);
            } else {
                console.warn('fetchProtectedPage - window.initialize not found');
            }

            // Reinitialize navigation to ensure menu functionality
            initializeNavigation();

            // Hide the loading overlay
            setTimeout(() => {
                hideLoadingOverlay();
            }, 500);

            return html;
        } else {
            // Original behavior: Replace the entire document
            document.documentElement.innerHTML = doc.documentElement.innerHTML;

            // Ensure critical stylesheets are present
            const head = document.head;
            const requiredStyles = [
                'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
                'https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css',
                '/static/styles.css'
            ];
            requiredStyles.forEach(href => {
                if (!head.querySelector(`link[href="${href}"]`)) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = href;
                    head.appendChild(link);
                }
            });

            // Load and execute scripts manually
            const scriptPromises = [];
            scripts.forEach(script => {
                if (script.src) {
                    const newScript = document.createElement('script');
                    newScript.src = script.src;
                    newScript.async = false;
                    scriptPromises.push(
                        new Promise(resolve => {
                            newScript.onload = resolve;
                            newScript.onerror = () => console.error(`Failed to load script: ${script.src}`);
                            document.head.appendChild(newScript);
                        })
                    );
                } else if (script.innerHTML.trim()) {
                    try {
                        const scriptFn = new Function(script.innerHTML);
                        scriptFn();
                    } catch (e) {
                        console.error('Error executing inline script:', e);
                    }
                }
            });

            // Wait for scripts to load
            await Promise.all(scriptPromises);

            // Trigger page initialization
            if (typeof window.initialize === 'function') {
                const pageType = url.split('/')[1] || 'login';
                console.log('fetchProtectedPage - Triggering window.initialize for page type:', pageType);
                window.initialize(pageType);
            } else {
                console.warn('fetchProtectedPage - window.initialize not found');
            }

            // Show the page
            setTimeout(() => {
                const layoutWrapper = document.querySelector('.layout-wrapper');
                if (layoutWrapper) {
                    layoutWrapper.style.display = 'block';
                } else {
                    toastr.error('Failed to load page content');
                }
                hideLoadingOverlay();
            }, 1000);

            return html;
        }
    } catch (error) {
        console.error('fetchProtectedPage - Error:', error);
        toastr.error(error.message || 'Failed to load protected page');
        showLogin();
        hideLoadingOverlay();
    }
}

// Loads page-specific branding content into a specified container.
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
    console.log('loadBranding - Default content for type:', brandingType, 'is:', defaultContent);

    const container = document.getElementById(containerId);
    console.log('loadBranding - Container element:', container);
    if (!container) {
        console.error('loadBranding - Container not found - ID:', containerId);
        return;
    }

    try {
        const fetchUrl = `${window.apiUrl}/branding?type=${encodeURIComponent(brandingType)}`;
        console.log('loadBranding - Fetching branding from:', fetchUrl);
        const startTime = Date.now();
        const response = await authenticatedFetch(fetchUrl);
        const duration = Date.now() - startTime;
        if (!response) {
            console.warn('loadBranding - No response from fetch - Using default content - Type:', brandingType);
            container.innerHTML = defaultContent;
            console.log('loadBranding - Set container innerHTML to default content:', container.innerHTML);
            return;
        }
        console.log('loadBranding - Fetch completed - Duration:', `${duration}ms`);
        const data = await response.json();
        console.log('loadBranding - Branding data received:', JSON.stringify(data));
        if (data.status === 'success' && data.branding) {
            const brandingContent = data.branding;
            console.log('loadBranding - Setting branding content:', brandingContent);
            container.innerHTML = brandingContent;
            console.log('loadBranding - Branding content updated in container:', containerId, 'New innerHTML:', container.innerHTML);
        } else {
            console.warn('loadBranding - Invalid branding data - Using default content - Type:', brandingType);
            container.innerHTML = defaultContent;
            console.log('loadBranding - Set container innerHTML to default content:', container.innerHTML);
        }
    } catch (error) {
        console.error('loadBranding - Error loading branding - Type:', brandingType, 'Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error loading ${brandingType} branding: ${error.message}`);
        container.innerHTML = defaultContent;
        console.log('loadBranding - Fallback to default content applied - Container ID:', containerId, 'New innerHTML:', container.innerHTML);
    }
}

// Displays a specific section while hiding others, with optional load callback.
function showSection(sectionId, onSectionLoad = null) {
    console.log('showSection - Starting section display - Section ID:', sectionId);
    console.log('showSection - Callback provided:', typeof onSectionLoad === 'function' ? 'Yes' : 'No');
    const allSections = document.querySelectorAll('.section');
    console.log('showSection - Found sections to hide:', allSections.length);
    allSections.forEach(s => {
        console.log('showSection - Hiding section - ID:', s.id);
        s.classList.remove('active');
        s.style.display = 'none';
    });
    const activeSection = document.getElementById(sectionId);
    console.log('showSection - Target section element:', activeSection);
    if (!activeSection) {
        console.error('showSection - Section not found - ID:', sectionId);
        return;
    }
    activeSection.classList.add('active');
    activeSection.style.display = 'block';
    console.log('showSection - Section activated - ID:', sectionId);

    // Highlight the corresponding submenu button
    document.querySelectorAll('.submenu button').forEach(button => {
        button.classList.remove('active');
        if (button.getAttribute('data-section') === sectionId) {
            button.classList.add('active');
        }
    });

    if (typeof onSectionLoad === 'function') {
        console.log('showSection - Executing onSectionLoad callback for:', sectionId);
        onSectionLoad(sectionId);
    } else {
        console.log('showSection - No callback provided, calling loadSection directly');
        loadSection(sectionId);
    }
    console.log('showSection - Section display completed');
}

// Loads content or configures DOM elements for a specific section based on its ID.
async function loadSection(sectionId) {
    console.log('loadSection - Starting section load - Section ID:', sectionId);

    // Handle static or test sections
    if (['welcome', 'page_visit_test', 'order_test', 'affiliateProgramsIntro', 'userManagementIntro', 'testScriptsIntro', 'referralTestsIntro'].includes(sectionId)) {
        console.log('loadSection - Processing static/test section:', sectionId);
        if (sectionId === 'page_visit_test' || sectionId === 'order_test') {
            const timestampId = sectionId === 'page_visit_test' ? 'pageTimestamp' : 'orderTimestamp';
            const timestampElement = document.getElementById(timestampId);
            console.log('loadSection - Timestamp element for', timestampId, ':', timestampElement);

            if (timestampElement) {
                const timestamp = getCurrentTimestamp(); // From site-request.js
                timestampElement.value = timestamp;
                console.log('loadSection - Set timestamp for', timestampId, 'to:', timestamp);
            } else {
                console.error('loadSection - Timestamp element not found - ID:', timestampId);
            }

            const refererId = sectionId === 'page_visit_test' ? 'pageReferer' : 'orderReferer';
            console.log('loadSection - Populating referer dropdown - ID:', refererId);
            await populateRefererDropdown(refererId); // Page-specific stub
        }
        console.log('loadSection - Static/test section load completed');
        return;
    }

    // Handle category listings
    if (sectionId === 'deal_listings') {
        console.log('loadSection - Loading deal listings');
        await loadCategories(); // From category-management.js
        console.log('loadSection - Deal listings loaded');
        return;
    }

    // Handle entity lists
    if (sectionId === 'merchants') {
        console.log('loadSection - Loading merchants');
        await loadMerchants(); // Page-specific stub
        console.log('loadSection - Merchants loaded');
        return;
    }
    if (sectionId === 'communities') {
        console.log('loadSection - Loading communities');
        await loadCommunities(); // Page-specific stub
        console.log('loadSection - Communities loaded');
        return;
    }
    if (sectionId === 'partners') {
        console.log('loadSection - Loading partners');
        await loadPartners(); // Page-specific stub
        console.log('loadSection - Partners loaded');
        return;
    }

    // Handle configuration sections
    console.log('loadSection - Attempting to load config for section:', sectionId);
    try {
        const fetchUrl = `${window.apiUrl}/config`;
        console.log('loadSection - Fetching config from:', fetchUrl);
        const startTime = Date.now();
        const response = await authenticatedFetch(fetchUrl);
        const duration = Date.now() - startTime;

        if (!response) {
            console.error('loadSection - No response from fetch for config - Section:', sectionId);
            toastr.error('Failed to load section credentials: No response');
            return;
        }
        if (!response.ok) {
            const errorText = await response.text();
            console.error('loadSection - Fetch failed - Status:', response.status, 'Error text:', errorText);
            throw new Error(`Failed to fetch /config: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('loadSection - Config data received - Duration:', `${duration}ms`, 'Data:', JSON.stringify(data));
        const config = data.config[sectionId] || {};
        console.log('loadSection - Config for section:', sectionId, 'is:', JSON.stringify(config));

        // Populate fields based on section
        if (sectionId === 'amazon_uk') {
            const elements = {
                amazonAccessKey: 'ACCESS_KEY',
                amazonSecretKey: 'SECRET_KEY',
                amazonAssociateTag: 'ASSOCIATE_TAG',
                amazonCountry: 'COUNTRY'
            };
            Object.entries(elements).forEach(([id, key]) => {
                const el = document.getElementById(id);
                console.log('loadSection - Checking element - ID:', id, 'Element:', el);
                if (el) {
                    el.value = config[key] || '';
                    console.log('loadSection - Set', id, 'to:', el.value);
                } else {
                    console.error('loadSection - Element not found - ID:', id);
                }
            });
        } else if (sectionId === 'ebay_uk') {
            const el = document.getElementById('ebayAppId');
            console.log('loadSection - eBay App ID element:', el);
            if (el) {
                el.value = config.APP_ID || '';
                console.log('loadSection - Set ebayAppId to:', el.value);
            } else {
                console.error('loadSection - Element not found - ID: ebayAppId');
            }
        } else if (sectionId === 'awin') {
            const el = document.getElementById('awinApiToken');
            console.log('loadSection - Awin API Token element:', el);
            if (el) {
                el.value = config.API_TOKEN || '';
                console.log('loadSection - Set awinApiToken to:', el.value);
            } else {
                console.error('loadSection - Element not found - ID: awinApiToken');
            }
        } else if (sectionId === 'cj') {
            const elements = {
                cjApiKey: 'API_KEY',
                cjWebsiteId: 'WEBSITE_ID'
            };
            Object.entries(elements).forEach(([id, key]) => {
                const el = document.getElementById(id);
                console.log('loadSection - Checking element - ID:', id, 'Element:', el);
                if (el) {
                    el.value = config[key] || '';
                    console.log('loadSection - Set', id, 'to:', el.value);
                } else {
                    console.error('loadSection - Element not found - ID:', id);
                }
            });
        } else if (sectionId === 'textmagic') {
            const elements = {
                textmagicUsername: 'USERNAME',
                textmagicApiKey: 'API_KEY'
            };
            Object.entries(elements).forEach(([id, key]) => {
                const el = document.getElementById(id);
                console.log('loadSection - Checking element - ID:', id, 'Element:', el);
                if (el) {
                    el.value = config[key] || '';
                    console.log('loadSection - Set', id, 'to:', el.value);
                } else {
                    console.error('loadSection - Element not found - ID:', id);
                }
            });
        } else if (sectionId === 'tiny') {
            const el = document.getElementById('tinyApiKey');
            console.log('loadSection - Tiny API Key element:', el);
            if (el) {
                el.value = config.API_KEY || '';
                console.log('loadSection - Set tinyApiKey to:', el.value);
            } else {
                console.error('loadSection - Element not found - ID: tinyApiKey');
            }
        }

        console.log('loadSection - Successfully loaded credentials for:', sectionId);
        toastr.success(`Loaded credentials for ${sectionId}`);
    } catch (error) {
        console.error('loadSection - Error loading section credentials - Section:', sectionId, 'Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error loading credentials: ${error.message}`);
    }
    console.log('loadSection - Section load completed - Section ID:', sectionId);
}

// Updated toggleSubmenu function with improved caret detection
function toggleSubmenu(submenuId) {
    console.log(`toggleSubmenu - Starting toggle - Submenu ID: ${submenuId}`);
    const submenuElement = document.getElementById(submenuId);
    if (!submenuElement) {
        console.error(`toggleSubmenu - Submenu element not found: ${submenuId}`);
        toastr.error(`Navigation error: Submenu "${submenuId}" not found.`);
        return;
    }
    console.log(`toggleSubmenu - Submenu element retrieved:`, submenuElement);

    const button = document.querySelector(`button[data-submenu="${submenuId}"]`);
    if (!button) {
        console.error(`toggleSubmenu - Button for submenu not found: ${submenuId}`);
        toastr.error(`Navigation error: Button for submenu "${submenuId}" not found.`);
        return;
    }

    const isTopLevel = submenuElement.parentElement.classList.contains('menu') || !submenuElement.parentElement.closest('.submenu');
    console.log(`toggleSubmenu - Submenu is top-level: ${isTopLevel}`);

    // Close sibling submenus at the same level
    const parentMenu = isTopLevel ? document.querySelector('.menu') : submenuElement.parentElement.closest('.submenu');
    if (!parentMenu) {
        console.warn(`toggleSubmenu - Parent menu not found for submenu: ${submenuId}. Skipping sibling submenu closure.`);
        toastr.warning(`Navigation warning: Parent menu for "${submenuId}" not found.`);
    } else {
        const siblingSubmenus = parentMenu.querySelectorAll(`.submenu:not(#${submenuId})`);
        siblingSubmenus.forEach(sibling => {
            console.log(`toggleSubmenu - Closing sibling submenu - ID: ${sibling.id}`);
            sibling.style.display = 'none';
            sibling.classList.remove('open');
            const siblingButton = document.querySelector(`button[data-submenu="${sibling.id}"]`);
            if (siblingButton) {
                siblingButton.setAttribute('aria-expanded', 'false');
            }
            const siblingCaret = siblingButton ? siblingButton.querySelector('.caret') : null;
            if (siblingCaret) {
                siblingCaret.classList.replace('fa-caret-down', 'fa-caret-right');
                console.log(`toggleSubmenu - Reset caret for sibling submenu: ${sibling.id} to fa-caret-right`);
            }
        });
    }

    // Use getComputedStyle to accurately determine the current display state
    const computedStyle = window.getComputedStyle(submenuElement);
    const isOpen = computedStyle.display === 'block';
    console.log(`toggleSubmenu - Toggled state - ID: ${submenuId} Was open: ${isOpen} Now open: ${!isOpen}`);

    // Toggle the target submenu
    submenuElement.style.display = isOpen ? 'none' : 'block';
    if (isOpen) {
        submenuElement.classList.remove('open');
    } else {
        submenuElement.classList.add('open');
    }

    // Update ARIA attribute for accessibility
    button.setAttribute('aria-expanded', !isOpen);

    // Find the caret using the .caret class
    let caret = button.querySelector('.caret');
    if (!caret) {
        console.warn(`toggleSubmenu - Caret not found for submenu: ${submenuId}. Adding caret programmatically.`);
        caret = document.createElement('i');
        caret.className = 'fas fa-caret-right caret';
        button.appendChild(caret);
    }

    if (caret) {
        console.log(`toggleSubmenu - Caret found for submenu: ${submenuId}, current classes: ${caret.className}`);
        if (!isOpen) {
            caret.classList.replace('fa-caret-right', 'fa-caret-down');
            console.log(`toggleSubmenu - Set caret to fa-caret-down for submenu: ${submenuId}`);
        } else {
            caret.classList.replace('fa-caret-down', 'fa-caret-right');
            console.log(`toggleSubmenu - Set caret to fa-caret-right for submenu: ${submenuId}`);
        }
    } else {
        console.error(`toggleSubmenu - Failed to find or create caret for submenu: ${submenuId}`);
    }

    console.log(`toggleSubmenu - Toggle completed`);
}

// Updated initializeNavigation with SPA navigation for data-href buttons without URL change
function initializeNavigation() {
    console.log('initializeNavigation - Starting navigation setup');

    // Initialize submenu states (all closed by default)
    document.querySelectorAll('.submenu').forEach(submenu => {
        submenu.style.display = 'none';
        submenu.classList.remove('open');
        const submenuId = submenu.id;
        const button = document.querySelector(`button[data-submenu="${submenuId}"]`);
        if (button) {
            button.setAttribute('aria-expanded', 'false');
            let caret = button.querySelector('.caret');
            if (!caret) {
                console.warn(`initializeNavigation - Caret not found for submenu: ${submenuId}. Adding caret programmatically.`);
                caret = document.createElement('i');
                caret.className = 'fas fa-caret-right caret';
                button.appendChild(caret);
            } else {
                caret.classList.remove('fa-caret-down');
                caret.classList.add('fa-caret-right');
            }
        }
    });

    // Optionally, open a default submenu (e.g., "affiliatePrograms" on /admin)
    const defaultSubmenuId = 'affiliatePrograms';
    if (window.location.pathname === '/admin' && document.getElementById(defaultSubmenuId)) {
        console.log(`initializeNavigation - Opening default submenu: ${defaultSubmenuId}`);
        toggleSubmenu(defaultSubmenuId);
    }

    // Handle section navigation for buttons with only data-section (no submenu)
    document.querySelectorAll('button[data-section]:not([data-submenu])').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const sectionId = button.getAttribute('data-section');
            console.log(`initializeNavigation - Section button clicked - Section ID: ${sectionId}`);
            showSection(sectionId);
        });
    });

    // Handle SPA navigation for buttons with data-href without changing the URL
    document.querySelectorAll('button[data-href]').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const href = button.getAttribute('data-href');
            console.log('initializeNavigation - SPA navigation button clicked - HREF:', href);

            // Load the content into the .content-wrapper without changing the URL
            await fetchProtectedPage(href, '.content-wrapper');

            // Update the branding based on the page type
            const pageType = href.split('/')[1] || 'admin';
            await loadBranding(pageType);
        });
    });

    console.log('initializeNavigation - Navigation setup completed');
}

// Initialize navigation based on document readiness
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded - Initializing navigation');
        initializeNavigation();
    });
} else {
    console.log('Document already loaded - Initializing navigation immediately');
    initializeNavigation();
}