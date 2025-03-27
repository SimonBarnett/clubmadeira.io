function showSection(sectionId, onSectionLoad = null) {
    console.log('showSection - Starting section display - Section ID:', sectionId);
    console.log('showSection - Callback provided:', typeof onSectionLoad === 'function' ? 'Yes' : 'No');
    const allSections = document.querySelectorAll('.section');
    console.log('showSection - Found sections to hide:', allSections.length);
    allSections.forEach(s => {
        console.log('showSection - Hiding section - ID:', s.id);
        s.classList.remove('active');
        s.style.display = 'none';
    });

    const section = document.getElementById(sectionId);
    if (section) {
        console.log('showSection - Showing section - ID:', sectionId);
        section.style.display = 'block';
        section.classList.add('active');
        if (typeof onSectionLoad === 'function') {
            onSectionLoad();
        }
    } else {
        console.error('showSection - Section not found - ID:', sectionId);
    }
}

function toggleSubmenu(submenuId) {
    console.log(`toggleSubmenu - Starting toggle - Submenu ID: ${submenuId}`);
    const submenu = document.getElementById(submenuId);
    const button = document.querySelector(`button[data-submenu="${submenuId}"]`);
    const caret = button ? button.querySelector('.caret') : null;

    if (submenu && button && caret) {
        const isOpen = submenu.style.display === 'block';
        submenu.style.display = isOpen ? 'none' : 'block';
        submenu.classList.toggle('open', !isOpen);
        caret.classList.toggle('fa-caret-down', !isOpen);
        caret.classList.toggle('fa-caret-right', isOpen);
        button.setAttribute('aria-expanded', !isOpen);
        console.log(`toggleSubmenu - Submenu ${submenuId} set to ${isOpen ? 'closed' : 'open'}`);
    } else {
        console.error(`toggleSubmenu - Submenu or button not found - Submenu ID: ${submenuId}`);
    }
}

function handleSectionClick(event) {
    console.log('handleSectionClick - Section click event triggered');
    const target = event.target.closest('button[data-section], button[data-submenu]');
    console.log('handleSectionClick - Event target:', target);
    if (!target) return;

    event.stopPropagation(); // Stop bubbling to parent elements

    const sectionId = target.getAttribute('data-section');
    const submenuId = target.getAttribute('data-submenu');
    console.log(`handleSectionClick - Extracted attributes - Section: ${sectionId}, Submenu: ${submenuId}`);

    if (submenuId === 'my-account-submenu') {
        console.log('handleSectionClick - Handling "My Account" click');
        showSection('my-account'); // Show the explanatory page immediately
        toggleSubmenu(submenuId); // Expand the submenu
        // Do not highlight submenu items by default
    } else if (submenuId) {
        toggleSubmenu(submenuId);
        if (sectionId) {
            showSection(sectionId);
        }
    } else if (sectionId) {
        showSection(sectionId);
    }
}

function initializeNavigation() {
    console.log('initializeNavigation - Starting navigation setup');

    // Initialize submenu states (all closed by default)
    document.querySelectorAll('.submenu').forEach(submenu => {
        submenu.style.display = 'none';
        submenu.classList.remove('open');
        const submenuId = submenu.id;
        const button = document.querySelector(`button[data-submenu="${submenuId}"]`);
        if (button) {
            button.setAttribute('aria-expanded', 'false');
            const caret = button.querySelector('.caret');
            if (caret) {
                caret.classList.remove('fa-caret-down');
                caret.classList.add('fa-caret-right');
            }
        }
    });

    // Attach event listeners to all buttons with data-section or data-submenu
    document.querySelectorAll('.menu button[data-section], .menu button[data-submenu]').forEach(button => {
        button.addEventListener('click', handleSectionClick);
        console.log('initializeNavigation - Added click listener to button:', button.dataset.section || button.dataset.submenu);
    });
}

// Export for use in other scripts
window.showSection = showSection;
window.toggleSubmenu = toggleSubmenu;
window.initializeNavigation = initializeNavigation;