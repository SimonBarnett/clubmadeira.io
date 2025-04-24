// /static/js/config/form-configs.js
import { log } from '../core/logger.js';
import { validatePhoneNumber } from '../utils/form-submission.js';
import { isValidEmail } from '../utils/form-validation-utils.js';
import { renderStyles } from '../utils/form-rendering.js';
import { renderCheckboxList } from '../utils/ui-components.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from './messages.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { createModuleInitializer } from '../utils/initialization.js';

const context = 'form-configs.js';

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
    requiresAuth: true,
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
    fields: [
      {
        type: 'email',
        name: 'email',
        label: 'Email',
        required: true,
        attributes: { placeholder: 'Enter your email', id: 'loginEmail', autocomplete: 'off' },
      },
      {
        type: 'password',
        name: 'password',
        label: 'Password',
        required: true,
        attributes: {
          placeholder: 'Enter your password',
          id: 'loginPassword',
          autocomplete: 'off',
        },
        wrapper: {
          class: 'password-wrapper',
          style: 'position: relative; width: 100%;',
        },
        extraButtons: [
          {
            type: 'button',
            text: '<i class="fas fa-eye"></i>',
            className: 'toggle-password',
            style: 'position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; background: none; border: none; font-size: 16px; color: #666;',
          },
        ],
      },
    ],
    requiresAuth: false,
  },
  setPassword: {
    id: 'setPasswordForm',
    action: '/complete-signup',
    method: 'POST',
    submitButtonText: 'Set Password',
    successMessage: 'Password set successfully!',
    transform: formData => ({
      email: formData.get('email')?.trim(),
      password: formData.get('password'),
      confirm_password: formData.get('confirm_password'),
      set_password: formData.get('set_password'),
    }),
    validate: formData => {
      try {
        const email = formData.get('email')?.trim();
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm_password');
        return (
          !!email &&
          isValidEmail('setPassword', email) &&
          !!password &&
          password === confirmPassword
        );
      } catch (err) {
        throw new Error(err.message || ERROR_MESSAGES.FORM_VALIDATION_FAILED);
      }
    },
    validationError: 'Please enter a valid email and ensure passwords match.',
    fetchOptions: {
      headers: { 'Content-Type': 'application/json' },
    },
    fields: [
      {
        type: 'email',
        name: 'email',
        label: 'Email',
        required: true,
        attributes: { id: 'email', autocomplete: 'off' },
      },
      {
        type: 'password',
        name: 'password',
        label: 'Password',
        required: true,
        attributes: { id: 'password', placeholder: 'Enter your password', autocomplete: 'new-password' },
        wrapper: {
          class: 'password-wrapper',
          style: 'position: relative; width: 100%;',
        },
        extraButtons: [
          {
            type: 'button',
            text: '<i class="fas fa-eye"></i>',
            className: 'toggle-password',
            style: 'position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; background: none; border: none; font-size: 16px; color: #666;',
          },
        ],
      },
      {
        type: 'password',
        name: 'confirm_password',
        label: 'Confirm Password',
        required: true,
        attributes: { id: 'confirmPassword', placeholder: 'Confirm your password', autocomplete: 'new-password' },
        wrapper: {
          class: 'password-wrapper',
          style: 'position: relative; width: 100%;',
        },
        extraButtons: [
          {
            type: 'button',
            text: '<i class="fas fa-eye"></i>',
            className: 'toggle-password',
            style: 'position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; background: none; border: none; font-size: 16px; color: #666;',
          },
        ],
      },
      {
        type: 'hidden',
        name: 'set_password',
        value: 'true',
      },
    ],
    requiresAuth: false,
  },
  signup: {
    id: 'signupForm',
    action: '/signup',
    method: 'POST',
    submitButtonText: 'Sign Me Up',
    successMessage: 'Signup submitted successfully!',
    transform: formData => ({
      signup_type: formData.get('signup_type')?.trim(),
    }),
    validate: formData => {
      log(context, 'Validating signup form, formData type:', formData.constructor.name);
      try {
        return !!formData.get('signup_type')?.trim();
      } catch (err) {
        throw new Error(err.message || ERROR_MESSAGES.FORM_VALIDATION_FAILED);
      }
    },
    validationError: 'Please select a signup type.',
    fetchOptions: {
      headers: { 'Content-Type': 'application/json' },
    },
    fields: [
      {
        type: 'radio',
        name: 'signup_type',
        label: 'Signup Type',
        required: true,
        attributes: { id: 'signup_type', autocomplete: 'off' },
        options: [
          { value: 'community', label: 'Community' },
          { value: 'seller', label: 'Merchant' },
          { value: 'partner', label: 'Partner' },
        ],
      },
    ],
    requiresAuth: false,
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
    fields: [
      {
        type: 'email',
        name: 'email',
        label: 'Email',
        required: true,
        attributes: { id: 'forgotEmail', autocomplete: 'off' },
      },
    ],
    requiresAuth: false,
  },
  verifyOtp: {
    id: 'verifyOtpForm',
    action: '/verify-signup-otp',
    method: 'POST',
    submitButtonText: 'Set Password',
    successMessage: 'Password set successfully!',
    transform: formData => ({
      email: formData.get('email')?.trim(),
      otp: formData.get('otp')?.trim(),
      new_password: formData.get('new_password'),
      otp_token: formData.get('otp_token'),
    }),
    validate: formData => {
      try {
        return (
          !!formData.get('email')?.trim() &&
          isValidEmail('verifyOtp', formData.get('email')) &&
          !!formData.get('otp')?.trim() &&
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
    fields: [
      {
        type: 'email',
        name: 'email',
        label: 'Email',
        required: true,
        attributes: { id: 'verifyEmail', autocomplete: 'off' },
      },
      {
        type: 'text',
        name: 'otp',
        label: 'One-Time Password',
        required: true,
        attributes: { id: 'otpCode', autocomplete: 'off' },
      },
      {
        type: 'password',
        name: 'new_password',
        label: 'New Password',
        required: true,
        attributes: { id: 'newPassword', autocomplete: 'new-password' },
        wrapper: {
          class: 'password-wrapper',
          style: 'position: relative; width: 100%;',
        },
        extraButtons: [
          {
            type: 'button',
            text: '<i class="fas fa-eye"></i>',
            className: 'toggle-password',
            style: 'position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; background: none; border: none; font-size: 16px; color: #666;',
          },
        ],
      },
      {
        type: 'password',
        name: 'confirm_new_password',
        label: 'Confirm New Password',
        required: true,
        attributes: { id: 'confirmNewPassword', autocomplete: 'new-password' },
        wrapper: {
          class: 'password-wrapper',
          style: 'position: relative; width: 100%;',
        },
        extraButtons: [
          {
            type: 'button',
            text: '<i class="fas fa-eye"></i>',
            className: 'toggle-password',
            style: 'position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; background: none; border: none; font-size: 16px; color: #666;',
          },
        ],
      },
      {
        type: 'hidden',
        name: 'otp_token',
        attributes: { id: 'otpToken' },
      },
    ],
    requiresAuth: false,
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
    fields: [
      {
        type: 'text',
        name: 'contact_name',
        label: 'Name',
        required: true,
        attributes: { id: 'contact_name' },
      },
      {
        type: 'email',
        name: 'email_address',
        label: 'Email',
        required: true,
        attributes: { id: 'email_address' },
      },
      {
        type: 'tel',
        name: 'phone_number',
        label: 'Phone Number',
        required: true,
        attributes: { id: 'phone_number' },
      },
    ],
    requiresAuth: true,
  },
  categories: getCategoriesFormConfig,
};

/**
 * Retrieves a form configuration by key, optionally merging with dynamic options.
 * @param {string} context - The context or module name.
 * @param {string} configKey - The key for the form configuration (e.g., 'login', 'categories').
 * @param {Object} [options={}] - Dynamic options to merge with the configuration.
 * @returns {Object} The form configuration.
 */
export function getFormConfig(context, configKey, options = {}) {
  log(context, `Retrieving form config for key: ${configKey}`);
  if (!configKey || typeof configKey !== 'string') {
    log(context, `Invalid form configuration key: ${configKey}`);
    return {};
  }
  const config = FORM_CONFIGS[configKey];
  if (!config) {
    log(context, `No form configuration found for key: ${configKey}`);
    return {};
  }
  if (typeof config === 'function') {
    return config(context, options);
  }
  if (!config.method) {
    log(context, `Invalid configuration for key: ${configKey} - missing method`);
    return {};
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
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});