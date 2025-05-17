// /static/js/community/categories-events.js
import { log, warn } from '../core/logger.js';
import { setupEventListeners } from '../utils/event-listeners.js';
import { submitConfiguredForm, updateFormState } from '../utils/form-submission.js';
import { updateDeselectedCategories } from './categories-data.js';
import { updateCategoriesSection } from './categories-ui.js';
import { withElement } from '../utils/dom-manipulation.js';
import { notifyOperationResult } from '../core/notifications.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { API_ENDPOINTS } from '../config/endpoints.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { createModuleInitializer, shouldInitializeForPageType } from '../utils/initialization.js';

const context = 'categories-events.js';

/**
 * Sets up event listeners for the category form, ensuring form submission is captured via fetch.
 * @param {string} context - The context for logging and error handling.
 * @param {Object} elements - The DOM elements object containing references to UI components.
 */
export function setupCategoryEvents(context, elements) {
    log(context, 'Setting up category form event listeners');
    withErrorHandling(`${context}:setupCategoryEvents`, () => {
        // Ensure form exists
        const formElement = document.querySelector('#category-form');
        if (!formElement || !(formElement instanceof HTMLElement)) {
            warn(context, 'Form #category-form not found or invalid during event setup');
            notifyOperationResult(context, {
                success: false,
                message: 'Form not found. Please refresh the page.',
                defaultError: ERROR_MESSAGES.ELEMENT_NOT_FOUND,
            });
            return;
        }

        // Prevent duplicate submit listeners
        if (formElement.dataset.submitListenerAttached) {
            log(context, 'Submit listener already attached to #category-form, skipping');
            return;
        }

        // Main submit handler
        const submitHandler = async (event) => {
            log(context, 'Submit event triggered for #category-form');
            event.preventDefault(); // Prevent direct form submission
            event.stopPropagation(); // Prevent bubbling to other listeners
            log(context, 'Default form submission prevented');

            try {
                log(context, 'Before submitConfiguredForm');
                await submitConfiguredForm(context, 'category-form', API_ENDPOINTS.CATEGORIES, 'categories', {
                    successMessage: SUCCESS_MESSAGES.CATEGORIES_SUBMITTED,
                    onSuccess: (data) => {
                        log(context, 'onSuccess called with data:', data);
                        updateCategoriesSection(context, data, elements);
                    },
                    onError: (error, formData) => {
                        log(context, 'onError called with error:', error.message);
                        updateCategoriesSection(context, {
                            categories: JSON.parse(formData.get('categories') || '{}'),
                            deselected: JSON.parse(formData.get('deselected') || '[]'),
                            previousDeselected: JSON.parse(formData.get('previousDeselected') || '[]'),
                            selected: formData.getAll ? formData.getAll('selected') : [],
                            prompt: formData.get('prompt') || '',
                            errorMessage: error.message,
                        }, elements);
                    },
                });
                log(context, 'After submitConfiguredForm');
            } catch (error) {
                log(context, 'Error in submit handler:', error.message);
                notifyOperationResult(context, {
                    success: false,
                    message: error.message || ERROR_MESSAGES.FORM_SUBMISSION_FAILED,
                });
            } finally {
                log(context, 'Submit handler completed');
            }
        };

        // Attach listener directly to the form
        formElement.addEventListener('submit', submitHandler);

        // Delegated listener on document to catch dynamic forms
        document.addEventListener('submit', (event) => {
            const targetForm = event.target;
            if (targetForm && targetForm.id === 'category-form' && !event.defaultPrevented) {
                log(context, 'Delegated submit event triggered for #category-form');
                submitHandler(event);
            }
        });

        // Fallback: Prevent direct submission if all else fails
        formElement.addEventListener('submit', (event) => {
            if (!event.defaultPrevented) {
                log(context, 'Fallback: Preventing direct form submission for #category-form');
                event.preventDefault();
                event.stopPropagation();
            }
        });

        // Use setupEventListeners for other events
        setupEventListeners(context, [
            // Click handler for "Save Categories" button
            {
                eventType: 'click',
                selector: '[data-action="save-categories"]',
                handler: async () => {
                    await withErrorHandling(`${context}:saveCategories`, async () => {
                        await submitConfiguredForm(context, 'category-form', API_ENDPOINTS.SAVE_CATEGORIES, 'categories', {
                            onSuccess: (data) => updateCategoriesSection(context, data, elements),
                        });
                    }, ERROR_MESSAGES.FORM_SUBMISSION_FAILED);
                },
            },
            // Click handler for "Reset Categories" button
            {
                eventType: 'click',
                selector: '[data-action="reset-categories"]',
                handler: async () => {
                    await withErrorHandling(`${context}:resetCategories`, async () => {
                        await submitConfiguredForm(context, 'reset-categories-form', API_ENDPOINTS.RESET_CATEGORIES, 'resetCategories', {
                            onSuccess: (data) => updateCategoriesSection(context, data, elements),
                        });
                    }, ERROR_MESSAGES.FORM_SUBMISSION_FAILED);
                },
            },
            // Change handler for category checkboxes
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
                                await updateFormState(context, 'category-form', {
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

        // Mark form as having a submit listener
        formElement.dataset.submitListenerAttached = 'true';
        log(context, 'Submit event listener attached to #category-form');
    }, ERROR_MESSAGES.EVENT_HANDLER_FAILED);
}

/**
 * Initializes the categories events module for use with a registry.
 * @param {object} registry - The registry for module initialization.
 * @returns {object} The initialized module.
 */
export function initializeCategoriesEventsModule(registry) {
    return createModuleInitializer(context, {
        setupCategoryEvents,
    });
}

// Initialize the module if on a community page
if (shouldInitializeForPageType('community')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
        // Note: setupCategoryEvents is called from categories-page.js with elements
    });
} else {
    log(context, 'Skipping initialization for non-community page');
}