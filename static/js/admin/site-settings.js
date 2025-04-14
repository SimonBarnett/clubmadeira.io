// /static/js/admin/site-settings.js
console.log('site-settings.js - Script loaded at:', new Date().toISOString());

export async function loadSiteSettings() {
    console.log('loadSiteSettings - Loading site settings at:', new Date().toISOString());
    const iconsContainer = document.getElementById('site-settings-icons');
    const fieldsContainer = document.getElementById('site-settings-fields');
    const form = document.getElementById('site-settings-form');
    if (!iconsContainer || !fieldsContainer || !form) {
        console.warn('loadSiteSettings - Required DOM elements not found:', {
            iconsContainer: !!iconsContainer,
            fieldsContainer: !!fieldsContainer,
            form: !!form,
        });
        return;
    }

    try {
        const data = await window.fetchData('/settings/settings_key');
        console.log('loadSiteSettings - Site settings fetched:', data);

        if (!data.settings || data.settings.length === 0) {
            console.warn('loadSiteSettings - No settings found');
            iconsContainer.innerHTML = '<p>No site settings available.</p>';
            return;
        }

        iconsContainer.innerHTML = '';
        data.settings.forEach(setting => {
            const icon = document.createElement('i');
            icon.className = setting.icon || 'fas fa-cog';
            icon.title = setting.comment || setting.key_type; // Use comment as hover text
            icon.dataset.keyType = setting.key_type;
            icon.classList.add('site-settings-icon');
            // Style the icon
            icon.style.width = '24px';
            icon.style.height = '24px';
            icon.style.fontSize = '24px';
            icon.style.cursor = 'pointer';
            icon.addEventListener('click', () => {
                console.log(`loadSiteSettings - Icon clicked for key_type: ${setting.key_type}`);
                Array.from(iconsContainer.children).forEach(i => i.classList.remove('selected'));
                icon.classList.add('selected');
                displaySiteSettingsFields(setting, fieldsContainer, form);
            });
            iconsContainer.appendChild(icon);
        });

        // Automatically select the first setting if available
        if (iconsContainer.children.length > 0) {
            iconsContainer.children[0].click();
        }
    } catch (error) {
        console.error('loadSiteSettings - Error:', error.message, error.stack);
        iconsContainer.innerHTML = `<p>Error loading site settings: ${error.message}</p>`;
    }
}

export function displaySiteSettingsFields(setting, fieldsContainer, form) {
    console.log('displaySiteSettingsFields - Displaying fields for:', setting.key_type);
    fieldsContainer.innerHTML = '';
    form.style.display = 'block';
    form.dataset.keyType = setting.key_type;

    const apiLink = setting.doc_link?.find(link => link.title === 'api')?.link;
    const extraLinks = [];
    if (apiLink) {
        const apiIcon = document.createElement('a');
        apiIcon.href = apiLink;
        apiIcon.className = 'site-settings-api-link';
        apiIcon.innerHTML = '<i class="fas fa-link"></i>';
        apiIcon.target = '_blank';
        extraLinks.push(apiIcon);
    }

    window.renderSettingsFields(setting, fieldsContainer, form, 'site-settings', extraLinks);
}

console.log('site-settings.js - Script execution completed at:', new Date().toISOString());