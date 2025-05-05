// /static/js/community/providers-handlers.js
import { log } from '../core/logger.js';
import { setupEventListeners } from '../utils/event-listeners.js';
import { submitConfiguredForm } from '../utils/form-submission.js';
import { renderProviderSettings } from './providers-events.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { createModuleInitializer, shouldInitializeForPageType } from '../utils/initialization.js';

const context = 'providers-handlers.js';

export function setupProviderEvents(context) {
    log(context, 'Setting up provider form event listeners');
    withErrorHandling(`${context}:setupProviderEvents`, () => {
        setupEventListeners(context, [
            {
                eventType: 'submit',
                selector: '#providerForm',
                handler: async (event) => {
                    event.preventDefault();
                    await withErrorHandling(`${context}:submitProviderForm`, async () => {
                        await submitConfiguredForm(context, 'providerForm', API_ENDPOINTS.CLIENT_API_SETTINGS, 'providerSettings', {
                            successMessage: SUCCESS_MESSAGES.SETTINGS_UPDATED,
                            onSuccess: async (data) => {
                                await renderProviderSettings(context, data.settings || [], 'providerIconsBar');
                            },
                            onError: (error) => {
                                log(context, `Provider settings submission failed: ${error.message}`);
                            },
                        });
                    }, ERROR_MESSAGES.FORM_SUBMISSION_FAILED);
                },
            },
            {
                eventType: 'click',
                selector: '#providerIconsBar i[data-key-type]',
                handler: async (event) => {
                    await withErrorHandling(`${context}:selectProviderSetting`, async () => {
                        const keyType = event.target.dataset.keyType;
                        log(context, `Selected provider setting: ${keyType}`);
                        const settings = await import('./providers-data.js').then(m => m.loadClientApiSettings(context));
                        await renderProviderSettings(context, settings.filter(s => s.key_type === keyType), 'providerIconsBar');
                    }, ERROR_MESSAGES.EVENT_HANDLER_FAILED);
                },
            },
        ]);
    }, ERROR_MESSAGES.EVENT_HANDLER_FAILED);
}

export function initializeProvidersHandlersModule(registry) {
    return createModuleInitializer(context, {
        setupProviderEvents,
    });
}

if (shouldInitializeForPageType('community')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-community page');
}