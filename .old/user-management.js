// user-management.js
// Purpose: Manages user-specific settings, Wix client ID operations, and shared "Change Password" logic.

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
        console.log('loadSettings - Fetching settings via authenticatedFetch - URL:', `${window.apiUrl}/settings/user`);
        const startTime = Date.now();
        const response = await authenticatedFetch(`${window.apiUrl}/settings/user`);
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

        return data; // Return the settings data for use in site-navigation.js
    } catch (error) {
        console.error('loadSettings - Error loading settings - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error loading settings: ${error.message}`);
        throw error; // Re-throw the error to be handled by the caller (e.g., site-navigation.js)
    } finally {
        console.log('loadSettings - Settings load completed');
    }
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
        console.log('saveSettings - Sending settings via authenticatedFetch - URL:', `${window.apiUrl}/settings/user`);
        const startTime = Date.now();
        const response = await authenticatedFetch(`${window.apiUrl}/settings/user`, {
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
        console.log('loadWixClientId - Fetching Wix client ID via authenticatedFetch - URL:', `${window.apiUrl}/settings/wix-client-id`);
        const startTime = Date.now();
        const response = await authenticatedFetch(`${window.apiUrl}/settings/wix-client-id`);
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
            wixClientIdField.value = data.client_id || data.clientId || '';
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
        console.log('saveWixClientId - Sending Wix client ID via authenticatedFetch - URL:', `${window.apiUrl}/settings/wix-client-id`);
        const startTime = Date.now();
        const response = await authenticatedFetch(`${window.apiUrl}/settings/wix-client-id`, {
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

// Validates password complexity
function validatePassword(password) {
    console.log('validatePassword - Validating password');
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
        toastr.error('Password must be at least 8 characters long.');
        console.log('validatePassword - Failed: Length < 8');
        return false;
    }
    if (!hasUpperCase) {
        toastr.error('Password must contain at least one uppercase letter.');
        console.log('validatePassword - Failed: No uppercase');
        return false;
    }
    if (!hasLowerCase) {
        toastr.error('Password must contain at least one lowercase letter.');
        console.log('validatePassword - Failed: No lowercase');
        return false;
    }
    if (!hasNumber) {
        toastr.error('Password must contain at least one number.');
        console.log('validatePassword - Failed: No number');
        return false;
    }
    if (!hasSpecialChar) {
        toastr.error('Password must contain at least one special character.');
        console.log('validatePassword - Failed: No special character');
        return false;
    }
    console.log('validatePassword - Password valid');
    return true;
}

// Sets up the "Change Password" form submission logic
function setupChangePassword() {
    console.log('setupChangePassword - Setting up change password logic');
    const changePasswordButton = document.querySelector('button[data-action="savePassword"]');
    if (!changePasswordButton) {
        console.warn('setupChangePassword - Change password button not found');
        return;
    }

    changePasswordButton.addEventListener('click', async () => {
        console.log('setupChangePassword - Change password button clicked');
        const currentPasswordInput = document.getElementById('currentPassword');
        const newPasswordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        // Validate input elements exist
        if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput) {
            toastr.error('Password fields are missing on this page.');
            console.error('setupChangePassword - One or more password input elements not found');
            return;
        }

        const currentPassword = currentPasswordInput.value.trim();
        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        // Check for empty fields
        if (!currentPassword || !newPassword || !confirmPassword) {
            toastr.error('All password fields are required.');
            console.log('setupChangePassword - Empty password field detected');
            return;
        }

        // Check password match
        if (newPassword !== confirmPassword) {
            toastr.error('New password and confirmation do not match.');
            console.log('setupChangePassword - Passwords do not match');
            return;
        }

        // Validate password complexity
        if (!validatePassword(newPassword)) {
            console.log('setupChangePassword - Password complexity validation failed');
            return;
        }

        // Submit password change request
        try {
            console.log('setupChangePassword - Submitting password change request');
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await authenticatedFetch(`${window.apiUrl}/update-password`, {
                method: 'POST',
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to update password: ${response.status}`);
            }

            const data = await response.json();
            console.log('setupChangePassword - Password updated successfully:', data);
            toastr.success('Password updated successfully!');
            // Clear form fields after success
            currentPasswordInput.value = '';
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';
        } catch (error) {
            console.error('setupChangePassword - Error updating password:', error.message);
            toastr.error(error.message || 'An error occurred while updating the password.');
        }
    });
    console.log('setupChangePassword - Event listener attached');
}

// Export for use in other scripts
window.loadSettings = loadSettings;
window.saveSettings = saveSettings;
window.loadWixClientId = loadWixClientId;
window.saveWixClientId = saveWixClientId;
window.validatePassword = validatePassword;
window.setupChangePassword = setupChangePassword;