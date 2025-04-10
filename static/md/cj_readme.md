# CJ Affiliate Signup Process

This document provides a detailed, step-by-step guide to signing up for the CJ Affiliate Program to obtain the `API_KEY` and `WEBSITE_ID` credentials for use in the `clubmadeira.io` configuration.

## Prerequisites
- A valid email address.
- A website (e.g., `clubmadeira.io`) with content for promotion.
- Basic affiliate marketing knowledge.

## Step-by-Step Instructions

### Step 1: Visit the CJ Signup Page
- Open your browser and go to the CJ Affiliate publisher signup page: [https://signup.cj.com/member/signup/publisher/](https://signup.cj.com/member/signup/publisher/).
- Click "Sign Up" or "Join Now".

### Step 2: Create an Account
- **Account Details**:
  - Enter your email address and create a password.
  - Provide your full name and company name (if applicable, use `Club Madeira` or your personal name).
  - Select your country (e.g., UK).

### Step 3: Fill Out the Application
- **Website Information**:
  - Enter your website URL (e.g., `https://clubmadeira.io`).
  - Describe your site (e.g., "Car parts and accessories platform").
  - Specify promotional methods (e.g., content marketing, social media).
- **Business Details**:
  - Provide your address and phone number.
  - Select your primary audience (e.g., UK).

### Step 4: Submit Application
- Agree to CJ’s terms and conditions.
- Click "Submit" or "Join CJ".

### Step 5: Wait for Approval
- CJ reviews applications within 1-5 business days.
- Check your email for approval or requests for more information.
- If rejected, improve your site (e.g., add content) and reapply.

### Step 6: Access Your CJ Account
- Once approved, log in to [https://members.cj.com/](https://members.cj.com/).

### Step 7: Get Your WEBSITE_ID
- **Website ID**:
  - Go to "Account" > "Websites".
  - Your `WEBSITE_ID` is listed next to your approved site (e.g., a numeric ID like `1234567`).
  - Copy this ID.

### Step 8: Obtain Your API_KEY
- **API Access**:
  - Navigate to "Account" > "API Keys" or "Developer Portal" (may require contacting support).
  - Request API access if not available (mention your publisher status).
  - Generate an `API_KEY` (e.g., a long string like `abcdef123456`).
  - Copy the `API_KEY`.

### Step 9: Update Config
- Open your `clubmadeira.io` configuration file (`config.json`).
- Locate the `"cj"` section.
- Enter your credentials:
  - `"API_KEY": "<your_api_key>"`
  - `"WEBSITE_ID": "<your_website_id>"`
- Save and redeploy the configuration.

## Troubleshooting
- **Application Denied**: Ensure your site meets CJ’s content standards; reapply.
- **API Access Missing**: Contact CJ support to enable API for your account.
- **Lost Credentials**: Retrieve or regenerate in the CJ dashboard.

## Next Steps
- Use the CJ API to integrate affiliate links into `clubmadeira.io`.
- See [https://developers.cj.com/](https://developers.cj.com/) for API details.