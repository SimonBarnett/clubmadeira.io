# Joomla Module Creation for Club Madeira

This document explains how Joomla uses modules and provides a step-by-step guide to creating a module for clubmadeira.io. This will later be replaced with instructions on how to add the created module to a user’s Joomla site.

## How Joomla Uses Modules
Joomla uses "modules" as extensions to display content or functionality (e.g., car part search). Modules are PHP-based and can integrate with Joomla’s API.

## Prerequisites
- A Joomla site (download from [https://www.joomla.org/download.html](https://www.joomla.org/download.html)).
- Basic PHP knowledge.
- Local server (e.g., XAMPP) or hosting with Joomla installed.

## Step-by-Step Instructions

### Step 1: Set Up Joomla
Download Joomla from [https://www.joomla.org/download.html](https://www.joomla.org/download.html). Install locally or on a server (follow Joomla’s installation guide).

### Step 2: Create a Module Folder
Navigate to modules/ in your Joomla installation. Create a folder named mod_clubmadeira_parts.

### Step 3: Create Module Files
Create mod_clubmadeira_parts.php with: ``` <?php defined('_JEXEC') or die; $search = JFactory::getApplication()->input->get('part_search', '', 'string'); ?> <form method="post"> <input type="text" name="part_search" placeholder="Search Parts"> <button type="submit">Search</button> </form> <?php if ($search): ?> <p>Results for: <?php echo htmlspecialchars($search); ?></p> <?php $db = JFactory::getDbo(); $query = $db->getQuery(true) ->select('*') ->from('#__clubmadeira_parts') ->where('name LIKE ' . $db->quote('%' . $search . '%')); $db->setQuery($query); $results = $db->loadObjectList(); foreach ($results as $result) { echo '<div>' . $result->name . ' - $' . $result->price . '</div>'; } ?> <?php endif; ?> ``` Create mod_clubmadeira_parts.xml with: ``` <?xml version="1.0" encoding="utf-8"?> <extension type="module" version="3.9" client="site" method="upgrade"> <name>Club Madeira Parts</name> <author>Club Madeira Team</author> <version>1.0</version> <description>Car parts search module</description> <files> <filename module="mod_clubmadeira_parts">mod_clubmadeira_parts.php</filename> <filename>mod_clubmadeira_parts.xml</filename> </files> </extension> ```

### Step 4: Create a Database Table
Access your Joomla database (e.g., via phpMyAdmin). Run: ``` CREATE TABLE #__clubmadeira_parts ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), price DECIMAL(10,2) ); INSERT INTO #__clubmadeira_parts (name, price) VALUES ('Brake Pad', 29.99); ```

### Step 5: Install the Module
Zip the mod_clubmadeira_parts folder. In Joomla admin (e.g., http://localhost/administrator), go to "Extensions" > "Manage" > "Install". Upload the zip file.

### Step 6: Activate and Test
Go to "Extensions" > "Modules". Find "Club Madeira Parts", set position (e.g., position-7), and enable it. Visit your site and test the search.

## Troubleshooting
- **Module Not Showing**: Check position and status in Module Manager.
- **DB Errors**: Verify table creation and permissions.

## Next Steps
Enhance with Joomla API integration. See [https://docs.joomla.org/Joomla_API](https://docs.joomla.org/Joomla_API) for details. **Note**: This guide will be replaced with instructions on adding this module to a user’s Joomla site.