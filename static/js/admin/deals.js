// /static/js/admin/deals.js
console.log('deals.js - Script loaded at:', new Date().toISOString());

// Adjust the path to dataLoader.js based on the correct location
// Assuming dataLoader.js is in /static/js/modules/dataLoader.js
import { load as dataLoaderLoad } from '../modules/dataLoader.js';

export async function loadInitialData() {
    console.log('loadInitialData - Loading deals data');
    const dealList = document.getElementById('dealList');
    if (!dealList) {
        console.warn('loadInitialData - dealList element not found');
        return;
    }

    try {
        const data = await dataLoaderLoad('initial');
        console.log('loadInitialData - Deals fetched:', data);
        if (data.status === 'error') throw new Error('Failed to load deals');
        dealList.innerHTML = data.data.map(deal => `
            <tr>
                <td>${deal.category || 'N/A'}</td>
                <td>${deal.title || 'N/A'}</td>
                <td><a href="${deal.url || '#'}" target="_blank">Link</a></td>
                <td>${deal.price || 'N/A'}</td>
                <td>${deal.original || 'N/A'}</td>
                <td>${deal.discount || 'N/A'}</td>
                <td><img src="${deal.image || ''}" alt="Product Image" style="width: 50px;" onerror="this.src='/static/images/placeholder.png';"></td>
                <td>${deal.quantity || 'N/A'}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('loadInitialData - Error:', error.message, error.stack);
        dealList.innerHTML = '<tr><td colspan="8">Error loading deals: ' + error.message + '</td></tr>';
    }
}

console.log('deals.js - Script execution completed at:', new Date().toISOString());