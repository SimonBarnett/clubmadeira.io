// /static/js/admin/referral-test.js
import { log, warn } from '../core/logger.js';
import { success, error } from '../core/notifications.js';
import { withErrorHandling } from '../utils/error.js';
import { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { shouldInitializeForPageType } from '../utils/initialization.js';

const context = 'referral-test.js';

let currentUserId;

document.addEventListener('DOMContentLoaded', () => {
    const userIdInput = document.getElementById('userId');
    if (userIdInput && userIdInput.value) {
        currentUserId = userIdInput.value;
    } else {
        warn(context, 'Current user ID not found in template variables');
        currentUserId = 'unknown';
    }

    if (shouldInitializeForPageType('admin')) {
        initializeReferralTest(context);
    }
});

export async function initializeReferralTest(context) {
    log(context, 'Initializing referral test forms');
    await withErrorHandling(`${context}:initializeReferralTest`, async () => {
        // Set default values
        const pageVisitForm = document.getElementById('pageVisitForm');
        const orderForm = document.getElementById('orderForm');

        if (pageVisitForm) {
            pageVisitForm.querySelector('#sourceUserId').value = currentUserId;
            pageVisitForm.querySelector('#destinationUserId').value = currentUserId;
        } else {
            warn(context, 'pageVisitForm not found');
        }

        if (orderForm) {
            orderForm.querySelector('#orderSourceUserId').value = currentUserId;
            orderForm.querySelector('#orderDestinationUserId').value = currentUserId;
        } else {
            warn(context, 'orderForm not found');
        }

        // Setup form event listeners with duplicate prevention
        setupFormListeners(context);
    }, ERROR_MESSAGES.MODULE_INIT_FAILED);
}

function setupFormListeners(context) {
    log(context, 'Setting up form event listeners');

    const pageVisitForm = document.getElementById('pageVisitForm');
    const orderForm = document.getElementById('orderForm');

    if (pageVisitForm && !pageVisitForm._submitListenerAttached) {
        pageVisitForm.addEventListener('submit', (event) => {
            event.preventDefault();
            event.stopPropagation(); // Prevent event bubbling
            log(context, 'Page visit form submit event triggered');
            handleFormSubmit(context, event.target, API_ENDPOINTS.EVENT, 'click');
        });
        pageVisitForm._submitListenerAttached = true;
        log(context, 'Page visit form listener attached');
    }

    if (orderForm && !orderForm._submitListenerAttached) {
        orderForm.addEventListener('submit', (event) => {
            event.preventDefault();
            event.stopPropagation(); // Prevent event bubbling
            log(context, 'Order form submit event triggered');
            handleFormSubmit(context, event.target, API_ENDPOINTS.EVENT, 'order');
        });
        orderForm._submitListenerAttached = true;
        log(context, 'Order form listener attached');
    }
}

async function handleFormSubmit(context, form, endpoint, eventType) {
    log(context, `Handling ${eventType} form submission to ${endpoint}`);
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    if (eventType === 'order') {
        data.sale_value = parseFloat(data.sale_value || '0');
        if (isNaN(data.sale_value)) {
            error(context, 'Invalid sale value: must be a number');
            return;
        }
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const result = await response.json();
        if (result.status === 'success') {
            success(context, SUCCESS_MESSAGES[`${eventType.toUpperCase()}_RECORDED`]);
            log(context, `${eventType} recorded successfully: ${result.message || 'No message'}`);
            form.reset();
            form.querySelector('input[name="source_user_id"]').value = currentUserId;
            form.querySelector('input[name="destination_user_id"]').value = currentUserId;
            if (eventType === 'order') {
                form.querySelector('input[name="sale_value"]').value = '99.99';
            }
        } else {
            throw new Error(result.message || 'Unknown error');
        }
    } catch (err) {
        error(context, `Failed to record ${eventType}: ${err.message}`);
        log(context, `Error submitting ${eventType} form: ${err.message}`);
    }
}