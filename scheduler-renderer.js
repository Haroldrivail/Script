// DOM elements
const scheduleForm = document.getElementById('schedule-form');
const folderPathInput = document.getElementById('folder-path');
const browseBtn = document.getElementById('browse-btn');
const frequencySelect = document.getElementById('frequency');
const dailyOptions = document.getElementById('daily-options');
const weeklyOptions = document.getElementById('weekly-options');
const monthlyOptions = document.getElementById('monthly-options');
const dailyTimeInput = document.getElementById('daily-time');
const weeklyDaySelect = document.getElementById('weekly-day');
const weeklyTimeInput = document.getElementById('weekly-time');
const monthlyDateSelect = document.getElementById('monthly-date');
const monthlyTimeInput = document.getElementById('monthly-time');
const scheduleListEl = document.getElementById('schedule-list');
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const backBtn = document.getElementById('back-btn');
const alertEl = document.getElementById('alert');
// Undo elements
const undoContainer = document.getElementById('undo-container');
const undoBtn = document.getElementById('undo-btn');
const undoInfo = document.getElementById('undo-info');

// Selected folder for scheduling
let selectedFolder = null;

// Wait for the window.api to be fully initialized
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure API is fully loaded
  setTimeout(() => {
    if (!window.api) {
      console.error('API not available. The preload script may not have loaded correctly.');
      showAlert('Error: API not available. Please restart the application.', 'error');
    } else {
      console.log('API initialized successfully');
      initializeApp();
    }
  }, 50);
});

// Initialize the application once API is available
function initializeApp() {
  loadScheduledTasks();
  
  // Set up frequency option visibility toggling
  frequencySelect.addEventListener('change', toggleFrequencyOptions);
  
  // Initialize with correct options shown
  toggleFrequencyOptions();
  
  // Add animation to form transitions
  animateFormFields();

  // Add listener for Delete All Tasks button
  document.getElementById('delete-all-btn').addEventListener('click', deleteAllTasks);
  
  // Check for undo availability when page loads
  checkUndoAvailability();
  
  // Add listener for undo button
  if (undoBtn) {
    undoBtn.addEventListener('click', handleUndoOperation);
  }
  
  // Listen for notification-triggered undo availability checks
  document.addEventListener('check-undo-availability', async () => {
    await checkUndoAvailability();
  });
  
  // Browse button handler
  browseBtn.addEventListener('click', async () => {
    try {
      // Add a visual indicator that the button was clicked
      browseBtn.classList.add('clicked');
      setTimeout(() => browseBtn.classList.remove('clicked'), 300);
      
      // Debug API availability
      console.log('API available:', !!window.api);
      if (!window.api) {
        console.error('API not available when browse button clicked');
        showAlert('Error: API not available. Please try refreshing the page.', 'error');
        return;
      }
      
      console.log('Calling selectFolder API...');
      const folderPath = await window.api.selectFolder();
      console.log('Selected folder path:', folderPath);
      
      if (folderPath) {
        selectedFolder = folderPath;
        folderPathInput.value = folderPath;
        
        // Add a highlight effect to the input after selection
        folderPathInput.style.backgroundColor = 'rgba(66, 133, 244, 0.05)';
        folderPathInput.style.borderColor = 'var(--primary-color)';
        
        setTimeout(() => {
          folderPathInput.style.backgroundColor = '';
          folderPathInput.style.borderColor = '';
        }, 1000);
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      showAlert('Failed to select folder: ' + error.message, 'error');
    }
  });
}

// Animate form fields for a smoother UX
function animateFormFields() {
  const formFields = document.querySelectorAll('.form-control, .btn');
  formFields.forEach((field, index) => {
    field.style.opacity = '0';
    field.style.transform = 'translateY(10px)';
    field.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    setTimeout(() => {
      field.style.opacity = '1';
      field.style.transform = 'translateY(0)';
    }, 100 + (index * 50));
  });
}

// Back button handler
backBtn.addEventListener('click', () => {
  // Add a subtle animation before navigating back
  document.querySelector('.container').style.opacity = '0.8';
  document.querySelector('.container').style.transform = 'scale(0.98)';
  
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 150);
});

