// File path: /static/js/modules/navigation.js
import { log, error as logError } from '../core/logger.js';
import { withErrorHandling } from '../utils/error.js';
import { toggleViewState } from '../utils/dom-manipulation.js';
import { getMenu } from '../config/menus.js';
import { withScriptLogging } from '../utils/logging-utils.js';

const context = 'navigation.js';

// Tracks the currently open menu tree
let activeMenuTree = [];

// **Overlay Functions**
/**
 * Shows the loading overlay by removing the 'hidden' class from the element with id 'loadingOverlay'.
 */
function showLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

/**
 * Hides the loading overlay by adding the 'hidden' class to the element with id 'loadingOverlay'.
 */
function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

/**
 * Normalizes a type value by converting it to lowercase and trimming spaces.
 * @param {string|null} type - The type value to normalize.
 * @returns {string|null} The normalized type value, or null if the input is null.
 */
function normalizeType(type) {
    return type ? type.toLowerCase().trim() : null;
}

/**
 * Recursively collects all section IDs from the menu configuration.
 * @param {Array} menu - The menu configuration.
 * @returns {Array} An array of all section IDs.
 */
function getAllSections(menu) {
    let sections = [];
    menu.forEach(item => {
        if (item.section) sections.push(item.section);
        if (item.submenu) {
            sections = sections.concat(getAllSections(item.submenu));
        }
    });
    return sections;
}

/**
 * Synchronizes the active state of menu buttons with the currently visible section.
 * @param {HTMLElement} menuElement - The menu element containing the buttons.
 */
function syncActiveState(menuElement) {
    log(context, 'START: Syncing active state with visible section');
    
    const allSections = document.querySelectorAll('.section');
    let activeSection = null;
    let activeType = null;

    let visibleCount = 0;
    allSections.forEach(section => {
        // Check if section is defined and has a style property
        if (section && section.style && section.style.display === 'block') {
            visibleCount++;
            if (!activeSection && section.id) { // Ensure section.id exists
                activeSection = section.id;
                activeType = section.dataset && section.dataset.type ? normalizeType(section.dataset.type) : null;
                log(context, `Detected active section: ${activeSection}${activeType ? `, type: ${activeType}` : ''}`);
            } else {
                section.style.display = 'none';
                log(context, `Hid extra visible section: ${section.id || 'unknown'}`);
            }
        }
    });

    if (visibleCount > 1) {
        log(context, `Multiple sections were visible; corrected to show only: ${activeSection || 'none'}`);
    }

    if (menuElement) {
        log(context, 'Before clearing active state, buttons with active class:', 
            Array.from(menuElement.querySelectorAll('.menu-button.active'))
                .map(btn => `${btn.textContent.trim()} (section: ${btn.dataset.section}${btn.dataset.type ? `, type: ${btn.dataset.type}` : ''})`)
        );

        menuElement.querySelectorAll('.menu-button').forEach(btn => {
            btn.classList.remove('active');
        });
        log(context, 'Cleared active class from all menu buttons');

        if (activeSection && activeSection !== 'info') {
            let selector = `.menu-button[data-section="${activeSection}"]`;
            if (activeType) {
                selector += `[data-type="${activeType}"]`;
            }
            log(context, `Looking for button with selector: ${selector}`);

            let activeButton = menuElement.querySelector(selector);
            if (!activeButton && activeType) {
                selector = `.menu-button[data-section="${activeSection}"]`;
                activeButton = menuElement.querySelector(selector);
                log(context, `No button matched with type; fell back to section-only selector: ${selector}`);
            }

            if (activeButton) {
                activeButton.classList.add('active');
                log(context, `Set active class on button: ${activeButton.textContent.trim()} (section: ${activeSection}${activeType ? `, type: ${activeType}` : ''})`);

                let parentButton = activeButton;
                while (parentButton && parentButton.dataset && parentButton.dataset.level !== '0') {
                    parentButton = parentButton.parentElement && parentButton.parentElement.previousElementSibling;
                    if (parentButton && parentButton.classList && parentButton.classList.contains('menu-button')) {
                        parentButton.classList.add('submenu-open');
                        const caret = parentButton.querySelector('.menu-submenu-caret');
                        if (caret) {
                            caret.classList.replace('fa-caret-right', 'fa-caret-down');
                        }
                        const submenu = parentButton.nextElementSibling;
                        if (submenu && submenu.classList && submenu.classList.contains('menu-submenu')) {
                            submenu.style.display = 'block';
                        }
                        log(context, `Highlighted parent button: ${parentButton.textContent.trim()} (section: ${parentButton.dataset.section})`);
                    }
                }
            } else {
                logError(context, `No menu button found for active section: ${activeSection}${activeType ? `, type: ${activeType}` : ''}, even after fallback`);
            }
        } else if (activeSection === 'info') {
            log(context, 'Info section is active; no menu button will be marked as active');
        }

        log(context, 'After sync, buttons with active class:', 
            Array.from(menuElement.querySelectorAll('.menu-button.active'))
                .map(btn => `${btn.textContent.trim()} (section: ${btn.dataset.section}${btn.dataset.type ? `, type: ${btn.dataset.type}` : ''})`)
        );
    }
    log(context, 'END: Syncing active state with visible section');
}

