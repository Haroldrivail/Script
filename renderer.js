// DOM elements
const selectedPathElement = document.getElementById("selected-path");
const selectFolderBtn = document.getElementById("select-folder-btn");
const organizeBtn = document.getElementById("organize-btn");
const statusElement = document.getElementById("status");
const statsContainer = document.getElementById("stats-container");
const statsGrid = document.getElementById("stats-grid");

// Track selected folder path
let selectedFolderPath = null;

// Handle folder selection
selectFolderBtn.addEventListener("click", async () => {
  const folderPath = await window.api.selectFolder();

  if (folderPath) {
    selectedFolderPath = folderPath;
    selectedPathElement.textContent = folderPath;
    organizeBtn.disabled = false;

    // Reset previous results
    statusElement.className = "status";
    statusElement.style.display = "none";
    statsContainer.style.display = "none";
    statsGrid.innerHTML = "";
    // Removed: check for non-category folders and propose removal here
  }
});

// Handle folder organization
organizeBtn.addEventListener("click", async () => {
  if (!selectedFolderPath) return;

  // Disable button and show progress
  organizeBtn.disabled = true;
  statusElement.className = "status";
  statusElement.textContent = "Organizing files... This may take a moment.";
  statusElement.style.display = "block";
  statusElement.setAttribute('aria-busy', 'true');

  try {
    const result = await window.api.organizeFolder(selectedFolderPath);

    if (result.success) {
      // Show success message
      statusElement.className = "status success";
      statusElement.textContent = `Success! Organized ${result.filesMoved} files in ${result.directoryPath}`;
      statusElement.setAttribute('aria-busy', 'false');

      // Display statistics
      if (result.stats) {
        displayStats(result.stats);
      }

      // After organizing, check for non-category folders and propose removal
      const res = await window.api.getNonCategoryFolders(selectedFolderPath);
      if (res.success && res.folders && res.folders.length > 0) {
        showFolderCleanupDialog(res.folders);
      }
    } else {
      // Show error message
      statusElement.className = "status error";
      statusElement.textContent = `Error: ${
        result.error || "Failed to organize folder"
      }`;
      statusElement.setAttribute('aria-busy', 'false');
    }
  } catch (error) {
    // Show error message
    statusElement.className = "status error";
    statusElement.textContent = `Error: ${
      error.message || "Unknown error occurred"
    }`;
    statusElement.setAttribute('aria-busy', 'false');
  }

  // Re-enable button
  organizeBtn.disabled = false;
});

// UI: Show a custom modal dialog for non-category folder cleanup
function showFolderCleanupDialog(folders) {
  // Remove any existing modal
  const oldModal = document.getElementById('cleanup-modal');
  if (oldModal) oldModal.remove();

  // Create modal overlay
  const modal = document.createElement('div');
  modal.id = 'cleanup-modal';
  modal.style.position = 'fixed';
  modal.style.top = 0;
  modal.style.left = 0;
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(44,62,80,0.35)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = 1000;

  // Modal content
  const content = document.createElement('div');
  content.style.background = '#fff';
  content.style.borderRadius = '8px';
  content.style.boxShadow = '0 8px 32px rgba(44,62,80,0.18)';
  content.style.padding = '32px 28px 24px 28px';
  content.style.maxWidth = '400px';
  content.style.width = '90%';
  content.style.textAlign = 'center';

  const title = document.createElement('h2');
  title.textContent = 'Cleanup Suggestion';
  title.style.marginTop = '0';
  title.style.color = '#2980b9';
  content.appendChild(title);

  const msg = document.createElement('div');
  msg.style.margin = '18px 0 18px 0';
  msg.style.fontSize = '1.05em';
  msg.innerHTML = `The following folders are not recognized categories and may be from a previous version:<br><br><b>${folders.join('<br>')}</b><br><br>Would you like to remove them?`;
  content.appendChild(msg);

  // Buttons
  const btnRow = document.createElement('div');
  btnRow.style.display = 'flex';
  btnRow.style.justifyContent = 'center';
  btnRow.style.gap = '18px';
  btnRow.style.marginTop = '18px';

  const yesBtn = document.createElement('button');
  yesBtn.className = 'btn btn-success';
  yesBtn.textContent = 'Remove Folders';
  yesBtn.style.flex = '1';
  yesBtn.onclick = async () => {
    yesBtn.disabled = true;
    noBtn.disabled = true;
    yesBtn.textContent = 'Removing...';
    const removeRes = await window.api.removeFolders(selectedFolderPath, folders);
    if (removeRes.success) {
      statusElement.className = 'status success';
      statusElement.textContent = `Removed folders: ${removeRes.removed.join(', ')}`;
      statusElement.style.display = 'block';
    } else {
      statusElement.className = 'status error';
      statusElement.textContent = `Failed to remove folders: ${removeRes.error}`;
      statusElement.style.display = 'block';
    }
    modal.remove();
  };

  const noBtn = document.createElement('button');
  noBtn.className = 'btn btn-primary';
  noBtn.textContent = 'Keep Folders';
  noBtn.style.flex = '1';
  noBtn.onclick = () => {
    modal.remove();
  };

  btnRow.appendChild(yesBtn);
  btnRow.appendChild(noBtn);
  content.appendChild(btnRow);
  modal.appendChild(content);
  document.body.appendChild(modal);
}

// Display statistics
function displayStats(stats) {
  statsGrid.innerHTML = "";
  let total = 0;
  for (const [category, count] of Object.entries(stats)) {
    total += count;
    const statItem = document.createElement("div");
    statItem.className = "stats-item";
    const categoryElement = document.createElement("div");
    categoryElement.className = "category";
    categoryElement.textContent = category;
    const countElement = document.createElement("div");
    countElement.className = "count";
    countElement.textContent = count;
    statItem.appendChild(categoryElement);
    statItem.appendChild(countElement);
    statsGrid.appendChild(statItem);
  }
  if (total === 0) {
    statsContainer.style.display = "none";
    statusElement.className = "status error";
    statusElement.textContent = "No files were organized. The folder may already be organized or empty.";
  } else {
    statsContainer.style.display = "block";
  }
}
