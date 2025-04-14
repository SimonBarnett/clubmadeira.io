import { getMenu } from '../config/menus.js';
import { log as loggerLog, warn as loggerWarn } from '../core/logger.js';
import { authenticatedFetch } from '/static/js/core/auth.js';
import { tokenManagerSetToken } from '/static/js/core/auth.js';

// Initialize sections with 'info' as the only default section
let sections = ['info'];

// Function to close all top-level submenus
function closeAllTopLevelSubmenus() {
    const allTopLevelItems = document.querySelectorAll('.menu-item');
    allTopLevelItems.forEach(item => {
        const submenu = item.querySelector('.submenu');
        if (submenu) {
            submenu.style.display = 'none';
            const caret = item.querySelector('.caret-icon');
            if (caret) {
                caret.className = 'fas fa-caret-right caret-icon';
            }
            loggerLog(`navigation.js - Closed submenu for top-level item: ${item.getAttribute('data-section')}`);
        }
    });
}

// Function to show the info section and collapse all menus
function showInfoAndCollapseMenus() {
    closeAllTopLevelSubmenus();
    showSection('info');
}

// Function to reset navigation state (clear menu and sections)
export function resetNavigation() {
    loggerLog('navigation.js - Resetting navigation state');
    const menuContainer = document.querySelector('.menu');
    if (menuContainer) {
        // Clear all event listeners by cloning and replacing the container
        const newMenuContainer = menuContainer.cloneNode(false);
        menuContainer.parentNode.replaceChild(newMenuContainer, menuContainer);
        newMenuContainer.style.display = 'none'; // Hide the menu container
        loggerLog('navigation.js - Menu container cleared, event listeners removed, and hidden');
    } else {
        loggerWarn('navigation.js - Menu container not found during reset');
    }
    sections = ['info', 'login']; // Reset sections to default, include 'login' for login page
    loggerLog('navigation.js - Sections reset to:', sections);
}

// Function to initialize password toggle functionality
function initializePasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            if (input && icon) {
                input.type = input.type === 'password' ? 'text' : 'password';
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
                loggerLog('navigation.js - Toggled visibility for input:', input.id);
            } else {
                loggerWarn('navigation.js - Input or icon not found for toggle-password');
            }
        });
    });
    loggerLog('navigation.js - Password toggle functionality initialized');
}

