// merchant-page.js
import { initialize as navInitialize, showSection } from '../js/modules/navigation.js';
import { authenticatedFetch } from '../js/core/auth.js';

// CSS class definitions for icon styling
const style = document.createElement('style');
style.textContent = `
  .api-icon-greyed {
    color: #C0C0C0 !important;
  }
  .api-icon-highlighted {
    color: inherit !important;
  }
  .api-icon {
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: inline-block;
    margin-right: 10px;
    pointer-events: auto;
  }
  .api-icon svg {
    width: 100%;
    height: 100%;
    fill: currentColor; /* Ensure the SVG fill uses the parent's color */
  }
  /* Style for header icons */
  .api-readme-link, .api-api-link, .api-signup-link {
    font-size: 16px;
    color: #007bff;
    text-decoration: none;
  }
  .api-readme-link:hover, .api-api-link:hover, .api-signup-link:hover {
    color: #0056b3;
  }
  /* Style for markdown content */
  .api-md-content {
    margin-top: 10px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #f9f9f9;
  }
  /* Style for form container */
  .api-form-container {
    margin-top: 10px;
  }
`;
document.head.appendChild(style);

// Define SVG paths for each platform (extracted from icons.css)
const iconSvgs = {
  'wixStore': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 400"><path fill="currentColor" d="M393.4 131.7c0 13 2.1 32.7-28.7 43.8-9.5 3.5-16 9.7-16 9.7 0-31 4.7-42.2 17.4-48.9 9.8-5.1 27.2-4.6 27.2-4.6zm-115.8 35.5l-34.2 132.7-28.5-108.6c-7.7-32-20.8-48.5-48.4-48.5-27.4 0-40.7 16.2-48.4 48.5L89.5 299.9 55.3 167.2C49.7 140.5 23.9 129 0 132l65.6 247.9s21.6 1.6 32.5-4c14.2-7.3 21-12.8 29.6-46.6 7.7-30.1 29.1-118.4 31.1-124.7 4.8-14.9 11.1-13.8 15.4 0 2 6.3 23.5 94.6 31.1 124.7 8.6 33.7 15.4 39.3 29.6 46.6 10.8 5.5 32.5 4 32.5 4l65.6-247.9c-24.4-3.1-49.8 8.9-55.3 35.3zm115.8 5.2s-4.1 6.3-13.5 11.6c-6 3.4-11.8 5.6-18 8.6-15.1 7.3-13.2 14-13.2 35.2v152.1s16.6 2.1 27.4-3.4c13.9-7.1 17.1-14 17.3-44.8V181.4l0 0v-9zm163.4 84.1L640 132.8s-35.1-6-52.5 9.9c-13.3 12.1-24.4 29.6-54.2 72.5-.5 .7-6.3 10.5-13.1 0-29.3-42.2-40.8-60.3-54.2-72.5-17.4-15.8-52.5-9.9-52.5-9.9l83.2 123.7-83 123.4s36.6 4.6 54-11.2c11.5-10.5 17.6-20.4 52.5-70.7 6.8-10.5 12.6-.8 13.1 0 29.4 42.4 39.2 58.1 53.1 70.7 17.4 15.8 53.3 11.2 53.3 11.2L556.8 256.5z"/></svg>`,
  'bigcommerce': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><path fill="currentColor" d="M33.72 36.432h8.073c2.296 0 3.75-1.263 3.75-3.3 0-1.913-1.454-3.3-3.75-3.3H33.72c-.268 0-.497.23-.497.46v5.663c.038.268.23.46.497.46zm0 13.048h8.34c2.564 0 4.094-1.3 4.094-3.597 0-2-1.454-3.597-4.094-3.597h-8.34c-.268 0-.497.23-.497.46v6.237c.038.306.23.497.497.497zM63.257.16l-23.875 23.8h3.903c6.084 0 9.68 3.826 9.68 7.997 0 3.3-2.22 5.7-4.6 6.772-.383.153-.383.7.038.842 2.755 1.07 4.706 3.94 4.706 7.308 0 4.744-3.176 8.532-9.336 8.532H26.87c-.268 0-.497-.23-.497-.46V36.93L.164 63.023c-.344.344-.115.957.383.957h63.016c.23 0 .42-.2 .42-.42V.505c.115-.42-.42-.65-.727-.344z"/></svg>`,
  'magento': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M445.7 127.9V384l-63.4 36.5V164.7L223.8 73.1 65.2 164.7l.4 255.9L2.3 384V128.1L224.2 0l221.5 127.9zM255.6 420.5L224 438.9l-31.8-18.2v-256l-63.3 36.6 .1 255.9 94.9 54.9 95.1-54.9v-256l-63.4-36.6v255.9z"/></svg>`,
  'woocommerce': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" style="transform: rotate(180deg); transform-origin: center;"><path fill="currentColor" d="M204.848 655.616v149.312c-1.488 21.392-10 38.432-25.648 54.064-15.6 15.648-45.456 24.16-69.616 24.16H74.032c-22.768 0-32.768-11.392-49.808-26.992C10 841.952 1.44 826.304.048 806.4h128V274.496c0-22.72 8.56-42.672 25.552-58.272 17.088-15.696 46.944-24.16 69.712-24.16h476.384c22.72 0 32.72 11.344 49.808 26.992 14.16 14.256 22.688 29.904 24.16 49.808H204.816v78.192c7.072-1.44 12.784-1.44 18.464-1.44h520.512c24.16 0 95.264 12.832 112.352 29.904 17.04 15.648 28.432 31.248 39.824 55.408L1023.92 725.36c0 22.72-9.904 42.624-27.04 58.272-17.04 15.648-26.992 22.768-49.76 22.768H223.312c-5.696 0-11.392 0-18.464-1.488v-75.376h742.304l-128-307.2-614.304.016v233.264zM614.4 76.816c0-35.552 28.48-63.984 64.032-63.984s63.984 28.432 63.984 63.984-28.432 63.984-63.984 63.984S614.4 112.368 614.4 76.816zm-511.952 0c0-35.552 28.432-63.984 63.984-63.984s63.984 28.432 63.984 63.984-28.432 63.984-63.984 63.984-63.984-28.432-63.984-63.984z"/></svg>`,
  'shopify': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M388.3 104.1a4.7 4.7 0 0 0 -4.4-4c-2 0-37.2-.8-37.2-.8s-21.6-20.8-29.6-28.8V503.2L442.8 472S388.7 106.5 388.3 104.1zM288.7 70.5a116.7 116.7 0 0 0 -7.2-17.6C271 32.9 255.4 22 237 22a15 15 0 0 0 -4 .4c-.4-.8-1.2-1.2-1.6-2C223.4 11.6 213 7.6 200.6 8c-24 .8-48 18-67.3 48.8-13.6 21.6-24 48.8-26.8 70.1-27.6 8.4-46.8 14.4-47.2 14.8-14 4.4-14.4 4.8-16 18-1.2 10-38 291.8-38 291.8L307.9 504V65.7a41.7 41.7 0 0 0 -4.4 .4S297.9 67.7 288.7 70.5zM233.4 87.7c-16 4.8-33.6 10.4-50.8 15.6 4.8-18.8 14.4-37.6 25.6-50 4.4-4.4 10.4-9.6 17.2-12.8C232.2 54.9 233.8 74.5 233.4 87.7zM200.6 24.4A27.5 27.5 0 0 1 215 28c-6.4 3.2-12.8 8.4-18.8 14.4-15.2 16.4-26.8 42-31.6 66.5-14.4 4.4-28.8 8.8-42 12.8C131.3 83.3 163.8 25.2 200.6 24.4zM154.2 244.6c1.6 25.6 69.3 31.2 73.3 91.7 2.8 47.6-25.2 80.1-65.7 82.5-48.8 3.2-75.7-25.6-75.7-25.6l10.4-44s26.8 20.4 48.4 18.8c14-.8 19.2-12.4 18.8-20.4-2-33.6-57.2-31.6-60.8-86.9-3.2-46.4 27.2-93.3 94.5-97.7 26-1.6 39.2 4.8 39.2 4.8L221.4 225.4s-17.2-8-37.6-6.4C154.2 221 153.8 239.8 154.2 244.6zM249.4 82.9c0-12-1.6-29.2-7.2-43.6 18.4 3.6 27.2 24 31.2 36.4Q262.6 78.7 249.4 82.9z"/></svg>`
};

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

