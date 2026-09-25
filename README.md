# Chrome Toolkit - Import/Export Extension

A powerful Chrome extension to export and import your browsing history and bookmarks between Chromium-based browsers.

![Chrome Toolkit](icons/icon128.png)

## Features

✅ **Export Bookmarks** - Save your bookmarks as JSON  
✅ **Export History** - Export up to 100,000 history entries  
✅ **Import Bookmarks** - Restore bookmarks from JSON file  
✅ **Import History** - Import history from extension exports, Google Takeout files, or JSON arrays  
✅ **Background Processing** - Imports run in background without freezing  
✅ **Progress Tracking** - Real-time progress updates  
✅ **Fast & Reliable** - Handles large exports without freezing the browser  

## Installation

### From Source

1. Clone this repository:
   ```bash
   git clone git@github.com:mekartikshah/chromium-import-export.git
   cd chromium-import-export
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top-right)

4. Click "Load unpacked"

5. Select the `chromium-import-export` folder (the repository root)

### From Chrome Web Store

[Chrome Toolkit - Export/Import on the Chrome Web Store](https://chromewebstore.google.com/detail/chrome-toolkit-exportimpo/mfaekebjljbgajfhplladimfindpmppo)

## Usage

### Exporting Data

1. Click the extension icon in your browser toolbar
2. Choose "Export Bookmarks" or "Export History"
3. Save the JSON file to your computer

### Importing Data

1. Click the extension icon
2. Choose "Import Bookmarks" or "Import History"
3. Select your previously exported JSON file
4. Wait for the import to complete (runs in background)

**Note:** You can close the popup during import - it will continue in the background!

## Technical Details

### Supported Browsers

- Google Chrome
- Microsoft Edge
- Brave
- Opera
- Any Chromium-based browser

### Import Performance

- **Capacity:** Up to 100,000 history items
- **Skipped Items:** Only chrome-extension:// URLs cannot be restored
- **Speed:** Varies by machine. Imports run in the background, so you can close the popup; a 100K-entry history can take tens of minutes

### What Gets Preserved

✅ **URLs** - All web addresses  
❌ **Visit Dates** - Imported entries are added with the current date; Chrome's API cannot restore original timestamps  
❌ **Titles** - Not preserved (Chrome API limitation)  
❌ **Visit Counts** - Not preserved (Chrome API limitation)  

## Limitations

Due to Chrome API restrictions:

- Titles are not imported (will be fetched when you visit the URLs)
- Visit counts and typed counts are not preserved
- Visit dates are not preserved; imported entries get the current date
- Chrome extension URLs (chrome-extension://) cannot be imported
- History import accepts files exported by this extension (JSON with `"type": "history"`), Google Takeout "Browser History" files, bare JSON arrays of history items, and files in `{"urls": [...]}` format. Anything else is rejected with an error that names the supported formats.

## Development

### Project Structure

```
chromium-import-export/
├── manifest.json       # Extension configuration
├── popup.html         # Extension popup UI
├── popup.css          # Popup styling
├── popup.js           # Popup logic
├── background.js      # Service worker for background imports
├── icons/             # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md          # This file
├── LICENSE            # MIT License
├── CHANGELOG.md       # Version history
└── DEBUGGING.md       # Debugging guide
```

### Key Technologies

- **Manifest V3** - Latest Chrome extension format
- **Service Workers** - Background processing
- **Chrome APIs** - History, Bookmarks, Downloads, Alarms

## Privacy

This extension:

- ✅ Runs completely locally (no data sent to servers)
- ✅ Only accesses data you explicitly export/import
- ✅ No tracking or analytics
- ✅ Open source - you can review the code

## Troubleshooting

### Import stops after 10 minutes

- **Fixed!** The extension now uses keepalive alarms to prevent timeout
- Imports can run for hours if needed

### All items showing as skipped

- Make sure you're importing the correct file type (history vs bookmarks)
- Check the service worker console for detailed error messages

### Error "Invalid file type. Expected a history export from this extension"

- The error names the supported formats. History files must be one of: this extension's own export (JSON with `"type": "history"`), a Google Takeout "Browser History" file, a bare array of history items, or a `{"urls": [...]}` file. Check the first few lines of your file against those shapes.

### Debugging

1. Go to `chrome://extensions/`
2. Find the extension and click "service worker"
3. View console logs for detailed import progress

See [DEBUGGING.md](DEBUGGING.md) for more details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Author

**Kartik Shah**

- LinkedIn: [linkedin.com/in/mekartikshah](https://linkedin.com/in/mekartikshah)
- Twitter: [x.com/mekartikshah](https://x.com/mekartikshah)

## Support

If this extension saves you time, you can buy me a coffee: [buymeacoffee.com/kartikshah](https://buymeacoffee.com/kartikshah)

## Changelog

### Version 1.0.2 (2026-09-22)

- ☕ Added a "Buy Me a Coffee" link in the popup footer (buymeacoffee.com/kartikshah) so users can support the project.

### Version 1.0.1 (2026-04-22)

- 🐛 **Fixed History Import:** Removed unsupported `visitTime` parameter causing total import failure in Manifest V3.
- 🐛 **Fixed Bookmarks Flattening:** Preserved the original folder structure (e.g. "Bookmarks Bar") during import instead of mixing everything into a single root folder.
- ⚡ **Enhanced Background Reliability:** Added a background keepalive heartbeat to Bookmarks imports, preventing silent worker termination on huge imports.
- 🤖 **Automated Testing:** Integrated Puppeteer and Jest for comprehensive E2E UI and API automated testing.
- ✨ **Better Downloads UX:** Disabled OS `saveAs` dialogue popups during export for faster and more seamless testing/usage.

### Version 1.0.0 (2025-12-11)

- ✅ Initial release
- ✅ Export/Import bookmarks
- ✅ Export/Import history with original dates
- ✅ Background processing with keepalive
- ✅ Progress tracking
- ✅ Modern UI with gradient design

## Support

If you find this extension helpful, please:

- ⭐ Star this repository
- 🐛 Report bugs via GitHub Issues
- 💡 Suggest features via GitHub Issues

---

Made with ❤️ by [Kartik Shah](https://linkedin.com/in/mekartikshah)
