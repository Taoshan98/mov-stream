/**
 * MovStream Player Script
 * Handles video playback of .mov files in the browser with modern UI
 */

// DOM elements - Video and status
const videoElement = document.getElementById('video');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error-message');

// DOM elements - Custom controls
const customControlsElement = document.getElementById('custom-controls');
const playPauseButton = document.getElementById('play-pause');
const playPauseIcon = playPauseButton?.querySelector('.material-icons');
const muteUnmuteButton = document.getElementById('mute-unmute');
const muteUnmuteIcon = muteUnmuteButton?.querySelector('.material-icons');
const fullscreenButton = document.getElementById('fullscreen');
const timeDisplay = document.getElementById('time-display');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const volumeSlider = document.getElementById('volume-slider');
const volumeLevel = document.getElementById('volume-level');

// Default options
const DEFAULT_OPTIONS = {
    showDownloadDialog: false,
    useCustomControls: true,
    useDarkTheme: true
};

// User preferences
let userPreferences = { ...DEFAULT_OPTIONS };

// MIME types to try in order of preference
const MIME_TYPES = [
    'video/mp4',
    'video/quicktime',
    'video/x-quicktime',
    'video/mov',
    'video/mpeg',
    'video/x-m4v',
    'application/octet-stream' // Fallback for unknown formats
];

// Timeout for video loading (in milliseconds)
const VIDEO_LOAD_TIMEOUT = 15000;

// Control visibility timeout
let controlsTimeout;

/**
 * Initializes the player
 */
async function initPlayer() {
    // Load user preferences
    await loadUserPreferences();

    // Apply theme
    applyTheme();

    // Set up custom controls if enabled
    setupCustomControls();

    // Get the video URL from the hash part of the URL
    const url = window.location.hash.substring(1);

    // Start playing the video
    playStream(url);
}

/**
 * Loads user preferences from chrome.storage
 */
async function loadUserPreferences() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(DEFAULT_OPTIONS, (items) => {
            userPreferences = items;
            resolve();
        });
    });
}

/**
 * Applies theme based on user preferences
 */
