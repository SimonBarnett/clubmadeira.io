<!-- templates/welcome.inc -->

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
    {% if from_stripe %}
        <p>Welcome back from Stripe! Please set your password to complete your account setup.</p>
        <form id="setPasswordForm" class="form" method="POST" action="/">
            <input type="hidden" name="set_password" value="true">
            <div class="form-group">
                <label for="email">Email:</label>
                <div class="input-container">
                    <input type="email" id="email" name="email" value="{{ email }}" required>
                </div>
            </div>
            <div class="form-group">
                <label for="password">Password:</label>
                <div class="password-wrapper">
                    <input type="password" id="password" name="password" placeholder="Enter your password" required>
                    <i class="fas fa-eye toggle-password"></i>
                </div>
            </div>
            <div class="form-group">
                <label for="confirmPassword">Confirm Password:</label>
                <div class="password-wrapper">
                    <input type="password" id="confirmPassword" name="confirm_password" placeholder="Confirm your password" required>
                    <i class="fas fa-eye toggle-password"></i>
                </div>
            </div>
            <div>
                <button type="submit">Set Password</button>
            </div>
        </form>
    {% else %}
        <p>Log in to access your dashboard.</p>
        <form id="loginForm" class="form" method="POST" action="/">
            <div class="form-group">
                <label for="loginEmail">Email:</label>
                <div class="input-container">
                    <input type="email" id="loginEmail" name="email" placeholder="Enter your email" required autocomplete="off">
                </div>
            </div>
            <div class="form-group">
                <label for="loginPassword">Password:</label>
                <div class="password-wrapper">
                    <input type="password" id="loginPassword" name="password" placeholder="Enter your password" required autocomplete="off">
                    <i class="fas fa-eye toggle-password"></i>
                </div>
            </div>
            <div>
                <button type="submit">Login</button>
            </div>
        </form>
    {% endif %}
{% endif %}