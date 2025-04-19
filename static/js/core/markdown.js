// /static/js/core/markdown.js
// Purpose: Provides markdown rendering functionality using marked.js.

import { log } from './logger.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/initialization.js';

/**
 * Renders markdown content from a URL or string.
 * @param {string} context - The context or module name.
 * @param {string} contentOrUrl - The markdown content or URL to fetch it from.
 * @returns {Promise<string>} The rendered HTML content.
 */
export async function renderMarkdown(context, contentOrUrl) {
  log(context, `Rendering markdown from: ${contentOrUrl}`);
  return await withErrorHandling(`${context}:renderMarkdown`, async () => {
    let markdownContent;
    if (contentOrUrl.startsWith('http') || contentOrUrl.startsWith('/')) {
      const response = await fetch(contentOrUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch markdown: ${response.status}`);
      }
      markdownContent = await response.text();
    } else {
      markdownContent = contentOrUrl;
    }
    // Assume marked.js is globally available
    return window.marked ? window.marked(markdownContent) : markdownContent;
  }, ERROR_MESSAGES.MARKDOWN_RENDER_FAILED);
}

/**
 * Initializes the markdown module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Markdown instance with public methods.
 */
export function initializeMarkdownModule(registry) {
  const context = 'markdown.js';
  log(context, 'Initializing markdown module for module registry');
  return {
    renderMarkdown: (ctx, ...args) => renderMarkdown(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'markdown.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});