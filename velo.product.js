// File: public/pages/home.js (or any page where the referer might appear)

import { session } from 'wix-storage';
import wixLocation from 'wix-location';
import { fetch } from 'wix-fetch'; // Import fetch for HTTP requests

$w.onReady(function () {
    // Get query parameters from the URL
    const query = wixLocation.query;
    
    // Check if referer exists in the query
    if (query.referer) {
        // Store the referer in session storage
        session.setItem('referer', query.referer);
        console.log('Referer stored:', query.referer);

        // Define the callback function to notify the referrer
        const sendCallbackToReferer = async () => {
            try {
                const response = await fetch('http://localhost:5000/referal', {
                    method: 'POST', // Use POST to send data; change to GET if needed
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        referer: query.referer,
                        page: wixLocation.url, // Current page URL
                        timestamp: new Date().toISOString()
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('Callback to referrer successful:', result);
                } else {
                    console.error('Callback failed with status:', response.status);
                }
            } catch (error) {
                console.error('Error sending callback to referrer:', error);
            }
        };

        // Execute the callback
        sendCallbackToReferer();
    } else {
        // Log if no referer is present but one was previously stored
        const storedReferer = session.getItem('referer');
        if (storedReferer) {
            console.log('Using previously stored referer:', storedReferer);
        }
    }
});