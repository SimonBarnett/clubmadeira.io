// common.js
// Purpose: Provides core shared utilities for all pages, specifically Toastr configuration.

// Configures Toastr for consistent toast notifications across the application.
function setupToastr() {
    console.log('setupToastr - Initiating Toastr configuration');
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