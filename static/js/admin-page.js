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

    // Set up navigation and section management
    setupNavigation();
    setupSections();
    loadInitialData();

    // Add event listeners for buttons
    setupEventListeners();

    console.log('Admin page initialized');
}

// Set up navigation (menu buttons, submenus)
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
                    // Close other submenus
                    document.querySelectorAll('.submenu').forEach(sm => sm.style.display = 'none');
                    document.querySelectorAll('.caret').forEach(c => {
                        c.classList.remove('fa-caret-down');
                        c.classList.add('fa-caret-right');
                    });
                    submenu.style.display = 'block';
                    caret.classList.remove('fa-caret-right');
                    caret.classList.add('fa-caret-down');
                }
            }

            // Show the selected section
            if (sectionId) {
                showSection(sectionId);
            }
        });
    });

    // Handle submenu button clicks
    document.querySelectorAll('.submenu button[data-section]').forEach(button => {
        button.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            if (sectionId) {
                showSection(sectionId);
            }
        });
    });

    // Handle buttons with href (e.g., "Back to Admin")
    document.querySelectorAll('.menu button[data-href]').forEach(button => {
        button.addEventListener('click', function() {
            const href = this.getAttribute('data-href');
            window.location.href = href;
        });
    });

    // Handle "Log Off" button
    document.getElementById('logOffBtn').addEventListener('click', function() {
        localStorage.removeItem('jwtToken');
        window.location.href = '/logout';
    });
}

// Show the specified section, hide others
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
}

// Load initial data for sections (e.g., deal listings, user management)
function loadInitialData() {
    // Load deal listings
    authenticatedFetch(`${window.apiUrl}/api/deals`)
        .then(response => response.json())
        .then(data => {
            const dealList = document.getElementById('dealList');
            dealList.innerHTML = '';
            data.forEach(deal => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${deal.category}</td>
                    <td>${deal.title}</td>
                    <td><a href="${deal.url}" target="_blank">Link</a></td>
                    <td>${deal.price}</td>
                    <td>${deal.original}</td>
                    <td>${deal.discount}</td>
                    <td><img src="${deal.image}" alt="${deal.title}" style="max-width: 50px;"></td>
                    <td>${deal.quantity}</td>
                `;
                dealList.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading deals:', error);
            toastr.error('Failed to load deal listings.');
        });

    // Load user management data (partners, communities, merchants)
    ['partners', 'communities', 'merchants'].forEach(type => {
        authenticatedFetch(`${window.apiUrl}/api/users?type=${type}`)
            .then(response => response.json())
            .then(data => {
                const userList = document.getElementById(`${type}List`);
                userList.innerHTML = '';
                data.forEach(user => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${user.userId}</td>
                        <td>${user.contactName}</td>
                        <td>${user.email}</td>
                        <td>${user.phoneNumber || 'N/A'}</td>
                        <td><button data-user-id="${user.userId}" data-action="editUser">Edit</button></td>
                    `;
                    userList.appendChild(row);
                });
            })
            .catch(error => {
                console.error(`Error loading ${type}:`, error);
                toastr.error(`Failed to load ${type} list.`);
            });
    });
}

// Set up event listeners for buttons (e.g., save settings, update credentials)
function setupEventListeners() {
    // Save settings (contact details)
    document.querySelector('button[data-action="saveSettings"]').addEventListener('click', function() {
        const userId = document.getElementById('userId').value;
        const contactName = document.getElementById('contactName').value;
        const websiteUrl = document.getElementById('websiteUrl').value;
        const emailAddress = document.getElementById('emailAddress').value;

        authenticatedFetch(`${window.apiUrl}/api/user/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({ contactName, websiteUrl, emailAddress })
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    toastr.success('Settings updated successfully.');
                } else {
                    toastr.error('Failed to update settings.');
                }
            })
            .catch(error => {
                console.error('Error saving settings:', error);
                toastr.error('Error saving settings.');
            });
    });

    // Change password
    document.querySelector('button[data-action="savePassword"]').addEventListener('click', function() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            toastr.error('New passwords do not match.');
            return;
        }

        authenticatedFetch(`${window.apiUrl}/api/change-password`, {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    toastr.success('Password changed successfully.');
                } else {
                    toastr.error('Failed to change password.');
                }
            })
            .catch(error => {
                console.error('Error changing password:', error);
                toastr.error('Error changing password.');
            });
    });

    // Update affiliate credentials
    document.querySelectorAll('button[data-affiliate]').forEach(button => {
        button.addEventListener('click', function() {
            const affiliate = this.getAttribute('data-affiliate');
            const inputs = document.querySelectorAll(`#${affiliate} input`);
            const credentials = {};
            inputs.forEach(input => {
                credentials[input.id] = input.value;
            });

            authenticatedFetch(`${window.apiUrl}/api/affiliate/${affiliate}`, {
                method: 'PUT',
                body: JSON.stringify(credentials)
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        toastr.success(`${affiliate} credentials updated successfully.`);
                    } else {
                        toastr.error(`Failed to update ${affiliate} credentials.`);
                    }
                })
                .catch(error => {
                    console.error(`Error updating ${affiliate} credentials:`, error);
                    toastr.error(`Error updating ${affiliate} credentials.`);
                });
        });
    });
}