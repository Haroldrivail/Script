# Folder Organizer

A GUI-driven app for Windows that organizes your files into smart categories with a single click. Built with Electron.

> **Version 2.0.0 Update**: The application now features a new UI with dark mode support. See [UI-MIGRATION-SUMMARY.md](UI-MIGRATION-SUMMARY.md) for details.

## Features

- **Automatic File Organization**: Sorts files into uniquely defined categories (Documents, Images, Videos, etc.) with no extension overlaps.
- **Legacy Folder Cleanup**: Detects and proposes removal of old/unknown folders after organizing.
- **Clean UI/UX**: Responsive interface with dark mode support and card-based layout.
- **Safe Operations**: Skips locked/in-use files and warns you about them.
- **No CLI Prompts**: All interactions are handled in the GUI.
- **Summary Statistics**: See how many files were organized in each category.
- **Scheduled Organization**: Automatically organize folders on a recurring schedule (daily, weekly, or monthly).
- **Undo Support**: Easily undo the last organization operation if needed.
- **Custom Categories**: Create and manage your own file categories and extensions.
- **Dark/Light Mode**: Toggle between themes with automatic system preference detection.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or later recommended)
- [Git](https://git-scm.com/) (optional, for cloning)

### Installation
1. **Clone the repository**
   ```sh
   git clone 'https://github.com/Haroldrivail/Script.git'
   cd Script
   ```
2. **Install dependencies**
   ```sh
   npm install
   ```

### Running the App (Development)
```sh
npm start
```

## Usage

### Basic File Organization
1. Click **Browse...** to select a folder (e.g., Downloads).
2. Click **Organize Files** to sort files into categories.
3. If legacy/non-category folders are found, a dialog will appear to let you remove them.
4. View a summary of organized files by category.

### Scheduled Organization
1. Click **Schedule Tasks** in the header navigation.
2. Select a folder to organize automatically.
3. Choose a frequency (daily, weekly, or monthly) and set the time.
4. Click **Create Schedule** to save your scheduled task.
5. The app will automatically organize the folder according to your schedule, even when not running (the app will start automatically when your system boots).

### Custom Categories
1. Click **Manage Categories** in the header navigation.
2. Add new categories with custom file extensions.
3. Edit or delete existing categories.
4. Reset to default categories if needed.

### Theme Switching
- Click the theme toggle button in the top navigation to switch between light and dark modes.
- The app will automatically detect your system's theme preference on startup.

## Building Executables

You can build a standalone executable for Windows using [electron-builder](https://www.electron.build/):

```sh
npm run build:windows
```

- The output will be in the `dist/` folder.
- You can distribute the `.exe` or the portable version as needed.

### Updating the Executable
- To update, pull the latest code and run the build command again.
- If you want auto-update support, see [electron-builder auto-update docs](https://www.electron.build/auto-update) (not enabled by default).

## Categories

By default, the app organizes files into these categories:
- Documents, Spreadsheets, Presentations
- Images, Videos, Audio
- Compressed, Executables
- Code, Fonts, Backups, Scripts  
- Miscellaneous, Shortcuts, WebApps, WebPages, Other

You can manage your own custom categories in the Categories section.

## Planned Features / Ideas

- Drag-and-drop folder selection
- Multi-folder support
- Detailed logs/history
- File type icons in UI
- Exclude/ignore list
- Localization (multi-language)
- Enhanced security features:
  - Path validation and sanitization
  - Content Security Policy implementation
  - Permission management system
  - Security audit logging
  - Dependency vulnerability scanning
  - Sandboxed operations for sensitive file tasks
- Cloud storage support
- Duplicate file detection
- Advanced filters (size, date, etc.)
- Desktop notifications

## Contributing
Pull requests and feature suggestions are welcome!

## License
MIT

---
*Last updated: May 21, 2025 - Version 2.0.0*