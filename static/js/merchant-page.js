// merchant-page.js
try {
    window.initializeMerchant = function() {
        console.log('initializeMerchant - Initializing merchant page');
        window.siteNavigation.initializePage('Merchant', ['merchant', 'admin'], [
            () => {
                const userId = localStorage.getItem('userId');
                const userIdInput = document.getElementById('userId');
                if (userIdInput && userId) {
                    userIdInput.value = userId;
                } else if (!userId) {
                    console.warn('initializeMerchant - No userId found in localStorage');
                } else {
                    console.warn('initializeMerchant - userId input element not found');
                }
                // Align with page-load.js initialSection: 'deals'
                window.siteNavigation.showSection('deals');
            },
            checkAdminPermission,
            () => {
                console.log('initializeMerchant - Loading products');
                if (document.readyState === 'complete') {
                    loadProducts();
                } else {
                    document.addEventListener('DOMContentLoaded', loadProducts);
                }
            },
            loadStoreRequest,
            loadApiKeys,
            loadDocumentationMenu
        ]);
    };

    async function loadUserSettings() {
        console.log('loadUserSettings - Fetching user settings');
        try {
            const response = await authenticatedFetch(`${window.apiUrl}/settings/user`);
            if (!response.ok) throw new Error(`Failed to fetch user settings: ${response.status}`);
            const data = await response.json();
            console.log('loadUserSettings - User settings fetched:', JSON.stringify(data));

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

    function checkAdminPermission() {
        console.log('checkAdminPermission - Checking admin permission');
        const backButton = document.querySelector('button[data-role="admin"]');
        if (backButton) {
            backButton.style.display = window.userPermissions.includes('admin') ? 'block' : 'none';
            console.log('checkAdminPermission - Back button visibility:', backButton.style.display);
        } else {
            console.warn('checkAdminPermission - Back button not found');
        }
    }

    async function loadProducts() {
        console.log('loadProducts - Starting product load process');
        try {
            console.log('loadProducts - Fetching from URL:', `${window.apiUrl}/settings/products`);
            const response = await authenticatedFetch(`${window.apiUrl}/settings/products`);
            if (!response.ok) throw new Error(`Failed to fetch products: ${response.status}`);
            const data = await response.json();
            console.log('loadProducts - Fetched data:', JSON.stringify(data));

            const tbody = document.getElementById('productList');
            if (tbody) {
                console.log('loadProducts - Successfully found tbody:', tbody);
                tbody.innerHTML = '';
                console.log('loadProducts - Cleared tbody content');
                data.products.forEach((product, index) => {
                    console.log(`loadProducts - Processing product ${index + 1}:`, JSON.stringify(product));
                    const row = createProductRow(product);
                    console.log(`loadProducts - Generated row ${index + 1} HTML:`, row.outerHTML);
                    tbody.appendChild(row);
                    console.log(`loadProducts - Appended row ${index + 1} to tbody`);
                });
                console.log('loadProducts - Finished updating table with', data.products.length, 'products');
            } else {
                console.warn('loadProducts - tbody element #productList not found in DOM');
            }
        } catch (error) {
            console.error('loadProducts - Error occurred:', error.message);
            toastr.error(`Error loading products: ${error.message}`);
        }
    }

    function createProductRow(product) {
        console.log('createProductRow - Building row for product:', JSON.stringify(product));
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="hidden">${product.id || ''}</td>
            <td>${product.category || 'N/A'}</td>
            <td>${product.title || 'N/A'}</td>
            <td><a href="${product.product_url || '#'}" target="_blank">${product.product_url ? 'Link' : 'N/A'}</a></td>
            <td>${product.current_price !== undefined ? product.current_price : 'N/A'}</td>
            <td>${product.original_price !== undefined ? product.original_price : 'N/A'}</td>
            <td><img src="${product.image_url || ''}" width="50" onerror="this.src='https://via.placeholder.com/50';"></td>
            <td>${product.qty !== undefined ? product.qty : 'N/A'}</td>
        `;
        console.log('createProductRow - Row HTML created:', tr.outerHTML);
        return tr;
    }

    async function loadStoreRequest() {
        console.log('loadStoreRequest - Loading store request');
        const userId = document.getElementById('userId') ? document.getElementById('userId').value : '';
        if (!userId) {
            console.error('loadStoreRequest - User ID not found in session');
            toastr.error('User ID not found in session');
            return;
        }
        try {
            console.log('loadStoreRequest - Fetching store request - URL:', `${window.apiUrl}/siterequests`);
            const response = await authenticatedFetch(`${window.apiUrl}/siterequests`);
            if (!response.ok) throw new Error(`Failed to fetch store request: ${response.status}`);
            const data = await response.json();
            console.log('loadStoreRequest - Store request fetched - Data:', JSON.stringify(data));

            const storeRequest = data.siterequests.find(request => request.user_id === userId) || {};
            console.log('loadStoreRequest - Filtered store request for user:', userId, storeRequest);

            document.getElementById('storeName').value = storeRequest.organisation || '';
            if (window.tinyMCELoaded) {
                tinymce.get('aboutStore')?.setContent(storeRequest.aboutCommunity || '');
            } else {
                document.getElementById('aboutStore').value = storeRequest.aboutCommunity || '';
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

            updateDomainPreview();
            console.log('loadStoreRequest - Store request loaded successfully');
        } catch (error) {
            console.error('loadStoreRequest - Error loading store request - Error:', error.message, 'Stack:', error.stack);
            toastr.error(`Error loading store request: ${error.message}`);
        }
    }

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
                console.warn('loadApiKeys - Required DOM elements not found:', {
                    iconsContainer: !!iconsContainer,
                    fieldsContainer: !!fieldsContainer,
                    form: !!form
                });
                return;
            }

            iconsContainer.innerHTML = '';
            data.settings.forEach(setting => {
                const icon = document.createElement('i');
                icon.className = setting.icon;
                icon.title = setting.comment;
                icon.dataset.keyType = setting.key_type;
                icon.style.cursor = 'pointer';
                icon.style.width = '32px';
                icon.style.height = '32px';
                icon.style.fontSize = '32px';
                icon.style.color = 'inherit';
                icon.addEventListener('click', () => {
                    Array.from(iconsContainer.children).forEach(i => i.style.color = '#C0C0C0');
                    icon.style.color = 'currentColor';
                    displayApiKeyFields(setting, fieldsContainer, form);
                });
                iconsContainer.appendChild(icon);
            });

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
                    loadApiKeys();
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

    function displayApiKeyFields(setting, fieldsContainer, form) {
        console.log('displayApiKeyFields - Displaying fields for:', setting.key_type);
        fieldsContainer.innerHTML = '';
        form.style.display = 'block';
        form.dataset.keyType = setting.key_type;

        const heading = document.createElement('h3');
        heading.textContent = setting.comment || 'API Key Settings';
        heading.className = 'api-comment-heading';
        fieldsContainer.appendChild(heading);

        Object.entries(setting.fields).forEach(([name, value]) => {
            const div = document.createElement('div');
            div.style.marginBottom = '10px';
            div.innerHTML = `
                <label for="${name}">${name}:</label>
                <input type="text" id="${name}" name="${name}" value="${value}" style="width: 300px;">
            `;
            fieldsContainer.appendChild(div);
        });

        document.querySelectorAll('.section').forEach(section => section.style.display = 'none');
        document.getElementById('api-keys').style.display = 'block';
    }

    async function loadDocumentationMenu() {
        console.log('loadDocumentationMenu - Loading documentation menu');
        try {
            const response = await authenticatedFetch(`${window.apiUrl}/settings/api_key`);
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
                    const readmeLink = item.doc_link.find(link => link.title === 'readme')?.link;
                    if (readmeLink) {
                        button.setAttribute('data-md-path', readmeLink);
                    } else {
                        console.warn('loadDocumentationMenu - No readme link found for item:', item.comment);
                        return;
                    }
            
                    const iconClass = item.icon || 'fas fa-file-alt';
                    const iconSize = item.size || 16;
                    const iconElement = `<i class="${iconClass}" style="height: ${iconSize}px; width: ${iconSize}px;"></i>`;
                    button.innerHTML = `<span class="button-content">${iconElement} ${item.comment}</span>`;
            
                    submenu.appendChild(button);
                    console.log('loadDocumentationMenu - Added button:', item.comment, 'with size:', iconSize);
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

    window.initializeMerchant = window.initializeMerchant;
    window.checkAdminPermission = checkAdminPermission;
    window.loadProducts = loadProducts;
    window.createProductRow = createProductRow;
    window.loadStoreRequest = loadStoreRequest;
    window.loadApiKeys = loadApiKeys;
    window.displayApiKeyFields = displayApiKeyFields;
    window.loadUserSettings = loadUserSettings;
    window.loadDocumentationMenu = loadDocumentationMenu;
} catch (error) {
    console.error('Error in merchant-page.js:', error.message, error.stack);
    window.initializeMerchant = function() {
        console.error('initializeMerchant - Failed to initialize due to an error:', error.message);
    };
}