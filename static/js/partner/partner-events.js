// /static/js/partner/partner-events.js
import { log } from '../core/logger.js';
import { setupEventListeners } from '../utils/event-listeners.js';
import { submitConfiguredForm } from '../utils/form-submission.js';
import { toggleViewState } from '../utils/dom-manipulation.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { createModuleInitializer } from '../utils/initialization.js';

const context = 'partner-events.js';

/**
 * Sets up event listeners for partner page interactions.
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
                        await submitConfiguredForm(context, 'integrationsForm', API_ENDPOINTS.CLIENT_API, 'integrations', {
                            successMessage: SUCCESS_MESSAGES.SETTINGS_UPDATED,
                            onSuccess: () => {
                                log(context, 'Integration settings updated successfully');
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
 * @returns {Object} Partner events module instance.
 */
export function initializePartnerEventsModule(registry) {
    return createModuleInitializer('partner-events.js', {
        setupPartnerEvents,
    });
}

withScriptLogging(context, () => {
    log(context, 'Module initialized');
});