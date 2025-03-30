<!-- templates/welcome.inc -->
<div id="info" class="section">
    {% if page_type == 'admin' %}
        <h2>Admin Info</h2>
        <p id="welcome-message">Hello, <span id="user-contact-name">[User]</span>! This dashboard is your central hub for overseeing the clubmadeira.io platform.</p>
        <p>Use the menu to manage affiliate programs, deal listings, user permissions, and test scripts. This powerful toolset allows you to maintain and optimize the platform for all users.</p>
    {% elif page_type == 'merchant' %}
        <h2>Merchant Info</h2>
        <p id="welcome-message">Hello, <span id="user-contact-name">[User]</span>! This dashboard is designed for merchants to manage integrations with clubmadeira.io.</p>
        <p>Use the menu to manage products, your store, Wix integration, and account settings. Grow your business by leveraging our tools to showcase deals and track performance.</p>
    {% elif page_type == 'community' %}
        <h2>Community Info</h2>
        <p id="welcome-message">Hello, <span id="user-contact-name">[User]</span>! This dashboard connects your community with valuable resources on clubmadeira.io.</p>
        <p>Use the menu to integrate discounts into your website, select product categories, track referrals, and update account details. Build stronger ties by sharing benefits with your members.</p>
    {% elif page_type == 'partner' %}
        <h2>Partner Info</h2>
        <p id="welcome-message">Hello, <span id="user-contact-name">[User]</span>! This dashboard empowers partners to collaborate with merchants and communities on clubmadeira.io.</p>
        <p>Use the menu to manage integrations, review site requests, access documentation, and update your account. Work together to create tailored solutions for our users.</p>
    {% else %}
        <h2>Welcome</h2>
        <p id="welcome-message">Hello, <span id="user-contact-name">[User]</span>! Welcome to clubmadeira.io.</p>
        <p>This is your starting point. Log in to access your personalized dashboard and explore the tools available to you based on your role.</p>
    {% endif %}
</div>