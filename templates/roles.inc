<!-- templates/roles.inc -->
{% if is_authenticated %}
    {% if page_type == 'admin' %}
        <button class="role-dashboard-button" data-section="info">
            <div class="role-dashboard-header">
                <span class="role-dashboard-icon"><i class="fas fa-headset"></i></span>
                <div class="role-dashboard-text">
                    <h1 class="role-dashboard-title">Admin Dashboard</h1>
                    <p class="role-dashboard-description">Manage your platform with powerful tools and insights.</p>
                </div>
            </div>
        </button>
    {% elif page_type == 'merchant' %}
        <button class="role-dashboard-button" data-section="info">
            <div class="role-dashboard-header">
                <span class="role-dashboard-icon"><i class="fas fa-user-tie"></i></span>
                <div class="role-dashboard-text">
                    <h1 class="role-dashboard-title">Merchant Dashboard</h1>
                    <p class="role-dashboard-description">Track sales, manage deals, and grow your business.</p>
                </div>
            </div>
        </button>
    {% elif page_type == 'community' %}
        <button class="role-dashboard-button" data-section="info">
            <div class="role-dashboard-header">
                <span class="role-dashboard-icon"><i class="fas fa-people-group"></i></span>
                <div class="role-dashboard-text">
                    <h1 class="role-dashboard-title">Community Dashboard</h1>
                    <p class="role-dashboard-description">Connect with members and share valuable resources.</p>
                </div>
            </div>
        </button>
    {% elif page_type == 'partner' %}
        <button class="role-dashboard-button" data-section="info">
            <div class="role-dashboard-header">
                <span class="role-dashboard-icon"><i class="fas fa-palette"></i></span>
                <div class="role-dashboard-text">
                    <h1 class="role-dashboard-title">Partner Dashboard</h1>
                    <p class="role-dashboard-description">Collaborate and create with our partner tools.</p>
                </div>
            </div>
        </button>
    {% else %}
        <button class="role-dashboard-button" data-section="info">
            <div class="role-dashboard-header">
                <span class="role-dashboard-icon"><i class="fas fa-people-group"></i></span>
                <div class="role-dashboard-text">
                    <h1 class="role-dashboard-title">Welcome to clubmadeira.io</h1>
                    <p class="role-dashboard-description">Log in to access your dashboard.</p>
                </div>
            </div>
        </button>
    {% endif %}
{% else %}
    <button class="role-dashboard-button" data-section="info">
        <div class="role-dashboard-header">
            <span class="role-dashboard-icon"><i class="fas fa-people-group"></i></span>
            <div class="role-dashboard-text">
                <h1 class="role-dashboard-title">Welcome to clubmadeira.io</h1>
                <p class="role-dashboard-description">Log in to access your dashboard.</p>
            </div>
        </div>
    </button>
{% endif %}