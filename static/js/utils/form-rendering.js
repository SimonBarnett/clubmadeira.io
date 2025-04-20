// /static/js/utils/form-rendering.js
// Purpose: Provides utilities for rendering form elements based on configurations.

import { log } from '../core/logger.js';
import { renderMarkdown } from '../core/markdown.js';
import { withErrorHandling } from './error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from './initialization.js';

/**
 * Generates a style string or object for form elements.
 * @param {string} type - The type of form element (e.g., 'categories').
 * @param {Object} styles - Style properties to apply.
 * @returns {string} A CSS style string.
 */
export function renderStyles(type, styles) {
    const context = 'form-rendering.js';
    log(context, `Rendering styles for type: ${type}`);
    return Object.entries(styles)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ');
  }

/**
 * Renders a form based on the provided configuration.
 * @param {Object} config - Form configuration object.
 * @returns {string} The rendered HTML form.
 */
export function renderForm(config) {
  const context = 'form-rendering.js';
  log(context, 'Rendering form with config:', config.id);
  return withErrorHandling(`${context}:renderForm`, () => {
    const { id, action, method = 'POST', fields = [], customFields = [], submitButtonText = 'Submit', extraButtons = [], wrapper } = config;
    const fieldHtml = fields
      .map(field => {
        switch (field.type) {
          case 'textarea':
            return `
              <div>
                <label for="${field.id}">${field.label || ''}</label>
                <textarea id="${field.id}" name="${field.name}" ${field.required ? 'required' : ''} rows="${field.rows || 4}" cols="${field.cols || 50}" style="${field.style || ''}">${field.value || ''}</textarea>
              </div>
            `;
          case 'hidden':
            return `<input type="hidden" id="${field.id}" name="${field.name}" value="${field.value || ''}">`;
          default:
            return `<input type="${field.type}" id="${field.id}" name="${field.name}" value="${field.value || ''}" ${field.required ? 'required' : ''} style="${field.style || ''}">`;
        }
      })
      .join('');

    const customFieldHtml = customFields
      .map(field => {
        if (field.type === 'checkboxList' && field.render) {
          return field.render(field.items, field.selected);
        }
        return '';
      })
      .join('');

    const buttonsHtml = `
      <button type="submit">${submitButtonText}</button>
      ${extraButtons.map(btn => `<button type="${btn.type || 'button'}" data-action="${btn.dataAction || ''}" style="${btn.style || ''}">${btn.text}</button>`).join('')}
    `;

    const wrapperStyle = wrapper ? `class="${wrapper.class || ''}" style="${wrapper.style || ''}"` : '';
    return `
      <form id="${id}" action="${action}" method="${method}" ${wrapperStyle}>
        ${fieldHtml}
        ${customFieldHtml}
        ${buttonsHtml}
      </form>
    `;
  }, ERROR_MESSAGES.FORM_SUBMISSION_FAILED);
}

/**
 * Renders markdown content into a container.
 * @param {string} context - The context or module name.
 * @param {string} markdownPath - The path to the markdown file.
 * @param {string} targetId - The ID of the container to render into.
 * @returns {Promise<void>}
 */
export async function renderMarkdownContent(context, markdownPath, targetId) {
  log(context, `Rendering markdown content into: ${targetId}`);
  await withErrorHandling(`${context}:renderMarkdownContent`, async () => {
    const htmlContent = await renderMarkdown(context, markdownPath);
    const target = document.getElementById(targetId);
    if (!target) {
      throw new Error(`Target element ${targetId} not found`);
    }
    target.innerHTML = htmlContent;
  }, ERROR_MESSAGES.MARKDOWN_RENDER_FAILED);
}

/**
 * Initializes the form-rendering module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} FormRendering instance with public methods.
 */
export function initializeFormRenderingModule(registry) {
  const context = 'form-rendering.js';
  log(context, 'Initializing form-rendering module for module registry');
  return {
    renderForm,
    renderMarkdownContent: (ctx, ...args) => renderMarkdownContent(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'form-rendering.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});