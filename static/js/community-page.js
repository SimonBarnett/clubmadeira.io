// community-page.js

// Store cumulative deselections locally
let cumulativeDeselections = [];

// Handle category form submission
window.handleCategorySubmit = async function(event) {
    event.preventDefault();
    event.stopPropagation();

    const form = document.getElementById('category-form');
    if (!form) {
        toastr.error('Form not found');
        return false;
    }

    const promptInput = document.getElementById('prompt');
    if (!promptInput || !promptInput.value.trim()) {
        toastr.error('Prompt is required.');
        return false;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
        // Update deselected categories before submitting
        updateDeselected();

        const formData = new FormData(form);
        // Ensure categories is a stringified JSON for consistency
        const categories = formData.get('categories') ? JSON.parse(formData.get('categories')) : {};
        formData.set('categories', JSON.stringify(categories));

        // Log form data for debugging
        console.log('handleCategorySubmit - Form data:', Object.fromEntries(formData));

        // Attempt real POST request
        let data;
        try {
            const response = await fetch('/categories', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error(`Failed to submit categories: ${response.status}`);
            data = await response.json();
        } catch (fetchError) {
            console.warn('handleCategorySubmit - API call failed, using demo mode:', fetchError.message);
            // Fallback to demo mode
            data = {
                categories: promptInput.value.trim() ? {
                    "Activities": ["Camping", "Hiking", "Crafts"],
                    "Skills": ["First Aid", "Knot Tying", "Navigation"],
                    "Community": ["Volunteering", "Team Building", "Leadership"]
                } : {},
                deselected: formData.get('deselected') ? JSON.parse(formData.get('deselected')) : [],
                previous_deselected: formData.get('previous_deselected') ? JSON.parse(formData.get('previous_deselected')) : [],
                prompt: promptInput.value,
                error_message: null
            };
        }

        if (data.error_message) {
            throw new Error(data.error_message);
        }

        updateCategoriesSection(data);
    } catch (error) {
        console.error('handleCategorySubmit - Error:', error.message);
        toastr.error(`Error: ${error.message}`);
    } finally {
        if (submitButton) submitButton.disabled = false;
    }

    return false;
};

// Save current category state
window.handleSaveCategories = async function() {
    console.log('handleSaveCategories - Saving categories');
    const form = document.getElementById('category-form');
    if (!form) {
        console.error('handleSaveCategories - Form not found');
        toastr.error('Form not found');
        return;
    }

    updateDeselected();
    const formData = new FormData(form);
    const categories = formData.get('categories') ? JSON.parse(formData.get('categories')) : {};
    formData.set('categories', JSON.stringify(categories));

    const saveButton = form.querySelector('button[onclick="handleSaveCategories()"]');
    if (saveButton) saveButton.disabled = true;
    try {
        toastr.success('Categories saved successfully (demo mode).');
    } catch (error) {
        console.error('handleSaveCategories - Error saving categories:', error.message);
        toastr.error(`Error: ${error.message}`);
    } finally {
        if (saveButton) saveButton.disabled = false;
    }
};

// Reset categories to initial state
window.handleResetCategories = async function() {
    console.log('handleResetCategories - Resetting categories');
    const resetButton = document.querySelector('button[onclick="handleResetCategories()"]');
    if (resetButton) resetButton.disabled = true;
    try {
        cumulativeDeselections = []; // Clear deselections
        const data = {
            categories: {},
            deselected: [],
            previous_deselected: [],
            prompt: "",
            error_message: null,
            status: 'success',
            message: 'Categories reset successfully (demo mode).'
        };
        toastr.success(data.message);
        updateCategoriesSection(data);
    } catch (error) {
        console.error('handleResetCategories - Error resetting categories:', error.message);
        toastr.error(`Error: ${error.message}`);
    } finally {
        if (resetButton) resetButton.disabled = false;
    }
};

// Initialize the community page
window.initializeCommunity = function(pageType) {
    console.log('initializeCommunity - Initializing community page with type:', pageType);

    const initFunctions = [
        () => {
            const userId = localStorage.getItem('userId');
            if (userId) {
                localStorage.setItem('userId', userId);
                const userIdInput = document.getElementById('userId');
                if (userIdInput) userIdInput.value = userId;
                console.log('initializeCommunity - Calling loadCategories with userId:', userId);
                loadCategories(userId, false);
            }
        },
        () => waitForTinyMCE(() => initializeTinyMCE('#aboutCommunity, #stylingDetails, #page1Content')),
        loadVisits,
        loadOrders,
        setupCollapsibleSections,
        setupWebsiteProviders
    ];

    initFunctions.forEach(fn => {
        try {
            fn();
        } catch (error) {
            console.error(`initializeCommunity - Error in ${fn.name || 'anonymous'}:`, error.message);
            toastr.error(`Initialization error: ${error.message}`);
        }
    });
};

// Load categories from the server
async function loadCategories(userId, isAdmin) {
    console.log('loadCategories - Loading categories for user:', userId, 'isAdmin:', isAdmin);
    try {
        // Simulate fetching user-settings (replace with actual API call)
        let userSettings = {}; // Assume no data from user-settings
        // If using an API, uncomment:
        /*
        const response = await fetch(`/api/categories?userId=${userId}&isAdmin=${isAdmin}`);
        if (!response.ok) throw new Error(`Failed to fetch categories: ${response.status}`);
        userSettings = await response.json();
        */
        const data = {
            categories: userSettings.categories || {}, // Default to {} if undefined
            deselected: userSettings.deselected || [],
            previous_deselected: userSettings.previous_deselected || [],
            prompt: userSettings.prompt || "",
            error_message: null
        };
        updateCategoriesSection(data);
    } catch (error) {
        console.error('loadCategories - Error loading categories:', error.message);
        toastr.error(`Error loading categories: ${error.message}`);
        // Fallback to blank state
        updateCategoriesSection({
            categories: {},
            deselected: [],
            previous_deselected: [],
            prompt: "",
            error_message: null
        });
    }
}

// Update the list of deselected categories
window.updateDeselected = function() {
    console.log('updateDeselected - Updating deselected categories');
    const deselectedInput = document.getElementById('deselected');
    const previousDeselectedInput = document.getElementById('previous_deselected');
    if (!deselectedInput || !previousDeselectedInput) {
        console.warn('updateDeselected - Deselected or previous_deselected input not found');
        return;
    }
    let newDeselections = [];
    const checkboxes = document.querySelectorAll('input[name="selected"]');
    checkboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            newDeselections.push(checkbox.value);
        }
    });
    cumulativeDeselections = [...new Set([...cumulativeDeselections, ...newDeselections])];
    deselectedInput.value = JSON.stringify(newDeselections);
    previousDeselectedInput.value = JSON.stringify(cumulativeDeselections);
    console.log('updateDeselected - New deselections:', newDeselections);
    console.log('updateDeselected - Cumulative deselections:', cumulativeDeselections);
};

