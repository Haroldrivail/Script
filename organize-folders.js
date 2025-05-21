/**
 * organize-folders.js
 * Script to automatically organize files in a folder
 * Created: April 18, 2025
 * For Windows versions
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const categoryManager = require('./categories.js');

// Define file categories with their corresponding unique extensions (no overlaps)
// Now using the categoryManager to get current categories (custom or default)
function getFileCategories() {
  return categoryManager.getCategories();
}

// Helper: Map extension to category for fast lookup
function getExtensionToCategory() {
  return categoryManager.getExtensionMapping();
}

/**
 * Ensures all files are in the correct category folder, even if legacy folders exist.
 * Moves files from old/incorrect folders to the correct one based on the current unique mapping.
 * Removes empty legacy folders after rearrangement.
 * @param {string} targetPath - Path to organize
 * @param {Set} foldersToPreserve - Set of folder names to preserve (not reorganize)
 * @param {boolean} isPreserveMode - If true, treats the folders list as folders to preserve; if false, treats as folders to exclude
 * @param {Array} fileMovements - Optional array to track file movements for undo
 */
function rearrangeLegacyFolders(targetPath, foldersToPreserve = new Set(), isPreserveMode = false, fileMovements = []) {
    // Get current extension mapping
    const extensionToCategory = getExtensionToCategory();
    
    // Get all folders in the target directory that match any category (legacy or current)
    const allFolders = fs.readdirSync(targetPath)
        .filter(name => {
            const fullPath = path.join(targetPath, name);
            return fs.statSync(fullPath).isDirectory();
        });
    // For each folder, check files and move if needed
    allFolders.forEach(folder => {
        // Skip preserved folders
        if (isPreserveMode && foldersToPreserve.has(folder)) {
            console.log(`Preserving folder: ${folder}`);
            return;
        }
        
        const folderPath = path.join(targetPath, folder);
        // Skip if not a known category or 'Other' (but process anyway for legacy)
        const files = fs.readdirSync(folderPath).filter(f => fs.statSync(path.join(folderPath, f)).isFile());
        files.forEach(fileName => {
            const ext = path.extname(fileName).toLowerCase();
            const correctCategory = extensionToCategory[ext] || 'Other';
            
            // Skip if correct category is preserved
            if (isPreserveMode && foldersToPreserve.has(correctCategory)) {
                return;
            }
            
            if (folder !== correctCategory) {
                // Move to correct folder
                const destFolderPath = path.join(targetPath, correctCategory);
                if (!fs.existsSync(destFolderPath)) {
                    fs.mkdirSync(destFolderPath, { recursive: true });
                }
                const srcFile = path.join(folderPath, fileName);
                const destFile = path.join(destFolderPath, fileName);
                if (!fs.existsSync(destFile)) {
                    fs.renameSync(srcFile, destFile);
                    console.log(`Moved legacy file ${fileName} from ${folder} to ${correctCategory}`);
                    
                    // Track file movement for undo
                    fileMovements.push({
                        fileName,
                        sourcePath: srcFile,
                        destinationPath: destFile
                    });
                }
            }
        });
    });
    
    // Get current categories
    const fileCategories = getFileCategories();
    const currentCategoryNames = new Set([...Object.keys(fileCategories), 'Other']);
    
    // Remove empty legacy folders (except current categories, 'Other', and preserved folders)
    allFolders.forEach(folder => {
        // Skip preserved folders
        if (isPreserveMode && foldersToPreserve.has(folder)) {
            return;
        }
        
        const folderPath = path.join(targetPath, folder);
        if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
            const isCurrentCategory = currentCategoryNames.has(folder);
            const entriesLeft = fs.readdirSync(folderPath);
            const hasFilesOrDirs = entriesLeft.some(entry => {
                const entryPath = path.join(folderPath, entry);
                return fs.statSync(entryPath).isFile() || fs.statSync(entryPath).isDirectory();
            });
            if (!isCurrentCategory && entriesLeft.length === 0) {
                fs.rmdirSync(folderPath);
                console.log(`Removed empty legacy folder: ${folder}`);
            }
        }
    });
}

