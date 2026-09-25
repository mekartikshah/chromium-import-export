// Utility functions
function showStatus(message, type = 'loading', progress = 0) {
    const status = document.getElementById('status');
    const statusMessage = document.getElementById('statusMessage');
    const progressFill = document.getElementById('progressFill');

    status.classList.remove('hidden', 'success', 'error');
    statusMessage.textContent = message;
    progressFill.style.width = `${progress}%`;

    if (type === 'success' || type === 'error') {
        status.classList.add(type);
        setTimeout(() => {
            status.classList.add('hidden');
        }, 3000);
    }
}

function downloadJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: false
    }, (downloadId) => {
        if (chrome.runtime.lastError) {
            showStatus(`Error: ${chrome.runtime.lastError.message}`, 'error');
        } else {
            showStatus('Download started successfully!', 'success', 100);
            URL.revokeObjectURL(url);
        }
    });
}

// Export Bookmarks
async function exportBookmarks() {
    try {
        showStatus('Exporting bookmarks...', 'loading', 30);

        const bookmarkTree = await chrome.bookmarks.getTree();

        showStatus('Preparing download...', 'loading', 70);

        const exportData = {
            exportDate: new Date().toISOString(),
            browser: 'Chrome Toolkit Export',
            version: '1.0.0',
            type: 'bookmarks',
            data: bookmarkTree
        };

        const timestamp = new Date().toISOString().split('T')[0];
        downloadJSON(exportData, `bookmarks-export-${timestamp}.json`);

    } catch (error) {
        console.error('Export bookmarks error:', error);
        showStatus(`Error exporting bookmarks: ${error.message}`, 'error');
    }
}

// Export History
async function exportHistory() {
    try {
        showStatus('Fetching browsing history...', 'loading', 20);

        // Get all history items (Chrome API limits to 100,000 items)
        const historyItems = await chrome.history.search({
            text: '',
            maxResults: 100000,
            startTime: 0
        });

        showStatus(`Processing ${historyItems.length} history entries...`, 'loading', 60);

        const exportData = {
            exportDate: new Date().toISOString(),
            browser: 'Chrome Toolkit Export',
            version: '1.0.0',
            type: 'history',
            count: historyItems.length,
            data: historyItems
        };

        showStatus('Preparing download...', 'loading', 80);

        const timestamp = new Date().toISOString().split('T')[0];
        downloadJSON(exportData, `history-export-${timestamp}.json`);

    } catch (error) {
        console.error('Export history error:', error);
        showStatus(`Error exporting history: ${error.message}`, 'error');
    }
}

// Normalize the many shapes of history files into the flat array the background
// worker expects. Supported shapes:
//   1. This extension's own export:   { "type": "history", "data": [{ url, title, ... }] }
//   2. Google Takeout:                { "Browser History": [{ url, title, visit_time, ... }] }
//   3. Bare array of items:           [{ url, title }, ...]
//   4. URL-list object:               { "urls": ["https://...", { url: "https://..." }, ...] }
// Throws with a helpful message when the file matches none of these shapes.
function normalizeHistoryData(importData) {
    let items = null;

    if (Array.isArray(importData)) {
        items = importData;
    } else if (importData && typeof importData === 'object') {
        if (importData.type === 'history' && Array.isArray(importData.data)) {
            items = importData.data;
        } else if (Array.isArray(importData['Browser History'])) {
            items = importData['Browser History'];
        } else if (Array.isArray(importData.urls)) {
            items = importData.urls;
        }
    }

    if (items === null) {
        throw new Error(
            'Invalid file type. Expected a history export from this extension ' +
            '(JSON with "type": "history"), a Google Takeout "Browser History" file, ' +
            'or a JSON array of history items.'
        );
    }

    // Map every entry to the minimal { url } shape; strings are treated as URLs.
    const entries = items
        .map(item => {
            if (typeof item === 'string') return { url: item };
            if (item && typeof item.url === 'string') return { url: item.url };
            return null;
        })
        .filter(item => item !== null);

    // Dedupe by URL (Google Takeout has one row per visit, so the same URL appears
    // many times). Preserves first-seen order.
    const seen = new Set();
    return entries.filter(item => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
    });
}

// Import Bookmarks - delegates to background service worker
async function importBookmarks(file) {
    try {
        showStatus('Reading bookmarks file...', 'loading', 20);

        const text = await file.text();
        const importData = JSON.parse(text);

        console.log('Import data:', importData);

        if (importData.type !== 'bookmarks') {
            throw new Error('Invalid file type. Expected bookmarks export file.');
        }

        showStatus('Starting background import...', 'loading', 40);

        // Send to background service worker
        const response = await chrome.runtime.sendMessage({
            type: 'startBookmarkImport',
            data: importData.data
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to start import');
        }

        showStatus('Import running in background. You can close this popup.', 'loading', 50);

    } catch (error) {
        console.error('Import bookmarks error:', error);
        showStatus(`Error importing bookmarks: ${error.message}`, 'error');
    }
}

// Import History - delegates to background service worker
async function importHistory(file) {
    try {
        showStatus('Reading history file...', 'loading', 20);

        const text = await file.text();
        const importData = JSON.parse(text);

        console.log('History import data:', importData);

        const historyItems = normalizeHistoryData(importData);

        showStatus('Starting background import...', 'loading', 40);

        // Send to background service worker
        const response = await chrome.runtime.sendMessage({
            type: 'startHistoryImport',
            data: historyItems
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to start import');
        }

        showStatus('Import running in background. You can close this popup.', 'loading', 50);

    } catch (error) {
        console.error('Import history error:', error);
        showStatus(`Error importing history: ${error.message}`, 'error');
    }
}

// Listen for progress updates from background service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'importProgress') {
        const state = message.state;

        if (state.status !== 'idle') {
            const type = state.status.includes('Error') ? 'error' :
                state.progress === 100 ? 'success' : 'loading';
            showStatus(state.status, type, state.progress);
        }
    }
});

// Check for ongoing import when popup opens
async function checkImportStatus() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'getImportState' });
        if (response.state && response.state.isImporting) {
            showStatus(response.state.status, 'loading', response.state.progress);
        }
    } catch (error) {
        // Service worker might not be ready yet
        console.log('Could not check import status:', error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if there's an ongoing import
    checkImportStatus();

    // Export buttons
    document.getElementById('exportBookmarks').addEventListener('click', exportBookmarks);
    document.getElementById('exportHistory').addEventListener('click', exportHistory);

    // Import file inputs
    document.getElementById('importBookmarksFile').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importBookmarks(file);
            e.target.value = ''; // Reset input
        }
    });

    document.getElementById('importHistoryFile').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importHistory(file);
            e.target.value = ''; // Reset input
        }
    });
});
