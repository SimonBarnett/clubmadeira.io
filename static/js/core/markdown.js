// markdown.js
import { log as loggerLog, error as loggerError } from '../core/logger.js';

export function render(mdPath, targetId) {
    loggerLog(`markdownRender - Rendering markdown from ${mdPath} to ${targetId}`);
    const target = document.getElementById(targetId);
    if (!target) {
        loggerError(`markdownRender - Target element not found: ${targetId}`);
        return;
    }

    fetch(mdPath)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return response.text();
        })
        .then(text => {
            if (typeof marked === 'undefined') {
                loggerError('markdownRender - Marked library not loaded');
                return;
            }
            target.innerHTML = marked.parse(text);
            loggerLog(`markdownRender - Markdown rendered to ${targetId}`);
        })
        .catch(error => {
            loggerError(`markdownRender - Error rendering markdown from ${mdPath}:`, error);
        });
}

if (!window.markdownInitialized) {
    window.markdownInitialized = true;
    loggerLog('markdown.js - Markdown module initialized');
}