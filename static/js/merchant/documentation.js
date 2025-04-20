// /static/js/merchant/documentation.js
// Purpose: Handles rendering of documentation content and submenu for the merchant page.

import { log } from '../core/logger.js';
import { fetchData } from '../utils/data-fetch.js';
import { renderMarkdownContent } from '../utils/form-rendering.js';
import { withElement, toggleViewState } from '../utils/dom-manipulation.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { API_ENDPOINTS } from '../config/api-endpoints.js';

/**
 * Renders documentation content and populates the submenu with API key settings.
 * @param {string} context - The context or module name.
 * @param {string} defaultPath - The default markdown file path to render.
 * @param {string} containerId - The ID of the container to render markdown content.
 * @returns {Promise<void>}
 */
export async function renderDocumentation(context, defaultPath, containerId) {
  log(context, `Rendering documentation for path: ${defaultPath}`);
  await withErrorHandling(`${context}:renderDocumentation`, async () => {
    await withElement(context, containerId, async (container) => {
      // Fetch API key settings for submenu
      const settings = await fetchData(context, API_ENDPOINTS.API_KEY);
      const submenu = document.getElementById('documentation-submenu');
      if (submenu && settings) {
        submenu.innerHTML = settings.map(setting => `
          <button class="md-link" data-md-path="${setting.readme_path}">
            ${setting.name}
          </button>
        `).join('');
      } else {
        log(context, 'No submenu or settings found, rendering default content only');
      }

      // Render default markdown content
      await renderMarkdownContent(context, defaultPath, container);

      // Show the documentation section
      toggleViewState(context, { [containerId]: true });
    });
  }, ERROR_MESSAGES.ELEMENT_NOT_FOUND);
}

/**
 * Initializes the documentation module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Documentation instance with public methods.
 */
export function initializeDocumentationModule(registry) {
  const context = 'documentation.js';
  log(context, 'Initializing documentation module for module registry');
  return {
    renderDocumentation: (ctx, ...args) => renderDocumentation(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'documentation.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});