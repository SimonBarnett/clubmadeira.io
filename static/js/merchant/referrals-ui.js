// File path: /static/js/merchant/referrals-ui.js
import { log } from '../core/logger.js';
import { fetchEvents } from './referrals-data.js';

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
    'click': 'fas fa-mouse-pointer',
    'order': 'fas fa-shopping-cart'
};

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
 * Renders period icons in the log_period_icon container and sets up click handlers.
 * Initializes with 'today' as the default selected period.
 */
export function renderPeriodIcons() {
    const container = document.getElementById('log_period_icon');
    if (!container) {
        log('merchant/referrals-ui', 'Error: log_period_icon container not found.');
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
        loadLogs(type, period.name);
    }
}

/**
 * Updates the logs-description element with the log type icon and text.
 * @param {string} type - The log type (e.g., 'click', 'order').
 * @param {string} periodLabel - The label of the selected period (e.g., 'Today').
 */
function updateDescription(type, periodLabel) {
    const descriptionElement = document.getElementById('logs-description');
    if (descriptionElement) {
        const typeLabel = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Unknown';
        const iconClass = logTypeIcons[type] || 'fa-question'; // Default to question mark if type unknown
        descriptionElement.innerHTML = `<i class="fa-solid ${iconClass}"></i> ${typeLabel} logs for ${periodLabel}`;
    } else {
        log('merchant/referrals-ui', 'Warning: logs-description element not found.');
    }
}

/**
 * Fetches logs for a given type and period, then renders them.
 * @param {string} type - The event type ('click' or 'order').
 * @param {string} period - The period for which to fetch logs (e.g., 'today').
 */
export async function loadLogs(type, period) {
    if (!type) {
        log('merchant/referrals-ui', 'Error: No type set for logs section.');
        return;
    }
    try {
        const events = await fetchEvents(type, period);
        renderEventsTable(events);
    } catch (error) {
        log('merchant/referrals-ui', `Error loading logs: ${error.message}`);
        document.getElementById('logs-table-container').innerHTML = `
            <p>Error: ${error.message}</p>
            <button onclick="loadLogs('${type}', '${period}')">Retry</button>
        `;
    }
}

/**
 * Renders the events data into a table within the logs-table-container.
 * @param {Array} events - Array of event objects to display.
 */
export function renderEventsTable(events) {
    const container = document.getElementById('logs-table-container');
    if (!container) {
        log('merchant/referrals-ui', 'Error: logs-table-container not found.');
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
            ${events.map(event => `
                <tr>
                    <td>${formatTimestamp(event.timestamp)}</td>
                    <td>${event.details || 'N/A'}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    container.appendChild(table);
}