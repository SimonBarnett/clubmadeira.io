// /static/js/community/categories-page.js
import { log, warn } from '../core/logger.js';
import { loadCategories, saveCategories } from './categories-data.js'; // Added saveCategories import
import { renderCategoriesSection } from './categories-ui.js';
import { setupCategoryEvents } from './categories-events.js';
import { withAuthenticatedUser } from '../core/auth.js';
import { setupCategoriesNavigation } from './categories-navigation.js';
import { getElements, elementCache } from '../utils/dom-manipulation.js';
import { initializeTinyMCE } from '../core/mce.js';
import { error as notifyError } from '../core/notifications.js';
import { ERROR_MESSAGES } from '../config/constants.js';
import { withErrorHandling } from '../utils/error.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { shouldInitializeForPageType } from '../utils/initialization.js';

const context = 'categories-page.js';

/**
 * Initializes the categories page, setting up navigation, UI, and event listeners without automatic data loading.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializeCategoriesPage(context) {
    log(context, 'Initializing categories page');

    // Clear element cache to avoid stale references
    elementCache.clear();
    log(context, 'Cleared element cache before fetching elements');

    // Fetch required DOM elements with retries
    const elements = await getElements(context, ['categories', 'category-form', 'category-error', 'load-categories'], 5, 100);

    // Define required elements for validation
    const requiredElements = ['categories', 'category-form', 'category-error', 'load-categories'];

    // Check for missing or invalid elements
    const missingElements = requiredElements.filter(key => !elements[key] || !(elements[key] instanceof HTMLElement));
    if (missingElements.length > 0) {
        warn(context, `Missing elements: ${missingElements.join(', ')}`);
        notifyError(context, 'Required elements missing. Please refresh the page.', { preventDuplicate: true });
        return;
    }

    // Set up navigation for the categories page
    await setupCategoriesNavigation(context, 'community', 'categories');

    // Set up "Load Categories" button event listener
    const loadButton = elements['load-categories'];
    loadButton.addEventListener('click', async () => {
        await withAuthenticatedUser(context, async (userId) => {
            await withErrorHandling(`${context}:loadCategories`, async () => {
                const data = await loadCategories(context, userId, false);
                await renderCategoriesSection(context, data, {
                    categoriesSection: elements.categories,
                    formContainer: elements['category-form'],
                    errorDiv: elements['category-error'],
                });
                log(context, 'Categories loaded and rendered successfully');
            }, ERROR_MESSAGES.FETCH_FAILED('loading categories'), (err) => {
                warn(context, `Failed to load categories: ${err.message}`);
                notifyError(context, 'Failed to load categories. Please try again.', { preventDuplicate: true });
            });
        }, () => {
            notifyError(context, 'Please log in to load categories');
        });
    });

    // Set up form submission event listener
    const formElement = elements['category-form'];
    if (formElement && formElement instanceof HTMLElement) {
        log(context, 'Form #category-form found, setting up events');
        if (!formElement.dataset.submitListenerAttached) {
            formElement.addEventListener('submit', async (event) => {
                event.preventDefault(); // Prevent default form submission
                event.stopPropagation(); // Prevent event bubbling
                log(context, 'Submit event triggered for #category-form');

                await withAuthenticatedUser(context, async (userId) => {
                    await withErrorHandling(`${context}:saveCategories`, async () => {
                        const formData = new FormData(formElement);
                        const data = Object.fromEntries(formData); // Basic transformation; adjust as needed
                        await saveCategories(context, data);
                        log(context, 'Categories saved successfully');
                        notifyError(context, 'Categories saved successfully', { type: 'success' }); // Assuming a success notification variant
                    }, ERROR_MESSAGES.FETCH_FAILED('saving categories'), (err) => {
                        warn(context, `Failed to save categories: ${err.message}`);
                        notifyError(context, 'Failed to save categories. Please try again.', { preventDuplicate: true });
                    });
                }, () => {
                    notifyError(context, 'Please log in to save categories');
                });
            });
            formElement.dataset.submitListenerAttached = 'true';
            log(context, 'Event listeners attached to #category-form');
        } else {
            log(context, 'Submit listener already attached, skipping');
        }
    } else {
        warn(context, 'Form #category-form not found or invalid');
        notifyError(context, 'Form not found. Please refresh the page.', { preventDuplicate: true });
        return;
    }

    // Initialize TinyMCE with a delay for DOM readiness
    setTimeout(async () => {
        const selectors = ['#aboutCommunity', '#stylingDetails', '#page1Content'].filter(selector => document.querySelector(selector));
        if (selectors.length > 0) {
            await initializeTinyMCE(context, selectors.join(','));
        } else {
            warn(context, 'No TinyMCE targets found');
        }
    }, 100);
}

if (shouldInitializeForPageType('community')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
        document.addEventListener('DOMContentLoaded', () => {
            initializeCategoriesPage(context);
        });
    });
} else {
    log(context, 'Skipping initialization for non-community page');
}