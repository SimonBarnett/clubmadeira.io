// /static/js/community/categories-events.js
// Purpose: Manages event listeners for category form interactions on the community categories page.

import { log } from '../core/logger.js';
import { setupEventListeners } from '../utils/event-listeners.js';
import { submitConfiguredForm, updateFormState } from '../utils/form-submission.js';
import { updateDeselectedCategories } from './categories-data.js';
import { updateCategoriesSection } from './categories-ui.js';
import { withElement } from '../utils/dom-manipulation.js';
import { notifyOperationResult } from '../core/notifications.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { createModuleInitializer } from '../utils/initialization.js';

/**
 * Sets up event listeners for category form interactions.
 * @param {string} context - The context or module name.
 * @returns {void}
 */
export function setupCategoryEvents(context) {
  log(context, 'Setting up category form event listeners');
  withErrorHandling(`${context}:setupCategoryEvents`, () => {
    setupEventListeners(context, [
      // Form submission for refining categories
      {
        eventType: 'submit',
        selector: '#categoryForm',
        handler: async (event) => {
          event.preventDefault();
          await withErrorHandling(`${context}:submitCategoryForm`, async () => {
            await submitConfiguredForm(context, 'categoryForm', API_ENDPOINTS.CATEGORIES, 'categories', {
              successMessage: SUCCESS_MESSAGES.CATEGORIES_SUBMITTED,
              onSuccess: (data) => updateCategoriesSection(context, data),
              onError: (error, formData) => {
                updateCategoriesSection(context, {
                  categories: JSON.parse(formData.get('categories') || '{}'),
                  deselected: JSON.parse(formData.get('deselected') || '[]'),
                  previousDeselected: JSON.parse(formData.get('previousDeselected') || '[]'),
                  selected: formData.getAll ? formData.getAll('selected') : [],
                  prompt: formData.get('prompt') || '',
                  errorMessage: error.message,
                });
              },
            });
          }, ERROR_MESSAGES.FORM_SUBMISSION_FAILED);
        },
      },
      // Form submission for saving categories
      {
        eventType: 'click',
        selector: '[data-action="save-categories"]',
        handler: async () => {
          await withErrorHandling(`${context}:saveCategories`, async () => {
            await submitConfiguredForm(context, 'categoryForm', API_ENDPOINTS.SAVE_CATEGORIES, 'categories', {
              onSuccess: (data) => updateCategoriesSection(context, data),
            });
          }, ERROR_MESSAGES.FORM_SUBMISSION_FAILED);
        },
      },
      // Form submission for resetting categories
      {
        eventType: 'click',
        selector: '[data-action="reset-categories"]',
        handler: async () => {
          await withErrorHandling(`${context}:resetCategories`, async () => {
            await submitConfiguredForm(context, 'reset-categories-form', API_ENDPOINTS.RESET_CATEGORIES, 'resetCategories', {
              onSuccess: (data) => updateCategoriesSection(context, data),
            });
          }, ERROR_MESSAGES.FORM_SUBMISSION_FAILED);
        },
      },
      // Checkbox change for deselected categories
      {
        eventType: 'change',
        selector: 'input[data-deselected]',
        handler: async () => {
          await withErrorHandling(`${context}:updateDeselections`, async () => {
            await withElement(context, 'deselected', async (deselectedInput) => {
              await withElement(context, 'previousDeselected', async (previousDeselectedInput) => {
                const allCategories = Array.from(document.querySelectorAll('input[name="selected"]')).map(cb => cb.value);
                const selectedCategories = Array.from(document.querySelectorAll('input[name="selected"]:checked')).map(cb => cb.value);
                const { deselected, previousDeselected } = updateDeselectedCategories(context, selectedCategories, allCategories);
                await updateFormState(context, 'categoryForm', {
                  deselected: JSON.stringify(deselected),
                  previousDeselected: JSON.stringify(previousDeselected),
                });
                log(context, 'Updated deselections:', deselected);
              });
            }, 10, 100, true);
          }, ERROR_MESSAGES.DATA_PROCESSING_FAILED);
        },
      },
    ]);
  }, ERROR_MESSAGES.EVENT_HANDLER_FAILED);
}

/**
 * Initializes the categories events module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Categories events instance with public methods.
 */
export function initializeCategoriesEventsModule(registry) {
  return createModuleInitializer('categories-events.js', {
    setupCategoryEvents,
  });
}

// Initialize module with lifecycle logging
const context = 'categories-events.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});