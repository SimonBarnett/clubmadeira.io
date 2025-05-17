// /static/js/modules/site-request.js
import { log, error as logError } from '../core/logger.js';
import { fetchData } from '../utils/data-fetch.js';
import { submitConfiguredForm } from '../utils/form-submission.js';
import { withAuthenticatedUser } from '../core/auth.js';
import { withElement, toggleViewState } from '../utils/dom-manipulation.js';
import { initializeTinyMCE } from '../core/mce.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';

const context = 'site-request.js';

/**
 * Initializes the site request form for a given section.
 * @param {string} context - The context or module name.
 * @param {string} sectionId - The ID of the section (e.g., 'create-store', 'no_website').
 */
export async function initializeSiteRequest(context, sectionId) {
    log(context, `Initializing site request for section: ${sectionId}`);
    await withAuthenticatedUser(context, async (userId) => {
        await withErrorHandling(`${context}:initializeSiteRequest`, async () => {
            log(context, `Starting initialization with userId: ${userId}`);
            await loadSiteRequest(context, sectionId, userId);
            setupSiteRequestEvents(context, sectionId, userId);
            log(context, 'Initialization completed successfully');
        }, ERROR_MESSAGES.MODULE_INIT_FAILED);
    }, 'initializeSiteRequest');
}

/**
 * Loads existing site request data into the form.
 * @param {string} context - The context or module name.
 * @param {string} sectionId - The section ID.
 * @param {string} userId - The authenticated user ID.
 */
async function loadSiteRequest(context, sectionId, userId) {
    log(context, `Loading site request data for section: ${sectionId}, userId: ${userId}`);
    await withErrorHandling(`${context}:loadSiteRequest`, async () => {
        await withElement(context, sectionId, async (section) => {
            const form = section.querySelector('#siteRequestForm');
            if (!form) {
                logError(context, `Form #siteRequestForm not found in section: ${sectionId}`);
                return;
            }
            log(context, 'Form #siteRequestForm found');
            form.dataset.siteRequestHandled = 'true'; // Mark as handled to avoid conflicts

            const data = await fetchData(context, API_ENDPOINTS.SITE_REQUEST);
            log(context, 'Fetched site request data:', data);
            const siteRequest = data?.siterequest || {};

            if (Object.keys(siteRequest).length > 0) {
                form.dataset.siteRequestId = 'exists';
                log(context, 'Set dataset.siteRequestId to "exists"');
            }

            // Populate static fields
            const fields = {
                name: siteRequest.communityName || '',
                about: siteRequest.aboutCommunity || '',
                colorPrefs: siteRequest.colorPrefs || '',
                stylingDetails: siteRequest.stylingDetails || '',
                preferredDomain: siteRequest.preferredDomain || '',
            };
            Object.entries(fields).forEach(([id, value]) => {
                const input = form.querySelector(`#${id}`);
                if (input) {
                    input.value = value;
                    log(context, `Populated ${id} with: ${value}`);
                }
            });

            // Populate emails
            const emailsContainer = form.querySelector('#emailsContainer');
            if (emailsContainer) {
                const emails = siteRequest.emails || [''];
                emailsContainer.innerHTML = emails.map((email, index) => `
                    <div class="email-entry">
                        <input type="email" name="email_${index}" value="${email}">
                        ${emails.length > 1 ? '<button type="button" class="remove-email">Remove</button>' : ''}
                    </div>
                `).join('');
                log(context, 'Populated emails:', emails);
            }

            // Populate pages
            const pagesContainer = form.querySelector('#pagesContainer');
            if (pagesContainer) {
                const pages = siteRequest.pages || [];
                pagesContainer.innerHTML = pages.length > 0 ? pages.map((page, index) => {
                    const isMandatory = page.mandatory || false;
                    return `
                        <div class="page-entry" data-mandatory="${isMandatory}">
                            <input type="text" name="page_${index}_title" value="${page.title || ''}" ${isMandatory ? 'readonly' : ''}>
                            <textarea name="page_${index}_content" id="page_${index}_content" class="mce-editor">${page.content || ''}</textarea>
                            <input type="file" name="page_${index}_images" multiple>
                            <input type="hidden" name="page_${index}_mandatory" value="${isMandatory}">
                            ${isMandatory ? '' : '<button type="button" class="remove-page">Remove</button>'}
                        </div>
                    `;
                }).join('') : `
                    <div class="page-entry" data-mandatory="false">
                        <input type="text" name="page_0_title" placeholder="Page Title">
                        <textarea name="page_0_content" id="page_0_content" class="mce-editor" placeholder="Page Content"></textarea>
                        <input type="file" name="page_0_images" multiple>
                        <input type="hidden" name="page_0_mandatory" value="false">
                        <button type="button" class="remove-page">Remove</button>
                    </div>
                `;
                log(context, 'Populated pages:', pages);

                // Initialize TinyMCE for pages' textareas
                const textareas = pagesContainer.querySelectorAll('.mce-editor');
                for (let i = 0; i < textareas.length; i++) {
                    const textarea = textareas[i];
                    if (!textarea.id) textarea.id = `page_${i}_content`; // Ensure unique ID
                    await initializeTinyMCE(context, `#${textarea.id}`);
                }
                log(context, `Initialized TinyMCE for ${textareas.length} textareas`);
            }

            // Initialize TinyMCE for static .mce-editor textareas (e.g., about, stylingDetails)
            const staticMceTextareas = form.querySelectorAll('.mce-editor:not(#pagesContainer .mce-editor)');
            for (let i = 0; i < staticMceTextareas.length; i++) {
                const textarea = staticMceTextareas[i];
                if (!textarea.id) {
                    textarea.id = `static_mce_${i}`; // Assign a unique ID if not present
                }
                await initializeTinyMCE(context, `#${textarea.id}`);
            }
            log(context, `Initialized TinyMCE for ${staticMceTextareas.length} static textareas`);

            toggleViewState(context, { [sectionId]: true });
        });
    }, ERROR_MESSAGES.ELEMENT_NOT_FOUND);
}