// Update the categories section UI
window.updateCategoriesSection = function(data) {
    console.log('updateCategoriesSection - Updating categories section with data:', data);
    const formContainer = document.getElementById('categories-form');
    if (!formContainer) {
        console.error('updateCategoriesSection - Categories form container not found');
        toastr.error('Form container not found');
        return;
    }

    const errorDiv = document.getElementById('category-error');
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }

    if (data.error_message) {
        console.log('updateCategoriesSection - Displaying error:', data.error_message);
        if (errorDiv) {
            errorDiv.textContent = data.error_message;
            errorDiv.style.display = 'block';
        }
        toastr.error(data.error_message);
    }

    const promptInput = document.getElementById('prompt');
    const currentPrompt = promptInput ? promptInput.value : data.prompt || '';

    if (data.previous_deselected && Array.isArray(data.previous_deselected)) {
        console.log('updateCategoriesSection - Merging server previous_deselected:', data.previous_deselected);
        cumulativeDeselections = [...new Set([...cumulativeDeselections, ...data.previous_deselected])];
    }

    // Normalize data.categories
    data.categories = data.categories || {};

    const isValidCategories = typeof data.categories === 'object' &&
        !Array.isArray(data.categories) &&
        Object.keys(data.categories).length > 0 &&
        Object.keys(data.categories).length <= 7 &&
        Object.values(data.categories).every(subcats =>
            Array.isArray(subcats) &&
            subcats.length >= 1 &&
            subcats.length <= 7 &&
            subcats.every(s => typeof s === 'string')
        );

    if (isValidCategories) {
        let html = `
            <form id="category-form" method="POST" action="/categories" onsubmit="return handleCategorySubmit(event)">
                <label for="prompt">Describe your club (e.g., 'We are a scout group, ages 8-16'):</label><br>
                <textarea id="prompt" name="prompt" rows="4" cols="50" style="width: 100%; max-width: 600px;" required>${currentPrompt}</textarea><br><br>
                <input type="hidden" id="deselected" name="deselected" value='${JSON.stringify(data.deselected || [])}'>
                <input type="hidden" id="previous_deselected" name="previous_deselected" value='${JSON.stringify(cumulativeDeselections)}'>
                <input type="hidden" id="previous_selected" name="previous_selected" value='${JSON.stringify(data.selected || [])}'>
                <input type="hidden" id="categories" name="categories" value='${JSON.stringify(data.categories)}'>
                <div class="categories-container" style="display: flex; flex-wrap: wrap; gap: 20px;">
        `;
        for (const [mainCat, subcats] of Object.entries(data.categories)) {
            html += `
                <div class="category-item" style="min-width: 200px; flex: 1 0 auto; box-sizing: border-box;">
                    <h3 style="font-size: 1.2em; margin-top: 15px;">
                        <input type="checkbox" name="selected" value="${mainCat}" ${data.deselected?.includes(mainCat) ? '' : 'checked'} onchange="updateDeselected()">
                        ${mainCat}
                    </h3>
                    <ul style="margin-left: 20px; list-style-type: none;">
            `;
            subcats.forEach(subcat => {
                const subcatValue = `${mainCat}:${subcat}`;
                html += `
                    <li>
                        <input type="checkbox" name="selected" value="${subcatValue}" ${data.deselected?.includes(subcatValue) ? '' : 'checked'} onchange="updateDeselected()">
                        ${subcat}
                    </li>
                `;
            });
            html += '</ul></div>';
        }
        html += `
                </div>
                <button type="submit" style="margin-top: 20px; padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Refine Categories</button>
                <button type="button" onclick="handleSaveCategories()" style="margin-top: 20px; margin-left: 10px; padding: 10px 20px; background-color: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">Save Categories</button>
                <button type="button" onclick="handleResetCategories()" style="margin-top: 20px; margin-left: 10px; padding: 10px 20px; background-color: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">Reset Categories</button>
            </form>
        `;
        formContainer.innerHTML = html;
        console.log('updateCategoriesSection - Form updated with categories');
    } else {
        formContainer.innerHTML = `
            <form id="category-form" method="POST" action="/categories" onsubmit="return handleCategorySubmit(event)">
                <label for="prompt">Describe your club (e.g., 'We are a scout group, ages 8-16'):</label><br>
                <textarea id="prompt" name="prompt" rows="4" cols="50" style="width: 100%; max-width: 600px;" required placeholder="E.g., 'We are a scout group, ages 8-16'">${currentPrompt}</textarea><br><br>
                <input type="hidden" id="deselected" name="deselected" value='[]'>
                <input type="hidden" id="previous_deselected" name="previous_deselected" value='[]'>
                <input type="hidden" id="previous_selected" name="previous_selected" value='[]'>
                <input type="hidden" id="categories" name="categories" value='{}'>
                <button type="submit" style="padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Generate Categories</button>
            </form>
        `;
        if (Object.keys(data.categories).length > 0) {
            toastr.error('Received invalid category data. Please try again.');
            if (errorDiv) {
                errorDiv.textContent = 'Invalid category data received. Please try again.';
                errorDiv.style.display = 'block';
            }
        }
        console.log('updateCategoriesSection - Blank form rendered');
    }
};

