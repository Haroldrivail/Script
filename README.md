# Folder Organizer

A modern, GUI-driven app for Windows that organizes your files into smart categories with a single click. Built with Electron.

## Features

- **Automatic File Organization**: Sorts files into uniquely defined categories (Documents, Images, Videos, etc.) with no extension overlaps.
- **Legacy Folder Cleanup**: Detects and proposes removal of old/unknown folders after organizing.
- **Modern UI/UX**: Clean, responsive interface with clear feedback and modal dialogs.
- **Safe Operations**: Skips locked/in-use files and warns you about them.
- **No CLI Prompts**: All interactions are handled in the GUI.
- **Summary Statistics**: See how many files were organized in each category.

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

1. Click **Browse...** to select a folder (e.g., Downloads).
2. Click **Organize Files** to sort files into categories.
3. If legacy/non-category folders are found, a dialog will appear to let you remove them.
4. View a summary of organized files by category.

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

- Documents, Spreadsheets, Presentations, Images, Videos, Audio, Compressed, Executables, Code, Fonts, Backups, Scripts, Miscellaneous, Shortcuts, WebApps, WebPages, Other

## Planned Features / Ideas

- Custom category management (user-defined categories)
- Preview changes before organizing
- Undo/restore last action
- Scheduled/automatic organization
- Drag-and-drop folder selection
- Multi-folder support
- Detailed logs/history
- File type icons in UI
- Exclude/ignore list
- Localization (multi-language)
- Dark mode
- Cloud storage support
- Duplicate file detection
- Advanced filters (size, date, etc.)
- Desktop notifications

## Contributing
Pull requests and feature suggestions are welcome!

## License
MIT

---
*Last updated: May 1, 2025*