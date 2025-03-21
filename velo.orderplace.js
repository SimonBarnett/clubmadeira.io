// File: backend/events.js

import { fetch } from 'wix-fetch';
import { getSessionData } from 'wix-storage-backend'; // Backend session access

// Event handler for when an order is placed
export async function wixStores_onOrderPlaced(event) {
    const orderId = event.orderId;
    const buyerInfo = event.buyerInfo;
    const total = event.totals.total;

    // Retrieve the referer from session storage (backend access)
    let referer;
    try {
        referer = await getSessionData('referer');
    } catch (error) {
        console.error('Failed to retrieve referer from session:', error);
    }

    // Define the callback function to call the external endpoint
    const callback = async () => {
        try {
            const payload = {
                orderId: orderId,
                buyer: buyerInfo,
                total: total,
                referer: referer || 'none', // Use 'none' if no referer was stored
                timestamp: new Date().toISOString()
            };

            const response = await fetch('https://clubmedeira.io/referal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Callback successful:', result);
                return result;
            } else {
                throw new Error(`Callback failed with status: ${response.status}`);
            }
        } catch (error) {
            console.error('Callback error:', error.message);
            throw error;
        }
    };

    // Execute the callback
    try {
        await callback();
    } catch (error) {
        console.error('Failed to execute callback on order placed:', error);
    }
}