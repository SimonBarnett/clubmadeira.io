// /static/js/utils/form-rendering.js
// Purpose: Provides utilities for rendering form elements based on configurations.

import { log } from '../core/logger.js';
import { renderMarkdown } from '../core/markdown.js';
import { withErrorHandling } from './error.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { withScriptLogging } from './initialization.js';
import { getFormConfig } from '../config/form-configs.js';

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
 * Renders a form based on the provided configuration and either appends it to the container or returns the HTML.
 * @param {Object} formConfig - The form configuration object (must contain id, action, method, etc.).
 * @param {Object} [config={}] - Additional rendering configuration options.
 * @param {HTMLElement|null} [container=null] - The container element to render the form in. If null, returns the HTML as a string.
 * @returns {string|void} Returns the rendered form HTML as a string if container is null; otherwise, appends to the container.
 */
export function renderForm(formConfig, config = {}, container = null) {
    const context = 'form-rendering.js';
    log(context, 'Rendering form with formId:', formConfig, 'config:', config, 'container:', container);
    return withErrorHandling(`${context}:renderForm`, () => {
        // Validate formConfig
        if (!formConfig || typeof formConfig !== 'object' || !formConfig.id) {
            throw new Error('Invalid form configuration: formConfig must be an object with an id property');
        }

        const { id = formConfig.id, action = '', method = 'POST', fields = [], customFields = [], submitButtonText = 'Submit', extraButtons = [], wrapper } = formConfig;

        // Validate fields array
        if (!Array.isArray(fields)) {
            throw new Error('Form configuration must include a fields array');
        }

        // Render form fields
        const fieldHtml = fields
            .map(field => {
                if (!field.name || !field.type) {
                    log(context, `Warning: Field missing name or type: ${JSON.stringify(field)}`);
                    return '';
                }
                let inputHtml;
                switch (field.type) {
                    case 'textarea':
                        inputHtml = `
                            <textarea id="${field.id || field.name}" name="${field.name}" ${field.required ? 'required' : ''} rows="${field.rows || 4}" cols="${field.cols || 50}" style="${field.style || ''}">${field.value || ''}</textarea>
                        `;
                        break;
                    case 'hidden':
                        inputHtml = `<input type="hidden" id="${field.id || field.name}" name="${field.name}" value="${field.value || ''}">`;
                        break;
                    default:
                        inputHtml = `
                            <input type="${field.type}" id="${field.id || field.name}" name="${field.name}" value="${field.value || ''}" ${field.required ? 'required' : ''} style="${field.style || ''}" ${field.attributes ? Object.entries(field.attributes).map(([k, v]) => `${k}="${v}"`).join(' ') : ''}>
                        `;
                }
                const extraButtonsHtml = field.extraButtons
                    ? field.extraButtons.map(btn => {
                          const btnAttributes = Object.entries(btn)
                              .filter(([key]) => key !== 'text')
                              .map(([key, value]) => `${key}="${value}"`)
                              .join(' ');
                          return `<button ${btnAttributes}>${btn.text}</button>`;
                      }).join('')
                    : '';
                const fieldWrapperStyle = field.wrapper ? `class="${field.wrapper.class || ''}" style="${field.wrapper.style || ''}"` : '';
                return `
                    <div ${fieldWrapperStyle}>
                        <label for="${field.id || field.name}">${field.label || ''}</label>
                        ${inputHtml}
                        ${extraButtonsHtml}
                    </div>
                `;
            })
            .join('');

        // Render custom fields (e.g., checkbox lists)
        const customFieldHtml = customFields
            .map(field => {
                if (field.type === 'checkboxList' && field.render) {
                    return field.render(field.items, field.selected);
                }
                return '';
            })
            .join('');

        // Render form-level buttons
        const buttonsHtml = `
            <button type="submit">${submitButtonText}</button>
            ${extraButtons.map(btn => `<button type="${btn.type || 'button'}" data-action="${btn.dataAction || ''}" style="${btn.style || ''}">${btn.text}</button>`).join('')}
        `;

        // Apply form wrapper styles
        const wrapperStyle = wrapper ? `class="${wrapper.class || ''}" style="${wrapper.style || ''}"` : '';

        // Combine HTML
        const formHtml = `
            <form id="${id}" action="${action}" method="${method}">
                <div ${wrapperStyle}>
                    ${fieldHtml}
                    ${customFieldHtml}
                    ${buttonsHtml}
                </div>
            </form>
        `;

        // If container is provided, append the form to it; otherwise, return the HTML
        if (container && container instanceof HTMLElement) {
            container.innerHTML = formHtml;
            log(context, `Form ${id} rendered successfully in container with ${fields.length} fields`);
            return;
        }

        log(context, `Form ${id} rendered as HTML string with ${fields.length} fields`);
        return formHtml;
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
 * @param {Map} registry - The module registry instance.
 * @returns {Object} FormRendering instance with public methods.
 */
export function initializeFormRenderingModule(registry) {
    const context = 'form-rendering.js';
    log(context, 'Initializing form-rendering module for module registry');
    return {
        renderForm: (formConfig, config, container) => renderForm(formConfig, config, container),
        renderMarkdownContent: (ctx, ...args) => renderMarkdownContent(ctx, ...args),
    };
}

/**
 * Initializes the form-rendering module.
 */
export function initializeFormRendering() {
    withScriptLogging('form-rendering.js', () => {
        log('form-rendering.js', 'Module initialized');
    });
}