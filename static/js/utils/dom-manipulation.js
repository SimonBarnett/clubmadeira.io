// /static/js/utils/dom-manipulation.js
// Purpose: Provides utilities for DOM manipulation with retry logic and visibility toggling.

import { log, warn } from '../core/logger.js';
import { withErrorHandling } from './error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from './logging-utils.js';

// Cache for DOM elements to reduce repeated queries
export const elementCache = new Map(); // Export elementCache

/**
 * Executes a callback with a DOM element, retrying if the element is not found.
 * @param {string} context - The context or module name.
 * @param {string} elementId - The ID of the DOM element.
 * @param {Function} callback - The callback to execute with the element.
 * @param {number} [maxAttempts=3] - Maximum retry attempts.
 * @param {number} [retryDelay=50] - Delay between retries in milliseconds.
 * @param {boolean} [checkVisibility=false] - Whether to check element visibility.
 * @returns {Promise<any>} The result of the callback or null if the element is not found.
 */
export async function withElement(context, elementId, callback, maxAttempts = 3, retryDelay = 50, checkVisibility = false) {
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
        log(context, `Element ${elementId} cached and callback executing`);
        return await callback(element);
    }, ERROR_MESSAGES.ELEMENT_NOT_FOUND, () => {
        warn(context, `Failed to find element ${elementId} after ${maxAttempts} attempts, returning null`);
        return null;
    });
}

/**
 * Fetches multiple DOM elements and returns them as an object.
 * @param {string} context - The context or module name.
 * @param {string[]} elementIds - Array of DOM element IDs to fetch.
 * @param {number} [maxAttempts=3] - Maximum retry attempts.
 * @param {number} [retryDelay=50] - Delay between retries in milliseconds.
 * @returns {Promise<Object>} Object mapping element IDs to DOM elements or null for unfound elements.
 */
export async function getElements(context, elementIds, maxAttempts = 3, retryDelay = 50) {
    log(context, `Fetching elements: ${elementIds.join(', ')}`);
    return await withErrorHandling(`${context}:getElements`, async () => {
        const elements = {};
        for (const id of elementIds) {
            if (elementCache.has(id)) {
                elements[id] = elementCache.get(id);
                log(context, `Using cached element: ${id}`);
                continue;
            }
            try {
                const element = await waitForElement(context, id, maxAttempts, retryDelay);
                elementCache.set(id, element);
                elements[id] = element;
            } catch (err) {
                warn(context, `Failed to find element ${id}: ${err.message}`);
                elements[id] = null;
            }
        }
        return elements;
    }, ERROR_MESSAGES.ELEMENT_NOT_FOUND, () => {
        warn(context, 'Failed to fetch elements, returning partial results');
        return elementIds.reduce((acc, id) => ({ ...acc, [id]: null }), {});
    });
}

/**
 * Waits for a DOM element to be available, retrying if not found.
 * @param {string} context - The context or module name.
 * @param {string} elementId - The ID of the DOM element.
 * @param {number} maxAttempts - Maximum retry attempts.
 * @param {number} retryDelay - Delay between retries in milliseconds.
 * @returns {Promise<HTMLElement>} The found element.
 * @throws {Error} If the element is not found after maxAttempts.
 */
async function waitForElement(context, elementId, maxAttempts, retryDelay) {
    log(context, `Waiting for element: ${elementId} with ${maxAttempts} attempts, ${retryDelay}ms delay`);
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const element = document.getElementById(elementId);
        if (element) {
            log(context, `Element ${elementId} found on attempt ${attempt}`);
            return element;
        }
        warn(context, `Element ${elementId} not found, attempt ${attempt}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
    throw new Error(`Element ${elementId} not found after ${maxAttempts} attempts`);
}

/**
 * Toggles the visibility of elements based on a state object, preserving info section visibility unless explicitly hidden.
 * @param {string} context - The context or module name.
 * @param {Object.<string, boolean>} state - Object mapping element IDs to visibility states.
 * @returns {void}
 */
export function toggleViewState(context, state) {
    log(context, 'Toggling view state:', state);
    try {
        const allSections = document.querySelectorAll('.section');
        log(context, 'Found sections:', Array.from(allSections).map(s => s.id || 'no-id')); // Debug log
        if (allSections.length === 0) {
            log(context, 'No sections found with class "section"');
            return;
        }
        allSections.forEach(section => {
            const id = section.id;
            if (!id) {
                log(context, 'Section found without ID, outerHTML:', section.outerHTML); // Debug log
                return;
            }
            if (id === 'info') {
                if (state.hasOwnProperty('info')) {
                    const shouldShow = state['info'];
                    section.style.display = shouldShow ? 'block' : 'none';
                    if (shouldShow) {
                        section.classList.add('active');
                    } else {
                        section.classList.remove('active');
                    }
                    log(context, `Set info display to ${shouldShow ? 'block' : 'none'}, active: ${shouldShow}`);
                } else {
                    const isOtherSectionShown = Object.values(state).some(val => val === true);
                    if (!isOtherSectionShown) {
                        section.style.display = 'block';
                        section.classList.add('active');
                        log(context, `Preserved info display as block, active: true (no other section shown)`);
                    } else {
                        section.style.display = 'none';
                        section.classList.remove('active');
                        log(context, `Hid info section as another section is being shown`);
                    }
                }
            } else if (state.hasOwnProperty(id)) {
                const shouldShow = state[id];
                section.style.display = shouldShow ? 'block' : 'none';
                if (shouldShow) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
                log(context, `Set ${id} display to ${shouldShow ? 'block' : 'none'}, active: ${shouldShow}`);
            } else {
                section.style.display = 'none';
                section.classList.remove('active');
                log(context, `Hid section ${id} as it's not in the state object`);
            }
        });
        // Check if state keys exist in DOM
        Object.keys(state).forEach(key => {
            if (!document.getElementById(key) && key !== 'info') {
                log(context, `Warning: State key ${key} does not match any section ID`);
            }
        });
    } catch (err) {
        log(context, `Error in toggleViewState: ${err.message}`);
        throw new Error(ERROR_MESSAGES.ELEMENT_NOT_FOUND);
    }
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