// site-auth.js
// Purpose: Manages authentication-related functionality, including password visibility toggling, 
// user logout, JWT token decoding, and password saving for user management.

// Toggles the visibility of a password input field, updating associated icon.
function togglePassword(fieldId) {
    console.log('togglePassword - Initiating visibility toggle - Field ID:', fieldId);
    const input = document.getElementById(fieldId);
    const icon = input ? input.nextElementSibling : null;
    console.log('togglePassword - Input element retrieved:', input, 'Icon element:', icon);

    if (!input) {
        console.error('togglePassword - Password input not found - Field ID:', fieldId);
        return;
    }
    if (!icon) {
        console.error('togglePassword - Icon element not found for input - Field ID:', fieldId);
        return;
    }

    const isPassword = input.type === 'password';
    console.log('togglePassword - Current input type:', input.type);
    if (isPassword) {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        console.log('togglePassword - Changed to text visibility - Field ID:', fieldId);
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        console.log('togglePassword - Changed to password visibility - Field ID:', fieldId);
    }
    console.log('togglePassword - Toggle completed - New type:', input.type);
}

// Logs the user out, clearing session data and redirecting to home.
function logOff() {
    console.log('logOff - Initiating logout process');
    const confirmed = confirm('Are you sure you want to log off?');
    console.log('logOff - User confirmation received:', confirmed);

    if (confirmed) {
        console.log('logOff - User confirmed logout - Clearing session data');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        console.log('logOff - Auth token and userId removed from localStorage - Current localStorage:', JSON.stringify(localStorage));
        toastr.success('Logged off successfully');
        console.log('logOff - Success toast displayed');

        setTimeout(() => {
            console.log('logOff - Redirecting to / after 1-second delay');
            window.location.href = '/';
            console.log('logOff - Redirect executed');
        }, 1000);
    } else {
        console.log('logOff - Logout cancelled by user');
    }
    console.log('logOff - Logout process completed');
}

// Decodes a JWT token to extract user data, such as permissions.
function decodeJWT(token) {
    console.log('decodeJWT - Starting JWT decoding - Input token:', token);
    if (!token || typeof token !== 'string') {
        console.warn('decodeJWT - Invalid token: null or not a string - Token:', token);
        return null;
    }
    if (!token.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)) {
        console.warn('decodeJWT - Token does not match JWT format - Token:', token);
        return null;
    }
    console.log('decodeJWT - Token format validated - Proceeding with decode');

    const parts = token.split('.');
    console.log('decodeJWT - Token split into parts:', parts);

    try {
        const base64Url = parts[1];
        console.log('decodeJWT - Extracted base64Url from token:', base64Url);
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        console.log('decodeJWT - Converted to base64:', base64);
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        console.log('decodeJWT - Decoded JSON payload:', jsonPayload);
        const decoded = JSON.parse(jsonPayload);
        console.log('decodeJWT - Parsed JWT payload:', JSON.stringify(decoded));
        return decoded;
    } catch (error) {
        console.error('decodeJWT - Error decoding JWT - Error:', error.message, 'Stack:', error.stack, 'Token:', token);
        return null;
    }
}

// Saves an updated user password via an authenticated request.
async function savePassword(newPassword) {
    console.log('savePassword - Starting password save - New password length:', newPassword ? newPassword.length : 'None');
    if (!newPassword || typeof newPassword !== 'string') {
        console.error('savePassword - Invalid password provided - Password:', newPassword);
        toastr.error('Invalid password provided');
        return;
    }

    try {
        console.log('savePassword - Sending password update via authenticatedFetch');
        const startTime = Date.now();
        const response = await authenticatedFetch('/update-password', { // Assumes endpoint exists
            method: 'POST',
            body: JSON.stringify({ password: newPassword })
        });
        const duration = Date.now() - startTime;

        if (!response) {
            console.error('savePassword - No response from fetch');
            toastr.error('Failed to save password: No server response');
            return;
        }

        console.log('savePassword - Response received - Status:', response.status, 'Duration:', `${duration}ms`);
        const result = await response.json();
        console.log('savePassword - Save response data:', JSON.stringify(result));

        if (result.status === 'success') {
            console.log('savePassword - Password saved successfully');
            toastr.success('Password updated successfully');
        } else {
            console.error('savePassword - Server reported failure - Message:', result.message);
            toastr.error(result.message || 'Failed to save password');
        }
    } catch (error) {
        console.error('savePassword - Error saving password - Error:', error.message, 'Stack:', error.stack);
        toastr.error('Failed to save password: ' + error.message);
    }
    console.log('savePassword - Password save process completed');
}