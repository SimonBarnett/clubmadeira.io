// /static/js/core/mce.js
// Purpose: Initializes TinyMCE editor for rich text editing.

import { log } from './logger.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Initializes TinyMCE editor on the specified selector.
 * @param {string} context - The context or module name.
 * @param {string} selector - The CSS selector for the textarea to initialize TinyMCE on.
 * @returns {Promise<void>}
 */
export async function initializeTinyMCE(context, selector) {
  log(context, `Initializing TinyMCE on selector: ${selector}`);
  await withErrorHandling(`${context}:initializeTinyMCE`, async () => {
    if (!window.tinymce) {
      throw new Error('TinyMCE library not loaded');
    }
    await window.tinymce.init({
      selector,
      plugins: 'lists link image table code',
      toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link image',
      menubar: false,
      statusbar: false,
      height: 300,
    });
    log(context, 'TinyMCE initialized successfully');
  }, ERROR_MESSAGES.MODULE_INIT_FAILED);
}

/**
 * Initializes the TinyMCE module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} TinyMCE instance with public methods.
 */
export function initializeMceModule(registry) {
  const context = 'mce.js';
  log(context, 'Initializing TinyMCE module for module registry');
  return {
    initializeTinyMCE: (ctx, ...args) => initializeTinyMCE(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'mce.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});