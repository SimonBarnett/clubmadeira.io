// /static/js/config/messages.js
// Purpose: Defines error and success messages for consistent use across the application.

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

export const SUCCESS_MESSAGES = {
    DEFAULT: 'Operation successful.',
    RENDERED: context => `${context} successfully rendered.`,
    SUBMITTED: context => `${context} successfully submitted.`,
    SETTINGS_UPDATED: 'Settings successfully updated.',
};