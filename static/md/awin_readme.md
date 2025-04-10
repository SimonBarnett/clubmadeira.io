# Awin Affiliate Signup Process

This document provides a detailed, step-by-step guide to signing up for the Awin Affiliate Program to obtain the `API_TOKEN` credential for use in the `clubmadeira.io` configuration.

## Prerequisites
- A valid email address.
- A website or platform (e.g., `clubmadeira.io`) with some content.
- Understanding of affiliate marketing basics.

## Step-by-Step Instructions

### Step 1: Visit the Awin Signup Page
- Open your browser and navigate to the Awin affiliate signup page: [https://www.awin.com/gb/affiliates](https://www.awin.com/gb/affiliates).
- Click "Sign Up" or "Join as an Affiliate".

### Step 2: Register an Account
- **Account Creation**:
  - Enter your email address and create a password.
  - Click "Continue" or "Sign Up".
  - Verify your email by clicking the link sent to your inbox.

### Step 3: Complete the Application Form
- **Personal Details**:
  - Provide your full name, address, and phone number.
- **Website Information**:
  - Enter your website URL (e.g., `https://clubmadeira.io`).
  - Describe your site (e.g., "A platform for car parts and accessories").
  - Select your promotional methods (e.g., content, social media).
- **Preferences**:
  - Choose your preferred currency (e.g., GBP for UK).

### Step 4: Submit Application
- Review your details.
- Agree to Awin’s terms and conditions.
- Click "Submit" or "Join Now".

### Step 5: Wait for Approval
- Awin reviews applications within 1-7 business days.
- Monitor your email for approval or additional information requests.
- If denied, enhance your site (e.g., add more content) and reapply.

### Step 6: Access Your Awin Dashboard
- Once approved, log in to [https://ui.awin.com/](https://ui.awin.com/) with your credentials.

### Step 7: Obtain Your API_TOKEN
- **API Access**:
  - Go to "Account" > "API Credentials" or "Developer Settings".
  - If not visible, contact Awin support to request API access (mention your affiliate status).
  - Generate an `API_TOKEN` (a long alphanumeric string).
- Copy the `API_TOKEN`.

### Step 8: Update Config
- Open your `clubmadeira.io` configuration file (`config.json`).
- Locate the `"awin"` section.
- Enter your `API_TOKEN`:
  - `"API_TOKEN": "<your_api_token>"`
- Save and redeploy the configuration.

## Troubleshooting
- **Delayed Approval**: Ensure your site has unique content; contact support if delayed.
- **No API Option**: Confirm your account is fully approved; request API access via support.
- **Lost Token**: Regenerate it in the Awin dashboard.

## Next Steps
- Use the Awin API to integrate affiliate links into `clubmadeira.io`.
- Refer to [https://ui.awin.com/developer](https://ui.awin.com/developer) for API documentation.