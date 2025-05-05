// /static/js/community/providers.js
import { log, warn } from '../core/logger.js';
import { fetchData } from '../utils/data-fetch.js';
import { createIcon } from '../utils/icons.js';
import { withElement } from '../utils/dom-manipulation.js';
import { API_ENDPOINTS } from '../config/constants.js';

const context = 'community/providers.js';

/**
 * Initializes the providers section by fetching data and rendering icons.
 */
export async function initializeProviders(context) {
    log(context, 'Initializing providers section');
    await withElement(context, 'providerIconsBar', async (iconsContainer) => {
        const data = await fetchData(context, API_ENDPOINTS.CLIENT_API_SETTINGS);
        if (!data.settings || data.settings.length === 0) {
            iconsContainer.innerHTML = '<p>No providers available.</p>';
            return;
        }
        await renderProviderIcons(context, data.settings, iconsContainer);
        // Initially, show a message until a provider is selected
        await withElement(context, 'client-api-settings', (staticContainer) => {
            staticContainer.innerHTML = '<p>Select a provider to view integration details.</p>';
        });
    });
}

/**
 * Renders provider icons in the specified container.
 */
async function renderProviderIcons(context, settings, container) {
    log(context, 'Rendering provider icons');
    container.innerHTML = '';
    settings.forEach(setting => {
        const icon = createIcon(context, setting.icon || 'fas fa-cog', { 'data-key-type': setting.key_type });
        icon.classList.add('provider-icon');
        icon.addEventListener('click', async () => {
            container.querySelectorAll('.provider-icon').forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
            await renderProviderDetails(context, setting);
        });
        container.appendChild(icon);
    });
}

/**
 * Renders the details and readme content for the selected provider.
 */
async function renderProviderDetails(context, setting) {
    log(context, `Rendering details for provider: ${setting.key_type}`);
    await withElement(context, 'client-api-settings', async (staticContainer) => {
        await withElement(context, 'markdown-content', async (readmeContainer) => {
            // Render static content (header, description, links excluding readme)
            staticContainer.innerHTML = `
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <i class="${setting.icon || 'fas fa-cog'}" style="font-size: 16px; color: currentColor; margin-right: 10px;"></i>
                    <h3 style="display: inline-block; vertical-align: middle; margin: 0;">${setting.comment || ''}</h3>
                    <div style="margin-left: auto; display: flex; gap: 10px;">
                        ${setting.doc_link
                            ?.filter(link => link.title !== 'readme') // Exclude readme link
                            .map(link => `
                                <a href="${link.link}" target="_blank" style="color: currentColor;" title="${link.title.charAt(0).toUpperCase() + link.title.slice(1)}">
                                    <i class="fas fa-${link.title === 'api' ? 'link' : 'user-plus'}" style="font-size: 16px;"></i>
                                </a>
                            `).join('') || ''}
                    </div>
                </div>
                <p>${setting.description || ''}</p>
            `;

            // Fetch and render readme content
            const readmeLink = setting.doc_link?.find(link => link.title === 'readme')?.link;
            if (readmeLink) {
                try {
                    const response = await fetch(readmeLink);
                    if (!response.ok) throw new Error('Failed to fetch readme');
                    const markdown = await response.text();
                    readmeContainer.innerHTML = window.marked.parse(markdown);
                } catch (err) {
                    readmeContainer.innerHTML = '<p>Failed to load readme content.</p>';
                    warn(context, `Error loading readme: ${err.message}`);
                }
            } else {
                readmeContainer.innerHTML = '<p>No readme available for this provider.</p>';
            }

            // Show the content containers
            staticContainer.style.display = 'block';
            readmeContainer.style.display = 'block';
        });
    });
}