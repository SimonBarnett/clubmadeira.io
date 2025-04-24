// /static/js/partner/partner-events.js
// Purpose: Manages top-level event listeners for the partner page, delegating feature-specific events.

import { log } from '../core/logger.js';
import { setupEventListeners } from '../utils/event-listeners.js';
import { submitConfiguredForm } from '../utils/form-submission.js';
import { toggleViewState } from '../utils/dom-manipulation.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { createModuleInitializer } from '../utils/initialization.js';

/**
 * Sets up top-level event listeners for the partner page.
 * @param {string} context - The context or module name.
 * @returns {void}
 */
export function setupPartnerEvents(context) {
  log(context, 'Setting up partner event listeners');
  withErrorHandling(`${context}:setupPartnerEvents`, () => {
    setupEventListeners(context, [
      {
        eventType: 'submit',
        selector: '#integrationsForm',
        handler: async event => {
          event.preventDefault();
          await withErrorHandling(`${context}:submitIntegrationsForm`, async () => {
            await submitConfiguredForm(context, 'integrationsForm', '/client-api', 'integrations', {
              successMessage: SUCCESS_MESSAGES.SETTINGS_UPDATED,
              onSuccess: () => {
                log(context, 'Integration settings updated');
                toggleViewState(context, { integrationsFields: true });
              },
            });
          }, ERROR_MESSAGES.FORM_SUBMISSION_FAILED);
        },
      },
      {
        eventType: 'click',
        selector: '#partnerNavToggle',
        handler: async () => {
          await withErrorHandling(`${context}:toggleNavigation`, async () => {
            log(context, 'Toggling partner navigation');
            toggleViewState(context, { partnerNav: true });
          }, ERROR_MESSAGES.SECTION_TOGGLE_FAILED);
        },
      },
    ]);
  }, ERROR_MESSAGES.EVENT_HANDLER_FAILED);
}

/**
 * Initializes the partner events module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Events instance with public methods.
 */
export function initializePartnerEventsModule(registry) {
  return createModuleInitializer('partner-events.js', {
    setupPartnerEvents,
  });
}

// Initialize module with lifecycle logging
const context = 'partner-events.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});