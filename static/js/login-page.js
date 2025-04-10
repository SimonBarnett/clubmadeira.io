// /static/js/login-page.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('login-page.js - Script loaded - Version: v11 - Timestamp:', new Date().toISOString());

    try {
        // Dependency checks
        if (!window.apiUrl) {
            console.error('login-page.js - window.apiUrl is not defined. Form will submit natively.');
            showLogin();
            return;
        }

        if (!window.siteNavigation || !window.decodeJWT || !window.initialize) {
            console.error('login-page.js - Required scripts not loaded. Falling back to native form submission.');
            toastr.error('Failed to load required scripts. Please refresh the page.');
            showLogin();
            return;
        }

        // Expose functions globally for onclick handlers
        window.showLoadingOverlay = function() {
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) {
                overlay.classList.remove('hidden');
                console.log('showLoadingOverlay - Overlay shown');
            } else {
                console.warn('showLoadingOverlay - Overlay element not found');
            }
        };

        window.hideLoadingOverlay = function() {
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) {
                overlay.classList.add('hidden');
                console.log('hideLoadingOverlay - Overlay hidden');
            } else {
                console.warn('hideLoadingOverlay - Overlay element not found');
            }
        };

        window.showLogin = function() {
            const loginContainer = document.getElementById('loginContainer');
            const forgotContainer = document.getElementById('forgotPasswordContainer');
            const verifyContainer = document.getElementById('verifyOtpContainer');
            if (loginContainer && forgotContainer && verifyContainer) {
                loginContainer.classList.remove('hidden');
                forgotContainer.classList.add('hidden');
                verifyContainer.classList.add('hidden');
                console.log('showLogin - Login container shown, others hidden');
            } else {
                console.error('showLogin - One or more containers not found:', {
                    loginContainer: !!loginContainer,
                    forgotContainer: !!forgotContainer,
                    verifyContainer: !!verifyContainer
                });
            }
            window.hideLoadingOverlay();
        };

        window.showForgotPassword = function() {
            const loginContainer = document.getElementById('loginContainer');
            const forgotContainer = document.getElementById('forgotPasswordContainer');
            const verifyContainer = document.getElementById('verifyOtpContainer');
            if (loginContainer && forgotContainer && verifyContainer) {
                loginContainer.classList.add('hidden');
                forgotContainer.classList.remove('hidden');
                verifyContainer.classList.add('hidden');
                console.log('showForgotPassword - Forgot Password container shown');
            } else {
                console.error('showForgotPassword - One or more containers not found');
            }
            window.hideLoadingOverlay();
        };

        window.showVerifyOtp = function(email) {
            const loginContainer = document.getElementById('loginContainer');
            const forgotContainer = document.getElementById('forgotPasswordContainer');
            const verifyContainer = document.getElementById('verifyOtpContainer');
            if (loginContainer && forgotContainer && verifyContainer) {
                loginContainer.classList.add('hidden');
                forgotContainer.classList.add('hidden');
                verifyContainer.classList.remove('hidden');
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
            window.hideLoadingOverlay();
        };

        // Utility to set a cookie
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

        // Utility to get a cookie
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

        // Utility to delete a cookie
        function deleteCookie(name) {
            document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; SameSite=Lax; Secure';
            console.log('deleteCookie - Deleted cookie:', name);
        }

        // Toggle password visibility
        document.querySelectorAll('.toggle-password').forEach(toggle => {
            toggle.addEventListener('click', function() {
                const input = this.parentElement.querySelector('input');
                const icon = this.querySelector('i');
                input.type = input.type === 'password' ? 'text' : 'password';
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
                console.log('toggle-password - Toggled visibility for input:', input.id);
            });
        });

        // Login form submission (Updated Section)
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                console.log('Login form submitted');
                const email = document.getElementById('loginEmail').value.trim();
                const password = document.getElementById('loginPassword').value;

                if (!email || !password) {
                    toastr.error('Please enter both email and password.');
                    return;
                }

                window.showLoadingOverlay();
                try {
                    const response = await fetch('/', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json', 
                            'Accept': 'application/json' 
                        },
                        body: JSON.stringify({ email, password }),
                        credentials: 'include'
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Login failed');
                    }

                    const data = await response.json();
                    if (data.status !== 'success') throw new Error(data.message || 'Login failed');

                    localStorage.setItem('authToken', data.token);
                    if (data.user_id) localStorage.setItem('userId', data.user_id);
                    localStorage.setItem('expectedPageType', data['x-role']);
                    setCookie('authToken', data.token, 7);
                    console.log('Login success - Token:', data.token, 'Role:', data['x-role'], 'Redirecting to: /');
                    window.location.href = '/'; // Updated: Redirect to root instead of data.redirect_url
                } catch (error) {
                    console.error('Login error:', error.message);
                    toastr.error(error.message || 'Unable to connect to server.');
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
                    const response = await fetch(`${window.apiUrl}/reset-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || 'Reset request failed');

                    toastr.success('A one-time password has been sent to your phone.');
                    window.showVerifyOtp(email);
                } catch (error) {
                    toastr.error(error.message || 'Error sending OTP');
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
                    toastr.error('New password must be at least 8 characters long and include numbers');
                    return;
                }
                if (newPassword !== confirmNewPassword) {
                    toastr.error('New password and confirmation do not match');
                    return;
                }

                window.showLoadingOverlay();
                try {
                    const response = await fetch(`${window.apiUrl}/verify-reset-code`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, code, new_password: newPassword })
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || 'Verification failed');

                    toastr.success('Password updated successfully!');
                    window.showLogin();
                } catch (error) {
                    toastr.error(error.message || 'Error verifying OTP');
                    window.hideLoadingOverlay();
                }
            });
        } else {
            console.error('verifyOtpForm not found');
        }

        // Check if already logged in on page load
        const token = localStorage.getItem('authToken');
        const currentPageType = document.body.getAttribute('data-page-type') || 'login';
        const expectedPageType = localStorage.getItem('expectedPageType') || 'login';
        const redirectCount = parseInt(localStorage.getItem('loginRedirectCount') || '0');
        const xPageType = document.head.querySelector('meta[name="x-page-type"]')?.content || currentPageType;

        console.log('Page load check - Token:', token ? '[present]' : 'null', 'Current Page Type:', currentPageType, 'Expected Page Type:', expectedPageType, 'X-Page-Type:', xPageType, 'Redirect Count:', redirectCount);

        if (token && currentPageType === 'login' && expectedPageType !== 'login') {
            if (redirectCount > 2) {
                console.error('Login redirect loop detected, clearing token');
                localStorage.removeItem('authToken');
                localStorage.removeItem('expectedPageType');
                localStorage.setItem('loginRedirectCount', '0');
                deleteCookie('authToken');
                window.showLogin();
            } else if (xPageType === 'login') {
                console.error('Server returned login page despite valid token, possible session mismatch');
                toastr.error('Session issue detected, please log in again');
                localStorage.removeItem('authToken');
                localStorage.removeItem('expectedPageType');
                localStorage.setItem('loginRedirectCount', '0');
                deleteCookie('authToken');
                window.showLogin();
            } else {
                console.log('Redirecting to / with token, incrementing redirect count');
                localStorage.setItem('loginRedirectCount', redirectCount + 1);
                setCookie('authToken', token, 7);
                window.location.href = '/';
            }
        } else {
            localStorage.setItem('loginRedirectCount', '0');
            localStorage.removeItem('expectedPageType');
            window.showLogin();
        }
    } catch (error) {
        console.error('login-page.js - Script initialization failed:', error.message);
        toastr.error('Failed to initialize login page. Please refresh.');
        window.showLogin();
    }
});