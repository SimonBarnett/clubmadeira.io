<form id="siteRequestForm" class="settings-form">
    <input type="hidden" id="userType" value="{{ user_type }}">

    <label for="name">{{ 'Community Name' if user_type == 'community' else 'Store Name' }}:</label>
    <input type="text" id="name" name="name" placeholder="Enter your {{ 'community' if user_type == 'community' else 'store' }} name" required>

    <label for="about">{{ 'About Our Community' if user_type == 'community' else 'About Your Store' }}:</label>
    <textarea id="about" name="about" placeholder="Tell us about your {{ 'community' if user_type == 'community' else 'store' }}"></textarea>

    <label for="logos">{{ 'Community Logos' if user_type == 'community' else 'Store Logos' }}:</label>
    <input type="file" id="logos" name="logos" accept="image/*" multiple>
    <small>Upload up to 5 logos (e.g., main logo, secondary logos).</small>

    <label for="colorPrefs">Color Preferences:</label>
    <input type="text" id="colorPrefs" name="colorPrefs" placeholder="e.g., #FF5733, Blue">

    <label for="stylingDetails">Styling Details:</label>
    <textarea id="stylingDetails" name="stylingDetails" rows="4" placeholder="e.g., modern layout, bold fonts"></textarea>

    <label for="preferredDomain">Preferred Domain Name:</label>
    <input type="text" id="preferredDomain" name="preferredDomain" placeholder="e.g., my{{ 'community.org' if user_type == 'community' else 'store.uk' }}" oninput="updateEmailDomains()">
    <button type="button" data-action="checkDomainAvailability"><i class="fas fa-search"></i> Check Availability</button>

    <label>Email Addresses to Set Up (up to 5):</label>
    <div id="emailsContainer">
        <div class="email-section" data-email="1">
            <label for="email1Name">Email Name:</label>
            <input type="text" id="email1Name" name="email1Name" placeholder="e.g., info">
            <span id="email1Domain">@my{{ 'community.org' if user_type == 'community' else 'store.uk' }}</span>
        </div>
    </div>
    <button type="button" data-action="addEmail"><i class="fas fa-plus"></i> Add Another Email</button>

    <label>{{ 'Requested Pages (up to 5)' if user_type == 'community' else 'Required Pages' }}:</label>
    <div id="pagesContainer">
        {% if user_type == 'merchant' %}
            <!-- Fixed Home page -->
            <div class="page-section" data-page="1">
                <label for="page1Name">Page Name:</label>
                <input type="text" id="page1Name" name="page1Name" value="Home" readonly>
                <br><br>
                <label for="page1Content">Home Page Content:</label>
                <textarea id="page1Content" name="page1Content" placeholder="Describe your home page (e.g., welcome message, featured products)"></textarea>
                <label for="page1Images">Additional Images:</label>
                <input type="file" id="page1Images" name="page1Images" accept="image/*" multiple>
            </div>
            <!-- Fixed Returns Policy page -->
            <div class="page-section" data-page="2">
                <label for="page2Name">Page Name:</label>
                <input type="text" id="page2Name" name="page2Name" value="Returns Policy" readonly>
                <br><br>
                <label for="page2Content">Returns Policy Content:</label>
                <textarea id="page2Content" name="page2Content" placeholder="Outline your returns policy"></textarea>
                <label for="page2Images">Additional Images:</label>
                <input type="file" id="page2Images" name="page2Images" accept="image/*" multiple>
            </div>
        {% else %}
            <!-- Community starts with one customizable page -->
            <div class="page-section" data-page="1">
                <label for="page1Name">Page Name:</label>
                <input type="text" id="page1Name" name="page1Name" value="Home">
                <br><br>
                <label for="page1Content">Page Content:</label>
                <textarea id="page1Content" name="page1Content" placeholder="Describe this page"></textarea>
                <label for="page1Images">Additional Images:</label>
                <input type="file" id="page1Images" name="page1Images" accept="image/*" multiple>
            </div>
        {% endif %}
    </div>
    <button type="button" data-action="addPage"><i class="fas fa-plus"></i> Add Another Page</button>

    <label>{{ 'Wix Widgets' if user_type == 'community' else 'Wix Store Widgets' }}:</label>
    <div class="widget-checkboxes">
        {% if user_type == 'community' %}
            <div><label><input type="checkbox" name="widgets" value="events"> Events</label> - Add an events calendar.</div>
            <div><label><input type="checkbox" name="widgets" value="socialMediaFeeds"> Social Media Feeds</label> - Display live social media feeds.</div>
            <div><label><input type="checkbox" name="widgets" value="gallery"> Gallery</label> - Showcase photos.</div>
            <div><label><input type="checkbox" name="widgets" value="contactForm"> Contact Form</label> - Simple contact form.</div>
            <div><label><input type="checkbox" name="widgets" value="blog"> Blog</label> - Share updates and stories.</div>
            <div><label><input type="checkbox" name="widgets" value="weather"> Weather</label> - Show real-time weather.</div>
            <div><label><input type="checkbox" name="widgets" value="socialMediaLinks"> Social Media Links</label> - Quick links to profiles.</div>
        {% else %}
            <div><label><input type="checkbox" name="widgets" value="productCatalog"> Product Catalog</label> - Display your products.</div>
            <div><label><input type="checkbox" name="widgets" value="checkout"> Checkout</label> - Enable direct purchases.</div>
            <div><label><input type="checkbox" name="widgets" value="cart"> Shopping Cart</label> - Add a cart for customers.</div>
            <div><label><input type="checkbox" name="widgets" value="promotions"> Promotions</label> - Highlight sales and discounts.</div>
            <div><label><input type="checkbox" name="widgets" value="contactForm"> Contact Form</label> - Customer inquiries.</div>
        {% endif %}
    </div>

    <button type="button" data-action="saveSiteRequest"><i class="fas fa-paper-plane"></i> Submit Request</button>
</form>