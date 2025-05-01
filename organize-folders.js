/**
 * organize-folders.js
 * Script to automatically organize files in a folder
 * Created: April 18, 2025
 * For Windows versions
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Define file categories with their corresponding unique extensions (no overlaps)
const fileCategories = {
    Documents: ['.docx', '.doc', '.rtf', '.txt', '.md', '.pdf'],
    Spreadsheets: ['.xlsx', '.xls', '.csv', '.ods'],
    Presentations: ['.pptx', '.ppt', '.key', '.odp'],
    Images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp', '.ico', '.raw', '.heic'],
    Videos: ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm', '.m4v', '.mpeg', '.3gp'],
    Audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus'],
    Compressed: ['.zip', '.rar', '.7z', '.zipx', '.tar', '.gz', '.bz2', '.xz', '.iso', '.cab', '.tgz', '.tar.gz', '.tar.bz2', '.tar.xz'],
    Executables: ['.exe', '.msi', '.bat', '.cmd', '.ps1', '.vbs', '.reg'],
    Code: ['.py', '.js', '.java', '.c', '.cpp', '.cs', '.php', '.rb', '.go', '.ts', '.json', '.xml'],
    Fonts: ['.ttf', '.otf', '.woff', '.woff2', '.eot', '.fon'],
    Backups: ['.bak', '.old', '.swp', '.swo', '.sav'],
    Scripts: ['.sh', '.bash', '.zsh', '.fish', '.ksh', '.csh'],
    Miscellaneous: ['.log', '.tmp', '.cache', '.pid', '.lock', '.sql', '.sqlite', '.db'],
    Shortcuts: ['.lnk', '.url', '.desktop'],
    WebApps: ['.appx', '.appxbundle', '.msix', '.msixbundle'],
    WebPages: ['.htm', '.xhtml', '.jsp', '.asp']
};

// Helper: Map extension to category for fast lookup
const extensionToCategory = {};
Object.entries(fileCategories).forEach(([category, extensions]) => {
    extensions.forEach(ext => {
        extensionToCategory[ext] = category;
    });
});

/**
 * Ensures all files are in the correct category folder, even if legacy folders exist.
 * Moves files from old/incorrect folders to the correct one based on the current unique mapping.
 * Removes empty legacy folders after rearrangement.
 * @param {string} targetPath - Path to organize
 */
function rearrangeLegacyFolders(targetPath) {
    // Get all folders in the target directory that match any category (legacy or current)
    const allFolders = fs.readdirSync(targetPath)
        .filter(name => {
            const fullPath = path.join(targetPath, name);
            return fs.statSync(fullPath).isDirectory();
        });
    // For each folder, check files and move if needed
    allFolders.forEach(folder => {
        const folderPath = path.join(targetPath, folder);
        // Skip if not a known category or 'Other' (but process anyway for legacy)
        const files = fs.readdirSync(folderPath).filter(f => fs.statSync(path.join(folderPath, f)).isFile());
        files.forEach(fileName => {
            const ext = path.extname(fileName).toLowerCase();
            const correctCategory = extensionToCategory[ext] || 'Other';
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
                }
            }
        });
    });
    // Remove empty legacy folders (except current categories and 'Other')
    allFolders.forEach(folder => {
        const folderPath = path.join(targetPath, folder);
        if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
            const isCurrentCategory = Object.keys(fileCategories).includes(folder) || folder === 'Other';
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
 * @returns {Object} - Number of files moved and skipped files
 */
function organizeFiles(targetPath) {
    let movedFiles = 0;
    let skippedFiles = [];
    
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
        
        // Find appropriate category
        let destinationFolder = 'Other';
        for (const [category, extensions] of Object.entries(fileCategories)) {
            if (extensions.includes(extension)) {
                destinationFolder = category;
                break;
            }
        }
        
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
 * Main function to organize a specified directory
 * @param {string} directoryPath - Directory to organize (defaults to Downloads)
 * @returns {Object} Result of organization with statistics
 */
function organizeDirectory(directoryPath = path.join(os.homedir(), 'Downloads')) {
    console.log(`Organizing files in: ${directoryPath}`);
    
    try {
        rearrangeLegacyFolders(directoryPath); // Rearrange legacy folders first
        createCategoryDirectories(directoryPath);
        const { movedFiles, skippedFiles } = organizeFiles(directoryPath);
        const stats = displaySummary(directoryPath);
        
        return {
            success: true,
            directoryPath,
            filesMoved: movedFiles,
            skippedFiles,
            stats
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
    fileCategories,
    getNonCategoryFolders,
    removeFolders
};