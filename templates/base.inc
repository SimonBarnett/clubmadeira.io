<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="page-type" content="{{ page_type | default('login') }}">
    <title>{{ title | default('clubmadeira.io') }}</title>
    <!-- External CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css">
    <!-- Local CSS -->
    <link rel="stylesheet" href="{{ url_for('static', filename='css/icons.css?v=1.0.1') }}">
    <link rel="stylesheet" href="{{ url_for('static', filename='css/settings.css?v=1.0.1') }}">
    <link rel="stylesheet" href="{{ url_for('static', filename='css/siterequest.css?v=1.0.1') }}">
    <!-- Favicon -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><path fill='black' d='M201.4 137.4c12.5-12.5 32.8-12.5 45.3 0l160 160c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L224 205.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l160-160zM201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z'/></svg>" type="image/svg+xml">
    <!-- Dynamic API URL -->
    <script>
        window.apiUrl = 'https://clubmadeira.io';
    </script>
    <!-- External JS -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js" defer></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js" defer></script>
    <script src="https://cdn.tiny.cloud/1/{{ site_settings.tiny.API_KEY | default('YOUR_VALID_API_KEY') }}/tinymce/6/tinymce.min.js" defer></script>
    <!-- Add .hidden class for hideOverlay -->
    <style>
        #loadingOverlay.hidden {
            display: none !important;
        }
    </style>
