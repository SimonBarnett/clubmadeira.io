// /static/js/community/categories-ui.js
// Purpose: Manages UI rendering for the community categories page.

import { log, warn } from '../core/logger.js';
import { toggleViewState } from '../utils/dom-manipulation.js';
import { success, error as notifyError } from '../core/notifications.js';
import { renderForm } from '../utils/form-rendering.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { getFormConfig } from '../config/form-configs.js';
import { withScriptLogging } from '../utils/logging-utils.js';

/**
 * Validates categories data structure.
 * @param {Object} categories - The categories data.
 * @returns {boolean} True if valid, false otherwise.
 */
function isValidCategories(categories) {
  return (
    typeof categories === 'object' &&
    !Array.isArray(categories) &&
    Object.keys(categories).length > 0 &&
    Object.keys(categories).length <= 7 &&
    Object.values(categories).every(
      subcats =>
        Array.isArray(subcats) &&
        subcats.length >= 1 &&
        subcats.length <= 7 &&
        subcats.every(s => typeof s === 'string'),
    )
  );
}

/**
 * Renders the categories section UI with the provided data.
 * @param {string} context - The context or module name.
 * @param {Object} data - The categories data to render.
 * @param {Object} elements - DOM elements configuration object.
 * @param {HTMLElement} elements.categoriesSection - The categories section element.
 * @param {HTMLElement} elements.formContainer - The form container element.
 * @param {HTMLElement} elements.errorDiv - The error div element.
 * @param {HTMLElement} elements.promptInput - The prompt input element.
 * @returns {Promise<void>}
 */
export async function renderCategoriesSection(context, data, { categoriesSection, formContainer, errorDiv, promptInput }) {
  log(context, 'Rendering categories section with data:', data);
  toggleViewState(context, { [errorDiv.id]: false });
  errorDiv.textContent = '';

  if (data.errorMessage) {
    errorDiv.textContent = data.errorMessage;
    toggleViewState(context, { [errorDiv.id]: true });
    notifyError(context, data.errorMessage);
  }

  const currentPrompt = promptInput.value || data.prompt || '';
  data.categories = data.categories || {};

  const formConfig = getFormConfig(context, 'categories', {
    currentPrompt,
    deselected: data.deselected || [],
    previousDeselected: data.previousDeselected || [],
    selected: data.selected || [],
    categories: data.categories,
    isValidCategories: isValidCategories(data.categories),
  });

  formContainer.innerHTML = renderForm(formConfig);
  success(context, SUCCESS_MESSAGES.CATEGORIES_RENDERED);
}

/**
 * Updates the categories section UI with new data.
 * @param {string} context - The context or module name.
 * @param {Object} data - The categories data to update the UI with.
 * @param {Object} elements - DOM elements configuration object.
 * @param {HTMLElement} elements.categoriesSection - The categories section element.
 * @param {HTMLElement} elements.formContainer - The form container element.
 * @param {HTMLElement} elements.errorDiv - The error div element.
 * @param {HTMLElement} elements.promptInput - The prompt input element.
 * @returns {Promise<void>}
 */
export async function updateCategoriesSection(context, data, elements) {
  log(context, 'Updating categories section with data:', data);
  await renderCategoriesSection(context, data, elements);
}

/**
 * Initializes the categories UI module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Categories UI instance with public methods.
 */
export function initializeCategoriesUiModule(registry) {
  const context = 'categories-ui.js';
  log(context, 'Initializing categories UI module for module registry');
  return {
    renderCategoriesSection: (ctx, ...args) => renderCategoriesSection(ctx, ...args),
    updateCategoriesSection: (ctx, ...args) => updateCategoriesSection(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'categories-ui.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});