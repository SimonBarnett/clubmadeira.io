// /static/js/utils/form-submission.js
import { log } from '../core/logger.js';
import { fetchData } from './data-fetch.js';
import { getFormConfig } from '../config/form-configs.js';
import { success, error as notifyError } from '../core/notifications.js';
import { withErrorHandling } from './error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from './logging-utils.js';

const context = 'form-submission.js';

/**
 * Validates the phone number from FormData for signup forms.
 * @param {string} context - The context or module name.
 * @param {string} phone - The phone number to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
export function validatePhoneNumber(context, phone) {
    return withErrorHandling(`${context}:validatePhoneNumber`, () => {
        log(context, `Validating phone number: ${phone}`);
        if (!phone || !/^[0-9]{10,11}$/.test(phone)) {
            throw new Error('Invalid UK phone number (10 or 11 digits required)');
        }
        return true;
    }, ERROR_MESSAGES.FORM_VALIDATION_FAILED);
}

/**
 * Configures a form for submission based on the provided configuration key and endpoint.
 * @param {string} context - The context or module name.
 * @param {string} formId - The ID of the form element.
 * @param {string} endpoint - The API endpoint to submit to.
 * @param {string} configKey - The form configuration key (e.g., 'login', 'signup').
 * @param {Object} [options={}] - Additional options (e.g., onSuccess, onError, successMessage).
 * @returns {void}
 */
export function submitConfiguredForm(context, formId, endpoint, configKey, options = {}) {
    log(context, `Configuring form submission for: ${formId} with config: ${configKey}`);
    withErrorHandling(`${context}:submitConfiguredForm`, () => {
        const form = document.getElementById(formId);
        if (!form) {
            log(context, `Form element ${formId} not found`);
            notifyError(context, 'Form not found. Please try again.');
            throw new Error(`Form ${formId} not found`);
        }

        const config = getFormConfig(context, configKey);
        if (!config) {
            log(context, `No form configuration found for key: ${configKey}`);
            notifyError(context, 'Invalid form configuration.');
            throw new Error(`No form configuration for key: ${configKey}`);
        }

        // Remove existing submit listeners to prevent duplicates
        const submitHandler = async (event) => {
            event.preventDefault();
            log(context, `Submitting form ${formId} to ${endpoint}`);

            let formData;
            try {
                formData = new FormData(form);
                log(context, 'FormData initialized:', Array.from(formData.entries()));
                if (config.validate) {
                    log(context, 'Running validation with FormData');
                    config.validate(formData);
                }

                const transformedData = config.transform ? config.transform(formData) : Object.fromEntries(formData);
                log(context, 'Transformed data:', transformedData);
                const useAuth = config.requiresAuth !== false;

                const fetchOptions = {
                    method: config.method || 'POST',
                    headers: config.fetchOptions?.headers || { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transformedData),
                    ...config.fetchOptions,
                };

                const response = await fetchData(context, endpoint, fetchOptions, useAuth);
                success(context, options.successMessage || config.successMessage || 'Form submitted successfully');
                if (options.onSuccess) {
                    options.onSuccess(response);
                }
            } catch (err) {
                log(context, `Submission error: ${err.message}`);
                notifyError(context, err.message || ERROR_MESSAGES.FORM_SUBMISSION_FAILED);
                if (options.onError && formData) {
                    options.onError(err, formData);
                }
            }
        };

        // Remove previous submit listener if it exists
        form.removeEventListener('submit', form._submitHandler);
        form._submitHandler = submitHandler;
        form.addEventListener('submit', submitHandler);

        log(context, `Form ${formId} submission configured`);
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
    log(context, 'Initializing form-submission module for module registry');
    return {
        submitConfiguredForm: (ctx, formId, endpoint, configKey, options) => submitConfiguredForm(ctx, formId, endpoint, configKey, options),
        updateFormState: (ctx, formId, updates) => updateFormState(ctx, formId, updates),
        validatePhoneNumber: (ctx, phone) => validatePhoneNumber(ctx, phone),
    };
}

// Initialize module with lifecycle logging
withScriptLogging(context, () => {
    log(context, 'Module initialized');
});