/**
 * categories.js
 * Manages file categories and their extensions for the Folder Organizer app
 * Created: May 11, 2025
 */

const fs = require('fs');
const path = require('path');

// Path to store custom categories
const CATEGORIES_FILE = path.join(__dirname, 'custom-categories.json');

// Default file categories with their corresponding unique extensions
const DEFAULT_CATEGORIES = {
  'Documents': ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.tex', '.md'],
  'Spreadsheets': ['.xls', '.xlsx', '.csv', '.ods', '.xlsm'],
  'Presentations': ['.ppt', '.pptx', '.odp', '.key', '.pps'],
  'Images': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp', '.heic'],
  'Videos': ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg'],
  'Audio': ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.wma', '.m4a'],
  'Compressed': ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.iso'],
  'Executables': ['.exe', '.msi', '.app', '.dmg', '.apk', '.bat', '.sh'],
  'Code': ['.js', '.py', '.java', '.c', '.cpp', '.cs', '.php', '.html', '.css', '.ts', '.jsx', '.tsx', '.swift', '.go', '.rb'],
  'Fonts': ['.ttf', '.otf', '.woff', '.woff2', '.eot'],
  'Backups': ['.bak', '.old', '.backup'],
  'Scripts': ['.ps1', '.vbs', '.bash', '.cmd', '.pl', '.lua', '.sql'],
  'Miscellaneous': ['.json', '.xml', '.yaml', '.yml', '.log', '.ini', '.cfg', '.config'],
  'Shortcuts': ['.lnk', '.url', '.desktop', '.shortcut'],
  'WebApps': ['.pwa', '.crx', '.xpi'],
  'WebPages': ['.htm', '.mht', '.mhtml', '.epub']
};

/**
 * Loads custom categories from file if they exist
 * @returns {Object} Categories
 */
function loadCustomCategories() {
  try {
    if (fs.existsSync(CATEGORIES_FILE)) {
      const data = fs.readFileSync(CATEGORIES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading custom categories:', error);
  }
  return null;
}

/**
 * Saves custom categories to file
 * @param {Object} categories - Categories to save
 */
function saveCustomCategories(categories) {
  try {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving custom categories:', error);
    throw new Error('Failed to save categories');
  }
}

/**
 * Gets all file categories and their extensions
 * @returns {Object} Categories and their extensions
 */
function getCategories() {
  const customCategories = loadCustomCategories();
  return customCategories || DEFAULT_CATEGORIES;
}

/**
 * Creates a mapping from file extensions to categories for fast lookup
 * @returns {Object} Extension to category mapping
 */
function getExtensionMapping() {
  const categories = getCategories();
  const mapping = {};
  
  for (const [category, extensions] of Object.entries(categories)) {
    for (const ext of extensions) {
      mapping[ext.toLowerCase()] = category;
    }
  }
  
  return mapping;
}

/**
 * Updates or adds a category with extensions
 * @param {string} name - Category name
 * @param {string[]} extensions - File extensions for this category
 * @returns {Object} Updated categories
 */
function updateCategory(name, extensions) {
  // Load current categories
  const categories = getCategories();
  
  // Process extensions to ensure they start with a dot
  const processedExtensions = extensions.map(ext => 
    ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`
  );
  
  // Update or add category
  categories[name] = processedExtensions;
  
  // Save categories
  saveCustomCategories(categories);
  
  return categories;
}

/**
 * Deletes a category
 * @param {string} name - Category name to delete
 * @returns {Object} Updated categories
 */
function deleteCategory(name) {
  // Load current categories
  const categories = getCategories();
  
  // Delete category
  if (categories[name]) {
    delete categories[name];
    
    // Save categories
    saveCustomCategories(categories);
  } else {
    throw new Error(`Category "${name}" not found`);
  }
  
  return categories;
}

/**
 * Resets categories to default values
 * @returns {Object} Default categories
 */
function resetToDefaults() {
  // Save default categories
  saveCustomCategories(DEFAULT_CATEGORIES);
  
  return DEFAULT_CATEGORIES;
}

/**
 * Finds which category an extension belongs to
 * @param {string} extension - File extension to check
 * @param {string} excludeCategory - Category to exclude from search (optional)
 * @returns {string|null} Category name or null if not found
 */
function getExtensionCategory(extension, excludeCategory = null) {
  const categories = getCategories();
  const ext = extension.toLowerCase();
  
  for (const [category, extensions] of Object.entries(categories)) {
    if (category === excludeCategory) continue;
    
    if (extensions.includes(ext)) {
      return category;
    }
  }
  
  return null;
}

// Export all functions
module.exports = {
  getCategories,
  getExtensionMapping,
  updateCategory,
  deleteCategory,
  resetToDefaults,
  getExtensionCategory
};