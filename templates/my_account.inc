<div id="settings" class="section">
    <h2>My Account</h2>
    <div class="settings-form">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="height: 24px; width: auto; margin-right: 10px;">
                <path d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm80 256h64c44.2 0 80 35.8 80 80c0 8.8-7.2 16-16 16H112c-8.8 0-16-7.2-16-16c0-44.2 35.8-80 80-80zm-32-96a64 64 0 1 1 128 0 64 64 0 1 1 -128 0zm256-32H304c-8.8 0-16 7.2-16 16v64c0 8.8 7.2 16 16 16h64c8.8 0 16-7.2 16-16V176c0-8.8-7.2-16-16-16zm-64 0c0-26.5 21.5-48 48-48s48 21.5 48 48v64c0 26.5-21.5 48-48 48s-48-21.5-48-48V176z"/>
            </svg>
            <h3>Contact Details</h3>
        </div>
        {% if user_type == "community" %}
        <label><strong>User ID:</strong></label>
        <input type="text" id="userId" readonly>
        <label><strong>Referrer ID:</strong> <span id="referrerId"></span></label>
        {% else %}
        {% if user_type == "merchant" %}
        <label><strong>User ID:</strong></label>
        <input type="text" id="userId" readonly>
        {% endif %}
        {% endif %}
        <label for="contactName">Contact Name:</label>
        <input type="text" id="contactName" placeholder="Enter contact name">
        <label for="websiteUrl">Website URL:</label>
        <input type="url" id="websiteUrl" placeholder="Enter website URL">
        <label for="emailAddress">Email Address:</label>
        <input type="email" id="emailAddress" placeholder="Enter email address">
        <label><strong>Phone Number:</strong></label>
        <span>{{ user.phone_number | default('N/A') }}</span>
        <button data-action="saveSettings"><i class="fas fa-save"></i> Save Settings</button>
    </div>
</div>