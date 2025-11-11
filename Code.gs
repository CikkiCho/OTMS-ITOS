/**
 * ==============================================================================
 * OT MANAGEMENT SYSTEM - MAIN SETUP SCRIPT
 * ==============================================================================
 * This file contains the initial setup functions to create and initialize
 * all required sheets with proper headers and formatting.
 * 
 * @version 1.0.0
 * @date 2025-11-11
 */

/**
 * Main setup function - Run this ONCE to initialize the entire system
 * Creates all required sheets with headers and basic formatting
 */
function setupOTManagementSystem() {
  try {
    Logger.log('Starting OT Management System setup...');
    
    const ss = getSpreadsheet();
    
    // Create all sheets
    createOTApplicationsSheet(ss);
    createOTMonthlySummarySheet(ss);
    createStaffMasterSheet(ss);
    createAttendanceLogSheet(ss);
    createPublicHolidaysSheet(ss);
    createActivityLogSheet(ss);
    
    Logger.log('OT Management System setup completed successfully!');
    
    // Show success message
    SpreadsheetApp.getUi().alert(
      'Setup Complete',
      'OT Management System has been initialized successfully!\n\n' +
      'Sheets created:\n' +
      '• OT_Applications\n' +
      '• OT_Monthly_Summary\n' +
      '• Staff_Master\n' +
      '• Attendance_Log\n' +
      '• Public_Holidays\n' +
      '• Activity_Log\n\n' +
      'Next steps:\n' +
      '1. Update the Spreadsheet ID in Config.gs\n' +
      '2. Populate Staff_Master with your staff data\n' +
      '3. Add Public_Holidays dates\n' +
      '4. Import Attendance_Log data',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    return { success: true, message: 'System setup completed' };
    
  } catch (error) {
    Logger.log('setupOTManagementSystem error: ' + error.toString());
    SpreadsheetApp.getUi().alert('Setup Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
    return { success: false, message: error.toString() };
  }
}

/**
 * Create OT_Applications sheet with all required columns
 * @param {Spreadsheet} ss - The spreadsheet object
 */
function createOTApplicationsSheet(ss) {
  const sheetName = CONFIG.SHEETS.OT_APPLICATIONS;
  Logger.log('Creating sheet: ' + sheetName);
  
  // Delete if exists (for re-initialization)
  const existingSheet = ss.getSheetByName(sheetName);
  if (existingSheet) {
    ss.deleteSheet(existingSheet);
    Logger.log('Deleted existing sheet: ' + sheetName);
  }
  
  // Create new sheet
  const sheet = ss.insertSheet(sheetName);
  
  // Define headers
  const headers = [
    'ApplicationID',        // A
    'StaffName',           // B
    'StaffEmail',          // C
    'Team',                // D
    'OTDate',              // E
    'StartTime',           // F
    'EndTime',             // G
    'HoursCalculated',     // H
    'IsPublicHoliday',     // I
    'Multiplier',          // J
    'TotalHours',          // K
    'ClaimType',           // L
    'LeaveDays',           // M
    'ProofFileName',       // N
    'ProofURL',            // O
    'Status',              // P
    'SubmittedDate',       // Q
    'LastClockOut',        // R
    'RestGapHours',        // S
    'RestGapValid',        // T
    'ValidationErrors',    // U
    'ApprovedBy',          // V
    'ApprovedDate',        // W
    'Remarks'              // X
  ];
  
  // Set headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4285F4');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Set column widths
  sheet.setColumnWidth(1, 150);  // ApplicationID
  sheet.setColumnWidth(2, 150);  // StaffName
  sheet.setColumnWidth(3, 200);  // StaffEmail
  sheet.setColumnWidth(4, 120);  // Team
  sheet.setColumnWidth(5, 100);  // OTDate
  sheet.setColumnWidth(6, 100);  // StartTime
  sheet.setColumnWidth(7, 100);  // EndTime
  sheet.setColumnWidth(14, 150); // ProofFileName
  sheet.setColumnWidth(15, 250); // ProofURL
  sheet.setColumnWidth(16, 100); // Status
  sheet.setColumnWidth(21, 250); // ValidationErrors
  sheet.setColumnWidth(24, 200); // Remarks
  
  // Add data validation for Status column
  const statusRange = sheet.getRange('P2:P1000');
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Draft', 'Pending', 'Approved', 'Rejected'], true)
    .setAllowInvalid(false)
    .build();
  statusRange.setDataValidation(statusRule);
  
  // Add data validation for ClaimType column
  const claimTypeRange = sheet.getRange('L2:L1000');
  const claimTypeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Money', 'Leave'], true)
    .setAllowInvalid(false)
    .build();
  claimTypeRange.setDataValidation(claimTypeRule);
  
  Logger.log('Sheet created: ' + sheetName);
}

/**
 * Create OT_Monthly_Summary sheet
 * @param {Spreadsheet} ss - The spreadsheet object
 */
function createOTMonthlySummarySheet(ss) {
  const sheetName = CONFIG.SHEETS.OT_SUMMARY;
  Logger.log('Creating sheet: ' + sheetName);
  
  const existingSheet = ss.getSheetByName(sheetName);
  if (existingSheet) {
    ss.deleteSheet(existingSheet);
  }
  
  const sheet = ss.insertSheet(sheetName);
  
  const headers = [
    'StaffEmail',
    'StaffName',
    'Team',
    'MonthYear',
    'TotalOTHours',
    'MoneyClaimHours',
    'LeaveClaimHours',
    'LeaveDaysEarned',
    'Status',
    'LastUpdated'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#34A853');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  
  // Set column widths
  sheet.setColumnWidth(1, 200);  // StaffEmail
  sheet.setColumnWidth(2, 150);  // StaffName
  sheet.setColumnWidth(3, 120);  // Team
  sheet.setColumnWidth(4, 100);  // MonthYear
  sheet.setColumnWidth(9, 100);  // Status
  sheet.setColumnWidth(10, 150); // LastUpdated
  
  // Add data validation for Status column
  const statusRange = sheet.getRange('I2:I1000');
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Green', 'Amber', 'Red'], true)
    .setAllowInvalid(false)
    .build();
  statusRange.setDataValidation(statusRule);
  
  Logger.log('Sheet created: ' + sheetName);
}

/**
 * Create Staff_Master sheet
 * @param {Spreadsheet} ss - The spreadsheet object
 */
function createStaffMasterSheet(ss) {
  const sheetName = CONFIG.SHEETS.STAFF_MASTER;
  Logger.log('Creating sheet: ' + sheetName);
  
  const existingSheet = ss.getSheetByName(sheetName);
  if (existingSheet) {
    ss.deleteSheet(existingSheet);
  }
  
  const sheet = ss.insertSheet(sheetName);
  
  const headers = [
    'StaffName',
    'Email',
    'Team',
    'Role',
    'TeamLeaderEmail',
    'Status'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#FBBC04');
  headerRange.setFontColor('#000000');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  
  // Set column widths
  sheet.setColumnWidth(1, 150);  // StaffName
  sheet.setColumnWidth(2, 200);  // Email
  sheet.setColumnWidth(3, 120);  // Team
  sheet.setColumnWidth(4, 120);  // Role
  sheet.setColumnWidth(5, 200);  // TeamLeaderEmail
  sheet.setColumnWidth(6, 100);  // Status
  
  // Add data validation for Role column
  const roleRange = sheet.getRange('D2:D1000');
  const roleRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Staff', 'Team Leader', 'Management'], true)
    .setAllowInvalid(false)
    .build();
  roleRange.setDataValidation(roleRule);
  
  // Add data validation for Status column
  const statusRange = sheet.getRange('F2:F1000');
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Active', 'Inactive'], true)
    .setAllowInvalid(false)
    .build();
  statusRange.setDataValidation(statusRule);
  
  // Add sample data
  const sampleData = [
    ['Ahmad bin Ali', 'ahmad@company.com', 'Operations', 'Staff', 'teamlead@company.com', 'Active'],
    ['Siti Aminah', 'siti@company.com', 'Operations', 'Staff', 'teamlead@company.com', 'Active'],
    ['Team Lead', 'teamlead@company.com', 'Operations', 'Team Leader', 'manager@company.com', 'Active']
  ];
  
  sheet.getRange(2, 1, sampleData.length, headers.length).setValues(sampleData);
  
  Logger.log('Sheet created: ' + sheetName);
}

/**
 * Create Attendance_Log sheet
 * @param {Spreadsheet} ss - The spreadsheet object
 */
function createAttendanceLogSheet(ss) {
  const sheetName = CONFIG.SHEETS.ATTENDANCE_LOG;
  Logger.log('Creating sheet: ' + sheetName);
  
  const existingSheet = ss.getSheetByName(sheetName);
  if (existingSheet) {
    ss.deleteSheet(existingSheet);
  }
  
  const sheet = ss.insertSheet(sheetName);
  
  const headers = [
    'StaffEmail',
    'Date',
    'ClockIn',
    'ClockOut',
    'DurationHours',
    'ShiftType',
    'Notes'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#EA4335');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  
  // Set column widths
  sheet.setColumnWidth(1, 200);  // StaffEmail
  sheet.setColumnWidth(2, 100);  // Date
  sheet.setColumnWidth(3, 100);  // ClockIn
  sheet.setColumnWidth(4, 100);  // ClockOut
  sheet.setColumnWidth(5, 120);  // DurationHours
  sheet.setColumnWidth(6, 100);  // ShiftType
  sheet.setColumnWidth(7, 250);  // Notes
  
  // Add data validation for ShiftType column
  const shiftTypeRange = sheet.getRange('F2:F10000');
  const shiftTypeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Day', 'Night', 'OT'], true)
    .setAllowInvalid(false)
    .build();
  shiftTypeRange.setDataValidation(shiftTypeRule);
  
  // Add sample attendance data
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const sampleData = [
    ['ahmad@company.com', yesterday, '08:00:00', '17:00:00', 9, 'Day', 'Regular shift'],
    ['siti@company.com', yesterday, '08:00:00', '17:00:00', 9, 'Day', 'Regular shift']
  ];
  
  sheet.getRange(2, 1, sampleData.length, headers.length).setValues(sampleData);
  
  Logger.log('Sheet created: ' + sheetName);
}

/**
 * Create Public_Holidays sheet
 * @param {Spreadsheet} ss - The spreadsheet object
 */
function createPublicHolidaysSheet(ss) {
  const sheetName = CONFIG.SHEETS.PUBLIC_HOLIDAYS;
  Logger.log('Creating sheet: ' + sheetName);
  
  const existingSheet = ss.getSheetByName(sheetName);
  if (existingSheet) {
    ss.deleteSheet(existingSheet);
  }
  
  const sheet = ss.insertSheet(sheetName);
  
  const headers = [
    'Date',
    'HolidayName',
    'Year',
    'Region'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#9C27B0');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  
  // Set column widths
  sheet.setColumnWidth(1, 120);  // Date
  sheet.setColumnWidth(2, 200);  // HolidayName
  sheet.setColumnWidth(3, 80);   // Year
  sheet.setColumnWidth(4, 120);  // Region
  
  // Add sample Malaysia public holidays for 2024-2025
  const sampleData = [
    [new Date('2024-01-01'), 'New Year\'s Day', 2024, 'National'],
    [new Date('2024-02-01'), 'Federal Territory Day', 2024, 'Federal Territory'],
    [new Date('2024-04-10'), 'Hari Raya Aidilfitri', 2024, 'National'],
    [new Date('2024-04-11'), 'Hari Raya Aidilfitri', 2024, 'National'],
    [new Date('2024-05-01'), 'Labour Day', 2024, 'National'],
    [new Date('2024-05-22'), 'Wesak Day', 2024, 'National'],
    [new Date('2024-06-03'), 'Agong\'s Birthday', 2024, 'National'],
    [new Date('2024-06-17'), 'Hari Raya Aidiladha', 2024, 'National'],
    [new Date('2024-07-07'), 'Awal Muharram', 2024, 'National'],
    [new Date('2024-08-31'), 'Merdeka Day', 2024, 'National'],
    [new Date('2024-09-16'), 'Malaysia Day', 2024, 'National'],
    [new Date('2024-09-16'), 'Prophet Muhammad\'s Birthday', 2024, 'National'],
    [new Date('2024-10-24'), 'Deepavali', 2024, 'National'],
    [new Date('2024-12-25'), 'Christmas Day', 2024, 'National'],
    [new Date('2025-01-01'), 'New Year\'s Day', 2025, 'National'],
    [new Date('2025-01-29'), 'Chinese New Year', 2025, 'National'],
    [new Date('2025-01-30'), 'Chinese New Year', 2025, 'National']
  ];
  
  sheet.getRange(2, 1, sampleData.length, headers.length).setValues(sampleData);
  
  Logger.log('Sheet created: ' + sheetName);
}

/**
 * Create Activity_Log sheet
 * @param {Spreadsheet} ss - The spreadsheet object
 */
function createActivityLogSheet(ss) {
  const sheetName = CONFIG.SHEETS.ACTIVITY_LOG;
  Logger.log('Creating sheet: ' + sheetName);
  
  const existingSheet = ss.getSheetByName(sheetName);
  if (existingSheet) {
    ss.deleteSheet(existingSheet);
  }
  
  const sheet = ss.insertSheet(sheetName);
  
  const headers = [
    'LogID',
    'UserEmail',
    'Action',
    'Details',
    'Timestamp',
    'ApplicationID'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#607D8B');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  
  // Set column widths
  sheet.setColumnWidth(1, 150);  // LogID
  sheet.setColumnWidth(2, 200);  // UserEmail
  sheet.setColumnWidth(3, 150);  // Action
  sheet.setColumnWidth(4, 300);  // Details
  sheet.setColumnWidth(5, 150);  // Timestamp
  sheet.setColumnWidth(6, 150);  // ApplicationID
  
  Logger.log('Sheet created: ' + sheetName);
}

/**
 * Create custom menu in spreadsheet
 * This function runs automatically when the spreadsheet is opened
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('OT Management')
    .addItem('⚙️ Setup System', 'setupOTManagementSystem')
    .addSeparator()
    .addItem('📊 Open Dashboard', 'openDashboard')
    .addItem('📝 New OT Application', 'openOTApplicationForm')
    .addSeparator()
    .addItem('🔄 Recalculate All Summaries', 'recalculateAllMonthlySummaries')
    .addItem('📧 Test Email Notification', 'testEmailNotification')
    .addSeparator()
    .addItem('📖 View Documentation', 'showDocumentation')
    .addToUi();
}

/**
 * Show system documentation
 */
function showDocumentation() {
  const html = HtmlService.createHtmlOutput(`
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { color: #4285F4; }
          h3 { color: #34A853; }
          code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
          .section { margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h2>OT Management System Documentation</h2>
        
        <div class="section">
          <h3>System Overview</h3>
          <p>This system manages overtime applications, approvals, tracking, and reporting.</p>
        </div>
        
        <div class="section">
          <h3>OT Limits</h3>
          <ul>
            <li>Maximum OT per month: <strong>104 hours</strong></li>
            <li>Warning threshold: <strong>90 hours</strong></li>
            <li>Maximum hours per session: <strong>12 hours</strong></li>
            <li>Minimum rest gap: <strong>4 hours</strong></li>
          </ul>
        </div>
        
        <div class="section">
          <h3>Leave Conversion</h3>
          <ul>
            <li>6 OT hours = 1 leave day</li>
            <li>Public holiday OT counted at 2x multiplier</li>
          </ul>
        </div>
        
        <div class="section">
          <h3>Workflow</h3>
          <ol>
            <li>Staff submits OT application with proof</li>
            <li>System validates rest gap and limits</li>
            <li>Team Leader receives notification</li>
            <li>Team Leader approves/rejects with remarks</li>
            <li>Monthly summary updated automatically</li>
          </ol>
        </div>
        
        <div class="section">
          <h3>Support</h3>
          <p>For technical issues, contact: <strong>support@company.com</strong></p>
        </div>
      </body>
    </html>
  `)
    .setWidth(600)
    .setHeight(500);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'OT Management System - Documentation');
}