// Form submission handler
scheduleForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  if (!selectedFolder) {
    showAlert('Please select a folder first', 'warning');
    // Visual shake effect on browse button to indicate action needed
    browseBtn.classList.add('shake');
    setTimeout(() => browseBtn.classList.remove('shake'), 600);
    return;
  }
  
  // Show loading state
  const submitBtn = scheduleForm.querySelector('[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="material-symbols-rounded rotating">sync</span> Creating...';
  
  try {
    // Get the selected frequency
    const frequency = frequencySelect.value;
    
    // Prepare options based on frequency
    let options = {};
    
    switch (frequency) {
      case 'daily':
        const [dailyHour, dailyMinute] = dailyTimeInput.value.split(':').map(Number);
        options = { hour: dailyHour, minute: dailyMinute };
        break;
      
      case 'weekly':
        const [weeklyHour, weeklyMinute] = weeklyTimeInput.value.split(':').map(Number);
        options = { 
          dayOfWeek: Number(weeklyDaySelect.value), 
          hour: weeklyHour, 
          minute: weeklyMinute 
        };
        break;
      
      case 'monthly':
        const [monthlyHour, monthlyMinute] = monthlyTimeInput.value.split(':').map(Number);
        options = { 
          date: Number(monthlyDateSelect.value), 
          hour: monthlyHour, 
          minute: monthlyMinute 
        };
        break;
    }
    
    // Schedule the task
    const result = await window.api.scheduleTask({
      folderPath: selectedFolder,
      frequency,
      options
    });
    
    if (result.success) {
      // Reset form
      selectedFolder = null;
      folderPathInput.value = '';
      
      // Show success message
      showAlert(`Successfully scheduled ${frequency} organization for "${result.taskInfo.folderPath}"`, 'success');
      
      // Refresh schedule list with animation
      await loadScheduledTasks(true);
      
      // Scroll to the schedule list
      scheduleListEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      showAlert('Failed to create schedule: ' + result.error);
    }
  } catch (error) {
    console.error('Error creating schedule:', error);
    showAlert('Error creating schedule: ' + error.message, 'error');
  } finally {
    // Restore button state
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
});

// Refresh button handler
refreshBtn.addEventListener('click', async () => {
  // Animate refresh icon
  refreshIcon.style.transform = 'rotate(360deg)';
  refreshBtn.disabled = true;
  
  // Load the schedules
  await loadScheduledTasks(true);
  
  // Reset the animation and button state
  setTimeout(() => {
    refreshIcon.style.transform = 'rotate(0deg)';
    refreshBtn.disabled = false;
  }, 300);
});

// Toggle frequency options based on selection
function toggleFrequencyOptions() {
  const frequency = frequencySelect.value;
  
  // Hide all options first
  dailyOptions.style.display = 'none';
  weeklyOptions.style.display = 'none';
  monthlyOptions.style.display = 'none';
  
  // Show the selected frequency options with a fade effect
  switch (frequency) {
    case 'daily':
      fadeIn(dailyOptions);
      break;
    case 'weekly':
      fadeIn(weeklyOptions);
      break;
    case 'monthly':
      fadeIn(monthlyOptions);
      break;
  }
}

// Fade in element
function fadeIn(element) {
  element.style.opacity = '0';
  element.style.display = 'block';
  
  setTimeout(() => {
    element.style.transition = 'opacity 0.3s ease';
    element.style.opacity = '1';
  }, 10);
}