</head>
<body {% block body_attributes %}{% endblock %}>
    <!-- Loading Overlay -->
    <div id="loadingOverlay" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 1); justify-content: center; align-items: center; z-index: 9999;">
        <div style="position: relative; width: 200px; height: 200px;">
            <div style="position: absolute; border-radius: 50%; border: 8px solid transparent; animation: spin 1.5s linear infinite; width: 120px; height: 120px; border-top-color: #ff6f61; top: 40px; left: 40px; animation-delay: 0s;"></div>
            <div style="position: absolute; border-radius: 50%; border: 8px solid transparent; animation: spin 1.5s linear infinite; width: 90px; height: 90px; border-top-color: #6bff61; top: 55px; left: 55px; animation-delay: 0.3s;"></div>
            <div style="position: absolute; border-radius: 50%; border: 8px solid transparent; animation: spin 1.5s linear infinite; width: 60px; height: 60px; border-top-color: #61cfff; top: 70px; left: 70px; animation-delay: 0.6s;"></div>
            <div style="position: absolute; border-radius: 50%; border: 8px solid transparent; animation: spin 1.5s linear infinite; width: 30px; height: 30px; border-top-color: #ff61ff; top: 85px; left: 85px; animation-delay: 0.9s;"></div>
        </div>
    </div>
    <style>
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
    <!-- Notification DIV for fallback (optional) -->
    <div id="notification" style="display: none;"></div>
    <!-- Hidden input for userId -->
    <input type="text" id="userId" style="display: none;" value="{{ user.user_id if user and user.user_id is defined else '' }}">

    <!-- Debug script to log template variables -->
    <script type="text/template" id="debug-script">
        (function() {
            const xRole = {{ x_role | tojson | safe if x_role is defined else '"undefined"' }};
            const pageType = {{ page_type | tojson | safe if page_type is defined else '"undefined"' }};
            const user = {{ user | tojson | safe if user is defined and user is not none else '"undefined"' }};

            console.log('base.inc - Template variables - x_role:', xRole);
            console.log('base.inc - Template variables - page_type:', pageType);
            console.log('base.inc - Template variables - user:', user);
        })();
    </script>
    <script>
        const scriptContent = document.getElementById('debug-script').textContent;
        eval(scriptContent);
    </script>

    <!-- Main content wrapper, hidden initially -->
    <div class="layout-wrapper" style="display: none;">
        <div class="header">
            {% include 'roles.inc' %}
        </div>
        <div class="content">
            <!-- Menu Container (dynamically populated by navigation.js) -->
            <div id="menu" class="menu"></div>
            <!-- Role-specific sections (corresponding to navigation menu buttons) -->
            {% block content %}{% endblock %}
            <div id="info" class="section" style="display: none;">
                {% include 'welcome.inc' with context %}
            </div>

            {% if page_type != 'login' %}
            <!-- My Account Sections (shared across authenticated roles) -->
            <div id="my-account" class="section" style="display: none;">
                <h2>My Account</h2>
            </div>
            <div id="contact-details" class="section" style="display: none;">
                <h2>Contact Details</h2>
                <form id="contactDetailsForm">
                    <div class="form-group">
                        <label for="contact_name">Name:</label>
                        <input type="text" id="contact_name" name="contact_name">
                    </div>
                    <div class="form-group">
                        <label for="email_address">Email:</label>
                        <input type="email" id="email_address" name="email_address">
                    </div>
                    <div class="form-group">
                        <label for="phone_number">Phone Number:</label>
                        <input type="tel" id="phone_number" name="phone_number">
                    </div>
                    <button type="submit"><i class="fas fa-address-card"></i> Save Details</button>
                </form>
            </div>
            <div id="change-password" class="section" style="display: none;">
                <h2>Change Password</h2>
                <form id="myAccountForm">
                    <div class="form-group">
                        <label for="currentPassword">Current Password:</label>
                        <div class="password-wrapper">
                            <input type="password" id="currentPassword" name="current_password">
                            <span class="toggle-password"><i class="fa fa-eye"></i></span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="newPassword">New Password:</label>
                        <div class="password-wrapper">
                            <input type="password" id="newPassword" name="new_password">
                            <span class="toggle-password"><i class="fa fa-eye"></i></span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">Confirm New Password:</label>
                        <div class="password-wrapper">
                            <input type="password" id="confirmPassword" name="confirm_password">
                            <span class="toggle-password"><i class="fa fa-eye"></i></span>
                        </div>
                    </div>
                    <button type="submit"><i class="fas fa-key"></i> Update Password</button>
                </form>
            </div>
            <div id="settings" class="section" style="display: none;">
                <h2>Settings</h2>
                <p>Configure settings specific to your role here.</p>
                <form id="settings-form">
                    <input type="text" id="settingsUserId" name="userId" placeholder="User ID">
                    <input type="text" id="contactName" name="contactName" placeholder="Contact Name">
                    <input type="text" id="websiteUrl" name="websiteUrl" placeholder="Website URL">
                    <input type="email" id="emailAddress" name="emailAddress" placeholder="Email Address">
                    <button type="submit">Save Settings</button>
                </form>
            </div>
            {% endif %}
        </div>
    </div>

    <!-- Core script using new consolidated structure -->
    <script type="module" src="{{ url_for('static', filename='js/main.js') }}?v=1.0.4"></script>

    <!-- Page-specific scripts -->
    {% if page_type == 'login' %}
        <script type="module" src="{{ url_for('static', filename='js/login-page.js') }}" defer></script>
    {% elif page_type == 'admin' %}
        <script type="module" src="{{ url_for('static', filename='js/admin-page.js') }}" defer></script>
    {% elif page_type == 'merchant' %}
        <script type="module" src="{{ url_for('static', filename='js/merchant-page.js') }}" defer></script>
        <script type="module" src="{{ url_for('static', filename='js/modules/site-request.js') }}" defer></script>
    {% elif page_type == 'partner' %}
        <script type="module" src="{{ url_for('static', filename='js/partner-page.js') }}" defer></script>
    {% elif page_type == 'community' %}
        <script type="module" src="{{ url_for('static', filename='js/community-page.js') }}" defer></script>
        <script type="module" src="{{ url_for('static', filename='js/modules/site-request.js') }}" defer></script>
    {% endif %}

    <!-- Markdown link handler as a module -->
    <script type="module">
        import { marked } from 'https://cdn.jsdelivr.net/npm/marked@4.0.0/+esm';

        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('.md-link').forEach(link => {
                link.addEventListener('click', function(event) {
                    event.preventDefault();
                    const mdPath = this.getAttribute('data-md-path');
                    const targetId = 'md-render-target';
                    const target = document.getElementById(targetId);
                    if (target) {
                        fetch(mdPath)
                            .then(response => response.text())
                            .then(text => {
                                target.innerHTML = marked.parse(text);
                            })
                            .catch(err => console.error('Failed to render markdown:', err));
                    }
                });
            });
        });
    </script>
    {% block scripts %}{% endblock %}
</body>
</html>