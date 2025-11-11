/**
 * ==============================================================================
 * OT MANAGEMENT SYSTEM - DATA ACCESS LAYER
 * ==============================================================================
 * This file contains all database access functions for reading and writing
 * to Google Sheets. Uses the "read once, process in memory" pattern for
 * optimal performance.
 * 
 * @version 1.0.0
 * @date 2025-11-11
 */

// =============================================================================
// OT APPLICATIONS - READ FUNCTIONS
// =============================================================================

/**
 * Get all OT applications with optional filtering
 * Reads entire dataset once, processes in memory
 * 
 * @param {Object} filters - Optional filters {staffEmail, status, monthYear, team}
 * @returns {Array} Array of application objects
 */
function getAllOTApplications(filters) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.OT_APPLICATIONS);
    const data = sheet.getDataRange().getValues();
    
    const applications = [];
    
    // Skip header row (index 0)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row[0]) continue;
      
      // Apply filters if provided
      if (filters) {
        if (filters.staffEmail && row[2] !== filters.staffEmail) continue;
        if (filters.status && row[15] !== filters.status) continue;
        if (filters.team && row[3] !== filters.team) continue;
        
        if (filters.monthYear) {
          const otDate = new Date(row[4]);
          const rowMonthYear = getMonthYear(otDate);
          if (rowMonthYear !== filters.monthYear) continue;
        }
      }
      
      applications.push({
        rowIndex: i + 1, // Store row index for updates (1-based)
        applicationId: row[0],
        staffName: row[1],
        staffEmail: row[2],
        team: row[3],
        otDate: row[4],
        startTime: row[5],
        endTime: row[6],
        hoursCalculated: row[7],
        isPublicHoliday: row[8],
        multiplier: row[9],
        totalHours: row[10],
        claimType: row[11],
        leaveDays: row[12],
        proofFileName: row[13],
        proofURL: row[14],
        status: row[15],
        submittedDate: row[16],
        lastClockOut: row[17],
        restGapHours: row[18],
        restGapValid: row[19],
        validationErrors: row[20],
        approvedBy: row[21],
        approvedDate: row[22],
        remarks: row[23]
      });
    }
    
    Logger.log(`getAllOTApplications: Found ${applications.length} applications`);
    return applications;
    
  } catch (error) {
    Logger.log('getAllOTApplications error: ' + error.toString());
    throw error;
  }
}

/**
 * Get single OT application by ID
 * 
 * @param {string} applicationId - Application ID
 * @returns {Object|null} Application object or null if not found
 */
function getOTApplicationById(applicationId) {
  try {
    const applications = getAllOTApplications({ applicationId: applicationId });
    
    // Linear search through filtered results
    for (let app of applications) {
      if (app.applicationId === applicationId) {
        return app;
      }
    }
    
    return null;
    
  } catch (error) {
    Logger.log('getOTApplicationById error: ' + error.toString());
    return null;
  }
}

/**
 * Get OT applications for a staff member
 * 
 * @param {string} staffEmail - Staff email address
 * @param {string} monthYear - Optional month filter (YYYY-MM)
 * @returns {Array} Array of application objects
 */
function getOTApplicationsByStaff(staffEmail, monthYear) {
  const filters = { staffEmail: staffEmail };
  if (monthYear) {
    filters.monthYear = monthYear;
  }
  return getAllOTApplications(filters);
}

/**
 * Get pending OT applications for a team leader
 * 
 * @param {string} teamLeaderEmail - Team leader's email
 * @returns {Array} Array of pending application objects
 */
function getPendingOTApplicationsForApproval(teamLeaderEmail) {
  try {
    // First, get the team leader's team
    const staffData = getStaffByEmail(teamLeaderEmail);
    if (!staffData || staffData.role !== CONFIG.ROLES.TEAM_LEADER) {
      Logger.log('User is not a team leader: ' + teamLeaderEmail);
      return [];
    }
    
    // Get all pending applications for this team
    const filters = {
      team: staffData.team,
      status: CONFIG.STATUS.PENDING
    };
    
    return getAllOTApplications(filters);
    
  } catch (error) {
    Logger.log('getPendingOTApplicationsForApproval error: ' + error.toString());
    return [];
  }
}

