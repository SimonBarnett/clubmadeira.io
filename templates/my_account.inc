<div id="contact-details" class="section" style="display: none;">
    <h2>Contact Details</h2>
    <div class="settings-form">
        <label><strong>User ID:</strong></label>
        <input type="text" id="userId" readonly>
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