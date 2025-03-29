function initializeAdmin(pageType) {
    console.log('initializeAdmin - Initializing admin page with type: ' + pageType);
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('initializeAdmin - No token found, redirecting to /');
        window.location.href = '/';
        return;
    }
    const decoded = decodeJWT(token); // Add permission check for robustness
    if (!decoded || !decoded.permissions || !decoded.permissions.includes('admin')) {
        console.error('initializeAdmin - Invalid token or no admin permission, redirecting to /');
        toastr.error('Permission denied: Admin access required');
        window.location.href = '/';
        return;
    }

    // Load initial content
    loadBranding(pageType, 'brandingContent');
    setupNavigation();
    window.siteNavigation.showSection('welcome');

    // Fetch and display contact_name in the welcome section
    if (typeof loadSettings === 'function') {
        loadSettings().then(settings => {
            const contactName = settings.contact_name || 'User';
            const userContactNameSpan = document.getElementById('user-contact-name');
            if (userContactNameSpan) {
                userContactNameSpan.textContent = contactName;
                console.log('initializeAdmin - Updated contact name in welcome section:', contactName);
            } else {
                console.warn('initializeAdmin - user-contact-name span not found');
            }
        }).catch(error => {
            console.error('initializeAdmin - Error loading settings:', error.message);
            toastr.error('Failed to load user settings');
        });
    } else {
        console.error('initializeAdmin - loadSettings function not found');
    }

    loadInitialData();
    setupEventListeners();

    // Call shared "Change Password" logic
    if (typeof setupChangePassword === 'function') {
        setupChangePassword();
        console.log('initializeAdmin - Change Password logic initialized');
    } else {
        console.error('initializeAdmin - setupChangePassword function not found');
    }

    // Ensure loading overlay is hidden
    hideLoadingOverlay();
    console.log('Admin page initialized');
}

function setupNavigation() {
    console.log('setupNavigation - Setting up navigation');
    // Delegate to site-navigation.js's initializeNavigation
    if (typeof window.siteNavigation?.initializeNavigation === 'function') {
        window.siteNavigation.initializeNavigation();
    } else {
        console.warn('setupNavigation - window.siteNavigation.initializeNavigation not found, using fallback');
        // Fallback logic
        document.querySelectorAll('.menu button[data-section]').forEach(button => {
            button.addEventListener('click', function() {
                const sectionId = this.getAttribute('data-section');
                const submenuId = this.getAttribute('data-submenu');
                if (submenuId) {
                    const submenu = document.getElementById(submenuId);
                    const caret = this.querySelector('.caret');
                    if (submenu && caret) {
                        if (submenu.style.display === 'block') {
                            submenu.style.display = 'none';
                            caret.classList.remove('fa-caret-down');
                            caret.classList.add('fa-caret-right');
                        } else {
                            submenu.style.display = 'block';
                            caret.classList.remove('fa-caret-right');
                            caret.classList.add('fa-caret-down');
                        }
                    }
                }
            });
        });
    }
}

function loadInitialData() {
    console.log('loadInitialData - Loading initial data');
    authenticatedFetch(`${window.apiUrl}/deals`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch deals');
            return response.json();
        })
        .then(data => {
            console.log('loadInitialData - Deals fetched:', data);
            // Placeholder for deal list population
        })
        .catch(error => {
            console.error('loadInitialData - Error:', error);
            toastr.error('Failed to load deal listings');
        });
}

function setupEventListeners() {
    const saveSettingsButton = document.querySelector('button[data-action="saveSettings"]');
    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', function() {
            const userId = document.getElementById('userId')?.value || '';
            const contactName = document.getElementById('contactName')?.value || '';
            const websiteUrl = document.getElementById('websiteUrl')?.value || '';
            const emailAddress = document.getElementById('emailAddress')?.value || '';

            console.log('setupEventListeners - Saving settings for user:', userId);
            authenticatedFetch(`${window.apiUrl}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, contactName, websiteUrl, emailAddress })
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to save settings');
                return response.json();
            })
            .then(data => {
                console.log('setupEventListeners - Settings saved:', data);
                toastr.success('Settings updated successfully');
            })
            .catch(error => {
                console.error('setupEventListeners - Error saving settings:', error);
                toastr.error('Failed to save settings');
            });
        });
    } else {
        console.warn('setupEventListeners - Save settings button not found');
    }
}

// Export for use in other scripts
window.initializeAdmin = initializeAdmin;
window.loadInitialData = loadInitialData;
window.setupEventListeners = setupEventListeners;