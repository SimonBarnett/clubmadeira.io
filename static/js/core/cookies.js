// /static/js/core/cookies.js
// /static/js/core/cookies.js
import { log } from './logger.js';
import { withScriptLogging } from '../utils/logging-utils.js'; // Corrected import

const context = 'cookies.js';


export function setCookie(name, value, days) {
    log(context, `Setting cookie: ${name}`);
    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = `; expires=${date.toUTCString()}`;
    }
    document.cookie = `${name}=${value}${expires}; path=/; SameSite=Strict`;
}

export function getCookie(name) {
    log(context, `Getting cookie: ${name}`);
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    return null;
}

export function removeCookie(name) {
    log(context, `Removing cookie: ${name}`);
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
}

export function initializeCookies() {
    withScriptLogging(context, () => {
        log(context, 'Module initialized');
    });
}