// Load client API settings
async function loadClientApiSettings() {
    console.log('loadClientApiSettings - Loading client API settings');
    try {
        const response = await fetch('https://clubmadeira.io/settings/client_api');
        if (!response) throw new Error('No response from server');
        if (!response.ok) throw new Error(`Failed to fetch client API settings: ${response.status}`);
        const data = await response.json();
        console.log('loadClientApiSettings - Client API settings fetched:', data);
        return data.settings;
    } catch (error) {
        console.error('loadClientApiSettings - Error loading client API settings:', error.message);
        toastr.error(`Error loading client API settings: ${error.message}`);
        return [
            {
                "comment": "Wix CMS client API settings",
                "description": "Wix is a versatile website builder, offering clubmadeira.io API tools to integrate custom features into its CMS platform.",
                "doc_link": [
                    { "link": "https://dev.wix.com/api/rest/wix-stores", "title": "api" },
                    { "link": "https://www.wix.com/signup", "title": "signup" },
                    { "link": "https://clubmadeira.io/static/md/wix_readme.md", "title": "readme" }
                ],
                "fields": { "API_TOKEN": "", "SITE_ID": "" },
                "icon": "icon-wix",
                "key_type": "wix"
            },
            {
                "comment": "WordPress CMS client API settings",
                "description": "WordPress, a popular open-source CMS, powers clubmadeira.io with extensible plugins and APIs for dynamic content management.",
                "doc_link": [
                    { "link": "https://developer.wordpress.com/docs/api/", "title": "api" },
                    { "link": "https://wordpress.com/start", "title": "signup" },
                    { "link": "https://clubmadeira.io/static/md/wordpress_readme.md", "title": "readme" }
                ],
                "fields": { "API_KEY": "" },
                "icon": "icon-wordpress",
                "key_type": "wordpress"
            },
            {
                "comment": "Squarespace CMS client API settings",
                "description": "Squarespace provides an elegant CMS platform, integrating with clubmadeira.io via APIs for custom site enhancements.",
                "doc_link": [
                    { "link": "https://developers.squarespace.com/", "title": "api" },
                    { "link": "https://www.squarespace.com/signup", "title": "signup" },
                    { "link": "https://clubmadeira.io/static/md/squarespace_readme.md", "title": "readme" }
                ],
                "fields": { "API_KEY": "" },
                "icon": "icon-squarespace",
                "key_type": "squarespace"
            },
            {
                "comment": "Weebly CMS client API settings",
                "description": "Weebly offers a user-friendly CMS, enabling clubmadeira.io to add custom features through its developer API.",
                "doc_link": [
                    { "link": "https://www.weebly.com/developer", "title": "api" },
                    { "link": "https://www.weebly.com/signup", "title": "signup" },
                    { "link": "https://clubmadeira.io/static/md/weebly_readme.md", "title": "readme" }
                ],
                "fields": { "API_KEY": "" },
                "icon": "icon-weebly",
                "key_type": "weebly"
            },
            {
                "comment": "Joomla CMS client API settings",
                "description": "Joomla, an open-source CMS, supports clubmadeira.io with robust API capabilities for custom module development.",
                "doc_link": [
                    { "link": "https://docs.joomla.org/Joomla_API", "title": "api" },
                    { "link": "https://www.joomla.org/download.html", "title": "signup" },
                    { "link": "https://clubmadeira.io/static/md/joomla_readme.md", "title": "readme" }
                ],
                "fields": { "API_KEY": "" },
                "icon": "icon-joomla",
                "key_type": "joomla"
            }
        ];
    }
}

