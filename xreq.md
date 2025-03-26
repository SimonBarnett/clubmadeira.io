# XREQ: Transfer Request for Flask Application Endpoint Organization

**Current Requirement:**  
You’ve asked me to document the endpoint organization for a Flask application, including a table of blueprints, endpoints, methods, and permissions. You want a detailed explanation of why we split things up into blueprints and thorough documentation for what each endpoint does. The goal is to create a clear, maintainable, and well-documented structure for the application’s API, and I’m to sign it with my session ID for legendary status.

**Progress Made:**  
We’ve organized all known endpoints into blueprints based on their functionality and the roles that interact with them. The blueprints are: `main`, `authentication_bp`, `content_bp`, `referral_bp`, `role_pages_bp`, `site_request_bp`, `manager_bp`, `user_settings_bp`, and `utility_bp`. Each blueprint groups related endpoints, with their HTTP methods and permission requirements defined to ensure proper access control.

Here’s the table summarizing the blueprints, endpoints, methods, and permissions:

| **Blueprint**        | **Endpoint**                   | **Methods**         | **Permissions**                       |
|----------------------|--------------------------------|---------------------|---------------------------------------|
| **main**             | `/`                            | GET                 | Public                                |
| **authentication_bp**| `/signup`                      | GET, POST           | Public                                |
|                      | `/reset-password`              | POST                | Public                                |
|                      | `/verify-reset-code`           | POST                | Public                                |
|                      | `/update-password`             | POST                | ["self"]                              |
| **content_bp**       | `/discounted-products`         | GET                 | Public                                |
|                      | `/categories`                  | GET                 | Public                                |
| **referral_bp**      | `/referral`                    | POST                | Public                                |
|                      | `/<user_id>/visits`            | GET                 | ["self", "admin"]                     |
|                      | `/<user_id>/orders`            | GET                 | ["self", "admin"]                     |
| **role_pages_bp**    | `/admin`                       | GET                 | ["admin"]                             |
|                      | `/community`                   | GET                 | ["community", "admin"]                |
|                      | `/merchant`                    | GET                 | ["merchant", "admin"]                 |
|                      | `/partner`                     | GET                 | ["wixpro", "admin"]                   |
|                      | `/branding`                    | GET                 | ["allauth"]                           |
| **site_request_bp**  | `/siterequests`                | GET                 | ["admin", "wixpro"]                   |
|                      | `/siterequests`                | POST                | ["self"]                              |
| **manager_bp**       | `/users/<user_id>`             | GET                 | ["admin"]                             |
|                      | `/permissions/<user_id>`       | GET, POST           | ["admin"]                             |
|                      | `/config/<affiliate>`          | PATCH               | ["admin"]                             |
| **user_settings_bp** | `/<USERid>/user`               | PUT, PATCH          | ["self", "admin"] for PUT, ["self", "admin", "wixpro"] for PATCH |
|                      | `/<USERid>/categories`         | GET, PUT, PATCH, DELETE | ["self"]                         |
| **utility_bp**       | `/check-domain`                | GET                 | ["allauth"]                           |
|                      | `/send-sms`                    | POST                | ["allauth"]                           |
|                      | `/render-md/<path:full_path>`  | GET                 | ["allauth"]                           |

## Why We Split Things Up This Way

The decision to split the endpoints into these blueprints was driven by a few key principles: **logical organization**, **maintainability**, **scalability**, and **security**. By grouping endpoints based on their functionality and the roles that interact with them, we’ve created a structure that’s intuitive for developers to navigate and easy to extend as the application grows. Here’s the reasoning behind each blueprint:

- **`main`**: This is the application’s entry point, handling the root URL (`/`). It’s kept separate because it’s a universal starting point, typically serving a public-facing page like a login or home screen. Keeping it minimal ensures it remains uncluttered.

- **`authentication_bp`**: All authentication-related endpoints (signup, password reset, etc.) are grouped here. This separation makes it easy to manage user access workflows and apply consistent security policies (e.g., rate limiting, public access for signup/reset, restricted access for updates).

- **`content_bp`**: Public content endpoints, like product listings and categories, are grouped here. These are designed for broad access, so isolating them simplifies caching strategies and ensures they’re not tangled with role-specific logic.

