// /static/js/config/constants.js
// Purpose: Defines centralized constants for error and success messages used across the application.

import { log } from '../core/logger.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Error message templates with context parameterization.
 * @type {Object.<string, Function|string>}
 */
export const ERROR_MESSAGES = {
  DEFAULT: 'An unexpected error occurred. Please try again.',
  FETCH_FAILED: context => `Failed to fetch ${context} data.`,
  NO_DATA: context => `No ${context} available.`,
  RENDER_FAILED: context => `Failed to render ${context} data.`,
  ELEMENT_NOT_FOUND: 'Required DOM element not found.',
  INVALID_TABLE_BODY: 'Invalid table body element.',
  TABLE_NOT_FOUND: 'Parent table not found.',
  DATA_PROCESSING_FAILED: 'Failed to process data.',
  INVALID_SETTINGS_TYPE: 'Invalid settings type specified.',
  NO_ENDPOINT: 'No API endpoint provided.',
  INVALID_SETTINGS_DATA: 'Invalid settings data received.',
  NO_SETTINGS_FOUND: 'No settings found.',
  ALL_FIELDS_REQUIRED: 'All fields are required.',
  FORM_SUBMISSION_FAILED: 'Form submission failed.',
  FORM_VALIDATION_FAILED: 'Form validation failed.',
  CUSTOM_FIELD_RENDER_FAILED: 'Failed to render custom form fields.',
  MARKDOWN_RENDER_FAILED: 'Failed to render markdown content.',
  NAVIGATION_INIT_FAILED: 'Failed to initialize navigation.',
  MODULE_INIT_FAILED: 'Failed to initialize module.',
  USER_ID_NOT_FOUND: 'User ID not found.',
  EVENT_HANDLER_FAILED: 'Event handler failed.',
  SECTION_TOGGLE_FAILED: 'Failed to toggle section.',
  NO_DOMAIN: 'Domain is required.',
  INVALID_DOMAIN: 'Invalid domain format.',
};

/**
 * Success message templates with context parameterization.
 * @type {Object.<string, string>}
 */
export const SUCCESS_MESSAGES = {
  DEFAULT: 'Operation successful.',
  RENDERED: context => `${context} successfully rendered.`,
  SUBMITTED: context => `${context} successfully submitted.`,
  SETTINGS_UPDATED: 'Settings successfully updated.',
};

/**
 * Initializes the constants module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Constants instance with public constants.
 */
export function initializeConstantsModule(registry) {
  const context = 'constants.js';
  log(context, 'Initializing constants module for module registry');
  return {
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
  };
}

// Initialize module with lifecycle logging
const context = 'constants.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});