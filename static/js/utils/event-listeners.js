// /static/js/utils/event-listeners.js
// Purpose: Provides utilities for setting up DOM event listeners.

import { log } from '../core/logger.js';
import { registerEventListener } from './dom-events.js';
import { withErrorHandling } from './error.js';
import { ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/initialization.js';
import { createModuleInitializer } from '../utils/initialization.js';

/**
 * Event configuration registry for common event patterns.
 * @type {Object.<string, Object>}
 */
const EVENT_CONFIGS = {
  formSubmit: {
    eventType: 'submit',
    selector: '#{formId}',
    handler: async (context, event, formId, endpoint, configKey, options) => {
      event.preventDefault();
      const { submitConfiguredForm } = await import('../utils/form-submission.js');
      await withErrorHandling(`${context}:formSubmit`, () => submitConfiguredForm(context, formId, endpoint, configKey, options), ERROR_MESSAGES.FORM_SUBMISSION_FAILED);
    },
  },
  navigationToggle: {
    eventType: 'click',
    selector: '#{navToggleId}',
    handler: async (context, event, navId) => {
      const { toggleViewState } = await import('./dom-manipulation.js');
      await withErrorHandling(`${context}:navigationToggle`, () => {
        log(context, `Toggling navigation: ${navId}`);
        toggleViewState(context, { [navId]: true });
      }, ERROR_MESSAGES.SECTION_TOGGLE_FAILED);
    },
  },
  permissionChange: {
    eventType: 'change',
    selector: '#userList input[data-userId][data-permission]',
    handler: async (context, event) => {
      const { updateUserPermission } = await import('../admin/users-data.js');
      const { userId, permission, role } = event.target.dataset;
      const isChecked = event.target.checked;
      await withErrorHandling(`${context}:permissionChange`, async () => {
        log(context, `Processing permission change for user ${userId}, permission ${permission}, role ${role}`);
        await updateUserPermission(context, userId, permission, isChecked, role);
      }, ERROR_MESSAGES.FETCH_FAILED('permission update'), () => {
        event.target.checked = !isChecked; // Revert checkbox on error
      });
    },
  },
  modifyPermissions: {
    eventType: 'click',
    selector: '#userList .modify-permissions',
    handler: async (context, event) => {
      const { fetchUserForPermissions } = await import('../admin/users-data.js');
      const { renderPermissionsModal } = await import('../admin/users-ui.js');
      const { setupAdminEvents } = await import('../admin/admin-events.js');
      const { userId, role } = event.target.dataset;
      await withErrorHandling(`${context}:modifyPermissions`, async () => {
        log(context, `Initiating permissions modification for user ${userId}, role ${role}`);
        const userData = await fetchUserForPermissions(context, userId);
        await renderPermissionsModal(context, userId, userData, role);
        setupAdminEvents(context); // Re-apply modal events
      }, ERROR_MESSAGES.ELEMENT_NOT_FOUND);
    },
  },
  categoryCheckboxChange: {
    eventType: 'change',
    selector: 'input[data-deselected]',
    handler: async (context, event) => {
      const { updateDeselectedCategories } = await import('../community/categories-data.js');
      const { updateFormState } = await import('../utils/form-submission.js');
      const { withElement } = await import('./dom-manipulation.js');
      await withErrorHandling(`${context}:categoryCheckboxChange`, async () => {
        await withElement(context, 'deselected', async (deselectedInput) => {
          await withElement(context, 'previousDeselected', async (previousDeselectedInput) => {
            const allCategories = Array.from(document.querySelectorAll('input[name="selected"]')).map(cb => cb.value);
            const selectedCategories = Array.from(document.querySelectorAll('input[name="selected"]:checked')).map(cb => cb.value);
            const { deselected, previousDeselected } = updateDeselectedCategories(context, selectedCategories, allCategories);
            await updateFormState(context, 'categoryForm', {
              deselected: JSON.stringify(deselected),
              previousDeselected: JSON.stringify(previousDeselected),
            });
            log(context, 'Updated deselections:', deselected);
          });
        }, 10, 100, true);
      }, ERROR_MESSAGES.DATA_PROCESSING_FAILED);
    },
  },
};

/**
 * Sets up multiple event listeners based on the provided configurations.
 * @param {string} context - The context or module name.
 * @param {Array<{eventType: string, selector: string, handler: Function}>} listeners - Array of listener configurations.
 * @returns {void}
 */
export function setupEventListeners(context, listeners) {
  log(context, 'Setting up event listeners');
  withErrorHandling(`${context}:setupEventListeners`, () => {
    listeners.forEach(({ eventType, selector, handler }) => {
      registerEventListener(context, eventType, selector, async event => {
        await withErrorHandling(`${context}:eventHandler`, () => handler(event), ERROR_MESSAGES.EVENT_HANDLER_FAILED);
      });
    });
  }, ERROR_MESSAGES.EVENT_HANDLER_FAILED);
}

/**
 * Registers event listeners from the event configuration registry.
 * @param {string} context - The context or module name.
 * @param {Array<string>} configKeys - Array of event configuration keys.
 * @param {Object} [params={}] - Parameters to customize selectors and handlers.
 * @returns {void}
 */
export function registerEvents(context, configKeys, params = {}) {
  log(context, `Registering events: ${configKeys.join(', ')}`);
  withErrorHandling(`${context}:registerEvents`, () => {
    configKeys.forEach(key => {
      const config = EVENT_CONFIGS[key];
      if (!config) {
        log(context, `Event configuration not found: ${key}`);
        return;
      }
      let selector = config.selector;
      if (selector.includes('{')) {
        selector = selector.replace(/{(\w+)}/g, (_, param) => params[param] || '');
      }
      registerEventListener(context, config.eventType, selector, async event => {
        await withErrorHandling(`${context}:${key}`, () => config.handler(context, event, ...Object.values(params)), ERROR_MESSAGES.EVENT_HANDLER_FAILED);
      });
    });
  }, ERROR_MESSAGES.EVENT_HANDLER_FAILED);
}

/**
 * Sets up event listeners for form field interactions (e.g., radio buttons, checkboxes).
 * @param {string} context - The context or module name.
 * @param {Object} config - Configuration object.
 * @returns {void}
 */
export function setupFormFieldEvents(context, { selector, eventType, handler }) {
  log(context, `Setting up form field events for selector: ${selector}`);
  registerEventListener(context, eventType, selector, async event => {
    await withErrorHandling(`${context}:formFieldEvent`, () => handler(event), ERROR_MESSAGES.EVENT_HANDLER_FAILED);
  });
}

/**
 * Initializes the event-listeners module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} EventListeners instance with public methods.
 */
export function initializeEventListenersModule(registry) {
  return createModuleInitializer('event-listeners.js', {
    setupEventListeners,
    registerEvents,
    setupFormFieldEvents,
  });
}

// Initialize module with lifecycle logging
const context = 'event-listeners.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});