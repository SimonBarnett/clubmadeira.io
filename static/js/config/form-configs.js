// /static/js/form-configs.js
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
  return {
    id: 'category-form', // Updated to match DOM ID
    action: '/categories',
    method: 'POST',
    successMessage: 'Categories processed successfully!', // Updated for clarity
    transform: formData => {
      let deselected = [];
      let previous_deselected = [];
      let previous_selected = [];
      let categories = {};
      try {
        deselected = JSON.parse(formData.get('deselected') || '[]');
      } catch (e) {
        log(context, 'Error parsing deselected:', e);
      }
      try {
        previous_deselected = JSON.parse(formData.get('previous_deselected') || '[]');
      } catch (e) {
        log(context, 'Error parsing previous_deselected:', e);
      }
      try {
        previous_selected = JSON.parse(formData.get('previous_selected') || '[]');
      } catch (e) {
        log(context, 'Error parsing previous_selected:', e);
      }
      try {
        categories = JSON.parse(formData.get('categories') || '{}');
      } catch (e) {
        log(context, 'Error parsing categories:', e);
      }
      return {
        prompt: formData.get('prompt')?.trim(),
        deselected,
        previous_deselected,
        previous_selected,
        categories,
      };
    },
    validate: formData => {
      const prompt = formData.get('prompt')?.trim();
      if (!prompt) {
        throw new Error('Please describe your club.');
      }
      return true;
    },
    validationError: 'Please describe your club.', // Updated to match validate message
    fetchOptions: {
      headers: { 'Content-Type': 'application/json' },
    },
    fields: [
      {
        type: 'textarea',
        id: 'prompt',
        name: 'prompt',
        label: 'Describe your club', // Simplified label
        required: true,
        style: { width: '100%', maxWidth: '600px' }, // Added style for consistency
      },
      {
        type: 'hidden',
        id: 'deselected',
        name: 'deselected',
      },
      {
        type: 'hidden',
        id: 'previous_deselected',
        name: 'previous_deselected',
      },
      {
        type: 'hidden',
        id: 'previous_selected',
        name: 'previous_selected',
      },
      {
        type: 'hidden',
        id: 'categories',
        name: 'categories',
      },
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
  completeSignup: {
    id: 'setPasswordForm',
    action: '/complete-signup',
    method: 'POST',
    submitButtonText: 'Set Password',
    successMessage: 'Account created successfully!',
    transform: formData => ({
      password: formData.get('password'),
      confirm_password: formData.get('confirm_password'),
      stripe_account_id: formData.get('stripe_account_id'),
      role: formData.get('role'),
      email: formData.get('email'),
      phone: formData.get('phone'),
    }),
    validate: formData => {
      const password = formData.get('password');
      const confirmPassword = formData.get('confirm_password');
      const stripeAccountId = formData.get('stripe_account_id');
      const role = formData.get('role');
      const email = formData.get('email');
      const phone = formData.get('phone');

      if (!password || !confirmPassword || password !== confirmPassword || !stripeAccountId || !role) {
        throw new Error('Please ensure all required fields are filled correctly and passwords match.');
      }

      if (email !== null && !isValidEmail('completeSignup', email)) {
        throw new Error('Please enter a valid email address.');
      }

      if (phone !== null && !validatePhoneNumber('completeSignup', phone)) {
        throw new Error('Please enter a valid phone number.');
      }

      return true;
    },
    validationError: 'Please complete all fields correctly and ensure passwords match.',
    fetchOptions: {
      headers: { 'Content-Type': 'application/json' },
    },
    fields: [
      {
        type: 'password',
        name: 'password',
        label: 'Password',
        required: true,
        attributes: { 
          id: 'setPassword', 
          placeholder: 'Enter your password', 
          autocomplete: 'new-password' 
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
      {
        type: 'password',
        name: 'confirm_password',
        label: 'Confirm Password',
        required: true,
        attributes: { 
          id: 'setConfirmPassword', 
          placeholder: 'Confirm your password', 
          autocomplete: 'new-password' 
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
      {
        type: 'email',
        name: 'email',
        label: 'Email',
        required: false,
        attributes: { id: 'email', placeholder: 'Enter your email', autocomplete: 'off' },
      },
      {
        type: 'tel',
        name: 'phone',
        label: 'Phone Number',
        required: false,
        attributes: { id: 'phone', placeholder: 'Enter your phone number' },
      },
      {
        type: 'hidden',
        name: 'stripe_account_id',
        attributes: { id: 'stripeAccountId' },
      },
      {
        type: 'hidden',
        name: 'role',
        attributes: { id: 'role' },
      },
    ],
    requiresAuth: false,
  },
  siteRequest: {
    id: 'siteRequestForm',
    action: '/siterequest',
    method: 'POST',
    submitButtonText: 'Save Site Request',
    successMessage: 'Site request saved successfully!',
    transform: formData => {
      const data = { pages: [] };
      for (let [key, value] of formData.entries()) {
        if (key.startsWith('email_')) {
          data.emails = data.emails || [];
          data.emails.push(value);
        } else if (key.startsWith('page_')) {
          const [prefix, index, field] = key.split('_');
          data.pages[parseInt(index)] = data.pages[parseInt(index)] || {};
          data.pages[parseInt(index)][field] = value;
        } else {
          const fieldMap = {
            name: 'communityName',
            about: 'aboutCommunity',
            colorPrefs: 'colorPrefs',
            stylingDetails: 'stylingDetails',
            preferredDomain: 'preferredDomain',
            logos: 'communityLogos',
          };
          data[fieldMap[key] || key] = value instanceof File ? 'placeholder' : value;
        }
      }
      data.pages = data.pages.filter(page => page && page.title);
      return data;
    },
    validate: formData => {
      try {
        const communityName = formData.get('name')?.trim();
        const emails = Array.from(formData.entries())
          .filter(([key]) => key.startsWith('email_'))
          .map(([_, value]) => value);
        return (
          !!communityName &&
          emails.length > 0 &&
          emails.some(email => email.trim())
        );
      } catch (err) {
        throw new Error(err.message || ERROR_MESSAGES.FORM_VALIDATION_FAILED);
      }
    },
    validationError: 'Please enter a valid community name and at least one email.',
    fetchOptions: {
      headers: { 'Content-Type': 'application/json' },
    },
    fields: [
      {
        type: 'text',
        name: 'name',
        label: 'Community Name',
        required: true,
        attributes: { id: 'name', placeholder: 'Enter community name' },
      },
      {
        type: 'textarea',
        name: 'about',
        label: 'About Community',
        attributes: { id: 'about', placeholder: 'Describe your community', class: 'mce-editor' },
      },
      {
        type: 'text',
        name: 'colorPrefs',
        label: 'Color Preferences',
        attributes: { id: 'colorPrefs', placeholder: 'Enter color preferences' },
      },
      {
        type: 'text',
        name: 'stylingDetails',
        label: 'Styling Details',
        attributes: { id: 'stylingDetails', placeholder: 'Enter styling details' },
      },
      {
        type: 'text',
        name: 'preferredDomain',
        label: 'Preferred Domain',
        attributes: { id: 'preferredDomain', placeholder: 'e.g., mycommunity.org' },
      },
      {
        type: 'file',
        name: 'logos',
        label: 'Community Logos',
        attributes: { id: 'logos', multiple: true },
      },
      {
        type: 'dynamic',
        name: 'emails',
        containerId: 'emailsContainer',
        addButton: {
          text: 'Add Another Email',
          dataset: { action: 'addEmail' },
        },
        template: index => ({
          type: 'email',
          name: `email_${index}`,
          label: `Email ${index + 1}`,
          attributes: { placeholder: 'Enter email' },
          removeButton: {
            text: 'Remove',
            className: 'remove-email',
          },
        }),
      },
      {
        type: 'dynamic',
        name: 'pages',
        containerId: 'pagesContainer',
        addButton: {
          text: 'Add Page',
          dataset: { action: 'addPage' },
        },
        template: index => ({
          type: 'group',
          fields: [
            {
              type: 'text',
              name: `page_${index}_title`,
              label: `Page ${index + 1} Title`,
              attributes: { id: `page_${index}_title`, placeholder: 'Page Title' },
            },
            {
              type: 'textarea',
              name: `page_${index}_content`,
              label: `Page ${index + 1} Content`,
              attributes: { id: `page_${index}_content`, class: 'mce-editor', placeholder: 'Page Content' },
            },
            {
              type: 'file',
              name: `page_${index}_images`,
              label: `Page ${index + 1} Images`,
              attributes: { id: `page_${index}_images`, multiple: true },
            },
            {
              type: 'button',
              text: 'Remove',
              className: 'remove-page',
            },
          ],
        }),
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