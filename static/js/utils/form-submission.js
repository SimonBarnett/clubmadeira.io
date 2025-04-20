// /static/js/utils/form-submission.js
// Purpose: Provides utilities for handling form submissions with validation and error handling.

import { log } from '../core/logger.js';
import { fetchData } from './data-fetch.js';
import { getFormConfig } from '../config/form-configs.js';
import { success, error as notifyError } from '../core/notifications.js';
import { withErrorHandling } from './error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from './initialization.js';

/**
 * Submits a form based on the provided configuration key and endpoint.
 * @param {string} context - The context or module name.
 * @param {string} formId - The ID of the form element.
 * @param {string} endpoint - The API endpoint to submit to.
 * @param {string} configKey - The form configuration key (e.g., 'login', 'userSettings').
 * @param {Object} [options={}] - Additional options (e.g., onSuccess, onError, successMessage).
 * @returns {Promise<void>}
 */
export async function submitConfiguredForm(context, formId, endpoint, configKey, options = {}) {
  log(context, `Submitting form: ${formId} with config: ${configKey}`);
  await withErrorHandling(`${context}:submitConfiguredForm`, async () => {
    const form = document.getElementById(formId);
    if (!form) {
      throw new Error(`Form ${formId} not found`);
    }

    const config = getFormConfig(context, configKey);
    const formData = new FormData(form);
    if (!config.validate(formData)) {
      notifyError(context, config.validationError || ERROR_MESSAGES.FORM_VALIDATION_FAILED);
      return;
    }

    const transformedData = config.transform ? config.transform(formData) : Object.fromEntries(formData);
    const fetchOptions = {
      method: config.method || 'POST',
      headers: config.fetchOptions?.headers || {},
      body: JSON.stringify(transformedData),
      ...config.fetchOptions,
    };

    try {
      const response = await fetchData(context, endpoint, fetchOptions);
      success(context, options.successMessage || config.successMessage || 'Form submitted successfully');
      if (options.onSuccess) {
        options.onSuccess(response);
      }
    } catch (err) {
      notifyError(context, err.message || ERROR_MESSAGES.FORM_SUBMISSION_FAILED);
      if (options.onError) {
        options.onError(err, formData);
      }
      throw err;
    }
  }, ERROR_MESSAGES.FORM_SUBMISSION_FAILED);
}

/**
 * Updates form field values dynamically.
 * @param {string} context - The context or module name.
 * @param {string} formId - The ID of the form element.
 * @param {Object} updates - Object mapping field names to values.
 * @returns {Promise<void>}
 */
export async function updateFormState(context, formId, updates) {
  log(context, `Updating form state for: ${formId}`);
  await withErrorHandling(`${context}:updateFormState`, async () => {
    const form = document.getElementById(formId);
    if (!form) {
      throw new Error(`Form ${formId} not found`);
    }
    Object.entries(updates).forEach(([name, value]) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (input) {
        input.value = value;
        log(context, `Updated ${name} to: ${value}`);
      }
    });
  }, ERROR_MESSAGES.ELEMENT_NOT_FOUND);
}

/**
 * Initializes the form-submission module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} FormSubmission instance with public methods.
 */
export function initializeFormSubmissionModule(registry) {
  const context = 'form-submission.js';
  log(context, 'Initializing form-submission module for module registry');
  return {
    submitConfiguredForm: (ctx, ...args) => submitConfiguredForm(ctx, ...args),
    updateFormState: (ctx, ...args) => updateFormState(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'form-submission.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});