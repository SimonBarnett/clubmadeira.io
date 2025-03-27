// common.js
// Purpose: Provides core shared utilities for all pages, specifically Toastr configuration.

// Configures Toastr for consistent toast notifications across the application.
function setupToastr() {
    console.log('setupToastr - Initiating Toastr configuration');
    if (typeof toastr === 'undefined') {
        console.error('setupToastr - Toastr library not loaded');
        return;
    }
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

// Export for use in other scripts
window.setupToastr = setupToastr;