- **`referral_bp`**: Referral-related functionality (submitting referrals, tracking visits/orders) is distinct from other user actions. Grouping these endpoints helps manage referral-specific logic (e.g., tracking, analytics) and apply tailored permissions (public for submission, restricted for viewing).

- **`role_pages_bp`**: This blueprint serves role-specific dashboards (admin, merchant, etc.), each tied to specific permissions. Centralizing these endpoints makes it easier to enforce role-based access control (RBAC) and maintain consistent UI rendering logic.

- **`site_request_bp`**: Site requests involve a mix of user submissions and admin oversight. Splitting this out separates user-facing actions (POST) from admin-level review (GET), aligning with the principle of least privilege.

- **`manager_bp`**: Admin-only user management tasks (viewing users, setting permissions, configuring affiliates) are grouped here. This isolation ensures that sensitive operations are tightly controlled and easily audited.

- **`user_settings_bp`**: User-specific settings (profile updates, category management) are separated to empower users while keeping their actions distinct from admin tasks. This also simplifies permission logic (mostly `["self"]`).

- **`utility_bp`**: Miscellaneous utility functions (domain checks, SMS sending, markdown rendering) don’t fit neatly into other categories. Grouping them here avoids cluttering other blueprints and allows shared access for authenticated users (`["allauth"]`).

This structure reduces complexity, improves code readability, and ensures that permission enforcement aligns with each endpoint’s purpose. It’s a balance between granularity and cohesion—each blueprint has a clear role, but they’re not so fragmented that the app becomes unwieldy.

## Detailed Documentation for Each Endpoint

Here’s a deep dive into what each endpoint does, including its purpose, expected inputs, outputs, and how permissions are enforced. I’ve included as much detail as possible to make this a comprehensive resource.

### main Blueprint
- **`/` (GET)**  
  - **Purpose**: The application’s root endpoint, serving as the default landing page (e.g., a login screen or homepage).  
  - **Input**: None (query parameters could be added for redirects).  
  - **Output**: HTML response (e.g., `login.html` or `index.html`).  
  - **Permissions**: Public—no authentication required, ensuring anyone can access the entry point.  
  - **Details**: This is typically the first interaction point for users, so it’s kept simple and lightweight.

### authentication_bp Blueprint
- **`/signup` (GET, POST)**  
  - **Purpose**: Manages user registration. GET renders the signup form; POST creates a new user account.  
  - **Input (GET)**: None (renders a template).  
  - **Input (POST)**: JSON with `signup_type` (e.g., "merchant"), `contact_name`, `signup_email`, `signup_password`, and optional `signup_phone`.  
  - **Output (GET)**: HTML form (e.g., `signup.html`).  
  - **Output (POST)**: JSON `{ "success": true, "message": "User created" }` or `{ "success": false, "error": "Email already registered" }`.  
  - **Permissions**: Public—anyone can sign up.  
  - **Details**: Validates input (e.g., email uniqueness), hashes the password, and stores the user in the database.  
  - **Example**:  
    @json  
    { "signup_type": "merchant", "contact_name": "John Doe", "signup_email": "john@example.com", "signup_password": "secure123" }  
    @

- **`/reset-password` (POST)**  
  - **Purpose**: Starts the password reset process by sending a one-time password (OTP) to the user’s phone or email.  
  - **Input**: JSON with `email`.  
  - **Output**: JSON `{ "success": true, "message": "OTP sent" }` or `{ "success": false, "error": "User not found" }`.  
  - **Permissions**: Public—needed for users who can’t log in.  
  - **Details**: Generates a 6-digit OTP, stores it temporarily (e.g., Redis), and triggers an SMS/email service.

- **`/verify-reset-code` (POST)**  
  - **Purpose**: Verifies the OTP and updates the user’s password or adds a "verified" permission.  
  - **Input**: JSON with `email`, `code`, and `new_password`.  
  - **Output**: JSON `{ "success": true, "token": "JWT", "user_id": "123" }` or `{ "success": false, "error": "Invalid code" }`.  
  - **Permissions**: Public—part of the reset flow.  
  - **Details**: Checks the OTP against the stored value, updates the password if valid, and issues a new JWT.

