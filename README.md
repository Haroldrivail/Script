# Folder Organizer

A desktop application that automatically organizes files into categorized folders based on file extensions.

## Features

- **Simple Interface**: User-friendly GUI for selecting and organizing folders
- **Smart Organization**: Automatically categorizes files based on their extensions
- **File Type Detection**: Supports various file types including documents, images, videos, audio, and more
- **Statistics**: Provides a summary of organized files by category
- **Cross-Platform**: Works on Windows, macOS, and Linux (built with Electron)

## Installation

### Windows

1. Download the latest release from the Releases page
2. Choose either:
   - **Portable version** (`FolderOrganizer-1.0.0.exe`): Run directly without installation
   - **Installer** (`FolderOrganizer-Setup-1.0.0.exe`): Install the application on your system

### From Source

If you prefer to build from source:

```bash
# Clone the repository
git clone https://github.com/Haroldrivail/Script.git

# Navigate to the directory
cd Script

# Install dependencies
npm install

# Run the application
npm start

# Build executables
npm run build
```

## Usage

1. Launch the Folder Organizer application
2. Click the "Browse..." button to select a folder to organize
3. Press the "Organize Files" button
4. Files will be sorted into categorized folders based on their file types

## File Categories

The application organizes files into the following categories based on extensions:

| Category | File Extensions |
|----------|----------------|
| Documents | .pdf, .docx, .xlsx, .pptx, .txt, .rtf, .doc, .xls, .ppt, .csv, .md |
| Images | .jpg, .jpeg, .png, .gif, .bmp, .tiff, .svg, .webp, .ico, .raw, .heic |
| Videos | .mp4, .mov, .avi, .mkv, .wmv, .flv, .webm, .m4v, .mpeg, .3gp |
| Audio | .mp3, .wav, .flac, .aac, .ogg, .wma, .m4a, .opus |
| Compressed | .zip, .rar, .7z, .tar, .gz, .bz2, .xz, .iso, .cab |
| Executables | .exe, .msi, .bat, .cmd, .ps1, .vbs, .reg |
| Code | .py, .js, .html, .css, .java, .c, .cpp, .cs, .php, .rb, .go, .ts, .json, .xml |
| PDFs | .pdf |
| Other | Any other file types not listed above |

## Development

This project uses:
- Electron for cross-platform desktop application support
- Node.js for file system operations
- HTML/CSS/JavaScript for the user interface

### Project Structure

- `main.js` - Electron main process
- `renderer.js` - Frontend UI logic
- `preload.js` - Secure bridge between renderer and main processes
- `organize-downloads.js` - Core file organization logic
- `index.html` - Application UI
- `style.css` - Application styling

## Build

The application can be built using electron-builder:

```bash
# Build for current platform
npm run build

# Build specifically for Windows
npm run build:windows
```

Build outputs will be placed in the `dist` directory.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Created

April 18, 2025