// Function to fetch and render markdown content
async function renderMdPage(url, container) {
    console.log(`renderMdPage - Fetching markdown from: ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch markdown: ${response.status}`);
        const markdownText = await response.text();
        console.log(`renderMdPage - Markdown fetched: ${markdownText.substring(0, 100)}...`);

        // Ensure marked library is available
        if (typeof marked === 'undefined') {
            throw new Error('Marked library not found. Please include marked.js.');
        }

        // Parse markdown to HTML using marked
        const htmlContent = marked.parse(markdownText);
        console.log(`renderMdPage - Markdown parsed to HTML: ${htmlContent.substring(0, 100)}...`);

        // Update the container with the rendered HTML
        container.innerHTML = htmlContent;
    } catch (error) {
        console.error(`renderMdPage - Error rendering markdown for ${url}:`, error.message);
        container.innerHTML = `<p style="color: red;">Error loading markdown content: ${error.message}</p>`;
    }
}

// Setup website providers from API data
async function setupWebsiteProviders() {
    console.log('setupWebsiteProviders - Setting up website providers');
    // Wait for DOM to be ready
    if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
        console.log('setupWebsiteProviders - Waiting for DOMContentLoaded');
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
    }

    const providerIconsContainer = document.getElementById('website-provider-icons');
    if (!providerIconsContainer) {
        console.error('setupWebsiteProviders - Containers not found');
        toastr.error('Page containers not found');
        return;
    }

    try {
        const settings = await loadClientApiSettings();

        // Clear any existing content
        providerIconsContainer.innerHTML = '';

        // Create sub-container for icons
        const iconsBar = document.createElement('div');
        iconsBar.id = 'provider-icons-bar';
        iconsBar.style.display = 'flex';
        iconsBar.style.gap = '20px';
        iconsBar.style.marginBottom = '20px';
        providerIconsContainer.appendChild(iconsBar);

        // Create sub-container for content
        const contentArea = document.createElement('div');
        contentArea.id = 'provider-content-area';
        providerIconsContainer.appendChild(contentArea);

        // Generate provider icons and their content sections
        settings.forEach(setting => {
            if (setting.key_type) {
                // Create the icon
                const icon = document.createElement('i');
                icon.className = setting.icon;
                icon.style.cursor = 'pointer';
                icon.style.width = '48px';
                icon.style.height = '48px';
                icon.style.fontSize = '48px';
                icon.style.color = '#C0C0C0';
                icon.title = setting.comment || `${setting.key_type.charAt(0).toUpperCase() + setting.key_type.slice(1)} integration`;
                icon.dataset.keyType = setting.key_type;

                // Create the content section for this provider
                const contentSection = document.createElement('div');
                contentSection.id = `provider-content-${setting.key_type}`;
                contentSection.style.display = 'none';
                contentSection.style.marginTop = '20px';

                // Create header container for heading and option links
                const headerContainer = document.createElement('div');
                headerContainer.style.display = 'flex';
                headerContainer.style.alignItems = 'center';
                headerContainer.style.justifyContent = 'space-between';

                const heading = document.createElement('h3');
                heading.textContent = setting.comment || `${setting.key_type.charAt(0).toUpperCase() + setting.key_type.slice(1)} Integration`;
                headerContainer.appendChild(heading);

                // Options container for icons (readme, api, signup)
                const optionsContainer = document.createElement('div');
                optionsContainer.style.display = 'flex';
                optionsContainer.style.gap = '10px';

                // Readme icon and toggle logic
                const readmeLink = setting.doc_link?.find(link => link.title === 'readme')?.link;
                let mdContentContainer;
                if (readmeLink) {
                    const readmeIcon = document.createElement('a');
                    readmeIcon.href = '#';
                    readmeIcon.style.fontSize = '16px';
                    readmeIcon.style.color = '#007bff';
                    readmeIcon.style.textDecoration = 'none';
                    readmeIcon.innerHTML = '<i class="fas fa-book"></i>';
                    readmeIcon.addEventListener('click', async (e) => {
                        e.preventDefault();
                        console.log('setupWebsiteProviders - Readme icon clicked for:', setting.key_type);
                        if (mdContentContainer.style.display === 'none') {
                            if (!mdContentContainer.innerHTML) {
                                await renderMdPage(readmeLink, mdContentContainer);
                            }
                            mdContentContainer.style.display = 'block';
                            readmeIcon.innerHTML = '<i class="fas fa-book-open"></i>';
                        } else {
                            mdContentContainer.style.display = 'none';
                            readmeIcon.innerHTML = '<i class="fas fa-book"></i>';
                        }
                    });
                    optionsContainer.appendChild(readmeIcon);
                }

                // API icon
                const apiLink = setting.doc_link?.find(link => link.title === 'api')?.link;
                if (apiLink) {
                    const apiIcon = document.createElement('a');
                    apiIcon.href = apiLink;
                    apiIcon.style.fontSize = '16px';
                    apiIcon.style.color = '#007bff';
                    apiIcon.style.textDecoration = 'none';
                    apiIcon.innerHTML = '<i class="fas fa-cog"></i>';
                    apiIcon.target = '_blank';
                    apiIcon.rel = 'noopener noreferrer';
                    optionsContainer.appendChild(apiIcon);
                }

                // Signup icon
                const signupLink = setting.doc_link?.find(link => link.title === 'signup')?.link;
                if (signupLink) {
                    const signupIcon = document.createElement('a');
                    signupIcon.href = signupLink;
                    signupIcon.style.fontSize = '16px';
                    signupIcon.style.color = '#007bff';
                    signupIcon.style.textDecoration = 'none';
                    signupIcon.innerHTML = '<i class="fas fa-user-plus"></i>';
                    signupIcon.target = '_blank';
                    signupIcon.rel = 'noopener noreferrer';
                    optionsContainer.appendChild(signupIcon);
                }

                headerContainer.appendChild(optionsContainer);
                contentSection.appendChild(headerContainer);

                // Add description
                const descriptionText = setting.description || 'No description available.';
                const description = document.createElement('p');
                description.textContent = descriptionText;
                contentSection.appendChild(description);

                // Create markdown content container
                mdContentContainer = document.createElement('div');
                mdContentContainer.id = `md-content-${setting.key_type}`;
                mdContentContainer.style.marginTop = '10px';
                mdContentContainer.style.padding = '10px';
                mdContentContainer.style.border = '1px solid #ddd';
                mdContentContainer.style.borderRadius = '4px';
                mdContentContainer.style.backgroundColor = '#f9f9f9';
                mdContentContainer.style.display = 'none'; // Initially hidden
                contentSection.appendChild(mdContentContainer);

                // Append icon to iconsBar and content to contentArea
                iconsBar.appendChild(icon);
                contentArea.appendChild(contentSection);

                // Add click event to toggle content
                icon.addEventListener('click', function() {
                    // Reset all icons and content sections
                    iconsBar.querySelectorAll('i').forEach(i => {
                        i.style.color = '#C0C0C0';
                    });
                    contentArea.querySelectorAll(`div[id^="provider-content-"]`).forEach(content => {
                        content.style.display = 'none';
                    });

                    // Highlight clicked icon and show its content
                    this.style.color = 'currentColor';
                    contentSection.style.display = 'block';
                });
            }
        });

        // Show the first provider's content by default
        const firstIcon = iconsBar.querySelector('i');
        if (firstIcon) {
            firstIcon.click();
        }
    } catch (error) {
        console.error('setupWebsiteProviders - Error:', error);
        toastr.error('Failed to load website providers');
    }
}

