# Debugging Import Issues - Quick Guide

## How to Debug the Extension

1. **Open Chrome DevTools for the Extension**
   - Right-click the extension icon
   - Select "Inspect popup"
   - This opens DevTools for the extension popup
   - Go to the "Console" tab

2. **Test Bookmark Import**
   - With DevTools open, click "Import Bookmarks"
   - Select your exported JSON file
   - Watch the Console for detailed logs:
     - Import data structure
     - Current bookmark tree
     - Each node being processed
     - Success/failure for each bookmark
     - Total count at the end

3. **Test History Import**
   - With DevTools open, click "Import History"
   - Select your exported JSON file
   - Watch the Console for:
     - Total items to import
     - URLs being imported (first 5)
     - Skipped URLs (internal chrome:// URLs)
     - Final count (imported + skipped)

## Common Issues Fixed

### Bookmarks
- ✅ System folders (Bookmarks Bar, Other Bookmarks) are now handled correctly
- ✅ Empty folders are skipped
- ✅ Better error handling for invalid bookmarks
- ✅ Detailed logging shows exactly what's being imported

### History
- ✅ Internal URLs (chrome://, chrome-extension://, about:) are now skipped
- ✅ Invalid URL formats are caught and skipped
- ✅ Batch size reduced to 50 for better reliability
- ✅ Shows count of both imported and skipped items

## What to Look For

**If bookmarks show 0 imported:**
- Check console for "Processing node:" messages
- Look for any error messages in red
- Verify the JSON structure matches expected format

**If history shows 0 imported:**
- Check if all URLs are internal (chrome://, etc.)
- Look for "Skipping internal URL:" messages
- Check for "Failed to import URL:" errors

## Expected Console Output

### Successful Bookmark Import:
```
Import data: {exportDate: "...", type: "bookmarks", ...}
Current bookmark tree: [...]
Other Bookmarks folder: {...}
Created import folder: {...}
Starting import from data.length: 1
Processing root node: {...}
Processing system folder children: Bookmarks Bar
  Processing node: Example Bookmark Type: bookmark
  ✓ Created bookmark: Example Bookmark
Total bookmarks imported: 5
```

### Successful History Import:
```
History import data: {exportDate: "...", type: "history", count: 100, ...}
Total history items to import: 100
Skipping internal URL: chrome://extensions/
✓ Imported: https://example.com
✓ Imported: https://google.com
Import complete. Imported: 95, Skipped: 5
```

## Next Steps

1. Reload the extension in chrome://extensions/
2. Open DevTools (right-click icon → Inspect popup)
3. Try importing again
4. Share the console output if issues persist
