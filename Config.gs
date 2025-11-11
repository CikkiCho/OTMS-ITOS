/**
 * ==============================================================================
 * OT MANAGEMENT SYSTEM - CONFIGURATION
 * ==============================================================================
 * This file contains all system configuration, constants, and the spreadsheet
 * connection function.
 * 
 * IMPORTANT: Update YOUR_SPREADSHEET_ID_HERE with your actual Spreadsheet ID
 * 
 * @version 1.0.0
 * @date 2025-11-11
 */

/**
 * System configuration object
 * All constants and limits are defined here - NEVER hardcode values in code
 */
const CONFIG = {
  // Spreadsheet ID - UPDATE THIS!
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',
  
  // Sheet names
  SHEETS: {
    OT_APPLICATIONS: 'OT_Applications',
    OT_SUMMARY: 'OT_Monthly_Summary',
    STAFF_MASTER: 'Staff_Master',
    ATTENDANCE_LOG: 'Attendance_Log',
    PUBLIC_HOLIDAYS: 'Public_Holidays',
    ACTIVITY_LOG: 'Activity_Log'
  },
  
  // OT limits and thresholds
  LIMITS: {
    MAX_OT_HOURS: 104,              // Maximum OT hours per month
    WARNING_THRESHOLD: 90,           // Warning threshold (amber status)
    MAX_HOURS_PER_SESSION: 12,      // Maximum hours in a single OT session
    MIN_REST_GAP_HOURS: 4,          // Minimum rest period between shift and OT
    MAX_FUTURE_DAYS: 7              // Maximum days in advance to apply for OT
  },
  
  // Leave conversion rates
  CLAIM_CONVERSION: {
    HOURS_PER_LEAVE_DAY: 6,         // 6 OT hours = 1 leave day (12 hours = 2 days)
    PUBLIC_HOLIDAY_MULTIPLIER: 2    // Public holiday OT counted at 2x
  },
  
  // Status values
  STATUS: {
    DRAFT: 'Draft',
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected'
  },
  
  // Claim types
  CLAIM_TYPE: {
    MONEY: 'Money',
    LEAVE: 'Leave'
  },
  
  // OT summary status colors
  SUMMARY_STATUS: {
    GREEN: 'Green',      // 0-89 hours
    AMBER: 'Amber',      // 90-103 hours
    RED: 'Red'           // 104+ hours (at limit)
  },
  
  // Staff roles
  ROLES: {
    STAFF: 'Staff',
    TEAM_LEADER: 'Team Leader',
    MANAGEMENT: 'Management'
  },
  
  // Activity log actions
  ACTIVITY_ACTIONS: {
    OT_APPLICATION_SUBMIT: 'OT_APPLICATION_SUBMIT',
    OT_APPLICATION_APPROVE: 'OT_APPLICATION_APPROVE',
    OT_APPLICATION_REJECT: 'OT_APPLICATION_REJECT',
    OT_APPLICATION_UPDATE: 'OT_APPLICATION_UPDATE',
    OT_APPLICATION_DELETE: 'OT_APPLICATION_DELETE',
    STAFF_LOGIN: 'STAFF_LOGIN',
    STAFF_LOGOUT: 'STAFF_LOGOUT',
    SUMMARY_RECALCULATE: 'SUMMARY_RECALCULATE',
    SYSTEM_ERROR: 'SYSTEM_ERROR'
  },
  
  // Google Drive folder for proof uploads
  DRIVE: {
    FOLDER_NAME: 'OT_Attendance_Proofs',
    FOLDER_ID: null  // Will be created automatically if null
  },
  
  // Email notification settings
  EMAIL: {
    ENABLED: true,
    SENDER_NAME: 'OT Management System',
    SUBJECT_PREFIX: '[OT System]'
  },
  
  // Time format settings
  TIME_FORMAT: {
    DATE: 'yyyy-MM-dd',
    TIME: 'HH:mm:ss',
    DATETIME: 'yyyy-MM-dd HH:mm:ss',
    MONTH_YEAR: 'yyyy-MM'
  },
  
  // Session management (for web app)
  SESSION: {
    TIMEOUT_MINUTES: 30,
    COOKIE_NAME: 'OT_SESSION'
  }
};

/**
 * Get spreadsheet connection using fallback pattern
 * Method 1: Direct connection by Spreadsheet ID (Primary)
 * Method 2: Active spreadsheet fallback (Secondary)
 * 
 * @returns {Spreadsheet} The connected spreadsheet object
 * @throws {Error} If cannot connect to any spreadsheet
 */
function getSpreadsheet() {
  let ss;
  
  try {
    // Method 1: Direct connection by Spreadsheet ID (Primary)
    if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID_HERE') {
      ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      Logger.log('✓ Using hardcoded spreadsheet ID: ' + CONFIG.SPREADSHEET_ID);
      return ss;
    } else {
      Logger.log('⚠ Spreadsheet ID not configured, trying active spreadsheet...');
    }
  } catch (e) {
    Logger.log('✗ Hardcoded ID failed: ' + e.toString());
  }
  
  try {
    // Method 2: Active spreadsheet fallback (Secondary)
    ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('✓ Using active spreadsheet: ' + ss.getName());
    
    // Log the ID so user can update CONFIG.SPREADSHEET_ID
    Logger.log('💡 TIP: Add this ID to CONFIG.SPREADSHEET_ID: ' + ss.getId());
    
    return ss;
  } catch (e2) {
    Logger.log('✗ Active spreadsheet failed: ' + e2.toString());
    throw new Error(
      'Cannot access any spreadsheet. Please:\n' +
      '1. Update CONFIG.SPREADSHEET_ID in Config.gs with your Spreadsheet ID\n' +
      '2. Or open this script from the spreadsheet (Tools > Script Editor)'
    );
  }
}

/**
 * Get the Google Drive folder for storing OT proof files
 * Creates the folder if it doesn't exist
 * 
 * @returns {Folder} The Google Drive folder object
 */
function getProofStorageFolder() {
  try {
    // If folder ID is configured, use it
    if (CONFIG.DRIVE.FOLDER_ID) {
      try {
        return DriveApp.getFolderById(CONFIG.DRIVE.FOLDER_ID);
      } catch (e) {
        Logger.log('⚠ Configured folder ID not found, creating new folder...');
      }
    }
    
    // Search for existing folder by name
    const folders = DriveApp.getFoldersByName(CONFIG.DRIVE.FOLDER_NAME);
    if (folders.hasNext()) {
      const folder = folders.next();
      Logger.log('✓ Found existing proof storage folder: ' + folder.getId());
      return folder;
    }
    
    // Create new folder
    const newFolder = DriveApp.createFolder(CONFIG.DRIVE.FOLDER_NAME);
    Logger.log('✓ Created new proof storage folder: ' + newFolder.getId());
    Logger.log('💡 TIP: Add this ID to CONFIG.DRIVE.FOLDER_ID: ' + newFolder.getId());
    
    return newFolder;
    
  } catch (error) {
    Logger.log('✗ Error accessing/creating Drive folder: ' + error.toString());
    throw new Error('Failed to access Google Drive storage folder: ' + error.toString());
  }
}

/**
 * Get current timezone for the system
 * @returns {string} Timezone string (e.g., 'Asia/Kuala_Lumpur')
 */
function getSystemTimezone() {
  return Session.getScriptTimeZone() || 'Asia/Kuala_Lumpur';
}

/**
 * Format date according to system configuration
 * @param {Date} date - The date to format
 * @param {string} format - Format type: 'DATE', 'TIME', 'DATETIME', 'MONTH_YEAR'
 * @returns {string} Formatted date string
 */
function formatDate(date, format) {
  if (!date || !(date instanceof Date)) {
    return '';
  }
  
  const formatString = CONFIG.TIME_FORMAT[format] || CONFIG.TIME_FORMAT.DATETIME;
  return Utilities.formatDate(date, getSystemTimezone(), formatString);
}