// Load visit data
async function loadVisits() {
    console.log('loadVisits - Loading visits');
    const userId = document.getElementById('userId')?.value || localStorage.getItem('userId') || '';
    if (!userId) {
        console.error('loadVisits - User ID not found');
        toastr.error('User ID not found');
        return;
    }
    try {
        const data = {
            status: 'success',
            visits: [
                { page: 'Home', timestamp: '2025-04-13T10:00:00Z' },
                { page: 'Discounts', timestamp: '2025-04-13T10:05:00Z' }
            ]
        };
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const visitsThisMonth = [];
        const visitsLastMonth = [];
        const visitsEarlier = [];
        data.visits.forEach(visit => {
            const visitDate = new Date(visit.timestamp);
            if (visitDate.getFullYear() === thisYear && visitDate.getMonth() === thisMonth) {
                visitsThisMonth.push(visit);
            } else if ((visitDate.getFullYear() === thisYear && visitDate.getMonth() === thisMonth - 1) ||
                      (visitDate.getFullYear() === thisYear - 1 && thisMonth === 0 && visitDate.getMonth() === 11)) {
                visitsLastMonth.push(visit);
            } else {
                visitsEarlier.push(visit);
            }
        });
        updateVisitsTable('visitsListThisMonth', visitsThisMonth);
        updateVisitsTable('visitsListLastMonth', visitsLastMonth);
        updateVisitsTable('visitsListEarlier', visitsEarlier);
    } catch (error) {
        console.error('loadVisits - Error:', error.message);
        toastr.error(`Error loading visits: ${error.message}`);
    }
}

