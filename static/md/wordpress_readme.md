# WordPress Module Creation for Club Madeira

This document explains how WordPress uses modules (plugins) and provides a step-by-step guide to creating a plugin for clubmadeira.io. This will later be replaced with instructions on how to add the created plugin to a user's WordPress site.

## How WordPress Uses Modules
WordPress uses "modules" as plugins—custom PHP code extending site functionality. Plugins can add features like car part listings or search for clubmadeira.io. They leverage WordPress APIs (e.g., REST API, shortcodes) for integration.

## Prerequisites
- A WordPress site (sign up at [https://wordpress.com/start](https://wordpress.com/start)).
- Basic PHP and WordPress development knowledge.
- Local development environment (e.g., XAMPP) or access to a WordPress install.

## Step-by-Step Instructions

### Step 1: Sign Up or Access WordPress
Go to [https://wordpress.com/start](https://wordpress.com/start) and create a site, or log in to an existing one. For self-hosted, download WordPress from [https://wordpress.org/download/](https://wordpress.org/download/) and install it locally or on a server following their instructions.

### Step 2: Set Up Development Environment
Access your WordPress installation’s file system (e.g., via FTP or local wp-content/plugins/). Navigate to the wp-content/plugins/ directory where plugins are stored.

### Step 3: Create a Plugin Folder
In the wp-content/plugins/ directory, create a new folder named clubmadeira-parts. This will contain your plugin files.

### Step 4: Write the Plugin Code
Create a file named clubmadeira-parts.php inside the clubmadeira-parts folder. Open it in a text editor and add the following code: ```php <?php /* Plugin Name: Club Madeira Parts Description: A plugin to display car parts for clubmadeira.io. Version: 1.0 Author: Club Madeira Team */ function clubmadeira_parts_search() { ob_start(); ?> <form method="post"> <input type="text" name="part_search" id="part_search" placeholder="Search Parts"> <button type="submit">Search</button> </form> <?php if ($_SERVER["REQUEST_METHOD"] == "POST" && !empty($_POST["part_search"])) { $search = sanitize_text_field($_POST["part_search"]); echo "<p>Search results for: " . esc_html($search) . "</p>"; $args = array( 'post_type' => 'part', 's' => $search ); $query = new WP_Query($args); if ($query->have_posts()) { while ($query->have_posts()) { $query->the_post(); echo '<div>' . get_the_title() . ' - $' . get_post_meta(get_the_ID(), 'price', true) . '</div>'; } } else { echo "<p>No parts found.</p>"; } wp_reset_postdata(); } return ob_get_clean(); } add_shortcode('clubmadeira_parts', 'clubmadeira_parts_search'); function clubmadeira_register_parts() { register_post_type('part', array( 'labels' => array('name' => 'Parts', 'singular_name' => 'Part'), 'public' => true, 'has_archive' => true, 'supports' => array('title', 'editor') )); register_post_meta('part', 'price', array('type' => 'string', 'single' => true, 'show_in_rest' => true)); } add_action('init', 'clubmadeira_register_parts'); ``` This code defines a plugin with a shortcode [clubmadeira_parts] that creates a searchable parts list using a custom post type called "part".

### Step 5: Activate the Plugin
Log in to your WordPress admin panel (e.g., http://localhost/wp-admin or yourdomain.com/wp-admin). Go to **Plugins** > **Installed Plugins**. Find "Club Madeira Parts" in the list and click **Activate**.

### Step 6: Add Parts Data
In the admin menu, go to **Parts** > **Add New**. Create a new part with a title (e.g., "Brake Pad"). In the custom fields section, add a field named "price" with a value (e.g., "29.99"). If custom fields aren’t visible, enable them under **Screen Options** at the top. Click **Publish** to save. Add more parts as needed.

### Step 7: Add the Shortcode
Go to **Pages** > **Add New**, or edit an existing page. In the editor, insert [clubmadeira_parts] where you want the search form. Save or update the page, then click **Preview** to test. Enter a part name (e.g., "Brake Pad") and click **Search** to see results.

## Troubleshooting
- **Shortcode Not Working**: Ensure the plugin is activated and check for PHP errors by enabling debug mode in wp-config.php with define('WP_DEBUG', true);.
- **No Results**: Verify parts are added under the "Parts" post type and the price field is set correctly.

## Next Steps
Enhance the plugin with REST API integration for clubmadeira.io. Refer to [https://developer.wordpress.com/docs/api/](https://developer.wordpress.com/docs/api/) for API details. **Note**: This guide will be replaced with instructions on how to add this plugin to a user's WordPress site.