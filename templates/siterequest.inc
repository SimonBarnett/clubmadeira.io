<form id="siteRequestForm" class="settings-form site-request-form">
    <input type="hidden" id="userType" class="user-type-input" value="{{ user_type }}">

    <div id="orgname" class="form-section orgname-section">
        <label for="name" class="form-label">{{ 'Community Name' if user_type == 'community' else 'Store Name' }}:</label>
        <input type="text" id="name" name="name" class="form-input orgname-input"
            placeholder="Enter your {{ 'community' if user_type == 'community' else 'store' }} name" required>
    </div>

    <div id="aboutorg" class="form-section aboutorg-section">
        <label for="about" class="form-label">{{ 'About Our Community' if user_type == 'community' else 'About Your Store' }}:</label>
        <textarea id="about" name="about" class="mce-editor form-textarea aboutorg-textarea"
            placeholder="Tell us about your {{ 'community' if user_type == 'community' else 'store' }}"></textarea>
    </div>

    <div id="orglogos" class="form-section orglogos-section">
        <label for="logos" class="form-label">{{ 'Community Logos' if user_type == 'community' else 'Store Logos' }}:</label>
        <input type="file" id="logos" name="logos" class="form-file-input orglogos-input" accept="image/*" multiple>
        <small class="form-hint">Upload up to 5 logos (e.g., main logo, secondary logos).</small>
    </div>

    <div id="orgcolour" class="form-section orgcolour-section">
        <label for="colorPrefs" class="form-label">Color Preferences:</label>
        <input type="text" id="colorPrefs" name="colorPrefs" class="form-input orgcolour-input" placeholder="e.g., #FF5733, Blue">
    </div>

    <div id="orgStyle" class="form-section orgstyle-section">
        <label for="stylingDetails" class="form-label">Styling Details:</label>
        <textarea id="stylingDetails" name="stylingDetails" class="mce-editor form-textarea orgstyle-textarea" rows="4"
            placeholder="e.g., modern layout, bold fonts"></textarea>
    </div>

    <div id="orgEmail" class="form-section orgemail-section orgemail-domain">
        <label for="preferredDomain" class="form-label">Preferred Domain Name:</label>
        <input type="text" id="preferredDomain" name="preferredDomain" class="form-input orgemail-domain-input"
            placeholder="e.g., my{{ 'community.org' if user_type == 'community' else 'store.uk' }}"
            oninput="updateEmailDomains()">
        <button type="button" data-action="checkDomainAvailability" class="form-button check-domain-button">
            <i class="fas fa-search"></i> Check Availability
        </button>
    </div>

    <div id="orgEmail" class="form-section orgemail-section orgemail-addresses">
        <label class="form-label">Email Addresses to Set Up (up to 5):</label>
        <div id="emailsContainer" class="emails-container">
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

    <div id="orgPages" class="form-section orgpages-section">
        <label class="form-label">{{ 'Requested Pages (up to 5)' if user_type == 'community' else 'Required Pages' }}:</label>
        <div id="pagesContainer" class="pages-container">
            {% if user_type == 'merchant' %}
            <!-- Fixed Home page -->
            <div class="page-section" data-page="1">
                <label for="page1Name" class="form-label page-name-label">Page Name:</label>
                <input type="text" id="page1Name" name="page1Name" class="form-input page-name-input" value="Home" readonly>
                <br><br>
                <label for="page1Content" class="form-label page-content-label">Home Page Content:</label>
                <textarea id="page1Content" name="page1Content" class="mce-editor form-textarea page-content-textarea"
                    placeholder="Describe your home page (e.g., welcome message, featured products)"></textarea>
                <label for="page1Images" class="form-label page-images-label">Additional Images:</label>
                <input type="file" id="page1Images" name="page1Images" class="form-file-input page-images-input" accept="image/*" multiple>
            </div>
            <!-- Fixed Returns Policy page -->
            <div class="page-section" data-page="2">
                <label for="page2Name" class="form-label page-name-label">Page Name:</label>
                <input type="text" id="page2Name" name="page2Name" class="form-input page-name-input" value="Returns Policy" readonly>
                <br><br>
                <label for="page2Content" class="form-label page-content-label">Returns Policy Content:</label>
                <textarea id="page2Content" name="page2Content" class="mce-editor form-textarea page-content-textarea"
                    placeholder="Outline your returns policy"></textarea>
                <label for="page2Images" class="form-label page-images-label">Additional Images:</label>
                <input type="file" id="page2Images" name="page2Images" class="form-file-input page-images-input" accept="image/*" multiple>
            </div>
            {% else %}
            <!-- Community starts with one customizable page -->
            <div class="page-section" data-page="1">
                <label for="page1Name" class="form-label page-name-label">Page Name:</label>
                <input type="text" id="page1Name" name="page1Name" class="form-input page-name-input" value="Home">
                <br><br>
                <label for="page1Content" class="form-label page-content-label">Page Content:</label>
                <textarea id="page1Content" name="page1Content" class="mce-editor form-textarea page-content-textarea"
                    placeholder="Describe this page"></textarea>
                <label for="page1Images" class="form-label page-images-label">Additional Images:</label>
                <input type="file" id="page1Images" name="page1Images" class="form-file-input page-images-input" accept="image/*" multiple>
            </div>
            {% endif %}
        </div>
        <button type="button" data-action="addPage" class="form-button add-page-button">
            <i class="fas fa-plus"></i> Add Another Page
        </button>
    </div>

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

    <button type="button" data-action="saveSiteRequest" class="form-button submit-request-button">
        <i class="fas fa-paper-plane"></i> Submit Request
    </button>
</form>