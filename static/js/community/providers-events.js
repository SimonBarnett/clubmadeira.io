// /static/js/community/providers-events.js
// Purpose: Manages UI rendering and event setup for the community providers page.

import { log } from '../core/logger.js';
import { renderSettings } from '../utils/settings-renderer.js';
import { toggleViewState } from '../utils/dom-manipulation.js';
import { renderMarkdownContent } from '../utils/form-rendering.js';
import { setupProviderEvents } from './providers-handlers.js';
import { withScriptLogging } from '../utils/logging-utils.js';

/**
 * Renders provider settings and sets up event listeners.
 * @param {string} context - The context or module name.
 * @param {Array} settings - The provider settings.
 * @param {string} containerId - The container element ID.
 * @returns {Promise<void>}
 */
export async function renderProviderSettings(context, settings, containerId) {
  log(context, 'Rendering provider settings');
  await renderSettings(context, {
    containerId,
    formId: 'providerForm',
    fieldsId: 'providerContentArea',
    settings,
    type: 'provider',
    iconClass: 'fas fa-cog',
    onIconClick: (setting, fieldsContainer, form) => {
      toggleViewState(context, { providerContentArea: true });
      Array.from(document.getElementById('providerIconsBar').children).forEach(child => {
        child.style.color = child.dataset.keyType === setting.keyType ? '#007bff' : '#C0C0C0';
      });
    },
    onReadmeClick: async setting => {
      const readmeLink = setting.docLink?.find(link => link.title === 'readme')?.link;
      if (readmeLink) {
        await renderMarkdownContent(readmeLink, `mdContent-${setting.keyType}`);
        toggleViewState(context, { [`mdContent-${setting.keyType}`]: true });
      }
    },
  });
  setupProviderEvents(context);
}

/**
 * Initializes the providers events module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Providers events instance with public methods.
 */
export function initializeProvidersEventsModule(registry) {
  const context = 'providers-events.js';
  log(context, 'Initializing providers events module for module registry');
  return {
    renderProviderSettings: (ctx, ...args) => renderProviderSettings(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'providers-events.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});