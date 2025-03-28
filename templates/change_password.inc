<div class="settings-form">
    <div class="password-container">
        <label for="currentPassword">Current Password:</label>
        <input type="password" id="currentPassword" name="currentPassword" placeholder="Enter current password">
        <i class="fas fa-eye password-toggle" {% if user_type == "partner" %}data-field="currentPassword Ascending"{% else %}data-target="currentPassword"{% endif %}></i>
    </div>
    <div class="password-container">
        <label for="newPassword">New Password:</label>
        <input type="password" id="newPassword" name="newPassword" placeholder="Enter new password">
        <i class="fas fa-eye password-toggle" {% if user_type == "partner" %}data-field="newPassword"{% else %}data-target="newPassword"{% endif %}></i>
    </div>
    <div class="password-container">
        <label for="confirmPassword">Confirm New Password:</label>
        <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm new password">
        <i class="fas fa-eye password-toggle" {% if user_type == "partner" %}data-field="confirmPassword"{% else %}data-target="confirmPassword"{% endif %}></i>
    </div>
    <button data-action="savePassword"><i class="fas fa-key"></i> Change Password</button>
</div>