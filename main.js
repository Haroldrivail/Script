const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { organizeDirectory, getNonCategoryFolders, removeFolders } = require('./organize-folders.js'); // Import the organizeDirectory function
const fs = require('fs');

let mainWindow;

// Create the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  // Load the index.html file
  mainWindow.loadFile('index.html');

  // Open DevTools in development mode
  // mainWindow.webContents.openDevTools();

  // Event when window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create window when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Handle folder selection dialog
ipcMain.handle('select-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (canceled) {
    return null;
  } else {
    return filePaths[0];
  }
});

// Handle folder organization request
ipcMain.handle('organize-folder', async (event, folderPath) => {
  try {
    const result = organizeDirectory(folderPath);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Handle request to get non-category folders
ipcMain.handle('get-non-category-folders', async (event, folderPath) => {
  try {
    const folders = getNonCategoryFolders(folderPath);
    return { success: true, folders };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Handle request to remove non-category folders
ipcMain.handle('remove-folders', async (event, folderPath, foldersToRemove) => {
  try {
    const removed = removeFolders(folderPath, foldersToRemove);
    return { success: true, removed };
  } catch (error) {
    return { success: false, error: error.message };
  }
});