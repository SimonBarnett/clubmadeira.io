<form id="siteRequestForm" class="settings-form site-request-form">
    <input type="hidden" id="userType" class="user-type-input" value="{{ user_type }}">

    <!-- Community/Store Name Section -->
    <div id="orgname" class="form-section orgname-section">
        <label for="name" class="form-label">{{ 'Community Name' if user_type == 'community' else 'Store Name' }}:</label>
        <input type="text" id="name" name="name" class="form-input orgname-input"
            placeholder="Enter your {{ 'community' if user_type == 'community' else 'store' }} name" required>
    </div>

    <!-- About Section -->
    <div id="aboutorg" class="form-section aboutorg-section">
        <label for="about" class="form-label">{{ 'About Our Community' if user_type == 'community' else 'About Your Store' }}:</label>
        <textarea id="about" name="about" class="mce-editor form-textarea aboutorg-textarea"
            placeholder="Tell us about your {{ 'community' if user_type == 'community' else 'store' }}"></textarea>
    </div>

    <!-- Logos Section -->
    <div id="orglogos" class="form-section orglogos-section">
        <label for="logos" class="form-label">{{ 'Community Logos' if user_type == 'community' else 'Store Logos' }}:</label>
        <input type="file" id="logos" name="logos" class="form-file-input orglogos-input" accept="image/*" multiple>
        <small class="form-hint">Upload up to 5 logos (e.g., main logo, secondary logos).</small>
    </div>

    <!-- Color Preferences Section -->
    <div id="orgcolour" class="form-section orgcolour-section">
        <label for="colorPrefs" class="form-label">Color Preferences:</label>
        <input type="text" id="colorPrefs" name="colorPrefs" class="form-input orgcolour-input" placeholder="e.g., #FF5733, Blue">
    </div>

    <!-- Styling Details Section -->
    <div id="orgStyle" class="form-section orgstyle-section">
        <label for="stylingDetails" class="form-label">Styling Details:</label>
        <textarea id="stylingDetails" name="stylingDetails" class="mce-editor form-textarea orgstyle-textarea" rows="4"
            placeholder="e.g., modern layout, bold fonts"></textarea>
    </div>

    <!-- Preferred Domain Section -->
    <div id="orgEmail" class="form-section orgemail-section orgemail-domain">
        <label for="preferredDomain" class="form-label">Preferred Domain Name:</label>
        <input type="text" id="preferredDomain" name="preferredDomain" class="form-input orgemail-domain-input"
            placeholder="e.g., my{{ 'community.org' if user_type == 'community' else 'store.uk' }}"
            oninput="updateEmailDomains()">
        <button type="button" data-action="checkDomainAvailability" class="form-button check-domain-button">
            <i class="fas fa-search"></i> Check Availability
        </button>
    </div>

    <!-- Email Addresses Section with Maximum Limit -->
    <div id="orgEmail" class="form-section orgemail-section orgemail-addresses">
        <label class="form-label">Email Addresses to Set Up (up to 5):</label>
        <div id="emailsContainer" class="emails-container" data-max-emails="5">
            <div class="email-section" data-email="1">
                <label for="email1Name" class="form-label email-name-label">Email Name:</label>
                <input type="text" id="email1Name" name="email1Name" class="form-input email-name-input" placeholder="e.g., info">
                <span id="email1Domain" class="email-domain">@my{{ 'community.org' if user_type == 'community' else 'store.uk' }}</span>
            </div>
        </div>
        <button type="button" data-action="addEmail" class="form-button add-email-button">
            <i class="fas fa-plus"></i> Add Another Email
        </button>
    </div>

    <!-- Pages Section -->
    <div id="orgPagesContainer" class="form-section">
        <!-- Pages Section Placeholder -->
        <div id="pagesContainer" class="orgpages-section">
            <!-- Pages HTML will be dynamically inserted here from the endpoint -->
        </div>
        <!-- Add New Page Button -->
        <button type="button" data-action="addPage" class="form-button add-page-button">
            <i class="fas fa-plus"></i> Add New Page
        </button>
    </div>

    <!-- Widgets Section -->
    <div id="orgWidgets" class="form-section orgwidgets-section">
        <label class="form-label">{{ 'Wix Widgets' if user_type == 'community' else 'Wix Store Widgets' }}:</label>
        <div class="widget-checkboxes">
            {% if user_type == 'community' %}
            <div class="widget-option">
                <label class="form-label widget-label">
                    <input type="checkbox" name="widgets" class="widget-checkbox" value="events"> Events
                </label> - Add an events calendar.
            </div>
            <div class="widget-option">
                <label class="form-label widget-label">
                    <input type="checkbox" name="widgets" class="widget-checkbox" value="socialMediaFeeds"> Social Media Feeds
                </label> - Display live social media feeds.
            </div>
            <div class="widget-option">
                <label class="form-label widget-label">
                    <input type="checkbox" name="widgets" class="widget-checkbox" value="gallery"> Gallery
                </label> - Showcase photos.
            </div>
            <div class="widget-option">
                <label class="form-label widget-label">
                    <input type="checkbox" name="widgets" class="widget-checkbox" value="contactForm"> Contact Form
                </label> - Simple contact form.
            </div>
            <div class="widget-option">
                <label class="form-label widget-label">
                    <input type="checkbox" name="widgets" class="widget-checkbox" value="blog"> Blog
                </label> - Share updates and stories.
            </div>
            <div class="widget-option">
                <label class="form-label widget-label">
                    <input type="checkbox" name="widgets" class="widget-checkbox" value="weather"> Weather
                </label> - Show real-time weather.
            </div>
            <div class="widget-option">
                <label class="form-label widget-label">
                    <input type="checkbox" name="widgets" class="widget-checkbox" value="socialMediaLinks"> Social Media Links
                </label> - Quick links to profiles.
            </div>
            {% else %}
            <div class="widget-option">
                <label class="form-label widget-label">
                    <input type="checkbox" name="widgets" class="widget-checkbox" value="productCatalog"> Product Catalog
                </label> - Display your products.
            </div>
            <div class="widget-option">
                <label class="form-label widget-label">
                    <input type="checkbox" name="widgets" class="widget-checkbox" value="checkout"> Checkout
                </label> - Enable direct purchases.
            </div>
            <div class="widget-option">
                <label class="form-label widget-label">
                    <input type="checkbox" name="widgets" class="widget-checkbox" value="cart"> Shopping Cart
                </label> - Add a cart for customers.
            </div>
            <div class="widget-option">
                <label class="form-label widget-label">
                    <input type="checkbox" name="widgets" class="widget-checkbox" value="promotions"> Promotions
                </label> - Highlight sales and discounts.
            </div>
            <div class="widget-option">
                <label class="form-label widget-label">
                    <input type="checkbox" name="widgets" class="widget-checkbox" value="contactForm"> Contact Form
                </label> - Customer inquiries.
            </div>
            {% endif %}
        </div>
    </div>

    <!-- Submit Button -->
    <button type="submit" class="form-button submit-request-button">
        <i class="fas fa-paper-plane"></i> Submit Request
    </button>

</form>