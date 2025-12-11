# Chrome Toolkit - Import/Export Extension

A powerful Chrome extension to export and import your browsing history and bookmarks between Chromium-based browsers.

![Chrome Toolkit](icons/icon128.png)

## Features

✅ **Export Bookmarks** - Save your bookmarks as JSON  
✅ **Export History** - Export up to 100,000 history entries  
✅ **Import Bookmarks** - Restore bookmarks from JSON file  
✅ **Import History** - Import history with original visit dates  
✅ **Background Processing** - Imports run in background without freezing  
✅ **Progress Tracking** - Real-time progress updates  
✅ **Fast & Reliable** - Process 100+ items per second  

## Installation

### From Source

1. Clone this repository:
   ```bash
   git clone git@github.com:mekartikshah/chromium-import-export.git
   cd chromium-import-export/chrome-toolkit
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top-right)

4. Click "Load unpacked"

5. Select the `chrome-toolkit` folder

### From Chrome Web Store

Coming soon! (Link will be added after publication)

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

- **Speed:** ~100 items/second
- **Capacity:** Up to 100,000 history items
- **Success Rate:** 99.86% (only skips chrome-extension:// URLs)
- **Time:** 10-15 minutes for 100K items

### What Gets Preserved

✅ **URLs** - All web addresses  
✅ **Visit Dates** - Original visit timestamps  
❌ **Titles** - Not preserved (Chrome API limitation)  
❌ **Visit Counts** - Not preserved (Chrome API limitation)  

## Limitations

Due to Chrome API restrictions:

- Titles are not imported (will be fetched when you visit the URLs)
- Visit counts and typed counts are not preserved
- Chrome extension URLs (chrome-extension://) cannot be imported

## Development

### Project Structure

```
chrome-toolkit/
├── manifest.json       # Extension configuration
├── popup.html         # Extension popup UI
├── popup.css          # Popup styling
├── popup.js           # Popup logic
├── background.js      # Service worker for background imports
├── icons/             # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # This file
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

## Changelog

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