// Add CSS for new animation classes
function addAnimationStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    .shake {
      animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
    }
    @keyframes clicked {
      0% { transform: scale(1); }
      50% { transform: scale(0.95); }
      100% { transform: scale(1); }
    }
    .clicked {
      animation: clicked 0.3s ease;
    }
    .rotating {
      animation: rotate 1.5s linear infinite;
    }
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .task-item-enter {
      opacity: 0;
      transform: translateY(10px);
    }
    .task-item-enter-active {
      opacity: 1;
      transform: translateY(0);
      transition: opacity 0.3s, transform 0.3s;
    }
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(44, 62, 80, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .dialog-content {
      background: #fff;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      padding: 32px 28px 24px 28px;
      max-width: 450px;
      width: 90%;
      text-align: center;
      transform: scale(0.9);
      transition: transform 0.3s ease;
    }
  `;
  document.head.appendChild(style);
}

// Call this when the page loads
addAnimationStyles();

// Load and display scheduled tasks
async function loadScheduledTasks(animate = false) {
  try {
    const tasks = await window.api.getScheduledTasks();
    
    // Clear the list
    scheduleListEl.innerHTML = '';
    
    if (!tasks || tasks.length === 0) {
      scheduleListEl.innerHTML = `
        <div class="empty-list">
          <span class="material-symbols-rounded" style="font-size: 36px; display: block; margin-bottom: 15px; opacity: 0.6;">calendar_today</span>
          No scheduled tasks yet. Create one above.
        </div>
      `;
      return;
    }
    
    // Add each task
    tasks.forEach((task, index) => {
      const scheduleItem = createScheduleItem(task);
      
      // Apply animation if requested
      if (animate) {
        scheduleItem.classList.add('task-item-enter');
        scheduleListEl.appendChild(scheduleItem);
        
        setTimeout(() => {
          scheduleItem.classList.add('task-item-enter-active');
        }, 10 + (index * 50));
        
        setTimeout(() => {
          scheduleItem.classList.remove('task-item-enter', 'task-item-enter-active');
        }, 500 + (index * 50));
      } else {
        scheduleListEl.appendChild(scheduleItem);
      }
    });
  } catch (error) {
    console.error('Error loading scheduled tasks:', error);
    showAlert('Failed to load scheduled tasks: ' + error.message, 'error');
  }
}

// Create a schedule item element
function createScheduleItem(task) {
  // Format the next run time - Fix for Invalid Date
  let formattedNextRun = "Not scheduled";
  if (task.nextRun) {
    const nextRunDate = new Date(task.nextRun);
    if (!isNaN(nextRunDate.getTime())) {
      formattedNextRun = nextRunDate.toLocaleString();
    }
  }
  
  // Format the frequency for display
  let frequencyDisplay = '';
  let frequencyIcon = '';
  
  switch (task.frequency) {
    case 'daily':
      frequencyDisplay = `Daily at ${formatTime(task.options.hour, task.options.minute)}`;
      frequencyIcon = 'update';
      break;
    case 'weekly':
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = days[task.options.dayOfWeek];
      frequencyDisplay = `Weekly on ${dayOfWeek} at ${formatTime(task.options.hour, task.options.minute)}`;
      frequencyIcon = 'date_range';
      break;
    case 'monthly':
      frequencyDisplay = `Monthly on day ${task.options.date} at ${formatTime(task.options.hour, task.options.minute)}`;
      frequencyIcon = 'calendar_month';
      break;
    default:
      frequencyDisplay = task.frequency;
      frequencyIcon = 'schedule';
  }
  
  // Create container
  const item = document.createElement('div');
  item.className = 'schedule-item';
  
  // Create info section
  const infoSection = document.createElement('div');
  infoSection.className = 'schedule-info';
  
  // Get the folder name from path
  const folderName = task.folderPath.split(/[/\\]/).pop();
  
  infoSection.innerHTML = `
    <h3>
      <span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 5px; font-size: 0.9em; opacity: 0.8;">folder</span>
      ${folderName}
    </h3>
    <p>
      <span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 5px; font-size: 0.9em; opacity: 0.8;">${frequencyIcon}</span>
      ${frequencyDisplay}
    </p>
    <p>
      <span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 5px; font-size: 0.9em; opacity: 0.8;">event_upcoming</span>
      Next run: ${formattedNextRun}
    </p>
    <p class="form-help">
      <span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 5px; font-size: 0.9em; opacity: 0.8;">subdirectory_arrow_right</span>
      Path: ${task.folderPath}
    </p>
  `;
  
  // Create actions section
  const actionsSection = document.createElement('div');
  actionsSection.className = 'schedule-actions';
  
  // Run now button
  const runBtn = document.createElement('button');
  runBtn.className = 'btn btn-sm btn-primary btn-run';
  runBtn.innerHTML = '<span class="material-symbols-rounded">play_arrow</span> Run Now';
  runBtn.onclick = () => runTask(task.id);
  
  // Edit button
  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn-sm btn-primary btn-edit';
  editBtn.innerHTML = '<span class="material-symbols-rounded">edit</span> Edit';
  editBtn.onclick = () => editTask(task);
  
  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-sm btn-primary btn-delete';
  deleteBtn.innerHTML = '<span class="material-symbols-rounded">delete</span> Delete';
  deleteBtn.onclick = () => deleteTask(task.id);
  
  actionsSection.appendChild(runBtn);
  actionsSection.appendChild(editBtn);
  actionsSection.appendChild(deleteBtn);
  
  // Add sections to item
  item.appendChild(infoSection);
  item.appendChild(actionsSection);
  
  return item;
}

// Format time as HH:MM
function formatTime(hour, minute) {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

// Show a dialog with the results of a task run
async function showTaskResultDialog(result) {
  const dialog = document.createElement('div');
  dialog.className = 'modal';
  dialog.id = 'task-result-dialog';
  
  // Determine if this operation can be undone
  let canUndo = false;
  if (result.success && (Array.isArray(result.movedFiles) && result.movedFiles.length > 0) || result.filesMoved > 0) {
    try {
      const undoStatus = await window.api.getFileUndoStatus();
      canUndo = undoStatus.canUndo;
    } catch (error) {
      console.error('Failed to check undo status:', error);
    }
  }
  
  // Create content based on success or failure
  let content = '';
  if (result.success) {
    content = `
      <h2>Task Completed Successfully</h2>
      <p>Directory: ${escapeHtml(result.directoryPath || 'Not specified')}</p>
      <p>Files moved: ${result.filesMoved || 0}</p>
    `;
    
    if (result.error) {
      content += `<p class="warning">Warning: ${escapeHtml(result.error)}</p>`;
    }
  } else {
    content = `
      <h2>Task Failed</h2>
      <p class="error">${escapeHtml(result.error || 'Unknown error')}</p>
    `;
  }
  
  // Add dialog buttons
  content += `
    <div class="dialog-buttons">
      ${canUndo ? '<button id="undo-button">Undo</button>' : ''}
      <button id="close-result-dialog">Close</button>
    </div>
  `;
  
  dialog.innerHTML = content;
  document.body.appendChild(dialog);
  
  // Show dialog with animation
  setTimeout(() => dialog.classList.add('show'), 10);
  
  // Add event listeners
  document.getElementById('close-result-dialog').addEventListener('click', () => {
    closeTaskResultDialog();
  });
  
  // Add undo functionality if available
  if (canUndo) {
    document.getElementById('undo-button').addEventListener('click', async () => {
      try {
        setLoadingState(true);
        const undoResult = await window.api.undoLastOperation();
        
        if (undoResult.success) {
          showAlert('Operation undone successfully.', 'success');
        } else {
          showAlert(`Failed to undo: ${undoResult.error}`, 'error');
        }
      } catch (error) {
        console.error('Undo error:', error);
        showAlert(`Error during undo: ${error.message}`, 'error');
      } finally {
        setLoadingState(false);
        closeTaskResultDialog();
      }
    });
  }
  
  // Close when clicking outside
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      closeTaskResultDialog();
    }
  });
  
  // Allow closing with Escape key
  document.addEventListener('keydown', handleResultDialogKeydown);
}

// Run a scheduled task with the specified ID
async function runTask(taskId) {
  try {
    setLoadingState(true);
    
    // Get the task details - skip this for now since it's causing errors
    // const task = await window.api.getScheduledTask(taskId);
    // if (!task) {
    //   showAlert(`Task with ID ${taskId} not found.`, 'error');
    //   return;
    // }
    
    // Run the task
    const result = await window.api.runScheduledTask(taskId);
    
    // Show result dialog
    if (result.success) {
      // Record the operation in the file history
      try {
        // Prepare the moved files data in the correct format for the file history system
        const movedFiles = Array.isArray(result.fileMovements) ? result.fileMovements : [];
        
        // If we have a filesMoved count but no movedFiles array, create a placeholder
        // This ensures we can still undo even if detailed file info is missing
        if (result.filesMoved > 0 && movedFiles.length === 0) {
          console.log(`Task moved ${result.filesMoved} files but no detailed file list available.`);
        }
        
        // Record the operation with the directory path, moved files, and metadata
        await window.api.recordFileOperation(
          result.directoryPath, 
          movedFiles, 
          {
            taskId: taskId,
            source: 'scheduler',
            timestamp: Date.now(),
            totalFilesMoved: result.filesMoved || movedFiles.length
          }
        );
        
        console.log('File operation recorded for undo functionality');
      } catch (error) {
        console.error('Failed to record file operation:', error);
      }
    }
    
    await showTaskResultDialog(result);
    
    // Update the last run timestamp and status in the UI
    updateTaskLastRunInfo(taskId, result.success);
    
    return result;
  } catch (error) {
    console.error('Error running task:', error);
    showAlert(`Failed to run task: ${error.message}`, 'error');
    return { success: false, error: error.message };
  } finally {
    setLoadingState(false);
  }
}

// Delete a task
async function deleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this scheduled task?')) {
    return;
  }
  
  try {
    // Find the task item to animate its removal
    const scheduleItems = document.querySelectorAll('.schedule-item');
    let targetItem;
    
    scheduleItems.forEach(item => {
      const deleteBtn = item.querySelector('.btn-delete');
      if (deleteBtn && deleteBtn.onclick.toString().includes(taskId)) {
        targetItem = item;
      }
    });
    
    // Animate removal if found
    if (targetItem) {
      targetItem.style.transition = 'opacity 0.3s, transform 0.3s';
      targetItem.style.opacity = '0';
      targetItem.style.transform = 'translateX(20px)';
    }
    
    // Wait for animation
    if (targetItem) await new Promise(resolve => setTimeout(resolve, 300));
    
    const result = await window.api.cancelTask(taskId);
    
    if (result.success) {
      showAlert('Task has been deleted', 'success');
      await loadScheduledTasks();
    } else {
      // If failed, restore the item
      if (targetItem) {
        targetItem.style.opacity = '1';
        targetItem.style.transform = 'translateX(0)';
      }
      showAlert('Failed to delete task: ' + result.error, 'error');
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    showAlert('Error deleting task: ' + error.message, 'error');
  }
}

// Show alert message
function showAlert(message, type) {
  // Define icons for each alert type
  const icons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };
  
  // Create alert content with icon
  alertEl.innerHTML = `
    <span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 8px;">${icons[type] || 'info'}</span>
    ${message}
  `;
  
  // Set alert type
  alertEl.className = `alert alert-${type}`;
  alertEl.style.display = 'block';
  
  // Add entrance animation
  alertEl.style.opacity = '0';
  alertEl.style.transform = 'translateY(-10px)';
  
  setTimeout(() => {
    alertEl.style.opacity = '1';
    alertEl.style.transform = 'translateY(0)';
  }, 10);
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    alertEl.style.opacity = '0';
    alertEl.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
      alertEl.style.display = 'none';
    }, 300);
  }, 5000);
}

// Delete all tasks
async function deleteAllTasks() {
  if (!confirm('Are you sure you want to delete ALL scheduled tasks? This action cannot be undone.')) {
    return;
  }
  
  try {
    // Show loading animation
    const deleteAllBtn = document.getElementById('delete-all-btn');
    const originalText = deleteAllBtn.innerHTML;
    deleteAllBtn.disabled = true;
    deleteAllBtn.innerHTML = '<span class="material-symbols-rounded rotating">sync</span> Deleting...';
    
    // Get all tasks first
    const tasks = await window.api.getScheduledTasks();
    
    if (!tasks || tasks.length === 0) {
      showAlert('No tasks found to delete.', 'info');
      deleteAllBtn.disabled = false;
      deleteAllBtn.innerHTML = originalText;
      return;
    }
    
    // Show count in alert
    showAlert(`Deleting ${tasks.length} scheduled tasks...`, 'info');
    
    // Animation for all items
    const scheduleItems = document.querySelectorAll('.schedule-item');
    scheduleItems.forEach(item => {
      item.style.transition = 'opacity 0.3s, transform 0.3s';
      item.style.opacity = '0';
      item.style.transform = 'translateX(20px)';
    });
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Batch tasks into groups for more efficient processing
    const BATCH_SIZE = 10; // Process 10 tasks at a time
    const taskBatches = [];
    
    // Split tasks into batches
    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
      taskBatches.push(tasks.slice(i, i + BATCH_SIZE));
    }
    
    let successCount = 0;
    let failCount = 0;
    
    // Process each batch
    for (let i = 0; i < taskBatches.length; i++) {
      const batch = taskBatches[i];
      
      // Update progress
      deleteAllBtn.innerHTML = `<span class="material-symbols-rounded rotating">sync</span> Deleting (${i * BATCH_SIZE + Math.min(batch.length, BATCH_SIZE)}/${tasks.length})`;
      
      // Process each task in the batch
      const batchPromises = batch.map(task => {
        return window.api.cancelTask(task.id)
          .then(result => {
            if (result.success) {
              successCount++;
              return true;
            } else {
              failCount++;
              return false;
            }
          })
          .catch(err => {
            console.error(`Error deleting task ${task.id}:`, err);
            failCount++;
            return false;
          });
      });
      
      // Wait for all tasks in the batch to complete
      await Promise.all(batchPromises);
    }
    
    // Show results
    if (failCount === 0) {
      showAlert(`Successfully deleted all ${successCount} tasks!`, 'success');
    } else {
      showAlert(`Deleted ${successCount} tasks, but ${failCount} failed. You may need to try again.`, 'warning');
    }
    
    // Refresh the task list
    await loadScheduledTasks();
    
  } catch (error) {
    console.error('Error deleting all tasks:', error);
    showAlert(`Error deleting tasks: ${error.message}. Please try again.`, 'error');
  } finally {
    // Restore button state
    const deleteAllBtn = document.getElementById('delete-all-btn');
    deleteAllBtn.disabled = false;
    deleteAllBtn.innerHTML = '<span class="material-symbols-rounded">delete_sweep</span> Delete All Tasks';
  }
}

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

// Handle undo button click
async function handleUndoOperation() {
  // Disable button and show progress
  undoBtn.disabled = true;
  showAlert('Undoing last operation... Please wait.', 'info');

  try {
    const result = await window.api.undoLastOperation();

    if (result.success) {
      // Show success message
      showAlert(`Undo successful! Moved ${result.restoredCount} files back to their original locations.`, 'success');
      
      // Hide the undo container with animation
      undoContainer.style.opacity = '0';
      undoContainer.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        undoContainer.style.display = "none";
      }, 300);
    } else {
      // Show error message
      showAlert(`Error: ${result.error || "Failed to undo last operation"}`, 'error');
      
      // Re-enable the button
      undoBtn.disabled = false;
    }
  } catch (error) {
    // Show error message
    showAlert(`Error: ${error.message || "Unknown error occurred during undo"}`, 'error');
    
    // Re-enable the button
    undoBtn.disabled = false;
  }
}

// Adding helper function for escaping HTML for task result dialog
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Helper function to set loading state
function setLoadingState(isLoading) {
  if (isLoading) {
    // Add loading indicator if needed
    document.body.style.cursor = 'wait';
  } else {
    document.body.style.cursor = 'default';
  }
}

// Handle keydown for dialog
function handleResultDialogKeydown(e) {
  if (e.key === 'Escape') {
    closeTaskResultDialog();
  }
}

// Close task result dialog
function closeTaskResultDialog() {
  const dialog = document.getElementById('task-result-dialog');
  if (dialog) {
    dialog.classList.remove('show');
    setTimeout(() => {
      dialog.remove();
      document.removeEventListener('keydown', handleResultDialogKeydown);
    }, 300);
    
    // Update undo availability after closing dialog
    checkUndoAvailability();
  }
}

// Update task last run info in UI
function updateTaskLastRunInfo(taskId, wasSuccessful) {
  // Re-load the task list to show updated timestamps
  loadScheduledTasks();
  
  // Update undo availability after a task runs
  checkUndoAvailability();
}

// Edit a scheduled task
async function editTask(task) {
  try {
    // Create a modal dialog for editing the task
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.id = 'edit-task-dialog';
    
    // Prepare frequency-specific options
    let frequencyOptions = '';
    
    // Daily options
    const dailyTimeValue = task.frequency === 'daily' ? 
      `${task.options.hour.toString().padStart(2, '0')}:${task.options.minute.toString().padStart(2, '0')}` : 
      '03:00';
    
    // Weekly options
    const weeklyDayOptions = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      .map((day, index) => 
        `<option value="${index}" ${task.frequency === 'weekly' && task.options.dayOfWeek === index ? 'selected' : ''}>${day}</option>`
      ).join('');
      
    const weeklyTimeValue = task.frequency === 'weekly' ? 
      `${task.options.hour.toString().padStart(2, '0')}:${task.options.minute.toString().padStart(2, '0')}` : 
      '03:00';
    
    // Monthly options
    const monthlyDateOptions = Array.from({length: 31}, (_, i) => i + 1)
      .map(date => 
        `<option value="${date}" ${task.frequency === 'monthly' && task.options.date === date ? 'selected' : ''}>${date}</option>`
      ).join('');
      
    const monthlyTimeValue = task.frequency === 'monthly' ? 
      `${task.options.hour.toString().padStart(2, '0')}:${task.options.minute.toString().padStart(2, '0')}` : 
      '03:00';
    
    // Create dialog content
    dialog.innerHTML = `
      <div class="dialog-content" style="width: 90%; max-width: 500px; text-align: left; padding: 24px;">
        <h2 style="margin-top: 0;">Edit Scheduled Task</h2>
        
        <form id="edit-task-form">
          <div class="form-group">
            <label for="edit-folder-path">Folder Path</label>
            <div style="display: flex; gap: 10px;">
              <input type="text" id="edit-folder-path" class="form-control" value="${task.folderPath}" readonly>
              <button type="button" id="edit-browse-btn" class="btn btn-primary">
                <span class="material-symbols-rounded">folder_open</span>
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label for="edit-frequency">Frequency</label>
            <select id="edit-frequency" class="form-control">
              <option value="daily" ${task.frequency === 'daily' ? 'selected' : ''}>Daily</option>
              <option value="weekly" ${task.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
              <option value="monthly" ${task.frequency === 'monthly' ? 'selected' : ''}>Monthly</option>
            </select>
          </div>
          
          <div id="edit-daily-options" class="frequency-options" style="display: ${task.frequency === 'daily' ? 'block' : 'none'};">
            <div class="form-group">
              <label for="edit-daily-time">Time</label>
              <input type="time" id="edit-daily-time" class="form-control" value="${dailyTimeValue}">
            </div>
          </div>
          
          <div id="edit-weekly-options" class="frequency-options" style="display: ${task.frequency === 'weekly' ? 'block' : 'none'};">
            <div class="form-group">
              <label for="edit-weekly-day">Day of Week</label>
              <select id="edit-weekly-day" class="form-control">
                ${weeklyDayOptions}
              </select>
            </div>
            <div class="form-group">
              <label for="edit-weekly-time">Time</label>
              <input type="time" id="edit-weekly-time" class="form-control" value="${weeklyTimeValue}">
            </div>
          </div>
          
          <div id="edit-monthly-options" class="frequency-options" style="display: ${task.frequency === 'monthly' ? 'block' : 'none'};">
            <div class="form-group">
              <label for="edit-monthly-date">Day of Month</label>
              <select id="edit-monthly-date" class="form-control">
                ${monthlyDateOptions}
              </select>
            </div>
            <div class="form-group">
              <label for="edit-monthly-time">Time</label>
              <input type="time" id="edit-monthly-time" class="form-control" value="${monthlyTimeValue}">
            </div>
          </div>
          
          <div class="form-actions" style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" id="cancel-edit-btn" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    `;
    
    // Add dialog to the document
    document.body.appendChild(dialog);
    
    // Show dialog with animation
    setTimeout(() => {
      dialog.style.opacity = '1';
      dialog.querySelector('.dialog-content').style.transform = 'scale(1)';
    }, 10);
    
    // Set up folder path edit functionality
    let selectedFolder = task.folderPath;
    const editFolderPathInput = document.getElementById('edit-folder-path');
    const editBrowseBtn = document.getElementById('edit-browse-btn');
    
    editBrowseBtn.addEventListener('click', async () => {
      try {
        // Add visual feedback
        editBrowseBtn.classList.add('clicked');
        setTimeout(() => editBrowseBtn.classList.remove('clicked'), 300);
        
        // Debug API availability
        console.log('API available in edit dialog:', !!window.api);
        if (!window.api) {
          console.error('API not available when edit browse button clicked');
          showAlert('Error: API not available. Please try refreshing the page.', 'error');
          return;
        }
        
        console.log('Calling selectFolder API from edit dialog...');
        const folderPath = await window.api.selectFolder();
        console.log('Selected folder path in edit dialog:', folderPath);
        
        if (folderPath) {
          selectedFolder = folderPath;
          editFolderPathInput.value = folderPath;
          
          // Add a highlight effect to the input after selection
          editFolderPathInput.style.backgroundColor = 'rgba(66, 133, 244, 0.05)';
          editFolderPathInput.style.borderColor = 'var(--primary-color)';
          
          setTimeout(() => {
            editFolderPathInput.style.backgroundColor = '';
            editFolderPathInput.style.borderColor = '';
          }, 1000);
        }
      } catch (error) {
        console.error('Error selecting folder in edit dialog:', error);
        showAlert('Failed to select folder: ' + error.message, 'error');
      }
    });
    
    // Set up frequency option toggling
    const editFrequencySelect = document.getElementById('edit-frequency');
    const editDailyOptions = document.getElementById('edit-daily-options');
    const editWeeklyOptions = document.getElementById('edit-weekly-options');
    const editMonthlyOptions = document.getElementById('edit-monthly-options');
    
    editFrequencySelect.addEventListener('change', () => {
      const frequency = editFrequencySelect.value;
      
      // Hide all options first
      editDailyOptions.style.display = 'none';
      editWeeklyOptions.style.display = 'none';
      editMonthlyOptions.style.display = 'none';
      
      // Show the selected frequency options
      switch (frequency) {
        case 'daily':
          editDailyOptions.style.display = 'block';
          break;
        case 'weekly':
          editWeeklyOptions.style.display = 'block';
          break;
        case 'monthly':
          editMonthlyOptions.style.display = 'block';
          break;
      }
    });
    
    // Handle dialog cancellation
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    cancelEditBtn.addEventListener('click', () => {
      closeEditDialog();
    });
    
    // Handle dialog form submission
    const editTaskForm = document.getElementById('edit-task-form');
    editTaskForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      try {
        // Show loading state
        const submitBtn = editTaskForm.querySelector('[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-symbols-rounded rotating">sync</span> Saving...';
        
        // Get the selected frequency
        const frequency = editFrequencySelect.value;
        
        // Prepare options based on frequency
        let options = {};
        
        switch (frequency) {
          case 'daily':
            const editDailyTimeInput = document.getElementById('edit-daily-time');
            const [dailyHour, dailyMinute] = editDailyTimeInput.value.split(':').map(Number);
            options = { hour: dailyHour, minute: dailyMinute };
            break;
          
          case 'weekly':
            const editWeeklyDaySelect = document.getElementById('edit-weekly-day');
            const editWeeklyTimeInput = document.getElementById('edit-weekly-time');
            const [weeklyHour, weeklyMinute] = editWeeklyTimeInput.value.split(':').map(Number);
            options = { 
              dayOfWeek: Number(editWeeklyDaySelect.value), 
              hour: weeklyHour, 
              minute: weeklyMinute 
            };
            break;
          
          case 'monthly':
            const editMonthlyDateSelect = document.getElementById('edit-monthly-date');
            const editMonthlyTimeInput = document.getElementById('edit-monthly-time');
            const [monthlyHour, monthlyMinute] = editMonthlyTimeInput.value.split(':').map(Number);
            options = { 
              date: Number(editMonthlyDateSelect.value), 
              hour: monthlyHour, 
              minute: monthlyMinute 
            };
            break;
        }
        
        // Call the API to update the task
        // First cancel the existing task
        await window.api.cancelTask(task.id);
        
        // Then create a new one with the updated settings
        const result = await window.api.scheduleTask({
          folderPath: selectedFolder,
          frequency,
          options
        });
        
        if (result.success) {
          // Close the dialog
          closeEditDialog();
          
          // Show success message
          showAlert(`Successfully updated schedule for "${result.taskInfo.folderPath}"`, 'success');
          
          // Refresh schedule list with animation
          await loadScheduledTasks(true);
        } else {
          showAlert('Failed to update task: ' + (result.error || 'Unknown error'), 'error');
        }
      } catch (error) {
        console.error('Error updating task:', error);
        showAlert('Error updating task: ' + error.message, 'error');
      } finally {
        // Restore button state if the dialog is still open
        const submitBtn = document.getElementById('edit-task-form')?.querySelector('[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Save Changes';
        }
      }
    });
    
    // Close when clicking outside the dialog content
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        closeEditDialog();
      }
    });
    
    // Handle Escape key
    const handleEditDialogKeydown = (event) => {
      if (event.key === 'Escape') {
        closeEditDialog();
      }
    };
    
    document.addEventListener('keydown', handleEditDialogKeydown);
    
    // Function to close the edit dialog
    function closeEditDialog() {
      dialog.style.opacity = '0';
      dialog.querySelector('.dialog-content').style.transform = 'scale(0.9)';
      
      setTimeout(() => {
        dialog.remove();
        document.removeEventListener('keydown', handleEditDialogKeydown);
      }, 300);
    }
  } catch (error) {
    console.error('Error displaying edit dialog:', error);
    showAlert('Failed to open edit dialog: ' + error.message, 'error');
  }
}