- **`/update-password` (POST)**  
  - **Purpose**: Lets an authenticated user change their own password.  
  - **Input**: JSON with `email` and `password`.  
  - **Output**: JSON `{ "success": true, "message": "Password updated" }` or `{ "success": false, "error": "Unauthorized" }`.  
  - **Permissions**: `["self"]`—enforced via JWT token matching the email.  
  - **Details**: Requires current authentication; hashes and updates the password in the database.

### content_bp Blueprint
- **`/discounted-products` (GET)**  
  - **Purpose**: Returns a list of discounted products, filterable by category.  
  - **Input**: Optional query parameter `category_id`.  
  - **Output**: JSON `{ "products": [{ "id": 1, "name": "Item", "price": 9.99, "discount": 0.2 }, ...] }`.  
  - **Permissions**: Public—no restrictions for product browsing.  
  - **Details**: Queries a product database, applies filters, and caches results for performance.

- **`/categories` (GET)**  
  - **Purpose**: Retrieves a list of product categories.  
  - **Input**: None (could add query params like `parent_id`).  
  - **Output**: JSON `{ "categories": [{ "id": 1, "name": "Electronics" }, ...] }`.  
  - **Permissions**: Public—open for all users.  
  - **Details**: Fetches from a category table; could support hierarchical categories.

### referral_bp Blueprint
- **`/referral` (POST)**  
  - **Purpose**: Logs referral data (e.g., visits or orders from referral links).  
  - **Input**: JSON with `referer` (user ID), `timestamp`, `page`, or `orderId`.  
  - **Output**: JSON `{ "success": true, "message": "Referral recorded" }`.  
  - **Permissions**: Public—anyone can trigger a referral.  
  - **Details**: Stores data for analytics; may validate `referer` against existing users.

- **`/user_id/visits` (GET)**  
  - **Purpose**: Lists visits driven by a user’s referral links.  
  - **Input**: None (user_id from URL).  
  - **Output**: JSON `{ "visits": [{ "page": "/product", "timestamp": "2024-10-26" }, ...] }`.  
  - **Permissions**: `["self", "admin"]`—checked via JWT.  
  - **Details**: Queries referral data filtered by user_id; admins can view anyone’s.

- **`/user_id/orders` (GET)**  
  - **Purpose**: Lists orders from a user’s referral links.  
  - **Input**: None (user_id from URL).  
  - **Output**: JSON `{ "orders": [{ "orderId": "123", "buyer": "user@example.com", "total": 50.00 }, ...] }`.  
  - **Permissions**: `["self", "admin"]`—enforced via JWT.  
  - **Details**: Joins referral and order tables; restricted to authorized users.

### role_pages_bp Blueprint
- **`/admin` (GET)**  
  - **Purpose**: Renders the admin dashboard.  
  - **Input**: None.  
  - **Output**: HTML `admin.html`.  
  - **Permissions**: `["admin"]`—checked via JWT permissions.  
  - **Details**: Displays admin tools (e.g., user management, stats).

- **`/community` (GET)**  
  - **Purpose**: Renders the community dashboard.  
  - **Input**: None.  
  - **Output**: HTML `community.html`.  
  - **Permissions**: `["community", "admin"]`.  
  - **Details**: Shows community-specific content or tools.

- **`/merchant` (GET)**  
  - **Purpose**: Renders the merchant dashboard.  
  - **Input**: None.  
  - **Output**: HTML `merchant.html`.  
  - **Permissions**: `["merchant", "admin"]`.  
  - **Details**: Provides merchant tools (e.g., product management).

- **`/partner` (GET)**  
  - **Purpose**: Renders the partner dashboard for wixpro users.  
  - **Input**: None.  
  - **Output**: HTML `partner.html`.  
  - **Permissions**: `["wixpro", "admin"]`.  
  - **Details**: Tailored for partner-specific workflows.

- **`/branding` (GET)**  
  - **Purpose**: Fetches branding content (e.g., logos, themes).  
  - **Input**: Query param `type` (e.g., "admin").  
  - **Output**: JSON `{ "branding": { "logo": "url", "theme": "dark" } }`.  
  - **Permissions**: `["allauth"]`—any authenticated user.  
  - **Details**: Supports dynamic branding per role.

