// /static/js/config/form-configs.js
import { log } from '../core/logger.js';
import { validateRequiredFields, validatePassword, validatePhoneNumber } from '../utils/form-validation.js';
import { renderStyles } from '../utils/rendering.js';
import { renderCheckboxList } from '../utils/ui-components.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from './constants.js';
import { withScriptLogging } from '../utils/initialization.js';
import { createModuleInitializer } from '../utils/initialization.js';
import { isValidEmail } from '../utils/form-validation-utils.js';

/**
 * Generates fields for a category form based on provided data.
 * @param {string} context - The context or module name.
 * @param {Object} [options={}] - Options for generating fields (e.g., defaults, category data).
 * @returns {Array} Array of field configurations.
 */
function generateCategoryFields(context, options = {}) {
  log(context, 'Generating category form fields');
  const { defaults = {}, category = {} } = options;
  return [
    {
      type: 'text',
      id: 'category_name',
      name: 'category_name',
      label: 'Category Name',
      required: true,
      value: category.name || defaults.name || '',
      style: renderStyles('categories', { width: '100%', padding: '8px' }),
    },
    {
      type: 'textarea',
      id: 'category_description',
      name: 'category_description',
      label: 'Description',
      value: category.description || defaults.description || '',
      style: renderStyles('categories', { width: '100%', padding: '8px' }),
    },
  ];
}

/**
 * Generates custom fields for a category form based on provided data.
 * @param {string} context - The context or module name.
 * @param {Object} [options={}] - Options for generating fields (e.g., custom fields).
 * @returns {Array} Array of custom field configurations.
 */
function generateCategoryCustomFields(context, options = {}) {
  log(context, 'Generating category custom form fields');
  const { customFields = [] } = options;
  return customFields.map((field, index) => ({
    type: field.type || 'text',
    id: `custom_field_${index}`,
    name: `custom_field_${field.key || index}`,
    label: field.label || `Custom Field ${index + 1}`,
    required: field.required || false,
    value: field.value || '',
    style: renderStyles('categories', { width: '100%', padding: '8px' }),
  }));
}

/**
 * Generates a categories form configuration based on provided data.
 * @param {string} context - The context or module name.
 * @param {Object} [options={}] - Options for generating the form (e.g., defaults, category data).
 * @returns {Object} The categories form configuration.
 */
function getCategoriesFormConfig(context, options = {}) {
  log(context, 'Generating categories form config');
  const { defaults = {}, category = {}, customFields = [] } = options;
  return {
    id: 'categoriesForm',
    action: '/categories',
    method: 'POST',
    submitButtonText: 'Save Category',
    successMessage: 'Category saved successfully!',
    transform: formData => {
      const customFieldEntries = Array.from(formData.entries())
        .filter(([key]) => key.startsWith('custom_field_'))
        .map(([key, value]) => ({ key: key.replace('custom_field_', ''), value }));
      return {
        name: formData.get('category_name')?.trim(),
        description: formData.get('category_description')?.trim(),
        custom_fields: customFieldEntries,
      };
    },
    validate: formData => {
      try {
        return !!formData.get('category_name')?.trim();
      } catch (err) {
        throw new Error(err.message || ERROR_MESSAGES.FORM_VALIDATION_FAILED);
      }
    },
    validationError: 'Please enter a valid category name.',
    fetchOptions: {
      headers: { 'Content-Type': 'application/json' },
    },
    fields: [
      ...generateCategoryFields(context, { defaults, category }),
      ...generateCategoryCustomFields(context, { customFields }),
    ],
  };
}

/**
 * Form configuration registry.
 * @type {Object.<string, Object>}
 */
