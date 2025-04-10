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
    <link rel="shortcut icon" href="{{ url_for('static', filename='favicon.ico') }}" type="image/x-icon">
    <!-- Dynamic API URL -->
    <script>
        window.apiUrl = 'https://clubmadeira.io';
    </script>
    <!-- External JS -->
    <script src="{{ url_for('static', filename='js/marked.min.js') }}"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js" defer></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js" defer></script>
    <script src="https://cdn.tiny.cloud/1/YOUR_API_KEY/tinymce/6/tinymce.min.js" defer></script>
    <!-- Load common.js early for Toastr setup -->
    <script src="{{ url_for('static', filename='js/common.js') }}" defer></script>
</head>
<body>
    <div class="layout-wrapper">
        <div class="header">
            {% include 'roles.inc' %}            
        </div>        
        {% include 'overlay.inc' %}
        {% block content %}{% endblock %}
    </div>

    <!-- Core scripts always loaded -->
    <script src="{{ url_for('static', filename='js/site-auth.js') }}" defer></script>
    <script src="{{ url_for('static', filename='js/site-navigation.js') }}" defer></script>
    <script src="{{ url_for('static', filename='js/user-management.js') }}" defer></script>
    <script src="{{ url_for('static', filename='js/page-load.js') }}" defer></script>

    <!-- Page-specific scripts -->
    {% if page_type == 'login' %}
        <script src="{{ url_for('static', filename='js/login-page.js') }}" defer></script>
    {% elif page_type == 'admin' %}
        <script src="{{ url_for('static', filename='js/admin-page.js') }}" defer></script>
    {% elif page_type == 'merchant' %}
        <script src="{{ url_for('static', filename='js/category-management.js') }}" defer></script>
        <script src="{{ url_for('static', filename='js/site-request.js') }}" defer></script>
        <script src="{{ url_for('static', filename='js/merchant-page.js') }}" defer></script>
    {% elif page_type == 'partner' %}
        <script src="{{ url_for('static', filename='js/partner-page.js') }}" defer></script>
    {% elif page_type == 'community' %}
        <script src="{{ url_for('static', filename='js/category-management.js') }}" defer></script>
        <script src="{{ url_for('static', filename='js/site-request.js') }}" defer></script>
        <script src="{{ url_for('static', filename='js/community-page.js') }}" defer></script>
    {% endif %}

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const layoutWrapper = document.querySelector('.layout-wrapper');
            layoutWrapper.style.display = 'none'; // Hide initially

            // Pass page type from Flask
            const pageType = '{{ page_type | default("default") }}';

            // Ensure navigation is initialized even if page-specific initialization fails
            function initializeFallback() {
                if (typeof window.siteNavigation?.initializeNavigation === 'function') {
                    console.log('initializeFallback - Initializing navigation');
                    window.siteNavigation.initializeNavigation();
                } else {
                    console.error('initializeFallback - siteNavigation.initializeNavigation not found');
                }
                layoutWrapper.style.display = 'block'; // Show the layout
            }

            // Attempt page-specific initialization
            if (typeof window.initialize === 'function') {
                console.log(`Initializing page for type: ${pageType}`);
                window.initialize(pageType);
            } else {
                console.warn('window.initialize not found, falling back to navigation initialization');
                initializeFallback();
            }

            // Add event listeners for markdown rendering
            if (typeof window.renderMdPage === 'function') {
                document.querySelectorAll('.md-link').forEach(link => {
                    link.addEventListener('click', function(event) {
                        event.preventDefault();
                        const mdPath = this.getAttribute('data-md-path');
                        const targetId = 'md-render-target';
                        window.renderMdPage(mdPath, targetId);
                    });
                });
            } else {
                console.error('renderMdPage is not defined');
            }
        });
    </script>
</body>
</html>