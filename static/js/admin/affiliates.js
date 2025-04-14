// /static/js/admin/affiliates.js
console.log('affiliates.js - Script loaded at:', new Date().toISOString());

// Utility function to wait for a DOM element to be available
async function waitForElement(elementId, maxAttempts = 10, retryDelay = 100) {
    let attempts = 0;
    while (attempts < maxAttempts) {
        const element = document.getElementById(elementId);
        if (element) {
            console.log(`waitForElement - Found element ${elementId} after ${attempts + 1} attempts`);
            return element;
        }
        console.log(`waitForElement - Element ${elementId} not found, retrying (${attempts + 1}/${maxAttempts})...`);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
    throw new Error(`Element ${elementId} not found after ${maxAttempts} attempts`);
}

export async function loadAffiliates() {
    console.log('loadAffiliates - Loading affiliate programs at:', new Date().toISOString());

    // Wait for required DOM elements
    let iconsContainer, settingsContainer, form, readmeContainer;
    try {
        iconsContainer = await waitForElement('affiliate-icons');
        settingsContainer = await waitForElement('affiliate-settings-container');
        form = await waitForElement('affiliate-form');
        readmeContainer = await waitForElement('affiliate-readme-content');
    } catch (error) {
        console.error('loadAffiliates - Failed to find required DOM elements:', error.message);
        return;
    }

    try {
        const data = await window.fetchData('/settings/affiliate_key');
        console.log('loadAffiliates - Affiliate programs fetched:', data);

        // Check if settings is an array
        if (!data.settings || !Array.isArray(data.settings)) {
            console.warn('loadAffiliates - Invalid settings data:', data.settings);
            iconsContainer.innerHTML = '<p>Invalid affiliate programs data received.</p>';
            return;
        }

        if (data.settings.length === 0) {
            console.warn('loadAffiliates - No affiliate programs found');
            iconsContainer.innerHTML = '<p>No affiliate programs available.</p>';
            return;
        }

        iconsContainer.innerHTML = '';
        data.settings.forEach(setting => {
            const icon = document.createElement('i');
            icon.className = setting.icon || 'fas fa-link';
            icon.title = setting.comment || setting.key_type;
            icon.dataset.keyType = setting.key_type;
            icon.classList.add('affiliate-icon');
            icon.style.width = '24px';
            icon.style.height = '24px';
            icon.style.fontSize = '24px';
            icon.style.cursor = 'pointer';
            icon.addEventListener('click', () => {
                console.log(`loadAffiliates - Icon clicked for key_type: ${setting.key_type}`);
                Array.from(iconsContainer.children).forEach(i => i.classList.remove('selected'));
                icon.classList.add('selected');
                displayAffiliateFields(setting, settingsContainer, form, readmeContainer);
            });
            iconsContainer.appendChild(icon);
        });

        if (iconsContainer.children.length > 0) {
            console.log('loadAffiliates - Auto-selecting first affiliate program');
            iconsContainer.children[0].click();
        }
    } catch (error) {
        console.error('loadAffiliates - Error:', error.message, error.stack);
        iconsContainer.innerHTML = `<p>Error loading affiliate programs: ${error.message}</p>`;
        window.handleError('loadAffiliates', error, `Error loading affiliates: ${error.message}`);
    }
}

export async function displayAffiliateFields(setting, settingsContainer, form, readmeContainer) {
    console.log('displayAffiliateFields - Displaying fields for:', setting.key_type);

    // Ensure the settings container (form) is visible and readme is hidden initially
    settingsContainer.style.display = 'block';
    form.style.display = 'block'; // Ensure form is visible within settingsContainer
    readmeContainer.style.display = 'none';

    // Ensure the static content container and its parent are visible (safeguard)
    const staticContentContainer = form.parentElement.parentElement.querySelector('#affiliate-static-content');
    const affiliatesSection = form.parentElement.parentElement; // #affiliates
    if (staticContentContainer) {
        staticContentContainer.style.display = 'block';
    } else {
        console.warn('displayAffiliateFields - Static content container not found');
        return;
    }
    if (affiliatesSection) {
        affiliatesSection.style.display = 'block';
    } else {
        console.warn('displayAffiliateFields - Affiliates section not found');
        return;
    }

    // Populate static content (title, icon, description, links) into affiliate-static-content
    staticContentContainer.innerHTML = ''; // Clear existing content

    // Create header container
    const header = document.createElement('div');
    header.id = 'affiliate-header';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.marginBottom = '15px';

    // Add selected icon
    const selectedIcon = document.createElement('i');
    selectedIcon.className = 'selected-affiliate-icon ' + (setting.icon || 'fas fa-link');
    selectedIcon.style.fontSize = '16px';
    selectedIcon.style.color = 'currentColor';
    selectedIcon.style.marginRight = '10px';
    header.appendChild(selectedIcon);

    // Add heading
    const heading = document.createElement('h3');
    heading.className = 'affiliate-comment-heading';
    heading.style.display = 'inline-block';
    heading.style.verticalAlign = 'middle';
    heading.style.margin = '0';
    heading.textContent = setting.comment || `${setting.key_type} Settings`;
    header.appendChild(heading);

    // Add links container
    const linksContainer = document.createElement('div');
    linksContainer.style.marginLeft = 'auto';
    linksContainer.style.display = 'flex';
    linksContainer.style.gap = '10px';

    // Set up link elements
    const apiLink = setting.doc_link?.find(link => link.title === 'api')?.link;
    const signupLink = setting.doc_link?.find(link => link.title === 'signup')?.link;
    const readmeLink = setting.doc_link?.find(link => link.title === 'readme')?.link;

    const apiLinkElement = document.createElement('a');
    apiLinkElement.className = 'affiliate-api-link';
    apiLinkElement.style.color = 'currentColor';
    apiLinkElement.innerHTML = '<i class="fas fa-link" style="font-size: 16px;"></i>';
    if (apiLink) {
        apiLinkElement.href = apiLink;
        apiLinkElement.style.display = 'inline-block';
        apiLinkElement.target = '_blank';
    } else {
        apiLinkElement.style.display = 'none';
    }
    linksContainer.appendChild(apiLinkElement);

    const signupLinkElement = document.createElement('a');
    signupLinkElement.className = 'affiliate-signup-link';
    signupLinkElement.style.color = 'currentColor';
    signupLinkElement.innerHTML = '<i class="fas fa-user-plus" style="font-size: 16px;"></i>';
    if (signupLink) {
        signupLinkElement.href = signupLink;
        signupLinkElement.style.display = 'inline-block';
        signupLinkElement.target = '_blank';
    } else {
        signupLinkElement.style.display = 'none';
    }
    linksContainer.appendChild(signupLinkElement);

    const mdLinkElement = document.createElement('a');
    mdLinkElement.className = 'affiliate-readme-link';
    mdLinkElement.style.color = 'currentColor';
    mdLinkElement.innerHTML = '<i class="fas fa-book" style="font-size: 16px;"></i>';

    const keysLinkElement = document.createElement('a');
    keysLinkElement.className = 'affiliate-keys-link';
    keysLinkElement.style.color = 'currentColor';
    keysLinkElement.innerHTML = '<i class="fas fa-key" style="font-size: 16px;"></i>';

    if (readmeLink) {
        mdLinkElement.href = '#';
        mdLinkElement.style.display = 'inline-block';
        mdLinkElement.title = setting.comment || 'View Documentation';

        keysLinkElement.href = '#';
        keysLinkElement.style.display = 'none';

        mdLinkElement.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log(`displayAffiliateFields - Rendering markdown for ${setting.key_type}: ${readmeLink}`);
            try {
                // Toggle to show documentation (markdown)
                settingsContainer.style.display = 'none';
                readmeContainer.style.display = 'block';
                mdLinkElement.style.display = 'none';
                keysLinkElement.style.display = 'inline-block';

                // Render markdown content into readmeContainer
                const response = await fetch(readmeLink);
                if (!response.ok) throw new Error(`Failed to fetch markdown: ${response.status}`);
                const markdownText = await response.text();
                readmeContainer.innerHTML = marked.parse(markdownText);

                // Ensure static content and its parent remain visible
                staticContentContainer.style.display = 'block';
                affiliatesSection.style.display = 'block';
            } catch (error) {
                console.error('displayAffiliateFields - Error rendering markdown:', error.message, error.stack);
                readmeContainer.innerHTML = `<p>Error rendering markdown: ${error.message}</p>`;
                window.handleError('displayAffiliateFields', error, 'Failed to render documentation');
                // Reset visibility on error
                settingsContainer.style.display = 'block';
                readmeContainer.style.display = 'none';
                mdLinkElement.style.display = 'inline-block';
                keysLinkElement.style.display = 'none';
                staticContentContainer.style.display = 'block';
                affiliatesSection.style.display = 'block';
            }
            console.log('displayAffiliateFields - Visibility state after MD click:', {
                settingsContainer: settingsContainer.style.display,
                readmeContainer: readmeContainer.style.display,
                mdLinkElement: mdLinkElement.style.display,
                keysLinkElement: keysLinkElement.style.display,
                staticContentContainer: staticContentContainer.style.display,
                affiliatesSection: affiliatesSection.style.display,
            });
        });

        keysLinkElement.addEventListener('click', (e) => {
            e.preventDefault();
            console.log(`displayAffiliateFields - Switching back to fields for ${setting.key_type}`);
            // Toggle to show keys (fields)
            settingsContainer.style.display = 'block';
            readmeContainer.style.display = 'none';
            keysLinkElement.style.display = 'none';
            mdLinkElement.style.display = 'inline-block';
            // Ensure static content and its parent remain visible
            staticContentContainer.style.display = 'block';
            affiliatesSection.style.display = 'block';
            console.log('displayAffiliateFields - Visibility state after keys click:', {
                settingsContainer: settingsContainer.style.display,
                readmeContainer: readmeContainer.style.display,
                mdLinkElement: mdLinkElement.style.display,
                keysLinkElement: keysLinkElement.style.display,
                staticContentContainer: staticContentContainer.style.display,
                affiliatesSection: affiliatesSection.style.display,
            });
        });

        linksContainer.appendChild(mdLinkElement);
        linksContainer.appendChild(keysLinkElement);
    } else {
        mdLinkElement.style.display = 'none';
        keysLinkElement.style.display = 'none';
    }

    header.appendChild(linksContainer);
    staticContentContainer.appendChild(header);

    // Add description
    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'affiliate-description';
    descriptionElement.style.marginBottom = '15px';
    descriptionElement.textContent = setting.description || '';
    staticContentContainer.appendChild(descriptionElement);

    // Populate form fields into affiliate-form
    form.innerHTML = ''; // Clear existing content
    form.style.display = 'block';
    form.dataset.keyType = setting.key_type;

    // Add fields
    Object.entries(setting.fields).forEach(([name, value]) => {
        const div = document.createElement('div');
        div.className = 'affiliate-field';
        div.innerHTML = `
            <label for="${name}">${name}:</label>
            <input type="text" id="${name}" name="${name}" value="${value}">
        `;
        form.appendChild(div);
    });

    // Add save button
    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.className = 'btn';
    saveButton.style.marginTop = '10px';
    saveButton.style.color = 'currentColor';
    saveButton.style.padding = '5px 10px';
    saveButton.innerHTML = `
        <i class="fas fa-save" style="margin-right: 5px;"></i>Save Settings
    `;
    form.appendChild(saveButton);
}

console.log('affiliates.js - Script execution completed at:', new Date().toISOString());