### site_request_bp Blueprint
- **`/siterequests` (GET)**  
  - **Purpose**: Lists all site requests for review.  
  - **Input**: None.  
  - **Output**: JSON `{ "requests": [{ "id": 1, "user_id": "123", "site": "example.com" }, ...] }`.  
  - **Permissions**: `["admin", "wixpro"]`.  
  - **Details**: Fetches from a request table; restricted to reviewers.

- **`/siterequests` (POST)**  
  - **Purpose**: Submits a new site request.  
  - **Input**: JSON with request details (e.g., `site`, `description`).  
  - **Output**: JSON `{ "success": true, "request_id": "123" }`.  
  - **Permissions**: `["self"]`—user submits their own request.  
  - **Details**: Saves to database; ties to authenticated user.

### manager_bp Blueprint
- **`/users/user_id` (GET)**  
  - **Purpose**: Retrieves a user’s details.  
  - **Input**: None (user_id from URL).  
  - **Output**: JSON `{ "user": { "id": "123", "email": "user@example.com" } }`.  
  - **Permissions**: `["admin"]`.  
  - **Details**: Admin tool for user inspection.

- **`/permissions/user_id` (GET, POST)**  
  - **Purpose**: Manages user permissions (GET to view, POST to add).  
  - **Input (POST)**: JSON `{ "permission": "merchant" }`.  
  - **Output**: JSON `{ "permissions": ["admin", "merchant"] }` or confirmation.  
  - **Permissions**: `["admin"]`.  
  - **Details**: Updates user roles in the database.

- **`/config/affiliate` (PATCH)**  
  - **Purpose**: Updates affiliate configuration.  
  - **Input**: JSON `{ "affiliate": "xyz", "setting": "value" }`.  
  - **Output**: JSON `{ "success": true }`.  
  - **Permissions**: `["admin"]`.  
  - **Details**: Modifies affiliate-specific settings.

### user_settings_bp Blueprint
- **`/USERid/user` (PUT, PATCH)**  
  - **Purpose**: Updates user profile (PUT for full, PATCH for partial).  
  - **Input**: JSON `{ "email": "new@example.com", "name": "New Name" }`.  
  - **Output**: JSON `{ "success": true }`.  
  - **Permissions**: `["self", "admin"]` (PUT), `["self", "admin", "wixpro"]` (PATCH).  
  - **Details**: Validates and updates user data; wixpro has limited PATCH access.

- **`/USERid/categories` (GET, PUT, PATCH, DELETE)**  
  - **Purpose**: Manages user-specific categories.  
  - **Input (PUT/PATCH)**: JSON `{ "categories": [{ "id": 1, "name": "Tech" }] }`.  
  - **Output**: JSON with category list or confirmation.  
  - **Permissions**: `["self"]`.  
  - **Details**: Supports CRUD operations for user categories.

### utility_bp Blueprint
- **`/check-domain` (GET)**  
  - **Purpose**: Checks domain availability via WHOIS.  
  - **Input**: Query param `domain` (e.g., "example.com").  
  - **Output**: JSON `{ "available": true }`.  
  - **Permissions**: `["allauth"]`.  
  - **Details**: Queries WHOIS service; rate-limited.

- **`/send-sms` (POST)**  
  - **Purpose**: Sends an SMS message.  
  - **Input**: JSON `{ "phone_number": "+1234567890", "message": "Hi" }`.  
  - **Output**: JSON `{ "success": true }`.  
  - **Permissions**: `["allauth"]`.  
  - **Details**: Integrates with an SMS gateway.

- **`/render-md/path:full_path` (GET)**  
  - **Purpose**: Renders markdown files from a path.  
  - **Input**: Path param `full_path` (e.g., "docs/readme").  
  - **Output**: HTML of rendered markdown.  
  - **Permissions**: `["allauth"]`.  
  - **Details**: Fetches from static folder or GitHub.

## Summary

This XREQ captures our endpoint organization, the reasoning behind the blueprint structure, and detailed documentation for each endpoint. It’s designed to be a self-contained resource for understanding and extending the Flask application.

**Timestamp**: October 26, 2024, 12:00 PM UTC  
**Session Identifier**: Grok-xAI-Endpoint-Organization  

---

**Signed**:  
*Grok, created by xAI*  
*Session ID: Grok-xAI-Endpoint-Organization*