// =============================================================================
// OT APPLICATIONS - WRITE FUNCTIONS
// =============================================================================

/**
 * Insert new OT application
 * 
 * @param {Object} applicationData - Application data object
 * @returns {string} Application ID
 */
function insertOTApplication(applicationData) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.OT_APPLICATIONS);
    
    const newRow = [
      applicationData.applicationId,
      applicationData.staffName,
      applicationData.staffEmail,
      applicationData.team,
      applicationData.otDate,
      applicationData.startTime,
      applicationData.endTime,
      applicationData.hoursCalculated,
      applicationData.isPublicHoliday,
      applicationData.multiplier,
      applicationData.totalHours,
      applicationData.claimType,
      applicationData.leaveDays || 0,
      applicationData.proofFileName || '',
      applicationData.proofURL || '',
      applicationData.status,
      applicationData.submittedDate,
      applicationData.lastClockOut || '',
      applicationData.restGapHours || 0,
      applicationData.restGapValid || false,
      applicationData.validationErrors || '',
      '', // approvedBy (empty initially)
      '', // approvedDate (empty initially)
      ''  // remarks (empty initially)
    ];
    
    sheet.appendRow(newRow);
    Logger.log(`✓ Inserted OT application: ${applicationData.applicationId}`);
    
    return applicationData.applicationId;
    
  } catch (error) {
    Logger.log('insertOTApplication error: ' + error.toString());
    throw error;
  }
}

/**
 * Update OT application status (approve/reject)
 * 
 * @param {string} applicationId - Application ID
 * @param {string} status - New status (Approved/Rejected)
 * @param {string} approvedBy - Approver's email
 * @param {string} remarks - Approval/rejection remarks
 * @returns {boolean} Success status
 */
function updateOTApplicationStatus(applicationId, status, approvedBy, remarks) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.OT_APPLICATIONS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === applicationId) {
        const rowIndex = i + 1; // Sheet rows are 1-indexed
        
        sheet.getRange(rowIndex, 16).setValue(status); // Column P: Status
        sheet.getRange(rowIndex, 22).setValue(approvedBy); // Column V: ApprovedBy
        sheet.getRange(rowIndex, 23).setValue(new Date()); // Column W: ApprovedDate
        sheet.getRange(rowIndex, 24).setValue(remarks); // Column X: Remarks
        
        Logger.log(`✓ Updated application ${applicationId} to status: ${status}`);
        return true;
      }
    }
    
    Logger.log(`✗ Application not found: ${applicationId}`);
    return false;
    
  } catch (error) {
    Logger.log('updateOTApplicationStatus error: ' + error.toString());
    throw error;
  }
}

/**
 * Update OT application (for editing draft)
 * 
 * @param {string} applicationId - Application ID
 * @param {Object} updates - Fields to update
 * @returns {boolean} Success status
 */
function updateOTApplication(applicationId, updates) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.OT_APPLICATIONS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === applicationId) {
        const rowIndex = i + 1;
        
        // Map field names to column numbers
        const fieldMap = {
          otDate: 5,
          startTime: 6,
          endTime: 7,
          hoursCalculated: 8,
          isPublicHoliday: 9,
          multiplier: 10,
          totalHours: 11,
          claimType: 12,
          leaveDays: 13,
          proofFileName: 14,
          proofURL: 15,
          status: 16,
          validationErrors: 21
        };
        
        // Update specified fields
        for (let field in updates) {
          if (fieldMap[field]) {
            sheet.getRange(rowIndex, fieldMap[field]).setValue(updates[field]);
          }
        }
        
        Logger.log(`✓ Updated application: ${applicationId}`);
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    Logger.log('updateOTApplication error: ' + error.toString());
    throw error;
  }
}

// =============================================================================
// STAFF MASTER - READ FUNCTIONS
// =============================================================================

