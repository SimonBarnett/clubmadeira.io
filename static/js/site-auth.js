// site-auth.js
// Purpose: Manages authentication-related functionality, including password visibility toggling, 
// user logout, JWT token decoding, authenticated fetching, and password saving.

// Guard against multiple inclusions
if (!window.siteAuthInitialized) {
    window.siteAuthInitialized = true;

    // Configuration for logging (toggle based on environment, e.g., set to false in production)
    const ENABLE_LOGGING = true;

    // Helper function for consistent logging
    function log(message, ...args) {
        if (ENABLE_LOGGING) {
            console.log(message, ...args);
        }
    }

    // Helper function for consistent error logging
    function error(message, ...args) {
        if (ENABLE_LOGGING) {
            console.error(message, ...args);
        }
    }

    // Toggles the visibility of a password input field, updating associated icon.
    function togglePassword(fieldId) {
        log('togglePassword - Initiating visibility toggle - Field ID:', fieldId);
        const input = document.getElementById(fieldId);
        const icon = input ? input.nextElementSibling : null;
        log('togglePassword - Input element retrieved:', input, 'Icon element:', icon);

        if (!input) {
            error('togglePassword - Password input not found - Field ID:', fieldId);
            return;
        }
        if (!icon) {
            error('togglePassword - Icon element not found for input - Field ID:', fieldId);
            return;
        }

        const isPassword = input.type === 'password';
        log('togglePassword - Current input type:', input.type);
        if (isPassword) {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
            log('togglePassword - Changed to text visibility - Field ID:', fieldId);
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
            log('togglePassword - Changed to password visibility - Field ID:', fieldId);
        }
        log('togglePassword - Toggle completed - New type:', input.type);
    }

    // Logs the user out, clearing session data and redirecting to home.
    function logOff() {
        log('logOff - Initiating logout process');
        const confirmed = confirm('Are you sure you want to log off?');
        log('logOff - User confirmation received:', confirmed);

        if (confirmed) {
            log('logOff - User confirmed logout - Clearing session data');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            log('logOff - Auth token and userId removed from localStorage - Current localStorage:', JSON.stringify(localStorage));
            toastr.success('Logged off successfully');
            log('logOff - Success toast displayed');

            setTimeout(() => {
                log('logOff - Redirecting to / after 1-second delay');
                window.location.href = '/';
                log('logOff - Redirect executed');
            }, 1000);
        } else {
            log('logOff - Logout cancelled by user');
        }
        log('logOff - Logout process completed');
    }

    // Decodes a JWT token to extract user data, such as permissions.
    function decodeJWT(token) {
        log('decodeJWT - Starting JWT decoding - Input token:', token);
        if (!token || typeof token !== 'string') {
            error('decodeJWT - Invalid token: null or not a string - Token:', token);
            return null;
        }
        if (!token.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)) {
            error('decodeJWT - Token does not match JWT format - Token:', token);
            return null;
        }
        log('decodeJWT - Token format validated - Proceeding with decode');

        const parts = token.split('.');
        log('decodeJWT - Token split into parts:', parts);

        try {
            const base64Url = parts[1];
            log('decodeJWT - Extracted base64Url from token:', base64Url);
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            log('decodeJWT - Converted to base64:', base64);
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            log('decodeJWT - Decoded JSON payload:', jsonPayload);
            const decoded = JSON.parse(jsonPayload);
            log('decodeJWT - Parsed JWT payload:', JSON.stringify(decoded));
            return decoded;
        } catch (err) {
            error('decodeJWT - Error decoding JWT - Error:', err.message, 'Stack:', err.stack, 'Token:', token);
            return null;
        }
    }

    // Authenticated fetch function to handle API requests with auth token
    async function authenticatedFetch(url, options = {}) {
        log('authenticatedFetch - Initiating fetch - URL:', url);
        const token = localStorage.getItem('authToken');
        if (!token) {
            error('authenticatedFetch - No authentication token found - Redirecting to /');
            window.location.href = '/';
            return null;
        }

        const headers = new Headers(options.headers || {});
        headers.set('Authorization', `Bearer ${token}`);
        headers.set('Content-Type', 'application/json');

        const fetchOptions = {
            ...options,
            headers: headers
        };

        try {
            const response = await fetch(url, fetchOptions);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Request failed with status ${response.status}`);
            }
            log('authenticatedFetch - Response received - Status:', response.status);
            return response;
        } catch (err) {
            error('authenticatedFetch - Error:', err.message);
            throw err;
        }
    }

    // Saves an updated user password via an authenticated request.
    async function savePassword(newPassword) {
        log('savePassword - Starting password save - New password length:', newPassword ? newPassword.length : 'None');
        if (!newPassword || typeof newPassword !== 'string') {
            error('savePassword - Invalid password provided - Password:', newPassword);
            toastr.error('Invalid password provided');
            return;
        }

        try {
            log('savePassword - Sending password update via authenticatedFetch');
            const startTime = Date.now();
            const response = await authenticatedFetch('/update-password', { 
                method: 'POST',
                body: JSON.stringify({ password: newPassword })
            });
            const duration = Date.now() - startTime;

            if (!response) {
                error('savePassword - No response from fetch');
                toastr.error('Failed to save password: No server response');
                return;
            }

            log('savePassword - Response received - Status:', response.status, 'Duration:', `${duration}ms`);
            const result = await response.json();
            log('savePassword - Save response data:', JSON.stringify(result));

            if (result.status === 'success') {
                log('savePassword - Password saved successfully');
                toastr.success('Password updated successfully');
            } else {
                error('savePassword - Server reported failure - Message:', result.message);
                toastr.error(result.message || 'Failed to save password');
            }
        } catch (err) {
            error('savePassword - Error saving password - Error:', err.message, 'Stack:', err.stack);
            toastr.error('Failed to save password: ' + err.message);
        }
        log('savePassword - Password save process completed');
    }

    // Expose functions to window for global access
    window.togglePassword = togglePassword;
    window.logOff = logOff;
    window.decodeJWT = decodeJWT;
    window.authenticatedFetch = authenticatedFetch;
    window.savePassword = savePassword;

    // Signal that site-auth.js has finished loading
    window.dispatchEvent(new Event('siteAuthReady'));
}