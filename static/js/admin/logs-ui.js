// /static/js/admin/logs-ui.js
import { authenticatedFetch } from '../core/auth.js'; // Import for authenticated requests

// Define available log periods with their icons and labels
const periods = [
    { name: 'today', icon: 'fa-calendar-day', label: 'Today' },
    { name: 'yesterday', icon: 'fa-calendar-day', label: 'Yesterday' },
    { name: 'this_week', icon: 'fa-calendar-week', label: 'This Week' },
    { name: 'last_week', icon: 'fa-calendar-week', label: 'Last Week' },
    { name: 'this_month', icon: 'fa-calendar', label: 'This Month' },
    { name: 'last_month', icon: 'fa-calendar', label: 'Last Month' }
];

// Define icons for each log type using FontAwesome classes
const logTypeIcons = {
    'login': 'fa-sign-in-alt',
    'signup': 'fa-user-plus',
    'click': 'fa-mouse-pointer',
    'order': 'fa-shopping-cart',
    // Add more log types and their corresponding icons as needed
};

/**
 * Renders period icons in the log_period_icon container and sets up click handlers.
 * Initializes with 'today' as the default selected period.
 */
export function renderPeriodIcons() {
    console.log('Rendering period icons'); // Debugging log
    const container = document.getElementById('log_period_icon');
    if (!container) {
        console.error('Error: log_period_icon container not found.');
        return;
    }
    container.innerHTML = ''; // Clear existing content
    periods.forEach((period, index) => {
        const icon = document.createElement('i');
        icon.className = `fa-solid ${period.icon} period-icon`;
        icon.dataset.period = period.name;
        if (index === 0) icon.classList.add('selected'); // Default to 'today'
        icon.addEventListener('click', () => selectPeriod(period.name));
        container.appendChild(icon);
    });
    selectPeriod('today'); // Load logs for 'today' initially
}

/**
 * Selects a period, updates the UI, and triggers log loading for that period.
 * Updates the logs-description element with the log type icon and period label.
 * @param {string} periodName - The name of the period to select (e.g., 'today').
 */
export function selectPeriod(periodName) {
    const icons = document.querySelectorAll('.period-icon');
    icons.forEach(icon => icon.classList.remove('selected'));
    const selectedIcon = document.querySelector(`.period-icon[data-period="${periodName}"]`);
    if (selectedIcon) {
        selectedIcon.classList.add('selected');
    }
    const period = periods.find(p => p.name === periodName);
    if (period) {
        const logsSection = document.getElementById('logs');
        const type = logsSection ? logsSection.dataset.type : null;
        updateDescription(type, period.label); // Update description with icon and text
        loadLogs(period.name);
    }
}

/**
 * Updates the logs-description element with the log type icon and text.
 * @param {string} type - The log type (e.g., 'login', 'signup').
 * @param {string} periodLabel - The label of the selected period (e.g., 'Today').
 */
function updateDescription(type, periodLabel) {
    const descriptionElement = document.getElementById('logs-description');
    if (descriptionElement) {
        const typeLabel = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Unknown';
        const iconClass = logTypeIcons[type] || 'fa-question'; // Default to question mark if type unknown
        descriptionElement.innerHTML = `<i class="fa-solid ${iconClass}"></i> ${typeLabel} logs for ${periodLabel}`;
    } else {
        console.warn('Warning: logs-description element not found.');
    }
}

/**
 * Fetches logs for a given period and type, then renders them.
 * @param {string} period - The period for which to fetch logs (e.g., 'today').
 */
export async function loadLogs(period) {
    const logsSection = document.getElementById('logs');
    const type = logsSection.dataset.type;
    if (!type) {
        console.error('Error: No type set for logs section.');
        return;
    }
    try {
        const response = await authenticatedFetch(`/logs/${type}?period=${period}`, {
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if (data.status === 'success') {
            renderLogsTable(data.data);
        } else {
            throw new Error(data.message || 'Failed to fetch logs.');
        }
    } catch (error) {
        console.error('Error loading logs:', error);
        document.getElementById('logs-table-container').innerHTML = `
            <p>Error: ${error.message}</p>
            <button onclick="loadLogs('${period}')">Retry</button>
        `;
    }
}

/**
 * Formats a timestamp string to UK format (DD/MM/YYYY HH:MM).
 * @param {string} timestamp - The timestamp to format (expected in ISO format).
 * @returns {string} - The formatted timestamp or 'N/A' if invalid.
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'N/A'; // Invalid date
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    return date.toLocaleString('en-GB', options).replace(',', '');
}

/**
 * Renders the logs data into a table within the logs-table-container.
 * @param {Array} logs - Array of log objects to display.
 */
export function renderLogsTable(logs) {
    const container = document.getElementById('logs-table-container');
    if (!container) {
        console.error('Error: logs-table-container not found.');
        return;
    }
    container.innerHTML = ''; // Clear existing content
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Timestamp</th>
                <th>Details</th>
            </tr>
        </thead>
        <tbody>
            ${logs.map(log => `
                <tr>
                    <td>${formatTimestamp(log.timestamp)}</td>
                    <td>${log.details || 'N/A'}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    container.appendChild(table);
}

/**
 * Changes the log type and refreshes the logs display.
 * @param {string} type - The new log type (e.g., 'click', 'order').
 */
export function changeLogType(type) {
    const logsSection = document.getElementById('logs');
    if (logsSection) {
        logsSection.dataset.type = type;
        const currentPeriod = document.querySelector('.period-icon.selected')?.dataset.period || 'today';
        selectPeriod(currentPeriod); // Reload logs and update description
    } else {
        console.error('Error: logs section not found.');
    }
}

/**
 * Initializes the logs UI when the DOM is fully loaded.
 */
function initializeLogsUI() {
    const logsSection = document.getElementById('logs');
    if (logsSection && !logsSection.dataset.type) {
        logsSection.dataset.type = 'default'; // Set a default log type if none specified
    }
    renderPeriodIcons();
}

// Initialize the UI when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeLogsUI);