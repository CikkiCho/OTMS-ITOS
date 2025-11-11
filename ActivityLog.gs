/**
 * ==============================================================================
 * OT MANAGEMENT SYSTEM - ACTIVITY LOGGING
 * ==============================================================================
 * This file contains functions for logging system activities and user actions.
 * 
 * @version 1.0.0
 * @date 2025-11-11
 */

/**
 * Log activity to Activity_Log sheet
 * 
 * @param {string} userEmail - User performing the action
 * @param {string} action - Action type (from CONFIG.ACTIVITY_ACTIONS)
 * @param {string} details - Detailed description of the action
 * @param {string} applicationId - Related application ID (optional)
 * @returns {boolean} Success status
 */
function logActivity(userEmail, action, details, applicationId) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVITY_LOG);
    
    const logId = generateUUID();
    const timestamp = new Date();
    
    const newRow = [
      logId,
      userEmail,
      action,
      sanitizeString(details),
      timestamp,
      applicationId || ''
    ];
    
    sheet.appendRow(newRow);
    
    Logger.log(`✓ Activity logged: ${action} by ${userEmail}`);
    return true;
    
  } catch (error) {
    Logger.log('logActivity error: ' + error.toString());
    // Don't throw error - logging failure shouldn't break the main operation
    return false;
  }
}

/**
 * Get activity logs with optional filtering
 * 
 * @param {Object} filters - Optional filters {userEmail, action, applicationId, startDate, endDate}
 * @param {number} limit - Maximum number of records to return (default: 100)
 * @returns {Array} Array of activity log objects
 */
function getActivityLogs(filters, limit) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVITY_LOG);
    const data = sheet.getDataRange().getValues();
    
    const logs = [];
    const maxRecords = limit || 100;
    
    // Read from bottom to top (most recent first)
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      
      if (!row[0]) continue; // Skip empty rows
      
      // Apply filters
      if (filters) {
        if (filters.userEmail && row[1] !== filters.userEmail) continue;
        if (filters.action && row[2] !== filters.action) continue;
        if (filters.applicationId && row[5] !== filters.applicationId) continue;
        
        if (filters.startDate) {
          const logDate = new Date(row[4]);
          if (logDate < filters.startDate) continue;
        }
        
        if (filters.endDate) {
          const logDate = new Date(row[4]);
          if (logDate > filters.endDate) continue;
        }
      }
      
      logs.push({
        logId: row[0],
        userEmail: row[1],
        action: row[2],
        details: row[3],
        timestamp: row[4],
        applicationId: row[5]
      });
      
      // Limit results
      if (logs.length >= maxRecords) {
        break;
      }
    }
    
    return logs;
    
  } catch (error) {
    Logger.log('getActivityLogs error: ' + error.toString());
    return [];
  }
}

/**
 * Get activity logs for a specific application
 * 
 * @param {string} applicationId - Application ID
 * @returns {Array} Array of activity log objects
 */
function getApplicationActivityLogs(applicationId) {
  return getActivityLogs({ applicationId: applicationId }, 50);
}

/**
 * Get recent activity logs for a user
 * 
 * @param {string} userEmail - User email
 * @param {number} limit - Maximum number of records (default: 50)
 * @returns {Array} Array of activity log objects
 */
function getUserActivityLogs(userEmail, limit) {
  return getActivityLogs({ userEmail: userEmail }, limit || 50);
}

/**
 * Get system-wide recent activity
 * 
 * @param {number} limit - Maximum number of records (default: 100)
 * @returns {Array} Array of activity log objects
 */
function getRecentActivityLogs(limit) {
  return getActivityLogs({}, limit || 100);
}

/**
 * Generate activity report for a date range
 * 
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} Activity report summary
 */
function generateActivityReport(startDate, endDate) {
  try {
    const logs = getActivityLogs({ startDate: startDate, endDate: endDate }, 10000);
    
    // Count actions by type
    const actionCounts = {};
    const userCounts = {};
    
    for (let log of logs) {
      // Count by action
      if (!actionCounts[log.action]) {
        actionCounts[log.action] = 0;
      }
      actionCounts[log.action]++;
      
      // Count by user
      if (!userCounts[log.userEmail]) {
        userCounts[log.userEmail] = 0;
      }
      userCounts[log.userEmail]++;
    }
    
    return {
      startDate: startDate,
      endDate: endDate,
      totalActivities: logs.length,
      actionCounts: actionCounts,
      userCounts: userCounts,
      recentActivities: logs.slice(0, 20) // Top 20 most recent
    };
    
  } catch (error) {
    Logger.log('generateActivityReport error: ' + error.toString());
    return {
      error: error.toString()
    };
  }
}

/**
 * Clean up old activity logs (retention policy)
 * Keeps logs for specified number of days
 * 
 * @param {number} retentionDays - Number of days to keep (default: 365)
 * @returns {Object} {success, deletedCount}
 */
function cleanupOldActivityLogs(retentionDays) {
  try {
    const days = retentionDays || 365;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVITY_LOG);
    const data = sheet.getDataRange().getValues();
    
    let deletedCount = 0;
    
    // Mark rows to delete (from bottom to top to avoid index shifting)
    const rowsToDelete = [];
    
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      const logDate = new Date(row[4]); // Timestamp column
      
      if (logDate < cutoffDate) {
        rowsToDelete.push(i + 1); // Convert to 1-based index
      }
    }
    
    // Delete rows in batches (Google Sheets API limitation)
    // Note: In production, use soft delete by adding a "Deleted" column
    for (let rowIndex of rowsToDelete) {
      sheet.deleteRow(rowIndex);
      deletedCount++;
    }
    
    Logger.log(`✓ Cleaned up ${deletedCount} old activity logs (older than ${days} days)`);
    
    return {
      success: true,
      deletedCount: deletedCount,
      retentionDays: days,
      cutoffDate: cutoffDate
    };
    
  } catch (error) {
    Logger.log('cleanupOldActivityLogs error: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Test activity logging functions
 */
function testActivityLog() {
  Logger.log('=== TESTING ACTIVITY LOG ===');
  
  // Test log activity
  logActivity('test@company.com', CONFIG.ACTIVITY_ACTIONS.STAFF_LOGIN, 'Test login');
  
  // Test get recent logs
  const recentLogs = getRecentActivityLogs(10);
  Logger.log('Recent logs: ' + recentLogs.length);
  
  // Test generate report
  const report = generateActivityReport(
    new Date('2024-01-01'),
    new Date()
  );
  Logger.log('Report: ' + JSON.stringify(report));
  
  Logger.log('============================');
}