try {
    window.initializeMerchant = function(pageType) {
        console.log('initializeMerchant - Initializing merchant page with type:', pageType);
        if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
            console.log('initializeMerchant - Waiting for DOMContentLoaded');
            document.addEventListener('DOMContentLoaded', () => initializeMerchantInternal(pageType));
        } else {
            initializeMerchantInternal(pageType);
        }
    };

    function initializeMerchantInternal(pageType) {
        try {
            navInitialize('merchant');
            showSection('store-request');

            const initFunctions = [
                () => {
                    console.log('initializeMerchantInternal - Running userId setup');
                    const userId = localStorage.getItem('userId');
                    const userIdInput = document.getElementById('userId');
                    if (userIdInput && userId) {
                        userIdInput.value = userId;
                    } else if (!userId) {
                        console.warn('initializeMerchant - No userId found in localStorage');
                    } else {
                        console.warn('initializeMerchant - userId input element not found');
                    }
                    console.log('initializeMerchantInternal - Completed userId setup');
                },
                () => {
                    console.log('initializeMerchantInternal - Running checkAdminPermission');
                    checkAdminPermission();
                    console.log('initializeMerchantInternal - Completed checkAdminPermission');
                },
                () => {
                    console.log('initializeMerchantInternal - Running loadProducts');
                    loadProducts();
                    console.log('initializeMerchantInternal - Completed loadProducts');
                },
                () => {
                    console.log('initializeMerchantInternal - Running loadStoreRequest');
                    loadStoreRequest();
                    console.log('initializeMerchantInternal - Completed loadStoreRequest');
                },
                () => {
                    console.log('initializeMerchantInternal - Running loadApiKeys');
                    loadApiKeys();
                    console.log('initializeMerchantInternal - Completed loadApiKeys');
                },
                () => {
                    console.log('initializeMerchantInternal - Running loadDocumentationMenu');
                    loadDocumentationMenu();
                    console.log('initializeMerchantInternal - Completed loadDocumentationMenu');
                }
            ];

            initFunctions.forEach(fn => {
                try {
                    fn();
                } catch (error) {
                    console.error(`initializeMerchant - Error in ${fn.name}:`, error.message);
                    toastr.error(`Error in ${fn.name}: ${error.message}`);
                }
            });
        } catch (error) {
            console.error('initializeMerchantInternal - Error:', error.message);
            toastr.error('Failed to initialize merchant page');
            try {
                showSection('login');
            } catch (navError) {
                console.warn('initializeMerchant - Failed to show login section:', navError.message);
                const layoutWrapper = document.querySelector('.layout-wrapper');
                if (layoutWrapper) {
                    layoutWrapper.style.display = 'block';
                }
            }
        }
    }

    async function loadUserSettings() {
        console.log('loadUserSettings - Fetching user settings');
        try {
            const response = await authenticatedFetch(`${window.apiUrl}/settings/user`);
            if (!response) throw new Error('No response from server');
            if (!response.ok) throw new Error(`Failed to fetch user settings: ${response.status}`);
            const data = await response.json();
            console.log('loadUserSettings - User settings fetched:', data);

            const settings = {};
            data.settings.forEach(item => {
                settings[item.field] = item.value;
            });
            return settings;
        } catch (error) {
            console.error('loadUserSettings - Error fetching user settings:', error.message);
            toastr.error('Failed to load user settings');
            throw error;
        }
    }

    function checkAdminPermission() {
        console.log('checkAdminPermission - Checking admin permission');
        const backButton = document.querySelector('button[data-role="admin"]');
        if (backButton) {
            const token = localStorage.getItem('authToken');
            let permissions = [];
            try {
                if (token) {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    permissions = payload.permissions || [];
                }
            } catch (error) {
                console.warn('checkAdminPermission - Error decoding token:', error.message);
            }
            backButton.style.display = permissions.includes('admin') ? 'block' : 'none';
            console.log('checkAdminPermission - Back button visibility:', backButton.style.display);
        } else {
            console.warn('checkAdminPermission - Back button not found');
        }
    }

    async function loadProducts() {
        console.log('loadProducts - Starting product load process');
        try {
            const response = await authenticatedFetch(`${window.apiUrl}/settings/products`);
            if (!response) throw new Error('No response from server');
            if (!response.ok) throw new Error(`Failed to fetch products: ${response.status}`);
            const data = await response.json();
            console.log('loadProducts - Fetched data:', data);

            const tbody = document.getElementById('productList');
            if (tbody) {
                tbody.innerHTML = '';
                data.products.forEach((product, index) => {
                    console.log(`loadProducts - Processing product ${index + 1}:`, product);
                    const row = createProductRow(product);
                    tbody.appendChild(row);
                });
                console.log('loadProducts - Updated table with', data.products.length, 'products');
            } else {
                console.warn('loadProducts - tbody element #productList not found in DOM');
            }
        } catch (error) {
            console.error('loadProducts - Error:', error.message);
            toastr.error(`Error loading products: ${error.message}`);
        }
    }

    function createProductRow(product) {
        console.log('createProductRow - Building row for product:', product);
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
        return tr;
    }

    async function loadStoreRequest() {
        console.log('loadStoreRequest - Loading store request');
        const userId = document.getElementById('userId')?.value || '';
        if (!userId) {
            console.error('loadStoreRequest - User ID not found in session');
            toastr.error('User ID not found in session');
            return;
        }
        try {
            const response = await authenticatedFetch(`${window.apiUrl}/siterequests`);
            if (!response) throw new Error('No response from server');
            if (!response.ok) throw new Error(`Failed to fetch store request: ${response.status}`);
            const data = await response.json();
            console.log('loadStoreRequest - Store request fetched:', data);

            const storeRequest = data.siterequests.find(request => request.user_id === userId) || {};
            console.log('loadStoreRequest - Filtered store request for user:', userId, storeRequest);

            const storeNameInput = document.getElementById('storeName');
            const aboutStoreInput = document.getElementById('aboutStore');
            const colorPrefsInput = document.getElementById('colorPrefs');
            const stylingDetailsInput = document.getElementById('stylingDetails');
            const preferredDomainInput = document.getElementById('preferredDomain');

            if (storeNameInput) storeNameInput.value = storeRequest.organisation || '';
            if (aboutStoreInput) {
                if (window.tinyMCELoaded) {
                    tinymce.get('aboutStore')?.setContent(storeRequest.aboutCommunity || '');
                } else {
                    aboutStoreInput.value = storeRequest.aboutCommunity || '';
                }
            }
            if (colorPrefsInput) colorPrefsInput.value = storeRequest.colorPrefs || '';
            if (stylingDetailsInput) stylingDetailsInput.value = storeRequest.stylingDetails || '';
            if (preferredDomainInput) preferredDomainInput.value = storeRequest.preferredDomain || 'mystore.uk';

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
                        ${window.emailCount > 1 ? `<button type="button" class="remove-email-btn" onclick="window.removeEmail(${window.emailCount})">Remove Email</button>` : ''}
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
                        ${window.pageCount > 2 ? `<button type="button" class="remove-page-btn" onclick="window.removePage(${window.pageCount})">Remove Page</button>` : ''}
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

            if (typeof window.updateDomainPreview === 'function') {
                window.updateDomainPreview();
            }
            console.log('loadStoreRequest - Store request loaded successfully');
        } catch (error) {
            console.error('loadStoreRequest - Error loading store request:', error.message);
            toastr.error(`Error loading store request: ${error.message}`);
        }
    }

    // Define removeEmail and removePage globally if needed
    window.removeEmail = function(count) {
        const emailDiv = document.querySelector(`.email-section[data-email="${count}"]`);
        if (emailDiv) {
            emailDiv.remove();
            console.log(`removeEmail - Removed email ${count}`);
        }
    };

    window.removePage = function(count) {
        const pageDiv = document.querySelector(`.page-section[data-page="${count}"]`);
        if (pageDiv) {
            pageDiv.remove();
            console.log(`removePage - Removed page ${count}`);
        }
    };

    async function loadApiKeys() {
        console.log('loadApiKeys - Loading API keys');
        try {
            const response = await authenticatedFetch(`${window.apiUrl}/settings/api_key`);
            if (!response) throw new Error('No response from server');
            console.log('loadApiKeys - Response status:', response.status);
            if (!response.ok) throw new Error(`Failed to fetch API keys: ${response.status}`);
            const data = await response.json();
            console.log('loadApiKeys - API keys fetched:', data);

            // Add check for empty settings
            if (!data.settings || data.settings.length === 0) {
                console.warn('loadApiKeys - No API key settings found in response');
                const iconsContainer = document.getElementById('api-keys-icons');
                if (iconsContainer) {
                    iconsContainer.innerHTML = '<p>No API keys available.</p>';
                }
                return;
            }

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
            let selectedIcon = null; // Track the currently selected icon

            data.settings.forEach((setting, index) => {
                console.log('loadApiKeys - Processing setting:', setting);
                const icon = document.createElement('i');
                icon.className = `api-icon api-icon-greyed`;
                const hoverText = setting.comment || setting.key_type || 'No description';
                icon.title = hoverText; // Set hover text to _comment
                console.log(`loadApiKeys - Setting hover text for ${setting.key_type}:`, hoverText);
                icon.dataset.keyType = setting.key_type;

                // Insert the SVG inline
                const svgContent = iconSvgs[setting.key_type];
                if (svgContent) {
                    icon.innerHTML = svgContent;
                } else {
                    console.warn(`loadApiKeys - No SVG found for key_type: ${setting.key_type}`);
                    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm0-8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>`; // Fallback icon
                }

                icon.addEventListener('click', () => {
                    console.log(`loadApiKeys - Icon clicked: ${setting.key_type}`);
                    Array.from(iconsContainer.children).forEach(i => {
                        i.classList.remove('api-icon-highlighted');
                        i.classList.add('api-icon-greyed');
                        console.log(`loadApiKeys - Greying out icon: ${i.dataset.keyType}, classes: ${i.className}`);
                    });
                    icon.classList.remove('api-icon-greyed');
                    icon.classList.add('api-icon-highlighted');
                    console.log(`loadApiKeys - Highlighting icon: ${setting.key_type}, classes: ${icon.className}`);
                    selectedIcon = icon; // Update the selected icon
                    displayApiKeyFields(setting, fieldsContainer, form);
                });

                iconsContainer.appendChild(icon);
                console.log('loadApiKeys - Appended icon:', icon.outerHTML);

                // Automatically select the first icon on load
                if (index === 0) {
                    icon.classList.remove('api-icon-greyed');
                    icon.classList.add('api-icon-highlighted');
                    console.log('loadApiKeys - Automatically selecting first icon:', setting.key_type);
                    selectedIcon = icon;
                    displayApiKeyFields(setting, fieldsContainer, form);
                }
            });

            console.log('loadApiKeys - Final icons container content:', iconsContainer.innerHTML);

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
        console.log('displayApiKeyFields - Displaying fields for:', setting.key_type, 'Setting:', setting);
        fieldsContainer.innerHTML = ''; // Clear existing content
        form.style.display = 'block'; // Show the form
        form.dataset.keyType = setting.key_type;
    
        // Create header container for heading and option links
        const headerContainer = document.createElement('div');
        headerContainer.style.display = 'flex';
        headerContainer.style.alignItems = 'center';
        headerContainer.style.justifyContent = 'space-between';
    
        const heading = document.createElement('h3');
        heading.textContent = setting.comment || 'API Key Settings';
        heading.className = 'api-comment-heading';
        headerContainer.appendChild(heading);
    
        // Options container for icons (readme, api, signup)
        const optionsContainer = document.createElement('div');
        optionsContainer.style.display = 'flex';
        optionsContainer.style.gap = '10px';
    
        // Readme icon and toggle logic
        const readmeLink = setting.doc_link?.find(link => link.title === 'readme')?.link;
        let mdContentContainer, formContainer; // Declare for use in toggle
        if (readmeLink) {
            const readmeIcon = document.createElement('a');
            readmeIcon.href = '#';
            readmeIcon.className = 'api-readme-link';
            readmeIcon.innerHTML = '<i class="fas fa-book"></i>';
            readmeIcon.addEventListener('click', async (e) => {
                e.preventDefault();
                console.log('displayApiKeyFields - Readme icon clicked for:', setting.key_type);
                if (mdContentContainer.style.display === 'none') {
                    if (!mdContentContainer.innerHTML) {
                        await renderMdPage(readmeLink, mdContentContainer);
                    }
                    mdContentContainer.style.display = 'block';
                    formContainer.style.display = 'none'; // Hide form (fields + button)
                    readmeIcon.innerHTML = '<i class="fas fa-book-open"></i>';
                } else {
                    mdContentContainer.style.display = 'none';
                    formContainer.style.display = 'block'; // Show form (fields + button)
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
            apiIcon.className = 'api-api-link';
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
            signupIcon.className = 'api-signup-link';
            signupIcon.innerHTML = '<i class="fas fa-user-plus"></i>';
            signupIcon.target = '_blank';
            signupIcon.rel = 'noopener noreferrer';
            optionsContainer.appendChild(signupIcon);
        }
    
        headerContainer.appendChild(optionsContainer);
        fieldsContainer.appendChild(headerContainer);
    
        // Add description
        const descriptionText = setting.description || setting.fields?._description || 'No description available.';
        const description = document.createElement('p');
        description.textContent = descriptionText;
        description.className = 'api-description';
        fieldsContainer.appendChild(description);
    
        // Create form container for fields and submit button
        formContainer = document.createElement('div');
        formContainer.className = 'api-form-container';
        formContainer.style.display = 'block'; // Initially visible
    
        // Render input fields
        const fieldsToDisplay = {};
        for (const [key, value] of Object.entries(setting.fields || {})) {
            if (key.toLowerCase() !== '_description') {
                fieldsToDisplay[key] = value;
            }
        }
        Object.entries(fieldsToDisplay).forEach(([name, value]) => {
            const div = document.createElement('div');
            div.className = 'api-key-field';
            div.innerHTML = `
                <label for="${name}">${name}:</label>
                <input type="text" id="${name}" name="${name}" value="${value}">
            `;
            formContainer.appendChild(div);
        });
    
        // Create and append the submit button
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.className = 'btn';
        submitButton.style.marginTop = '10px';
        submitButton.innerHTML = '<i class="fas fa-save"></i> Save API Key';
        formContainer.appendChild(submitButton);
    
        fieldsContainer.appendChild(formContainer);
    
        // Create markdown content container
        mdContentContainer = document.createElement('div');
        mdContentContainer.id = `md-content-${setting.key_type}`;
        mdContentContainer.className = 'api-md-content';
        mdContentContainer.style.display = 'none'; // Initially hidden
        fieldsContainer.appendChild(mdContentContainer);
    
        // Hide other sections and show API keys section
        document.querySelectorAll('.section').forEach(section => section.style.display = 'none');
        const apiKeysSection = document.getElementById('api-keys');
        if (apiKeysSection) {
            apiKeysSection.style.display = 'block';
        }
    }

    async function loadDocumentationMenu() {
        console.log('loadDocumentationMenu - Loading documentation menu');
        try {
            const response = await authenticatedFetch(`${window.apiUrl}/settings/api_key`);
            if (!response) throw new Error('No response from server');
            if (!response.ok) throw new Error(`Failed to fetch API keys: ${response.status}`);
            const data = await response.json();
            console.log('loadDocumentationMenu - Documentation data fetched:', data);

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
                    const iconElement = `<i class="${iconClass}"></i>`;
                    button.innerHTML = `<span class="button-content">${iconElement} ${item.comment}</span>`;

                    submenu.appendChild(button);
                    console.log('loadDocumentationMenu - Added button:', item.comment);
                }
            });

            try {
                navInitialize('merchant');
                console.log('loadDocumentationMenu - Navigation reinitialized');
            } catch (error) {
                console.warn('loadDocumentationMenu - Failed to reinitialize navigation:', error.message);
            }
        } catch (error) {
            console.error('loadDocumentationMenu - Error loading documentation menu:', error);
            toastr.error('Failed to load documentation menu');
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
    window.renderMdPage = renderMdPage;

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        window.initializeMerchant('merchant');
    } else {
        document.addEventListener('DOMContentLoaded', () => window.initializeMerchant('merchant'));
    }
} catch (error) {
    console.error('Error in merchant-page.js:', error.message);
    window.initializeMerchant = function() {
        console.error('initializeMerchant - Failed to initialize due to an error:', error.message);
        toastr.error('Failed to initialize merchant page');
        const layoutWrapper = document.querySelector('.layout-wrapper');
        if (layoutWrapper) {
            layoutWrapper.style.display = 'block';
        }
    };
}