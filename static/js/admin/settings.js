// /static/js/admin/settings.js
import { log } from '../core/logger.js';
import { renderSettingsForm } from '../utils/settings-renderer.js';
import { ERROR_MESSAGES } from '../config/messages.js';
import { SETTINGS } from '../config/settings.js';
import { withScriptLogging } from '../utils/logging-utils.js';
import { createModuleInitializer } from '../utils/initialization.js';
import { loadSettings } from '../utils/settings-data.js';
import { withErrorHandling } from '../utils/error.js';
import { parsePageType, shouldInitializeForPageType } from '../utils/initialization.js';

const context = 'settings.js';

export async function loadAdminSettings(context, type) {
    const pageType = parsePageType(context, 'page', 'admin');
    if (pageType !== 'admin') {
        log(context, `Skipping initialization for non-admin page type: ${pageType}`);
        return;
    }
    log(context, `Loading ${type} settings`);
    const settingsConfig = SETTINGS[type];
    if (!settingsConfig) {
        throw new Error(`Unknown settings type: ${type}`);
    }
    let settingsData = [];
    try {
        settingsData = await loadSettings(context, settingsConfig.endpoint);
    } catch (err) {
        log(context, `Failed to fetch settings for ${type}: ${err.message}`);
        settingsData = [];
    }
    const configWithSettings = {
        ...settingsConfig,
        settings: settingsData,
    };
    await withErrorHandling(`${context}:renderSettingsForm`, async () => {
        await renderSettingsForm(context, configWithSettings);
    }, ERROR_MESSAGES.RENDER_FAILED('settings form'));
}

export function initializeSettingsModule(registry) {
    return createModuleInitializer(context, {
        loadAdminSettings,
    });
}

if (shouldInitializeForPageType('admin')) {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
} else {
    log(context, 'Skipping initialization for non-admin page');
}