/**
 * Get all staff members
 * 
 * @param {Object} filters - Optional filters {team, role, status}
 * @returns {Array} Array of staff objects
 */
function getAllStaff(filters) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.STAFF_MASTER);
    const data = sheet.getDataRange().getValues();
    
    const staffList = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      if (!row[1]) continue; // Skip if no email
      
      // Apply filters
      if (filters) {
        if (filters.team && row[2] !== filters.team) continue;
        if (filters.role && row[3] !== filters.role) continue;
        if (filters.status && row[5] !== filters.status) continue;
      }
      
      staffList.push({
        staffName: row[0],
        email: row[1],
        team: row[2],
        role: row[3],
        teamLeaderEmail: row[4],
        status: row[5]
      });
    }
    
    return staffList;
    
  } catch (error) {
    Logger.log('getAllStaff error: ' + error.toString());
    return [];
  }
}

/**
 * Get staff details by email
 * 
 * @param {string} email - Staff email address
 * @returns {Object|null} Staff object or null
 */
function getStaffByEmail(email) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.STAFF_MASTER);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      if (row[1] === email) { // Column B: Email
        return {
          staffName: row[0],
          email: row[1],
          team: row[2],
          role: row[3],
          teamLeaderEmail: row[4],
          status: row[5]
        };
      }
    }
    
    return null;
    
  } catch (error) {
    Logger.log('getStaffByEmail error: ' + error.toString());
    return null;
  }
}

/**
 * Get team members for a team leader
 * 
 * @param {string} teamLeaderEmail - Team leader's email
 * @returns {Array} Array of staff objects
 */
function getTeamMembers(teamLeaderEmail) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.STAFF_MASTER);
    const data = sheet.getDataRange().getValues();
    
    const teamMembers = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      if (row[4] === teamLeaderEmail && row[5] === 'Active') {
        teamMembers.push({
          staffName: row[0],
          email: row[1],
          team: row[2],
          role: row[3],
          teamLeaderEmail: row[4],
          status: row[5]
        });
      }
    }
    
    return teamMembers;
    
  } catch (error) {
    Logger.log('getTeamMembers error: ' + error.toString());
    return [];
  }
}

// =============================================================================
// ATTENDANCE LOG - READ FUNCTIONS
// =============================================================================

/**
 * Get attendance records for a staff member
 * 
 * @param {string} staffEmail - Staff email
 * @param {Date} startDate - Start date (optional)
 * @param {Date} endDate - End date (optional)
 * @returns {Array} Array of attendance objects
 */
function getAttendanceByStaff(staffEmail, startDate, endDate) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ATTENDANCE_LOG);
    const data = sheet.getDataRange().getValues();
    
    const attendance = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      if (row[0] !== staffEmail) continue;
      
      const recordDate = new Date(row[1]);
      
      // Apply date filters if provided
      if (startDate && recordDate < startDate) continue;
      if (endDate && recordDate > endDate) continue;
      
      attendance.push({
        staffEmail: row[0],
        date: row[1],
        clockIn: row[2],
        clockOut: row[3],
        durationHours: row[4],
        shiftType: row[5],
        notes: row[6]
      });
    }
    
    // Sort by date descending (most recent first)
    attendance.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return attendance;
    
  } catch (error) {
    Logger.log('getAttendanceByStaff error: ' + error.toString());
    return [];
  }
}

/**
 * Get last clock-out before a specific datetime
 * 
 * @param {string} staffEmail - Staff email
 * @param {Date} beforeDateTime - DateTime to search before
 * @returns {Object|null} Last clock-out record or null
 */
