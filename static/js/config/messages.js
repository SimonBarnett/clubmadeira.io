// /static/js/config/messages.js
// Purpose: Defines error and success messages for consistent use across the application.

// Error messages organized by category
export const ERROR_MESSAGES = {
    // General Errors
    DEFAULT: 'An unexpected error occurred. Please try again.',
    MODULE_INIT_FAILED: 'Failed to initialize module.',
    EVENT_HANDLER_FAILED: 'Event handler failed.',
    DATA_PROCESSING_FAILED: 'Failed to process data.',
  
    // API and Data Fetching Errors
    FETCH_FAILED: context => `Failed to fetch ${context} data.`,
    NO_DATA: context => `No ${context} available.`,
    NO_ENDPOINT: 'No API endpoint provided.',
  
    // DOM Manipulation Errors
    ELEMENT_NOT_FOUND: 'Required DOM element not found.',
    INVALID_TABLE_BODY: 'Invalid table body element.',
    TABLE_NOT_FOUND: 'Parent table not found.',
    SECTION_TOGGLE_FAILED: 'Failed to toggle section.',
    DOM_INSERTION_FAILED: 'Failed to insert DOM element.',
    DOM_REMOVAL_FAILED: 'Failed to remove DOM element.',
    DOM_PROPERTY_ACCESS_FAILED: 'Failed to access DOM element property.',
    INVALID_DOM_ELEMENT: 'Invalid DOM element provided.',
    DUPLICATE_ELEMENT_ID: 'Duplicate DOM element ID found.',
  
    // Rendering Errors
    RENDER_FAILED: context => `Failed to render ${context} data.`,
    CUSTOM_FIELD_RENDER_FAILED: 'Failed to render custom form fields.',
    MARKDOWN_RENDER_FAILED: 'Failed to render markdown content.',
  
    // Form and Validation Errors
    FORM_SUBMISSION_FAILED: 'Form submission failed.',
    FORM_VALIDATION_FAILED: 'Form validation failed.',
    ALL_FIELDS_REQUIRED: 'All fields are required.',
    INVALID_SETTINGS_TYPE: 'Invalid settings type specified.',
    INVALID_SETTINGS_DATA: 'Invalid settings data received.',
    NO_SETTINGS_FOUND: 'No settings found.',
    NO_DOMAIN: 'Domain is required.',
    INVALID_DOMAIN: 'Invalid domain format.',
  
    // Navigation Errors
    NAVIGATION_INIT_FAILED: 'Failed to initialize navigation.',
  
    // User and Authentication Errors
    USER_ID_NOT_FOUND: 'User ID not found.',
  };
  
  // Success messages organized by category
  export const SUCCESS_MESSAGES = {
    // General Success
    DEFAULT: 'Operation successful.',
  
    // Rendering Success
    RENDERED: context => `${context} successfully rendered.`,
    USERS_RENDERED: 'Users rendered successfully.', // Specific for user rendering
  
    // Form Submission Success
    SUBMITTED: context => `${context} successfully submitted.`,
    SETTINGS_UPDATED: 'Settings successfully updated.',
  
    // DOM Manipulation Success
    DOM_INSERTION_SUCCESS: 'DOM element inserted successfully.',
    DOM_REMOVAL_SUCCESS: 'DOM element removed successfully.',
    SECTION_TOGGLED: 'Section toggled successfully.',
  };