/**
 * file-icons.js
 * Utility module to get appropriate icons for different file types
 * Created: May 13, 2025
 */

/**
 * Returns a Material Icons symbol name for a given file extension
 * @param {string} extension - The file extension including the dot (e.g., '.pdf')
 * @returns {string} - Material Icons symbol name
 */
function getFileTypeIcon(extension) {
  if (!extension) return 'draft';
  
  // Normalize the extension
  const ext = extension.toLowerCase();
  
  // Icon mapping for different file types
  const icons = {
    // Documents
    '.pdf': 'picture_as_pdf',
    '.doc': 'description',
    '.docx': 'description',
    '.txt': 'article',
    '.rtf': 'article',
    '.odt': 'description',
    '.md': 'article',
    '.tex': 'description',
    '.wps': 'description',
    '.pages': 'description',
    
    // Spreadsheets
    '.xls': 'table_chart',
    '.xlsx': 'table_chart',
    '.csv': 'table_chart',
    '.tsv': 'table_chart',
    '.ods': 'table_chart',
    '.numbers': 'table_chart',
    
    // Presentations
    '.ppt': 'slideshow',
    '.pptx': 'slideshow',
    '.pps': 'slideshow',
    '.ppsx': 'slideshow',
    '.odp': 'slideshow',
    '.key': 'slideshow',
    
    // Images
    '.jpg': 'image',
    '.jpeg': 'image',
    '.png': 'image',
    '.gif': 'gif',
    '.bmp': 'image',
    '.svg': 'image',
    '.webp': 'image',
    '.tiff': 'image',
    '.tif': 'image',
    '.psd': 'photo_camera',
    '.ai': 'draw',
    '.raw': 'photo_camera',
    '.heic': 'image',
    '.cr2': 'photo_camera',
    '.nef': 'photo_camera',
    
    // Audio
    '.mp3': 'audio_file',
    '.wav': 'audio_file',
    '.aac': 'audio_file',
    '.flac': 'audio_file',
    '.ogg': 'audio_file',
    '.m4a': 'audio_file',
    '.wma': 'audio_file',
    '.aiff': 'audio_file',
    '.opus': 'audio_file',
    
    // Video
    '.mp4': 'video_file',
    '.avi': 'video_file',
    '.mov': 'video_file',
    '.wmv': 'video_file',
    '.mkv': 'video_file',
    '.flv': 'video_file',
    '.webm': 'video_file',
    '.m4v': 'video_file',
    '.mpg': 'video_file',
    '.mpeg': 'video_file',
    '.3gp': 'video_file',
    '.ogv': 'video_file',
    
    // Archives
    '.zip': 'folder_zip',
    '.rar': 'folder_zip',
    '.7z': 'folder_zip',
    '.tar': 'folder_zip',
    '.gz': 'folder_zip',
    '.bz2': 'folder_zip',
    '.xz': 'folder_zip',
    '.tgz': 'folder_zip',
    
    // Code
    '.html': 'code',
    '.htm': 'code',
    '.css': 'code',
    '.scss': 'code',
    '.less': 'code',
    '.js': 'javascript',
    '.ts': 'code',
    '.jsx': 'javascript',
    '.tsx': 'code',
    '.py': 'code',
    '.java': 'code',
    '.c': 'code',
    '.cpp': 'code',
    '.cc': 'code',
    '.cxx': 'code',
    '.h': 'code',
    '.hpp': 'code',
    '.cs': 'code',
    '.php': 'code',
    '.rb': 'code',
    '.go': 'code',
    '.rs': 'code',
    '.swift': 'code',
    '.kt': 'code',
    '.dart': 'code',
    
    // Data
    '.json': 'data_object',
    '.xml': 'data_object',
    '.yaml': 'data_object',
    '.yml': 'data_object',
    '.sql': 'storage',
    '.db': 'storage',
    '.sqlite': 'storage',
    '.mdb': 'storage',
    
    // Executables
    '.exe': 'terminal',
    '.msi': 'terminal',
    '.app': 'terminal',
    '.dmg': 'terminal',
    '.bat': 'terminal',
    '.cmd': 'terminal',
    '.sh': 'terminal',
    '.com': 'terminal',
    '.scr': 'terminal',
    '.dll': 'integration_instructions',
    '.sys': 'memory',
    '.apk': 'android',
    '.ipa': 'smartphone',
    
    // Fonts
    '.ttf': 'text_format',
    '.otf': 'text_format',
    '.woff': 'text_format',
    '.woff2': 'text_format',
    '.eot': 'text_format',
    
    // Shortcuts
    '.lnk': 'link',
    '.url': 'link',
    '.webloc': 'link',
  };
  
  return icons[ext] || 'draft'; // Default to 'draft' if extension not found
}

/**
 * Returns a Material Icons symbol and color based on category name
 * @param {string} category - Category name
 * @returns {Object} - Object containing icon and color
 */
function getCategoryIcon(category) {
  const categoryIcons = {
    'Documents': { icon: 'description', color: '#4285F4' },  // Blue
    'Images': { icon: 'image', color: '#0F9D58' },  // Green
    'Videos': { icon: 'video_file', color: '#DB4437' },  // Red
    'Audio': { icon: 'audio_file', color: '#F4B400' },  // Yellow
    'Archives': { icon: 'folder_zip', color: '#4285F4' },  // Blue
    'Executables': { icon: 'terminal', color: '#DB4437' },  // Red
    'Code': { icon: 'code', color: '#673AB7' },  // Purple
    'Fonts': { icon: 'text_format', color: '#FF6D00' },  // Orange
    'Presentations': { icon: 'slideshow', color: '#F4B400' },  // Yellow
    'Spreadsheets': { icon: 'table_chart', color: '#0F9D58' },  // Green
    'PDFs': { icon: 'picture_as_pdf', color: '#DB4437' },  // Red
    'Design': { icon: 'draw', color: '#673AB7' },  // Purple
    'Downloads': { icon: 'download', color: '#4285F4' },  // Blue
    'Disk Images': { icon: 'storage', color: '#0F9D58' },  // Green
    'Other': { icon: 'folder', color: '#9E9E9E' }  // Gray
  };
  
  return categoryIcons[category] || { icon: 'folder', color: '#9E9E9E' };
}

/**
 * Returns if a file type should be highlighted as potentially important or dangerous
 * @param {string} extension - The file extension
 * @returns {boolean} - Whether the file should be highlighted
 */
function isHighlightedFileType(extension) {
  if (!extension) return false;
  
  const ext = extension.toLowerCase();
  const highlightedTypes = ['.exe', '.msi', '.bat', '.cmd', '.scr', '.com', '.sh', '.apk', '.app'];
  
  return highlightedTypes.includes(ext);
}

/**
 * Format file size in a human-readable way
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size string
 */
function formatFileSize(bytes) {
  if (bytes === 0 || bytes === undefined || bytes === null) return 'Unknown';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  getFileTypeIcon,
  getCategoryIcon,
  isHighlightedFileType,
  formatFileSize
};