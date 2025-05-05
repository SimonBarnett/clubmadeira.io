// /static/js/utils/icons.js
// Purpose: Provides utilities for creating and managing icons in the DOM.

import { log } from '../core/logger.js';
import { withErrorHandling } from './error.js';
import { withScriptLogging } from './logging-utils.js';

const context = 'icons.js';

/**
 * Creates an icon element with the specified class and optional attributes.
 * @param {string} context - The context or module name for logging.
 * @param {string} iconClass - The CSS class for the icon (e.g., 'fas fa-user').
 * @param {Object} attributes - Additional attributes to set on the icon element.
 * @returns {HTMLElement} The created icon element.
 */
export function createIcon(context, iconClass, attributes = {}) {
    return withErrorHandling(`${context}:createIcon`, () => {
        log(context, `Creating icon with class: ${iconClass}`);
        const icon = document.createElement('i');

        // Validate and apply icon class, falling back to 'fas fa-link' if invalid
        const isValidClass = iconClass && typeof iconClass === 'string' && iconClass.trim() !== '';
        const appliedClass = isValidClass ? iconClass.trim() : 'fas fa-link';
        icon.className = appliedClass;

        if (!isValidClass) {
            log(context, `Invalid icon class provided: ${iconClass}, falling back to 'fas fa-link'`, 'warn');
        }

        // Apply additional attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                icon.setAttribute(key, value);
            }
        });

        log(context, `Icon created with class: ${appliedClass}`);
        return icon;
    }, 'Failed to create icon', () => {
        const fallbackIcon = document.createElement('i');
        fallbackIcon.className = 'fas fa-link';
        log(context, 'Returning fallback icon with class: fas fa-link');
        return fallbackIcon;
    });
}

/**
 * Initializes the icons module for use with the module registry.
 * @param {Map} registry - The module registry instance.
 * @returns {Object} Module instance with public methods.
 */
export function initializeIconsModule(registry) {
    log(context, 'Initializing icons module for module registry');
    return {
        createIcon: (ctx, iconClass, attributes) => createIcon(ctx, iconClass, attributes)
    };
}

// Initialize the module with lifecycle logging
withScriptLogging(context, () => {
    log(context, 'Module initialized');
});