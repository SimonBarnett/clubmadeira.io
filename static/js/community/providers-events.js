// /static/js/community/providers-events.js
import { log, warn } from '../core/logger.js';
import { withErrorHandling } from '../utils/error.js';
import { withElement } from '../utils/dom-manipulation.js';
import { withScriptLogging } from '../utils/logging-utils.js';

const context = 'providers-events.js';

/**
 * Renders provider settings into the DOM, with icons styled similarly to the affiliates page.
 * @param {string} context - The context or module name.
 * @param {Array} settings - The settings data to render.
 * @param {string} iconsBarId - The ID of the icons bar container.
 * @param {string} contentAreaId - The ID of the content area container.
 * @returns {Promise<void>}
 */
export async function renderProviderSettings(context, settings, iconsBarId, contentAreaId) {
    log(context, 'Rendering provider settings');
    return await withErrorHandling(`${context}:renderProviderSettings`, async () => {
        const iconsBar = await withElement(context, iconsBarId, (element) => element);
        if (!iconsBar) {
            throw new Error(`Icons bar element (${iconsBarId}) not found`);
        }
        const contentArea = await withElement(context, contentAreaId, (element) => element);
        if (!contentArea) {
            throw new Error(`Content area element (${contentAreaId}) not found`);
        }

        iconsBar.innerHTML = '';
        contentArea.innerHTML = '';

        // Function to render provider details (header, description, readme)
        async function renderProviderDetails(setting) {
            contentArea.innerHTML = '';

            // Create header with icon, title, and links
            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.alignItems = 'center';
            header.style.marginBottom = '15px';

            const icon = document.createElement('i');
            icon.className = setting.icon || 'fas fa-cog';
            icon.style.fontSize = '16px';
            icon.style.marginRight = '10px';
            header.appendChild(icon);

            const title = document.createElement('h3');
            title.textContent = setting.comment || `${setting.key_type} Instructions`;
            title.style.margin = '0';
            header.appendChild(title);

            const linksContainer = document.createElement('div');
            linksContainer.style.marginLeft = 'auto';
            linksContainer.style.display = 'flex';
            linksContainer.style.gap = '10px';

            setting.doc_link.forEach(doc => {
                const linkElement = document.createElement('a');
                linkElement.href = doc.link;
                linkElement.target = '_blank';
                linkElement.title = doc.title;
                linkElement.innerHTML = `<i class="fas fa-${doc.title === 'api' ? 'link' : doc.title === 'signup' ? 'user-plus' : 'book'}"></i>`;
                linksContainer.appendChild(linkElement);
            });
            header.appendChild(linksContainer);

            // Add description
            const description = document.createElement('p');
            description.textContent = setting.description || 'No description available';
            description.style.marginBottom = '15px';

            contentArea.appendChild(header);
            contentArea.appendChild(description);

            // Fetch and render readme content
            const readmeLink = setting.doc_link.find(link => link.title === 'readme');
            if (readmeLink && readmeLink.link) {
                const response = await fetch(readmeLink.link);
                if (response.ok) {
                    const markdown = await response.text();
                    const readmeContent = document.createElement('div');
                    readmeContent.innerHTML = window.marked.parse(markdown);
                    contentArea.appendChild(readmeContent);
                } else {
                    const errorP = document.createElement('p');
                    errorP.textContent = 'Failed to load readme';
                    contentArea.appendChild(errorP);
                }
            } else {
                const noReadmeP = document.createElement('p');
                noReadmeP.textContent = 'No readme available';
                contentArea.appendChild(noReadmeP);
            }
        }

        // Render provider icons with selection behavior
        settings.forEach(setting => {
            const icon = document.createElement('i');
            icon.className = `${setting.icon || 'fas fa-cog'} provider-icon`;
            icon.dataset.keyType = setting.key_type;
            icon.addEventListener('click', async () => {
                // Remove 'selected' from all provider icons
                iconsBar.querySelectorAll('.provider-icon').forEach(i => i.classList.remove('selected'));
                // Add 'selected' to the clicked icon
                icon.classList.add('selected');
                // Render provider details
                await renderProviderDetails(setting);
            });
            iconsBar.appendChild(icon);
        });

        // Select and render the first provider by default
        if (settings.length > 0) {
            const firstIcon = iconsBar.firstChild;
            firstIcon.classList.add('selected');
            await renderProviderDetails(settings[0]);
        }
    });
}

withScriptLogging(context, () => {
    log(context, 'Module initialized');
});