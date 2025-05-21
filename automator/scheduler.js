/**
 * scheduler.js
 * Manages scheduled folder organization tasks
 * Created: May 11, 2025
 */

const schedule = require('node-schedule');
const path = require('path');
const fs = require('fs');
const { organizeDirectory } = require('../organize-folders');
const { app, Notification } = require('electron');
const fileHistory = require('../file-history'); // Add file history module
const { BrowserWindow } = require('electron');

// Store the scheduled tasks
let scheduledJobs = {};

// File to store scheduled tasks configuration
const SCHEDULES_FILE = path.join(app.getPath('userData'), 'schedules.json');

/**
 * Load saved scheduled tasks
 * @returns {Array} Saved scheduled tasks
 */
function loadSchedules() {
  try {
    if (fs.existsSync(SCHEDULES_FILE)) {
      const data = fs.readFileSync(SCHEDULES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading schedules:', error);
  }
  return [];
}

/**
 * Save scheduled tasks to file
 * @param {Array} schedules - Scheduled tasks to save
 */
function saveSchedules(schedules) {
  try {
    fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(schedules, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving schedules:', error);
  }
}

/**
 * Schedule a folder organization task
 * @param {string} folderPath - Path to the folder to organize
 * @param {string} frequency - Frequency of organization (daily, weekly, monthly)
 * @param {Object} options - Additional scheduling options
 * @param {Array} foldersToPreserve - Folders to preserve during organization
 * @returns {Object} Scheduled task information
 */
function scheduleTask(folderPath, frequency, options = {}, foldersToPreserve = []) {
  // Generate a unique ID for this task
  const taskId = `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // Parse the schedule rule based on frequency
  let rule;
  
  switch (frequency) {
    case 'daily':
      // Schedule daily at specified hour (default: 3:00 AM)
      rule = new schedule.RecurrenceRule();
      rule.hour = options.hour || 3;
      rule.minute = options.minute || 0;
      break;
    
    case 'weekly':
      // Schedule weekly on specified day (default: Sunday) at specified hour (default: 3:00 AM)
      rule = new schedule.RecurrenceRule();
      rule.dayOfWeek = options.dayOfWeek !== undefined ? options.dayOfWeek : 0; // 0 = Sunday
      rule.hour = options.hour || 3;
      rule.minute = options.minute || 0;
      break;
    
    case 'monthly':
      // Schedule monthly on specified date (default: 1st) at specified hour (default: 3:00 AM)
      rule = new schedule.RecurrenceRule();
      rule.date = options.date || 1;
      rule.hour = options.hour || 3;
      rule.minute = options.minute || 0;
      break;
    
    case 'custom':
      // Use a custom cron expression
      if (options.cronExpression) {
        rule = options.cronExpression;
      } else {
        throw new Error('Custom frequency requires a cronExpression option');
      }
      break;
    
    default:
      throw new Error(`Unsupported frequency: ${frequency}`);
  }
  
  // Create the job
  const job = schedule.scheduleJob(rule, async function() {
    console.log(`Running scheduled organization for ${folderPath} at ${new Date().toLocaleString()}`);
    try {
      const result = await organizeDirectory(folderPath, foldersToPreserve, true);
      console.log(`Scheduled organization completed: ${result.success ? 'Success' : 'Failed'}`, 
                 result.success ? `${result.filesMoved} files moved` : result.error);
      
      // Record the operation in file history system for undo functionality
      if (result.success && result.fileMovements && result.fileMovements.length > 0) {
        fileHistory.recordOperation(folderPath, result.fileMovements, {
          scheduledTask: true,
          taskId: taskId,
          timestamp: new Date().toLocaleString()
        });
        console.log(`Recorded file movements for undo functionality: ${result.fileMovements.length} files`);
      }
      
      // Show notification
      showTaskCompletionNotification(result, folderPath, taskId, true);
    } catch (error) {
      console.error('Error during scheduled organization:', error);
    }
  });
  
  // Store job in active jobs map
  scheduledJobs[taskId] = {
    job,
    folderPath,
    frequency,
    options,
    foldersToPreserve,
    nextRun: job.nextInvocation()
  };
  
  // Save to persistent storage
  const schedules = loadSchedules();
  schedules.push({
    id: taskId,
    folderPath,
    frequency,
    options,
    foldersToPreserve,
    createdAt: Date.now()
  });
  saveSchedules(schedules);
  
  return {
    id: taskId,
    folderPath,
    frequency,
    options,
    foldersToPreserve,
    nextRun: job.nextInvocation()
  };
}

/**
 * Cancel a scheduled task
 * @param {string} taskId - ID of the task to cancel
 * @returns {boolean} Success status
 */
function cancelTask(taskId) {
  if (scheduledJobs[taskId]) {
    // Cancel the job
    scheduledJobs[taskId].job.cancel();
    
    // Remove from active jobs
    delete scheduledJobs[taskId];
    
    // Remove from persistent storage
    const schedules = loadSchedules();
    const updatedSchedules = schedules.filter(schedule => schedule.id !== taskId);
    saveSchedules(updatedSchedules);
    
    return true;
  }
  return false;
}

/**
 * Get all scheduled tasks
 * @returns {Array} List of scheduled tasks with their next run time
 */
function getScheduledTasks() {
  const tasks = [];
  
  for (const [id, jobInfo] of Object.entries(scheduledJobs)) {
    tasks.push({
      id,
      folderPath: jobInfo.folderPath,
      frequency: jobInfo.frequency,
      options: jobInfo.options,
      foldersToPreserve: jobInfo.foldersToPreserve,
      nextRun: jobInfo.job.nextInvocation()
    });
  }
  
  return tasks;
}

/**
 * Get a specific scheduled task by ID
 * @param {string} taskId - ID of the task to retrieve
 * @returns {Object|null} The scheduled task or null if not found
 */
function getScheduledTask(taskId) {
  if (scheduledJobs[taskId]) {
    const jobInfo = scheduledJobs[taskId];
    return {
      id: taskId,
      folderPath: jobInfo.folderPath,
      frequency: jobInfo.frequency,
      options: jobInfo.options,
      foldersToPreserve: jobInfo.foldersToPreserve,
      nextRun: jobInfo.job.nextInvocation()
    };
  }
  return null;
}

/**
 * Start all saved scheduled tasks
 * Should be called when the app starts
 */
function initializeScheduledTasks() {
  try {
    // Clear any existing jobs first
    for (const taskId in scheduledJobs) {
      if (scheduledJobs[taskId].job) {
        scheduledJobs[taskId].job.cancel();
      }
    }
    scheduledJobs = {};
    
    // Load saved schedules
    const schedules = loadSchedules();
    
    // Schedule each task without adding new entries to the storage file
    schedules.forEach(savedTask => {
      try {
        // Generate the schedule rule based on frequency
        let rule;
        
        switch (savedTask.frequency) {
          case 'daily':
            rule = new schedule.RecurrenceRule();
            rule.hour = savedTask.options.hour || 3;
            rule.minute = savedTask.options.minute || 0;
            break;
          
          case 'weekly':
            rule = new schedule.RecurrenceRule();
            rule.dayOfWeek = savedTask.options.dayOfWeek !== undefined ? savedTask.options.dayOfWeek : 0;
            rule.hour = savedTask.options.hour || 3;
            rule.minute = savedTask.options.minute || 0;
            break;
          
          case 'monthly':
            rule = new schedule.RecurrenceRule();
            rule.date = savedTask.options.date || 1;
            rule.hour = savedTask.options.hour || 3;
            rule.minute = savedTask.options.minute || 0;
            break;
          
          case 'custom':
            if (savedTask.options.cronExpression) {
              rule = savedTask.options.cronExpression;
            } else {
              throw new Error('Custom frequency requires a cronExpression option');
            }
            break;
          
          default:
            throw new Error(`Unsupported frequency: ${savedTask.frequency}`);
        }
        
        // Create the job directly without calling scheduleTask (which would add another entry to storage)
        const job = schedule.scheduleJob(rule, async function() {
          console.log(`Running scheduled organization for ${savedTask.folderPath} at ${new Date().toLocaleString()}`);
          try {
            const result = await organizeDirectory(savedTask.folderPath, savedTask.foldersToPreserve || [], true);
            console.log(`Scheduled organization completed: ${result.success ? 'Success' : 'Failed'}`, 
                      result.success ? `${result.filesMoved} files moved` : result.error);
            
            // Record the operation in file history system for undo functionality
            if (result.success && result.fileMovements && result.fileMovements.length > 0) {
              fileHistory.recordOperation(savedTask.folderPath, result.fileMovements, {
                scheduledTask: true,
                taskId: savedTask.id,
                timestamp: new Date().toLocaleString()
              });
              console.log(`Recorded file movements for undo functionality: ${result.fileMovements.length} files`);
            }
            
            // Show notification
            showTaskCompletionNotification(result, savedTask.folderPath, savedTask.id, true);
          } catch (error) {
            console.error('Error during scheduled organization:', error);
          }
        });
        
        // Store job in active jobs map
        scheduledJobs[savedTask.id] = {
          job,
          folderPath: savedTask.folderPath,
          frequency: savedTask.frequency,
          options: savedTask.options,
          foldersToPreserve: savedTask.foldersToPreserve,
          nextRun: job.nextInvocation()
        };
        
        console.log(`Restored scheduled task for ${savedTask.folderPath}`);
      } catch (error) {
        console.error(`Failed to restore scheduled task: ${error.message}`);
      }
    });
    
    console.log(`Initialized ${schedules.length} scheduled tasks`);
  } catch (error) {
    console.error('Error initializing scheduled tasks:', error);
  }
}

/**
 * Run organization task immediately for a scheduled task
 * @param {string} taskId - ID of the task to run
 * @returns {Promise<Object>} Result of the organization
 */
async function runTaskNow(taskId) {
  if (!scheduledJobs[taskId]) {
    return {
      success: false,
      error: 'Task not found'
    };
  }
  
  const { folderPath, foldersToPreserve } = scheduledJobs[taskId];
  
  try {
    const result = await organizeDirectory(folderPath, foldersToPreserve, true);
    
    // Record the operation in file history system for undo functionality
    if (result.success && result.fileMovements && result.fileMovements.length > 0) {
      fileHistory.recordOperation(folderPath, result.fileMovements, {
        scheduledTask: true,
        taskId: taskId,
        manualRun: true,
        timestamp: new Date().toLocaleString()
      });
      console.log(`Recorded file movements for undo functionality: ${result.fileMovements.length} files`);
    }
    
    // Show notification
    showTaskCompletionNotification(result, folderPath, taskId, false);
    
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Show desktop notification when a task completes
 * @param {Object} result - Organization result
 * @param {string} folderPath - Path to the organized folder
 * @param {string} taskId - ID of the task
 * @param {boolean} scheduled - Whether this was a scheduled run or manual run
 */
function showTaskCompletionNotification(result, folderPath, taskId, scheduled = true) {
  try {
    const folderName = folderPath.split(/[/\\]/).pop(); // Get folder name from path
    
    let title = scheduled ? 
      'Scheduled Organization Completed' : 
      'Organization Task Completed';
      
    let body = '';
    
    if (result.success) {
      body = `Successfully organized ${folderName}. ${result.filesMoved} files moved.`;
    } else {
      body = `Failed to organize ${folderName}. ${result.error || 'Unknown error'}`;
    }
    
    // Create notification
    const notification = new Notification({ 
      title: title, 
      body: body,
      icon: path.join(__dirname, '../assets/icon.png'), // Use app icon
      timeoutType: 'default',
      urgency: 'normal',
      silent: false
    });
    
    // Show notification
    notification.show();
    
    // Add click handler to open the app when notification is clicked
    notification.on('click', () => {
      // Find existing window or create new one
      let win = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
      
      if (!win) {
        // Create a new window if none exists
        win = new BrowserWindow({
          width: 800,
          height: 600,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, '../preload.js')
          },
          icon: path.join(__dirname, '../assets/icon.png')
        });
      }
      
      // If window exists but is minimized, restore it
      if (win.isMinimized()) win.restore();
      
      // Bring window to front
      win.focus();
      
      // Navigate to schedule page
      win.loadFile(path.join(__dirname, '../schedule.html'));
      
      // Wait for page to load, then send message to check undo status
      win.webContents.once('did-finish-load', () => {
        win.webContents.send('check-undo-availability');
      });
    });
    
    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
}

// Export functions
module.exports = {
  scheduleTask,
  cancelTask,
  getScheduledTasks,
  getScheduledTask,
  initializeScheduledTasks,
  runTaskNow
};