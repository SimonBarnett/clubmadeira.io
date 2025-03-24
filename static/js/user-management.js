// user-management.js
// Purpose: Manages user-specific settings and Wix client ID operations.

// Loads user settings into the DOM.
async function loadSettings() {
    console.log('loadSettings - Starting settings load');
    const userId = localStorage.getItem('userId');
    console.log('loadSettings - Retrieved userId:', userId);

    if (!userId) {
        console.error('loadSettings - User ID not found in session');
        toastr.error('User ID not found in session');
        return;
    }

    try {
        console.log('loadSettings - Fetching settings via authenticatedFetch - URL:', `${window.apiUrl}/${userId}/user`);
        const startTime = Date.now();
        const response = await authenticatedFetch(`${window.apiUrl}/${userId}/user`);
        const duration = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            console.error('loadSettings - Fetch failed - Status:', response.status, 'Error:', errorText);
            throw new Error(`Failed to fetch settings: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('loadSettings - Settings fetched - Data:', JSON.stringify(data), 'Duration:', `${duration}ms`);

        // Update DOM with settings
        const referrerId = document.getElementById('referrerId');
        const contactName = document.getElementById('contactName');
        const websiteUrl = document.getElementById('websiteUrl');
        const emailAddress = document.getElementById('emailAddress');
        const phoneNumber = document.getElementById('phoneNumber');

        if (referrerId) referrerId.textContent = userId;
        if (contactName) contactName.value = data.contact_name || '';
        if (websiteUrl) websiteUrl.value = data.website_url || '';
        if (emailAddress) emailAddress.value = data.email_address || '';
        if (phoneNumber) phoneNumber.value = data.phone_number || '';

        console.log('loadSettings - DOM updated - Fields:', {
            referrerId: userId,
            contactName: data.contact_name || '',
            websiteUrl: data.website_url || '',
            emailAddress: data.email_address || '',
            phoneNumber: data.phone_number || ''
        });
    } catch (error) {
        console.error('loadSettings - Error loading settings - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error loading settings: ${error.message}`);
    }
    console.log('loadSettings - Settings load completed');
}

// Saves user settings from the DOM.
async function saveSettings(settings) {
    console.log('saveSettings - Starting settings save - Settings:', JSON.stringify(settings));
    const userId = localStorage.getItem('userId');
    console.log('saveSettings - Retrieved userId:', userId);

    if (!userId) {
        console.error('saveSettings - User ID not found in session');
        toastr.error('User ID not found in session');
        return;
    }

    try {
        console.log('saveSettings - Sending settings via authenticatedFetch - URL:', `${window.apiUrl}/${userId}/user`);
        const startTime = Date.now();
        const response = await authenticatedFetch(`${window.apiUrl}/${userId}/user`, {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
        const duration = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            console.error('saveSettings - Fetch failed - Status:', response.status, 'Error:', errorText);
            throw new Error(`Failed to save settings: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('saveSettings - Save response received - Result:', JSON.stringify(result), 'Duration:', `${duration}ms`);
        toastr.success('Settings saved successfully');
    } catch (error) {
        console.error('saveSettings - Error saving settings - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Failed to save settings: ${error.message}`);
    }
    console.log('saveSettings - Save process completed');
}

// Loads Wix client ID into the DOM.
async function loadWixClientId() {
    console.log('loadWixClientId - Starting Wix client ID load');
    const userId = localStorage.getItem('userId');
    console.log('loadWixClientId - Retrieved userId:', userId);

    if (!userId) {
        console.error('loadWixClientId - User ID not found in session');
        toastr.error('User ID not found in session');
        return;
    }

    try {
        console.log('loadWixClientId - Fetching Wix client ID via authenticatedFetch - URL:', `${window.apiUrl}/${userId}/wix-client-id`);
        const startTime = Date.now();
        const response = await authenticatedFetch(`${window.apiUrl}/${userId}/wix-client-id`);
        const duration = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            console.error('loadWixClientId - Fetch failed - Status:', response.status, 'Error:', errorText);
            throw new Error(`Failed to fetch Wix client ID: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('loadWixClientId - Wix client ID fetched - Data:', JSON.stringify(data), 'Duration:', `${duration}ms`);

        // Update DOM with Wix client ID
        const wixClientIdField = document.getElementById('wixClientId');
        if (wixClientIdField) {
            wixClientIdField.value = data.client_id || data.clientId || ''; // Flexible key name
            console.log('loadWixClientId - DOM updated - wixClientId:', data.client_id || data.clientId || '');
        } else {
            console.warn('loadWixClientId - Wix client ID field not found - ID: wixClientId');
        }
    } catch (error) {
        console.error('loadWixClientId - Error loading Wix client ID - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error loading Wix client ID: ${error.message}`);
    }
    console.log('loadWixClientId - Wix client ID load completed');
}

// Saves Wix client ID from the DOM.
async function saveWixClientId(clientId) {
    console.log('saveWixClientId - Starting Wix client ID save - Client ID:', clientId);
    const userId = localStorage.getItem('userId');
    console.log('saveWixClientId - Retrieved userId:', userId);

    if (!userId) {
        console.error('saveWixClientId - User ID not found in session');
        toastr.error('User ID not found in session');
        return;
    }

    try {
        console.log('saveWixClientId - Sending Wix client ID via authenticatedFetch - URL:', `${window.apiUrl}/${userId}/wix-client-id`);
        const startTime = Date.now();
        const response = await authenticatedFetch(`${window.apiUrl}/${userId}/wix-client-id`, {
            method: 'POST',
            body: JSON.stringify({ clientId })
        });
        const duration = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            console.error('saveWixClientId - Fetch failed - Status:', response.status, 'Error:', errorText);
            throw new Error(`Failed to save Wix client ID: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('saveWixClientId - Save response received - Result:', JSON.stringify(result), 'Duration:', `${duration}ms`);
        toastr.success('Wix client ID saved successfully');
    } catch (error) {
        console.error('saveWixClientId - Error saving Wix client ID - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Failed to save Wix client ID: ${error.message}`);
    }
    console.log('saveWixClientId - Save process completed');
}