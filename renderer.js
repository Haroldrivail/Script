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

  try {
    const result = await window.api.organizeFolder(selectedFolderPath);

    if (result.success) {
      // Show success message
      statusElement.className = "status success";
      statusElement.textContent = `Success! Organized ${result.filesMoved} files in ${result.directoryPath}`;

      // Display statistics
      if (result.stats) {
        displayStats(result.stats);
      }
    } else {
      // Show error message
      statusElement.className = "status error";
      statusElement.textContent = `Error: ${
        result.error || "Failed to organize folder"
      }`;
    }
  } catch (error) {
    // Show error message
    statusElement.className = "status error";
    statusElement.textContent = `Error: ${
      error.message || "Unknown error occurred"
    }`;
  }

  // Re-enable button
  organizeBtn.disabled = false;
});

// Display statistics
function displayStats(stats) {
  statsGrid.innerHTML = "";

  for (const [category, count] of Object.entries(stats)) {
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

  statsContainer.style.display = "block";
}
