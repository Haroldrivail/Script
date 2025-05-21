// DOM elements
const selectedPathElement = document.getElementById("selected-path");
const selectFolderBtn = document.getElementById("select-folder-btn");
const previewBtn = document.getElementById("preview-btn");
const organizeBtn = document.getElementById("organize-btn");
const statusElement = document.getElementById("status");
const statsContainer = document.getElementById("stats-container");
const statsGrid = document.getElementById("stats-grid");
const foldersChecklist = document.getElementById("folders-checklist");
const preserveSection = document.getElementById("preserve-section");
const previewContainer = document.getElementById("preview-container");
const previewContent = document.getElementById("preview-content");
// Undo elements
const undoContainer = document.getElementById("undo-container");
const undoBtn = document.getElementById("undo-btn");
const undoInfo = document.getElementById("undo-info");

// Simple functions for file and folder icons (replacing file-icons module)
function getFileTypeIcon(extension) {
  return 'description'; // Default icon for all files
}

function getFolderTypeIcon(folderName) {
  return 'folder'; // Default icon for all folders
}

// Function to show status messages
function showStatus(message, type = 'info') {
  if (!statusElement) return;
  
  statusElement.className = `status ${type}`;
  statusElement.innerHTML = `
    <span class="material-symbols-rounded" style="margin-right: 8px;">${type === 'error' ? 'error' : type === 'success' ? 'check_circle' : 'info'}</span>
    ${message}
  `;
  statusElement.style.display = "block";
  statusElement.style.opacity = '1';
  statusElement.setAttribute('aria-busy', type === 'info');
}

// Track selected folder path and folders to preserve
let selectedFolderPath = null;
let foldersToPreserve = [];

