const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    selectFolder: async () => {
      return await ipcRenderer.invoke('select-folder');
    },
    organizeFolder: async (folderPath, foldersToPreserve = []) => {
      return await ipcRenderer.invoke('organize-folder', folderPath, foldersToPreserve);
    },
    previewFiles: async (folderPath, foldersToPreserve = []) => {
      return await ipcRenderer.invoke('preview-files', folderPath, foldersToPreserve);
    },
    getNonCategoryFolders: async (folderPath) => {
      return await ipcRenderer.invoke('get-non-category-folders', folderPath);
    },
    getSubfolders: async (folderPath) => {
      return await ipcRenderer.invoke('get-subfolders', folderPath);
    },
    removeFolders: async (folderPath, foldersToRemove) => {
      return await ipcRenderer.invoke('remove-folders', folderPath, foldersToRemove);
    },
    // Undo functionality APIs
    undoLastOperation: async () => {
      return await ipcRenderer.invoke('undo-last-operation');
    },
    getFileUndoStatus: async () => {
      return await ipcRenderer.invoke('get-undo-status');
    },
    recordFileOperation: async (directory, movedFiles, metadata = {}) => {
      return await ipcRenderer.invoke('record-file-operation', directory, movedFiles, metadata);
    },
    // Scheduler APIs
    scheduleTask: async (params) => {
      return await ipcRenderer.invoke('schedule-task', params);
    },
    cancelTask: async (taskId) => {
      return await ipcRenderer.invoke('cancel-task', taskId);
    },
    getScheduledTasks: async () => {
      return await ipcRenderer.invoke('get-scheduled-tasks');
    },
    getScheduledTask: async (taskId) => {
      return await ipcRenderer.invoke('get-scheduled-task', taskId);
    },
    runScheduledTask: async (taskId) => {
      return await ipcRenderer.invoke('run-task-now', taskId);
    },
    // Add send method for one-way communications
    send: (channel, data) => {
      // Only allow specified channels
      const validChannels = ['execute-undo'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    }
  }
);

// Listen for specific events from main process
ipcRenderer.on('check-undo-availability', () => {
  // This will be triggered when notifications are clicked
  document.dispatchEvent(new CustomEvent('check-undo-availability'));
});