// /static/js/community/categories-data.js
import { log } from '../core/logger.js';
import { fetchData } from '../utils/data-fetch.js';
import { withErrorHandling } from '../utils/error.js';
import { validateUserId } from '../core/user.js';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { createModuleInitializer, shouldInitializeForPageType } from '../utils/initialization.js';

const context = 'categories-data.js';

const state = {
    cumulativeDeselections: [],
};

export async function loadCategories(context, userId, isAdmin = false) {
    log(context, `Loading categories for user: ${userId}, isAdmin: ${isAdmin}`);
    return await withErrorHandling(`${context}:loadCategories`, async () => {
        const token = getAuthToken(); // Assume this is imported from auth.js
        if (!token) {
            throw new Error('User not authenticated');
        }
        await validateUserId(context); // Existing check, likely validates userId
        const data = await fetchData(context, API_ENDPOINTS.CATEGORIES, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` // Ensure token is passed
            }
        });
        return {
            categories: data.categories || {},
            deselected: data.deselected || [],
            previousDeselected: data.previousDeselected || [],
            prompt: data.prompt || '',
            selected: data.selected || [],
        };
    }, ERROR_MESSAGES.FETCH_FAILED('categories'), () => ({
        categories: {},
        deselected: [],
        previousDeselected: [],
        selected: [],
        prompt: '',
    }));
}

export async function saveCategories(context, data) {
    log(context, 'Saving categories');
    return await withErrorHandling(`${context}:saveCategories`, async () => {
        const token = getAuthToken(); // Assume this is imported from auth.js
        if (!token) {
            throw new Error('User not authenticated');
        }
        return await fetchData(context, API_ENDPOINTS.SAVE_CATEGORIES, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Ensure token is passed
            },
            body: JSON.stringify(data),
        });
    }, ERROR_MESSAGES.FETCH_FAILED('categories save'));
}

export async function resetCategories(context, userId) {
    log(context, `Resetting categories for user: ${userId}`);
    return await withErrorHandling(`${context}:resetCategories`, async () => {
        const token = getAuthToken(); // Assume this is imported from auth.js
        if (!token) {
            throw new Error('User not authenticated');
        }
        await validateUserId(context); // Existing check
        return await fetchData(context, API_ENDPOINTS.RESET_CATEGORIES, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Ensure token is passed
            },
            body: JSON.stringify({ userId }),
        });
    }, ERROR_MESSAGES.FETCH_FAILED('categories reset'));
}

export function mergeDeselections(context, newDeselections) {
    if (Array.isArray(newDeselections)) {
        log(context, 'Merging new deselections:', newDeselections);
        state.cumulativeDeselections = [...new Set([...state.cumulativeDeselections, ...newDeselections])];
    }
    return state.cumulativeDeselections;
}

export function getCumulativeDeselections(context) {
    log(context, 'Retrieving cumulative deselections');
    return state.cumulativeDeselections;
}

export function updateDeselectedCategories(context, selectedCategories, allCategories) {
    log(context, 'Updating deselected categories');
    return withErrorHandling(`${context}:updateDeselectedCategories`, () => {
        const newDeselections = allCategories.filter(cat => !selectedCategories.includes(cat));
        mergeDeselections(context, newDeselections);
        return {
            deselected: newDeselections,
            previousDeselected: getCumulativeDeselections(context),
        };
    }, ERROR_MESSAGES.DATA_PROCESSING_FAILED, () => ({
        deselected: [],
        previousDeselected: [],
    }));
}

export function transformCategoriesData(formData) {
    log(context, 'Transforming categories form data');
    return {
        prompt: formData.get('prompt')?.trim(),
        categories: JSON.parse(formData.get('categories') || '{}'),
        deselected: JSON.parse(formData.get('deselected') || '[]'),
        previousDeselected: JSON.parse(formData.get('previousDeselected') || '[]'),
        selected: formData.getAll ? formData.getAll('selected') : [],
    };
}

export function validateCategoriesData(formData) {
    log(context, 'Validating categories form data');
    return !!formData.get('prompt')?.trim();
}

export function initializeCategoriesDataModule(registry) {
    return createModuleInitializer(context, {
        loadCategories,
        saveCategories,
        resetCategories,
        mergeDeselections,
        getCumulativeDeselections,
        updateDeselectedCategories,
        transformCategoriesData,
        validateCategoriesData,
    });
}

if (shouldInitializeForPageType('community')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-community page');
}