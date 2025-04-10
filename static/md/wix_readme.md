# Wix Module Creation for Club Madeira

This document explains how Wix uses modules and provides a step-by-step guide to creating a module for `clubmadeira.io` using Wix’s Velo platform. This will later be replaced with instructions on how to add the created module to a user’s Wix site.

## How Wix Uses Modules
- Wix uses "modules" via Velo, a full-stack development platform integrated into Wix.
- Velo allows you to add custom code (JavaScript, APIs) to Wix sites, creating dynamic features like car part search or listings for `clubmadeira.io`.
- Modules are reusable code blocks or integrations that enhance site functionality.

## Prerequisites
- A Wix account (sign up at [https://www.wix.com/signup](https://www.wix.com/signup)).
- Basic JavaScript knowledge.
- Access to the Wix Editor and Velo.

## Step-by-Step Instructions

### Step 1: Create or Log In to Your Wix Account
- Go to [https://www.wix.com/signup](https://www.wix.com/signup) and sign up, or log in at [https://www.wix.com/](https://www.wix.com/).
- Use your email and a secure password.

### Step 2: Set Up a Wix Site
- From the Wix dashboard, click "Create New Site".
- Choose a template (e.g., "Business" or "Online Store").
- Name your site (e.g., `ClubMadeiraTest`); this can be temporary for development.

### Step 3: Enable Velo
- Open the Wix Editor for your site.
- Click "Dev Mode" in the top bar and toggle "Enable Velo" to ON.
- This activates Velo’s coding features.

### Step 4: Create a Custom Module
- **Add a Page**:
  - In the Editor, click "Pages" > "Add Page".
  - Name it "Club Madeira Parts" (or similar).
- **Design the UI**:
  - Add elements like a search bar (Text Input), a button (Button), and a repeater (Repeater) for part listings.
  - Assign IDs: `searchInput`, `searchButton`, `partsRepeater`.
- **Add Backend Code**:
  - In the left panel, click "Code Files" > "+ New.js" under "Backend".
  - Name it `clubmadeira.jsw`.
  - Add a function to fetch data (example):
    ```
    import wixData from 'wix-data';

    export async function getClubMadeiraParts(query) {
        const results = await wixData.query("ClubMadeiraParts")
            .contains("name", query)
            .find();
        return results.items;
    }
    ```
- **Add Frontend Code**:
  - On the page, right-click `searchButton`, select "View Properties" > "OnClick" > "Add Code".
  - Write:
    ```
    import { getClubMadeiraParts } from 'backend/clubmadeira.jsw';

    $w.onReady(function () {
        $w("#searchButton").onClick(async () => {
            const query = $w("#searchInput").value;
            const parts = await getClubMadeiraParts(query);
            $w("#partsRepeater").data = parts;
            $w("#partsRepeater").forEachItem(($item, itemData) => {
                $item("#partName").text = itemData.name;
                $item("#partPrice").text = itemData.price;
            });
        });
    });
    ```
- **Create a Database**:
  - Go to "Databases" in the left panel > "+ Create Collection".
  - Name it `ClubMadeiraParts`.
  - Add fields: `name` (Text), `price` (Number).
  - Insert sample data (e.g., `{ "name": "Brake Pad", "price": "29.99" }`).

### Step 5: Test the Module
- Click "Preview" in the Editor.
- Enter a part name in the search bar and click the button.
- Verify the repeater displays matching parts.

### Step 6: Save and Publish
- Save your work in the Editor.
- Publish the site to test live (optional for development).

## Troubleshooting
- **Velo Not Enabled**: Ensure "Dev Mode" is ON.
- **Code Errors**: Check the console (F12) for syntax issues.
- **No Data**: Verify database permissions are set to "Site Content" readable.

## Next Steps
- This module can be integrated into `clubmadeira.io` via the Wix API.
- Refer to [https://dev.wix.com/api/rest/wix-stores](https://dev.wix.com/api/rest/wix-stores) for API details.
- **Note**: This guide will be replaced with instructions on adding this module to a user’s Wix site.