# MovStream

MovStream is a Chrome extension that allows users to play .mov files directly in the browser without the need to download the files or use additional software.

## Features

- Automatically intercepts .mov file downloads and plays them in the browser
- Works with direct .mov file links and files with Content-Disposition headers
- Clean, full-screen video player with standard controls
- Supports all modern browsers that can play MP4 content

## How It Works

When you click on a link to a .mov file, Chrome normally tries to download it because it can't play this format natively. MovStream intercepts this download, cancels it, and instead opens a new tab with a custom player that can play the .mov file as if it were an MP4 file (which most modern browsers support).

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the folder containing the extension
5. The extension is now installed and ready to use

## Usage

Simply click on any link to a .mov file in your browser. Instead of downloading, the file will open in a new tab and play automatically.

## Technical Details

- Built with Manifest V3 for Chrome Extensions
- Uses modern JavaScript with async/await
- Handles both direct .mov files and those served with Content-Disposition headers
- Minimal permissions required for functionality

## License

See the LICENSE file for details.