/**
 * Returns a list of folders in targetPath that are not in fileCategories or 'Other'.
 * @param {string} targetPath
 * @returns {string[]} - List of non-category folder names
 */
function getNonCategoryFolders(targetPath) {
    const fileCategories = getFileCategories();
    const allowedFolders = new Set([...Object.keys(fileCategories), 'Other']);
    const allFolders = fs.readdirSync(targetPath)
        .filter(name => {
            const fullPath = path.join(targetPath, name);
            return fs.statSync(fullPath).isDirectory();
        });
    return allFolders.filter(folder => !allowedFolders.has(folder));
}

/**
 * Removes the given folders from targetPath (recursively).
 * @param {string} targetPath
 * @param {string[]} foldersToRemove
 * @returns {string[]} - List of removed folders
 */
function removeFolders(targetPath, foldersToRemove) {
    const removed = [];
    foldersToRemove.forEach(folder => {
        const folderPath = path.join(targetPath, folder);
        try {
            fs.rmdirSync(folderPath, { recursive: true });
            removed.push(folder);
        } catch (err) {
            // Could log error if needed
        }
    });
    return removed;
}

/**
 * Creates category directories only if there are files for them
 * @param {string} targetPath - Path where folders will be created
 */
function createCategoryDirectories(targetPath) {
    const extensionToCategory = getExtensionToCategory();

    // Get all files in target folder (excluding directories)
    const files = fs.readdirSync(targetPath)
        .filter(file => {
            const filePath = path.join(targetPath, file);
            return fs.statSync(filePath).isFile();
        });
    // Track which categories have files
    const categoriesWithFiles = new Set();
    files.forEach(fileName => {
        const ext = path.extname(fileName).toLowerCase();
        const category = extensionToCategory[ext] || null;
        if (category) {
            categoriesWithFiles.add(category);
        }
    });
    // Create only needed category folders
    categoriesWithFiles.forEach(category => {
        const categoryPath = path.join(targetPath, category);
        if (!fs.existsSync(categoryPath)) {
            fs.mkdirSync(categoryPath, { recursive: true });
            console.log(`Created category folder: ${category}`);
        }
    });
    // Create "Other" folder if there are uncategorized files
    const hasOther = files.some(fileName => {
        const ext = path.extname(fileName).toLowerCase();
        return !extensionToCategory[ext];
    });
    if (hasOther) {
        const otherPath = path.join(targetPath, 'Other');
        if (!fs.existsSync(otherPath)) {
            fs.mkdirSync(otherPath, { recursive: true });
            console.log(`Created category folder: Other`);
        }
    }
}

/**
 * Organizes files into category folders
 * @param {string} targetPath - Path to organize
 * @param {Set} foldersToPreserve - Set of folder names to preserve (not reorganize)
 * @param {boolean} isPreserveMode - If true, treats the folders list as folders to preserve; if false, treats as folders to exclude
 * @param {Array} fileMovements - Optional array to track file movements for undo
 * @returns {Object} - Number of files moved and skipped files
 */
function organizeFiles(targetPath, foldersToPreserve = new Set(), isPreserveMode = false, fileMovements = []) {
    let movedFiles = 0;
    let skippedFiles = [];
    
    const extensionToCategory = getExtensionToCategory();
    const fileCategories = getFileCategories();
    
    // Get all files in target folder (excluding directories)
    const files = fs.readdirSync(targetPath)
        .filter(file => {
            const filePath = path.join(targetPath, file);
            return fs.statSync(filePath).isFile();
        });
    
    // Process each file
    files.forEach(fileName => {
        const filePath = path.join(targetPath, fileName);
        const extension = path.extname(fileName).toLowerCase();
        
        // Find appropriate category directly from mapping
        let destinationFolder = extensionToCategory[extension] || 'Other';
        
        const destinationPath = path.join(targetPath, destinationFolder);
        const destinationFilePath = path.join(destinationPath, fileName);
        
        // Skip if file already exists in destination
        if (fs.existsSync(destinationFilePath)) {
            console.log(`\x1b[33mSkipping ${fileName} - already exists in ${destinationFolder} folder\x1b[0m`);
            return;
        }
        
        // Move the file
        try {
            fs.renameSync(filePath, destinationFilePath);
            console.log(`\x1b[32mMoved ${fileName} to ${destinationFolder} folder\x1b[0m`);
            
            // Track file movement for undo
            fileMovements.push({
                fileName,
                sourcePath: filePath,
                destinationPath: destinationFilePath
            });
            
            movedFiles++;
        } catch (error) {
            if (error.code === 'EBUSY' || error.code === 'EPERM') {
                console.warn(`\x1b[33mSkipped (in use/locked): ${fileName}\x1b[0m`);
                skippedFiles.push(fileName);
            } else {
                console.error(`\x1b[31mFailed to move ${fileName}: ${error.message}\x1b[0m`);
            }
        }
    });
    
    console.log(`\n\x1b[36mOrganization complete - moved ${movedFiles} files.\x1b[0m`);
    if (skippedFiles.length > 0) {
        console.log(`\x1b[33mSkipped files (in use/locked):\n${skippedFiles.join('\n')}\x1b[0m`);
    }
    return { movedFiles, skippedFiles };
}