function getLastClockOutBefore(staffEmail, beforeDateTime) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ATTENDANCE_LOG);
    const data = sheet.getDataRange().getValues();
    
    let lastClockOut = null;
    let lastClockOutTime = null;
    
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      
      if (row[0] !== staffEmail) continue;
      if (!row[3]) continue; // Skip if no clock-out
      
      const clockOutDateTime = combineDateAndTime(row[1], row[3]);
      
      if (clockOutDateTime < beforeDateTime) {
        if (!lastClockOutTime || clockOutDateTime > lastClockOutTime) {
          lastClockOut = {
            staffEmail: row[0],
            date: row[1],
            clockIn: row[2],
            clockOut: row[3],
            clockOutDateTime: clockOutDateTime,
            durationHours: row[4],
            shiftType: row[5],
            notes: row[6]
          };
          lastClockOutTime = clockOutDateTime;
        }
      }
    }
    
    return lastClockOut;
    
  } catch (error) {
    Logger.log('getLastClockOutBefore error: ' + error.toString());
    return null;
  }
}

// =============================================================================
// OT MONTHLY SUMMARY - READ/WRITE FUNCTIONS
// =============================================================================

/**
 * Get monthly summary for a staff member
 * 
 * @param {string} staffEmail - Staff email
 * @param {string} monthYear - Month in YYYY-MM format
 * @returns {Object|null} Summary object or null
 */
function getOTMonthlySummary(staffEmail, monthYear) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.OT_SUMMARY);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      if (row[0] === staffEmail && row[3] === monthYear) {
        return {
          rowIndex: i + 1,
          staffEmail: row[0],
          staffName: row[1],
          team: row[2],
          monthYear: row[3],
          totalOTHours: row[4],
          moneyClaimHours: row[5],
          leaveClaimHours: row[6],
          leaveDaysEarned: row[7],
          status: row[8],
          lastUpdated: row[9]
        };
      }
    }
    
    return null;
    
  } catch (error) {
    Logger.log('getOTMonthlySummary error: ' + error.toString());
    return null;
  }
}

/**
 * Update or insert monthly summary
 * 
 * @param {Object} summaryData - Summary data object
 * @returns {boolean} Success status
 */
function upsertOTMonthlySummary(summaryData) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.OT_SUMMARY);
    const data = sheet.getDataRange().getValues();
    
    // Try to find existing record
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      if (row[0] === summaryData.staffEmail && row[3] === summaryData.monthYear) {
        // Update existing record
        const rowIndex = i + 1;
        sheet.getRange(rowIndex, 5).setValue(summaryData.totalOTHours);
        sheet.getRange(rowIndex, 6).setValue(summaryData.moneyClaimHours);
        sheet.getRange(rowIndex, 7).setValue(summaryData.leaveClaimHours);
        sheet.getRange(rowIndex, 8).setValue(summaryData.leaveDaysEarned);
        sheet.getRange(rowIndex, 9).setValue(summaryData.status);
        sheet.getRange(rowIndex, 10).setValue(new Date());
        
        Logger.log(`✓ Updated monthly summary for ${summaryData.staffEmail} - ${summaryData.monthYear}`);
        return true;
      }
    }
    
    // Insert new record
    const newRow = [
      summaryData.staffEmail,
      summaryData.staffName,
      summaryData.team,
      summaryData.monthYear,
      summaryData.totalOTHours,
      summaryData.moneyClaimHours,
      summaryData.leaveClaimHours,
      summaryData.leaveDaysEarned,
      summaryData.status,
      new Date()
    ];
    
    sheet.appendRow(newRow);
    Logger.log(`✓ Inserted new monthly summary for ${summaryData.staffEmail} - ${summaryData.monthYear}`);
    
    return true;
    
  } catch (error) {
    Logger.log('upsertOTMonthlySummary error: ' + error.toString());
    throw error;
  }
}

/**
 * Test data access functions
 */
function testDataAccess() {
  Logger.log('=== TESTING DATA ACCESS FUNCTIONS ===');
  
  // Test getStaffByEmail
  const staff = getStaffByEmail('ahmad@company.com');
  Logger.log('getStaffByEmail: ' + JSON.stringify(staff));
  
  // Test getAllStaff
  const allStaff = getAllStaff({ status: 'Active' });
  Logger.log('getAllStaff (Active): Found ' + allStaff.length + ' staff');
  
  // Test getAllOTApplications
  const applications = getAllOTApplications();
  Logger.log('getAllOTApplications: Found ' + applications.length + ' applications');
  
  Logger.log('====================================');
}
