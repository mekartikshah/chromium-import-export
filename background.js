// Service Worker for background import operations
// This allows imports to continue even when popup is closed

let importState = {
    isImporting: false,
    type: null, // 'history' or 'bookmarks'
    total: 0,
    processed: 0,
    imported: 0,
    skipped: 0,
    progress: 0,
    status: 'idle'
};

// Keepalive mechanism to prevent service worker timeout
const KEEPALIVE_ALARM = 'keepalive';
let keepaliveInterval = null;

function startKeepalive() {
    console.log('Starting keepalive mechanism');
    // Create an alarm that fires every 20 seconds to keep service worker alive
    chrome.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: 0.33 }); // ~20 seconds
}

function stopKeepalive() {
    console.log('Stopping keepalive mechanism');
    chrome.alarms.clear(KEEPALIVE_ALARM);
}

// Listen for alarm to keep service worker alive
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === KEEPALIVE_ALARM) {
        console.log('Keepalive ping:', new Date().toISOString(), 'Importing:', importState.isImporting);
        // Just logging keeps the service worker active
    }
});

// Helper function to add delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Update import state and notify popup
function updateState(updates) {
    importState = { ...importState, ...updates };

    // Broadcast to all connected popups
    chrome.runtime.sendMessage({
        type: 'importProgress',
        state: importState
    }).catch(() => {
        // Popup might be closed, that's okay
    });
}

// Import History in background
async function importHistoryBackground(data) {
    try {
        // Start keepalive to prevent service worker timeout
        startKeepalive();

        updateState({
            isImporting: true,
            type: 'history',
            total: data.length,
            processed: 0,
            imported: 0,
            skipped: 0,
            progress: 0,
            status: 'Importing history...'
        });

        console.log('Background: Starting history import, total items:', data.length);

        // Log first few items for debugging
        console.log('Sample data (first 3 items):', data.slice(0, 3));

        let importedCount = 0;
        let skippedCount = 0;
        let skipReasons = {
            invalidUrl: 0,
            internalUrl: 0,
            apiError: 0
        };
        const total = data.length;

        // Larger batch size for faster imports (no delays needed with keepalive)
        const batchSize = 100;

        for (let i = 0; i < total; i += batchSize) {
            const batch = data.slice(i, i + batchSize);

            await Promise.allSettled(
                batch.map(async (item) => {
                    // Log first 10 items for debugging
                    if (i + batch.indexOf(item) < 10) {
                        console.log(`Item ${i + batch.indexOf(item)}:`, {
                            url: item.url,
                            title: item.title,
                            urlType: typeof item.url
                        });
                    }

                    // Validate URL format
                    if (!item.url || typeof item.url !== 'string') {
                        skipReasons.invalidUrl++;
                        skippedCount++;
                        if (skippedCount <= 5) {
                            console.warn('Skipped - Invalid URL:', item);
                        }
                        return;
                    }

                    // Skip internal URLs
                    if (item.url.startsWith('chrome://') ||
                        item.url.startsWith('chrome-extension://') ||
                        item.url.startsWith('about:')) {
                        skipReasons.internalUrl++;
                        skippedCount++;
                        if (skippedCount <= 5) {
                            console.log('Skipped - Internal URL:', item.url);
                        }
                        return;
                    }

                    try {
                        // Prepare the history entry with original visit time
                        const historyItem = {
                            url: item.url
                        };

                        // Note: chrome.history.addUrl does not support visitTime in manifest V3.
                        // Passing it causes a TypeError and skips all history imports.
                        await chrome.history.addUrl(historyItem);
                        // Note: Chrome History API does NOT accept 'title' parameter
                        // The title is automatically fetched from the page when visited
                        importedCount++;
                        if (importedCount <= 5) {
                            console.log('✓ Successfully imported:', item.url);
                        }
                    } catch (err) {
                        skipReasons.apiError++;
                        skippedCount++;
                        if (skippedCount <= 10) {
                            console.error('Failed to import URL:', item.url, 'Error:', err.message, 'Full error:', err);
                        }
                    }
                })
            );

            const processed = i + batch.length;
            const progress = Math.min((processed / total) * 100, 100);

            updateState({
                processed: processed,
                imported: importedCount,
                skipped: skippedCount,
                progress: progress,
                status: `Importing history: ${processed}/${total}...`
            });

            // Log progress every 1000 items
            if (processed % 1000 === 0) {
                console.log(`Progress: ${processed}/${total} (${importedCount} imported, ${skippedCount} skipped)`);
            }
        }

        console.log(`Background: Import complete. Imported: ${importedCount}, Skipped: ${skippedCount}`);
        console.log('Skip reasons breakdown:', skipReasons);

        updateState({
            isImporting: false,
            progress: 100,
            status: `Successfully imported ${importedCount} history entries! (${skippedCount} skipped)`
        });

        // Stop keepalive
        stopKeepalive();

        // Keep success message visible
        setTimeout(() => {
            updateState({ status: 'idle' });
        }, 5000);

    } catch (error) {
        console.error('Background: Import history error:', error);
        stopKeepalive();
        updateState({
            isImporting: false,
            status: `Error: ${error.message}`,
            progress: 0
        });
    }
}