// Update visits table UI
function updateVisitsTable(tableId, visits) {
    console.log('updateVisitsTable - Updating table:', tableId);
    const tbody = document.getElementById(tableId);
    if (tbody) {
        tbody.innerHTML = visits.length === 0 ? '<tr><td colspan="2">No visits found</td></tr>' : '';
        visits.forEach(visit => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${visit.page || 'N/A'}</td><td>${visit.timestamp || 'N/A'}</td>`;
            tbody.appendChild(row);
        });
    }
}

// Load order data
async function loadOrders() {
    console.log('loadOrders - Loading orders');
    const userId = document.getElementById('userId')?.value || localStorage.getItem('userId') || '';
    if (!userId) {
        console.error('loadOrders - User ID not found');
        toastr.error('User ID not found');
        return;
    }
    try {
        const data = {
            status: 'success',
            orders: [
                { orderId: 'ORD001', buyer: 'John Doe', total: 50.00, timestamp: '2025-04-13T10:00:00Z' },
                { orderId: 'ORD002', buyer: 'Jane Smith', total: 75.00, timestamp: '2025-04-13T10:05:00Z' }
            ]
        };
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const ordersThisMonth = [];
        const ordersLastMonth = [];
        const ordersEarlier = [];
        data.orders.forEach(order => {
            const orderDate = new Date(order.timestamp);
            if (orderDate.getFullYear() === thisYear && orderDate.getMonth() === thisMonth) {
                ordersThisMonth.push(order);
            } else if ((orderDate.getFullYear() === thisYear && orderDate.getMonth() === thisMonth - 1) ||
                      (orderDate.getFullYear() === thisYear - 1 && thisMonth === 0 && orderDate.getMonth() === 11)) {
                ordersLastMonth.push(order);
            } else {
                ordersEarlier.push(order);
            }
        });
        updateOrdersTable('ordersListThisMonth', ordersThisMonth);
        updateOrdersTable('ordersListLastMonth', ordersLastMonth);
        updateOrdersTable('ordersListEarlier', ordersEarlier);
    } catch (error) {
        console.error('loadOrders - Error:', error.message);
        toastr.error(`Error loading orders: ${error.message}`);
    }
}

// Update orders table UI
function updateOrdersTable(tableId, orders) {
    console.log('updateOrdersTable - Updating table:', tableId);
    const tbody = document.getElementById(tableId);
    if (tbody) {
        tbody.innerHTML = orders.length === 0 ? '<tr><td colspan="4">No orders found</td></tr>' : '';
        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${order.orderId || 'N/A'}</td><td>${order.buyer || 'N/A'}</td><td>$${order.total || '0.00'}</td><td>${order.timestamp || 'N/A'}</td>`;
            tbody.appendChild(row);
        });
    }
}

