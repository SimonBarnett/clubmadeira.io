<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ title | default('clubmadeira.io') }}</title>
    <!-- External CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css">
    <!-- Local CSS -->
    <link rel="stylesheet" href="{{ url_for('static', filename='css/icons.css?v=1.0.1') }}">
    <!-- Favicon -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><path fill='black' d='M201.4 137.4c12.5-12.5 32.8-12.5 45.3 0l160 160c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L224 205.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l160-160zM201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z'/></svg>" type="image/svg+xml">
    <link rel="shortcut icon" href="{{ url_for('static', filename='images/favicon.ico') }}" type="image/x-icon">
    <!-- Dynamic API URL -->
    <script>
        window.apiUrl = 'https://clubmadeira.io';
    </script>
    <!-- External JS -->
    <script src="https://cdn.jsdelivr.net/npm/marked@4.0.0/marked.min.js" defer></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js" defer></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js" defer></script>
    <script src="https://cdn.tiny.cloud/1/{{ site_settings.tiny.API_KEY | default('YOUR_VALID_API_KEY') }}/tinymce/6/tinymce.min.js" defer></script>
</head>
<body {% block body_attributes %}{% endblock %}>
    <!-- Hidden input for userId -->
    <input type="text" id="userId" style="display: none;" value="{{ user.user_id if user and user.user_id is defined else '' }}">

    <!-- Debug script to log template variables -->
    <script>
        const xRole = {{ x_role | tojson if x_role is defined else '"undefined"' }};
        const pageType = {{ page_type | tojson if page_type is defined else '"undefined"' }};
        const user = {{ user | tojson if user is defined else '"undefined"' }};

        console.log('base.inc - Template variables - x_role:', xRole);
        console.log('base.inc - Template variables - page_type:', pageType);
        console.log('base.inc - Template variables - user:', user);
    </script>

    <div class="layout-wrapper">
        <div class="header">
            {% include 'roles.inc' %}            
        </div>        
        {% include 'overlay.inc' %}
        <div class="content">
            <!-- Menu Container (dynamically populated by navigation.js) -->
            <div id="menu" class="menu"></div>
            <!-- Info Section (includes welcome.inc) -->
            <div id="info" class="section" style="display: none;">
                {% include 'welcome.inc' with context %}
            </div>
            <!-- Role-specific sections (corresponding to navigation menu buttons) -->
            {% block content %}{% endblock %}
            <!-- My Account Sections (shared across all roles) -->
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
                    <!-- Additional fields can be added here with matching id and name -->
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
        </div>
    </div>

    <!-- Core script using new consolidated structure -->
    <script type="module" src="{{ url_for('static', filename='js/main.js') }}"></script>

    <!-- Page-specific scripts -->
    {% if page_type == 'login' %}
        <script type="module" src="{{ url_for('static', filename='js/login-page.js') }}" defer></script>
    {% elif page_type == 'admin' %}
        <script type="module" src="{{ url_for('static', filename='js/admin-page.js') }}" defer></script>
    {% elif page_type == 'merchant' %}
        <script type="module" src="{{ url_for('static', filename='js/category-management.js') }}" defer></script>
        <script type="module" src="{{ url_for('static', filename='js/site-request.js') }}" defer></script>
        <script type="module" src="{{ url_for('static', filename='js/merchant-page.js') }}" defer></script>
    {% elif page_type == 'partner' %}
        <script type="module" src="{{ url_for('static', filename='js/partner-page.js') }}" defer></script>
    {% elif page_type == 'community' %}        
        <script type="module" src="{{ url_for('static', filename='js/site-request.js') }}" defer></script>
        <script type="module" src="{{ url_for('static', filename='js/community-page.js') }}" defer></script>
    {% endif %}

    <script>
        // Minimal DOMContentLoaded handler for markdown links only
        document.addEventListener('DOMContentLoaded', function() {
            const layoutWrapper = document.querySelector('.layout-wrapper');
            layoutWrapper.style.display = 'none'; // Hide initially until initialized by pageSetup.js

            // Add event listeners for markdown rendering
            if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
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
            } else {
                console.error('marked.parse is not defined');
            }
        });
    </script>
    {% block scripts %}{% endblock %}
</body>
</html>