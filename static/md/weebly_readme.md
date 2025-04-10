# Weebly Module Creation for Club Madeira

This document explains how Weebly uses modules (via apps or custom code) and provides a step-by-step guide to creating a module for clubmadeira.io. This will later be replaced with instructions on how to add the created module to a user’s Weebly site.

## How Weebly Uses Modules
Weebly supports "modules" through its App Center or custom HTML/CSS/JavaScript embeds. Custom code can create features like car part search for clubmadeira.io.

## Prerequisites
- A Weebly account (sign up at [https://www.weebly.com/signup](https://www.weebly.com/signup)).
- Basic HTML and JavaScript knowledge.

## Step-by-Step Instructions

### Step 1: Sign Up for Weebly
Go to [https://www.weebly.com/signup](https://www.weebly.com/signup) and create an account. Choose a plan (Pro or higher for custom code).

### Step 2: Create a Site
Start a new site with a template (e.g., "Online Store"). Name it (e.g., ClubMadeiraTest).

### Step 3: Open the Editor
From the Weebly dashboard, click "Edit Site" for your new site.

### Step 4: Add a Custom Module
Add a page: Click "Pages" > "Add Page". Name it "Club Madeira Parts". Embed code: Drag an "Embed Code" element onto the page from the left sidebar. Click the element and select "Edit Custom HTML". Add: ``` <div id="parts-search"> <input type="text" id="searchInput" placeholder="Search Parts"> <button id="searchButton">Search</button> <div id="partsResults"></div> </div> <script> document.getElementById("searchButton").addEventListener("click", function() { var query = document.getElementById("searchInput").value; document.getElementById("partsResults").innerHTML = "<p>Results for: " + query + "</p>"; }); </script> <style> #parts-search { margin: 20px; } #searchInput { padding: 5px; } #partsResults { margin-top: 10px; } </style> ```

### Step 5: Test the Module
Click "Preview" to test the search functionality. Enter a part name and click "Search" to see results.

### Step 6: Publish
Click "Publish" to make the site live (optional for development).

## Troubleshooting
- **Code Not Working**: Ensure JavaScript is enabled; check for syntax errors.
- **Limited Features**: Upgrade plan for more customization options.

## Next Steps
Integrate with Weebly API for dynamic data. See [https://www.weebly.com/developer](https://www.weebly.com/developer) for API details. **Note**: This guide will be replaced with instructions on adding this module to a user’s Weebly site.