/**
 * Retries setting the data-type attribute on a section element until the element is found.
 * @param {string} sectionId - The ID of the section element.
 * @param {string|null} type - The type to set (or null to remove).
 * @param {number} maxAttempts - Maximum number of retry attempts.
 * @param {number} delayMs - Delay between attempts in milliseconds.
 * @returns {Promise<void>}
 */
async function setSectionDataType(sectionId, type, maxAttempts = 10, delayMs = 100) {
    let attempts = 0;
    const normalizedType = normalizeType(type);
    while (attempts < maxAttempts) {
        const sectionElement = document.getElementById(sectionId);
        if (sectionElement) {
            if (normalizedType) {
                sectionElement.dataset.type = normalizedType;
                log(context, `Set data-type="${normalizedType}" on section element: ${sectionId}`);
            } else {
                delete sectionElement.dataset.type;
                log(context, `Removed data-type from section element: ${sectionId}`);
            }
            return;
        }
        log(context, `Section element ${sectionId} not found; retrying (${attempts + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        attempts++;
    }
    logError(context, `Failed to set data-type on section element ${sectionId} after ${maxAttempts} attempts`);
}

/**
 * Resets the navigation state by hiding all sections, clearing active menu states, and re-rendering the menu.
 * @param {string} context - The context or module name for logging.
 * @returns {Promise<void>}
 */
export async function resetNavigation(context) {
    log(context, 'Resetting navigation state');
    await withErrorHandling(`${context}:resetNavigation`, async () => {
        const allSections = document.querySelectorAll('.section');
        allSections.forEach(section => {
            if (section && section.style) {
                section.style.display = 'none';
                log(context, `Hid section: ${section.id || 'unknown'}`);
            }
        });

        const menuElement = document.getElementById('menu');
        if (menuElement) {
            menuElement.querySelectorAll('button').forEach(button => {
                button.classList.remove('active');
                log(context, `Cleared active state for button: ${button.dataset.section || 'unknown'}`);
            });
        } else {
            logError(context, 'Menu element not found during reset');
        }

        if (menuElement) {
            const role = document.body.dataset && document.body.dataset.pageType || 'default';
            const defaultSection = 'info';
            const menu = getMenu(role);
            const sectionHandlers = defineSectionHandlers(context, role);
            menuElement.innerHTML = '';
            await initializeRoleNavigation(menuElement, menu, { sectionHandlers, defaultSection });
            log(context, 'Re-rendered menu to reset event listeners');
        }

        const layoutWrapper = document.querySelector('.layout-wrapper');
        if (layoutWrapper) {
            layoutWrapper.style.display = 'block';
            log(context, 'Ensured layout wrapper is visible');
        } else {
            logError(context, 'Layout wrapper not found during reset');
        }

        const infoElement = document.getElementById('info');
        if (infoElement) {
            allSections.forEach(section => {
                if (section && section.id !== 'info' && section.style) {
                    section.style.display = 'none';
                }
            });
            infoElement.style.display = 'block';
            toggleViewState(context, { info: true });
            log(context, 'Fallback: Ensured info section is visible after reset');
            if (menuElement) {
                menuElement.querySelectorAll('.menu-button').forEach(btn => btn.classList.remove('active'));
                log(context, 'Cleared active state from all menu buttons as Info section is shown');
            }
        } else {
            logError(context, 'Fallback failed: Info section not found during reset');
        }
    }, 'Failed to reset navigation state');
}

/**
 * Defines section handlers for a given role, ensuring all sections including common ones and DOM sections have handlers.
 * @param {string} context - The context or module name for logging.
 * @param {string} role - The role for which to define section handlers.
 * @param {Array} handlers - Optional array of custom handler configurations with id and handler properties.
 * @returns {Object} An object mapping section IDs to handler functions.
 */
export function defineSectionHandlers(context, role, handlers = []) {
    log(context, `Defining section handlers for role: ${role}`);
    const menu = getMenu(role);
    const allSections = getAllSections(menu);
    const commonSections = ['my-account', 'contact-details', 'change-password', 'settings'];
    const sectionHandlers = {};

    commonSections.forEach(section => {
        sectionHandlers[section] = async (show = true) => {
            log(context, `Navigating to common section ${section}, show: ${show}`);
            const allDomSections = document.querySelectorAll('.section');
            allDomSections.forEach(sec => {
                if (sec && sec.style) sec.style.display = 'none';
            });
            const state = {
                [section]: show,
                info: section === 'info' ? show : false,
            };
            toggleViewState(context, state);
            const menuElement = document.getElementById('menu');
            if (menuElement) {
                menuElement.querySelectorAll('.menu-button').forEach(btn => btn.classList.remove('active'));
                if (show) {
                    const button = menuElement.querySelector(`.menu-button[data-section="${section}"]`);
                    if (button) {
                        button.classList.add('active');
                        log(context, `Set active class on button for section: ${section}`);
                    } else {
                        logError(context, `No menu button found for section: ${section}`);
                    }
                }
                syncActiveState(menuElement);
            }
        };
    });

    allSections.forEach(section => {
        if (!commonSections.includes(section)) {
            const handlerConfig = handlers.find(h => h && h.id === section);
            if (handlerConfig && handlerConfig.handler) {
                sectionHandlers[section] = async (show = true, roleOverride, type) => {
                    log(context, `Navigating to section ${section}, show: ${show}, role: ${roleOverride || role}${type ? `, type: ${type}` : ''}`);
                    const allDomSections = document.querySelectorAll('.section');
                    allDomSections.forEach(sec => {
                        if (sec && sec.style) sec.style.display = 'none';
                    });
                    const state = {
                        [section]: show,
                        info: section === 'info' ? show : false,
                    };
                    const normalizedType = normalizeType(type);
                    await setSectionDataType(section, normalizedType);
                    toggleViewState(context, state);
                    await handlerConfig.handler(show, roleOverride || role, normalizedType);
                    const menuElement = document.getElementById('menu');
                    if (menuElement) {
                        syncActiveState(menuElement);
                    }
                };
            } else {
                sectionHandlers[section] = async (show = true, roleOverride, type) => {
                    log(context, `Navigating to section ${section} with generic handler, show: ${show}${type ? `, type: ${type}` : ''}`);
                    const allDomSections = document.querySelectorAll('.section');
                    allDomSections.forEach(sec => {
                        if (sec && sec.style) sec.style.display = 'none';
                    });
                    const state = {
                        [section]: show,
                        info: section === 'info' ? show : false,
                    };
                    const normalizedType = normalizeType(type);
                    await setSectionDataType(section, normalizedType);
                    toggleViewState(context, state);
                    const menuElement = document.getElementById('menu');
                    if (menuElement) {
                        syncActiveState(menuElement);
                    }
                };
            }
        }
    });

    const allDomSections = Array.from(document.querySelectorAll('.section'))
        .filter(el => el && el.id)
        .map(el => el.id);
    allDomSections.forEach(section => {
        if (!sectionHandlers[section]) {
            sectionHandlers[section] = async (show = true, roleOverride, type) => {
                log(context, `Navigating to section ${section} with default handler, show: ${show}${type ? `, type: ${type}` : ''}`);
                const allDomSections = document.querySelectorAll('.section');
                allDomSections.forEach(sec => {
                    if (sec && sec.style) sec.style.display = 'none';
                });
                const state = {
                    [section]: show,
                    info: section === 'info' ? show : false,
                };
                const normalizedType = normalizeType(type);
                await setSectionDataType(section, normalizedType);
                toggleViewState(context, state);
                const menuElement = document.getElementById('menu');
                if (menuElement) {
                    syncActiveState(menuElement);
                }
            };
        }
    });

    if (!sectionHandlers['info']) {
        sectionHandlers['info'] = async (show = true) => {
            log(context, 'Default info section handler triggered');
            const allDomSections = document.querySelectorAll('.section');
            allDomSections.forEach(sec => {
                if (sec && sec.id !== 'info' && sec.style) {
                    sec.style.display = 'none';
                }
            });
            toggleViewState(context, { info: show });
            const menuElement = document.getElementById('menu');
            if (menuElement && show) {
                menuElement.querySelectorAll('.menu-button').forEach(btn => btn.classList.remove('active'));
                log(context, 'Cleared active state from all menu buttons as Info section is shown');
                syncActiveState(menuElement);
            }
        };
    }

    log(context, `Section handlers defined for role ${role}:`, Object.keys(sectionHandlers));
    return sectionHandlers;
}

/**
 * Closes all submenus not in the active menu tree.
 * @param {Array} activeTree - The current active menu tree path.
 */
function closeIrrelevantSubmenus(activeTree) {
    document.querySelectorAll('.menu-submenu').forEach(submenu => {
        const menuSection = submenu.previousElementSibling && submenu.previousElementSibling.dataset && submenu.previousElementSibling.dataset.section;
        if (!activeTree.includes(menuSection)) {
            submenu.style.display = 'none';
        }
    });
    document.querySelectorAll('#menu button').forEach(btn => {
        const btnSection = btn.dataset && btn.dataset.section;
        if (!activeTree.includes(btnSection)) {
            btn.classList.remove('submenu-open');
            const caret = btn.querySelector('.menu-submenu-caret');
            if (caret) {
                caret.classList.replace('fa-caret-down', 'fa-caret-right');
            }
        }
    });
}

/**
 * Renders a menu item and its submenus recursively as buttons with carets.
 * @param {Object} item - The menu item configuration with section, label, icons, action, type, and optional submenu.
 * @param {number} level - The nesting level (0 for top-level items).
 * @param {Object} sectionHandlers - Section handler functions.
 * @param {Array} buttons - Array to collect button elements.
 * @param {Array} parentTree - The parent menu tree path.
 */
function renderMenuItem(item, level, sectionHandlers, buttons, parentTree = []) {
    log(context, `Rendering menu item: ${item.label}, level: ${level}, section: ${item.section || 'none'}${item.type ? `, type: ${item.type}` : ''}`);
    const button = document.createElement('button');
    button.className = 'menu-button';
    button.dataset.section = item.section || 'action';
    button.dataset.level = level.toString();
    if (item.role) button.dataset.role = item.role;
    if (item.action) button.dataset.action = 'true';
    if (item.type) {
        button.dataset.type = normalizeType(item.type);
        log(context, `Set button data-type="${button.dataset.type}" for item: ${item.label}`);
    }

    const iconsHTML = Array.isArray(item.icons)
        ? item.icons.map(icon => `<i class="${icon} menu-icon"></i>`).join('')
        : '';

    const caretHTML = Array.isArray(item.submenu) && item.submenu.length > 0
        ? `<i class="fas fa-caret-right menu-submenu-caret"></i>`
        : '';

    button.innerHTML = `${iconsHTML}${item.label}${caretHTML}`;

    button.addEventListener('click', async () => {
        showLoadingOverlay();
        try {
            log(context, `START: Button clicked: ${item.label}, section: ${item.section || 'none'}${item.role ? `, role: ${item.role}` : ''}${item.type ? `, type: ${item.type}` : ''}`);

            if (item.action) {
                log(context, `Executing action for ${item.label}`);
                item.action();
                return;
            }

            const currentTree = [...parentTree, item.section];
            if (level === 0) {
                closeIrrelevantSubmenus(currentTree);
                log(context, `Level 0: Closed irrelevant submenus; active tree: ${currentTree.join(' -> ')}`);
            }

            const handler = sectionHandlers[item.section];
            if (handler) {
                const typeToPass = item.type ? normalizeType(item.type) : null;
                log(context, `Calling handler for section: ${item.section}${typeToPass ? ` with type: ${typeToPass}` : ''}`);

                if (typeToPass) {
                    log(context, `Ensuring data-type="${typeToPass}" is set on section: ${item.section}`);
                    await setSectionDataType(item.section, typeToPass);
                }

                const event = new CustomEvent('sectionChange', {
                    detail: { section: item.section, role: item.role || null, type: typeToPass }
                });
                document.dispatchEvent(event);
                log(context, `Dispatched sectionChange event for section: ${item.section}${typeToPass ? `, type: ${typeToPass}` : ''}`);

                await handler(true, item.role || null, typeToPass);

                const menuElement = document.getElementById('menu');
                if (menuElement) {
                    log(context, 'Before clearing active state, buttons with active class:', 
                        Array.from(menuElement.querySelectorAll('.menu-button.active'))
                            .map(btn => `${btn.textContent.trim()} (section: ${btn.dataset.section}${btn.dataset.type ? `, type: ${btn.dataset.type}` : ''})`)
                    );

                    menuElement.querySelectorAll('.menu-button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    log(context, 'Cleared active class from all menu buttons');

                    button.classList.add('active');
                    log(context, `Set active class on ${item.label}${item.type ? ` with data-type="${typeToPass}"` : ''}`);

                    log(context, 'After setting active class, buttons with active class:', 
                        Array.from(menuElement.querySelectorAll('.menu-button.active'))
                            .map(btn => `${btn.textContent.trim()} (section: ${btn.dataset.section}${btn.dataset.type ? `, type: ${btn.dataset.type}` : ''})`)
                    );

                    log(context, 'Calling syncActiveState to ensure consistency');
                    syncActiveState(menuElement);

                    let parentButton = button;
                    while (parentButton && parentButton.dataset && parentButton.dataset.level !== '0') {
                        parentButton = parentButton.parentElement && parentButton.parentElement.previousElementSibling;
                        if (parentButton && parentButton.classList && parentButton.classList.contains('menu-button')) {
                            parentButton.classList.add('submenu-open');
                            const caret = parentButton.querySelector('.menu-submenu-caret');
                            if (caret) {
                                caret.classList.replace('fa-caret-right', 'fa-caret-down');
                            }
                            const submenu = parentButton.nextElementSibling;
                            if (submenu && submenu.classList && submenu.classList.contains('menu-submenu')) {
                                submenu.style.display = 'block';
                            }
                            log(context, `Highlighted parent button: ${parentButton.textContent.trim()} (section: ${parentButton.dataset.section})`);
                        }
                    }
                } else {
                    logError(context, 'Menu element not found when handling click');
                }
            } else {
                logError(context, `No handler found for section: ${item.section}`);
            }

            if (Array.isArray(item.submenu) && item.submenu.length > 0) {
                const submenuContainer = button.nextElementSibling;
                const isOpen = submenuContainer && submenuContainer.style && submenuContainer.style.display === 'block';
                if (isOpen) {
                    submenuContainer.style.display = 'none';
                    button.classList.remove('submenu-open');
                    const caret = button.querySelector('.menu-submenu-caret');
                    if (caret) {
                        caret.classList.replace('fa-caret-down', 'fa-caret-right');
                    }
                    activeMenuTree = activeMenuTree.filter(section => section !== item.section);
                    log(context, `Closed submenu for ${item.label}; updated activeMenuTree: ${activeMenuTree.join(' -> ')}`);
                } else if (submenuContainer) {
                    submenuContainer.style.display = 'block';
                    button.classList.add('submenu-open');
                    const caret = button.querySelector('.menu-submenu-caret');
                    if (caret) {
                        caret.classList.replace('fa-caret-right', 'fa-caret-down');
                    }
                    activeMenuTree = currentTree;
                    log(context, `Opened submenu for ${item.label}; updated activeMenuTree: ${activeMenuTree.join(' -> ')}`);
                }
            }

            log(context, `END: Button click handler for ${item.label}`);
        } catch (err) {
            logError(context, `Error during navigation: ${err.message}`);
        } finally {
            hideLoadingOverlay();
        }
    });

    buttons.push(button);

    if (Array.isArray(item.submenu) && item.submenu.length > 0) {
        const submenuContainer = document.createElement('div');
        submenuContainer.className = 'menu-submenu';
        submenuContainer.style.display = 'none';
        const submenuButtons = [];
        item.submenu.forEach(subItem => {
            renderMenuItem(subItem, level + 1, sectionHandlers, submenuButtons, [...parentTree, item.section]);
        });
        submenuButtons.forEach(btn => submenuContainer.appendChild(btn));
        buttons.push(submenuContainer);
    }
}

/**
 * Initializes navigation for a role by rendering the menu and setting up section handlers.
 * @param {HTMLElement} element - The DOM element to render the menu into.
 * @param {Array} menu - The menu configuration for the role.
 * @param {Object} options - Options for navigation setup.
 * @param {Object} options.sectionHandlers - Section handler functions.
 * @param {string} options.defaultSection - The default section to display.
 */
export async function initializeRoleNavigation(element, menu, { sectionHandlers, defaultSection }) {
    log(context, 'Initializing role navigation with menu:', menu.map(item => item.label));
    log(context, 'Received section handlers:', Object.keys(sectionHandlers));

    await withErrorHandling(`${context}:initializeRoleNavigation`, async () => {
        if (!element) {
            logError(context, 'Navigation element not provided');
            toggleViewState(context, { info: true });
            const infoElement = document.getElementById('info');
            if (infoElement) {
                infoElement.style.display = 'block';
                infoElement.classList.add('active');
                log(context, 'Fallback: Info section set to visible due to missing navigation element');
            }
            return;
        }

        if (!Array.isArray(menu)) {
            logError(context, 'Invalid menu configuration; expected an array');
            toggleViewState(context, { info: true });
            const infoElement = document.getElementById('info');
            if (infoElement) {
                infoElement.style.display = 'block';
                infoElement.classList.add('active');
                log(context, 'Fallback: Info section set to visible due to invalid menu');
            }
            return;
        }

        element.innerHTML = '';
        log(context, 'Cleared existing menu content');

        const buttons = [];
        menu.forEach(item => renderMenuItem(item, 0, sectionHandlers, buttons));
        buttons.forEach(button => element.appendChild(button));
        log(context, `Appended ${buttons.length} buttons to menu element`);

        syncActiveState(element);

        const allSections = document.querySelectorAll('.section');
        let activeSection = null;
        allSections.forEach(section => {
            if (section && section.style && section.style.display === 'block' && section.id) {
                activeSection = section.id;
            }
        });

        if (!activeSection && defaultSection && sectionHandlers[defaultSection]) {
            log(context, `Activating default section: ${defaultSection}`);
            await sectionHandlers[defaultSection](true);
            toggleViewState(context, { [defaultSection]: true, info: defaultSection === 'info' });
            if (defaultSection !== 'info') {
                const defaultButton = element.querySelector(`.menu-button[data-section="${defaultSection}"]`);
                if (defaultButton) {
                    element.querySelectorAll('.menu-button').forEach(btn => btn.classList.remove('active'));
                    defaultButton.classList.add('active');
                    log(context, `Set active class on default button: ${defaultSection}`);
                } else {
                    logError(context, `Default button for section ${defaultSection} not found in DOM`);
                }
            } else {
                log(context, 'Skipping menu button activation for info section');
                element.querySelectorAll('.menu-button').forEach(btn => btn.classList.remove('active'));
            }
        } else if (!activeSection) {
            logError(context, `No handler found for default section: ${defaultSection}`);
            if (sectionHandlers['info']) {
                await sectionHandlers['info'](true);
                toggleViewState(context, { info: true });
                log(context, 'Info section activated via fallback');
                element.querySelectorAll('.menu-button').forEach(btn => btn.classList.remove('active'));
            } else {
                const infoElement = document.getElementById('info');
                if (infoElement) {
                    const allDomSections = document.querySelectorAll('.section');
                    allDomSections.forEach(sec => {
                        if (sec && sec.id !== 'info' && sec.style) {
                            sec.style.display = 'none';
                        }
                    });
                    toggleViewState(context, { info: true });
                    infoElement.style.display = 'block';
                    infoElement.classList.add('active');
                    log(context, 'Ultimate fallback: Info section set to visible via direct DOM manipulation');
                    element.querySelectorAll('.menu-button').forEach(btn => btn.classList.remove('active'));
                } else {
                    logError(context, 'Ultimate fallback failed: Info section not found');
                }
            }
        }

        const observer = new MutationObserver(() => {
            syncActiveState(element);
        });
        document.querySelectorAll('.section').forEach(section => {
            if (section) {
                observer.observe(section, { attributes: true, attributeFilter: ['style', 'data-type'] });
            }
        });
        log(context, 'Added MutationObserver to re-sync active state on section visibility changes');
    }, 'Failed to initialize navigation');
}

/**
 * Initializes the navigation module for use with the module registry.
 * @param {Map} registry - The module registry instance.
 * @returns {Object} Module instance with public methods.
 */
export function initializeNavigationModule(registry) {
    log(context, 'Initializing navigation module for module registry');
    return {
        defineSectionHandlers: (ctx, role, handlers) => defineSectionHandlers(ctx, role, handlers),
        initializeRoleNavigation: (element, menu, options) => initializeRoleNavigation(element, menu, options),
        resetNavigation: ctx => resetNavigation(ctx),
    };
}

// Initialize the module with lifecycle logging
withScriptLogging(context, () => {
    log(context, 'Module initialized');
});