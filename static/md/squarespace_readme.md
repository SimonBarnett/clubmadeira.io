# Squarespace Module Creation for Club Madeira

This document explains how Squarespace uses modules (via Developer Mode) and provides a step-by-step guide to creating a module for clubmadeira.io. This will later be replaced with instructions on how to add the created module to a user’s Squarespace site.

## How Squarespace Uses Modules
Squarespace supports "modules" through Developer Mode, allowing custom code (HTML, CSS, JavaScript) and API integrations. Modules can add features like car part search for clubmadeira.io.

## Prerequisites
- A Squarespace account (sign up at [https://www.squarespace.com/signup](https://www.squarespace.com/signup)).
- Basic HTML, CSS, and JavaScript knowledge.
- Git and SFTP access (for Developer Mode).

## Step-by-Step Instructions

### Step 1: Sign Up for Squarespace
Go to [https://www.squarespace.com/signup](https://www.squarespace.com/signup) and create an account. Choose a plan (Business or higher for Developer Mode).

### Step 2: Create a Site
Start a new site with a template (e.g., "Commerce"). Name it (e.g., ClubMadeiraTest).

### Step 3: Enable Developer Mode
From the site dashboard, go to "Settings" > "Developer Mode". Toggle Developer Mode ON. Follow prompts to set up Git or SFTP access (SFTP recommended for simplicity).

### Step 4: Access Site Files
Use an SFTP client (e.g., FileZilla). Connect using credentials from Squarespace (e.g., host: sftp.squarespace.com, username/password provided). Download the site template files locally.

### Step 5: Create a Custom Module
Add a page: Locally, open pages/ and create clubmadeira-parts.page with this content: ``` --- layout: default --- <div id="parts-search"> <input type="text" id="searchInput" placeholder="Search Parts"> <button id="searchButton">Search</button> <div id="partsResults"></div> </div> ``` Add JavaScript: Open scripts/site.js and append: ``` document.addEventListener("DOMContentLoaded", function() { document.getElementById("searchButton").addEventListener("click", function() { var query = document.getElementById("searchInput").value; var results = "<p>Results for: " + query + "</p>"; document.getElementById("partsResults").innerHTML = results; }); }); ``` Style with CSS: Open styles/site.css and add: ``` #parts-search { margin: 20px; } #searchInput { padding: 5px; } #partsResults { margin-top: 10px; } ```

### Step 6: Upload and Test
Upload modified files via SFTP. In the Squarespace Editor, add the "Club Madeira Parts" page to the navigation. Preview and test the search functionality.

## Troubleshooting
- **SFTP Issues**: Verify credentials and connection.
- **Code Not Loading**: Clear Squarespace cache or check file paths.

## Next Steps
Integrate with Squarespace API for dynamic data. See [https://developers.squarespace.com/](https://developers.squarespace.com/) for API details. **Note**: This guide will be replaced with instructions on adding this module to a user’s Squarespace site.