// Set up collapsible sections
function setupCollapsibleSections() {
    console.log('setupCollapsibleSections - Setting up collapsible sections');
    const toggleSections = document.querySelectorAll('.toggle-section');
    toggleSections.forEach(section => {
        section.addEventListener('click', () => {
            const targetId = section.getAttribute('data-toggle');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                const isOpen = targetContent.classList.contains('open');
                const parentSection = section.closest('.section');
                if (parentSection) {
                    parentSection.querySelectorAll('.toggle-content.open').forEach(content => {
                        content.classList.remove('open');
                        content.style.display = 'none';
                    });
                }
                if (!isOpen) {
                    targetContent.classList.add('open');
                    targetContent.style.display = 'block';
                }
            }
        });
    });
}

// Wait for TinyMCE to load
function waitForTinyMCE(callback) {
    console.log('waitForTinyMCE - Checking if TinyMCE is loaded');
    if (typeof tinymce !== 'undefined' && tinymce.init) {
        console.log('waitForTinyMCE - TinyMCE is loaded');
        callback();
    } else {
        console.log('waitForTinyMCE - Waiting for TinyMCE...');
        const script = document.querySelector('script[src*="tinymce.min.js"]');
        if (script) {
            script.onload = () => callback();
            script.onerror = () => console.error('waitForTinyMCE - TinyMCE failed to load');
        } else {
            setTimeout(() => waitForTinyMCE(callback), 100);
        }
    }
}

// Initialize TinyMCE editor
function initializeTinyMCE(selector) {
    console.log('initializeTinyMCE - Initializing TinyMCE for:', selector);
    tinymce.init({
        selector: selector,
        height: 200,
        menubar: false,
        plugins: 'lists',
        toolbar: 'bold italic | bullist numlist',
        setup: editor => {
            editor.on('init', () => console.log(`TinyMCE initialized for ${selector}`));
        }
    });
}

// Expose functions to global scope
window.initializeCommunity = window.initializeCommunity;
window.loadVisits = loadVisits;
window.updateVisitsTable = updateVisitsTable;
window.loadOrders = loadOrders;
window.updateOrdersTable = updateOrdersTable;
window.setupCollapsibleSections = setupCollapsibleSections;
window.waitForTinyMCE = waitForTinyMCE;
window.loadClientApiSettings = loadClientApiSettings;
window.loadCategories = loadCategories;
window.handleCategorySubmit = handleCategorySubmit;
window.handleSaveCategories = handleSaveCategories;
window.handleResetCategories = handleResetCategories;
window.updateCategoriesSection = updateCategoriesSection;
window.updateDeselected = updateDeselected;
window.setupWebsiteProviders = setupWebsiteProviders;
window.renderMdPage = renderMdPage;

// Initialize when DOM is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.initializeCommunity('community');
} else {
    document.addEventListener('DOMContentLoaded', () => window.initializeCommunity('community'));
}