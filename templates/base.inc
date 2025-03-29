<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ title | default('clubmadeira.io') }}</title>
    <!-- External CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css">
    <!-- Local CSS -->
    <link rel="stylesheet" href="{{ url_for('static', filename='css/icons.css') }}">
    <!-- Favicon -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><path fill='white' d='M201.4 137.4c12.5-12.5 32.8-12.5 45.3 0l160 160c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L224 205.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l160-160zM201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z'/></svg>" type="image/svg+xml">
    <!-- Dynamic API URL -->
    <script>
        window.apiUrl = 'https://clubmadeira.io';
    </script>
    <!-- External JS -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js" defer></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js" defer></script>
    <script src="https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js" defer></script>
    <!-- Load common.js early for Toastr setup -->
    <script src="{{ url_for('static', filename='js/common.js') }}" defer></script>
</head>
<body>
    <div class="layout-wrapper">
        <div class="header">
            <div class="header-content" id="brandingContent">
                <!-- Branding content will be loaded here -->
            </div>
        </div>        
        
        {% block content %}{% endblock %}
        
    </div>

    <!-- Local JS -->
    <script src="{{ url_for('static', filename='js/site-auth.js') }}" defer></script>
    <script src="{{ url_for('static', filename='js/site-navigation.js') }}" defer></script>
    <script src="{{ url_for('static', filename='js/category-management.js') }}" defer></script>
    <script src="{{ url_for('static', filename='js/site-request.js') }}" defer></script>
    <script src="{{ url_for('static', filename='js/admin-page.js') }}" defer></script>
    <script src="{{ url_for('static', filename='js/page-load.js') }}" defer></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const layoutWrapper = document.querySelector('.layout-wrapper');
            layoutWrapper.style.display = 'none'; // Hide initially

            function waitForInitialize(pageType, attempts = 100, delay = 1000) {
                if (typeof window.initialize === 'function') {
                    console.log(`Initialize function found, calling initialize("${pageType}")`);
                    window.initialize(pageType);
                    layoutWrapper.style.display = 'block'; // Show after initialization
                } else if (attempts > 0) {
                    console.log(`Initialize function not found, retrying (${attempts} attempts left)...`);
                    setTimeout(() => waitForInitialize(pageType, attempts - 1, delay), delay);
                } else {
                    console.error('Initialize function not found after maximum retries');
                    layoutWrapper.style.display = 'block'; // Show anyway to avoid blank page
                }
            }

            // Pass page type from Flask
            waitForInitialize('{{ page_type | default("default") }}');
        });
    </script>
</body>
</html>