/**
 * Sets up event listeners for form interactions and submission.
 * @param {string} context - The context or module name.
 * @param {string} sectionId - The section ID.
 * @param {string} userId - The user ID.
 */
function setupSiteRequestEvents(context, sectionId, userId) {
    log(context, `Setting up events for section: ${sectionId}`);
    const form = document.getElementById('siteRequestForm');
    if (!form) {
        logError(context, 'Form #siteRequestForm not found for event setup');
        return;
    }

    // Event delegation for dynamic elements
    form.addEventListener('click', async event => {
        const target = event.target;
        if (target.classList.contains('remove-email')) {
            const emailEntry = target.closest('.email-entry');
            const emailsContainer = form.querySelector('#emailsContainer');
            if (emailsContainer.querySelectorAll('.email-entry').length > 1) {
                emailEntry.remove();
                log(context, 'Removed an email entry');
            }
        } else if (target.classList.contains('remove-page')) {
            const pageEntry = target.closest('.page-entry');
            const isMandatory = pageEntry.dataset.mandatory === 'true';
            if (!isMandatory) {
                pageEntry.remove();
                log(context, 'Removed a page entry');
            } else {
                log(context, 'Cannot remove mandatory page');
                // Optionally, alert the user: alert('Mandatory pages cannot be removed.');
            }
        } else if (target.dataset.action === 'addEmail') {
            const emailsContainer = form.querySelector('#emailsContainer');
            const index = emailsContainer.querySelectorAll('.email-entry').length;
            emailsContainer.insertAdjacentHTML('beforeend', `
                <div class="email-entry">
                    <input type="email" name="email_${index}" placeholder="Enter email">
                    <button type="button" class="remove-email">Remove</button>
                </div>
            `);
            log(context, `Added email entry ${index}`);
        } else if (target.dataset.action === 'addPage') {
            const pagesContainer = form.querySelector('#pagesContainer');
            const index = pagesContainer.querySelectorAll('.page-entry').length;
            const pageHtml = `
                <div class="page-entry" data-mandatory="false">
                    <input type="text" name="page_${index}_title" placeholder="Page Title">
                    <textarea name="page_${index}_content" id="page_${index}_content" class="mce-editor" placeholder="Page Content"></textarea>
                    <input type="file" name="page_${index}_images" multiple>
                    <input type="hidden" name="page_${index}_mandatory" value="false">
                    <button type="button" class="remove-page">Remove</button>
                </div>
            `;
            pagesContainer.insertAdjacentHTML('beforeend', pageHtml);
            await initializeTinyMCE(context, `#page_${index}_content`);
            log(context, `Added page entry ${index} with TinyMCE`);
        }
    });

    // Configure form submission with TinyMCE save
    submitConfiguredForm(context, 'siteRequestForm', API_ENDPOINTS.SITE_REQUEST, 'siteRequest', {
        method: form => form.dataset.siteRequestId === 'exists' ? 'PATCH' : 'POST',
        onSuccess: (response) => {
            log(context, 'Form submission successful:', response);
            form.dataset.siteRequestId = 'exists';
        },
        onError: (err) => {
            logError(context, 'Form submission failed:', err.message);
        },
        data: () => {
            if (window.tinymce) {
                window.tinymce.triggerSave();
                log(context, 'Triggered TinyMCE save before form data collection');
            }
            const formData = new FormData(form);
            log(context, 'Collected form data:', Array.from(formData.entries()));
            return formData;
        },
    });
    log(context, 'Form submission handler configured');
}

export function initializeSiteRequestModule(registry) {
    log(context, 'Initializing site-request module');
    return {
        initializeSiteRequest,
        loadSiteRequest,
    };
}

withScriptLogging(context, () => {
    log(context, 'Module initialized');
});