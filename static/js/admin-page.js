// admin-page.js

// Define window.initialize
window.initialize = function(pageType) {
    console.log('window.initialize - Initializing page - Page Type: ' + pageType);
    if (pageType === 'admin') {
        initializeAdmin(pageType);
    } else {
        console.error('Unknown page type: ' + pageType);
    }
}

// Define initializeAdmin
function initializeAdmin(pageType) {
    console.log('initializeAdmin - Initializing admin page with type: ' + pageType);
    loadBranding(pageType, 'brandingContent');
    // Other initialization code for admin page
    console.log('Admin page initialized');
}

// Other functions or code for admin page can be added here