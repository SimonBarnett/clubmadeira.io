// admin-page.js
try {
    // Initialize Admin page using unified site-navigation.js function
    window.initializeAdmin = function(pageType) {
        console.log('initializeAdmin - Initializing admin page with type: ' + pageType);
        window.siteNavigation.initializePage('Admin', ['admin'], [
            loadInitialData,
            setupEventListeners,
            loadAffiliates,
            loadSiteSettings,
            loadApiKeys
        ]);
    };

    // Handle user management clicks (moved from setupNavigation)
    function handleUserManagementClick(event) {
        event.preventDefault();
        event.stopPropagation();
        const button = event.currentTarget;
        const sectionId = button.getAttribute('data-section');
        const role = button.getAttribute('data-role');

        console.log(`handleUserManagementClick - Button clicked: sectionId=${sectionId}, role=${role}`);
        if (sectionId === 'user_management' && role) {
            document.querySelectorAll('.section').forEach(section => section.style.display = 'none');
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'block';
                const titleSpan = document.getElementById('user_role_title');
                const iconSpan = document.getElementById('user_role_icon');
                const title = button.querySelector('.button-content').textContent.trim();
                const iconElement = button.querySelector('.button-content i[class*="icon-"]');
                let iconClass = iconElement ? Array.from(iconElement.classList).find(cls => cls.startsWith('icon-')) : `icon-${role}`;
                if (titleSpan && iconSpan) {
                    titleSpan.textContent = title;
                    iconSpan.className = `menu-size ${iconClass}`;
                }
                loadUserData(role);
            }
        }
    }

    // Handle other section clicks (moved from setupNavigation)
    function handleOtherClick(event) {
        event.preventDefault();
        event.stopPropagation();
        const button = event.currentTarget;
        const sectionId = button.getAttribute('data-section');
        const submenuId = button.getAttribute('data-submenu');

        console.log(`handleOtherClick - Button clicked: sectionId=${sectionId}, submenuId=${submenuId}`);
        if (sectionId) {
            document.querySelectorAll('.section').forEach(section => section.style.display = 'none');
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'block';
                console.log(`handleOtherClick - Section ${sectionId} shown`);
                if (sectionId === 'api_keys') {
                    const form = document.getElementById('api-keys-form');
                    form.style.display = 'none';
                    document.getElementById('api-keys-icons').style.display = 'flex';
                }
            }
        }
    }

    // Attach custom listeners for admin-specific navigation
    function attachAdminListeners() {
        console.log('attachAdminListeners - Setting up admin-specific navigation listeners');
        const userManagementButtons = document.querySelectorAll('#userManagement button[data-section="user_management"]');
        console.log('attachAdminListeners - Found userManagement buttons:', userManagementButtons.length);
        userManagementButtons.forEach(button => {
            button.removeEventListener('click', handleUserManagementClick);
            button.addEventListener('click', handleUserManagementClick);
            console.log('attachAdminListeners - Attached click listener to button:', {
                section: button.dataset.section,
                role: button.dataset.role
            });
        });

        const otherButtons = document.querySelectorAll('.menu button[data-section]:not([data-section="user_management"])');
        otherButtons.forEach(button => {
            button.removeEventListener('click', handleOtherClick);
            button.addEventListener('click', handleOtherClick);
            console.log('attachAdminListeners - Attached click listener to other button:', {
                section: button.dataset.section,
                submenu: button.dataset.submenu
            });
        });

        // Role-switching handled by site-navigation.js, no need for handleTestScriptClick
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOMContentLoaded - Attaching admin listeners');
            attachAdminListeners();
        });
    } else {
        console.log('Document already loaded - Attaching admin listeners immediately');
        attachAdminListeners();
    }

    function loadInitialData() {
        console.log('loadInitialData - Loading initial data');
        authenticatedFetch(`${window.apiUrl}/categories`)
            .then(response => response.json())
            .then(categories => {
                const categoryId = categories[0]?.id || 'default';
                return authenticatedFetch(`${window.apiUrl}/deals?category_id=${categoryId}`);
            })
            .then(response => response.json())
            .then(data => {
                console.log('loadInitialData - Deals fetched:', data);
                const dealList = document.getElementById('dealList');
                if (dealList) {
                    dealList.innerHTML = data.map(deal => `
                        <tr>
                            <td>${deal.category}</td>
                            <td>${deal.title}</td>
                            <td><a href="${deal.url}" target="_blank">Link</a></td>
                            <td>${deal.price}</td>
                            <td>${deal.original}</td>
                            <td>${deal.discount}</td>
                            <td><img src="${deal.image}" alt="Product Image" style="width: 50px;"></td>
                            <td>${deal.quantity}</td>
                        </tr>
                    `).join('');
                }
            })
            .catch(error => {
                console.error('loadInitialData - Failed to load deal listings:', error);
                toastr.error('Failed to load deal listings');
            });
    }

    function setupEventListeners() {
        const saveSettingsButton = document.querySelector('button[data-action="saveSettings"]');
        if (saveSettingsButton) {
            saveSettingsButton.addEventListener('click', function() {
                const userId = document.getElementById('userId')?.value || '';
                const contactName = document.getElementById('contactName')?.value || '';
                const websiteUrl = document.getElementById('websiteUrl')?.value || '';
                const emailAddress = document.getElementById('emailAddress')?.value || '';

                console.log('setupEventListeners - Saving settings for user:', userId);
                authenticatedFetch(`${window.apiUrl}/settings/user`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contact_name: contactName, website_url: websiteUrl, email_address: emailAddress })
                })
                .then(response => {
                    if (!response.ok) throw new Error('Failed to save settings');
                    return response.json();
                })
                .then(data => {
                    console.log('setupEventListeners - Settings saved:', data);
                    toastr.success('Settings updated successfully');
                })
                .catch(error => {
                    console.error('setupEventListeners - Error saving settings:', error);
                    toastr.error('Failed to save settings');
                });
            });
        }

        const apiKeysForm = document.getElementById('api-keys-form');
        if (apiKeysForm) {
            apiKeysForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const keyType = apiKeysForm.dataset.keyType;
                const fields = {};
                Array.from(apiKeysForm.querySelectorAll('input')).forEach(input => {
                    fields[input.name] = input.value;
                });
                try {
                    const response = await authenticatedFetch(`${window.apiUrl}/settings/api_key/${keyType}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(fields)
                    });
                    if (!response.ok) throw new Error('Failed to update API key');
                    toastr.success(`API key ${keyType} updated successfully`);
                    loadApiKeys();
                } catch (error) {
                    console.error('setupEventListeners - Error updating API key:', error);
                    toastr.error('Failed to update API key');
                }
            });
        }

        const affiliateForm = document.getElementById('affiliate-form');
        if (affiliateForm) {
            affiliateForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const keyType = affiliateForm.dataset.keyType;
                const fields = {};
                Array.from(affiliateForm.querySelectorAll('input')).forEach(input => {
                    fields[input.name] = input.value;
                });
                try {
                    const response = await authenticatedFetch(`${window.apiUrl}/settings/affiliate_key/${keyType}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(fields)
                    });
                    if (!response.ok) throw new Error(`Failed to patch affiliate: ${response.status}`);
                    toastr.success(`Affiliate settings for ${keyType} updated successfully`);
                    loadAffiliates();
                } catch (error) {
                    console.error('setupEventListeners - Error updating affiliate:', error);
                    toastr.error('Failed to update affiliate');
                }
            });
        }

        const siteSettingsForm = document.getElementById('site-settings-form');
        if (siteSettingsForm) {
            siteSettingsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const keyType = siteSettingsForm.dataset.keyType;
                const fields = {};
                Array.from(siteSettingsForm.querySelectorAll('input')).forEach(input => {
                    fields[input.name] = input.value;
                });
                try {
                    const response = await authenticatedFetch(`${window.apiUrl}/settings/settings_key/${keyType}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(fields)
                    });
                    if (!response.ok) throw new Error(`Failed to patch site settings: ${response.status}`);
                    toastr.success(`Site settings for ${keyType} updated successfully`);
                    loadSiteSettings();
                } catch (error) {
                    console.error('setupEventListeners - Error updating site settings:', error);
                    toastr.error('Failed to update site settings');
                }
            });
        }
    }

    async function loadAffiliates() {
        console.log('loadAffiliates - Loading affiliate programs');
        try {
            const response = await authenticatedFetch(`${window.apiUrl}/settings/affiliate_key`);
            if (!response.ok) throw new Error(`Failed to fetch affiliates: ${response.status}`);
            const data = await response.json();
            const iconsContainer = document.getElementById('affiliate-icons');
            const fieldsContainer = document.getElementById('affiliate-fields');
            const form = document.getElementById('affiliate-form');
            if (!iconsContainer || !fieldsContainer || !form) return;

            iconsContainer.innerHTML = '';
            data.settings.forEach(setting => {
                const icon = document.createElement('i');
                icon.className = setting.icon;
                icon.title = setting.comment;
                icon.dataset.keyType = setting.key_type;
                icon.style.cursor = 'pointer';
                icon.style.width = '48px';
                icon.style.height = '48px';
                icon.style.fontSize = '48px';
                icon.style.color = '#C0C0C0';
                icon.addEventListener('click', () => {
                    Array.from(iconsContainer.children).forEach(i => i.style.color = '#C0C0C0');
                    icon.style.color = 'currentColor';
                    displayAffiliateFields(setting, fieldsContainer, form);
                });
                iconsContainer.appendChild(icon);
            });
        } catch (error) {
            console.error('loadAffiliates - Error loading affiliates:', error.message);
            toastr.error(`Error loading affiliates: ${error.message}`);
        }
    }

    function displayAffiliateFields(setting, fieldsContainer, form) {
        console.log('displayAffiliateFields - Displaying fields for:', setting.key_type);
        fieldsContainer.innerHTML = '';
        form.style.display = 'block';
        form.dataset.keyType = setting.key_type;

        const keySettingsContainer = document.createElement('div');
        keySettingsContainer.className = 'affiliate-key-settings';
        keySettingsContainer.style.display = 'block';
        fieldsContainer.appendChild(keySettingsContainer);

        const readmeContentContainer = document.createElement('div');
        readmeContentContainer.id = 'affiliate-readme-content';
        readmeContentContainer.style.display = 'none';
        fieldsContainer.appendChild(readmeContentContainer);

        const selectedIcon = document.createElement('i');
        selectedIcon.className = `selected-setting-icon ${setting.icon}`;
        selectedIcon.style.fontSize = '16px';
        selectedIcon.style.color = 'currentColor';
        selectedIcon.style.marginRight = '10px';
        selectedIcon.style.verticalAlign = 'middle';
        fieldsContainer.insertBefore(selectedIcon, keySettingsContainer);

        const heading = document.createElement('h3');
        heading.textContent = setting.comment || 'Affiliate Settings';
        heading.className = 'affiliate-comment-heading';
        heading.style.display = 'inline-block';
        heading.style.verticalAlign = 'middle';
        fieldsContainer.insertBefore(heading, keySettingsContainer);

        const apiLink = setting.doc_link?.find(link => link.title === 'api')?.link;
        if (apiLink) {
            const apiIcon = document.createElement('a');
            apiIcon.href = apiLink;
            apiIcon.className = 'affiliate-api-link';
            apiIcon.style.marginLeft = '10px';
            apiIcon.style.display = 'inline-block';
            apiIcon.style.verticalAlign = 'middle';
            apiIcon.style.color = 'currentColor';
            apiIcon.innerHTML = '<i class="fas fa-link" style="font-size: 16px;"></i>';
            apiIcon.target = '_blank';
            fieldsContainer.insertBefore(apiIcon, keySettingsContainer);
        }

        const signupLink = setting.doc_link?.find(link => link.title === 'signup')?.link;
        if (signupLink) {
            const signupIcon = document.createElement('a');
            signupIcon.href = signupLink;
            signupIcon.className = 'affiliate-signup-link';
            signupIcon.style.marginLeft = '10px';
            signupIcon.style.display = 'inline-block';
            signupIcon.style.verticalAlign = 'middle';
            signupIcon.style.color = 'currentColor';
            signupIcon.innerHTML = '<i class="fas fa-user-plus" style="font-size: 16px;"></i>';
            signupIcon.target = '_blank';
            fieldsContainer.insertBefore(signupIcon, keySettingsContainer);
        }

        const readmeLink = setting.doc_link?.find(link => link.title === 'readme')?.link;
        const readmeIcon = document.createElement('a');
        readmeIcon.href = '#';
        readmeIcon.className = 'affiliate-readme-link';
        readmeIcon.style.marginLeft = '10px';
        readmeIcon.style.display = 'inline-block';
        readmeIcon.style.verticalAlign = 'middle';
        readmeIcon.style.color = 'currentColor';
        readmeIcon.innerHTML = '<i class="fas fa-book" style="font-size: 16px;"></i>';
        readmeIcon.title = setting.comment || 'View Documentation';

        const keysIcon = document.createElement('a');
        keysIcon.href = '#';
        keysIcon.className = 'affiliate-keys-link';
        keysIcon.style.marginLeft = '10px';
        keysIcon.style.display = 'none';
        keysIcon.style.verticalAlign = 'middle';
        keysIcon.style.color = 'currentColor';
        keysIcon.innerHTML = '<i class="fas fa-key" style="font-size: 16px;"></i>';

        readmeIcon.addEventListener('click', async (e) => {
            e.preventDefault();
            keySettingsContainer.style.display = 'none';
            readmeContentContainer.style.display = 'block';
            form.querySelector('button[type="submit"]').style.display = 'none';
            readmeIcon.style.display = 'none';
            keysIcon.style.display = 'inline-block';
            if (!window.markdownCache[readmeLink]) {
                await renderMdPage(readmeLink, 'affiliate-readme-content');
                window.markdownCache[readmeLink] = readmeContentContainer.innerHTML;
            } else {
                readmeContentContainer.innerHTML = window.markdownCache[readmeLink];
            }
        });

        keysIcon.addEventListener('click', (e) => {
            e.preventDefault();
            keySettingsContainer.style.display = 'block';
            readmeContentContainer.style.display = 'none';
            form.querySelector('button[type="submit"]').style.display = 'block';
            keysIcon.style.display = 'none';
            readmeIcon.style.display = 'inline-block';
        });

        if (readmeLink) {
            fieldsContainer.insertBefore(readmeIcon, keySettingsContainer);
        }
        fieldsContainer.insertBefore(keysIcon, keySettingsContainer);

        const description = document.createElement('p');
        description.textContent = setting.description || '';
        description.className = 'affiliate-description';
        description.style.marginBottom = '15px';
        keySettingsContainer.appendChild(description);

        Object.entries(setting.fields).forEach(([name, value]) => {
            const div = document.createElement('div');
            div.style.marginBottom = '10px';
            div.innerHTML = `
                <label for="${name}">${name}:</label>
                <input type="text" id="${name}" name="${name}" value="${value}" style="width: 300px;">
            `;
            keySettingsContainer.appendChild(div);
        });

        document.querySelectorAll('.section').forEach(section => section.style.display = 'none');
        document.getElementById('affiliates').style.display = 'block';
    }

    async function loadSiteSettings() {
        console.log('loadSiteSettings - Loading site settings');
        try {
            const response = await authenticatedFetch(`${window.apiUrl}/settings/settings_key`);
            if (!response.ok) throw new Error(`Failed to fetch site settings: ${response.status}`);
            const data = await response.json();
            console.log('loadSiteSettings - Site settings fetched:', data);
            const iconsContainer = document.getElementById('site-settings-icons');
            const fieldsContainer = document.getElementById('site-settings-fields');
            const form = document.getElementById('site-settings-form');
            if (!iconsContainer || !fieldsContainer || !form) {
                console.warn('loadSiteSettings - Required DOM elements not found:', {
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
                icon.style.width = '48px';
                icon.style.height = '48px';
                icon.style.fontSize = '48px';
                icon.style.color = '#C0C0C0';
                icon.addEventListener('click', () => {
                    Array.from(iconsContainer.children).forEach(i => i.style.color = '#C0C0C0');
                    icon.style.color = 'currentColor';
                    displaySiteSettingsFields(setting, fieldsContainer, form);
                });
                iconsContainer.appendChild(icon);
            });
        } catch (error) {
            console.error('loadSiteSettings - Error loading site settings:', error.message);
            toastr.error(`Error loading site settings: ${error.message}`);
        }
    }

    function displaySiteSettingsFields(setting, fieldsContainer, form) {
        console.log('displaySiteSettingsFields - Displaying fields for:', setting.key_type);
        fieldsContainer.innerHTML = '';
        form.style.display = 'block';
        form.dataset.keyType = setting.key_type;

        const selectedIcon = document.createElement('i');
        selectedIcon.className = `selected-setting-icon ${setting.icon}`;
        selectedIcon.style.fontSize = '16px';
        selectedIcon.style.color = 'currentColor';
        selectedIcon.style.marginRight = '10px';
        selectedIcon.style.verticalAlign = 'middle';
        fieldsContainer.appendChild(selectedIcon);

        const heading = document.createElement('h3');
        heading.textContent = setting.comment || 'Site Settings';
        heading.className = 'site-settings-comment-heading';
        heading.style.display = 'inline-block';
        heading.style.verticalAlign = 'middle';
        fieldsContainer.appendChild(heading);

        const apiLink = setting.doc_link?.find(link => link.title === 'api')?.link;
        if (apiLink) {
            const apiIcon = document.createElement('a');
            apiIcon.href = apiLink;
            apiIcon.className = 'site-settings-api-link';
            apiIcon.style.marginLeft = '10px';
            apiIcon.style.display = 'inline-block';
            apiIcon.style.verticalAlign = 'middle';
            apiIcon.style.color = 'currentColor';
            apiIcon.innerHTML = '<i class="fas fa-link" style="font-size: 16px;"></i>';
            apiIcon.target = '_blank';
            fieldsContainer.appendChild(apiIcon);
        }

        const description = document.createElement('p');
        description.textContent = setting.description || '';
        description.className = 'site-settings-description';
        description.style.marginBottom = '15px';
        fieldsContainer.appendChild(description);

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
        document.getElementById('site_settings').style.display = 'block';
    }

    async function loadApiKeys() {
        console.log('loadApiKeys - Loading API keys');
        try {
            const response = await authenticatedFetch(`${window.apiUrl}/settings/api_key`);
            if (!response.ok) throw new Error(`Failed to fetch API keys: ${response.status}`);
            const data = await response.json();
            console.log('loadApiKeys - API keys fetched:', data);
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
                icon.className = setting.icon || `icon-${setting.key_type}`;
                icon.title = setting.comment || setting.key_type;
                icon.dataset.key = setting.key_type;
                icon.style.cursor = 'pointer';
                icon.style.width = '48px';
                icon.style.height = '48px';
                icon.style.fontSize = '48px';
                icon.style.color = '#C0C0C0';
                icon.addEventListener('click', () => {
                    Array.from(iconsContainer.children).forEach(i => i.style.color = '#C0C0C0');
                    icon.style.color = 'currentColor';
                    displayApiKeyFields(setting, fieldsContainer, form);
                });
                iconsContainer.appendChild(icon);
            });
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

        const keySettingsContainer = document.createElement('div');
        keySettingsContainer.className = 'api-keys-settings';
        keySettingsContainer.style.display = 'block';
        fieldsContainer.appendChild(keySettingsContainer);

        const mdContentContainer = document.createElement('div');
        mdContentContainer.id = 'api-keys-md-content';
        mdContentContainer.style.display = 'none';
        fieldsContainer.appendChild(mdContentContainer);

        const selectedIcon = document.createElement('i');
        selectedIcon.className = `selected-setting-icon ${setting.icon || 'fas fa-key'}`;
        selectedIcon.style.fontSize = '16px';
        selectedIcon.style.color = 'currentColor';
        selectedIcon.style.marginRight = '10px';
        selectedIcon.style.verticalAlign = 'middle';
        fieldsContainer.insertBefore(selectedIcon, keySettingsContainer);

        const heading = document.createElement('h3');
        heading.textContent = setting.comment || setting.key_type || 'API Key Settings';
        heading.className = 'api-keys-comment-heading';
        heading.style.display = 'inline-block';
        heading.style.verticalAlign = 'middle';
        fieldsContainer.insertBefore(heading, keySettingsContainer);

        const mdLink = document.createElement('a');
        mdLink.href = '#';
        mdLink.className = 'api-keys-md-link';
        mdLink.style.marginLeft = '10px';
        mdLink.style.display = 'inline-block';
        mdLink.style.verticalAlign = 'middle';
        mdLink.style.color = 'currentColor';
        mdLink.innerHTML = '<i class="fas fa-book" style="font-size: 16px;"></i>';
        mdLink.title = setting.comment || 'View Documentation';

        const keysLink = document.createElement('a');
        keysLink.href = '#';
        keysLink.className = 'api-keys-keys-link';
        keysLink.style.marginLeft = '10px';
        keysLink.style.display = 'none';
        keysLink.style.verticalAlign = 'middle';
        keysLink.style.color = 'currentColor';
        keysLink.innerHTML = '<i class="fas fa-key" style="font-size: 16px;"></i>';

        mdLink.addEventListener('click', async (e) => {
            e.preventDefault();
            keySettingsContainer.style.display = 'none';
            mdContentContainer.style.display = 'block';
            form.querySelector('button[type="submit"]').style.display = 'none';
            mdLink.style.display = 'none';
            keysLink.style.display = 'inline-block';
            const readmePath = setting.readme_path || `/static/docs/api-keys/${setting.key_type}.md`;
            if (!window.markdownCache[readmePath]) {
                await renderMdPage(readmePath, 'api-keys-md-content');
                window.markdownCache[readmePath] = mdContentContainer.innerHTML;
            } else {
                mdContentContainer.innerHTML = window.markdownCache[readmePath];
            }
        });

        keysLink.addEventListener('click', (e) => {
            e.preventDefault();
            keySettingsContainer.style.display = 'block';
            mdContentContainer.style.display = 'none';
            form.querySelector('button[type="submit"]').style.display = 'block';
            keysLink.style.display = 'none';
            mdLink.style.display = 'inline-block';
        });

        fieldsContainer.insertBefore(mdLink, keySettingsContainer);
        fieldsContainer.insertBefore(keysLink, keySettingsContainer);

        const description = document.createElement('p');
        description.textContent = setting.description || '';
        description.className = 'api-keys-description';
        description.style.marginBottom = '15px';
        keySettingsContainer.appendChild(description);

        Object.entries(setting.fields).forEach(([name, value]) => {
            const div = document.createElement('div');
            div.style.marginBottom = '10px';
            div.innerHTML = `
                <label for="${name}">${name}:</label>
                <input type="text" id="${name}" name="${name}" value="${value}" style="width: 300px;">
            `;
            keySettingsContainer.appendChild(div);
        });

        const saveButton = form.querySelector('button[type="submit"]');
        saveButton.style.display = 'block';

        document.querySelectorAll('.section').forEach(section => section.style.display = 'none');
        document.getElementById('api_keys').style.display = 'block';
    }

    function loadUserData(role) {
        console.log(`loadUserData - Fetching users for role: ${role}`);
        const permissionLists = {
            'admin': ['admin', 'validated', 'debug'],
            'partner': ['partner', 'validated', 'verified'], // Updated from 'wixpro' to 'partner'
            'community': ['community', 'validated'],
            'merchant': ['merchant', 'validated', 'verified']
        };
        const allowedPermissions = permissionLists[role] || [];

        authenticatedFetch(`${window.apiUrl}/users/${role}`)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to fetch users for ${role}: ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log(`loadUserData - Users fetched for role ${role}:`, data);
                const userList = document.getElementById('user_list');
                if (userList) {
                    userList.innerHTML = data.users.map(user => {
                        const fields = user.fields.reduce((acc, field) => {
                            acc[field.field_name] = field.field_value;
                            return acc;
                        }, {});
                        const userPermissions = Array.isArray(fields.permissions) ? fields.permissions : [];
                        const permissionsHtml = allowedPermissions.map(perm => `
                            <label style="margin-right: 10px;">
                                <input type="checkbox" 
                                       name="permission-${user.USERid}-${perm}" 
                                       ${userPermissions.includes(perm) ? 'checked' : ''} 
                                       onchange="updatePermission('${user.USERid}', '${perm}', this.checked, '${role}')">
                                ${perm}
                            </label>
                        `).join('');
                        let actions = `<button onclick="modifyPermissions('${user.USERid}', '${role}')">Modify Permissions</button>`;
                        return `
                            <tr data-userid="${user.USERid}">
                                <td>${user.USERid}</td>
                                <td>${fields.contact_name || ''}</td>
                                <td>${fields.website_url || ''}</td>
                                <td>${fields.email_address || ''}</td>
                                <td>${fields.phone_number || ''}</td>
                                <td>${permissionsHtml}</td>
                                <td>${actions}</td>
                            </tr>
                        `;
                    }).join('');
                }
            })
            .catch(error => {
                console.error(`loadUserData - Error fetching users for ${role}:`, error.message);
                toastr.error(`Failed to load users for ${role}`);
                const userList = document.getElementById('user_list');
                if (userList) userList.innerHTML = '<tr><td colspan="7">Error loading data</td></tr>';
            });
    }

    function updatePermission(userId, permission, isChecked, role) {
        console.log(`updatePermission - Updating permission ${permission} for user ${userId} (role: ${role}): ${isChecked ? 'add' : 'remove'}`);
        const method = isChecked ? 'PATCH' : 'DELETE';
        authenticatedFetch(`${window.apiUrl}/permission`, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ USERid: userId, permission: permission })
        })
        .then(response => {
            if (!response.ok) throw new Error(`Failed to ${isChecked ? 'add' : 'remove'} permission: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log(`updatePermission - Success:`, data);
            toastr.success(data.message);
            if (!isChecked && permission === role) {
                const userRow = document.querySelector(`#user_list tr[data-userid="${userId}"]`);
                if (userRow) userRow.remove();
            }
        })
        .catch(error => {
            console.error(`updatePermission - Error:`, error.message);
            toastr.error(`Failed to update permission: ${error.message}`);
            const checkbox = document.querySelector(`input[name="permission-${userId}-${permission}"]`);
            if (checkbox) checkbox.checked = !isChecked;
        });
    }

    function modifyPermissions(userId, role) {
        console.log(`modifyPermissions - Modifying permissions for user ${userId} with role ${role}`);
        toastr.info(`Additional permission modification for ${userId} (role: ${role}) not yet implemented`);
    }

    // Export functions
    window.initializeAdmin = window.initializeAdmin; // Already assigned above
    window.loadInitialData = loadInitialData;
    window.setupEventListeners = setupEventListeners;
    window.loadAffiliates = loadAffiliates;
    window.displayAffiliateFields = displayAffiliateFields;
    window.loadSiteSettings = loadSiteSettings;
    window.displaySiteSettingsFields = displaySiteSettingsFields;
    window.loadUserData = loadUserData;
    window.updatePermission = updatePermission;
    window.modifyPermissions = modifyPermissions;
    window.loadApiKeys = loadApiKeys;
    window.displayApiKeyFields = displayApiKeyFields;
    window.handleUserManagementClick = handleUserManagementClick; // Export for external use if needed
    window.handleOtherClick = handleOtherClick; // Export for external use if needed
} catch (error) {
    console.error('Error in admin-page.js:', error.message, error.stack);
    window.initializeAdmin = function() {
        console.error('initializeAdmin - Failed to initialize due to an error:', error.message);
    };
}