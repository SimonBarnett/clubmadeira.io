// /static/js/utils/ui-components.js
// Purpose: Provides utilities for rendering reusable UI components.

import { log } from '../core/logger.js';
import { createIcon } from './icons.js';
import { withErrorHandling } from './error.js';
import { ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from './initialization.js';

/**
 * Renders a data table based on the provided configuration.
 * @param {string} context - The context or module name.
 * @param {Object} config - Table configuration object.
 * @returns {string} The rendered HTML table.
 */
export function renderDataTable(context, { data = [], headers = [], rowMapper, emptyMessage }) {
  log(context, 'Rendering data table');
  return withErrorHandling(`${context}:renderDataTable`, () => {
    if (!data.length) {
      return `<p>${emptyMessage || 'No data available'}</p>`;
    }
    const headerHtml = headers.map(header => `<th>${header}</th>`).join('');
    const rowsHtml = data.map(item => `<tr>${rowMapper(item).map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
    return `
      <table>
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;
  }, ERROR_MESSAGES.RENDER_FAILED('data table'));
}

/**
 * Renders a checkbox list based on the provided configuration.
 * @param {string} context - The context or module name.
 * @param {Object} config - Checkbox list configuration object.
 * @returns {HTMLElement} The rendered checkbox list container.
 */
export function renderCheckboxList(context, { items = [], name, selected = [], dataAttributes = {}, containerClass = '' }) {
  log(context, `Rendering checkbox list for: ${name}`);
  return withErrorHandling(`${context}:renderCheckboxList`, () => {
    const container = document.createElement('div');
    if (containerClass) {
      container.className = containerClass;
    }
    items.forEach(item => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = name;
      checkbox.value = item.value;
      checkbox.checked = selected.includes(item.value);
      Object.entries(dataAttributes).forEach(([key, value]) => {
        checkbox.dataset[key] = value;
      });

      const label = document.createElement('label');
      label.textContent = item.label;
      label.prepend(checkbox);

      container.appendChild(label);
    });
    return container;
  }, ERROR_MESSAGES.RENDER_FAILED('checkbox list'));
}

/**
 * Renders a modal based on the provided configuration.
 * @param {string} context - The context or module name.
 * @param {Object} config - Modal configuration object.
 * @returns {Promise<HTMLElement>} The rendered modal element.
 */
export async function renderModal(context, { id, title, content, formId, buttons = [] }) {
  log(context, `Rendering modal: ${id}`);
  return await withErrorHandling(`${context}:renderModal`, async () => {
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>${title}</h2>
        <form id="${formId}">
          ${typeof content === 'string' ? content : content.outerHTML}
          <div class="modal-buttons">
            ${buttons.map(btn => `<button type="${btn.type}" class="${btn.className || ''}" ${btn.onclick ? `onclick="${btn.onclick}"` : ''}>${btn.text}</button>`).join('')}
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  }, ERROR_MESSAGES.RENDER_FAILED('modal'));
}

/**
 * Creates link icons for settings or navigation.
 * @param {string} context - The context or module name.
 * @param {Array} links - Array of link objects with keyType and docLink.
 * @param {string} type - The type of links (e.g., 'api', 'affiliate').
 * @param {Function} onReadmeClick - Callback for readme link clicks.
 * @param {Function} onIconClick - Callback for icon clicks.
 * @returns {HTMLElement[]} Array of icon elements.
 */
export function createLinkIcons(context, links, type, onReadmeClick, onIconClick) {
  log(context, `Creating link icons for type: ${type}`);
  return withErrorHandling(`${context}:createLinkIcons`, () => {
    const icons = [];
    links.forEach(link => {
      const icon = createIcon(context, `fas fa-${type}`, { 'data-key-type': link.keyType });
      icon.addEventListener('click', () => onIconClick?.(link));
      icons.push(icon);

      const readmeLink = link.docLink?.find(l => l.title === 'readme');
      if (readmeLink) {
        const readmeIcon = createIcon(context, 'fas fa-book', { 'data-key-type': link.keyType });
        readmeIcon.addEventListener('click', () => onReadmeClick?.(link));
        icons.push(readmeIcon);
      }
    });
    return icons;
  }, ERROR_MESSAGES.RENDER_FAILED('link icons'));
}

/**
 * Initializes the ui-components module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} UiComponents instance with public methods.
 */
export function initializeUiComponentsModule(registry) {
  const context = 'ui-components.js';
  log(context, 'Initializing ui-components module for module registry');
  return {
    renderDataTable: (ctx, ...args) => renderDataTable(ctx, ...args),
    renderCheckboxList: (ctx, ...args) => renderCheckboxList(ctx, ...args),
    renderModal: (ctx, ...args) => renderModal(ctx, ...args),
    createLinkIcons: (ctx, ...args) => createLinkIcons(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'ui-components.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});