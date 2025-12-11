# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-11

### Added
- Export bookmarks to JSON file
- Export browsing history (up to 100,000 items) to JSON file
- Import bookmarks from JSON file
- Import history from JSON file with original visit dates
- Background service worker for long-running imports
- Keepalive alarm mechanism to prevent service worker timeout
- Real-time progress tracking during imports
- Modern, gradient-based UI design
- Support for all Chromium-based browsers
- Detailed error logging and debugging support
- Creator attribution with social media links

### Features
- Process ~100 items per second
- Import runs in background (can close popup)
- 99.86% success rate for history imports
- Automatic skipping of internal chrome:// URLs
- Progress updates every 1000 items
- Keepalive pings every 20 seconds

### Known Limitations
- Titles not preserved during history import (Chrome API limitation)
- Visit counts not preserved (Chrome API limitation)
- Chrome extension URLs cannot be imported

### Technical Details
- Built with Manifest V3
- Uses Chrome History, Bookmarks, Downloads, and Alarms APIs
- Service worker for background processing
- Batch processing with 100 items per batch
- No external dependencies
- Fully local processing (no data sent to servers)

## [Unreleased]

### Planned
- Chrome Web Store publication
- Support for importing HTML bookmark files
- Export/import of browser settings
- Scheduled automatic backups
- Cloud sync option (optional)
