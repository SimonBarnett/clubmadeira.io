# eBay UK Affiliate Signup Process

This document provides a detailed, step-by-step guide to signing up for the eBay UK Partner Network to obtain the `APP_ID` credential for use in the `clubmadeira.io` configuration.

## Prerequisites
- A valid email address.
- A website or platform (e.g., `clubmadeira.io`) to promote eBay products.
- Basic knowledge of affiliate marketing.

## Step-by-Step Instructions

### Step 1: Visit the eBay Partner Network Signup Page
- Open your browser and go to the eBay Partner Network signup page: [https://partnernetwork.ebay.com/](https://partnernetwork.ebay.com/).
- Click "Join Now" or "Sign Up".

### Step 2: Sign In or Register
- If you have an eBay account:
  - Enter your eBay username or email and password.
  - Click "Sign In".
- If you don’t have an account:
  - Click "Register".
  - Provide your email, create a password, and fill in personal details.
  - Verify your email address via the link sent to your inbox.

### Step 3: Start the Application
- After signing in, you’ll be directed to the eBay Partner Network application form.
- **Personal/Business Information**:
  - Enter your full name or business name.
  - Provide your address and contact details.

### Step 4: Add Your Website
- **Website Information**:
  - Enter your primary website URL (e.g., `https://clubmadeira.io`).
  - Describe your site (e.g., "A car parts and accessories platform").
  - List traffic sources (e.g., SEO, social media).
  - Ensure your site has some content (e.g., product listings or articles).

### Step 5: Agree to Terms
- Review the eBay Partner Network Agreement.
- Check the box to accept the terms.
- Click "Submit Application".

### Step 6: Wait for Approval
- eBay reviews applications within 1-5 business days.
- Check your email for approval notification.
- If denied, improve your site based on feedback (e.g., add content) and reapply.

### Step 7: Access Your Dashboard
- Once approved, log in to [https://partnernetwork.ebay.com/](https://partnernetwork.ebay.com/).
- Navigate to the dashboard.

### Step 8: Obtain Your APP_ID
- **Developer Account**:
  - Go to "Developer Program" via [https://developer.ebay.com/](https://developer.ebay.com/).
  - Sign in with your eBay credentials.
  - Click "Join" if not already enrolled in the eBay Developers Program.
- **Create an Application**:
  - Go to "My Apps" or "Application Keys".
  - Click "Create a Keyset" or "Generate Keys".
  - Name your app (e.g., `ClubMadeira_eBay`).
  - Select "Production" environment.
  - Generate keys; you’ll receive an `App ID` (Production Keyset).
- Copy the `App ID` (e.g., `ClubMade-1234-5678-9012`).

### Step 9: Update Config
- Open your `clubmadeira.io` configuration file (`config.json`).
- Locate the `"ebay_uk"` section.
- Enter your `APP_ID`:
  - `"APP_ID": "<your_app_id>"`
- Save and redeploy the configuration.

## Troubleshooting
- **Application Denied**: Ensure your site has content and complies with eBay policies; reapply.
- **No API Access**: Verify your Partner Network approval, then join the Developers Program.
- **Lost APP_ID**: Log into [https://developer.ebay.com/](https://developer.ebay.com/) to retrieve or regenerate keys.

## Next Steps
- Use the eBay Affiliate API to integrate eBay UK products into `clubmadeira.io`.
- See [https://developer.ebay.com/api-docs/static/ebay-affiliate-api.html](https://developer.ebay.com/api-docs/static/ebay-affiliate-api.html) for API details.