/**
 * Shows a summary of files in each category
 * @param {string} targetPath - Path to summarize
 * @returns {Object} Statistics for each category
 */
function displaySummary(targetPath) {
    console.log(`\n\x1b[35mFolder has been organized into the following categories:\x1b[0m`);
    
    const fileCategories = getFileCategories();
    const stats = {};
    
    // Count files in each category
    Object.keys(fileCategories).forEach(category => {
        const categoryPath = path.join(targetPath, category);
        if (fs.existsSync(categoryPath)) {
            const fileCount = fs.readdirSync(categoryPath).filter(file => 
                fs.statSync(path.join(categoryPath, file)).isFile()
            ).length;
            
            console.log(`${category}: ${fileCount} files`);
            stats[category] = fileCount;
        }
    });
    
    // Count files in Other category
    const otherPath = path.join(targetPath, 'Other');
    if (fs.existsSync(otherPath)) {
        const otherFileCount = fs.readdirSync(otherPath).filter(file => 
            fs.statSync(path.join(otherPath, file)).isFile()
        ).length;
        
        console.log(`Other: ${otherFileCount} files`);
        stats['Other'] = otherFileCount;
    }
    
    return stats;
}

/**
 * Analyzes files and provides a preview of organization without moving files
 * @param {string} targetPath - Path to analyze
 * @param {Set} foldersToPreserve - Set of folder names to preserve (not reorganize)
 * @param {boolean} isPreserveMode - If true, treats the folders list as folders to preserve; if false, treats as folders to exclude
 * @returns {Object} - Analysis of what would be moved
 */
