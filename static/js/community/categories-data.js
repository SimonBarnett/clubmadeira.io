// /static/js/community/categories-data.js
// Purpose: Manages data fetching, updates, and validation for the community categories page.

import { log } from '../core/logger.js';
import { fetchData } from '../utils/data-fetch.js';
import { withErrorHandling } from '../utils/error.js';
import { validateUserId } from '../utils/auth.js';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { createModuleInitializer } from '../utils/initialization.js';

// Module-scoped state for cumulative deselections
const state = {
  cumulativeDeselections: [],
};

/**
 * Fetches categories from the server.
 * @param {string} context - The context or module name.
 * @param {string} userId - The user ID.
 * @param {boolean} [isAdmin=false] - Whether the user is an admin.
 * @returns {Promise<Object>} The categories data.
 */
export async function loadCategories(context, userId, isAdmin = false) {
  log(context, `Loading categories for user: ${userId}, isAdmin: ${isAdmin}`);
  return await withErrorHandling(`${context}:loadCategories`, async () => {
    await validateUserId(context);
    const data = await fetchData(API_ENDPOINTS.CATEGORIES, { method: 'GET' });
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

/**
 * Saves categories to the server.
 * @param {string} context - The context or module name.
 * @param {Object} data - The categories data to save.
 * @returns {Promise<Object>} The server response.
 */
export async function saveCategories(context, data) {
  log(context, 'Saving categories');
  return await withErrorHandling(`${context}:saveCategories`, async () => {
    return await fetchData(API_ENDPOINTS.SAVE_CATEGORIES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }, ERROR_MESSAGES.FETCH_FAILED('categories save'));
}

/**
 * Resets categories for a user.
 * @param {string} context - The context or module name.
 * @param {string} userId - The user ID.
 * @returns {Promise<Object>} The server response.
 */
export async function resetCategories(context, userId) {
  log(context, `Resetting categories for user: ${userId}`);
  return await withErrorHandling(`${context}:resetCategories`, async () => {
    await validateUserId(context);
    return await fetchData(API_ENDPOINTS.RESET_CATEGORIES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
  }, ERROR_MESSAGES.FETCH_FAILED('categories reset'));
}

/**
 * Merges new deselections with the cumulative state.
 * @param {string} context - The context or module name.
 * @param {string[]} newDeselections - The new deselections to merge.
 * @returns {string[]} The updated cumulative deselections.
 */
export function mergeDeselections(context, newDeselections) {
  if (Array.isArray(newDeselections)) {
    log(context, 'Merging new deselections:', newDeselections);
    state.cumulativeDeselections = [...new Set([...state.cumulativeDeselections, ...newDeselections])];
  }
  return state.cumulativeDeselections;
}

/**
 * Gets the current cumulative deselections.
 * @param {string} context - The context or module name.
 * @returns {string[]} The cumulative deselections.
 */
export function getCumulativeDeselections(context) {
  log(context, 'Retrieving cumulative deselections');
  return state.cumulativeDeselections;
}

/**
 * Updates deselected categories based on provided selections.
 * @param {string} context - The context or module name.
 * @param {string[]} selectedCategories - The currently selected categories.
 * @param {string[]} allCategories - All available categories.
 * @returns {Object} Updated deselected and previousDeselected arrays.
 */
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

/**
 * Transforms categories form data for submission.
 * @param {FormData} formData - The form data.
 * @returns {Object} Transformed data for API submission.
 */
export function transformCategoriesData(formData) {
  log('categories-data.js', 'Transforming categories form data');
  return {
    prompt: formData.get('prompt')?.trim(),
    categories: JSON.parse(formData.get('categories') || '{}'),
    deselected: JSON.parse(formData.get('deselected') || '[]'),
    previousDeselected: JSON.parse(formData.get('previousDeselected') || '[]'),
    selected: formData.getAll ? formData.getAll('selected') : [],
  };
}

/**
 * Validates categories form data.
 * @param {FormData} formData - The form data.
 * @returns {boolean} True if valid, false otherwise.
 */
export function validateCategoriesData(formData) {
  log('categories-data.js', 'Validating categories form data');
  return !!formData.get('prompt')?.trim();
}

/**
 * Initializes the categories data module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Categories data instance with public methods.
 */
export function initializeCategoriesDataModule(registry) {
  return createModuleInitializer('categories-data.js', {
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

// Initialize module with lifecycle logging
const context = 'categories-data.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});