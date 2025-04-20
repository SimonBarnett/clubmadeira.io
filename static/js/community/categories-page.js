// /static/js/community/categories-page.js
// Purpose: Orchestrates the community categories page by coordinating data, UI, and event handling.

import { log } from '../core/logger.js';
import { loadCategories } from './categories-data.js';
import { renderCategoriesSection } from './categories-ui.js';
import { setupCategoryEvents } from './categories-events.js'; // Updated to reference correct file
import { withAuthenticatedUser } from '../utils/auth.js';
import { setupCategoriesNavigation } from './categories-navigation.js';
import { getElements } from '../utils/dom-manipulation.js';
import { initializeTinyMCE } from '../core/mce.js'; // Added for TinyMCE
import { ERROR_MESSAGES } from '../config/messages.js';
import { withErrorHandling } from '../utils/error.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Initializes the categories page.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializeCategoriesPage(context) {
  log(context, 'Initializing categories page');
  await withAuthenticatedUser(async (userId) => {
    await withErrorHandling(`${context}:initializeCategoriesPage`, async () => {
      await setupCategoriesNavigation(context, 'community', 'categories');
      const data = await loadCategories(context, userId, false);
      const elements = await getElements(context, ['categoriesSection', 'categoriesForm', 'categoryError', 'promptInput']);
      await renderCategoriesSection(context, data, elements);
      setupCategoryEvents(context);
      // Initialize TinyMCE for rich text editors
      await initializeTinyMCE(context, '#aboutCommunity, #stylingDetails, #page1Content');
    }, ERROR_MESSAGES.FETCH_FAILED('categories page initialization'));
  });
}

/**
 * Initializes the categories page module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Categories page instance with public methods.
 */
export function initializeCategoriesPageModule(registry) {
  const context = 'categories-page.js';
  log(context, 'Initializing categories page module for module registry');
  return {
    initializeCategoriesPage: (ctx) => initializeCategoriesPage(ctx),
  };
}

// Initialize module with lifecycle logging
const context = 'categories-page.js';
withScriptLogging(context, () => {
  initializeCategoriesPage(context);
});