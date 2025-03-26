// /static/js/admin-page.js
function initializeAdmin(pageType) {
    console.log('initializeAdmin - Initializing admin page with type: ' + pageType);
    loadBranding(pageType, 'brandingContent'); // Load header from /branding
    setupNavigation(); // Set up menu and submenu toggling
    showSection('welcome'); // Use existing showSection to display default section
    loadInitialData(); // Fetch initial data like deals
    setupEventListeners(); // Attach button listeners
    console.log('Admin page initialized');
}

function setupNavigation() {
    // Handle main menu button clicks
    document.querySelectorAll('.menu button[data-section]').forEach(button => {
        button.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            const submenuId = this.getAttribute('data-submenu');

            // If there's a submenu, toggle it
            if (submenuId) {
                const submenu = document.getElementById(submenuId);
                const caret = this.querySelector('.caret');
                if (submenu.style.display === 'block') {
                    submenu.style.display = 'none';
                    caret.classList.remove('fa-caret-down');
                    caret.classList.add('fa-caret-right');
                } else {
                    submenu.style.display = 'block';
                    caret.classList.remove('fa-caret-right');
                    caret.classList.add('fa-caret-down');
                }
            }
            if (sectionId) showSection(sectionId); // Show the selected section
        });
    });
}

function loadInitialData() {
    // Load deal listings
    authenticatedFetch(`${window.apiUrl}/discounted-products?category_id=all`)
        .then(data => {
            const tbody = document.getElementById('dealList');
            if (!tbody) return;
            tbody.innerHTML = '';
            data.products.forEach(product => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${product.category || 'N/A'}</td>
                    <td>${product.title || 'N/A'}</td>
                    <td><a href="${product.url || '#'}">Link</a></td>
                    <td>${product.price || 'N/A'}</td>
                    <td>${product.original || 'N/A'}</td>
                    <td>${product.discount || 'N/A'}</td>
                    <td><img src="${product.image || ''}" alt="Product Image" style="max-width: 50px;"></td>
                    <td>${product.quantity || 'N/A'}</td>
                `;
                tbody.appendChild(row);
            });
            console.log('Deals loaded:', data);
        })
        .catch(err => console.error('Failed to load deals:', err));
}

function setupEventListeners() {
    // Save settings (contact details)
    document.querySelector('button[data-action="saveSettings"]').addEventListener('click', function() {
        const userId = document.getElementById('userId').value;
        const contactName = document.getElementById('contactName').value;
        const websiteUrl = document.getElementById('websiteUrl').value;
        const emailAddress = document.getElementById('emailAddress').value;

        authenticatedFetch(`${window.apiUrl}/users/${userId}/user`, {
            method: 'PATCH',
            body: JSON.stringify({
                contact_name: contactName,
                website_url: websiteUrl,
                email_address: emailAddress
            })
        })
        .then(() => toastr.success('Settings saved'))
        .catch(err => toastr.error('Failed to save settings: ' + err.message));
    });

    // Add more listeners as needed (e.g., affiliate credential updates)
}

// Define window.initialize for page-load.js to call
window.initialize = function(pageType) {
    console.log('window.initialize - Initializing page - Page Type: ' + pageType);
    initializeAdmin(pageType);
};