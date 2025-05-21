/**
 * file-history.js
 * Tracks file operations and provides undo functionality
 * Created: May 11, 2025
 * Updated: May 12, 2025 - Added enhanced file information for visual comparison
 */

const fs = require('fs');
const path = require('path');

// Store the last operation data
let lastOperation = null;

/**
 * Records a file organization operation
 * @param {string} folderPath - Base folder where organization occurred
 * @param {Array<Object>} movedFiles - Array of file movement records
 * @param {Object} additionalData - Additional data about the operation
 */
function recordOperation(folderPath, movedFiles, additionalData = {}) {
  if (movedFiles && movedFiles.length > 0) {
    // Enhance file records with additional details
    const enhancedMovedFiles = movedFiles.map(file => {
      // Get original file stats if available
      const fileExt = path.extname(file.fileName).toLowerCase();
      const stats = fs.existsSync(file.destinationPath) 
        ? fs.statSync(file.destinationPath) : null;
      
      return {
        ...file,
        fileSize: stats ? stats.size : null,
        fileType: fileExt ? fileExt.substring(1) : null,
        modified: stats ? stats.mtime.getTime() : null,
        created: stats ? stats.birthtime.getTime() : null
      };
    });

    lastOperation = {
      timestamp: Date.now(),
      folderPath,
      movedFiles: enhancedMovedFiles,
      additionalData
    };
    return true;
  }
  return false;
}

/**
 * Performs undo operation for the last file organization
 * @returns {Object} Result of the undo operation
 */
async function undoLastOperation() {
  // Check if there's an operation to undo
  if (!lastOperation) {
    return {
      success: false,
      error: "No previous operation to undo"
    };
  }

  const { folderPath, movedFiles, timestamp } = lastOperation;
  const restored = [];
  const failed = [];

  // Perform undo for each moved file
  for (const fileMove of movedFiles) {
    const { fileName, sourcePath, destinationPath } = fileMove;
    
    try {
      // Check if the destination file still exists
      if (fs.existsSync(destinationPath)) {
        // Check if source directory still exists, if not create it
        const sourceDir = path.dirname(sourcePath);
        if (!fs.existsSync(sourceDir)) {
          fs.mkdirSync(sourceDir, { recursive: true });
        }

        // Move the file back to its original location
        fs.renameSync(destinationPath, sourcePath);
        restored.push({
          ...fileMove,
          undoTime: Date.now()
        });
      } else {
        failed.push({
          fileName,
          reason: "File no longer exists at new location"
        });
      }
    } catch (error) {
      failed.push({
        fileName,
        reason: error.message
      });
    }
  }

  // Clear the last operation after undo
  const result = {
    success: true,
    folderPath,
    timestamp,
    restoredCount: restored.length,
    restoredFiles: restored,
    failedCount: failed.length,
    failedFiles: failed
  };
  
  // Clear last operation only if all files were restored or attempted
  if (restored.length + failed.length === movedFiles.length) {
    lastOperation = null;
  }
  
  return result;
}

/**
 * Check if undo is available
 * @returns {Object} Status of undo availability and operation info
 */
function getUndoStatus() {
  if (!lastOperation) {
    return {
      available: false
    };
  }

  const { folderPath, movedFiles, timestamp, additionalData } = lastOperation;
  return {
    available: true,
    folderPath,
    timestamp,
    fileCount: movedFiles.length,
    additionalData
  };
}

/**
 * Get the last operation data for comparison
 * @returns {Object|null} Last operation data or null if none exists
 */
function getLastOperation() {
  return lastOperation;
}

/**
 * Get an operation by ID (timestamp)
 * @param {string|number} operationId - The ID of the operation to retrieve
 * @returns {Object|null} Operation data or null if not found
 */
function getOperationById(operationId) {
  // First check the current last operation
  if (lastOperation && lastOperation.timestamp.toString() === operationId.toString()) {
    return lastOperation;
  }
  
  // If not found, try to load from history (if history storage is implemented)
  try {
    const history = loadHistory();
    if (history && history.operations) {
      return history.operations.find(op => op.id.toString() === operationId.toString() || 
                                   op.timestamp.toString() === operationId.toString()) || null;
    }
  } catch (err) {
    console.error('Error retrieving operation by ID from history:', err);
  }
  
  return null;
}

module.exports = {
  recordOperation,
  undoLastOperation,
  getUndoStatus,
  getLastOperation,
  getOperationById
};