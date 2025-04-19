// /static/js/modules/navigation.js
import { log } from '../core/logger.js';
import { withElement, toggleViewState } from '../utils/dom-manipulation.js';
import { withErrorHandling } from '../utils/error.js';
import { getMenuForRole } from '../config/menus.js';
import { ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Defines section handlers for a specific role and triggers the appropriate handler.
 * @param {string} context - The context or module name.
 * @param {string} role - The role associated with the page (e.g., 'admin', 'login').
 * @param {Array<{id: string, handler: Function}>} handlers - Array of section handlers.
 * @returns {void}
 */
export function defineSectionHandlers(context, role, handlers) {
  log(context, `Defining section handlers for role: ${role}`);
  withErrorHandling(`${context}:defineSectionHandlers`, () => {
    // Populate menu
    withElement(context, 'menu', (menuContainer) => {
      const menuItems = getMenuForRole(context, role);
      menuContainer.innerHTML = menuItems.map(item => `
        <button class="section-link" data-section="${item.section}">
          ${item.icons.map(icon => `<i class="${icon}"></i>`).join('')} ${item.label}
        </button>
      `).join('');
    });

    // Set up section handlers
    const sections = document.querySelectorAll('.section-link');
    sections.forEach(section => {
      section.addEventListener('click', async event => {
        event.preventDefault();
        const sectionId = section.dataset.section;
        const handler = handlers.find(h => h.id === sectionId)?.handler;
        if (handler) {
          log(context, `Activating section: ${sectionId} for role: ${role}`);
          await withElement(context, sectionId, async () => {
            toggleViewState(context, { [sectionId]: true });
            await handler(role);
          });
        } else {
          log(context, `No handler found for section: ${sectionId}`);
        }
      });
    });
  }, ERROR_MESSAGES.NAVIGATION_INIT_FAILED);
}

/**
 * Initializes the navigation module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Navigation instance with public methods.
 */
export function initializeNavigationModule(registry) {
  const context = 'navigation.js';
  log(context, 'Initializing navigation module for module registry');
  return {
    defineSectionHandlers: (ctx, ...args) => defineSectionHandlers(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'navigation.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});