// dataLoader.js
import { authenticatedFetch } from '../core/auth.js';
import { log as loggerLog, error as loggerError } from '../core/logger.js';

export async function load(role) {
    loggerLog(`dataLoaderLoad - Loading data for ${role}`);
    try {
        const response = await authenticatedFetch(`${window.apiUrl}/users/${role}`);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        loggerLog(`dataLoaderLoad - Data loaded for ${role}:`, data);
        return data;
    } catch (error) {
        loggerError(`dataLoaderLoad - Error loading data for ${role}:`, error);
        // Fallback: return empty data if the API fails
        return { status: 'error', data: [] };
    }
}

if (!window.dataLoaderInitialized) {
    window.dataLoaderInitialized = true;
    loggerLog('dataLoader.js - DataLoader module initialized');
}