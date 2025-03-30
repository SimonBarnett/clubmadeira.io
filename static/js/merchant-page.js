// merchant-page.js
// Purpose: Manages page-specific functionality for the /merchant page.

try {
    // Initializes the merchant page with permission checks.
    function initializeMerchant() {
        console.log('initializeMerchant - Initializing merchant page');
        const token = localStorage.getItem('authToken');
        const userId = localStorage.getItem('userId');
        if (!token) {
            console.error('initializeMerchant - No token found, redirecting to /');
            window.location.href = '/';
            return;
        }
        const decoded = decodeJWT(token);
        if (!decoded) {
            console.error('initializeMerchant - Invalid token, redirecting to /');
            window.location.href = '/';
            return;
        }
        window.userPermissions = decoded.permissions || [];
        if (!window.userPermissions.includes('merchant') && !window.userPermissions.includes('admin')) {
            toastr.error('Permission denied: Merchant or Admin permission required');
            console.error('initializeMerchant - No merchant/admin permission, redirecting to /');
            window.location.href = '/';
            return;
        }
        const userIdInput = document.getElementById('userId');
        if (userIdInput && userId) {
            userIdInput.value = userId;
        } else if (!userId) {
            console.warn('initializeMerchant - No userId found in localStorage');
        } else {
            console.warn('initializeMerchant - userId input element not found');
        }

        // Set up navigation and event listeners
        setupNavigation(); // From site-navigation.js
        checkAdminPermission();
        loadBranding('merchant', 'brandingContent'); // Adjusted to match typical usage
        window.siteNavigation.showSection('info'); // Updated to match actual section ID
        loadProducts(); // Load merchant products
        loadStoreRequest(); // Load store request data
        loadApiKeys(); // Load API keys
        loadDocumentationMenu(); // Load documentation submenu items

        // Fetch and display contact_name from /settings/user
        loadUserSettings().then(settings => {
            const contactName = settings.contact_name || 'User';
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                const userContactNameSpan = document.getElementById('user-contact-name');
                if (userContactNameSpan) {
                    userContactNameSpan.textContent = contactName;
                    console.log('initializeMerchant - Updated contact name in info section:', contactName);
                } else {
                    console.warn('initializeMerchant - user-contact-name span not found in welcome-message');
                }
            } else {
                console.warn('initializeMerchant - welcome-message element not found');
            }
        }).catch(error => {
            console.error('initializeMerchant - Error loading settings for contact name:', error.message);
            toastr.error('Error loading user settings');
        });

        attachEventListeners(); // From page-load.js

        // Call shared "Change Password" logic
        if (typeof setupChangePassword === 'function') {
            setupChangePassword(); // From user-management.js
            console.log('initializeMerchant - Change Password logic initialized');
        } else {
            console.error('initializeMerchant - setupChangePassword function not found');
        }

        // Hide loading overlay after initialization
        hideLoadingOverlay(); // From page-load.js
        console.log('initializeMerchant - Merchant page initialized successfully');
    }

    // Loads user settings from /settings/user
    async function loadUserSettings() {
        console.log('loadUserSettings - Fetching user settings');
        try {
            const response = await authenticatedFetch(`${window.apiUrl}/settings/user`);
            if (!response.ok) throw new Error(`Failed to fetch user settings: ${response.status}`);
            const data = await response.json();
            console.log('loadUserSettings - User settings fetched:', JSON.stringify(data));

            // Convert array format to object for easier access
            const settings = {};
            data.settings.forEach(item => {
                settings[item.field] = item.value;
            });
            return settings;
        } catch (error) {
            console.error('loadUserSettings - Error fetching user settings:', error.message);
            throw error;
        }
    }

    // Checks and toggles visibility of admin-specific elements.
    function checkAdminPermission() {
        console.log('checkAdminPermission - Checking admin permission');
        const backButton = document.querySelector('button[data-href="/admin"]');
        if (backButton) {
            backButton.style.display = window.userPermissions.includes('admin') ? 'block' : 'none';
            console.log('checkAdminPermission - Back button visibility:', backButton.style.display);
        } else {
            console.warn('checkAdminPermission - Back button not found');
        }
    }

    // Loads and displays merchant products.
    async function loadProducts() {
        console.log('loadProducts - Loading products');
        const userId = document.getElementById('userId') ? document.getElementById('userId').value : '';
        if (!userId) {
            console.error('loadProducts - User ID not found in session');
            toastr.error('User ID not found in session');
            return;
        }
        try {
            console.log('loadProducts - Fetching products - URL:', `${window.apiUrl}/${userId}/products`);
            const response = await authenticatedFetch(`${window.apiUrl}/settings/products`);
            if (!response.ok) throw new Error(`Failed to fetch products: ${response.status}`);
            const data = await response.json();
            console.log('loadProducts - Products fetched - Data:', JSON.stringify(data));
            
            const tbody = document.getElementById('productList');
            if (tbody) {
                tbody.innerHTML = '';
                data.products.forEach(product => tbody.appendChild(createProductRow(product)));
                console.log('loadProducts - Product table updated - Count:', data.products.length);
            } else {
                console.warn('loadProducts - Product list element not found');
            }
        } catch (error) {
            console.error('loadProducts - Error loading products - Error:', error.message, 'Stack:', error.stack);
            toastr.error(`Error loading products: ${error.message}`);
        }
    }

    // Creates a table row for a product.
    function createProductRow(product) {
        console.log('createProductRow - Creating row - Product:', JSON.stringify(product));
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="hidden">${product.id || ''}</td>
            <td>${product.category || 'N/A'}</td>
            <td>${product.title || 'N/A'}</td>
            <td><a href="${product.product_url || '#'}" target="_blank">${product.product_url ? 'Link' : 'N/A'}</a></td>
            <td>${product.current_price || 'N/A'}</td>
            <td>${product.original_price || 'N/A'}</td>
            <td><img src="${product.image_url || ''}" width="50" onerror="this.src='https://via.placeholder.com/50';"></td>
            <td>${product.qty || 'N/A'}</td>
        `;
        return tr;
    }

    // Loads store request data specific to merchant page.
    async function loadStoreRequest() {
        console.log('loadStoreRequest - Loading store request');
        const userId = document.getElementById('userId') ? document.getElementById('userId').value : '';
        if (!userId) {
            console.error('loadStoreRequest - User ID not found in session');
            toastr.error('User ID not found in session');
            return;
        }
        try {
            console.log('loadStoreRequest - Fetching store request - URL:', `${window.apiUrl}/${userId}/siterequest`);
            const response = await authenticatedFetch(`${window.apiUrl}/${userId}/siterequest`);
            if (!response.ok) throw new Error(`Failed to fetch store request: ${response.status}`);
            const data = await response.json();
            const storeRequest = data.site_request || {};
            console.log('loadStoreRequest - Store request fetched - Data:', JSON.stringify(storeRequest));

            document.getElementById('storeName').value = storeRequest.storeName || '';
            if (window.tinyMCELoaded) {
                tinymce.get('aboutStore')?.setContent(storeRequest.aboutStore || '');
            } else {
                document.getElementById('aboutStore').value = storeRequest.aboutStore || '';
            }
            document.getElementById('colorPrefs').value = storeRequest.colorPrefs || '';
            document.getElementById('stylingDetails').value = storeRequest.stylingDetails || '';
            document.getElementById('preferredDomain').value = storeRequest.preferredDomain || 'mystore.uk';

            const emails = storeRequest.emails || ['info'];
            window.emailCount = 0;
            const emailsContainer = document.getElementById('emailsContainer');
            if (emailsContainer) {
                emailsContainer.innerHTML = '';
                emails.forEach((email, index) => {
                    window.emailCount++;
                    const emailDiv = document.createElement('div');
                    emailDiv.className = 'email-section';
                    emailDiv.dataset.email = window.emailCount;
                    emailDiv.innerHTML = `
                        <label for="email${window.emailCount}Name">Email Name:</label>
                        <input type="text" id="email${window.emailCount}Name" name="email${window.emailCount}Name" value="${email}">
                        <span id="email${window.emailCount}Domain">@${storeRequest.preferredDomain || 'mystore.uk'}</span>
                        ${window.emailCount > 1 ? `<button type="button" class="remove-email-btn" onclick="removeEmail(${window.emailCount})">Remove Email</button>` : ''}
                    `;
                    emailsContainer.appendChild(emailDiv);
                });
            } else {
                console.warn('loadStoreRequest - Emails container not found');
            }

            const pages = storeRequest.pages && storeRequest.pages.length >= 2 ? storeRequest.pages : [
                { name: 'Home', content: '' },
                { name: 'Returns Policy', content: '' }
            ];
            window.pageCount = 0;
            const pagesContainer = document.getElementById('pagesContainer');
            if (pagesContainer) {
                pagesContainer.innerHTML = '';
                pages.forEach((page, index) => {
                    window.pageCount++;
                    const pageDiv = document.createElement('div');
                    pageDiv.className = 'page-section';
                    pageDiv.dataset.page = window.pageCount;
                    pageDiv.innerHTML = `
                        <label for="page${window.pageCount}Name">Page Name:</label>
                        <input type="text" id="page${window.pageCount}Name" name="page${window.pageCount}Name" value="${page.name || ''}" ${window.pageCount <= 2 ? 'readonly' : ''}>
                        <br><br>
                        <label for="page${window.pageCount}Content">${window.pageCount === 1 ? 'Home Page' : window.pageCount === 2 ? 'Returns Policy' : 'Page'} Content:</label>
                        <textarea id="page${window.pageCount}Content" name="page${window.pageCount}Content">${page.content || ''}</textarea>
                        <label for="page${window.pageCount}Images">Additional Images:</label>
                        <input type="file" id="page${window.pageCount}Images" name="page${window.pageCount}Images" accept="image/*" multiple>
                        ${window.pageCount > 2 ? `<button type="button" class="remove-page-btn" onclick="removePage(${window.pageCount})">Remove Page</button>` : ''}
                    `;
                    pagesContainer.appendChild(pageDiv);
                    if (window.tinyMCELoaded) {
                        tinymce.init({
                            selector: `#page${window.pageCount}Content`,
                            height: 200,
                            menubar: false,
                            plugins: 'lists',
                            toolbar: 'bold italic | bullist numlist',
                            setup: editor => {
                                editor.on('init', () => console.log(`TinyMCE editor initialized for page${window.pageCount}`));
                            }
                        });
                    }
                });
            } else {
                console.warn('loadStoreRequest - Pages container not found');
            }

            const widgets = storeRequest.widgets || [];
            document.querySelectorAll('input[name="widgets"]').forEach(checkbox => {
                checkbox.checked = widgets.includes(checkbox.value);
            });

            updateDomainPreview(); // Assumed function from site-request.js
            console.log('loadStoreRequest - Store request loaded successfully');
        } catch (error) {
            console.error('loadStoreRequest - Error loading store request - Error:', error.message, 'Stack:', error.stack);
            toastr.error(`Error loading store request: ${error.message}`);
        }
    }

    // Loads and manages API keys functionality.
    async function loadApiKeys() {
        console.log('loadApiKeys - Loading API keys');
        try {
            const response = await authenticatedFetch(`${window.apiUrl}/settings/api_key`);
            if (!response.ok) throw new Error(`Failed to fetch API keys: ${response.status}`);
            const data = await response.json();
            console.log('loadApiKeys - API keys fetched - Data:', JSON.stringify(data));

            const iconsContainer = document.getElementById('api-keys-icons');
            const fieldsContainer = document.getElementById('api-keys-fields');
            const form = document.getElementById('api-keys-form');
            if (!iconsContainer || !fieldsContainer || !form) {
                console.warn('loadApiKeys - Required DOM elements not found');
                return;
            }

            // Render icons horizontally
            iconsContainer.innerHTML = '';
            data.settings.forEach(setting => {
                const icon = document.createElement('i');
                icon.className = setting.icon;
                icon.title = setting.comment;
                icon.dataset.keyType = setting.key_type;
                icon.style.cursor = 'pointer';
                icon.style.width = '32px';  // Set width to 32px
                icon.style.height = '32px'; // Set height to 32px
                icon.style.fontSize = '32px'; // Ensure icon scales to 32px
                icon.style.color = 'inherit'; // Use current foreground color
                icon.addEventListener('click', () => displayApiKeyFields(setting, fieldsContainer, form));
                iconsContainer.appendChild(icon);
            });

            // Form submission handler
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const keyType = form.dataset.keyType;
                const fields = {};
                Array.from(fieldsContainer.querySelectorAll('input')).forEach(input => {
                    fields[input.name] = input.value;
                });
                try {
                    const patchResponse = await authenticatedFetch(`${window.apiUrl}/settings/api_key/${keyType}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(fields)
                    });
                    if (!patchResponse.ok) throw new Error(`Failed to patch API key: ${patchResponse.status}`);
                    toastr.success(`API key for ${keyType} updated successfully`);
                    loadApiKeys(); // Reload settings after update
                } catch (error) {
                    console.error('loadApiKeys - Error patching API key:', error.message);
                    toastr.error(`Error updating API key: ${error.message}`);
                }
            });

            console.log('loadApiKeys - API keys initialized');
        } catch (error) {
            console.error('loadApiKeys - Error loading API keys:', error.message);
            toastr.error(`Error loading API keys: ${error.message}`);
        }
    }

    // Displays fields for the selected API key.
    function displayApiKeyFields(setting, fieldsContainer, form) {
        console.log('displayApiKeyFields - Displaying fields for:', setting.key_type);
        fieldsContainer.innerHTML = '';
        form.style.display = 'block';
        form.dataset.keyType = setting.key_type;

        // Add heading with comment
        const heading = document.createElement('h3');
        heading.textContent = setting.comment || 'API Key Settings';
        heading.className = 'api-comment-heading'; // Optional for styling
        fieldsContainer.appendChild(heading);

        // Add input fields
        Object.entries(setting.fields).forEach(([name, value]) => {
            const div = document.createElement('div');
            div.style.marginBottom = '10px';
            div.innerHTML = `
                <label for="${name}">${name}:</label>
                <input type="text" id="${name}" name="${name}" value="${value}" style="width: 300px;">
            `;
            fieldsContainer.appendChild(div);
        });

        // Hide other sections and show API keys section
        document.querySelectorAll('.section').forEach(section => section.style.display = 'none');
        document.getElementById('api-keys').style.display = 'block';
    }

    // Loads documentation submenu items from /settings/api_key
    async function loadDocumentationMenu() {
        console.log('loadDocumentationMenu - Loading documentation menu');
        try {
            const response = await authenticatedFetch('https://clubmadeira.io/settings/api_key');
            if (!response.ok) {
                throw new Error('Failed to fetch API keys');
            }
            const data = await response.json();
            console.log('loadDocumentationMenu - Documentation data fetched:', JSON.stringify(data));

            const submenu = document.getElementById('documentation-submenu');
            if (!submenu) {
                console.error('loadDocumentationMenu - Documentation submenu container not found');
                return;
            }
            submenu.innerHTML = '';

            if (!data || !data.settings || data.settings.length === 0) {
                submenu.innerHTML = '<p>No documentation available.</p>';
                console.log('loadDocumentationMenu - No documentation data available');
                return;
            }

            data.settings.forEach(item => {
                if (item.comment && item.doc_link) {
                    const button = document.createElement('button');
                    button.setAttribute('data-section', 'documentation-content');
                    button.setAttribute('data-md-path', item.doc_link);
                    const iconClass = item.icon || 'fas fa-file-alt'; // Default icon if missing
                    button.innerHTML = `<span class="button-content"><i class="${iconClass}"></i> ${item.comment}</span>`;
                    submenu.appendChild(button);
                    console.log('loadDocumentationMenu - Added button:', item.comment);
                }
            });

            if (typeof window.siteNavigation?.initializeNavigation === 'function') {
                window.siteNavigation.initializeNavigation();
                console.log('loadDocumentationMenu - Navigation reinitialized');
            }
        } catch (error) {
            console.error('loadDocumentationMenu - Error loading documentation menu:', error);
            if (typeof toastr !== 'undefined') {
                toastr.error('Failed to load documentation menu');
            }
        }
    }

    // Export for use in other scripts
    window.initializeMerchant = initializeMerchant;
    window.checkAdminPermission = checkAdminPermission;
    window.loadProducts = loadProducts;
    window.createProductRow = createProductRow;
    window.loadStoreRequest = loadStoreRequest;
    window.loadApiKeys = loadApiKeys;
    window.displayApiKeyFields = displayApiKeyFields;
    window.loadUserSettings = loadUserSettings;
    window.loadDocumentationMenu = loadDocumentationMenu; // Added export
} catch (error) {
    console.error('Error in merchant-page.js:', error.message, error.stack);
    // Fallback to prevent undefined errors
    window.initializeMerchant = function() {
        console.error('initializeMerchant - Failed to initialize due to an error:', error.message);
    };
}