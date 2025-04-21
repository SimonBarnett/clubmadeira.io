// /static/js/utils/dom-manipulation.js
// Purpose: Provides utilities for DOM manipulation with retry logic and visibility toggling.

import { log } from '../core/logger.js';
import { withErrorHandling } from './error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from './initialization.js';

// Cache for DOM elements to reduce repeated queries
const elementCache = new Map();

/**
 * Executes a callback with a DOM element, retrying if the element is not found.
 * @param {string} context - The context or module name.
 * @param {string} elementId - The ID of the DOM element.
 * @param {Function} callback - The callback to execute with the element.
 * @param {number} [maxAttempts=10] - Maximum retry attempts.
 * @param {number} [retryDelay=100] - Delay between retries in milliseconds.
 * @param {boolean} [checkVisibility=false] - Whether to check element visibility.
 * @returns {Promise<void>}
 */
export async function withElement(context, elementId, callback, maxAttempts = 10, retryDelay = 100, checkVisibility = false) {
  log(context, `Accessing element: ${elementId}`);
  if (elementCache.has(elementId)) {
    log(context, `Using cached element: ${elementId}`);
    return await callback(elementCache.get(elementId));
  }
  return await withErrorHandling(`${context}:withElement`, async () => {
    const element = await waitForElement(context, elementId, maxAttempts, retryDelay);
    if (checkVisibility && element.offsetParent === null) {
      throw new Error(`Element ${elementId} is not visible`);
    }
    elementCache.set(elementId, element);
    return await callback(element);
  }, ERROR_MESSAGES.ELEMENT_NOT_FOUND);
}

/**
 * Fetches multiple DOM elements and returns them as an object.
 * @param {string} context - The context or module name.
 * @param {string[]} elementIds - Array of DOM element IDs to fetch.
 * @param {number} [maxAttempts=10] - Maximum retry attempts.
 * @param {number} [retryDelay=100] - Delay between retries in milliseconds.
 * @returns {Promise<Object>} Object mapping element IDs to DOM elements.
 */
export async function getElements(context, elementIds, maxAttempts = 10, retryDelay = 100) {
  log(context, `Fetching elements: ${elementIds.join(', ')}`);
  return await withErrorHandling(`${context}:getElements`, async () => {
    const elements = {};
    for (const id of elementIds) {
      if (elementCache.has(id)) {
        elements[id] = elementCache.get(id);
        continue;
      }
      const element = await waitForElement(context, id, maxAttempts, retryDelay);
      elementCache.set(id, element);
      elements[id] = element;
    }
    return elements;
  }, ERROR_MESSAGES.ELEMENT_NOT_FOUND);
}

/**
 * Waits for a DOM element to be available, retrying if not found.
 * @param {string} context - The context or module name.
 * @param {string} elementId - The ID of the DOM element.
 * @param {number} maxAttempts - Maximum retry attempts.
 * @param {number} retryDelay - Delay between retries in milliseconds.
 * @returns {Promise<HTMLElement>} The found element.
 */
async function waitForElement(context, elementId, maxAttempts, retryDelay) {
  log(context, `Waiting for element: ${elementId}`);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const element = document.getElementById(elementId);
    if (element) {
      log(context, `Element found: ${elementId}`);
      return element;
    }
    log(context, `Element not found, attempt ${attempt}/${maxAttempts}`);
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }
  throw new Error(`Element ${elementId} not found after ${maxAttempts} attempts`);
}

/**
 * Toggles the visibility of elements based on a state object, hiding all other sections with class '.section'.
 * @param {string} context - The context or module name.
 * @param {Object.<string, boolean>} state - Object mapping element IDs to visibility states.
 * @returns {void}
 */
export function toggleViewState(context, state) {
  log(context, 'Toggling view state:', state);
  withErrorHandling(`${context}:toggleViewState`, () => {
    const allSections = document.querySelectorAll('.section');
    allSections.forEach(section => {
      const id = section.id;
      if (state.hasOwnProperty(id)) {
        section.style.display = state[id] ? 'block' : 'none';
        log(context, `Set ${id} display to ${state[id] ? 'visible' : 'hidden'}`);
      } else {
        section.style.display = 'none';
        log(context, `Hid section ${id} as it's not in the state object`);
      }
    });
  }, ERROR_MESSAGES.ELEMENT_NOT_FOUND);
}

/**
 * Sets up event listeners for collapsible sections.
 * @param {string} context - The context or module name.
 * @returns {void}
 */
export function setupCollapsibleSections(context) {
  log(context, 'Setting up collapsible sections');
  withErrorHandling(`${context}:setupCollapsibleSections`, () => {
    const toggleSections = document.querySelectorAll('.toggle-section');
    toggleSections.forEach(section => {
      section.addEventListener('click', () => {
        const targetId = section.getAttribute('data-toggle');
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
          const isOpen = targetContent.classList.contains('open');
          const parentSection = section.closest('.section');
          if (parentSection) {
            parentSection.querySelectorAll('.toggle-content.open').forEach(content => {
              content.classList.remove('open');
              content.style.display = 'none';
            });
          }
          if (!isOpen) {
            targetContent.classList.add('open');
            targetContent.style.display = 'block';
          }
        } else {
          log(context, `Target content not found for ID: ${targetId}`);
        }
      });
    });
  }, ERROR_MESSAGES.ELEMENT_NOT_FOUND);
}

/**
 * Initializes the dom-manipulation module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} DomManipulation instance with public methods.
 */
export function initializeDomManipulationModule(registry) {
  const context = 'dom-manipulation.js';
  log(context, 'Initializing dom-manipulation module for module registry');
  return {
    withElement: (ctx, ...args) => withElement(ctx, ...args),
    getElements: (ctx, ...args) => getElements(ctx, ...args),
    toggleViewState: (ctx, ...args) => toggleViewState(ctx, ...args),
    setupCollapsibleSections: (ctx) => setupCollapsibleSections(ctx),
  };
}

// Initialize module with lifecycle logging
const context = 'dom-manipulation.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});