const FORM_CONFIGS = {
  login: {
    id: 'loginForm',
    action: '/',
    method: 'POST',
    submitButtonText: 'Login',
    successMessage: 'Login successful!',
    transform: formData => ({
      email: formData.get('email')?.trim(),
      password: formData.get('password'),
    }),
    validate: formData => {
      try {
        return (
          !!formData.get('email')?.trim() &&
          isValidEmail('login', formData.get('email')) &&
          !!formData.get('password')
        );
      } catch (err) {
        throw new Error(err.message || ERROR_MESSAGES.FORM_VALIDATION_FAILED);
      }
    },
    validationError: 'Please enter a valid email and password.',
    fetchOptions: {
      headers: { 'Content-Type': 'application/json' },
    },
  },
  signup: {
    id: 'signupForm',
    action: '/signup',
    method: 'POST',
    submitButtonText: 'Sign Me Up',
    successMessage: 'Signup successful! Please verify OTP.',
    transform: formData => ({
      signup_type: formData.get('signup_type')?.trim(),
      contact_name: formData.get('contact_name')?.trim(),
      phone_number: formData.get('signup_phone')?.trim(),
      email: formData.get('signup_email')?.trim(),
      password: formData.get('signup_password'),
    }),
    validate: formData => {
      try {
        return (
          !!formData.get('signup_type')?.trim() &&
          !!formData.get('contact_name')?.trim() &&
          validatePhoneNumber('signup', formData.get('signup_phone')) &&
          !!formData.get('signup_email')?.trim() &&
          isValidEmail('signup', formData.get('signup_email')) &&
          !!formData.get('signup_password') &&
          formData.get('signup_password') === formData.get('signup_confirm_password')
        );
      } catch (err) {
        throw new Error(err.message || ERROR_MESSAGES.FORM_VALIDATION_FAILED);
      }
    },
    validationError: 'Please complete all fields correctly and ensure passwords match.',
    fetchOptions: {
      headers: { 'Content-Type': 'application/json' },
    },
  },
  forgotPassword: {
    id: 'forgotPasswordForm',
    action: '/reset-password',
    method: 'POST',
    submitButtonText: 'Send OTP via SMS',
    successMessage: 'OTP sent successfully! Please check your SMS.',
    transform: formData => ({
      email: formData.get('email')?.trim(),
    }),
    validate: formData => {
      try {
        return !!formData.get('email')?.trim() && isValidEmail('forgotPassword', formData.get('email'));
      } catch (err) {
        throw new Error(err.message || ERROR_MESSAGES.FORM_VALIDATION_FAILED);
      }
    },
    validationError: 'Please enter a valid email.',
    fetchOptions: {
      headers: { 'Content-Type': 'application/json' },
    },
  },
  verifyOtp: {
    id: 'verifyOtpForm',
    action: '/verify-reset-code',
    method: 'POST',
    submitButtonText: 'Update Password',
    successMessage: 'Password updated successfully!',
    transform: formData => ({
      email: formData.get('email')?.trim(),
      code: formData.get('code')?.trim(),
      new_password: formData.get('new_password'),
      confirm_new_password: formData.get('confirm_new_password'),
    }),
    validate: formData => {
      try {
        return (
          !!formData.get('email')?.trim() &&
          isValidEmail('verifyOtp', formData.get('email')) &&
          !!formData.get('code')?.trim() &&
          !!formData.get('new_password') &&
          formData.get('new_password') === formData.get('confirm_new_password')
        );
      } catch (err) {
        throw new Error(err.message || ERROR_MESSAGES.FORM_VALIDATION_FAILED);
      }
    },
    validationError: 'Please complete all fields correctly and ensure passwords match.',
    fetchOptions: {
      headers: { 'Content-Type': 'application/json' },
    },
  },
  verifySignupOtp: {
    id: 'signupOtpSection',
    action: '/verify-reset-code',
    method: 'POST',
    submitButtonText: 'Verify OTP',
    successMessage: 'OTP verified successfully!',
    transform: formData => ({
      otp: formData.get('otp')?.trim(),
    }),
    validate: formData => {
      try {
        return !!formData.get('otp')?.trim();
      } catch (err) {
        throw new Error(err.message || ERROR_MESSAGES.FORM_VALIDATION_FAILED);
      }
    },
    validationError: 'Please enter a valid OTP.',
    fetchOptions: {
      headers: { 'Content-Type': 'application/json' },
    },
  },
  userSettings: {
    id: 'userSettingsForm',
    action: '/settings/user',
    method: 'PATCH',
    submitButtonText: 'Save Settings',
    successMessage: 'User settings updated successfully!',
    transform: formData => ({
      contact_name: formData.get('contact_name')?.trim(),
      email_address: formData.get('email_address')?.trim(),
      phone_number: formData.get('phone_number')?.trim(),
    }),
    validate: formData => {
      try {
        return (
          !!formData.get('contact_name')?.trim() &&
          !!formData.get('email_address')?.trim() &&
          isValidEmail('userSettings', formData.get('email_address')) &&
          validatePhoneNumber('userSettings', formData.get('phone_number'))
        );
      } catch (err) {
        throw new Error(err.message || ERROR_MESSAGES.FORM_VALIDATION_FAILED);
      }
    },
    validationError: 'Please complete all fields correctly.',
    fetchOptions: {
      headers: { 'Content-Type': 'application/json' },
    },
  },
  categories: getCategoriesFormConfig,
};

/**
 * Retrieves a form configuration by key, optionally merging with dynamic options.
 * @param {string} context - The context or module name.
 * @param {string} configKey - The key for the form configuration (e.g., 'login', 'categories').
 * @param {Object} [options={}] - Dynamic options to merge with the configuration.
 * @returns {Object} The form configuration.
 * @throws {Error} If the configKey is invalid.
 */
export function getFormConfig(context, configKey, options = {}) {
  log(context, `Retrieving form config for key: ${configKey}`);
  const config = FORM_CONFIGS[configKey];
  if (!config) {
    throw new Error(`Invalid form configuration key: ${configKey}`);
  }
  if (typeof config === 'function') {
    return config(context, options);
  }
  return { ...config, ...options };
}

/**
 * Initializes the form configs module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Form configs instance with public methods.
 */
export function initializeFormConfigsModule(registry) {
  return createModuleInitializer('form-configs.js', {
    getFormConfig,
    getCategoriesFormConfig,
  });
}

// Initialize module with lifecycle logging
const context = 'form-configs.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});