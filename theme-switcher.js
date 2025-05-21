// Theme switcher functionality
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = themeToggle.querySelector('.material-symbols-rounded');
  
  // Check for saved theme preference or use device preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Apply theme on initial load
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark-theme');
    themeIcon.textContent = 'light_mode';
  }
  
  // Toggle theme on button click
  themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark-theme');
    
    // Update the icon based on current theme
    if (document.documentElement.classList.contains('dark-theme')) {
      themeIcon.textContent = 'light_mode';
      localStorage.setItem('theme', 'dark');
    } else {
      themeIcon.textContent = 'dark_mode';
      localStorage.setItem('theme', 'light');
    }
  });
});

// Function to create and update stat cards
function createStatCard(icon, value, label) {
  const statCard = document.createElement('div');
  statCard.className = 'stat-card fade-in';
  
  statCard.innerHTML = `
    <div class="stat-value">
      <span class="material-symbols-rounded stat-icon">${icon}</span>
      ${value}
    </div>
    <div class="stat-label">${label}</div>
  `;
  
  return statCard;
}

// Helper function to create category cards for preview
function createCategoryPreview(category, files) {
  const categorySection = document.createElement('div');
  categorySection.className = 'category-list fade-in';
  
  const categoryHeader = document.createElement('div');
  categoryHeader.className = 'category-header';
  categoryHeader.innerHTML = `
    <span class="material-symbols-rounded" style="margin-right: var(--space-2);">
      ${category === 'Executables' ? 'terminal' : 'folder'}
    </span>
    ${category} (${files.length} files)
    <span class="material-symbols-rounded" style="margin-left: auto;">expand_more</span>
  `;
  
  const fileList = document.createElement('div');
  fileList.className = 'file-list';
  
  files.forEach(file => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const fileExt = file.ext || path.extname(file.name).toLowerCase();
    const isExeFile = fileExt === '.exe';
    
    fileItem.innerHTML = `
      <span class="material-symbols-rounded file-icon" 
        ${isExeFile ? 'style="color: var(--success-color);"' : ''}>
        ${getFileTypeIcon(fileExt)}
      </span>
      <span class="file-name" ${isExeFile ? 'style="color: var(--success-color); font-weight: 500;"' : ''}>
        ${file.name}
      </span>
      ${fileExt ? `<span class="file-ext">${fileExt}</span>` : ''}
    `;
    
    fileList.appendChild(fileItem);
  });
  
  categorySection.appendChild(categoryHeader);
  categorySection.appendChild(fileList);
  
  // Toggle file list visibility when header is clicked
  categoryHeader.addEventListener('click', () => {
    fileList.style.display = fileList.style.display === 'none' ? 'block' : 'none';
    const icon = categoryHeader.querySelector('.material-symbols-rounded:last-child');
    icon.textContent = fileList.style.display === 'none' ? 'expand_more' : 'expand_less';
  });
  
  return categorySection;
}

// Add dark theme styles - will be applied when the .dark-theme class is added to the HTML element
const darkThemeStyles = `
  :root.dark-theme {
    --primary-color: #60a5fa;
    --primary-light: #3b82f6;
    --primary-dark: #93c5fd;
    --primary-bg: #1e3a8a;
    
    --success-color: #34d399;
    --success-light: #064e3b;
    --danger-color: #f87171;
    --danger-light: #7f1d1d;
    --warning-color: #fbbf24;
    --warning-light: #78350f;
    
    --gray-50: #111827;
    --gray-100: #1f2937;
    --gray-200: #374151;
    --gray-300: #4b5563;
    --gray-400: #6b7280;
    --gray-500: #9ca3af;
    --gray-600: #d1d5db;
    --gray-700: #e5e7eb;
    --gray-800: #f3f4f6;
    --gray-900: #f9fafb;
    
    --text-primary: var(--gray-800);
    --text-secondary: var(--gray-600);
    --text-muted: var(--gray-500);
    --text-light: var(--gray-50);
    
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.25);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.26);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.25);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.24);
  }
  
  :root.dark-theme body {
    background-color: var(--gray-50);
    color: var(--text-primary);
  }
  
  :root.dark-theme .card,
  :root.dark-theme .stat-card,
  :root.dark-theme .checkbox-container {
    background-color: var(--gray-100);
    border-color: var(--gray-200);
  }
  
  :root.dark-theme .app-header {
    border-color: var(--gray-200);
  }
  
  :root.dark-theme .card-header {
    background-color: var(--gray-200);
    border-color: var(--gray-300);
  }
  
  :root.dark-theme .folder-path,
  :root.dark-theme select,
  :root.dark-theme input[type="text"],
  :root.dark-theme input[type="time"] {
    background-color: var(--gray-200);
    border-color: var(--gray-300);
    color: var(--gray-700);
  }
  
  :root.dark-theme .folder-path.empty {
    color: var(--gray-500);
  }
  
  :root.dark-theme .btn-outline {
    border-color: var(--primary-light);
    color: var(--primary-light);
  }
  
  :root.dark-theme .btn-outline:hover {
    background-color: var(--gray-200);
  }
  
  :root.dark-theme .theme-toggle {
    color: var(--gray-600);
  }
  
  :root.dark-theme .theme-toggle:hover {
    background-color: var(--gray-200);
    color: var(--gray-800);
  }
  
  :root.dark-theme .category-header {
    background-color: var(--gray-200);
  }
  
  :root.dark-theme .category-header:hover {
    background-color: var(--gray-300);
  }
  
  :root.dark-theme .file-item:hover {
    background-color: var(--gray-200);
  }
  
  :root.dark-theme .file-ext {
    background-color: var(--gray-300);
    color: var(--gray-600);
  }
  
  :root.dark-theme .folder-checkbox:hover {
    background-color: var(--gray-200);
  }
  
  :root.dark-theme .undo-container {
    background-color: var(--gray-200);
    border-color: var(--gray-300);
  }
  
  :root.dark-theme footer {
    border-color: var(--gray-200);
  }
`;

// Inject the dark theme styles
function injectDarkThemeStyles() {
  const style = document.createElement('style');
  style.textContent = darkThemeStyles;
  document.head.appendChild(style);
}

// Call this when the document loads
document.addEventListener('DOMContentLoaded', injectDarkThemeStyles);
