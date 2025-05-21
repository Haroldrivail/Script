// DOM elements
const categoryNameInput = document.getElementById('category-name');
const categoryExtensionsInput = document.getElementById('category-extensions');
const categoryForm = document.getElementById('category-form');
const categoryList = document.getElementById('category-list');
const resetCategoriesButton = document.getElementById('reset-categories');
const backButton = document.getElementById('back-btn');
const alertBox = document.getElementById('alert');
const isEditingInput = document.getElementById('is-editing');
const cancelButton = document.getElementById('cancel-btn');
const loadingOverlay = document.getElementById('loading-overlay');
const extensionConflictsDiv = document.getElementById('extension-conflicts');

// Track the current categories
let currentCategories = {};

// Debug log for troubleshooting
console.log('Categories renderer script loaded');

// Initial loading of categories
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM content loaded, fetching categories...');
  showLoading(true);
  
  try {
    if (!window.api || !window.api.getCategories) {
      console.error('API not available: window.api =', window.api);
      showAlert('API communication error. Please restart the application.', 'error');
      categoryList.innerHTML = '<div class="category-item">Failed to load categories: API error</div>';
      return;
    }
    
    currentCategories = await window.api.getCategories();
    console.log('Categories loaded:', currentCategories);
    renderCategories();
  } catch (error) {
    console.error('Error loading categories:', error);
    showAlert('Error loading categories: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
});

// Back to main organizer page
backButton.addEventListener('click', (event) => {
  console.log('Back button clicked');
  event.preventDefault();
  window.location.href = 'index.html';
});

// Form submission for adding/updating categories
categoryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  const name = categoryNameInput.value.trim();
  const extensionsText = categoryExtensionsInput.value.trim();
  
  // Validate inputs
  if (!name) {
    showAlert('Please enter a category name', 'error');
    return;
  }
  
  if (!extensionsText) {
    showAlert('Please enter at least one file extension', 'error');
    return;
  }
  
  // Parse extensions
  const extensions = extensionsText.split(',')
    .map(ext => ext.trim())
    .filter(ext => ext); // Remove empty strings
  
  if (extensions.length === 0) {
    showAlert('Please enter valid file extensions', 'error');
    return;
  }
  
  // Check for extension conflicts
  const conflicts = await checkExtensionConflicts(extensions, name);
  
  if (conflicts.length > 0) {
    const conflictMsg = `These extensions are already used in other categories: ${conflicts.join(', ')}`;
    showAlert(conflictMsg, 'warning');
    return;
  }
  
  showLoading(true);
  
  try {
    // Update or add the category
    currentCategories = await window.api.updateCategory(name, extensions);
    
    // Update UI
    renderCategories();
    resetForm();
    showAlert(`Category "${name}" has been saved`, 'success');
  } catch (error) {
    showAlert('Error saving category: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
});

// Reset to default categories
resetCategoriesButton.addEventListener('click', async (event) => {
  console.log('Reset button clicked');
  event.preventDefault();
  
  if (!confirm('Are you sure you want to reset to default categories? This will remove all custom categories.')) {
    return;
  }
  
  showLoading(true);
  
  try {
    currentCategories = await window.api.resetCategories();
    console.log('Categories reset to defaults:', currentCategories);
    renderCategories();
    showAlert('Categories have been reset to defaults', 'success');
  } catch (error) {
    console.error('Error resetting categories:', error);
    showAlert('Error resetting categories: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
});

// Cancel button for editing
cancelButton.addEventListener('click', () => {
  resetForm();
});

// Check for extension conflicts
async function checkExtensionConflicts(extensions, categoryName) {
  const conflicts = [];
  
  for (const ext of extensions) {
    const cleanExt = ext.startsWith('.') ? ext : '.' + ext;
    const conflictCategory = await window.api.getExtensionCategory(cleanExt, categoryName);
    
    if (conflictCategory) {
      conflicts.push(`${cleanExt} (${conflictCategory})`);
    }
  }
  
  return conflicts;
}

// Update extension conflicts UI as user types
categoryExtensionsInput.addEventListener('input', async () => {
  const categoryName = categoryNameInput.value.trim();
  const extensionsText = categoryExtensionsInput.value.trim();
  
  if (!extensionsText) {
    extensionConflictsDiv.innerHTML = '';
    return;
  }
  
  const extensions = extensionsText.split(',')
    .map(ext => ext.trim())
    .filter(ext => ext);
  
  if (extensions.length === 0) {
    extensionConflictsDiv.innerHTML = '';
    return;
  }
  
  const conflicts = await checkExtensionConflicts(extensions, categoryName);
  
  if (conflicts.length > 0) {
    extensionConflictsDiv.innerHTML = `
      <div class="alert alert-warning" style="display: block; margin-top: 10px; font-size: 0.9em;">
        Conflicts found: ${conflicts.join(', ')}
      </div>
    `;
  } else {
    extensionConflictsDiv.innerHTML = '';
  }
});

// Render the list of categories
function renderCategories() {
  console.log('Rendering categories:', currentCategories);
  
  if (!currentCategories || Object.keys(currentCategories).length === 0) {
    categoryList.innerHTML = '<div class="category-item">No categories found</div>';
    return;
  }
  
  categoryList.innerHTML = '';
  
  Object.entries(currentCategories).forEach(([name, extensions]) => {
    const categoryItem = document.createElement('div');
    categoryItem.className = 'category-item';
    
    const categoryInfo = document.createElement('div');
    categoryInfo.innerHTML = `
      <div class="category-name">${name}</div>
      <div class="category-extensions">${extensions.join(', ')}</div>
    `;
    
    const actions = document.createElement('div');
    actions.className = 'actions';
    
    const editButton = document.createElement('button');
    editButton.className = 'btn btn-primary btn-sm';
    editButton.textContent = 'Edit';
    editButton.onclick = () => editCategory(name, extensions);
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-primary btn-sm';
    deleteButton.textContent = 'Delete';
    deleteButton.style.backgroundColor = '#e74c3c';
    deleteButton.onclick = () => deleteCategory(name);
    
    actions.appendChild(editButton);
    actions.appendChild(deleteButton);
    
    categoryItem.appendChild(categoryInfo);
    categoryItem.appendChild(actions);
    
    categoryList.appendChild(categoryItem);
  });
}

// Edit a category
function editCategory(name, extensions) {
  categoryNameInput.value = name;
  categoryExtensionsInput.value = extensions.join(', ');
  isEditingInput.value = 'true';
  cancelButton.style.display = 'inline-block';
  
  // Scroll to form
  categoryForm.scrollIntoView({ behavior: 'smooth' });
}

// Delete a category
async function deleteCategory(name) {
  if (!confirm(`Are you sure you want to delete the "${name}" category?`)) {
    return;
  }
  
  showLoading(true);
  
  try {
    currentCategories = await window.api.deleteCategory(name);
    renderCategories();
    showAlert(`Category "${name}" has been deleted`, 'success');
  } catch (error) {
    showAlert('Error deleting category: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

// Reset the form
function resetForm() {
  categoryNameInput.value = '';
  categoryExtensionsInput.value = '';
  isEditingInput.value = 'false';
  cancelButton.style.display = 'none';
  extensionConflictsDiv.innerHTML = '';
}

// Show alert message
function showAlert(message, type) {
  alertBox.textContent = message;
  alertBox.className = `alert alert-${type}`;
  alertBox.style.display = 'block';
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    alertBox.style.display = 'none';
  }, 5000);
}

// Show/hide loading overlay
function showLoading(show) {
  loadingOverlay.style.visibility = show ? 'visible' : 'hidden';
}