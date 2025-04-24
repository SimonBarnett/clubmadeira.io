// /static/js/community/providers-data.js
// Purpose: Manages data fetching for provider settings on the community providers page.

import { log } from '../core/logger.js';
import { fetchData } from '../utils/data-fetch.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../config/constants.js';
import { withScriptLogging } from '../utils/logging-utils.js';

/**
 * Loads client API settings from the server, with a fallback to hardcoded defaults.
 * @param {string} context - The context or module name.
 * @returns {Promise<Array>} The fetched or default provider settings.
 */
export async function loadClientApiSettings(context) {
  log(context, 'Loading client API settings');
  return await withErrorHandling(`${context}:loadClientApiSettings`, async () => {
    const data = await fetchData(context, API_ENDPOINTS.CLIENT_API_SETTINGS);
    return data.settings || [];
  }, ERROR_MESSAGES.FETCH_FAILED('client API settings'), () => [
    // Hardcoded fallback settings
    {
      "comment": "Wix CMS client API settings",
      "description": "Wix is a versatile website builder, offering clubmadeira.io API tools to integrate custom features into its CMS platform.",
      "doc_link": [
        { "link": "https://dev.wix.com/api/rest/wix-stores", "title": "api" },
        { "link": "https://www.wix.com/signup", "title": "signup" },
        { "link": "https://clubmadeira.io/static/md/wix_readme.md", "title": "readme" }
      ],
      "fields": { "API_TOKEN": "", "SITE_ID": "" },
      "icon": "icon-wix",
      "key_type": "wix"
    },
    {
      "comment": "WordPress CMS client API settings",
      "description": "WordPress, a popular open-source CMS, powers clubmadeira.io with extensible plugins and APIs for dynamic content management.",
      "doc_link": [
        { "link": "https://developer.wordpress.com/docs/api/", "title": "api" },
        { "link": "https://wordpress.com/start", "title": "signup" },
        { "link": "https://clubmadeira.io/static/md/wordpress_readme.md", "title": "readme" }
      ],
      "fields": { "API_KEY": "" },
      "icon": "icon-wordpress",
      "key_type": "wordpress"
    },
    {
      "comment": "Squarespace CMS client API settings",
      "description": "Squarespace provides an elegant CMS platform, integrating with clubmadeira.io via APIs for custom site enhancements.",
      "doc_link": [
        { "link": "https://developers.squarespace.com/", "title": "api" },
        { "link": "https://www.squarespace.com/signup", "title": "signup" },
        { "link": "https://clubmadeira.io/static/md/squarespace_readme.md", "title": "readme" }
      ],
      "fields": { "API_KEY": "" },
      "icon": "icon-squarespace",
      "key_type": "squarespace"
    },
    {
      "comment": "Weebly CMS client API settings",
      "description": "Weebly offers a user-friendly CMS, enabling clubmadeira.io to add custom features through its developer API.",
      "doc_link": [
        { "link": "https://www.weebly.com/developer", "title": "api" },
        { "link": "https://www.weebly.com/signup", "title": "signup" },
        { "link": "https://clubmadeira.io/static/md/weebly_readme.md", "title": "readme" }
      ],
      "fields": { "API_KEY": "" },
      "icon": "icon-weebly",
      "key_type": "weebly"
    },
    {
      "comment": "Joomla CMS client API settings",
      "description": "Joomla, an open-source CMS, supports clubmadeira.io with robust API capabilities for custom module development.",
      "doc_link": [
        { "link": "https://docs.joomla.org/Joomla_API", "title": "api" },
        { "link": "https://www.joomla.org/download.html", "title": "signup" },
        { "link": "https://clubmadeira.io/static/md/joomla_readme.md", "title": "readme" }
      ],
      "fields": { "API_KEY": "" },
      "icon": "icon-joomla",
      "key_type": "joomla"
    }
  ]);
}

/**
 * Initializes the providers-data module for use with the module registry.
 * @param {Object} registry - The module registry instance.
 * @returns {Object} ProvidersData instance with public methods.
 */
export function initializeProvidersDataModule(registry) {
  const context = 'providers-data.js';
  log(context, 'Initializing providers-data module for module registry');
  return {
    loadClientApiSettings: ctx => loadClientApiSettings(ctx),
  };
}

// Initialize module with lifecycle logging
const context = 'providers-data.js';
withScriptLogging(context, () => {
  log(context, 'Module initialized');
});