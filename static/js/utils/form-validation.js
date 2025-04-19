// /static/js/utils/form-validation.js
// Purpose: Provides form validation utilities for common form fields.

import { log } from '../core/logger.js';
import { withErrorHandling } from './error.js';
import { isValidEmail } from './form-validation-utils.js';
import { ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from './initialization.js';

/**
 * Validates required fields in a form.
 * @param {string} context - The context or module name.
 * @param {FormData} formData - The form data.
 * @param {string[]} requiredFields - Array of required field names.
 * @returns {boolean} True if all required fields are valid, false otherwise.
 */
export function validateRequiredFields(context, formData, requiredFields) {
  log(context, `Validating required fields: ${requiredFields.join(', ')}`);
  return withErrorHandling(`${context}:validateRequiredFields`, () => {
    return requiredFields.every(field => {
      const value = formData.get(field)?.trim();
      if (!value) {
        log(context, `Required field missing: ${field}`);
        return false;
      }
      if (field.includes('email') && !isValidEmail(context, value)) {
        log(context, `Invalid email format: ${value}`);
        return false;
      }
      return true;
    });
  }, ERROR_MESSAGES.FORM_VALIDATION_FAILED);
}

/**
 * Validates password fields, ensuring they match and meet requirements.
 * @param {string} context - The context or module name.
 * @param {FormData} formData - The form data.
 * @param {string} passwordField - The name of the password field.
 * @param {string} confirmField - The name of the confirm password field.
 * @returns {boolean} True if passwords are valid and match, false otherwise.
 */
export function validatePassword(context, formData, passwordField, confirmField) {
  log(context, `Validating password fields: ${passwordField}, ${confirmField}`);
  return withErrorHandling(`${context}:validatePassword`, () => {
    const password = formData.get(passwordField);
    const confirmPassword = formData.get(confirmField);
    if (!password || !confirmPassword) {
      log(context, 'Password or confirm password missing');
      return false;
    }
    if (password !== confirmPassword) {
      log(context, 'Passwords do not match');
      return false;
    }
    if (password.length < 8) {
      log(context, 'Password must be at least 8 characters');
      return false;
    }
    return true;
  }, ERROR_MESSAGES.FORM_VALIDATION_FAILED);
}

/**
 * Validates a phone number based on signup type.
 * @param {string} context - The context or module name.
 * @param {FormData} formData - The form data.
 * @param {string} phoneField - The name of the phone field.
 * @param {string} typeField - The name of the signup type field.
 * @returns {boolean} True if the phone number is valid, false otherwise.
 */
export function validatePhoneNumber(context, formData, phoneField, typeField) {
  log(context, `Validating phone number: ${phoneField}`);
  return withErrorHandling(`${context}:validatePhoneNumber`, () => {
    const signupType = formData.get(typeField);
    const phone = formData.get(phoneField)?.trim();
    if (signupType === 'merchant' && !phone) {
      log(context, 'Phone number required for merchant signup');
      return false;
    }
    if (phone) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phone)) {
        log(context, `Invalid phone number format: ${phone}`);
        return false;
      }
    }
    return true;
  }, ERROR_MESSAGES.FORM_VALIDATION_FAILED);
}

/**
 * Initializes the form-validation module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} FormValidation instance with public methods.
 */
export function initializeFormValidationModule(registry) {
  const context = 'form-validation.js';
  log(context, 'Initializing form-validation module for module registry');
  return {
    validateRequiredFields: (ctx, ...args) => validateRequiredFields(ctx, ...args),
    validatePassword: (ctx, ...args) => validatePassword(ctx, ...args),
    validatePhoneNumber: (ctx, ...args) => validatePhoneNumber(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'form-validation.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});