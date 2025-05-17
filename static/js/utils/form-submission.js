// /static/js/utils/form-submission.js
import { log } from '../core/logger.js';
import { getFormConfig } from '../config/form-configs.js';
import { success, error as notifyError } from '../core/notifications.js';
import { withErrorHandling } from './error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from './logging-utils.js';

const context = 'form-submission.js';

/**
 * Validates a UK phone number.
 * @param {string} context - The context or module name.
 * @param {string} phone - The phone number to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
export function validatePhoneNumber(context, phone) {
    log(context, `Validating phone number: ${phone}`);
    return withErrorHandling(`${context}:validatePhoneNumber`, () => {
        const isValid = phone && /^[0-9]{10,11}$/.test(phone.trim());
        log(context, `Phone number validation result: ${isValid}`);
        return isValid;
    }, 'Phone number validation failed');
}

/**
 * Configures and submits a form to the specified endpoint.
 * @param {string} context - The context or module name.
 * @param {string} formId - The form's ID.
 * @param {string} endpoint - The submission endpoint.
 * @param {string} configKey - The form config key.
 * @param {Object} [options={}] - Submission options.
 * @returns {Promise<Object>} The response data or throws an error.
 */
export async function submitConfiguredForm(context, formId, endpoint, configKey, options = {}) {
    log(context, `Starting form submission configuration for formId: ${formId}, endpoint: ${endpoint}, configKey: ${configKey}`);
    let formData = null;
    try {
        // Check if the form exists
        const form = document.getElementById(formId);
        if (!form) {
            log(context, `Form ${formId} not found`);
            throw new Error(`Form ${formId} not found`);
        }
        log(context, `Form ${formId} found`);

        // Retrieve form configuration
        const config = getFormConfig(context, configKey);
        if (!config || !config.method) {
            log(context, `No valid form configuration for key: ${configKey}`);
            throw new Error(`No valid form configuration for key: ${configKey}`);
        }
        log(context, `Form configuration retrieved for key: ${configKey}`);

        // Collect form data
        log(context, `Collecting form data for formId: ${formId}`);
        formData = new FormData(form);
        log(context, `Form data collected:`, Array.from(formData.entries()));

        // Validate form data if applicable
        if (config.validate) {
            log(context, `Validating form data for formId: ${formId}`);
            config.validate(formData);
            log(context, `Form data validation passed for formId: ${formId}`);
        }

        // Transform data if applicable
        const transformedData = config.transform ? config.transform(formData) : Object.fromEntries(formData);
        log(context, `Transformed data:`, transformedData);

        // Make API call
        log(context, `Making request to ${endpoint} for formId: ${formId}`);
        const response = await fetch(endpoint, {
            method: config.method || 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transformedData),
        });
        log(context, `API response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        let responseData;
        try {
            responseData = await response.json();
        } catch (parseError) {
            log(context, `Failed to parse response as JSON: ${parseError.message}`);
            throw new Error(`Invalid JSON response from server`);
        }
        log(context, `API response data:`, responseData);

        // Handle success
        success(context, options.successMessage || config.successMessage || 'Form submitted successfully');
        if (options.onSuccess) {
            log(context, `Invoking onSuccess for formId: ${formId}`);
            options.onSuccess(responseData);
        }

        return responseData;
    } catch (error) {
        log(context, `Form submission failed for formId: ${formId}: ${error.message}`);
        console.error('Detailed error:', error);
        if (options.onError) {
            log(context, `Invoking onError for formId: ${formId}`);
            options.onError(error, formData);
        }
        notifyError(context, error.message || ERROR_MESSAGES.FORM_SUBMISSION_FAILED);
        throw error; // Rethrow to allow caller to handle
    } finally {
        log(context, `Submission process completed for formId: ${formId}`);
    }
}

/**
 * Updates form field values dynamically.
 * @param {string} context - The context or module name.
 * @param {string} formId - The form's ID.
 * @param {Object} updates - Field name-value pairs to update.
 */
export async function updateFormState(context, formId, updates) {
    log(context, `Starting form state update for formId: ${formId}`);
    await withErrorHandling(`${context}:updateFormState`, async () => {
        const form = document.getElementById(formId);
        if (!form) {
            log(context, `Form ${formId} not found for state update`);
            throw new Error(`Form ${formId} not found`);
        }
        log(context, `Form ${formId} found for state update`);
        Object.entries(updates).forEach(([name, value]) => {
            const input = form.querySelector(`[name="${name}"]`);
            if (input) {
                input.value = value;
                log(context, `Updated field ${name} to ${value} in form ${formId}`);
            } else {
                log(context, `Field ${name} not found in form ${formId}`);
            }
        });
    }, ERROR_MESSAGES.ELEMENT_NOT_FOUND);
}

/**
 * Initializes the form submission module.
 * @param {Object} registry - The registry object.
 * @returns {Object} Module functions.
 */
export function initializeFormSubmissionModule(registry) {
    log(context, 'Initializing form-submission module');
    return {
        submitConfiguredForm,
        updateFormState,
        validatePhoneNumber,
    };
}

withScriptLogging(context, () => {
    log(context, 'Module initialized');
});