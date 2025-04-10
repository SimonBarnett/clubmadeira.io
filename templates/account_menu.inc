<!-- templates/account_menu.inc -->
<!-- Menu Buttons -->
<button data-submenu="my_account_submenu" data-section="account_intro">
    <span class="button-content"><i class="fas fa-cog"></i> My Account</span>
    <i class="fas fa-caret-right caret"></i>
</button>
<div id="my_account_submenu" class="submenu">
    <button data-section="contact_details">
        <span class="button-content"><i class="fas fa-address-book"></i> Contact</span>
    </button>
    <button data-section="change_password">
        <span class="button-content"><i class="fas fa-key"></i> Change Password</span>
    </button>
</div>

<!-- Content Sections -->
<div id="contact_details" class="section" style="display: none;">
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

<div id="change_password" class="section" style="display: none;">
    <div class="settings-form">
        <div class="password-container">
            <label for="currentPassword">Current Password:</label>
            <input type="password" id="currentPassword" name="currentPassword" placeholder="Enter current password">
            <i class="fas fa-eye password-toggle" {% if page_type == "partner" %}data-field="currentPassword Ascending"{% else %}data-target="currentPassword"{% endif %}></i>
        </div>
        <div class="password-container">
            <label for="newPassword">New Password:</label>
            <input type="password" id="newPassword" name="newPassword" placeholder="Enter new password">
            <i class="fas fa-eye password-toggle" {% if page_type == "partner" %}data-field="newPassword"{% else %}data-target="newPassword"{% endif %}></i>
        </div>
        <div class="password-container">
            <label for="confirmPassword">Confirm New Password:</label>
            <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm new password">
            <i class="fas fa-eye password-toggle" {% if page_type == "partner" %}data-field="confirmPassword"{% else %}data-target="confirmPassword"{% endif %}></i>
        </div>
        <button data-action="savePassword"><i class="fas fa-key"></i> Change Password</button>
    </div>
</div>