// Add UX enhancement styles
function addAnimationStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes highlight {
      0% { background-color: rgba(66, 133, 244, 0); }
      30% { background-color: rgba(66, 133, 244, 0.12); }
      100% { background-color: rgba(66, 133, 244, 0); }
    }
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .spin {
      animation: spin 1.2s linear infinite;
      display: inline-block;
    }
    .fade-in {
      animation: fadeIn 0.3s ease forwards;
    }
    .highlight {
      animation: highlight 1.5s ease;
    }
    .pulse {
      animation: pulse 0.4s ease;
    }
  `;
  document.head.appendChild(style);
}

// Fallback function if fileIcons is not available
function getIconFallback(extension) {
  if (!extension) return 'draft';
  
  // Normalize the extension
  const ext = extension.toLowerCase();
  
  // Basic mapping for common file types
  const basicIcons = {
    '.pdf': 'picture_as_pdf',
    '.doc': 'description',
    '.docx': 'description',
    '.jpg': 'image',
    '.png': 'image',
    '.mp3': 'audio_file',
    '.mp4': 'video_file',
    '.zip': 'folder_zip',
    '.exe': 'terminal'
  };
  
  return basicIcons[ext] || 'draft'; // Default to 'draft' if extension not found
}

// Add these animations when page loads
addAnimationStyles();

// Wait for the window.api to be fully initialized
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure API is fully loaded
  setTimeout(() => {
    if (!window.api) {
      console.error('API not available. The preload script may not have loaded correctly.');    showStatus('Error: API not available. Please restart the application.', 'error');
    } else {
      console.log('API initialized successfully');
      // Initialize the app (removed fileIcons references)
      initializeApp();
    }
  }, 50);
});

// Initialize the application once API is available
function initializeApp() {
  // Check for undo availability when the page loads
  document.addEventListener('DOMContentLoaded', async () => {
    await checkUndoAvailability();
  });
  // Handle folder selection
  selectFolderBtn.addEventListener("click", async () => {
    try {
      // Visual feedback on button click
      selectFolderBtn.classList.add('pulse');
      setTimeout(() => selectFolderBtn.classList.remove('pulse'), 400);
      
      // Debug API availability
      console.log('API available:', !!window.api);
      if (!window.api) {
        console.error('API not available when browse button clicked');
        showStatus('Error: API not available. Please try refreshing the page.', 'error');
        return;
      }
        console.log('Calling selectFolder API...');
      const folderPath = await window.api.selectFolder();
      console.log("Selected folder:", folderPath); // For debugging
      
      if (folderPath) {
        selectedFolderPath = folderPath;
        
        // Animate folder path change
        selectedPathElement.style.opacity = '0';
        selectedPathElement.style.transform = 'translateY(-5px)';
        setTimeout(() => {
          selectedPathElement.textContent = folderPath;
          selectedPathElement.style.transition = 'opacity 0.3s, transform 0.3s';
          selectedPathElement.style.opacity = '1';
          selectedPathElement.style.transform = 'translateY(0)';
          
          // Highlight the path for a moment
          selectedPathElement.classList.add('highlight');
          setTimeout(() => selectedPathElement.classList.remove('highlight'), 1500);
        }, 200);
        
        // Enable buttons with animation
        if (previewBtn.disabled || organizeBtn.disabled) {
          setTimeout(() => {
            previewBtn.disabled = false;
            previewBtn.classList.add('fade-in');
            
            setTimeout(() => {
              organizeBtn.disabled = false;
              organizeBtn.classList.add('fade-in');
            }, 100);
          }, 300);
        } else {
          previewBtn.disabled = false;
          organizeBtn.disabled = false;
        }
        
        // Reset preserved folders
        foldersToPreserve = [];
        
        // Load subfolders and show preservation options
        loadSubfolders(folderPath);

        // Reset previous results
        statusElement.className = "status";
        statusElement.style.display = "none";
        statsContainer.style.display = "none";
        statsGrid.innerHTML = "";
        previewContainer.style.display = "none";
        previewContent.innerHTML = "";
      } else {
        console.log("No folder selected or dialog was canceled");
      }
    } catch (error) {
      console.error("Error selecting folder:", error);
      showStatus(`Error selecting folder: ${error.message}`, 'error');
    }
  });

  // Load subfolders and display as checkboxes
  async function loadSubfolders(folderPath) {
    try {
      const subfolders = await window.api.getSubfolders(folderPath);
      
      if (subfolders && subfolders.length > 0) {
        // Clear previous checkboxes
        foldersChecklist.innerHTML = '';
        
        // Create checkbox for each subfolder with staggered animation
        subfolders.forEach((folder, index) => {
          const checkboxDiv = document.createElement('div');
          checkboxDiv.className = 'folder-checkbox';
          checkboxDiv.style.opacity = '0';
          checkboxDiv.style.transform = 'translateY(8px)';
          
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.id = `folder-${folder}`;
          checkbox.value = folder;
          checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
              foldersToPreserve.push(e.target.value);
            } else {
              foldersToPreserve = foldersToPreserve.filter(f => f !== e.target.value);
            }
          });
          
          const label = document.createElement('label');
          label.htmlFor = `folder-${folder}`;
          label.textContent = folder;
          
          checkboxDiv.appendChild(checkbox);
          checkboxDiv.appendChild(label);
          foldersChecklist.appendChild(checkboxDiv);
          
          // Animate entrance
          setTimeout(() => {
            checkboxDiv.style.transition = 'opacity 0.3s, transform 0.3s';
            checkboxDiv.style.opacity = '1';
            checkboxDiv.style.transform = 'translateY(0)';
          }, 50 + (index * 30));
        });
        
        // Show the preserve section with animation
        preserveSection.style.opacity = '0';
        preserveSection.style.display = 'block';
        setTimeout(() => {
          preserveSection.style.transition = 'opacity 0.4s';
          preserveSection.style.opacity = '1';
        }, 10);
      } else {
        preserveSection.style.display = 'none';
      }
    } catch (error) {
      console.error('Error loading subfolders:', error);
      preserveSection.style.display = 'none';
    }
  }

  // Handle folder organization
  organizeBtn.addEventListener("click", async () => {
    if (!selectedFolderPath) return;

    // Disable buttons and show progress
    previewBtn.disabled = true;
    organizeBtn.disabled = true;
    statusElement.className = "status info";
    statusElement.innerHTML = `
      <span class="material-symbols-rounded spin" style="margin-right: 10px;">sync</span>
      Organizing files... This may take a moment.
    `;
    statusElement.style.display = "block";
    statusElement.setAttribute('aria-busy', 'true');

    try {
      const result = await window.api.organizeFolder(selectedFolderPath, foldersToPreserve);

      if (result.success) {
        // Show success message with animation
        statusElement.className = "status";
        statusElement.style.opacity = '0';
        
        setTimeout(() => {
          statusElement.className = "status success";
          statusElement.innerHTML = `
            <span class="material-symbols-rounded" style="margin-right: 10px;">task_alt</span>
            Success! Organized ${result.filesMoved} files in ${result.directoryPath}
          `;
          statusElement.style.opacity = '1';
          statusElement.setAttribute('aria-busy', 'false');
        }, 200);

        // Display statistics with animation
        if (result.stats) {
          displayStats(result.stats);
        }

        // After organizing, check for non-category folders and propose removal
        const res = await window.api.getNonCategoryFolders(selectedFolderPath);
        if (res.success && res.folders && res.folders.length > 0) {
          showFolderCleanupDialog(res.folders);
        }
        
        // Check for undo availability after organizing
        await checkUndoAvailability();
      } else {
        // Show error message
        statusElement.className = "status";
        statusElement.style.opacity = '0';
        
        setTimeout(() => {
          statusElement.className = "status error";
          statusElement.innerHTML = `
            <span class="material-symbols-rounded" style="margin-right: 10px;">error</span>
            Error: ${result.error || "Failed to organize folder"}
          `;
          statusElement.style.opacity = '1';
          statusElement.setAttribute('aria-busy', 'false');
        }, 200);
      }
    } catch (error) {
      // Show error message
      statusElement.className = "status error";
      statusElement.innerHTML = `
        <span class="material-symbols-rounded" style="margin-right: 10px;">error</span>
        Error: ${error.message || "Unknown error occurred"}
      `;
      statusElement.setAttribute('aria-busy', 'false');
    }

    // Re-enable buttons
    previewBtn.disabled = false;
    organizeBtn.disabled = false;
  });

  // Handle preview of folder organization
  previewBtn.addEventListener("click", async () => {
    if (!selectedFolderPath) return;

    // If preview is already displayed, hide it and return
    if (previewContainer.style.display === "block") {
      // Animate hiding the preview
      previewContainer.style.opacity = '0';
      previewContainer.style.transform = 'translateY(20px)';
      setTimeout(() => {
        previewContainer.style.display = "none";
        previewContent.innerHTML = "";
      }, 300);
      return;
    }

    // Disable buttons and show progress
    previewBtn.disabled = true;
    organizeBtn.disabled = true;
    statusElement.className = "status info";
    statusElement.innerHTML = `
      <span class="material-symbols-rounded spin" style="margin-right: 10px;">sync</span>
      Generating preview... This may take a moment.
    `;
    statusElement.style.display = "block";
    statusElement.setAttribute('aria-busy', 'true');
    
    // Clear previous preview
    previewContainer.style.display = "none";
    previewContent.innerHTML = "";

    try {
      const response = await window.api.previewFiles(selectedFolderPath, foldersToPreserve);

      if (response.success && response.preview) {
        // Hide status after preview is ready
        statusElement.style.opacity = '0';
        setTimeout(() => {
          statusElement.style.display = "none";
        }, 300);
        
        // Display preview with animation
        displayPreview(response.preview);
        
        // Scroll to preview
        setTimeout(() => {
          previewContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      } else {
        // Show error message
        statusElement.className = "status error";
        statusElement.innerHTML = `
          <span class="material-symbols-rounded" style="margin-right: 10px;">error</span>
          Error: ${response.error || "Failed to generate preview"}
        `;
        statusElement.setAttribute('aria-busy', 'false');
      }
    } catch (error) {
      // Show error message
      statusElement.className = "status error";
      statusElement.innerHTML = `
        <span class="material-symbols-rounded" style="margin-right: 10px;">error</span>
        Error: ${error.message || "Unknown error occurred"}
      `;
      statusElement.setAttribute('aria-busy', 'false');
    }

    // Re-enable buttons
    previewBtn.disabled = false;
    organizeBtn.disabled = false;
  });

  // Handle undo button click
  undoBtn.addEventListener("click", async () => {
    // Disable button and show progress
    undoBtn.disabled = true;
    statusElement.className = "status info";
    statusElement.innerHTML = `
      <span class="material-symbols-rounded spin" style="margin-right: 10px;">sync</span>
      Undoing last operation... This may take a moment.
    `;
    statusElement.style.display = "block";
    statusElement.setAttribute('aria-busy', 'true');

    try {
      const result = await window.api.undoLastOperation();

      if (result.success) {
        // Show success message
        statusElement.className = "status success";
        statusElement.innerHTML = `
          <span class="material-symbols-rounded" style="margin-right: 10px;">task_alt</span>
          Undo successful! Moved ${result.filesRestored} files back to their original locations.
        `;
        statusElement.setAttribute('aria-busy', 'false');
        
        // Hide the undo container with animation
        undoContainer.style.opacity = '0';
        undoContainer.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          undoContainer.style.display = "none";
        }, 300);
        
        // Reset stats display
        statsContainer.style.display = "none";
        statsGrid.innerHTML = "";
      } else {
        // Show error message
        statusElement.className = "status error";
        statusElement.innerHTML = `
          <span class="material-symbols-rounded" style="margin-right: 10px;">error</span>
          Error: ${result.error || "Failed to undo last operation"}
        `;
        statusElement.setAttribute('aria-busy', 'false');
        
        // Re-enable the button
        undoBtn.disabled = false;
      }
    } catch (error) {
      // Show error message
      statusElement.className = "status error";
      statusElement.innerHTML = `
        <span class="material-symbols-rounded" style="margin-right: 10px;">error</span>
        Error: ${error.message || "Unknown error occurred"}
      `;
      statusElement.setAttribute('aria-busy', 'false');
      
      // Re-enable the button
      undoBtn.disabled = false;
    }
  });

  // Check if undo is available and update UI accordingly
  async function checkUndoAvailability() {
    try {
      const undoStatus = await window.api.getFileUndoStatus();
      
      if (undoStatus.available) {
        // Format timestamp to user-friendly format
        const date = new Date(undoStatus.timestamp);
        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const formattedDate = date.toLocaleDateString();
        
        // Show the undo container with animation
        undoContainer.style.opacity = '0';
        undoContainer.style.transform = 'translateY(-10px)';
        undoContainer.style.display = "block";
        
        setTimeout(() => {
          undoContainer.style.transition = 'opacity 0.3s, transform 0.3s';
          undoContainer.style.opacity = '1';
          undoContainer.style.transform = 'translateY(0)';
        }, 10);
        
        undoBtn.disabled = false;
        
        // Update the undo info with relevant details
        const folderName = undoStatus.folderPath.split(/[/\\]/).pop(); // Get folder name from path
        undoInfo.textContent = `${undoStatus.fileCount} files moved at ${formattedTime} on ${formattedDate} in "${folderName}" folder`;
      } else {
        // Hide the undo container
        if (undoContainer.style.display !== "none") {
          undoContainer.style.opacity = '0';
          undoContainer.style.transform = 'translateY(-10px)';
          setTimeout(() => {
            undoContainer.style.display = "none";
          }, 300);
        } else {
          undoContainer.style.display = "none";
        }
      }
    } catch (error) {
      console.error('Error checking undo availability:', error);
      undoContainer.style.display = "none";
    }
  }

  // Helper function to analyze folder and get stats
  async function analyzeFolder(folderPath) {
    try {
      const preview = await window.api.previewFiles(folderPath);
      if (preview.success) {
        return {
          stats: preview.preview.filesByCategory
        };
      }
      return null;
    } catch (error) {
      console.error('Error analyzing folder:', error);
      return null;
    }
  }

  // UI: Show a custom modal dialog for non-category folder cleanup
  function showFolderCleanupDialog(folders) {
    // Remove any existing modal
    const oldModal = document.getElementById('cleanup-modal');
    if (oldModal) oldModal.remove();

    // Create modal overlay with fade-in animation
    const modal = document.createElement('div');
    modal.id = 'cleanup-modal';
    modal.style.position = 'fixed';
    modal.style.top = 0;
    modal.style.left = 0;
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(44,62,80,0.5)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = 1000;
    modal.style.opacity = 0;
    modal.style.transition = 'opacity 0.3s ease';

    // Modal content with scale animation
    const content = document.createElement('div');
    content.style.background = '#fff';
    content.style.borderRadius = 'var(--radius-md)';
    content.style.boxShadow = 'var(--shadow-lg)';
    content.style.padding = '32px 28px 24px 28px';
    content.style.maxWidth = '450px';
    content.style.width = '90%';
    content.style.textAlign = 'center';
    content.style.transform = 'scale(0.9)';
    content.style.transition = 'transform 0.3s ease';

    const title = document.createElement('h2');
    title.innerHTML = `
      <span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 8px; color: var(--primary-color);">folder_delete</span>
      Cleanup Suggestion
    `;
    title.style.marginTop = '0';
    title.style.color = 'var(--text-primary)';
    title.style.fontSize = '1.5em';
    content.appendChild(title);

    const msg = document.createElement('div');
    msg.style.margin = '24px 0 24px 0';
    msg.style.fontSize = '1.05em';
    msg.style.lineHeight = '1.5';
    msg.style.color = 'var(--text-primary)';
    
    msg.innerHTML = `
      After organizing, these folders were detected that aren't standard categories:
      <div style="margin: 18px 0; padding: 12px; background: var(--light-bg); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
        <b>${folders.join('<br>')}</b>
      </div>
      Would you like to remove them?
    `;
    content.appendChild(msg);

    // Buttons
    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.justifyContent = 'center';
    btnRow.style.gap = '18px';
    btnRow.style.marginTop = '18px';

    const yesBtn = document.createElement('button');
    yesBtn.className = 'btn btn-success';
    yesBtn.innerHTML = `
      <span class="material-symbols-rounded">delete</span>
      Yes, Remove These
    `;
    yesBtn.style.flex = '1';
    yesBtn.onclick = async () => {
      yesBtn.disabled = true;
      noBtn.disabled = true;
      
      // Show loading state
      yesBtn.innerHTML = `
        <span class="material-symbols-rounded spin">sync</span>
        Removing...
      `;
      
      const removeRes = await window.api.removeFolders(selectedFolderPath, folders);
      
      if (removeRes.success) {
        // Show success in status area
        statusElement.className = 'status success';
        statusElement.innerHTML = `
          <span class="material-symbols-rounded" style="margin-right: 10px;">task_alt</span>
          Removed folders: ${removeRes.removed.join(', ')}
        `;
        statusElement.style.display = 'block';
        
        // Dismiss modal with animation
        modal.style.opacity = '0';
        content.style.transform = 'scale(0.9)';
        setTimeout(() => modal.remove(), 300);
      } else {
        // Show error in status area
        statusElement.className = 'status error';
        statusElement.innerHTML = `
          <span class="material-symbols-rounded" style="margin-right: 10px;">error</span>
          Failed to remove folders: ${removeRes.error}
        `;
        statusElement.style.display = 'block';
        
        // Reset buttons
        yesBtn.disabled = false;
        noBtn.disabled = false;
        yesBtn.innerHTML = `
          <span class="material-symbols-rounded">delete</span>
          Yes, Remove These
        `;
      }
    };

    const noBtn = document.createElement('button');
    noBtn.className = 'btn btn-primary';
    noBtn.innerHTML = `
      <span class="material-symbols-rounded">close</span>
      No, Keep Them
    `;
    noBtn.style.flex = '1';
    noBtn.onclick = () => {
      // Dismiss with animation
      modal.style.opacity = '0';
      content.style.transform = 'scale(0.9)';
      setTimeout(() => modal.remove(), 300);
    };

    btnRow.appendChild(yesBtn);
    btnRow.appendChild(noBtn);
    content.appendChild(btnRow);
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Trigger animations
    setTimeout(() => {
      modal.style.opacity = '1';
      content.style.transform = 'scale(1)';
    }, 10);
  }

  // Display statistics
  function displayStats(stats) {
    statsGrid.innerHTML = "";
    
    // Prepare for animation
    statsContainer.style.opacity = '0';
    statsContainer.style.transform = 'translateY(20px)';
    statsContainer.style.display = "block";
    
    let total = 0;
    const statItems = [];
    
    // Create stat items
    for (const [category, count] of Object.entries(stats)) {
      total += count;
      
      const statItem = document.createElement("div");
      statItem.className = "stats-item";
      statItem.style.opacity = '0';
      statItem.style.transform = 'translateY(15px)';
      
      const categoryElement = document.createElement("div");
      categoryElement.className = "category";
      categoryElement.textContent = category;
      
      const countElement = document.createElement("div");
      countElement.className = "count";
      countElement.textContent = count;
      
      statItem.appendChild(categoryElement);
      statItem.appendChild(countElement);
      statsGrid.appendChild(statItem);
      
      statItems.push(statItem);
    }
    
    if (total === 0) {
      statsContainer.style.display = "none";
      statusElement.className = "status error";
      statusElement.innerHTML = `
        <span class="material-symbols-rounded" style="margin-right: 10px;">info</span>
        No files were organized. The folder may already be organized or empty.
      `;
    } else {
      // Animate container
      setTimeout(() => {
        statsContainer.style.transition = 'opacity 0.4s, transform 0.4s';
        statsContainer.style.opacity = '1';
        statsContainer.style.transform = 'translateY(0)';
        
        // Animate each item with staggered delay
        statItems.forEach((item, index) => {
          setTimeout(() => {
            item.style.transition = 'opacity 0.4s, transform 0.4s';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
          }, 100 + (index * 60));
        });
      }, 200);
    }
  }

  // Display preview of changes
  function displayPreview(preview) {
    previewContent.innerHTML = "";
    
    // Prepare container for animation
    previewContainer.style.opacity = '0';
    previewContainer.style.transform = 'translateY(20px)';
    previewContainer.style.display = "block";
    
    // Create action buttons for the preview
    const previewActions = document.createElement('div');
    previewActions.className = 'preview-actions';
    previewActions.style.display = 'flex';
    previewActions.style.justifyContent = 'space-between';
    previewActions.style.alignItems = 'center';
    previewActions.style.marginBottom = '20px';
    previewActions.style.opacity = '0';
    
    const previewTitle = document.createElement('h3');
    previewTitle.textContent = 'Preview of Changes';
    previewTitle.style.margin = '0';
    
    const previewButtonsWrapper = document.createElement('div');
    previewButtonsWrapper.style.display = 'flex';
    previewButtonsWrapper.style.gap = '12px';
    
    // Toggle categories button
    const toggleAllBtn = document.createElement('button');
    toggleAllBtn.className = 'btn btn-secondary btn-sm';
    toggleAllBtn.innerHTML = `
      <span class="material-symbols-rounded">visibility</span>
      Expand All
    `;
    toggleAllBtn.setAttribute('title', 'Expand/Collapse all categories');
    toggleAllBtn.dataset.state = 'collapsed';
    toggleAllBtn.onclick = function() {
      const fileContainers = document.querySelectorAll('.preview-files');
      const isCollapsed = this.dataset.state === 'collapsed';
      
      fileContainers.forEach(container => {
        container.style.display = isCollapsed ? 'block' : 'none';
      });
      
      this.dataset.state = isCollapsed ? 'expanded' : 'collapsed';
      this.innerHTML = isCollapsed ? 
        `<span class="material-symbols-rounded">visibility_off</span> Collapse All` :
        `<span class="material-symbols-rounded">visibility</span> Expand All`;
    };
    
    // Toggle showing file extension mappings
    const toggleMappingsBtn = document.createElement('button');
    toggleMappingsBtn.className = 'btn btn-secondary btn-sm';
    toggleMappingsBtn.innerHTML = `
      <span class="material-symbols-rounded">list_alt</span>
      Show File Types
    `;
    toggleMappingsBtn.setAttribute('title', 'Show/Hide file extension mappings');
    toggleMappingsBtn.dataset.state = 'hidden';
    toggleMappingsBtn.onclick = function() {
      const mappingsContainer = document.getElementById('extension-mappings');
      const isHidden = this.dataset.state === 'hidden';
      
      if (isHidden) {
        mappingsContainer.style.display = 'block';
        setTimeout(() => {
          mappingsContainer.style.opacity = '1';
          mappingsContainer.style.transform = 'translateY(0)';
        }, 10);
      } else {
        mappingsContainer.style.opacity = '0';
        mappingsContainer.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          mappingsContainer.style.display = 'none';
        }, 300);
      }
      
      this.dataset.state = isHidden ? 'shown' : 'hidden';
      this.innerHTML = isHidden ? 
        `<span class="material-symbols-rounded">layers</span> Hide File Types` :
        `<span class="material-symbols-rounded">list_alt</span> Show File Types`;
    };
    
    // Confirm organization button (proceed directly from preview)
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn btn-primary btn-sm';
    confirmBtn.innerHTML = `
      <span class="material-symbols-rounded">check_circle</span>
      Apply Changes
    `;
    confirmBtn.setAttribute('title', 'Proceed with organizing files as shown');
    confirmBtn.onclick = function() {
      // Gather excluded files
      const excludedFiles = [];
      document.querySelectorAll('.file-item input[type="checkbox"]:not(:checked)').forEach(checkbox => {
        excludedFiles.push(checkbox.dataset.filename);
      });
      
      // Disable the confirm button and show spinner
      this.disabled = true;
      this.innerHTML = `
        <span class="material-symbols-rounded spin">sync</span>
        Processing...
      `;
      
      // Call the organize function
      organizeBtn.click(); // This triggers the existing organization logic
    };
    
    previewButtonsWrapper.appendChild(toggleAllBtn);
    previewButtonsWrapper.appendChild(toggleMappingsBtn);
    previewButtonsWrapper.appendChild(confirmBtn);
    
    previewActions.appendChild(previewTitle);
    previewActions.appendChild(previewButtonsWrapper);
    
    previewContent.appendChild(previewActions);
    
    // Add extension mappings container (hidden by default)
    const mappingsContainer = document.createElement('div');
    mappingsContainer.id = 'extension-mappings';
    mappingsContainer.style.marginBottom = '20px';
    mappingsContainer.style.padding = '15px';
    mappingsContainer.style.backgroundColor = 'var(--light-bg)';
    mappingsContainer.style.borderRadius = 'var(--radius-md)';
    mappingsContainer.style.border = '1px solid var(--border-color)';
    mappingsContainer.style.opacity = '0';
    mappingsContainer.style.transform = 'translateY(-10px)';
    mappingsContainer.style.transition = 'opacity 0.3s, transform 0.3s';
    mappingsContainer.style.display = 'none';
    
    // Create extension mappings content if available
    if (preview.categoryMappings) {
      const mappingsTitle = document.createElement('h4');
      mappingsTitle.textContent = 'File Types by Category';
      mappingsTitle.style.marginTop = '0';
      mappingsTitle.style.marginBottom = '15px';
      mappingsTitle.style.color = 'var(--text-primary)';
      mappingsContainer.appendChild(mappingsTitle);
      
      const mappingsGrid = document.createElement('div');
      mappingsGrid.style.display = 'grid';
      mappingsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
      mappingsGrid.style.gap = '15px';
      
      // Sort categories alphabetically
      const sortedCategories = Object.keys(preview.categoryMappings).sort();
      
      sortedCategories.forEach(category => {
        const extensions = preview.categoryMappings[category];
        if (!extensions || extensions.length === 0) return;
        
        const categoryCard = document.createElement('div');
        categoryCard.style.padding = '12px';
        categoryCard.style.backgroundColor = 'white';
        categoryCard.style.borderRadius = 'var(--radius-sm)';
        categoryCard.style.boxShadow = 'var(--shadow-sm)';
        
        const categoryName = document.createElement('div');
        categoryName.textContent = category;
        categoryName.style.fontWeight = '600';
        categoryName.style.marginBottom = '8px';
        categoryName.style.color = 'var(--primary-color)';
        categoryCard.appendChild(categoryName);
        
        // Sort extensions alphabetically
        const sortedExtensions = [...extensions].sort();
        
        const extensionsList = document.createElement('div');
        extensionsList.style.display = 'flex';
        extensionsList.style.flexWrap = 'wrap';
        extensionsList.style.gap = '6px';
        
        sortedExtensions.forEach(ext => {
          const extensionTag = document.createElement('span');
          extensionTag.textContent = ext;
          extensionTag.style.backgroundColor = 'var(--light-bg)';
          extensionTag.style.padding = '3px 8px';
          extensionTag.style.borderRadius = '12px';
          extensionTag.style.fontSize = '0.85em';
          extensionTag.style.color = 'var(--text-secondary)';
          extensionsList.appendChild(extensionTag);
        });
        
        categoryCard.appendChild(extensionsList);
        mappingsGrid.appendChild(categoryCard);
      });
      
      // Add Other category info if needed
      if (!preview.categoryMappings['Other']) {
        const otherCard = document.createElement('div');
        otherCard.style.padding = '12px';
        otherCard.style.backgroundColor = 'white';
        otherCard.style.borderRadius = 'var(--radius-sm)';
        otherCard.style.boxShadow = 'var(--shadow-sm)';
        
        const otherName = document.createElement('div');
        otherName.textContent = 'Other';
        otherName.style.fontWeight = '600';
        otherName.style.marginBottom = '8px';
        otherName.style.color = 'var(--text-secondary)';
        otherCard.appendChild(otherName);
        
        const otherDesc = document.createElement('div');
        otherDesc.textContent = 'All uncategorized file types';
        otherDesc.style.fontSize = '0.85em';
        otherDesc.style.color = 'var(--text-secondary)';
        otherCard.appendChild(otherDesc);
        
        mappingsGrid.appendChild(otherCard);
      }
      
      mappingsContainer.appendChild(mappingsGrid);
    }
    
    previewContent.appendChild(mappingsContainer);
    
    // Add summary stats
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'preview-summary';
    summaryDiv.style.marginBottom = '20px';
    summaryDiv.style.padding = '15px';
    summaryDiv.style.backgroundColor = 'var(--light-bg)';
    summaryDiv.style.borderRadius = 'var(--radius-md)';
    summaryDiv.style.opacity = '0';
    
    // Calculate totals
    const totalCategories = Object.keys(preview.filesByCategory).length;
    let totalSize = 0;
    let executablesCount = 0;
    let exeFilesCount = 0;
    
    // Count unique file extensions to display
    const uniqueExtensions = new Set();
    
    Object.entries(preview.filesByCategory).forEach(([category, files]) => {
      files.forEach(file => {
        if (file.stats && file.stats.size) {
          totalSize += file.stats.size;
        }
        
        // Track unique extensions
        if (file.stats && file.stats.extension) {
          uniqueExtensions.add(file.stats.extension.toLowerCase());
        } else if (file.name) {
          const ext = path.extname(file.name).toLowerCase();
          if (ext) uniqueExtensions.add(ext);
        }
        
        // Count executables and .exe files specifically
        if (category === 'Executables') {
          executablesCount++;
          if (file.name.toLowerCase().endsWith('.exe')) {
            exeFilesCount++;
          }
        }
      });
    });
    
    // Format file size
    const formatFileSize = (bytes) => {
      if (bytes === 0 || bytes === undefined || bytes === null) return 'Unknown';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    summaryDiv.innerHTML = `
      <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div>
          <div style="font-size: 1.8em; font-weight: 600; color: var(--primary-color);">${preview.totalFiles}</div>
          <div style="font-size: 0.9em; color: var(--text-secondary);">Files to organize</div>
        </div>
        <div>
          <div style="font-size: 1.8em; font-weight: 600; color: var(--primary-color);">${totalCategories}</div>
          <div style="font-size: 0.9em; color: var(--text-secondary);">Categories</div>
        </div>
        <div>
          <div style="font-size: 1.8em; font-weight: 600; color: var(--primary-color);">${uniqueExtensions.size}</div>
          <div style="font-size: 0.9em; color: var(--text-secondary);">File types</div>
        </div>
        <div>
          <div style="font-size: 1.8em; font-weight: 600; color: var(--primary-color);">${formatFileSize(totalSize)}</div>
          <div style="font-size: 0.9em; color: var(--text-secondary);">Total size</div>
        </div>
        <div>
          <div style="font-size: 1.8em; font-weight: 600; color: var(--primary-color);">${preview.skippedFiles.length}</div>
          <div style="font-size: 0.9em; color: var(--text-secondary);">Files to skip</div>
        </div>
        ${executablesCount > 0 ? `
        <div>
          <div style="font-size: 1.8em; font-weight: 600; color: var(--success-color);">${executablesCount}</div>
          <div style="font-size: 0.9em; color: var(--text-secondary);">Executable files</div>
        </div>
        ${exeFilesCount > 0 ? `
        <div>
          <div style="font-size: 1.8em; font-weight: 600; color: var(--success-color);">${exeFilesCount}</div>
          <div style="font-size: 0.9em; color: var(--text-secondary);">.exe files</div>
        </div>` : ''}` : ''}
      </div>
    `;
    
    previewContent.appendChild(summaryDiv);
    
    if (preview.totalFiles === 0) {
      previewContent.innerHTML += `
        <div class="no-changes">
          <span class="material-symbols-rounded" style="font-size: 36px; display: block; margin-bottom: 15px; opacity: 0.6;">check_circle</span>
          No changes needed. The folder may already be organized or empty.
        </div>
      `;
      
      // Show container with animation
      setTimeout(() => {
        previewContainer.style.transition = 'opacity 0.4s, transform 0.4s';
        previewContainer.style.opacity = '1';
        previewContainer.style.transform = 'translateY(0)';
      }, 100);
      
      return;    }
    
    // Function to get icon for file type - simplified version without detailed file type mapping
    function getFileTypeIcon(extension) {
      // Return generic icon for all file types
      return 'draft';
    }
    
    // Format date safely
    function formatDate(dateStr) {
      if (!dateStr) return 'Unknown';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Unknown';
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return 'Unknown';
      }
    }
    
    // Create HTML for each category of files
    const categories = Object.entries(preview.filesByCategory);
    categories.sort((a, b) => a[0].localeCompare(b[0])); // Sort alphabetically
    
    // Check if we have executables category to highlight
    const hasExecutablesCategory = categories.some(([category]) => category === 'Executables');
    
    // Generate items with hidden state for animation
    categories.forEach(([category, files]) => {
      const isExecutablesCategory = category === 'Executables';
      
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'preview-category';
      categoryDiv.style.opacity = '0';
      categoryDiv.style.transform = 'translateY(15px)';
      categoryDiv.style.marginBottom = '20px';
      categoryDiv.style.border = '1px solid var(--border-color)';
      
      // Highlight Executables category with a special border
      if (isExecutablesCategory) {
        categoryDiv.style.border = '2px solid var(--success-color)';
        categoryDiv.id = 'executables-category';
      }
      
      categoryDiv.style.borderRadius = 'var(--radius-md)';
      categoryDiv.style.overflow = 'hidden';
      
      const categoryNameDiv = document.createElement('div');
      categoryNameDiv.className = 'preview-category-name';
      categoryNameDiv.style.padding = '15px';
      
      // Highlight Executables category with a special background
      if (isExecutablesCategory) {
        categoryNameDiv.style.backgroundColor = 'rgba(15, 157, 88, 0.1)';
      } else {
        categoryNameDiv.style.backgroundColor = 'var(--light-bg)';
      }
      
      categoryNameDiv.style.borderBottom = isExecutablesCategory ? 
        '1px solid var(--success-color)' : '1px solid var(--border-color)';
      categoryNameDiv.style.cursor = 'pointer';
      categoryNameDiv.style.display = 'flex';
      categoryNameDiv.style.justifyContent = 'space-between';
      categoryNameDiv.style.alignItems = 'center';
      
      const categoryTitle = document.createElement('div');
      
      // Add exe count badge if category is Executables
      const exeCount = isExecutablesCategory ? 
        files.filter(file => file.name.toLowerCase().endsWith('.exe')).length : 0;
        
      // Count unique extensions in this category for badge
      const uniqueExtsInCategory = new Set();
      files.forEach(file => {
        const ext = file.stats?.extension || path.extname(file.name).toLowerCase();
        if (ext) uniqueExtsInCategory.add(ext);
      });
      
      categoryTitle.innerHTML = `
        <span>${category}</span>
        <span class="preview-category-count">${files.length}</span>
        ${uniqueExtsInCategory.size > 0 ? 
          `<span class="preview-ext-count"
             style="background-color: var(--primary-color); margin-left: 8px; color: white; border-radius: 30px; 
                    font-size: 0.85em; padding: 3px 10px; font-weight: 500;">
            ${uniqueExtsInCategory.size} file type${uniqueExtsInCategory.size !== 1 ? 's' : ''}
          </span>` : ''}
        ${isExecutablesCategory && exeCount > 0 ? 
          `<span class="preview-exe-count"
             style="background-color: #ff9800; margin-left: 8px; color: white; border-radius: 30px; 
                    font-size: 0.85em; padding: 3px 10px; font-weight: 500;">
            ${exeCount} .exe file${exeCount !== 1 ? 's' : ''}
          </span>` : ''}
      `;
      
      const toggleIcon = document.createElement('span');
      toggleIcon.className = 'material-symbols-rounded';
      toggleIcon.textContent = 'expand_more';
      toggleIcon.style.transition = 'transform 0.3s';
      
      categoryNameDiv.appendChild(categoryTitle);
      categoryNameDiv.appendChild(toggleIcon);
      
      const filesListDiv = document.createElement('div');
      filesListDiv.className = 'preview-files';
      
      // Set Executables category to expanded by default
      filesListDiv.style.display = isExecutablesCategory ? 'block' : 'none';
      if (isExecutablesCategory) {
        toggleIcon.style.transform = 'rotate(180deg)';
      }
      
      filesListDiv.style.transition = 'height 0.3s';
      
      // Toggle category expansion when clicking on header
      categoryNameDiv.onclick = function() {
        const isVisible = filesListDiv.style.display !== 'none';
        filesListDiv.style.display = isVisible ? 'none' : 'block';
        toggleIcon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
      };
      
      // Title row for details
      const titleRow = document.createElement('div');
      titleRow.className = 'file-item file-header';
      titleRow.style.display = 'flex';
      titleRow.style.padding = '8px 15px';
      titleRow.style.borderBottom = '1px solid var(--border-color)';
      titleRow.style.backgroundColor = 'var(--light-bg)';
      titleRow.style.fontWeight = '600';
      titleRow.style.fontSize = '0.85em';
      titleRow.style.color = 'var(--text-secondary)';
      
      titleRow.innerHTML = `
        <div style="flex: 0 0 20px;"></div>
        <div style="flex: 1 1 auto;">Name</div>
        <div style="flex: 0 0 60px;">Type</div>
        <div style="flex: 0 0 100px;">Size</div>
        <div style="flex: 0 0 180px;">Modified</div>
      `;
      
      filesListDiv.appendChild(titleRow);
      
      files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.style.display = 'flex';
        fileItem.style.padding = '8px 15px';
        fileItem.style.borderBottom = '1px solid var(--border-color-light)';
        fileItem.style.alignItems = 'center';
        fileItem.style.transition = 'background-color 0.2s';
        fileItem.style.cursor = 'default';
        
        const fileExt = file.stats?.extension || path.extname(file.name).toLowerCase();
        const isExeFile = file.name.toLowerCase().endsWith('.exe');
        
        // Highlight .exe files with a special background
        if (isExeFile) {
          fileItem.style.backgroundColor = 'rgba(15, 157, 88, 0.05)';
        }
        
        // Hover effect
        fileItem.onmouseover = () => {
          fileItem.style.backgroundColor = isExeFile ? 
            'rgba(15, 157, 88, 0.12)' : 'rgba(66, 133, 244, 0.08)';
        };
        fileItem.onmouseout = () => {
          fileItem.style.backgroundColor = isExeFile ? 
            'rgba(15, 157, 88, 0.05)' : '';
        };
        
        // Checkbox to include/exclude
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.style.margin = '0';
        checkbox.style.cursor = 'pointer';
        checkbox.setAttribute('title', 'Include this file in organization');
        checkbox.dataset.filename = file.name;
        checkbox.style.flexShrink = '0';
        checkbox.style.marginRight = '5px';
        
        const icon = document.createElement('span');
        icon.className = 'material-symbols-rounded';
        icon.textContent = getFileTypeIcon(fileExt);
        icon.style.marginRight = '8px';
        icon.style.color = isExeFile ? 'var(--success-color)' : 'var(--text-secondary)';
        icon.style.fontSize = '1.2em';
        
        const fileNameSpan = document.createElement('span');
        fileNameSpan.textContent = file.name;
        fileNameSpan.style.flex = '1';
        fileNameSpan.style.overflow = 'hidden';
        fileNameSpan.style.textOverflow = 'ellipsis';
        fileNameSpan.style.whiteSpace = 'nowrap';
        
        // Highlight .exe filenames
        if (isExeFile) {
          fileNameSpan.style.color = 'var(--success-color)';
          fileNameSpan.style.fontWeight = '500';
        }
        
        // Show file extension as badge
        const fileExtSpan = document.createElement('span');
        if (fileExt) {
          fileExtSpan.textContent = fileExt;
          fileExtSpan.style.backgroundColor = 'var(--light-bg)';
          fileExtSpan.style.padding = '2px 6px';
          fileExtSpan.style.borderRadius = '10px';
          fileExtSpan.style.fontSize = '0.75em';
          fileExtSpan.style.color = 'var(--text-secondary)';
          if (isExeFile) {
            fileExtSpan.style.backgroundColor = 'rgba(15, 157, 88, 0.15)';
            fileExtSpan.style.color = 'var(--success-color)';
          }
        } else {
          fileExtSpan.textContent = '—';
          fileExtSpan.style.color = 'var(--text-secondary)';
        }
        
        fileExtSpan.style.flexBasis = '60px';
        fileExtSpan.style.flexShrink = '0';
        fileExtSpan.style.textAlign = 'center';
        
        const fileSizeSpan = document.createElement('span');
        fileSizeSpan.textContent = file.stats && typeof file.stats.size !== 'undefined' ? formatFileSize(file.stats.size) : 'Unknown';
        fileSizeSpan.style.flexBasis = '100px';
        fileSizeSpan.style.flexShrink = '0';
        fileSizeSpan.style.textAlign = 'right';
        fileSizeSpan.style.color = 'var(--text-secondary)';
        
        const fileModifiedSpan = document.createElement('span');
        fileModifiedSpan.textContent = file.stats && file.stats.modified ? formatDate(file.stats.modified) : 'Unknown';
        fileModifiedSpan.style.flexBasis = '180px';
        fileModifiedSpan.style.flexShrink = '0';
        fileModifiedSpan.style.marginLeft = '15px';
        fileModifiedSpan.style.color = 'var(--text-secondary)';
        fileModifiedSpan.style.fontSize = '0.9em';
        
        fileItem.appendChild(checkbox);
        fileItem.appendChild(icon);
        fileItem.appendChild(fileNameSpan);
        fileItem.appendChild(fileExtSpan);
        fileItem.appendChild(fileSizeSpan);
        fileItem.appendChild(fileModifiedSpan);
        
        filesListDiv.appendChild(fileItem);
      });
      
      categoryDiv.appendChild(categoryNameDiv);
      categoryDiv.appendChild(filesListDiv);
      previewContent.appendChild(categoryDiv);
    });
    
    // Add skipped files section if any
    if (preview.skippedFiles && preview.skippedFiles.length > 0) {
      const skippedDiv = document.createElement('div');
      skippedDiv.className = 'skipped-files preview-category';
      skippedDiv.style.opacity = '0';
      skippedDiv.style.transform = 'translateY(15px)';
      skippedDiv.style.marginBottom = '20px';
      skippedDiv.style.border = '1px solid var(--border-color)';
      skippedDiv.style.borderRadius = 'var(--radius-md)';
      skippedDiv.style.overflow = 'hidden';
      
      const skippedHeader = document.createElement('div');
      skippedHeader.className = 'preview-category-name';
      skippedHeader.style.padding = '15px';
      skippedHeader.style.backgroundColor = 'rgba(255, 152, 0, 0.1)';
      skippedHeader.style.borderBottom = '1px solid var(--border-color)';
      skippedHeader.style.cursor = 'pointer';
      skippedHeader.style.display = 'flex';
      skippedHeader.style.justifyContent = 'space-between';
      skippedHeader.style.alignItems = 'center';
      
      const skippedTitle = document.createElement('div');
      skippedTitle.innerHTML = `
        <span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 5px; font-size: 0.9em; color: #ff9800;">warning</span>
        Files that will be skipped
        <span class="preview-category-count">${preview.skippedFiles.length}</span>
      `;
      
      const toggleIcon = document.createElement('span');
      toggleIcon.className = 'material-symbols-rounded';
      toggleIcon.textContent = 'expand_more';
      toggleIcon.style.transition = 'transform 0.3s';
      
      skippedHeader.appendChild(skippedTitle);
      skippedHeader.appendChild(toggleIcon);
      
      const skippedContent = document.createElement('div');
      skippedContent.className = 'preview-files';
      skippedContent.style.display = 'none'; // Initially collapsed
      
      // Toggle expansion when clicking on header
      skippedHeader.onclick = function() {
        const isVisible = skippedContent.style.display !== 'none';
        skippedContent.style.display = isVisible ? 'none' : 'block';
        toggleIcon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
      };
      
      // Title row for details
      const titleRow = document.createElement('div');
      titleRow.className = 'file-item file-header';
      titleRow.style.display = 'flex';
      titleRow.style.padding = '8px 15px';
      titleRow.style.borderBottom = '1px solid var(--border-color)';
      titleRow.style.backgroundColor = 'var(--light-bg)';
      titleRow.style.fontWeight = '600';
      titleRow.style.fontSize = '0.85em';
      titleRow.style.color = 'var(--text-secondary)';
      
      titleRow.innerHTML = `
        <div style="flex: 1 1 auto;">Name</div>
        <div style="flex: 0 0 60px;">Type</div>
        <div style="flex: 0 0 100px;">Size</div>
        <div style="flex: 0 0 280px;">Reason</div>
      `;
      
      skippedContent.appendChild(titleRow);
      
      preview.skippedFiles.forEach(item => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.style.display = 'flex';
        fileItem.style.padding = '8px 15px';
        fileItem.style.borderBottom = '1px solid var(--border-color-light)';
        fileItem.style.alignItems = 'center';
        
        const fileExt = item.stats?.extension || path.extname(item.fileName).toLowerCase();
        
        const icon = document.createElement('span');
        icon.className = 'material-symbols-rounded';
        icon.textContent = getFileTypeIcon(fileExt);
        icon.style.marginRight = '8px';
        icon.style.color = 'var(--text-secondary)';
        icon.style.fontSize = '1.2em';
        
        const fileNameSpan = document.createElement('span');
        fileNameSpan.textContent = item.fileName;
        fileNameSpan.style.flex = '1';
        fileNameSpan.style.overflow = 'hidden';
        fileNameSpan.style.textOverflow = 'ellipsis';
        fileNameSpan.style.whiteSpace = 'nowrap';
        
        // Show file extension as badge
        const fileExtSpan = document.createElement('span');
        if (fileExt) {
          fileExtSpan.textContent = fileExt;
          fileExtSpan.style.backgroundColor = 'var(--light-bg)';
          fileExtSpan.style.padding = '2px 6px';
          fileExtSpan.style.borderRadius = '10px';
          fileExtSpan.style.fontSize = '0.75em';
          fileExtSpan.style.color = 'var(--text-secondary)';
        } else {
          fileExtSpan.textContent = '—';
          fileExtSpan.style.color = 'var(--text-secondary)';
        }
        fileExtSpan.style.flexBasis = '60px';
        fileExtSpan.style.flexShrink = '0';
        fileExtSpan.style.textAlign = 'center';
        
        const fileSizeSpan = document.createElement('span');
        fileSizeSpan.textContent = item.stats && typeof item.stats.size !== 'undefined' ? formatFileSize(item.stats.size) : 'Unknown';
        fileSizeSpan.style.flexBasis = '100px';
        fileSizeSpan.style.flexShrink = '0';
        fileSizeSpan.style.textAlign = 'right';
        fileSizeSpan.style.color = 'var(--text-secondary)';
        
        const reasonSpan = document.createElement('span');
        reasonSpan.textContent = item.reason;
        reasonSpan.style.flexBasis = '280px';
        reasonSpan.style.flexShrink = '0';
        reasonSpan.style.marginLeft = '15px';
        reasonSpan.style.color = '#ff9800';
        reasonSpan.style.fontSize = '0.9em';
        
        fileItem.appendChild(icon);
        fileItem.appendChild(fileNameSpan);
        fileItem.appendChild(fileExtSpan);
        fileItem.appendChild(fileSizeSpan);
        fileItem.appendChild(reasonSpan);
        
        skippedContent.appendChild(fileItem);
      });
      
      skippedDiv.appendChild(skippedHeader);
      skippedDiv.appendChild(skippedContent);
      previewContent.appendChild(skippedDiv);
    }
    
    // Add a note about executables if they exist
    if (hasExecutablesCategory) {
      const executablesNote = document.createElement('div');
      executablesNote.style.marginTop = '20px';
      executablesNote.style.padding = '12px 15px';
      executablesNote.style.backgroundColor = 'rgba(15, 157, 88, 0.1)';
      executablesNote.style.borderRadius = 'var(--radius-md)';
      executablesNote.style.opacity = '0';
      executablesNote.style.border = '1px solid var(--success-color)';
      executablesNote.innerHTML = `
        <div style="display: flex; align-items: flex-start;">
          <span class="material-symbols-rounded" style="margin-right: 10px; color: var(--success-color);">info</span>
          <div>
            <strong style="color: var(--success-color);">Executable Files Organization</strong>
            <p style="margin: 5px 0 0; font-size: 0.95em;">
              All executable files (.exe, .msi, .bat, etc.) will be organized into the "Executables" category.
              This helps keep potentially harmful files in one location for easier management and security.
            </p>
          </div>
        </div>
      `;
      previewContent.appendChild(executablesNote);
    }
    
    // Add a general note at the bottom
    const noteDiv = document.createElement('div');
    noteDiv.style.marginTop = '20px';
    noteDiv.style.fontSize = '0.9em';
    noteDiv.style.color = 'var(--text-secondary)';
    noteDiv.style.fontStyle = 'italic';
    noteDiv.style.textAlign = 'center';
    noteDiv.style.opacity = '0';
    noteDiv.innerHTML = `
      <span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 5px; font-size: 1em;">info</span>
      This is a preview only. Click "Show File Types" to see which extensions go into each category.
      You can uncheck files to exclude them from organization.
    `;
    previewContent.appendChild(noteDiv);
    
    // Show the preview container with sequential animations
    setTimeout(() => {
      previewContainer.style.transition = 'opacity 0.5s, transform 0.5s';
      previewContainer.style.opacity = '1';
      previewContainer.style.transform = 'translateY(0)';
      
      // Animate actions
      setTimeout(() => {
        previewActions.style.transition = 'opacity 0.4s';
        previewActions.style.opacity = '1';
        
        // Animate summary
        setTimeout(() => {
          summaryDiv.style.transition = 'opacity 0.4s';
          summaryDiv.style.opacity = '1';
          
          // Animate each category with staggered delay
          const categories = document.querySelectorAll('.preview-category');
          categories.forEach((category, index) => {
            setTimeout(() => {
              category.style.transition = 'opacity 0.4s, transform 0.4s';
              category.style.opacity = '1';
              category.style.transform = 'translateY(0)';
            }, 100 + (index * 70));
          });
          
          // Animate executables note if it exists
          const execNote = document.querySelector('div[style*="rgba(15, 157, 88, 0.1)"]');
          if (execNote) {
            setTimeout(() => {
              execNote.style.transition = 'opacity 0.4s';
              execNote.style.opacity = '1';
            }, 200 + (categories.length * 70));
          }
          
          // Animate note
          setTimeout(() => {
            noteDiv.style.transition = 'opacity 0.4s';
            noteDiv.style.opacity = '0.8';
          }, 300 + (categories.length * 70));
          
          // Scroll to Executables section if it exists (after animation)
          if (hasExecutablesCategory) {
            setTimeout(() => {
              const execCategory = document.getElementById('executables-category');
              if (execCategory) {
                execCategory.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 500 + (categories.length * 70));
          }
        }, 100);
      }, 100);
    }, 100);
  }
}