function applyTheme() {
    if (!userPreferences.useDarkTheme) {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
}

/**
 * Sets up custom video controls based on user preferences
 */
function setupCustomControls() {
    if (userPreferences.useCustomControls) {
        // Remove default controls
        videoElement.removeAttribute('controls');

        // Show custom controls
        customControlsElement.style.display = 'flex';

        // Set up event listeners for custom controls
        setupControlEvents();
    } else {
        // Use default browser controls
        videoElement.setAttribute('controls', '');

        // Hide custom controls
        customControlsElement.style.display = 'none';
    }
}

/**
 * Sets up event listeners for custom video controls
 */
function setupControlEvents() {
    // Play/Pause button
    playPauseButton.addEventListener('click', togglePlayPause);

    // Video click to toggle play/pause
    videoElement.addEventListener('click', togglePlayPause);

    // Mute/Unmute button
    muteUnmuteButton.addEventListener('click', toggleMute);

    // Fullscreen button
    fullscreenButton.addEventListener('click', toggleFullscreen);

    // Progress bar
    progressContainer.addEventListener('click', seekVideo);

    // Volume slider
    volumeSlider.addEventListener('click', changeVolume);

    // Update progress bar and time display as video plays
    videoElement.addEventListener('timeupdate', updateProgress);

    // Update play/pause button state
    videoElement.addEventListener('play', updatePlayPauseState);
    videoElement.addEventListener('pause', updatePlayPauseState);

    // Update volume display
    videoElement.addEventListener('volumechange', updateVolumeDisplay);

    // Show controls when mouse moves
    document.addEventListener('mousemove', showControls);

    // Hide controls after inactivity
    document.addEventListener('mousemove', resetControlsTimeout);
}

/**
 * Toggles video play/pause state
 */
function togglePlayPause() {
    if (videoElement.paused || videoElement.ended) {
        videoElement.play();
    } else {
        videoElement.pause();
    }
}

/**
 * Updates the play/pause button state
 */
function updatePlayPauseState() {
    if (playPauseIcon) {
        if (videoElement.paused || videoElement.ended) {
            playPauseIcon.textContent = 'play_arrow';
        } else {
            playPauseIcon.textContent = 'pause';
        }
    }
}

/**
 * Toggles video mute state
 */
function toggleMute() {
    videoElement.muted = !videoElement.muted;
}

/**
 * Updates the volume display
 */
function updateVolumeDisplay() {
    if (muteUnmuteIcon) {
        if (videoElement.muted || videoElement.volume === 0) {
            muteUnmuteIcon.textContent = 'volume_off';
        } else if (videoElement.volume < 0.5) {
            muteUnmuteIcon.textContent = 'volume_down';
        } else {
            muteUnmuteIcon.textContent = 'volume_up';
        }
    }

    if (volumeLevel) {
        const volumePercent = videoElement.muted ? 0 : videoElement.volume * 100;
        volumeLevel.style.width = `${volumePercent}%`;
    }
}

/**
 * Changes the volume based on click position
 * @param {Event} event - The click event
 */
function changeVolume(event) {
    const rect = volumeSlider.getBoundingClientRect();
    const position = (event.clientX - rect.left) / rect.width;
    videoElement.volume = Math.max(0, Math.min(1, position));
}

/**
 * Toggles fullscreen mode
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        }

        if (fullscreenButton.querySelector('.material-icons')) {
            fullscreenButton.querySelector('.material-icons').textContent = 'fullscreen_exit';
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }

        if (fullscreenButton.querySelector('.material-icons')) {
            fullscreenButton.querySelector('.material-icons').textContent = 'fullscreen';
        }
    }
}

/**
 * Updates the progress bar and time display
 */
function updateProgress() {
    // Update progress bar
    if (progressBar) {
        const percent = (videoElement.currentTime / videoElement.duration) * 100;
        progressBar.style.width = `${percent}%`;
    }

    // Update time display
    if (timeDisplay) {
        const currentTime = formatTime(videoElement.currentTime);
        const duration = formatTime(videoElement.duration);
        timeDisplay.textContent = `${currentTime} / ${duration}`;
    }
}

/**
 * Formats time in seconds to MM:SS format
 * @param {number} timeInSeconds - Time in seconds
 * @returns {string} - Formatted time string
 */
function formatTime(timeInSeconds) {
    if (isNaN(timeInSeconds)) return '0:00';

    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Seeks the video to the clicked position
 * @param {Event} event - The click event
 */
function seekVideo(event) {
    const rect = progressContainer.getBoundingClientRect();
    const position = (event.clientX - rect.left) / rect.width;
    videoElement.currentTime = position * videoElement.duration;
}

/**
 * Shows the custom controls
 */
function showControls() {
    if (customControlsElement) {
        customControlsElement.classList.add('active');
    }
}

/**
 * Resets the controls timeout
 */
function resetControlsTimeout() {
    clearTimeout(controlsTimeout);
    showControls();

    controlsTimeout = setTimeout(() => {
        if (customControlsElement && !videoElement.paused) {
            customControlsElement.classList.remove('active');
        }
    }, 3000);
}

/**
 * Checks if a URL is a GitHub repository URL and converts it to a raw content URL
 * @param {string} url - The URL to check and potentially convert
 * @returns {string} - The raw content URL if it's a GitHub URL, otherwise the original URL
 */
function convertGitHubUrl(url) {
    // Check if it's a GitHub URL
    if (url.includes('github.com') && url.includes('/blob/')) {
        // Convert GitHub URL to raw content URL
        return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }
    return url;
}

/**
 * Plays a video stream from the given URL
 * @param {string} url - The URL of the video to play
 */
async function playStream(url) {
    if (!url) {
        showError('No video URL provided');
        return;
    }

    try {
        // Decode the URL if it's encoded
        const decodedUrl = decodeURIComponent(url);

        // Convert GitHub URLs to raw content URLs
        const processedUrl = convertGitHubUrl(decodedUrl);

        // Clear any existing sources
        while (videoElement.firstChild) {
            videoElement.removeChild(videoElement.firstChild);
        }

        // Reset video element display
        videoElement.style.display = 'block';

        // Set up loading timeout
        const loadingTimeout = setTimeout(() => {
            // If we reach the timeout, try to fetch the video directly
            fetchAndPlayVideo(processedUrl);
        }, VIDEO_LOAD_TIMEOUT);

        // Add event listeners for video
        videoElement.addEventListener('loadeddata', () => {
            clearTimeout(loadingTimeout);
            handleVideoLoaded();
        }, { once: true });

        videoElement.addEventListener('canplay', () => {
            clearTimeout(loadingTimeout);
            handleVideoLoaded();
        }, { once: true });

        videoElement.addEventListener('error', (event) => {
            clearTimeout(loadingTimeout);
            handleVideoError(event);
        }, { once: true });

        // Try each MIME type
        for (const mimeType of MIME_TYPES) {
            // Create source element
            const source = document.createElement('source');
            source.setAttribute('src', processedUrl);
            source.setAttribute('type', mimeType);
            videoElement.appendChild(source);
        }

        // Set attributes to handle CORS issues and improve compatibility
        videoElement.crossOrigin = 'anonymous';
        videoElement.playsInline = true;
        videoElement.preload = 'auto';

        // Set video element properties for better codec support
        videoElement.muted = false; // Ensure audio is enabled

        // Load the video
        videoElement.load();

        // Try to play the video
        try {
            await videoElement.play();
        } catch (playError) {
            console.error('Error playing video:', playError);
            // Some browsers require user interaction before autoplay
            // We'll still show the video controls so user can play manually
        }
    } catch (error) {
        console.error('Error setting up video:', error);
        showError(`Failed to load video: ${error.message}`);
    }
}

/**
 * Fetches the video directly and plays it as a blob
 * @param {string} url - The URL of the video to fetch
 */
async function fetchAndPlayVideo(url) {
    try {
        loadingElement.textContent = 'Fetching video directly...';

        // Convert GitHub URLs to raw content URLs if needed
        const processedUrl = convertGitHubUrl(url);

        // Fetch the video
        const response = await fetch(processedUrl, {
            headers: {
                'Accept': 'video/quicktime,video/mp4,*/*'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get the video as a blob
        const blob = await response.blob();

        // Create a blob URL with the appropriate MIME type
        // Try to determine the MIME type from the response headers
        let mimeType = response.headers.get('Content-Type') || 'video/mp4';

        // If the MIME type is not a video type, use a generic video type
        if (!mimeType.includes('video/')) {
            mimeType = 'video/mp4';
        }

        // Create a new blob with the explicit MIME type to help the browser
        const typedBlob = new Blob([blob], { type: mimeType });
        const blobUrl = URL.createObjectURL(typedBlob);

        // Clear any existing sources
        while (videoElement.firstChild) {
            videoElement.removeChild(videoElement.firstChild);
        }

        // Set the video source to the blob URL
        videoElement.src = blobUrl;

        // Set attributes to improve compatibility
        videoElement.crossOrigin = 'anonymous';
        videoElement.playsInline = true;
        videoElement.preload = 'auto';
        videoElement.muted = false; // Ensure audio is enabled

        // Load and play the video
        videoElement.load();
        await videoElement.play().catch(e => console.warn('Autoplay prevented:', e));

        // Hide loading indicator
        handleVideoLoaded();
    } catch (error) {
        console.error('Error fetching video:', error);
        showError(`Failed to fetch video: ${error.message}`);
    }
}

/**
 * Handles successful video loading
 */
function handleVideoLoaded() {
    // Hide loading indicator when video is loaded
    loadingElement.style.display = 'none';

    // Initialize controls state
    if (userPreferences.useCustomControls) {
        updatePlayPauseState();
        updateVolumeDisplay();
        updateProgress();
        resetControlsTimeout();
    }
}

/**
 * Handles video loading errors
 * @param {Event} event - The error event
 */
function handleVideoError(event) {
    console.error('Video error:', event);
    showError('Failed to load video. The format might be unsupported or the file might be corrupted.');
}

/**
 * Shows an error message to the user
 * @param {string} message - The error message to display
 */
function showError(message) {
    // Hide loading indicator
    loadingElement.style.display = 'none';

    // Show error message
    errorElement.textContent = message;
    errorElement.style.display = 'block';

    // Hide video element
    videoElement.style.display = 'none';

    // Hide custom controls
    if (customControlsElement) {
        customControlsElement.style.display = 'none';
    }
}

// Initialize the player when the DOM is loaded
document.addEventListener('DOMContentLoaded', initPlayer);
