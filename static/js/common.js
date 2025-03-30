// common.js
// Purpose: Provides core shared utilities for all pages, including Toastr configuration and Markdown rendering.

// Guard against multiple inclusions
if (!window.commonInitialized) {
    window.commonInitialized = true;

    // Configures Toastr for consistent toast notifications across the application
    function setupToastr() {
        console.log('setupToastr - Initiating Toastr configuration');
        if (typeof toastr === 'undefined') {
            console.error('setupToastr - Toastr library not loaded');
            return;
        }

        // Override Toastr methods to log messages to the console
        (function() {
            const originalSuccess = toastr.success;
            const originalError = toastr.error;
            const originalInfo = toastr.info;
            const originalWarning = toastr.warning;

            toastr.success = function(message, title, options) {
                console.log(`Toastr Success: ${title ? title + ' - ' : ''}${message}`);
                return originalSuccess.call(toastr, message, title, options);
            };
            toastr.error = function(message, title, options) {
                console.log(`Toastr Error: ${title ? title + ' - ' : ''}${message}`);
                return originalError.call(toastr, message, title, options);
            };
            toastr.info = function(message, title, options) {
                console.log(`Toastr Info: ${title ? title + ' - ' : ''}${message}`);
                return originalInfo.call(toastr, message, title, options);
            };
            toastr.warning = function(message, title, options) {
                console.log(`Toastr Warning: ${title ? title + ' - ' : ''}${message}`);
                return originalWarning.call(toastr, message, title, options);
            };
        })();

        // Set Toastr options
        toastr.options = {
            closeButton: true,
            progressBar: true,
            positionClass: 'toast-top-right',
            timeOut: 5000,
            showMethod: 'slideDown',
            hideMethod: 'slideUp'
        };

        console.log('setupToastr - Toastr options configured:', JSON.stringify(toastr.options));
        console.log('setupToastr - Configuration completed');
    }

    // Function to wait for marked library to load
    function waitForMarked() {
        return new Promise((resolve, reject) => {
            const maxAttempts = 50;
            const delay = 100;
            let attempts = 0;

            function check() {
                if (typeof marked !== 'undefined') {
                    console.log('waitForMarked - marked library is now loaded');
                    resolve();
                } else if (attempts < maxAttempts) {
                    attempts++;
                    console.log(`waitForMarked - Attempt ${attempts}: marked not loaded yet, retrying in ${delay}ms`);
                    setTimeout(check, delay);
                } else {
                    console.error('waitForMarked - Max attempts reached, marked still not loaded');
                    reject(new Error('marked library not loaded after maximum attempts'));
                }
            }
            check();
        });
    }

    // Function to fetch and render Markdown content from local server
    async function renderMdPage(mdPath, targetElementId) {
        try {
            // Wait for marked to be loaded
            await waitForMarked();

            // Construct the URL to fetch the Markdown content from clubmadeira.io
            const renderUrl = `https://clubmadeira.io${mdPath}`;
            console.log(`renderMdPage - Fetching Markdown from: ${renderUrl}`);
            
            // Fetch the raw Markdown content
            const response = await fetch(renderUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch MD content: ${response.status}`);
            }
            const mdContent = await response.text();
            console.log(`renderMdPage - Markdown content fetched: ${mdContent.substring(0, 100)}...`);

            // Convert Markdown to HTML using marked.js
            let htmlContent;
            try {
                // Handle different versions of marked
                if (typeof marked.parse === 'function') {
                    htmlContent = marked.parse(mdContent);
                } else {
                    htmlContent = marked(mdContent); // Fallback for older versions
                }
            } catch (parseError) {
                throw new Error(`Failed to parse Markdown: ${parseError.message}`);
            }
            
            // Insert the HTML into the specified DOM element
            const targetElement = document.getElementById(targetElementId);
            if (targetElement) {
                targetElement.innerHTML = htmlContent;
                console.log('renderMdPage - Markdown rendered successfully');
            } else {
                console.error(`renderMdPage - Target element with ID "${targetElementId}" not found`);
            }
        } catch (error) {
            console.error('renderMdPage - Error rendering MD page:', error.message);
            // Display a fallback message if the target element exists
            const targetElement = document.getElementById(targetElementId);
            if (targetElement) {
                targetElement.innerHTML = '<p>Sorry, the content could not be loaded: ' + error.message + '</p>';
            }
        }
    }

    // Initialize Toastr when the DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        setupToastr();
    });

    // Expose functions globally for manual invocation
    window.setupToastr = setupToastr;
    window.renderMdPage = renderMdPage;  // Make renderMdPage globally accessible
}