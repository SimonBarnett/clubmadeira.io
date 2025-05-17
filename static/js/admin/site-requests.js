// /static/js/admin/site-requests.js
import { log, warn, error as logError } from '../core/logger.js';
import { fetchData } from '../utils/data-fetch.js';
import { renderDataTable } from '../utils/ui-components.js';
import { toggleViewState, withElement } from '../utils/dom-manipulation.js';
import { error, success } from '../core/notifications.js';
import { withErrorHandling } from '../utils/error.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/messages.js';
import { API_ENDPOINTS } from '../config/endpoints.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { parsePageType, shouldInitializeForPageType } from '../utils/initialization.js';
import { createModuleInitializer } from '../utils/initialization.js';

const context = 'site-requests.js';

/**
 * Loads and renders the list of site requests into a table.
 * @param {string} context - The context or module name.
 * @returns {Promise<void>}
 */
export async function loadSiteRequests(context) {
    const pageType = await parsePageType(context, 'page', 'admin');
    if (pageType !== 'admin') {
        log(context, `Skipping initialization for non-admin page type: ${pageType}`);
        return;
    }
    log(context, 'Loading site requests');
    await withErrorHandling(`${context}:loadSiteRequests`, async () => {
        await withElement(context, 'site-request-list', async (tableBody) => {
            const data = await fetchData(context, API_ENDPOINTS.SITE_REQUESTS, { method: 'GET' });
            log(context, `API response for ${API_ENDPOINTS.SITE_REQUESTS}:`, data);
            if (!data.siterequests || !Array.isArray(data.siterequests) || data.siterequests.length === 0) {
                warn(context, 'No site requests found');
                tableBody.innerHTML = '<tr><td colspan="7">No site requests available.</td></tr>';
                error(context, ERROR_MESSAGES.NO_DATA('site requests'));
                return;
            }

            const headers = ['User ID', 'Contact Name', 'Email', 'Organisation', 'Type', 'Received At', 'Actions'];
            const rowMapper = (request) => {
                const viewButton = document.createElement('button');
                viewButton.textContent = 'View';
                viewButton.className = 'view-site-request';
                viewButton.dataset.userId = request.user_id;
                viewButton.addEventListener('click', () => {
                    viewSiteRequest(context, request.user_id);
                });

                return [
                    request.user_id || 'N/A',
                    request.contact_name || 'N/A',
                    request.email || 'N/A',
                    request.organisation || 'N/A',
                    request.type || 'N/A',
                    new Date(request.received_at).toLocaleString('en-GB') || 'N/A',
                    viewButton
                ];
            };

            const tbody = await renderDataTable(context, {
                data: data.siterequests,
                headers,
                rowMapper,
                emptyMessage: 'No site requests available.'
            });

            tableBody.innerHTML = '';
            while (tbody.firstChild) {
                tableBody.appendChild(tbody.firstChild);
            }
            log(context, `Rendered ${data.siterequests.length} site requests`);
            toggleViewState(context, { site_requests: true, 'view-site-request': false });
        });
    }, ERROR_MESSAGES.FETCH_FAILED('site requests'));
}

/**
 * Loads and renders the details of a specific site request in read-only mode with TinyMCE controls.
 * @param {string} context - The context or module name.
 * @param {string} userId - The user ID associated with the site request.
 * @returns {Promise<void>}
 */
