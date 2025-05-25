/**
 * MovStream Popup Script
 * Handles the popup UI functionality
 */

// Default options (same as in options.js)
const DEFAULT_OPTIONS = {
    showDownloadDialog: false,
    useCustomControls: true,
    useDarkTheme: true
};

// DOM elements
const showDownloadDialogCheckbox = document.getElementById('showDownloadDialog');
const useCustomControlsCheckbox = document.getElementById('useCustomControls');
const useDarkThemeCheckbox = document.getElementById('useDarkTheme');
const openOptionsLink = document.getElementById('openOptions');

/**
 * Saves options to chrome.storage
 */
function saveOptions() {
    const options = {
        showDownloadDialog: showDownloadDialogCheckbox.checked,
        useCustomControls: useCustomControlsCheckbox.checked,
        useDarkTheme: useDarkThemeCheckbox.checked
    };

    chrome.storage.sync.set(options);

    // Apply theme based on current setting
    applyTheme(options.useDarkTheme);
}

/**
 * Applies theme based on user preferences
 */
function applyTheme(isDarkTheme) {
    if (isDarkTheme) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

/**
 * Restores options from chrome.storage
 */
function restoreOptions() {
    chrome.storage.sync.get(DEFAULT_OPTIONS, (items) => {
        showDownloadDialogCheckbox.checked = items.showDownloadDialog;
        useCustomControlsCheckbox.checked = items.useCustomControls;
        useDarkThemeCheckbox.checked = items.useDarkTheme;

        // Apply theme based on saved preference
        applyTheme(items.useDarkTheme);
    });
}

/**
 * Opens the options page
 */
function openOptions() {
    chrome.runtime.openOptionsPage();
}

// Event listeners
document.addEventListener('DOMContentLoaded', restoreOptions);
openOptionsLink.addEventListener('click', openOptions);

// Add event listeners for instant save on toggle
showDownloadDialogCheckbox.addEventListener('change', saveOptions);
useCustomControlsCheckbox.addEventListener('change', saveOptions);
useDarkThemeCheckbox.addEventListener('change', saveOptions);
