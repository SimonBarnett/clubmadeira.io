// partner-page.js
try {
    window.initializePartner = function() {
        console.log('initializePartner - Initializing partner page');
        window.siteNavigation.initializePage('Partner', ['partner', 'admin'], [
            () => {
                const userId = localStorage.getItem('userId');
                const userIdInput = document.getElementById('userId');
                if (userIdInput && userId) {
                    userIdInput.value = userId;
                } else if (!userId) {
                    console.warn('initializePartner - No userId found in localStorage');
                } else {
                    console.warn('initializePartner - userId input element not found');
                }
                // Align with page-load.js initialSection: 'clients'
                window.siteNavigation.showSection('clients');
            },
            checkAdminPermission,
            loadPartnerIntegrations
        ]);
    };

    function checkAdminPermission() {
        console.log('checkAdminPermission - Checking admin permission');
        const backButton = document.querySelector('button[data-role="admin"]');
        if (backButton) {
            backButton.style.display = window.userPermissions.includes('admin') ? 'block' : 'none';
            console.log('checkAdminPermission - Back button visibility set to:', backButton.style.display);
        } else {
            console.warn('checkAdminPermission - Back button not found');
        }
    }

    async function loadPartnerIntegrations() {
        console.log('loadPartnerIntegrations - Loading partner integrations');
        const userId = document.getElementById('userId') ? document.getElementById('userId').value : '';
        if (!userId) {
            console.error('loadPartnerIntegrations - User ID not found in session');
            toastr.error('User ID not found in session');
            return;
        }
        try {
            console.log('loadPartnerIntegrations - Fetching integrations - URL:', `${window.apiUrl}/settings/client_api`);
            const response = await window.authenticatedFetch(`${window.apiUrl}/settings/client_api`);
            if (!response.ok) throw new Error(`Failed to fetch integrations: ${response.status}`);
            const data = await response.json();
            console.log('loadPartnerIntegrations - Integrations fetched - Data:', JSON.stringify(data));

            const integrationList = document.getElementById('integrationList');
            if (integrationList) {
                integrationList.innerHTML = '';
                const integrations = data.settings.map(setting => ({
                    name: setting.key_type,
                    status: setting.fields.enabled ? 'Active' : 'Inactive'
                }));
                integrations.forEach(integration => {
                    const li = document.createElement('li');
                    li.textContent = `${integration.name} - Status: ${integration.status}`;
                    integrationList.appendChild(li);
                });
                console.log('loadPartnerIntegrations - Integration list updated - Count:', integrations.length);
            } else {
                console.warn('loadPartnerIntegrations - Integration list element not found');
            }
        } catch (error) {
            console.error('loadPartnerIntegrations - Error loading integrations - Error:', error.message, 'Stack:', error.stack);
            toastr.error(`Error loading integrations: ${error.message}`);
        }
    }

    window.initializePartner = window.initializePartner;
    window.checkAdminPermission = checkAdminPermission;
    window.loadPartnerIntegrations = loadPartnerIntegrations;

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        window.initializePartner();
    } else {
        document.addEventListener('DOMContentLoaded', window.initializePartner);
    }
} catch (error) {
    console.error('Error in partner-page.js:', error.message, error.stack);
    window.initializePartner = function() {
        console.error('initializePartner - Failed to initialize due to an error:', error.message);
    };
}