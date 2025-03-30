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
                if (sectionId === 'my-products') {
                    try {
                        const response = await window.authenticatedFetch(`${window.apiUrl}/settings/products`);
                        if (!response.ok) {
                            throw new Error(`Server responded with status: ${response.status}`);
                        }
                        const data = await response.json();
                        console.log('loadSection - Products fetched:', JSON.stringify(data));
            
                        // Check if data.products exists and is an array
                        if (data.products && Array.isArray(data.products)) {
                            const tbody = document.getElementById('productList');
                            if (!tbody) {
                                console.error('Table body with id "productList" not found');
                                toastr.error('Error: Product table not found in the page');
                                return;
                            }
            
                            // Clear existing rows
                            tbody.innerHTML = '';
            
                            // Iterate over the products array
                            data.products.forEach(product => {
                                const tr = document.createElement('tr');
            
                                // Product ID (hidden)
                                const idTd = document.createElement('td');
                                idTd.className = 'hidden';
                                idTd.textContent = product.id || 'N/A';
                                tr.appendChild(idTd);
            
                                // Category
                                const categoryTd = document.createElement('td');
                                categoryTd.textContent = product.category || 'N/A';
                                tr.appendChild(categoryTd);
            
                                // Title
                                const titleTd = document.createElement('td');
                                titleTd.textContent = product.title || 'N/A';
                                tr.appendChild(titleTd);
            
                                // Product URL
                                const urlTd = document.createElement('td');
                                const urlLink = document.createElement('a');
                                urlLink.href = product.product_url || '#';
                                urlLink.textContent = product.product_url ? 'Link' : 'N/A';
                                urlLink.target = '_blank';
                                urlTd.appendChild(urlLink);
                                tr.appendChild(urlTd);
            
                                // Current Price
                                const priceTd = document.createElement('td');
                                priceTd.textContent = product.current_price !== undefined ? product.current_price : 'N/A';
                                tr.appendChild(priceTd);
            
                                // Original Price
                                const originalPriceTd = document.createElement('td');
                                originalPriceTd.textContent = product.original_price !== undefined ? product.original_price : 'N/A';
                                tr.appendChild(originalPriceTd);
            
                                // Image
                                const imageTd = document.createElement('td');
                                const img = document.createElement('img');
                                img.src = product.image_url || '';
                                img.width = 50;
                                img.onerror = function() { this.src = 'https://via.placeholder.com/50'; }; // Fallback image
                                imageTd.appendChild(img);
                                tr.appendChild(imageTd);
            
                                // Quantity
                                const qtyTd = document.createElement('td');
                                qtyTd.textContent = product.qty !== undefined ? product.qty : 'N/A';
                                tr.appendChild(qtyTd);
            
                                // Add row to table
                                tbody.appendChild(tr);
                            });
                        } else {
                            console.error('Expected an array of products but got:', data.products);
                            toastr.error('Error loading products: Invalid data format from server');
                        }
                    } catch (error) {
                        console.error('loadSection - Error fetching products:', error.message);
                        toastr.error(`Error loading products: ${error.message}`);
                    }
                }
                // Additional logic for other sectionIds can go here
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
                const logOffBtn = document.getElementById('logOffBtn');
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
                });
            } else {
                console.log('Document already loaded - Initializing navigation immediately');
                initializeNavigation();
            }
        })
        .catch(error => {
            console.error('Failed to initialize navigation due to:', error);
            toastr.error('Navigation initialization failed. Please refresh the page.');
        });
}