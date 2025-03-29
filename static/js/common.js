// common.js
// Purpose: Provides core shared utilities for all pages, including Toastr configuration.

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

    // Initialize Toastr when the DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        setupToastr();
    });

    // Export for manual invocation if needed
    window.setupToastr = setupToastr;
}