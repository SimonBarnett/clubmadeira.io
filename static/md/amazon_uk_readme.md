# Amazon UK Affiliate Signup Process

This document provides a detailed, step-by-step guide to signing up for the Amazon UK Affiliate Program (Amazon Associates) to obtain the necessary credentials (`ACCESS_KEY`, `SECRET_KEY`, `ASSOCIATE_TAG`, `COUNTRY`) for use in the `clubmadeira.io` configuration.

## Prerequisites
- A valid email address.
- A website or blog (Amazon requires you to have a platform to promote products; `clubmadeira.io` can be used if already set up).
- Basic understanding of affiliate marketing.

## Step-by-Step Instructions

### Step 1: Visit the Amazon Associates Signup Page
- Open your web browser and navigate to the Amazon UK Associates signup page: [https://affiliate-program.amazon.co.uk](https://affiliate-program.amazon.co.uk).
- Click on the "Join Now for Free" button.

### Step 2: Sign In or Create an Amazon Account
- If you have an existing Amazon UK account:
  - Enter your email address or phone number and password.
  - Click "Sign In".
- If you don’t have an account:
  - Click "Create your Amazon account".
  - Provide your name, email address, and a secure password.
  - Click "Create your Amazon account" and verify your email if prompted.

### Step 3: Start the Application Process
- After signing in, you’ll be directed to the Amazon Associates application form.
- **Account Information**:
  - Select your preferred language (e.g., English).
  - Enter your full name and address (ensure this matches your legal details for payment purposes).
  - Provide a phone number for verification.

### Step 4: Specify Your Website
- **Website and Mobile Apps**:
  - Enter the URL of your primary website (e.g., `https://clubmadeira.io`).
  - If you have additional sites or apps, list them (optional).
  - Amazon requires at least one valid site; ensure it has some content (e.g., blog posts or product pages) before submission.

### Step 5: Profile Details
- **Associate ID**:
  - Create a unique Associate ID (e.g., `clubmadeira-21`). This will be your `ASSOCIATE_TAG`.
  - Write this down; you’ll need it for the config.
- **Website Description**:
  - Describe what your website is about (e.g., "Club Madeira is a platform for car enthusiasts to find parts and accessories").
  - Specify the primary content type (e.g., blog, reviews, e-commerce).
- **Traffic Sources**:
  - Select how you drive traffic (e.g., organic search, social media).
  - Be honest; Amazon reviews this.

### Step 6: Verify Your Identity
- **Phone Verification**:
  - Enter your phone number.
  - Choose to receive a call or SMS for a verification code.
  - Enter the code provided to proceed.

### Step 7: Submit Application
- Review all entered information.
- Check the box to agree to the Amazon Associates Operating Agreement.
- Click "Finish" to submit your application.

### Step 8: Wait for Approval
- Amazon will review your application (typically within 1-3 business days).
- You’ll receive an email notification with approval status.
- If rejected, review the feedback (e.g., insufficient content) and reapply after addressing issues.

### Step 9: Access Your Credentials
- Once approved, log in to your Amazon Associates account at [https://affiliate-program.amazon.co.uk](https://affiliate-program.amazon.co.uk).
- **Associate Tag**:
  - Your `ASSOCIATE_TAG` is the Associate ID you created (e.g., `clubmadeira-21`).
- **API Access (ACCESS_KEY, SECRET_KEY)**:
  - Navigate to "Tools" > "Product Advertising API".
  - Click "Sign Up Now" for API access (requires an approved account with some activity).
  - Follow prompts to generate your `ACCESS_KEY` and `SECRET_KEY`.
  - Note: Initial API access may require 3 qualifying sales within 180 days of signup.
- **COUNTRY**:
  - Set to "UK" for Amazon UK.

### Step 10: Update Config
- Open your `clubmadeira.io` configuration file (`config.json`).
- Locate the `"amazon_uk"` section.
- Enter your credentials:
  - `"ACCESS_KEY": "<your_access_key>"`
  - `"SECRET_KEY": "<your_secret_key>"`
  - `"ASSOCIATE_TAG": "<your_associate_id>"`
  - `"COUNTRY": "UK"`
- Save the file and redeploy the configuration as needed.

## Troubleshooting
- **Application Rejected**: Ensure your website has sufficient content (e.g., 10+ posts) and resubmit.
- **API Access Denied**: Generate some affiliate sales first, then reapply for API access.
- **Lost Credentials**: Log back into Amazon Associates to retrieve your `ASSOCIATE_TAG`; regenerate API keys if needed.

## Next Steps
- Use the Product Advertising API to integrate Amazon UK products into `clubmadeira.io`.
- Refer to the developer documentation at [https://webservices.amazon.com/paapi5/documentation/](https://webservices.amazon.com/paapi5/documentation/) for API usage.