export async function viewSiteRequest(context, userId) {
    const pageType = await parsePageType(context, 'page', 'admin');
    if (pageType !== 'admin') {
        log(context, `Skipping initialization for non-admin page type: ${pageType}`);
        return;
    }
    log(context, `Viewing site request for user ID: ${userId}`);
    await withErrorHandling(`${context}:viewSiteRequest`, async () => {
        const data = await fetchData(context, `${API_ENDPOINTS.SITE_REQUESTS}/${userId}`, { method: 'GET' });
        log(context, `API response for ${API_ENDPOINTS.SITE_REQUESTS}/${userId}:`, data);
        if (!data.siterequest) {
            warn(context, `No site request found for user ID: ${userId}`);
            error(context, ERROR_MESSAGES.NO_DATA('site request'));
            return;
        }

        await withElement(context, 'siteRequestForm', async (form) => {
            const request = data.siterequest;

            // **Populate static fields**
            const fields = {
                'name': request.communityName || '',
                'about': request.aboutCommunity || '',
                'colorPrefs': request.colorPrefs || '',
                'stylingDetails': request.stylingDetails || '',
                'preferredDomain': request.preferredDomain || ''
            };

            Object.entries(fields).forEach(([id, value]) => {
                const input = form.querySelector(`#${id}`);
                if (input) {
                    input.value = value;
                    // Only disable non-textarea elements; TinyMCE will handle textareas
                    if (input.tagName !== 'TEXTAREA') {
                        input.disabled = true;
                    }
                }
            });

            // **Populate logos (display actual images instead of file input)**
            const logosContainer = form.querySelector('#orglogos');
            if (logosContainer) {
                logosContainer.innerHTML = ''; // Clear existing content
                const logos = request.communityLogos;
                if (Array.isArray(logos)) {
                    if (logos.length > 0) {
                        logos.forEach((logo, index) => {
                            const img = document.createElement('img');
                            img.src = logo; // Assuming logo is a URL or path to the image
                            img.alt = `Logo ${index + 1}`;
                            img.className = 'logo-image'; // Optional: Add styling class
                            logosContainer.appendChild(img);
                        });
                    } else {
                        logosContainer.innerHTML = '<p>No logos available</p>';
                    }
                } else if (typeof logos === 'string') {
                    const img = document.createElement('img');
                    img.src = logos;
                    img.alt = 'Logo';
                    img.className = 'logo-image';
                    logosContainer.appendChild(img);
                } else {
                    logosContainer.innerHTML = '<p>No logos available</p>';
                }
            }

            // **Populate emails**
            const emailsContainer = form.querySelector('#emailsContainer');
            if (emailsContainer) {
                emailsContainer.innerHTML = (request.emails || ['']).map((email, index) => `
                    <div class="email-entry">
                        <input type="email" name="email_${index}" value="${email}" disabled>
                    </div>
                `).join('');
                // Disable add email button
                const addEmailButton = form.querySelector('[data-action="addEmail"]');
                if (addEmailButton) addEmailButton.disabled = true;
            }

            // **Populate pages with TinyMCE-enabled textareas**
            const pagesContainer = form.querySelector('#pagesContainer');
            if (pagesContainer) {
                pagesContainer.innerHTML = (request.pages || []).map((page, index) => {
                    let imagesHtml;
                    if (Array.isArray(page.images)) {
                        imagesHtml = page.images.length > 0
                            ? page.images.map((img, imgIndex) => `
                                <img src="${img}" alt="Page Image ${imgIndex + 1}" class="page-image">
                            `).join('')
                            : '<p>No images available</p>';
                    } else if (typeof page.images === 'string') {
                        imagesHtml = `<img src="${page.images}" alt="Page Image" class="page-image">`;
                    } else {
                        imagesHtml = '<p>No images available</p>';
                    }
                    return `
                        <div class="page-entry">
                            <input type="text" name="page_${index}_title" value="${page.title || ''}" disabled>
                            <textarea id="page_${index}_content" name="page_${index}_content" class="mce-editor">${page.content || ''}</textarea>
                            <div class="page-images">${imagesHtml}</div>
                        </div>
                    `;
                }).join('');
                // Disable add page button
                const addPageButton = form.querySelector('[data-action="addPage"]');
                if (addPageButton) addPageButton.disabled = true;
            }

            // **Populate widgets**
            const widgetCheckboxes = form.querySelectorAll('input[name="widgets"]');
            widgetCheckboxes.forEach(checkbox => {
                checkbox.checked = (request.widgets || []).includes(checkbox.value);
                checkbox.disabled = true;
            });

            // **Disable submit button**
            const submitButton = form.querySelector('.submit-request-button');
            if (submitButton) submitButton.disabled = true;

            // **Initialize TinyMCE on all textareas with class "mce-editor"**
            tinymce.init({
                selector: 'textarea.mce-editor',
                readonly: true,
                toolbar: false,
                menubar: false,
                statusbar: false
            });

            // **Setup back button to destroy TinyMCE instances before navigating back**
            const backButton = document.getElementById('back-to-list');
            if (backButton) {
                backButton.addEventListener('click', () => {
                    destroyTinyMCE();
                    loadSiteRequests(context);
                });
            }

            toggleViewState(context, { 'view-site-request': true, site_requests: false });
        });
    }, ERROR_MESSAGES.FETCH_FAILED('site request details'));
}

/**
 * Destroys all TinyMCE instances on textareas with class "mce-editor".
 */
function destroyTinyMCE() {
    tinymce.remove('textarea.mce-editor');
}

/**
 * Initializes the site requests module for the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} Module instance with public methods.
 */
export function initializeSiteRequestsModule(registry) {
    return createModuleInitializer(context, {
        loadSiteRequests,
        viewSiteRequest
    });
}

if (shouldInitializeForPageType('admin')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-admin page');
}