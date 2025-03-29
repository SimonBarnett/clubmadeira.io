<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ title | default('clubmadeira.io') }}</title>
    <!-- External CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css">
    <!-- Local CSS -->
    <!-- Favicon -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><path fill='black' d='M201.4 137.4c12.5-12.5 32.8-12.5 45.3 0l160 160c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L224 205.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l160-160zM201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z'/></svg>" type="image/svg+xml">
    <!-- Dynamic API URL -->
    <script>
        window.apiUrl = 'https://clubmadeira.io';
    </script>
    <!-- Load jQuery and Toastr before inline script -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js"></script>
    <!-- Load common.js early -->
    <script src="{{ url_for('static', filename='js/common.js') }}"></script>
</head>
<body>
    {% block content %}{% endblock %}
    <script src="{{ url_for('static', filename='js/site-auth.js') }}" defer></script>
    <script src="{{ url_for('static', filename='js/site-navigation.js') }}" defer></script>
    <script src="{{ url_for('static', filename='js/category-management.js') }}" defer></script>
    <script src="{{ url_for('static', filename='js/site-request.js') }}" defer></script>
    <script src="{{ url_for('static', filename='js/admin-page.js') }}" defer></script>
    <script src="{{ url_for('static', filename='js/page-load.js') }}" defer></script>
</body>
</html>