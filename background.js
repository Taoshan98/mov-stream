/**
 * MovStream Background Script
 * Handles download events and intercepts .mov files to play them in the browser
 * instead of downloading them, based on user preferences.
 */

// Default options
const DEFAULT_OPTIONS = {
    showDownloadDialog: false,
    useCustomControls: true,
    useDarkTheme: true
};

// User preferences
let userPreferences = { ...DEFAULT_OPTIONS };

// Load user preferences when the extension starts
loadUserPreferences();

/**
 * Loads user preferences from chrome.storage
 */
function loadUserPreferences() {
    chrome.storage.sync.get(DEFAULT_OPTIONS, (items) => {
        userPreferences = items;
        console.log('Loaded user preferences:', userPreferences);
    });
}

// Listen for changes to user preferences
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        // Update our local copy of preferences
        for (const key in changes) {
            if (key in userPreferences) {
                userPreferences[key] = changes[key].newValue;
            }
        }
        console.log('Updated user preferences:', userPreferences);
    }
});

/**
 * Handles download events and intercepts .mov files based on user preferences
 */
chrome.downloads.onCreated.addListener(async (downloadItem) => {
    try {
        // Check if the URL directly ends with .mov
        const isMovByExtension = downloadItem.url.toLowerCase().endsWith('.mov');
        const mimeType = downloadItem.mime || '';
        const isMovByMime = mimeType.toLowerCase() === 'video/quicktime' || 
                           mimeType.toLowerCase() === 'video/x-quicktime';

        // If it's a .mov file by extension or MIME type, handle it based on user preferences
        if (isMovByExtension || isMovByMime) {
            // Check if user wants to see the download dialog
            if (!userPreferences.showDownloadDialog) {
                await chrome.downloads.cancel(downloadItem.id);
            }
            // Always open the player, even if download dialog is shown
            await openMovPlayer(downloadItem.url);
            return;
        }

        // For other files, check the Content-Disposition header and MIME type
        // to see if it's actually a .mov file with a different URL
        try {
            // Try to get more information about the file
            const response = await fetch(downloadItem.url, { 
                method: 'HEAD',
                // Add headers to avoid CORS issues
                headers: {
                    'Accept': 'video/quicktime,video/mp4,*/*'
                }
            });

            if (!response.ok) {
                // Not a valid response, but still check if it's a .mov file
                // Some servers might return errors for HEAD requests
                if (downloadItem.filename && downloadItem.filename.toLowerCase().endsWith('.mov')) {
                    if (!userPreferences.showDownloadDialog) {
                        await chrome.downloads.cancel(downloadItem.id);
                    }
                    // Always open the player, even if download dialog is shown
                    await openMovPlayer(downloadItem.url);
                }
                return;
            }

            // Check Content-Type header
            const contentType = response.headers.get('Content-Type');
            if (contentType && (
                contentType.toLowerCase().includes('video/quicktime') || 
                contentType.toLowerCase().includes('video/x-quicktime'))) {
                if (!userPreferences.showDownloadDialog) {
                    await chrome.downloads.cancel(downloadItem.id);
                }
                // Always open the player, even if download dialog is shown
                await openMovPlayer(downloadItem.url);
                return;
            }

            // Check Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            if (contentDisposition) {
                // Extract filename from Content-Disposition
                const filenameMatch = contentDisposition.match(/filename=["']?([^"';]+)/i);
                if (filenameMatch) {
                    const filename = decodeURIComponent(filenameMatch[1].trim());
                    if (filename.toLowerCase().endsWith('.mov')) {
                        // It's a .mov file, handle based on user preferences
                        if (!userPreferences.showDownloadDialog) {
                            await chrome.downloads.cancel(downloadItem.id);
                        }
                        // Always open the player, even if download dialog is shown
                        await openMovPlayer(downloadItem.url);
                        return;
                    }
                }
            }

            // Last resort: check the downloadItem's filename
            if (downloadItem.filename && downloadItem.filename.toLowerCase().endsWith('.mov')) {
                if (!userPreferences.showDownloadDialog) {
                    await chrome.downloads.cancel(downloadItem.id);
                }
                // Always open the player, even if download dialog is shown
                await openMovPlayer(downloadItem.url);
            }
        } catch (error) {
            console.error('Error checking file type:', error);
            // In case of error, check if the filename ends with .mov
            if (downloadItem.filename && downloadItem.filename.toLowerCase().endsWith('.mov')) {
                if (!userPreferences.showDownloadDialog) {
                    await chrome.downloads.cancel(downloadItem.id);
                }
                // Always open the player, even if download dialog is shown
                await openMovPlayer(downloadItem.url);
            }
        }
    } catch (error) {
        console.error('Error in download handler:', error);
    }
});

/**
 * Opens the MOV player in a new tab with the specified URL
 * @param {string} url - The URL of the .mov file to play
 */
async function openMovPlayer(url) {
    try {
        // Make sure the URL is properly encoded to prevent issues
        // Some URLs might already be encoded, so we decode first to avoid double-encoding
        const decodedUrl = decodeURIComponent(url);
        const encodedUrl = encodeURIComponent(decodedUrl);

        // Create a new tab with the player and the encoded URL
        await chrome.tabs.create({
            url: `player.html#${encodedUrl}`
        });
    } catch (error) {
        console.error('Error opening player:', error);
        // Try a fallback approach if there's an error with encoding
        try {
            await chrome.tabs.create({
                url: `player.html#${encodeURIComponent(url)}`
            });
        } catch (fallbackError) {
            console.error('Fallback error opening player:', fallbackError);
        }
    }
}
