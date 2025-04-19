// /static/js/utils/dom-events.js
// Purpose: Provides utilities for managing DOM events.

import { log } from '../core/logger.js';
import { withErrorHandling } from './error.js';
import { ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from './initialization.js';

/**
 * Registers a single DOM event listener with error handling.
 * @param {string} context - The context or module name.
 * @param {string} eventType - The event type (e.g., 'click', 'submit').
 * @param {string} selector - The CSS selector for the target element.
 * @param {Function} handler - The event handler function.
 * @returns {void}
 */
export function registerEventListener(context, eventType, selector, handler) {
  log(context, `Registering ${eventType} event listener for selector: ${selector}`);
  withErrorHandling(`${context}:registerEventListener`, () => {
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) {
      log(context, `No elements found for selector: ${selector}`);
      return;
    }
    elements.forEach(element => {
      element.addEventListener(eventType, async event => {
        await withErrorHandling(`${context}:eventHandler`, () => handler(event), ERROR_MESSAGES.EVENT_HANDLER_FAILED);
      });
    });
  }, ERROR_MESSAGES.ELEMENT_NOT_FOUND);
}

/**
 * Initializes the dom-events module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} DomEvents instance with public methods.
 */
export function initializeDomEventsModule(registry) {
  const context = 'dom-events.js';
  log(context, 'Initializing dom-events module for module registry');
  return {
    registerEventListener: (ctx, ...args) => registerEventListener(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'dom-events.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});