// Import Bookmarks in background
async function importBookmarksBackground(data) {
    try {
        // Start keepalive to prevent service worker timeout
        startKeepalive();

        updateState({
            isImporting: true,
            type: 'bookmarks',
            total: 0,
            processed: 0,
            imported: 0,
            skipped: 0,
            progress: 20,
            status: 'Importing bookmarks...'
        });

        console.log('Background: Starting bookmark import');

        // Get the "Other Bookmarks" folder
        const bookmarkTree = await chrome.bookmarks.getTree();
        const otherBookmarks = bookmarkTree[0].children.find(
            node => node.title === 'Other Bookmarks' || node.id === '2'
        );

        if (!otherBookmarks) {
            throw new Error('Could not find "Other Bookmarks" folder');
        }

        // Create import folder
        const importFolder = await chrome.bookmarks.create({
            parentId: otherBookmarks.id,
            title: `Imported Bookmarks - ${new Date().toLocaleDateString()}`
        });

        updateState({ progress: 40, status: 'Creating bookmarks...' });

        let importedCount = 0;
        let skippedCount = 0;

        // Recursively import bookmarks
        async function importNode(node, parentId, depth = 0) {
            if (node.url) {
                // It's a bookmark
                try {
                    await chrome.bookmarks.create({
                        parentId: parentId,
                        title: node.title || 'Untitled',
                        url: node.url
                    });
                    importedCount++;

                    // Update progress periodically
                    if (importedCount % 10 === 0) {
                        updateState({
                            imported: importedCount,
                            skipped: skippedCount,
                            status: `Imported ${importedCount} bookmarks...`
                        });
                    }
                } catch (err) {
                    console.error('Failed to create bookmark:', node.title, err);
                    skippedCount++;
                }
            } else if (node.children) {
                // It's a folder, create it and import its children
                let folderId = parentId;
                try {
                    const folder = await chrome.bookmarks.create({
                        parentId: parentId,
                        title: node.title || 'Untitled Folder'
                    });
                    folderId = folder.id;
                } catch (err) {
                    console.error('Failed to create folder:', node.title, err);
                }

                for (const child of node.children) {
                    await importNode(child, folderId, depth + 1);
                }
            } else {
                skippedCount++;
            }
        }

        // Import all bookmarks
        for (const rootNode of data) {
            if (rootNode.children) {
                for (const child of rootNode.children) {
                    await importNode(child, importFolder.id, 0);
                }
            }
        }

        console.log('Background: Total bookmarks imported:', importedCount);

        updateState({
            isImporting: false,
            imported: importedCount,
            skipped: skippedCount,
            progress: 100,
            status: `Successfully imported ${importedCount} bookmarks! (${skippedCount} skipped)`
        });

        // Stop keepalive
        stopKeepalive();

        // Keep success message visible
        setTimeout(() => {
            updateState({ status: 'idle' });
        }, 5000);

    } catch (error) {
        console.error('Background: Import bookmarks error:', error);
        stopKeepalive();
        updateState({
            isImporting: false,
            status: `Error: ${error.message}`,
            progress: 0
        });
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background: Received message:', message.type);

    if (message.type === 'startHistoryImport') {
        if (importState.isImporting) {
            sendResponse({ success: false, error: 'Import already in progress' });
            return true;
        }

        importHistoryBackground(message.data);
        sendResponse({ success: true });
        return true;
    }

    if (message.type === 'startBookmarkImport') {
        if (importState.isImporting) {
            sendResponse({ success: false, error: 'Import already in progress' });
            return true;
        }

        importBookmarksBackground(message.data);
        sendResponse({ success: true });
        return true;
    }

    if (message.type === 'getImportState') {
        sendResponse({ state: importState });
        return true;
    }

    return false;
});

console.log('Background service worker loaded');
