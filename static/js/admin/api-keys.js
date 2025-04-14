// /static/js/admin/api-keys.js
export async function loadApiKeys() {
    console.log('loadApiKeys - Loading API keys');
    const iconsContainer = document.getElementById('api-keys-icons');
    const fieldsContainer = document.getElementById('api-keys-fields');
    const form = document.getElementById('api-keys-form');
    if (!iconsContainer || !fieldsContainer || !form) {
        console.warn('loadApiKeys - Required DOM elements not found:', {
            iconsContainer: !!iconsContainer,
            fieldsContainer: !!fieldsContainer,
            form: !!form,
        });
        return;
    }

    try {
        const data = await window.fetchData('/settings/api_key');
        iconsContainer.innerHTML = '';
        data.settings.forEach(setting => {
            const icon = document.createElement('i');
            icon.className = setting.icon || 'fas fa-key';
            icon.title = setting.comment || setting.key_type;
            icon.dataset.keyType = setting.key_type;
            icon.classList.add('api-keys-icon');
            icon.addEventListener('click', () => {
                Array.from(iconsContainer.children).forEach(i => i.classList.remove('selected'));
                icon.classList.add('selected');
                displayApiKeyFields(setting, fieldsContainer, form);
            });
            iconsContainer.appendChild(icon);
        });
    } catch (error) {
        window.handleError('loadApiKeys', error, `Error loading API keys: ${error.message}`);
    }
}

export function displayApiKeyFields(setting, fieldsContainer, form) {
    console.log('displayApiKeyFields - Displaying fields for:', setting.key_type);
    const mdContentContainer = document.createElement('div');
    mdContentContainer.id = 'api-keys-md-content';
    mdContentContainer.style.display = 'none';
    fieldsContainer.appendChild(mdContentContainer);

    const readmePath = setting.readme_path || `/static/docs/api-keys/${setting.key_type}.md`;
    const extraLinks = [];
    if (readmePath) {
        const mdLink = document.createElement('a');
        mdLink.href = '#';
        mdLink.className = 'api-keys-md-link';
        mdLink.innerHTML = '<i class="fas fa-book"></i>';
        mdLink.title = setting.comment || 'View Documentation';

        const keysLink = document.createElement('a');
        keysLink.href = '#';
        keysLink.className = 'api-keys-keys-link';
        keysLink.style.display = 'none';
        keysLink.innerHTML = '<i class="fas fa-key"></i>';

        mdLink.addEventListener('click', async (e) => {
            e.preventDefault();
            await window.renderMarkdown(readmePath, 'api-keys-md-content', {
                mdLink,
                keysLink,
                settingsContainer: fieldsContainer.querySelector('.api-keys-settings'),
                form,
            });
        });

        keysLink.addEventListener('click', (e) => {
            e.preventDefault();
            fieldsContainer.querySelector('.api-keys-settings').style.display = 'block';
            mdContentContainer.style.display = 'none';
            form.querySelector('button[type="submit"]').style.display = 'block';
            keysLink.style.display = 'none';
            mdLink.style.display = 'inline-block';
        });

        extraLinks.push(mdLink, keysLink);
    }

    window.renderSettingsFields(setting, fieldsContainer, form, 'api-keys', extraLinks);
}