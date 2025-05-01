const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    selectFolder: async () => {
      return await ipcRenderer.invoke('select-folder');
    },
    organizeFolder: async (folderPath) => {
      return await ipcRenderer.invoke('organize-folder', folderPath);
    },
    getNonCategoryFolders: async (folderPath) => {
      return await ipcRenderer.invoke('get-non-category-folders', folderPath);
    },
    removeFolders: async (folderPath, foldersToRemove) => {
      return await ipcRenderer.invoke('remove-folders', folderPath, foldersToRemove);
    }
  }
);