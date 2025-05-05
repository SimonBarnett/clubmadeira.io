// /static/js/community/categories-page.js
import { log, warn } from '../core/logger.js';
import { loadCategories } from './categories-data.js';
import { renderCategoriesSection } from './categories-ui.js';
import { setupCategoryEvents } from './categories-events.js';
import { withAuthenticatedUser } from '../core/auth.js';
import { setupCategoriesNavigation } from './categories-navigation.js';
import { getElements } from '../utils/dom-manipulation.js';
import { initializeTinyMCE } from '../core/mce.js';
import { error as notifyError } from '../core/notifications.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withErrorHandling } from '../utils/error.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { shouldInitializeForPageType } from '../utils/initialization.js';

const context = 'categories-page.js';

/**
 * Initializes the categories page, ensuring proper navigation, data loading, and UI rendering.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function initializeCategoriesPage(context) {
    log(context, 'Initializing categories page');
    await withAuthenticatedUser(context, async (userId) => {
        await withErrorHandling(`${context}:initializeCategoriesPage`, async () => {
            // Set up navigation
            await setupCategoriesNavigation(context, 'community', 'categories');

            // Load categories data
            const data = await loadCategories(context, userId, false);

            // Fetch required DOM elements
            const elements = await getElements(context, ['categories', 'category-form', 'category-error', 'prompt']);
            
            // Validate critical elements
            if (!elements['category-form'] || !elements.categories) {
                warn(context, 'Critical elements (category-form or categories) not found, displaying error message');
                const errorContainer = elements['category-error'];
                if (errorContainer) {
                    errorContainer.textContent = 'Failed to load category form. Please refresh the page.';
                    errorContainer.style.display = 'block';
                }
                notifyError(context, 'Failed to load category form. Please refresh the page.');
                return;
            }

            if (!elements['category-error']) {
                warn(context, 'category-error element not found, error messages may not display');
            }
            if (!elements.prompt) {
                warn(context, 'prompt element not found, prompt input may not function');
            }

            // Render categories section
            await renderCategoriesSection(context, data, elements);

            // Set up event listeners
            setupCategoryEvents(context);

            // Initialize TinyMCE with delay to ensure DOM readiness
            setTimeout(async () => {
                const selectors = ['#aboutCommunity', '#stylingDetails', '#page1Content'].filter(selector => document.querySelector(selector));
                if (selectors.length > 0) {
                    await initializeTinyMCE(context, selectors.join(','));
                } else {
                    warn(context, 'No TinyMCE target elements found');
                }
            }, 100);
        }, ERROR_MESSAGES.FETCH_FAILED('categories page initialization'), () => {
            warn(context, 'Failed to initialize categories page, displaying fallback message');
            const errorContainer = document.getElementById('category-error');
            if (errorContainer) {
                errorContainer.textContent = 'Failed to initialize categories. Please try again later.';
                errorContainer.style.display = 'block';
            }
        });
    }, 'initializeCategoriesPage');
}

if (shouldInitializeForPageType('community')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
        initializeCategoriesPage(context);
    });
} else {
    log(context, 'Skipping initialization for non-community page');
}