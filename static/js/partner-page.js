// partner-page.js
// Purpose: Manages page-specific functionality for the /partner page.

// Initializes the partner page with permission checks.
function initializePartner() {
    console.log('initializePartner - Initializing partner page');
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    if (!token) {
        console.error('initializePartner - No token found, redirecting to /');
        window.location.href = '/';
        return;
    }
    const decoded = decodeJWT(token);
    if (!decoded) {
        console.error('initializePartner - Invalid token, redirecting to /');
        window.location.href = '/';
        return;
    }
    window.userPermissions = decoded.permissions || [];
    if (!window.userPermissions.includes('wixpro') && !window.userPermissions.includes('admin')) {
        toastr.error('Permission denied: WixPro or Admin permission required');
        console.error('initializePartner - No wixpro/admin permission, redirecting to /');
        window.location.href = '/';
        return;
    }
    const userIdInput = document.getElementById('userId');
    if (userIdInput && userId) {
        userIdInput.value = userId;
    } else if (!userId) {
        console.warn('initializePartner - No userId found in localStorage');
    } else {
        console.warn('initializePartner - userId input element not found');
    }

    // Set up navigation and load initial content
    setupNavigation(); // From site-navigation.js
    checkAdminPermission();
    loadBranding('partner', 'brandingContent'); // Adjusted to match typical usage
    showSection('welcome'); // Ensure the welcome section is shown on load
    loadPartnerIntegrations(); // Load partner-specific integrations

    // Fetch and display contact_name in the welcome section
    if (typeof loadSettings === 'function') {
        loadSettings().then(settings => {
            const contactName = settings.contact_name || 'User';
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                const userContactNameSpan = document.getElementById('user-contact-name');
                if (userContactNameSpan) {
                    userContactNameSpan.textContent = contactName;
                    console.log('initializePartner - Updated contact name in welcome section:', contactName);
                } else {
                    console.warn('initializePartner - user-contact-name span not found in welcome-message');
                }
            } else {
                console.warn('initializePartner - welcome-message element not found');
            }
        }).catch(error => {
            console.error('initializePartner - Error loading settings for contact name:', error.message);
            toastr.error('Error loading user settings');
        });
    } else {
        console.error('initializePartner - loadSettings function not found');
    }

    attachEventListeners(); // From page-load.js

    // Call shared "Change Password" logic
    if (typeof setupChangePassword === 'function') {
        setupChangePassword(); // From user-management.js
        console.log('initializePartner - Change Password logic initialized');
    } else {
        console.error('initializePartner - setupChangePassword function not found');
    }

    // Hide loading overlay after initialization
    hideLoadingOverlay(); // From page-load.js
    console.log('initializePartner - Partner page initialized successfully');
}

// Checks and toggles visibility of admin-specific elements.
function checkAdminPermission() {
    console.log('checkAdminPermission - Checking admin permission');
    const backButton = document.querySelector('button[data-href="/admin"]');
    if (backButton) {
        backButton.style.display = window.userPermissions.includes('admin') ? 'block' : 'none';
        console.log('checkAdminPermission - Back button visibility:', backButton.style.display);
    } else {
        console.warn('checkAdminPermission - Back button not found');
    }
}

// Loads and displays partner-specific integrations or tests.
async function loadPartnerIntegrations() {
    console.log('loadPartnerIntegrations - Loading partner integrations');
    const userId = document.getElementById('userId') ? document.getElementById('userId').value : '';
    if (!userId) {
        console.error('loadPartnerIntegrations - User ID not found in session');
        toastr.error('User ID not found in session');
        return;
    }
    try {
        console.log('loadPartnerIntegrations - Fetching integrations - URL:', `${window.apiUrl}/${userId}/integrations`);
        const response = await authenticatedFetch(`${window.apiUrl}/${userId}/integrations`);
        if (!response.ok) throw new Error(`Failed to fetch integrations: ${response.status}`);
        const data = await response.json();
        console.log('loadPartnerIntegrations - Integrations fetched - Data:', JSON.stringify(data));

        const integrationList = document.getElementById('integrationList');
        if (integrationList) {
            integrationList.innerHTML = '';
            data.integrations.forEach(integration => {
                const li = document.createElement('li');
                li.textContent = `${integration.name} - Status: ${integration.status}`;
                integrationList.appendChild(li);
            });
            console.log('loadPartnerIntegrations - Integration list updated - Count:', data.integrations.length);
        } else {
            console.warn('loadPartnerIntegrations - Integration list element not found');
        }
    } catch (error) {
        console.error('loadPartnerIntegrations - Error loading integrations - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error loading integrations: ${error.message}`);
    }
}

// Export for use in other scripts
window.initializePartner = initializePartner;
window.checkAdminPermission = checkAdminPermission;
window.loadPartnerIntegrations = loadPartnerIntegrations;