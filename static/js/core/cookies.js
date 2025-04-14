// cookies.js
import { log as loggerLog } from './logger.js';

export function setCookie(name, value, days) {
    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = `; expires=${date.toUTCString()}`;
    }
    document.cookie = `${name}=${value || ''}${expires}; path=/; SameSite=Lax; Secure`;
    loggerLog(`cookiesSetCookie - Set cookie: ${name}, Value: ${value}`);
}

export function getCookie(name) {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

export function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; SameSite=Lax; Secure`;
    loggerLog(`cookiesDeleteCookie - Deleted cookie: ${name}`);
}

if (!window.cookiesInitialized) {
    window.cookiesInitialized = true;
    loggerLog('cookies.js - Cookies utility initialized');
}