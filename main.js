const { app, BrowserWindow, ipcMain, dialog, Notification } = require('electron');
const path = require('path');
const { organizeDirectory, getNonCategoryFolders, removeFolders, analyzeFiles } = require('./organize-folders.js');
// Keep the category manager reference for internal usage only
const categoryManager = require('./categories.js');
const fileHistory = require('./file-history.js'); // Import file history module
const fs = require('fs');
// Import the scheduler module
const scheduler = require('./automator/scheduler');

let mainWindow;

// Create the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,  // Enable sandbox mode for additional protection
      worldSafeExecuteJavaScript: true, // Ensure JavaScript executes safely
      enableRemoteModule: false // Disable remote module for security
    },
    icon: path.join(__dirname, 'assets/icon.png')  });

  // Set additional security-related HTTP headers
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['SAMEORIGIN'],
        'X-XSS-Protection': ['1; mode=block']
      }
    });
  });
  // Load the index page
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
  createWindow();  // Initialize scheduled tasks when app starts
  scheduler.initializeScheduledTasks();

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

// Create a helper function for showing desktop notifications
function showNotification(title, body, urgency = 'normal') {
  if (!mainWindow) return;
  
  const notification = new Notification({
    title,
    body,
    icon: path.join(__dirname, 'assets/icon.png'),
    timeoutType: 'default',
    urgency,
    silent: false
  });
  
  notification.show();
  
  // Add click handler to focus the app when notification is clicked
  notification.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  
  return notification;
}

// Handle folder organization request
ipcMain.handle('organize-folder', async (event, folderPath, foldersToPreserve = []) => {
  try {
    const result = organizeDirectory(folderPath, foldersToPreserve, true);
    
    // Record the operation for undo functionality
    if (result.success && result.fileMovements && result.fileMovements.length > 0) {
      fileHistory.recordOperation(folderPath, result.fileMovements);
      
      // Show success notification
      const folderName = path.basename(folderPath);
      showNotification(
        'Organization Complete', 
        `Successfully organized ${result.filesMoved} files in ${folderName}`,
        'normal'
      );
    } else if (result.success && result.filesMoved === 0) {
      showNotification(
        'No Changes Made',
        'No files needed organizing. The folder may already be organized or empty.',
        'low'
      );
    }
    
    return result;
  } catch (error) {
    // Show error notification
    showNotification(
      'Organization Failed',
      `Error: ${error.message}`,
      'critical'
    );
    
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
    
    if (removed && removed.length > 0) {
      // Show notification for successful folder cleanup
      showNotification(
        'Cleanup Complete',
        `Successfully removed ${removed.length} non-category folders.`,
        'normal'
      );
    }
    
    return { success: true, removed };
  } catch (error) {
    // Show error notification
    showNotification(
      'Cleanup Failed',
      `Error removing folders: ${error.message}`,
      'critical'
    );
    
    return { success: false, error: error.message };
  }
});

// Handle request to get subfolders in a directory
ipcMain.handle('get-subfolders', async (event, folderPath) => {
  try {
    // Get all subfolders in the selected directory
    const subfolders = fs.readdirSync(folderPath)
      .filter(name => {
        try {
          const fullPath = path.join(folderPath, name);
          return fs.statSync(fullPath).isDirectory();
        } catch (err) {
          return false;
        }
      });
    
    return subfolders;
  } catch (error) {
    console.error('Error getting subfolders:', error);
    return [];
  }
});

