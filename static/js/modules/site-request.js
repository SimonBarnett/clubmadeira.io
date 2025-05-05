// /static/js/modules/site-request.js
// Purpose: Manages site request form submission, loading, and UI updates for merchant and community roles.

import { log } from '../core/logger.js';
import { fetchData } from '../utils/data-fetch.js';
import { submitConfiguredForm } from '../utils/form-submission.js';
import { setupEventListeners } from '../utils/event-listeners.js';
import { withAuthenticatedUser } from '../core/auth.js';
import { withElement, toggleViewState } from '../utils/dom-manipulation.js';
import { initializeTinyMCE } from '../core/mce.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';

/**
 * Initializes the site request form, including loading data and setting up event listeners.
 * @param {string} context - The context or module name.
 * @param {string} sectionId - The ID of the section to initialize (e.g., 'store-request', 'site-request').
 * @returns {Promise<void>}
 */
export async function initializeSiteRequest(context, sectionId = 'store-request') {
  log(context, `Initializing site request for section: ${sectionId}`);
  await withAuthenticatedUser(async userId => {
    await withErrorHandling(`${context}:initializeSiteRequest`, async () => {
      await loadSiteRequest(context, sectionId, userId);
      setupSiteRequestEvents(context, sectionId, userId);
    }, ERROR_MESSAGES.MODULE_INIT_FAILED);
  });
}

/**
 * Loads and populates the site request form with data from the server.
 * @param {string} context - The context or module name.
 * @param {string} sectionId - The ID of the section to populate (e.g., 'store-request', 'site-request').
 * @param {string} userId - The user ID.
 * @returns {Promise<void>}
 */
async function loadSiteRequest(context, sectionId, userId) {
  log(context, `Loading site request data for section: ${sectionId}`);
  await withErrorHandling(`${context}:loadSiteRequest`, async () => {
    await withElement(context, sectionId, async (section) => {
      // Fetch site request data
      const data = await fetchData(context, `${API_ENDPOINTS.SITE_REQUEST}/${userId}`);
      if (!data) {
        log(context, 'No site request data available');
        return;
      }

      // Determine role-specific field IDs (merchant or community)
      const fieldIds = {
        storeName: sectionId === 'store-request' ? 'name' : 'name', // Updated to match HTML
        aboutStore: sectionId === 'store-request' ? 'about' : 'about', // Updated to match HTML
        colorPreference: sectionId === 'store-request' ? 'colorPrefs' : 'colorPrefs', // Updated to match HTML
        stylingDetails: sectionId === 'store-request' ? 'stylingDetails' : 'stylingDetails', // Updated to match HTML
        domain: sectionId === 'store-request' ? 'preferredDomain' : 'preferredDomain', // Updated to match HTML
        emailsContainer: sectionId === 'store-request' ? 'emailsContainer' : 'emailsContainer', // Matches HTML
        pagesContainer: sectionId === 'store-request' ? 'pagesContainer' : 'pagesContainer', // Matches HTML
      };

      // Populate form fields
      document.getElementById(fieldIds.storeName)?.setAttribute('value', data.storeName || '');
      document.getElementById(fieldIds.aboutStore)?.setAttribute('value', data.about || '');
      document.getElementById(fieldIds.colorPreference)?.setAttribute('value', data.colorPreference || '');
      document.getElementById(fieldIds.stylingDetails)?.setAttribute('value', data.stylingDetails || '');
      document.getElementById(fieldIds.domain)?.setAttribute('value', data.domain || '');

      // Populate emails
      const emailsContainer = document.getElementById(fieldIds.emailsContainer);
      if (emailsContainer && data.emails) {
        emailsContainer.innerHTML = data.emails.map((email, index) => `
          <div class="email-entry">
            <input type="email" name="email_${index}" value="${email}">
            <button type="button" class="remove-email" data-index="${index}">Remove</button>
          </div>
        `).join('');
      }

      // Populate pages
      const pagesContainer = document.getElementById(fieldIds.pagesContainer);
      if (pagesContainer && data.pages) {
        pagesContainer.innerHTML = data.pages.map((page, index) => `
          <div class="page-entry">
            <input type="text" name="page_${index}_title" value="${page.title}">
            <textarea name="page_${index}_content" class="mce-editor">${page.content}</textarea>
            <button type="button" class="remove-page" data-index="${index}">Remove</button>
          </div>
        `).join('');
      }

      // Initialize TinyMCE for all elements with class 'mce-editor'
      await initializeTinyMCE(context, '.mce-editor');

      // Update domain preview if function exists
      if (typeof window.updateDomainPreview === 'function') {
        window.updateDomainPreview(data.domain);
      }

      // Show the section
      toggleViewState(context, { [sectionId]: true });
    });
  }, ERROR_MESSAGES.ELEMENT_NOT_FOUND);
}

/**
 * Sets up event listeners for site request form submission and UI interactions.
 * @param {string} context - The context or module name.
 * @param {string} sectionId - The ID of the section (e.g., 'store-request', 'site-request').
 * @param {string} userId - The user ID.
 */
function setupSiteRequestEvents(context, sectionId, userId) {
  log(context, `Setting up site request event listeners for section: ${sectionId}`);
  setupEventListeners(context, [
    {
      eventType: 'submit',
      selector: '#siteRequestForm',
      handler: async event => {
        event.preventDefault();
        await submitConfiguredForm(context, 'siteRequestForm', API_ENDPOINTS.SITE_REQUEST(userId), 'siteRequest', {
          onSuccess: data => {
            log(context, 'Site request submitted successfully:', data);
          },
        });
      },
    },
    {
      eventType: 'click',
      selector: '.remove-email',
      handler: event => {
        const index = event.target.dataset.index;
        const emailEntry = document.querySelector(`.email-entry:nth-child(${parseInt(index) + 1})`);
        if (emailEntry) emailEntry.remove();
        log(context, `Removed email entry at index: ${index}`);
      },
    },
    {
      eventType: 'click',
      selector: '.remove-page',
      handler: event => {
        const index = event.target.dataset.index;
        const pageEntry = document.querySelector(`.page-entry:nth-child(${parseInt(index) + 1})`);
        if (pageEntry) pageEntry.remove(); // Fixed typo from 'emailEntry' to 'pageEntry'
        log(context, `Removed page entry at index: ${index}`);
      },
    },
  ]);
}

/**
 * Initializes the site-request module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} SiteRequest instance with public methods.
 */
export function initializeSiteRequestModule(registry) {
  const context = 'site-request.js';
  log(context, 'Initializing site-request module for module registry');
  return {
    initializeSiteRequest: (ctx, ...args) => initializeSiteRequest(ctx, ...args),
    loadSiteRequest: (ctx, ...args) => loadSiteRequest(ctx, ...args),
  };
}

// Initialize module with lifecycle logging
const context = 'site-request.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});