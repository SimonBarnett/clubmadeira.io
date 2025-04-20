// /static/js/utils/form-validation-utils.js
// Purpose: Provides helper functions for form validation.

import { log } from '../core/logger.js';
import { withErrorHandling } from './error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from './initialization.js';

/**
 * Checks if a form field is empty.
 * @param {string} context - The context or module name.
 * @param {string} value - The field value.
 * @returns {boolean} True if the field is empty, false otherwise.
 */
export function isEmpty(context, value) {
  log(context, `Checking if value is empty: ${value}`);
  return !value || value.trim() === '';
}

/**
 * Validates an email address format.
 * @param {string} context - The context or module name.
 * @param {string} email - The email address to validate.
 * @returns {boolean} True if the email is valid, false otherwise.
 */
export function isValidEmail(context, email) {
  log(context, `Validating email: ${email}`);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return withErrorHandling(`${context}:isValidEmail`, () => emailRegex.test(email), ERROR_MESSAGES.FORM_VALIDATION_FAILED);
}

/**
 * Initializes the form-validation-utils module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} FormValidationUtils instance with public methods.
 */
export function initializeFormValidationUtilsModule(registry) {
  const context = 'form-validation-utils.js';
  log(context, 'Initializing form-validation-utils module for module registry');
  return {
    isEmpty: (ctx, ...args) => isEmpty(ctx, ...args),
    isValidEmail: (ctx, ...args) => isValidEmail(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'form-validation-utils.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});