// Handle preview of files to be organized (without actually moving them)
ipcMain.handle('preview-files', async (event, folderPath, foldersToPreserve = []) => {
  try {
    const preview = analyzeFiles(folderPath, new Set(foldersToPreserve), true);
    return {
      success: true,
      preview
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Handle undo last operation request
ipcMain.handle('undo-last-operation', async () => {
  try {
    const undoResult = await fileHistory.undoLastOperation();
    
    if (undoResult.success) {
      // Show success notification
      showNotification(
        'Undo Successful',
        `Restored ${undoResult.filesRestored} files to their original locations.`,
        'normal'
      );
    }
    
    return undoResult;
  } catch (error) {
    // Show error notification
    showNotification(
      'Undo Failed',
      `Error: ${error.message}`,
      'critical'
    );
    
    return {
      success: false,
      error: error.message
    };
  }
});

// Check if an undo operation is available
ipcMain.handle('get-undo-status', async () => {
  try {
    const status = fileHistory.getUndoStatus();
    return status;
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
});

// Record a file operation for undo history
ipcMain.handle('record-file-operation', async (event, directory, movedFiles, metadata = {}) => {
  try {
    const result = fileHistory.recordOperation(directory, movedFiles, metadata);
    return { success: result };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Handle scheduling a task
ipcMain.handle('schedule-task', async (event, params) => {
  try {
    const { folderPath, frequency, options } = params;
    
    // Call the scheduler to create a new task
    const taskInfo = scheduler.scheduleTask(folderPath, frequency, options, []);
    
    // Show notification for successful task scheduling
    const folderName = path.basename(folderPath);
    const frequencyText = frequency === 'daily' ? 'daily' : 
                          frequency === 'weekly' ? 'weekly' :
                          frequency === 'monthly' ? 'monthly' : 'custom';
                          
    showNotification(
      'Task Scheduled',
      `${frequencyText.charAt(0).toUpperCase() + frequencyText.slice(1)} organization scheduled for "${folderName}" folder`,
      'normal'
    );
    
    return {
      success: true,
      taskInfo
    };
  } catch (error) {
    console.error('Error scheduling task:', error);
    
    // Show error notification
    showNotification(
      'Scheduling Failed',
      `Error: ${error.message}`,
      'critical'
    );
    
    return {
      success: false,
      error: error.message
    };
  }
});

// Handle canceling a task
ipcMain.handle('cancel-task', async (event, taskId) => {
  try {
    const taskInfo = scheduler.getScheduledTask(taskId);
    const success = scheduler.cancelTask(taskId);
    
    if (success && taskInfo) {
      const folderName = path.basename(taskInfo.folderPath || 'folder');
      // Show notification for successful task cancellation
      showNotification(
        'Task Canceled',
        `Scheduled organization task for "${folderName}" has been canceled.`,
        'normal'
      );
    }
    
    return {
      success
    };
  } catch (error) {
    console.error('Error canceling task:', error);
    
    // Show error notification
    showNotification(
      'Task Cancellation Failed',
      `Error: ${error.message}`,
      'critical'
    );
    
    return {
      success: false,
      error: error.message
    };
  }
});

// Handle getting scheduled tasks
ipcMain.handle('get-scheduled-tasks', async () => {
  try {
    const tasks = scheduler.getScheduledTasks();
    return tasks;
  } catch (error) {
    console.error('Error getting scheduled tasks:', error);
    return [];
  }
});

// Handle getting a specific scheduled task by ID
ipcMain.handle('get-scheduled-task', async (event, taskId) => {
  try {
    const task = scheduler.getScheduledTask(taskId);
    if (!task) {
      return {
        success: false,
        error: `Task with ID ${taskId} not found`
      };
    }
    return task;
  } catch (error) {
    console.error(`Error getting task ${taskId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Handle running a task immediately
ipcMain.handle('run-task-now', async (event, taskId) => {
  try {
    const taskInfo = scheduler.getScheduledTask(taskId);
    const folderName = taskInfo ? path.basename(taskInfo.folderPath || 'folder') : 'Unknown';
    
    // Show notification that the task is starting
    showNotification(
      'Running Organization Task',
      `Starting organization of "${folderName}" folder...`,
      'normal'
    );
    
    const result = await scheduler.runTaskNow(taskId);
    
    if (result.success) {
      // Show completion notification with stats
      showNotification(
        'Task Complete',
        `Successfully organized ${result.filesMoved || 0} files in "${folderName}"`,
        'normal'
      );
    } else {
      // Show error notification
      showNotification(
        'Task Failed',
        `Failed to organize "${folderName}": ${result.error || 'Unknown error'}`,
        'critical'
      );
    }
    
    return result;
  } catch (error) {
    console.error('Error running task:', error);
    
    // Show error notification
    showNotification(
      'Task Execution Failed',
      `Error: ${error.message}`,
      'critical'
    );
    
    return {
      success: false,
      error: error.message
    };
  }
});