export function initialize(role) {
    loggerLog(`navigation.js - Setting up navigation for role ${role}`);
    const menuData = getMenu(role);
    if (!menuData || menuData.length === 0) {
        loggerLog(`navigation.js - No menu data for role: ${role}`);
        return;
    }

    loggerLog(`navigation.js - Menu data for ${role}:`, menuData);

    const menuContainer = document.querySelector('.menu');
    if (!menuContainer) {
        loggerWarn('navigation.js - Menu container not found. Ensure #menu.menu exists in the DOM.');
        return;
    }

    loggerLog('navigation.js - Menu container found:', menuContainer);

    menuContainer.style.display = 'block';
    menuContainer.innerHTML = '';

    // Function to close all other top-level submenus except the clicked item
    function closeOtherTopLevelSubmenus(exceptItem) {
        const allTopLevelItems = menuContainer.querySelectorAll('.menu-item');
        allTopLevelItems.forEach(item => {
            if (item !== exceptItem) {
                const submenu = item.querySelector('.submenu');
                if (submenu) {
                    submenu.style.display = 'none';
                    const caret = item.querySelector('.caret-icon');
                    if (caret) {
                        caret.className = 'fas fa-caret-right caret-icon';
                    }
                    loggerLog(`navigation.js - Closed submenu for top-level item: ${item.getAttribute('data-section')}`);
                }
            }
        });
    }

    // Function to set the x-role via API and reload the page
    async function setRoleAndReload(newRole) {
        loggerLog(`navigation.js - Setting x-role to ${newRole} via API and reloading page`);
        try {
            const response = await authenticatedFetch(`${window.apiUrl}/set-role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });

            if (!response.ok) {
                throw new Error(`Failed to set role: ${response.status}`);
            }

            const data = await response.json();
            loggerLog(`navigation.js - Successfully set x-role to ${newRole}, response:`, data);

            if (data.token) {
                tokenManagerSetToken(data.token);
                loggerLog(`navigation.js - Updated token with new x-role: ${newRole}`);
            } else {
                loggerWarn('navigation.js - No token returned in set-role response');
            }

            window.location.href = '/';
        } catch (error) {
            loggerWarn(`navigation.js - Error setting x-role to ${newRole}:`, error);
            window.location.href = '/';
        }
    }

    // Recursive function to render menu items and their submenus
    function renderMenuItems(items, parentContainer, level = 0) {
        loggerLog(`navigation.js - Rendering menu items at level ${level}, items:`, items);
        items.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.classList.add(level === 0 ? 'menu-item' : 'submenu-item');
            const section = item.section || 'unknown';
            menuItem.setAttribute('data-section', section);

            const button = document.createElement('button');
            button.className = level === 0 ? 'menu-button' : 'submenu-button';
            button.setAttribute('data-section', section);

            const caretIcon = item.submenu ? `<i class="fas fa-caret-right caret-icon" style="margin-left: 5px;"></i>` : '';
            const label = item.label || 'Unnamed Item';

            // Handle icons array and set size to 16x16 pixels
            let iconHtml = '';
            if (item.icons && Array.isArray(item.icons)) {
                item.icons.forEach(iconClass => {
                    iconHtml += `<i class="${iconClass}" style="width: 16px; height: 16px; display: inline-block; margin-right: 5px;"></i>`;
                });
            } else {
                iconHtml = `<i class="fas fa-question" style="width: 16px; height: 16px; display: inline-block; margin-right: 5px;"></i>`; // Fallback icon
            }

            button.innerHTML = iconHtml + ` ${label}${caretIcon}`;
            menuItem.appendChild(button);

            // Add section to sections array only if it's not 'info' and not already present
            if (section !== 'info' && section !== 'login' && !sections.includes(section)) {
                sections.push(section);
            }

            if (item.submenu) {
                const submenuContainer = document.createElement('div');
                submenuContainer.classList.add('submenu');
                submenuContainer.setAttribute('data-parent', section);
                submenuContainer.style.display = 'none';

                renderMenuItems(item.submenu, submenuContainer, level + 1);
                menuItem.appendChild(submenuContainer);

                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    loggerLog(`navigation.js - Clicked submenu button for ${section}`);
                    if (level === 0) {
                        closeOtherTopLevelSubmenus(menuItem);
                    }
                    const isExpanded = submenuContainer.style.display === 'block';
                    submenuContainer.style.display = isExpanded ? 'none' : 'block';
                    loggerLog(`navigation.js - Toggled submenu for ${section}: ${isExpanded ? 'collapsed' : 'expanded'}`);

                    const caret = button.querySelector('.caret-icon');
                    if (caret) {
                        caret.className = isExpanded ? 'fas fa-caret-right caret-icon' : 'fas fa-caret-down caret-icon';
                    }

                    // Always show the section when the menu item is clicked
                    showSection(section);
                    loggerLog(`navigation.js - Navigated to section: ${section}`);
                });
            } else if (item.action) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    loggerLog(`navigation.js - Clicked action button for ${section}`);
                    if (level === 0) {
                        closeOtherTopLevelSubmenus(menuItem);
                    }
                    if (typeof item.action === 'function') {
                        item.action().catch(error => {
                            loggerWarn(`navigation.js - Error executing action for ${section}:`, error);
                        });
                    } else {
                        loggerWarn(`navigation.js - Action for ${section} is not a function`);
                    }
                });
            } else {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    loggerLog(`navigation.js - Clicked navigation button for ${section}`);
                    if (level === 0) {
                        closeOtherTopLevelSubmenus(menuItem);
                    }
                    if (section === 'test_partner') {
                        setRoleAndReload('partner');
                    } else if (section === 'test_merchant') {
                        setRoleAndReload('merchant');
                    } else if (section === 'test_community') {
                        setRoleAndReload('community');
                    } else {
                        // Check if the item has a role property (for submenu items)
                        const role = item.role || null;
                        showSection(section, role);
                        loggerLog(`navigation.js - Navigated to section: ${section} with role: ${role}`);
                    }
                });
            }

            parentContainer.appendChild(menuItem);
        });
    }

    renderMenuItems(menuData, menuContainer);

    // Attach event listener to the button in roles.inc
    const rolesButton = document.querySelector('button[data-section="info"]');
    if (rolesButton) {
        rolesButton.addEventListener('click', (e) => {
            e.preventDefault();
            showInfoAndCollapseMenus();
        });
    }

    // Initialize password toggle functionality for all pages
    initializePasswordToggles();

    loggerLog('navigation.js - Menu items rendered:', sections);
    loggerLog('navigation.js - Navigation setup complete for role:', role);
}

export function showSection(section, role = null) {
    if (!sections.includes(section)) {
        loggerWarn(`navigation.js - Section not found: ${section}`);
        return;
    }

    const sectionElement = document.querySelector(`#${section}.section`);
    if (!sectionElement) {
        loggerWarn(`navigation.js - Section element #${section}.section not found in DOM`);
        return;
    }

    document.querySelectorAll('.section').forEach(s => {
        s.style.display = s.id === section ? 'block' : 'none';
    });

    loggerLog(`navigation.js - Showing section: ${section} with role: ${role}`);

    // Dispatch a custom event to notify other parts of the application
    document.dispatchEvent(new CustomEvent('sectionChange', { detail: { section, role } }));
}

export function showLogin() {
    loggerLog('navigation.js - Showing login section');
    showSection('login');
}