// /static/js/utils/ui-components.js
// Purpose: Provides utilities for rendering reusable UI components.

import { log, error as logError } from '../core/logger.js';
import { withErrorHandling } from './error.js';
import { ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from './logging-utils.js';

/**
 * Renders a data table into a DOM element.
 * @param {string} context - The context or module name.
 * @param {Object} config - Table configuration object.
 * @param {Array} config.data - The data to render.
 * @param {Array<string>} config.headers - The table headers.
 * @param {Function} config.rowMapper - Asynchronous function to map data items to an array of cell contents (strings or DOM elements).
 * @param {string} config.emptyMessage - Message to display if no data is available.
 * @returns {Promise<HTMLElement>} The rendered <tbody> element.
 */
export async function renderDataTable(context, { data, headers, rowMapper, emptyMessage }) {
    log(context, 'Rendering data table with data:', data);
    return await withErrorHandling(`${context}:renderDataTable`, async () => {
        const tbody = document.createElement('tbody');
        if (!Array.isArray(data) || data.length === 0) {
            log(context, 'No data provided or data is not an array');
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = headers.length;
            td.textContent = emptyMessage || 'No data available';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return tbody;
        }
        for (const item of data) {
            try {
                const cells = await rowMapper(item);
                if (!Array.isArray(cells)) {
                    logError(context, `Row mapper did not return an array for item:`, item);
                    continue;
                }
                if (cells.length !== headers.length) {
                    logError(context, `Cell count mismatch: expected ${headers.length}, got ${cells.length} for item:`, item);
                    continue;
                }
                const tr = document.createElement('tr');
                cells.forEach(cell => {
                    const td = document.createElement('td');
                    if (typeof cell === 'string') {
                        td.textContent = cell;
                    } else if (cell instanceof HTMLElement) {
                        td.appendChild(cell);
                    } else {
                        td.textContent = String(cell);
                    }
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            } catch (err) {
                logError(context, `Error mapping row for item: ${JSON.stringify(item)}, error: ${err.message}`);
                continue;
            }
        }
        if (tbody.children.length === 0) {
            log(context, 'No valid rows rendered, showing empty message');
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = headers.length;
            td.textContent = emptyMessage || 'No data available';
            tr.appendChild(td);
            tbody.appendChild(tr);
        }
        log(context, 'Table body rendered:', tbody.outerHTML); // Debug log
        return tbody;
    }, ERROR_MESSAGES.RENDER_FAILED('data table data'));
}

/**
 * Renders a checkbox list into an HTML element.
 * @param {string} context - The context or module name.
 * @param {Object} config - Checkbox list configuration object.
 * @param {Array} config.items - Array of items to render as checkboxes.
 * @param {string} config.name - Name attribute for the checkboxes.
 * @param {Array} config.selected - Array of selected values.
 * @param {Object} config.dataAttributes - Data attributes to add to each checkbox.
 * @param {string} config.containerClass - CSS class for the container.
 * @returns {Promise<HTMLElement>} The container element with the checkbox list.
 */
export async function renderCheckboxList(context, { items, name, selected, dataAttributes, containerClass }) {
    log(context, `Rendering checkbox list for: ${name}`);
    return await withErrorHandling(`${context}:renderCheckboxList`, async () => {
        const container = document.createElement('div');
        container.className = containerClass || '';

        items.forEach(item => {
            const { value, label } = typeof item === 'string' ? { value: item, label: item } : item;
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = name;
            checkbox.value = value;
            checkbox.checked = selected.includes(value);

            if (dataAttributes) {
                Object.entries(dataAttributes).forEach(([key, val]) => {
                    checkbox.setAttribute(`data-${key}`, val);
                });
            }

            const labelElement = document.createElement('label');
            labelElement.style.marginRight = '10px';
            labelElement.appendChild(checkbox);
            labelElement.appendChild(document.createTextNode(` ${label}`));

            container.appendChild(labelElement);
        });

        return container;
    }, ERROR_MESSAGES.RENDER_FAILED('checkbox list data'));
}

/**
 * Renders a modal dialog.
 * @param {string} context - The context or module name.
 * @param {Object} config - Modal configuration object.
 * @param {string} config.id - The ID for the modal.
 * @param {string} config.title - The modal title.
 * @param {string|HTMLElement} config.content - The modal content (HTML string or HTMLElement).
 * @param {string} config.formId - The ID for the form inside the modal.
 * @param {Array} config.buttons - Array of button configurations.
 * @returns {Promise<HTMLElement>} The modal element.
 */
export async function renderModal(context, { id, title, content, formId, buttons }) {
    log(context, `Rendering modal: ${id}`);
    return await withErrorHandling(`${context}:renderModal`, async () => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = id;

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        const modalTitle = document.createElement('h2');
        modalTitle.textContent = title;
        const closeButton = document.createElement('span');
        closeButton.className = 'close';
        closeButton.innerHTML = '×';
        closeButton.onclick = () => modal.remove();
        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeButton);

        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        const form = document.createElement('form');
        form.id = formId;
        if (typeof content === 'string') {
            form.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            form.appendChild(content);
        } else {
            form.textContent = 'Invalid content provided';
        }
        modalBody.appendChild(form);

        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.type = btn.type || 'button';
            button.className = btn.className || '';
            button.textContent = btn.text;
            if (btn.onclick) button.onclick = btn.onclick;
            modalFooter.appendChild(button);
        });

        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(modalFooter);
        modal.appendChild(modalContent);

        document.body.appendChild(modal);
        modal.style.display = 'block';

        return modal;
    }, ERROR_MESSAGES.RENDER_FAILED('modal'));
}

/**
 * Creates link icons for settings or navigation.
 * @param {string} context - The context or module name.
 * @param {Array} settings - Array of settings objects with key_type and doc_link.
 * @param {string} type - The type of settings (e.g., 'api', 'affiliate').
 * @param {Function} onReadmeClick - Callback for readme link clicks.
 * @param {Function} onIconClick - Callback for icon clicks.
 * @returns {HTMLElement[]} Array of icon elements.
 */
export function createLinkIcons(context, settings, type, onReadmeClick, onIconClick) {
    log(context, `Creating link icons for type: ${type}`);
    return withErrorHandling(`${context}:createLinkIcons`, () => {
        if (!Array.isArray(settings)) {
            logError(context, 'Settings must be an array');
            return [];
        }

        const icons = [];
        settings.forEach(setting => {
            if (!setting.key_type) return;

            const icon = document.createElement('i');
            icon.className = setting.icon || `fas fa-${type}`;
            icon.dataset.keyType = setting.key_type;
            icon.addEventListener('click', () => onIconClick?.(setting));
            icons.push(icon);

            const readmeLink = setting.doc_link?.find(link => link.title === 'readme');
            if (readmeLink) {
                const readmeIcon = document.createElement('i');
                readmeIcon.className = 'fas fa-book';
                readmeIcon.dataset.keyType = setting.key_type;
                readmeIcon.addEventListener('click', () => onReadmeClick?.(setting));
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