/**
 * Test spreadsheet connection
 * Run this function to verify your setup
 */
function testSpreadsheetConnection() {
  try {
    const ss = getSpreadsheet();
    
    const info = {
      success: true,
      name: ss.getName(),
      id: ss.getId(),
      url: ss.getUrl(),
      sheets: ss.getSheets().map(sheet => sheet.getName()),
      timezone: getSystemTimezone()
    };
    
    Logger.log('=== SPREADSHEET CONNECTION TEST ===');
    Logger.log('✓ Connection successful!');
    Logger.log('Name: ' + info.name);
    Logger.log('ID: ' + info.id);
    Logger.log('URL: ' + info.url);
    Logger.log('Timezone: ' + info.timezone);
    Logger.log('Sheets found: ' + info.sheets.join(', '));
    Logger.log('===================================');
    
    // Show alert with results
    SpreadsheetApp.getUi().alert(
      'Connection Test Successful',
      'Spreadsheet: ' + info.name + '\n' +
      'ID: ' + info.id + '\n' +
      'Sheets: ' + info.sheets.length + ' found\n' +
      'Timezone: ' + info.timezone + '\n\n' +
      '✓ System is ready to use!',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    return info;
    
  } catch (error) {
    Logger.log('=== SPREADSHEET CONNECTION TEST ===');
    Logger.log('✗ Connection failed!');
    Logger.log('Error: ' + error.toString());
    Logger.log('===================================');
    
    SpreadsheetApp.getUi().alert(
      'Connection Test Failed',
      'Error: ' + error.toString() + '\n\n' +
      'Please update CONFIG.SPREADSHEET_ID in Config.gs',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    return { success: false, error: error.toString() };
  }
}

/**
 * Test Drive folder connection
 */
function testDriveFolderConnection() {
  try {
    const folder = getProofStorageFolder();
    
    Logger.log('=== DRIVE FOLDER CONNECTION TEST ===');
    Logger.log('✓ Connection successful!');
    Logger.log('Folder Name: ' + folder.getName());
    Logger.log('Folder ID: ' + folder.getId());
    Logger.log('Folder URL: ' + folder.getUrl());
    Logger.log('====================================');
    
    SpreadsheetApp.getUi().alert(
      'Drive Folder Test Successful',
      'Folder: ' + folder.getName() + '\n' +
      'ID: ' + folder.getId() + '\n\n' +
      '✓ Proof storage is ready!',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    return { success: true, folderId: folder.getId(), folderUrl: folder.getUrl() };
    
  } catch (error) {
    Logger.log('=== DRIVE FOLDER CONNECTION TEST ===');
    Logger.log('✗ Connection failed!');
    Logger.log('Error: ' + error.toString());
    Logger.log('====================================');
    
    SpreadsheetApp.getUi().alert(
      'Drive Folder Test Failed',
      'Error: ' + error.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    return { success: false, error: error.toString() };
  }
}

/**
 * Show current configuration
 * Useful for debugging
 */
function showConfiguration() {
  const config = {
    spreadsheetId: CONFIG.SPREADSHEET_ID,
    maxOTHours: CONFIG.LIMITS.MAX_OT_HOURS,
    warningThreshold: CONFIG.LIMITS.WARNING_THRESHOLD,
    maxHoursPerSession: CONFIG.LIMITS.MAX_HOURS_PER_SESSION,
    minRestGapHours: CONFIG.LIMITS.MIN_REST_GAP_HOURS,
    hoursPerLeaveDay: CONFIG.CLAIM_CONVERSION.HOURS_PER_LEAVE_DAY,
    publicHolidayMultiplier: CONFIG.CLAIM_CONVERSION.PUBLIC_HOLIDAY_MULTIPLIER,
    timezone: getSystemTimezone()
  };
  
  Logger.log('=== CURRENT CONFIGURATION ===');
  Logger.log(JSON.stringify(config, null, 2));
  Logger.log('=============================');
  
  return config;
}
