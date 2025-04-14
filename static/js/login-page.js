// login-page.js
console.log('login-page.js - Script loaded - Version: v11 - Timestamp:', new Date().toISOString());

// Utility functions (unchanged)
function showLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        console.log('showLoadingOverlay - Overlay shown');
    } else {
        console.warn('showLoadingOverlay - Overlay element not found');
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        console.log('hideLoadingOverlay - Overlay hidden');
    } else {
        console.warn('hideLoadingOverlay - Overlay element not found');
    }
}

function showLogin() {
    const loginContainer = document.getElementById('loginContainer');
    const forgotContainer = document.getElementById('forgotPasswordContainer');
    const verifyContainer = document.getElementById('verifyOtpContainer');
    const layoutWrapper = document.querySelector('.layout-wrapper');
    const infoSection = document.getElementById('info');
    const loginPage = document.querySelector('.login-page');
    const content = document.querySelector('.content');
    
    if (loginContainer && forgotContainer && verifyContainer && layoutWrapper && infoSection && loginPage && content) {
        content.insertBefore(infoSection, loginPage);
        loginContainer.classList.remove('hidden');
        forgotContainer.classList.add('hidden');
        verifyContainer.classList.add('hidden');
        layoutWrapper.style.display = 'block';
        infoSection.style.display = 'block';
        infoSection.classList.remove('hidden');
        console.log('showLogin - Login container shown, others hidden, layout wrapper and info section visible');
    } else {
        console.error('showLogin - One or more elements not found:', {
            loginContainer: !!loginContainer,
            forgotContainer: !!forgotContainer,
            verifyContainer: !!verifyContainer,
            layoutWrapper: !!layoutWrapper,
            infoSection: !!infoSection,
            loginPage: !!loginPage,
            content: !!content
        });
    }
    hideLoadingOverlay();
}

function showForgotPassword() {
    const loginContainer = document.getElementById('loginContainer');
    const forgotContainer = document.getElementById('forgotPasswordContainer');
    const verifyContainer = document.getElementById('verifyOtpContainer');
    const layoutWrapper = document.querySelector('.layout-wrapper');
    const infoSection = document.getElementById('info');
    const loginPage = document.querySelector('.login-page');
    const content = document.querySelector('.content');
    
    if (loginContainer && forgotContainer && verifyContainer && layoutWrapper && infoSection && loginPage && content) {
        content.insertBefore(infoSection, loginPage);
        loginContainer.classList.add('hidden');
        forgotContainer.classList.remove('hidden');
        verifyContainer.classList.add('hidden');
        layoutWrapper.style.display = 'block';
        infoSection.style.display = 'block';
        infoSection.classList.remove('hidden');
        console.log('showForgotPassword - Forgot Password container shown');
    } else {
        console.error('showForgotPassword - One or more containers not found');
    }
    hideLoadingOverlay();
}

function showVerifyOtp(email) {
    const loginContainer = document.getElementById('loginContainer');
    const forgotContainer = document.getElementById('forgotPasswordContainer');
    const verifyContainer = document.getElementById('verifyOtpContainer');
    const layoutWrapper = document.querySelector('.layout-wrapper');
    const infoSection = document.getElementById('info');
    const loginPage = document.querySelector('.login-page');
    const content = document.querySelector('.content');
    
    if (loginContainer && forgotContainer && verifyContainer && layoutWrapper && infoSection && loginPage && content) {
        content.insertBefore(infoSection, loginPage);
        loginContainer.classList.add('hidden');
        forgotContainer.classList.add('hidden');
        verifyContainer.classList.remove('hidden');
        layoutWrapper.style.display = 'block';
        infoSection.style.display = 'block';
        infoSection.classList.remove('hidden');
        const verifyEmailInput = document.getElementById('verifyEmail');
        if (verifyEmailInput) {
            verifyEmailInput.value = email || '';
            console.log('showVerifyOtp - Verify OTP container shown, email set to:', email);
        } else {
            console.error('showVerifyOtp - verifyEmail input not found');
        }
    } else {
        console.error('showVerifyOtp - One or more containers not found');
    }
    hideLoadingOverlay();
}

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax; Secure";
    console.log('setCookie - Set cookie:', name, 'Value:', value);
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; SameSite=Lax; Secure';
    console.log('deleteCookie - Deleted cookie:', name);
}

window.showLoadingOverlay = showLoadingOverlay;
window.hideLoadingOverlay = hideLoadingOverlay;
window.showLogin = showLogin;
window.showForgotPassword = showForgotPassword;
window.showVerifyOtp = showVerifyOtp;