function analyzeFiles(targetPath, foldersToPreserve = new Set(), isPreserveMode = false) {
    const extensionToCategory = getExtensionToCategory();
    const fileCategories = getFileCategories();
    const previewResults = {};
    const skippedFiles = [];
    
    // Initialize result structure
    const result = {
        filesByCategory: {},
        totalFiles: 0,
        skippedFiles: [],
        categoryMappings: {} // Store which extensions map to which categories
    };
    
    // Initialize categoryMappings for better reporting
    Object.entries(fileCategories).forEach(([category, extensions]) => {
        result.categoryMappings[category] = extensions;
        // Initialize all categories in filesByCategory with empty arrays
        result.filesByCategory[category] = [];
    });
    
    // Add 'Other' category as well
    result.filesByCategory['Other'] = [];
    
    // Get all files in target folder (excluding directories)
    const files = fs.readdirSync(targetPath)
        .filter(file => {
            try {
                const filePath = path.join(targetPath, file);
                return fs.statSync(filePath).isFile();
            } catch (err) {
                return false;
            }
        });
    
    // Sort files alphabetically for consistent preview display
    files.sort((a, b) => a.localeCompare(b));
    
    // Process each file
    files.forEach(fileName => {
        const filePath = path.join(targetPath, fileName);
        const extension = path.extname(fileName).toLowerCase();
        
        // Get file stats for additional info
        let fileStats;
        try {
            fileStats = fs.statSync(filePath);
        } catch (err) {
            fileStats = null;
        }
        
        // Find appropriate category directly from mapping
        let destinationFolder = extensionToCategory[extension] || 'Other';
        
        // Skip if destination folder is in preserved folders list
        if (isPreserveMode && foldersToPreserve.has(destinationFolder)) {
            skippedFiles.push({
                fileName,
                reason: `destination folder ${destinationFolder} is preserved`,
                stats: fileStats ? {
                    size: fileStats.size,
                    modified: fileStats.mtime.toISOString(),
                    created: fileStats.birthtime.toISOString(),
                    extension: extension
                } : null
            });
            return;
        }
        
        const destinationPath = path.join(targetPath, destinationFolder);
        const destinationFilePath = path.join(destinationPath, fileName);
        
        // Check if file already exists in destination
        if (fs.existsSync(destinationFilePath)) {
            skippedFiles.push({
                fileName,
                reason: `already exists in ${destinationFolder} folder`,
                stats: fileStats ? {
                    size: fileStats.size,
                    modified: fileStats.mtime.toISOString(),
                    created: fileStats.birthtime.toISOString(),
                    extension: extension
                } : null
            });
            return;
        }
        
        // Make sure the category exists in the result
        if (!result.filesByCategory[destinationFolder]) {
            result.filesByCategory[destinationFolder] = [];
        }
        
        // Add file with metadata
        result.filesByCategory[destinationFolder].push({
            name: fileName,
            path: filePath,
            stats: fileStats ? {
                size: fileStats.size,
                modified: fileStats.mtime.toISOString(),
                created: fileStats.birthtime.toISOString(),
                extension: extension
            } : null
        });
        
        result.totalFiles++;
    });
    
    // Sort skipped files alphabetically
    skippedFiles.sort((a, b) => a.fileName.localeCompare(b.fileName));
    result.skippedFiles = skippedFiles;
    
    return result;
}

/**
 * Main function to organize a specified directory
 * @param {string} directoryPath - Directory to organize (defaults to Downloads)
 * @param {string[]} foldersList - Array of folder names to preserve/exclude
 * @param {boolean} isPreserveMode - If true, treats the folders list as folders to preserve; if false, treats as folders to exclude
 * @returns {Object} Result of organization with statistics
 */
function organizeDirectory(directoryPath = path.join(os.homedir(), 'Downloads'), foldersList = [], isPreserveMode = true) {
    console.log(`Organizing files in: ${directoryPath}`);
    if (isPreserveMode) {
        console.log(`Folders to preserve: ${foldersList.join(', ') || 'None'}`);
    } else {
        console.log(`Folders to exclude: ${foldersList.join(', ') || 'None'}`);
    }
    
    try {
        // Convert foldersList to a Set for faster lookups
        const foldersSet = new Set(foldersList);
        
        // Track file movements for undo functionality
        const fileMovements = [];
        
        // Modified to handle preserved folders and track file movements
        const rearrangeFn = (targetPath) => {
            rearrangeLegacyFolders(targetPath, foldersSet, isPreserveMode, fileMovements);
        };
        
        rearrangeFn(directoryPath); // Rearrange legacy folders first
        createCategoryDirectories(directoryPath);
        const { movedFiles, skippedFiles } = organizeFiles(directoryPath, foldersSet, isPreserveMode, fileMovements);
        const stats = displaySummary(directoryPath);
        
        return {
            success: true,
            directoryPath,
            filesMoved: movedFiles,
            skippedFiles,
            stats,
            preservedFolders: isPreserveMode ? Array.from(foldersSet) : [],
            fileMovements // Include file movements for tracking/undo
        };
    } catch (error) {
        console.error(`\x1b[31mAn error occurred: ${error.message}\x1b[0m`);
        return {
            success: false,
            directoryPath,
            error: error.message
        };
    }
}

// Run directly from command line if called directly
if (require.main === module) {
    console.log('Starting file organization process...');
    const downloadsPath = path.join(os.homedir(), 'Downloads');
    organizeDirectory(downloadsPath);
    console.log('\nPress Ctrl+C to exit...');
}

module.exports = {
    organizeDirectory,
    getNonCategoryFolders,
    removeFolders,
    analyzeFiles
};