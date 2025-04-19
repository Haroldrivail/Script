/**
 * organize-downloads.js
 * Script to automatically organize files in a folder
 * Created: April 18, 2025
 * For Windows 11 version 24H2
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Define file categories with their corresponding extensions
const fileCategories = {
    Documents: ['.pdf', '.docx', '.xlsx', '.pptx', '.txt', '.rtf', '.doc', '.xls', '.ppt', '.csv', '.md'],
    Images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp', '.ico', '.raw', '.heic'],
    Videos: ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm', '.m4v', '.mpeg', '.3gp'],
    Audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus'],
    Compressed: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.iso', '.cab'],
    Executables: ['.exe', '.msi', '.bat', '.cmd', '.ps1', '.vbs', '.reg'],
    Code: ['.py', '.js', '.html', '.css', '.java', '.c', '.cpp', '.cs', '.php', '.rb', '.go', '.ts', '.json', '.xml'],
    PDFs: ['.pdf'] // Special case for PDFs to be in their own category
};

/**
 * Creates category directories if they don't exist
 * @param {string} targetPath - Path where folders will be created
 */
function createCategoryDirectories(targetPath) {
    // Create category folders
    Object.keys(fileCategories).forEach(category => {
        const categoryPath = path.join(targetPath, category);
        if (!fs.existsSync(categoryPath)) {
            fs.mkdirSync(categoryPath, { recursive: true });
            console.log(`Created category folder: ${category}`);
        }
    });
    
    // Create "Other" folder for uncategorized files
    const otherPath = path.join(targetPath, 'Other');
    if (!fs.existsSync(otherPath)) {
        fs.mkdirSync(otherPath, { recursive: true });
        console.log(`Created category folder: Other`);
    }
}

/**
 * Organizes files into category folders
 * @param {string} targetPath - Path to organize
 * @returns {number} - Number of files moved
 */
function organizeFiles(targetPath) {
    let movedFiles = 0;
    
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
            console.error(`\x1b[31mFailed to move ${fileName}: ${error.message}\x1b[0m`);
        }
    });
    
    console.log(`\n\x1b[36mOrganization complete - moved ${movedFiles} files.\x1b[0m`);
    return movedFiles;
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
        createCategoryDirectories(directoryPath);
        const filesMoved = organizeFiles(directoryPath);
        const stats = displaySummary(directoryPath);
        
        return {
            success: true,
            directoryPath,
            filesMoved,
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
    fileCategories
};