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
        <h2>Login</h2>
        <div class="custom-login-notice">
            <span class="highlight">Please log in</span> to access your account. If you don’t have an account, click "Sign Up" below.
        </div>
    {% endif %}
</div>