const initializeLoginPage = () => {
    console.log('login-page.js - Initializing login page');
    try {
        if (!window.apiUrl) {
            console.error('login-page.js - window.apiUrl is not defined.');
            showLogin();
            return;
        }

        if (!window.app || !window.app.authenticatedFetch || !window.app.notificationsError || !window.app.notificationsSuccess) {
            console.error('login-page.js - Required functions not found on window.app:', {
                authenticatedFetch: window.app && !!window.app.authenticatedFetch,
                notificationsError: window.app && !!window.app.notificationsError,
                notificationsSuccess: window.app && !!window.app.notificationsSuccess
            });
            window.toastr?.error?.('Failed to load required scripts. Please refresh the page.') || alert('Failed to load required scripts. Please refresh.');
            showLogin();
            return;
        }


        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                console.log('Login form submitted');
                const email = document.getElementById('loginEmail').value.trim();
                const password = document.getElementById('loginPassword').value;

                if (!email || !password) {
                    window.app.notificationsError('Please enter both email and password.');
                    return;
                }

                window.showLoadingOverlay();
                try {
                    const response = await window.app.authenticatedFetch('/', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json', 
                            'Accept': 'application/json' 
                        },
                        body: JSON.stringify({ email, password }),
                        credentials: 'include'
                    });
                    if (!response) {
                        throw new Error('No response from server');
                    }
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Login failed');
                    }

                    const data = await response.json();
                    if (data.status !== 'success') throw new Error(data.message || 'Login failed');

                    localStorage.setItem('authToken', data.token);
                    if (data.user_id) localStorage.setItem('userId', data.user_id);
                    setCookie('authToken', data.token, 7);
                    console.log('Login success - Token:', data.token, 'Role:', data['x-role']);
                    // Reload to let server render based on x-role
                    window.location.reload();
                } catch (error) {
                    console.error('Login error:', error.message);
                    window.app.notificationsError(error.message || 'Unable to connect to server.');
                    window.hideLoadingOverlay();
                }
            });
        } else {
            console.error('loginForm not found');
        }

        // Forgot Password form submission
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const email = document.getElementById('forgotEmail').value.trim();

                window.showLoadingOverlay();
                try {
                    const response = await window.app.authenticatedFetch(`${window.apiUrl}/reset-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });
                    if (!response) {
                        throw new Error('No response from server');
                    }
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || 'Reset request failed');

                    window.app.notificationsSuccess('A one-time password has been sent to your phone.');
                    window.showVerifyOtp(email);
                } catch (error) {
                    window.app.notificationsError(error.message || 'Error sending OTP');
                    window.hideLoadingOverlay();
                }
            });
        } else {
            console.error('forgotPasswordForm not found');
        }

        // Verify OTP form submission
        const verifyOtpForm = document.getElementById('verifyOtpForm');
        if (verifyOtpForm) {
            verifyOtpForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const email = document.getElementById('verifyEmail').value.trim();
                const code = document.getElementById('otpCode').value.trim();
                const newPassword = document.getElementById('newPassword').value;
                const confirmNewPassword = document.getElementById('confirmNewPassword').value;

                const passwordRegex = /^(?=.*\d).{8,}$/;
                if (!passwordRegex.test(newPassword)) {
                    window.app.notificationsError('New password must be at least 8 characters long and include numbers');
                    return;
                }
                if (newPassword !== confirmNewPassword) {
                    window.app.notificationsError('New password and confirmation do not match');
                    return;
                }

                window.showLoadingOverlay();
                try {
                    const response = await window.app.authenticatedFetch(`${window.apiUrl}/verify-reset-code`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, code, new_password: newPassword })
                    });
                    if (!response) {
                        throw new Error('No response from server');
                    }
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || 'Verification failed');

                    window.app.notificationsSuccess('Password updated successfully!');
                    window.showLogin();
                } catch (error) {
                    window.app.notificationsError(error.message || 'Error verifying OTP');
                    window.hideLoadingOverlay();
                }
            });
        } else {
            console.error('verifyOtpForm not found');
        }

        // Check token validity on page load
        const token = localStorage.getItem('authToken');
        const currentPageType = document.body.getAttribute('data-page-type') || 'unknown';

        console.log('Page load check - Token:', token ? '[present]' : 'null', 'Current Page Type:', currentPageType);

        if (token && currentPageType === 'login') {
            window.showLoadingOverlay();
            window.app.authenticatedFetch(`${window.apiUrl}/verify-token`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Token invalid or expired');
                }
                return response.json();
            })
            .then(data => {
                console.log('Token verified - Role:', data['x-role']);
                // Token is valid, reload to let server render correct content
                localStorage.setItem('loginRedirectCount', '0');
                window.location.reload();
            })
            .catch(error => {
                console.error('Token verification failed:', error.message);
                localStorage.removeItem('authToken');
                localStorage.removeItem('userId');
                localStorage.removeItem('expectedPageType');
                localStorage.setItem('loginRedirectCount', '0');
                deleteCookie('authToken');
                window.hideLoadingOverlay();
                window.showLogin();
            });
        } else {
            localStorage.setItem('loginRedirectCount', '0');
            window.showLogin();
        }
    } catch (error) {
        console.error('login-page.js - Script initialization failed:', error.message);
        window.app?.notificationsError?.('Failed to initialize login page. Please refresh.') || alert('Failed to initialize login page. Please refresh.');
        window.showLogin();
    }
};

// Debug listener setup
console.log('login-page.js - Setting up appInitialized listener');
const initTimeout = setTimeout(() => {
    console.warn('login-page.js - appInitialized not received within 10 seconds, proceeding with initialization', {
        currentPath: window.location.pathname,
        token: localStorage.getItem('authToken') ? '[present]' : 'null'
    });
    initializeLoginPage();
}, 10000);

window.addEventListener('appInitialized', function() {
    console.log('login-page.js - appInitialized event received');
    clearTimeout(initTimeout);
    initializeLoginPage();
});