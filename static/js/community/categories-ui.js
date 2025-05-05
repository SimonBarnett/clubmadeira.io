// /static/js/community/categories-ui.js
import { log, warn } from '../core/logger.js';
import { toggleViewState } from '../utils/dom-manipulation.js';
import { success, error } from '../core/notifications.js';
import { renderForm } from '../utils/form-rendering.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { getFormConfig } from '../config/form-configs.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { shouldInitializeForPageType } from '../utils/initialization.js';

const context = 'categories-ui.js';

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

export async function renderCategoriesSection(context, data, { categoriesSection, formContainer, errorDiv, promptInput }) {
    log(context, 'Rendering categories section with data:', data);
    toggleViewState(context, { [errorDiv.id]: false });
    errorDiv.textContent = '';
    if (data.errorMessage) {
        errorDiv.textContent = data.errorMessage;
        toggleViewState(context, { [errorDiv.id]: true });
        error(context, data.errorMessage);
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

export async function updateCategoriesSection(context, data, elements) {
    log(context, 'Updating categories section with data:', data);
    await renderCategoriesSection(context, data, elements);
}

export function initializeCategoriesUiModule(registry) {
    log(context, 'Initializing categories UI module for module registry');
    return {
        renderCategoriesSection: (ctx, ...args) => renderCategoriesSection(ctx, ...args),
        updateCategoriesSection: (ctx, ...args) => updateCategoriesSection(ctx, ...args),
    };
}

if (shouldInitializeForPageType('community')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-community page');
}