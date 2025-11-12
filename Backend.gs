/**
 * ==============================================================================
 * OT MANAGEMENT SYSTEM - BACKEND (MERGED)
 * ==============================================================================
 * This file contains all backend business logic, data access, and operations.
 * 
 * MODULES INCLUDED:
 * 1. Data Access Layer - Database operations
 * 2. Business Logic - OT calculations, validations, rules
 * 3. OT Application Module - Submit, approve, reject operations
 * 4. Activity Logging - System activity tracking
 * 5. Email Notifications - Email alerts and reports
 * 
 * DEPENDENCIES:
 * - Config.gs: Provides CONFIG object and getSpreadsheet() function
 * - Utils.gs: Provides utility functions
 * 
 * @version 2.0.1
 * @date 2025-11-12
 */

// =============================================================================
// SECTION 1: DATA ACCESS LAYER
// =============================================================================
// Database operations for reading and writing to Google Sheets
// Note: Uses getSpreadsheet() from Config.gs

/**
 * Get all OT applications with optional filtering
 * @param {Object} filters - Optional filters {staffEmail, status, monthYear, team}
 * @returns {Array} Array of application objects
 */
function getAllOTApplications(filters) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.OT_APPLICATIONS);
    const data = sheet.getDataRange().getValues();
    
    const applications = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue;
      
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
        rowIndex: i + 1,
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
    
    return applications;
  } catch (error) {
    Logger.log('getAllOTApplications error: ' + error.toString());
    throw error;
  }
}

/**
 * Get single OT application by ID
 */
function getOTApplicationById(applicationId) {
  try {
    const applications = getAllOTApplications({ applicationId: applicationId });
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
 */
function getPendingOTApplicationsForApproval(teamLeaderEmail) {
  try {
    const staffData = getStaffByEmail(teamLeaderEmail);
    if (!staffData || staffData.role !== CONFIG.ROLES.TEAM_LEADER) {
      return [];
    }
    
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

/**
 * Insert new OT application
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
      '',
      '',
      ''
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
 */
function updateOTApplicationStatus(applicationId, status, approvedBy, remarks) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.OT_APPLICATIONS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === applicationId) {
        const rowIndex = i + 1;
        sheet.getRange(rowIndex, 16).setValue(status);
        sheet.getRange(rowIndex, 22).setValue(approvedBy);
        sheet.getRange(rowIndex, 23).setValue(new Date());
        sheet.getRange(rowIndex, 24).setValue(remarks);
        
        Logger.log(`✓ Updated application ${applicationId} to status: ${status}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    Logger.log('updateOTApplicationStatus error: ' + error.toString());
    throw error;
  }
}

/**
 * Update OT application (for editing draft)
 */
function updateOTApplication(applicationId, updates) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.OT_APPLICATIONS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === applicationId) {
        const rowIndex = i + 1;
        
        const fieldMap = {
          otDate: 5, startTime: 6, endTime: 7, hoursCalculated: 8,
          isPublicHoliday: 9, multiplier: 10, totalHours: 11, claimType: 12,
          leaveDays: 13, proofFileName: 14, proofURL: 15, status: 16,
          validationErrors: 21
        };
        
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

/**
 * Get all staff members
 */
function getAllStaff(filters) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.STAFF_MASTER);
    const data = sheet.getDataRange().getValues();
    
    const staffList = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[1]) continue;
      
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
 */
function getStaffByEmail(email) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.STAFF_MASTER);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[1] === email) {
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

/**
 * Get attendance records for a staff member
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
    
    attendance.sort((a, b) => new Date(b.date) - new Date(a.date));
    return attendance;
  } catch (error) {
    Logger.log('getAttendanceByStaff error: ' + error.toString());
    return [];
  }
}

/**
 * Get last clock-out before a specific datetime
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
      if (!row[3]) continue;
      
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

/**
 * Get monthly summary for a staff member
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
 */
function upsertOTMonthlySummary(summaryData) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.OT_SUMMARY);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === summaryData.staffEmail && row[3] === summaryData.monthYear) {
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

// =============================================================================
// SECTION 2: BUSINESS LOGIC
// =============================================================================
// OT calculations, validations, and rule enforcement

/**
 * Calculate OT hours with multiplier for public holidays
 */
function calculateOTHours(startTime, endTime, isPublicHoliday) {
  try {
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    
    let durationMs = end - start;
    if (durationMs < 0) {
      durationMs += 24 * 60 * 60 * 1000;
    }
    
    const baseHours = durationMs / (1000 * 60 * 60);
    
    if (baseHours > CONFIG.LIMITS.MAX_HOURS_PER_SESSION) {
      throw new Error(
        `OT session cannot exceed ${CONFIG.LIMITS.MAX_HOURS_PER_SESSION} hours. ` +
        `Requested: ${baseHours.toFixed(2)} hours`
      );
    }
    
    if (baseHours <= 0) {
      throw new Error('OT duration must be greater than 0 hours');
    }
    
    const multiplier = isPublicHoliday ? CONFIG.CLAIM_CONVERSION.PUBLIC_HOLIDAY_MULTIPLIER : 1;
    const totalHours = baseHours * multiplier;
    
    return {
      baseHours: formatDecimal(baseHours),
      multiplier: multiplier,
      totalHours: formatDecimal(totalHours)
    };
  } catch (error) {
    Logger.log('calculateOTHours error: ' + error.toString());
    throw error;
  }
}

/**
 * Check if staff can apply for OT (doesn't exceed monthly limits)
 */
function checkOTLimit(staffEmail, additionalHours, monthYear) {
  try {
    if (!monthYear) {
      monthYear = getMonthYear(new Date());
    }
    
    const currentHours = getCurrentMonthOTHours(staffEmail, monthYear);
    const projectedHours = currentHours + additionalHours;
    
    if (projectedHours > CONFIG.LIMITS.MAX_OT_HOURS) {
      return {
        canApply: false,
        status: CONFIG.SUMMARY_STATUS.RED,
        currentHours: currentHours,
        projectedHours: projectedHours,
        remainingHours: CONFIG.LIMITS.MAX_OT_HOURS - currentHours,
        maxHours: CONFIG.LIMITS.MAX_OT_HOURS,
        message: `❌ Cannot apply. Would exceed maximum limit of ${CONFIG.LIMITS.MAX_OT_HOURS} hours.`
      };
    }
    
    if (projectedHours >= CONFIG.LIMITS.WARNING_THRESHOLD) {
      return {
        canApply: true,
        status: CONFIG.SUMMARY_STATUS.AMBER,
        currentHours: currentHours,
        projectedHours: projectedHours,
        remainingHours: CONFIG.LIMITS.MAX_OT_HOURS - projectedHours,
        maxHours: CONFIG.LIMITS.MAX_OT_HOURS,
        message: `⚠️ Warning: Approaching limit. After this: ${projectedHours}/${CONFIG.LIMITS.MAX_OT_HOURS}h`
      };
    }
    
    return {
      canApply: true,
      status: CONFIG.SUMMARY_STATUS.GREEN,
      currentHours: currentHours,
      projectedHours: projectedHours,
      remainingHours: CONFIG.LIMITS.MAX_OT_HOURS - projectedHours,
      maxHours: CONFIG.LIMITS.MAX_OT_HOURS,
      message: `✓ OT hours: ${projectedHours}/${CONFIG.LIMITS.MAX_OT_HOURS}h`
    };
  } catch (error) {
    Logger.log('checkOTLimit error: ' + error.toString());
    throw error;
  }
}

/**
 * Get current month's total approved OT hours for a staff member
 */
function getCurrentMonthOTHours(staffEmail, monthYear) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.OT_APPLICATIONS);
    const data = sheet.getDataRange().getValues();
    
    let totalHours = 0;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const email = row[2];
      const status = row[15];
      const otDate = row[4];
      const hours = row[10];
      
      if (email === staffEmail && status === CONFIG.STATUS.APPROVED) {
        const otMonthYear = getMonthYear(new Date(otDate));
        if (otMonthYear === monthYear) {
          totalHours += parseFloat(hours) || 0;
        }
      }
    }
    
    return formatDecimal(totalHours);
  } catch (error) {
    Logger.log('getCurrentMonthOTHours error: ' + error.toString());
    return 0;
  }
}

/**
 * Validate rest gap between last clock-out and OT start
 */
function validateRestGap(staffEmail, otStartDateTime) {
  try {
    const lastClockOutRecord = getLastClockOutBefore(staffEmail, otStartDateTime);
    
    if (!lastClockOutRecord) {
      return {
        valid: false,
        gapHours: 0,
        lastClockOut: null,
        message: 'No previous clock-out found in attendance log.'
      };
    }
    
    const gapMs = otStartDateTime - lastClockOutRecord.clockOutDateTime;
    const gapHours = gapMs / (1000 * 60 * 60);
    const isValid = gapHours >= CONFIG.LIMITS.MIN_REST_GAP_HOURS;
    
    return {
      valid: isValid,
      gapHours: formatDecimal(gapHours),
      lastClockOut: lastClockOutRecord.clockOutDateTime,
      lastClockOutFormatted: formatDate(lastClockOutRecord.clockOutDateTime, 'DATETIME'),
      message: isValid 
        ? `✓ Rest gap: ${formatDecimal(gapHours)} hours` 
        : `❌ Rest gap too short: ${formatDecimal(gapHours)} hours. Required: ${CONFIG.LIMITS.MIN_REST_GAP_HOURS} hours`
    };
  } catch (error) {
    Logger.log('validateRestGap error: ' + error.toString());
    return {
      valid: false,
      gapHours: 0,
      lastClockOut: null,
      message: 'Error validating rest gap: ' + error.toString()
    };
  }
}

/**
 * Check for duplicate OT claims
 */
function checkDuplicateClaim(staffEmail, otDate, startTime, endTime, excludeApplicationId) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.OT_APPLICATIONS);
    const data = sheet.getDataRange().getValues();
    
    const newStart = parseTime(startTime);
    const newEnd = parseTime(endTime);
    const checkDate = new Date(otDate);
    checkDate.setHours(0, 0, 0, 0);
    
    const conflicts = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const appId = row[0];
      const email = row[2];
      const existingDate = new Date(row[4]);
      existingDate.setHours(0, 0, 0, 0);
      const status = row[15];
      
      if (email !== staffEmail) continue;
      if (appId === excludeApplicationId) continue;
      if (status === CONFIG.STATUS.REJECTED) continue;
      if (checkDate.getTime() !== existingDate.getTime()) continue;
      
      const existingStart = parseTime(row[5]);
      const existingEnd = parseTime(row[6]);
      
      if (newStart < existingEnd && newEnd > existingStart) {
        conflicts.push({
          applicationId: appId,
          date: row[4],
          startTime: row[5],
          endTime: row[6],
          status: status
        });
      }
    }
    
    if (conflicts.length > 0) {
      return {
        isDuplicate: true,
        message: `Duplicate OT claim detected. ${conflicts.length} conflicting application(s) found.`,
        conflictingApplications: conflicts
      };
    }
    
    return {
      isDuplicate: false,
      message: 'No duplicate claims found',
      conflictingApplications: []
    };
  } catch (error) {
    Logger.log('checkDuplicateClaim error: ' + error.toString());
    return {
      isDuplicate: false,
      message: 'Error checking duplicates: ' + error.toString(),
      conflictingApplications: []
    };
  }
}

/**
 * Calculate monthly summary for a staff member
 */
function calculateMonthlySummary(staffEmail, monthYear) {
  try {
    const staffData = getStaffByEmail(staffEmail);
    if (!staffData) {
      throw new Error('Staff not found: ' + staffEmail);
    }
    
    const applications = getAllOTApplications({
      staffEmail: staffEmail,
      status: CONFIG.STATUS.APPROVED,
      monthYear: monthYear
    });
    
    let totalOTHours = 0;
    let moneyClaimHours = 0;
    let leaveClaimHours = 0;
    
    for (let app of applications) {
      const hours = parseFloat(app.totalHours) || 0;
      totalOTHours += hours;
      
      if (app.claimType === CONFIG.CLAIM_TYPE.MONEY) {
        moneyClaimHours += hours;
      } else if (app.claimType === CONFIG.CLAIM_TYPE.LEAVE) {
        leaveClaimHours += hours;
      }
    }
    
    const leaveDaysEarned = convertHoursToLeaveDays(leaveClaimHours);
    const status = getOTStatus(totalOTHours);
    
    return {
      staffEmail: staffEmail,
      staffName: staffData.staffName,
      team: staffData.team,
      monthYear: monthYear,
      totalOTHours: formatDecimal(totalOTHours),
      moneyClaimHours: formatDecimal(moneyClaimHours),
      leaveClaimHours: formatDecimal(leaveClaimHours),
      leaveDaysEarned: formatDecimal(leaveDaysEarned),
      status: status
    };
  } catch (error) {
    Logger.log('calculateMonthlySummary error: ' + error.toString());
    throw error;
  }
}

/**
 * Recalculate monthly summaries for all staff
 */
function recalculateAllMonthlySummaries(monthYear) {
  try {
    if (!monthYear) {
      monthYear = getMonthYear(new Date());
    }
    
    const allStaff = getAllStaff({ status: 'Active' });
    let summariesUpdated = 0;
    let errors = [];
    
    for (let staff of allStaff) {
      try {
        const summary = calculateMonthlySummary(staff.email, monthYear);
        upsertOTMonthlySummary(summary);
        summariesUpdated++;
      } catch (error) {
        errors.push({
          staffEmail: staff.email,
          error: error.toString()
        });
      }
    }
    
    return {
      success: true,
      monthYear: monthYear,
      summariesUpdated: summariesUpdated,
      totalStaff: allStaff.length,
      errors: errors
    };
  } catch (error) {
    Logger.log('recalculateAllMonthlySummaries error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * Validate complete OT application before submission
 */
function validateOTApplication(formData, staffEmail) {
  try {
    const errors = [];
    const warnings = [];
    let calculatedData = {};
    
    const staffData = getStaffByEmail(staffEmail);
    if (!staffData) {
      errors.push('Staff not found in system');
      return { valid: false, errors: errors, warnings: warnings };
    }
    
    const otDate = new Date(formData.otDate);
    const dateValidation = validateOTDateRange(otDate);
    if (!dateValidation.valid) {
      errors.push(dateValidation.message);
    }
    
    const timeValidation = validateTimeRange(formData.startTime, formData.endTime);
    if (!timeValidation.valid) {
      errors.push(timeValidation.message);
    }
    
    if (errors.length > 0) {
      return { valid: false, errors: errors, warnings: warnings };
    }
    
    const isPublicHoliday = checkIsPublicHoliday(otDate);
    if (isPublicHoliday) {
      const holidayDetails = getPublicHolidayDetails(otDate);
      warnings.push(`Public Holiday: ${holidayDetails.name} (2x multiplier applied)`);
    }
    
    try {
      const hoursCalc = calculateOTHours(formData.startTime, formData.endTime, isPublicHoliday);
      calculatedData.hoursCalculated = hoursCalc.baseHours;
      calculatedData.multiplier = hoursCalc.multiplier;
      calculatedData.totalHours = hoursCalc.totalHours;
      calculatedData.isPublicHoliday = isPublicHoliday;
    } catch (error) {
      errors.push(error.message);
      return { valid: false, errors: errors, warnings: warnings };
    }
    
    const limitCheck = checkOTLimit(staffEmail, calculatedData.totalHours);
    if (!limitCheck.canApply) {
      errors.push(limitCheck.message);
    } else if (limitCheck.status === CONFIG.SUMMARY_STATUS.AMBER) {
      warnings.push(limitCheck.message);
    }
    calculatedData.limitCheck = limitCheck;
    
    const otStartDateTime = combineDateAndTime(otDate, formData.startTime);
    const restGapCheck = validateRestGap(staffEmail, otStartDateTime);
    if (!restGapCheck.valid) {
      warnings.push(restGapCheck.message);
    }
    calculatedData.restGapCheck = restGapCheck;
    
    const duplicateCheck = checkDuplicateClaim(staffEmail, otDate, formData.startTime, formData.endTime);
    if (duplicateCheck.isDuplicate) {
      errors.push(duplicateCheck.message);
    }
    
    if (formData.claimType === CONFIG.CLAIM_TYPE.LEAVE) {
      calculatedData.leaveDays = convertHoursToLeaveDays(calculatedData.totalHours);
    } else {
      calculatedData.leaveDays = 0;
    }
    
    calculatedData.staffData = staffData;
    
    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings,
      calculatedData: calculatedData
    };
  } catch (error) {
    Logger.log('validateOTApplication error: ' + error.toString());
    return {
      valid: false,
      errors: ['System error: ' + error.toString()],
      warnings: []
    };
  }
}

// =============================================================================
// SECTION 3: OT APPLICATION MODULE
// =============================================================================
// Submit, approve, reject operations

/**
 * Submit OT application with full validation
 */
function submitOTApplication(formData, staffEmail) {
  try {
    Logger.log(`=== SUBMITTING OT APPLICATION: ${staffEmail} ===`);
    
    const validation = validateOTApplication(formData, staffEmail);
    
    if (!validation.valid) {
      Logger.log('❌ Validation failed: ' + validation.errors.join('; '));
      return {
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      };
    }
    
    const calc = validation.calculatedData;
    
    let proofFileName = '';
    let proofURL = '';
    
    if (formData.proofFile) {
      try {
        const uploadResult = uploadProofToDrive(
          formData.proofFile,
          calc.staffData.staffName,
          formData.otDate
        );
        proofFileName = uploadResult.fileName;
        proofURL = uploadResult.url;
      } catch (error) {
        Logger.log('⚠️ Proof upload failed: ' + error.toString());
      }
    }
    
    const applicationId = generateUUID();
    
    const applicationData = {
      applicationId: applicationId,
      staffName: calc.staffData.staffName,
      staffEmail: staffEmail,
      team: calc.staffData.team,
      otDate: formData.otDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      hoursCalculated: calc.hoursCalculated,
      isPublicHoliday: calc.isPublicHoliday,
      multiplier: calc.multiplier,
      totalHours: calc.totalHours,
      claimType: formData.claimType,
      leaveDays: calc.leaveDays,
      proofFileName: proofFileName,
      proofURL: proofURL,
      status: CONFIG.STATUS.PENDING,
      submittedDate: new Date(),
      lastClockOut: calc.restGapCheck.lastClockOut || '',
      restGapHours: calc.restGapCheck.gapHours,
      restGapValid: calc.restGapCheck.valid,
      validationErrors: validation.warnings.join('; ')
    };
    
    insertOTApplication(applicationData);
    
    try {
      sendOTApplicationAlert(calc.staffData.teamLeaderEmail, applicationData);
    } catch (error) {
      Logger.log('⚠️ Failed to send notification: ' + error.toString());
    }
    
    logActivity(
      staffEmail,
      CONFIG.ACTIVITY_ACTIONS.OT_APPLICATION_SUBMIT,
      `OT Application submitted: ${applicationId} - ${calc.totalHours}h on ${formatDate(formData.otDate, 'DATE')}`,
      applicationId
    );
    
    try {
      const monthYear = getMonthYear(formData.otDate);
      const summary = calculateMonthlySummary(staffEmail, monthYear);
      upsertOTMonthlySummary(summary);
    } catch (error) {
      Logger.log('⚠️ Failed to update summary: ' + error.toString());
    }
    
    Logger.log(`✓ OT application submitted successfully: ${applicationId}`);
    
    return {
      success: true,
      applicationId: applicationId,
      message: 'OT application submitted successfully',
      data: {
        applicationId: applicationId,
        totalHours: calc.totalHours,
        claimType: formData.claimType,
        leaveDays: calc.leaveDays,
        status: CONFIG.STATUS.PENDING,
        submittedDate: new Date()
      },
      warnings: validation.warnings.length > 0 ? validation.warnings : null,
      limitStatus: calc.limitCheck.status
    };
  } catch (error) {
    Logger.log('submitOTApplication error: ' + error.toString());
    
    logActivity(
      staffEmail,
      CONFIG.ACTIVITY_ACTIONS.SYSTEM_ERROR,
      'Error submitting OT application: ' + error.toString()
    );
    
    return {
      success: false,
      message: 'System error: ' + error.toString()
    };
  }
}

/**
 * Save OT application as draft
 */
function saveDraftOTApplication(formData, staffEmail) {
  try {
    const staffData = getStaffByEmail(staffEmail);
    if (!staffData) {
      return { success: false, message: 'Staff not found' };
    }
    
    const applicationId = generateUUID();
    
    const applicationData = {
      applicationId: applicationId,
      staffName: staffData.staffName,
      staffEmail: staffEmail,
      team: staffData.team,
      otDate: formData.otDate || new Date(),
      startTime: formData.startTime || '',
      endTime: formData.endTime || '',
      hoursCalculated: 0,
      isPublicHoliday: false,
      multiplier: 1,
      totalHours: 0,
      claimType: formData.claimType || CONFIG.CLAIM_TYPE.MONEY,
      leaveDays: 0,
      proofFileName: '',
      proofURL: '',
      status: CONFIG.STATUS.DRAFT,
      submittedDate: new Date(),
      lastClockOut: '',
      restGapHours: 0,
      restGapValid: false,
      validationErrors: 'Draft - not yet validated'
    };
    
    insertOTApplication(applicationData);
    
    return {
      success: true,
      applicationId: applicationId,
      message: 'Draft saved successfully'
    };
  } catch (error) {
    Logger.log('saveDraftOTApplication error: ' + error.toString());
    return {
      success: false,
      message: 'Error saving draft: ' + error.toString()
    };
  }
}

/**
 * Approve OT application
 */
function approveOTApplication(applicationId, approverEmail, remarks) {
  try {
    Logger.log(`=== APPROVING OT APPLICATION: ${applicationId} by ${approverEmail} ===`);
    
    const approverData = getStaffByEmail(approverEmail);
    if (!approverData || approverData.role !== CONFIG.ROLES.TEAM_LEADER) {
      return {
        success: false,
        message: 'Only Team Leaders can approve OT applications'
      };
    }
    
    const application = getOTApplicationById(applicationId);
    if (!application) {
      return { success: false, message: 'Application not found' };
    }
    
    if (application.status !== CONFIG.STATUS.PENDING) {
      return {
        success: false,
        message: `Application is not pending (current status: ${application.status})`
      };
    }
    
    if (application.team !== approverData.team) {
      return {
        success: false,
        message: 'You can only approve applications from your team'
      };
    }
    
    const monthYear = getMonthYear(application.otDate);
    const limitCheck = checkOTLimit(application.staffEmail, application.totalHours, monthYear);
    
    if (!limitCheck.canApply) {
      return {
        success: false,
        message: 'Cannot approve: ' + limitCheck.message
      };
    }
    
    const updateSuccess = updateOTApplicationStatus(
      applicationId,
      CONFIG.STATUS.APPROVED,
      approverEmail,
      remarks || 'Approved'
    );
    
    if (!updateSuccess) {
      return { success: false, message: 'Failed to update application status' };
    }
    
    try {
      const summary = calculateMonthlySummary(application.staffEmail, monthYear);
      upsertOTMonthlySummary(summary);
    } catch (error) {
      Logger.log('⚠️ Failed to update summary: ' + error.toString());
    }
    
    try {
      sendOTApprovalNotification(application.staffEmail, application, 'approved', remarks);
    } catch (error) {
      Logger.log('⚠️ Failed to send notification: ' + error.toString());
    }
    
    logActivity(
      approverEmail,
      CONFIG.ACTIVITY_ACTIONS.OT_APPLICATION_APPROVE,
      `Approved OT application: ${applicationId} - ${application.totalHours}h for ${application.staffName}`,
      applicationId
    );
    
    Logger.log(`✓ OT application approved: ${applicationId}`);
    
    return {
      success: true,
      message: 'OT application approved successfully',
      data: {
        applicationId: applicationId,
        status: CONFIG.STATUS.APPROVED,
        approvedBy: approverEmail,
        approvedDate: new Date()
      }
    };
  } catch (error) {
    Logger.log('approveOTApplication error: ' + error.toString());
    return {
      success: false,
      message: 'Error approving application: ' + error.toString()
    };
  }
}

/**
 * Reject OT application
 */
function rejectOTApplication(applicationId, approverEmail, remarks) {
  try {
    Logger.log(`=== REJECTING OT APPLICATION: ${applicationId} by ${approverEmail} ===`);
    
    const approverData = getStaffByEmail(approverEmail);
    if (!approverData || approverData.role !== CONFIG.ROLES.TEAM_LEADER) {
      return {
        success: false,
        message: 'Only Team Leaders can reject OT applications'
      };
    }
    
    const application = getOTApplicationById(applicationId);
    if (!application) {
      return { success: false, message: 'Application not found' };
    }
    
    if (application.status !== CONFIG.STATUS.PENDING) {
      return {
        success: false,
        message: `Application is not pending (current status: ${application.status})`
      };
    }
    
    if (application.team !== approverData.team) {
      return {
        success: false,
        message: 'You can only reject applications from your team'
      };
    }
    
    if (!remarks || remarks.trim() === '') {
      return {
        success: false,
        message: 'Rejection reason is required'
      };
    }
    
    const updateSuccess = updateOTApplicationStatus(
      applicationId,
      CONFIG.STATUS.REJECTED,
      approverEmail,
      remarks
    );
    
    if (!updateSuccess) {
      return { success: false, message: 'Failed to update application status' };
    }
    
    try {
      sendOTApprovalNotification(application.staffEmail, application, 'rejected', remarks);
    } catch (error) {
      Logger.log('⚠️ Failed to send notification: ' + error.toString());
    }
    
    logActivity(
      approverEmail,
      CONFIG.ACTIVITY_ACTIONS.OT_APPLICATION_REJECT,
      `Rejected OT application: ${applicationId} - Reason: ${remarks}`,
      applicationId
    );
    
    Logger.log(`✓ OT application rejected: ${applicationId}`);
    
    return {
      success: true,
      message: 'OT application rejected',
      data: {
        applicationId: applicationId,
        status: CONFIG.STATUS.REJECTED,
        rejectedBy: approverEmail,
        rejectedDate: new Date(),
        reason: remarks
      }
    };
  } catch (error) {
    Logger.log('rejectOTApplication error: ' + error.toString());
    return {
      success: false,
      message: 'Error rejecting application: ' + error.toString()
    };
  }
}

/**
 * Upload proof file to Google Drive
 */
function uploadProofToDrive(fileBlob, staffName, otDate) {
  try {
    const folder = getProofStorageFolder();
    const dateStr = formatDate(otDate, 'DATE');
    const timestamp = new Date().getTime();
    const fileName = `${staffName}_${dateStr}_${timestamp}_${fileBlob.getName()}`;
    
    const file = folder.createFile(fileBlob);
    file.setName(fileName);
    file.setDescription(`OT Proof for ${staffName} on ${dateStr}`);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    Logger.log(`✓ Proof file uploaded: ${fileName}`);
    
    return {
      success: true,
      fileName: fileName,
      url: file.getUrl(),
      fileId: file.getId()
    };
  } catch (error) {
    Logger.log('uploadProofToDrive error: ' + error.toString());
    throw new Error('Failed to upload proof file: ' + error.toString());
  }
}

/**
 * Get OT application dashboard data for staff
 */
function getStaffOTDashboard(staffEmail) {
  try {
    const currentMonth = getMonthYear(new Date());
    const summary = getOTMonthlySummary(staffEmail, currentMonth);
    const applications = getOTApplicationsByStaff(staffEmail, currentMonth);
    
    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      draft: 0
    };
    
    for (let app of applications) {
      const status = app.status.toLowerCase();
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++;
      }
    }
    
    return {
      success: true,
      staffEmail: staffEmail,
      monthYear: currentMonth,
      summary: summary || {
        totalOTHours: 0,
        moneyClaimHours: 0,
        leaveClaimHours: 0,
        leaveDaysEarned: 0,
        status: CONFIG.SUMMARY_STATUS.GREEN
      },
      applications: applications,
      statusCounts: statusCounts,
      limits: {
        maxHours: CONFIG.LIMITS.MAX_OT_HOURS,
        warningThreshold: CONFIG.LIMITS.WARNING_THRESHOLD,
        currentHours: summary ? summary.totalOTHours : 0,
        remainingHours: CONFIG.LIMITS.MAX_OT_HOURS - (summary ? summary.totalOTHours : 0)
      }
    };
  } catch (error) {
    Logger.log('getStaffOTDashboard error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * Get OT application dashboard data for team leader
 */
function getTeamLeaderDashboard(teamLeaderEmail) {
  try {
    const pendingApplications = getPendingOTApplicationsForApproval(teamLeaderEmail);
    const teamMembers = getTeamMembers(teamLeaderEmail);
    const currentMonth = getMonthYear(new Date());
    const teamSummaries = [];
    
    for (let member of teamMembers) {
      const summary = getOTMonthlySummary(member.email, currentMonth);
      if (summary) {
        teamSummaries.push(summary);
      }
    }
    
    return {
      success: true,
      teamLeaderEmail: teamLeaderEmail,
      monthYear: currentMonth,
      pendingApplications: pendingApplications,
      pendingCount: pendingApplications.length,
      teamMembers: teamMembers,
      teamSummaries: teamSummaries
    };
  } catch (error) {
    Logger.log('getTeamLeaderDashboard error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

// =============================================================================
// SECTION 4: ACTIVITY LOGGING
// =============================================================================
// System activity tracking

/**
 * Log activity to Activity_Log sheet
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
    return false;
  }
}

/**
 * Get activity logs with optional filtering
 */
function getActivityLogs(filters, limit) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVITY_LOG);
    const data = sheet.getDataRange().getValues();
    
    const logs = [];
    const maxRecords = limit || 100;
    
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      if (!row[0]) continue;
      
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
 */
function getApplicationActivityLogs(applicationId) {
  return getActivityLogs({ applicationId: applicationId }, 50);
}

/**
 * Get recent activity logs for a user
 */
function getUserActivityLogs(userEmail, limit) {
  return getActivityLogs({ userEmail: userEmail }, limit || 50);
}

/**
 * Get system-wide recent activity
 */
function getRecentActivityLogs(limit) {
  return getActivityLogs({}, limit || 100);
}

// =============================================================================
// SECTION 5: EMAIL NOTIFICATIONS
// =============================================================================
// Email alerts and reports

/**
 * Send OT application notification to Team Leader
 */
function sendOTApplicationAlert(teamLeaderEmail, applicationData) {
  try {
    if (!CONFIG.EMAIL.ENABLED) {
      Logger.log('Email notifications disabled');
      return false;
    }
    
    if (!teamLeaderEmail || !isValidEmail(teamLeaderEmail)) {
      Logger.log('Invalid team leader email: ' + teamLeaderEmail);
      return false;
    }
    
    const subject = `${CONFIG.EMAIL.SUBJECT_PREFIX} New OT Application - ${applicationData.staffName}`;
    
    const htmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #4285F4; color: white; padding: 20px; text-align: center;">
              <h2>🔔 New OT Application Pending Approval</h2>
            </div>
            <div style="background-color: #f9f9f9; padding: 20px; margin-top: 20px;">
              <p>Dear Team Leader,</p>
              <p>A new overtime application requires your approval.</p>
              <p><strong>Staff:</strong> ${applicationData.staffName}</p>
              <p><strong>Date:</strong> ${formatDate(applicationData.otDate, 'DATE')}</p>
              <p><strong>Time:</strong> ${applicationData.startTime} - ${applicationData.endTime}</p>
              <p><strong>Hours:</strong> ${applicationData.totalHours} hours</p>
              <p><strong>Type:</strong> ${applicationData.claimType}</p>
              <p style="text-align: center; margin-top: 20px;">
                <a href="${getSpreadsheetUrl()}" style="background-color: #4285F4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Review Application</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    MailApp.sendEmail({
      to: teamLeaderEmail,
      subject: subject,
      htmlBody: htmlBody,
      name: CONFIG.EMAIL.SENDER_NAME
    });
    
    Logger.log(`✓ Notification sent to Team Leader: ${teamLeaderEmail}`);
    return true;
  } catch (error) {
    Logger.log('sendOTApplicationAlert error: ' + error.toString());
    return false;
  }
}

/**
 * Send OT approval/rejection notification to Staff
 */
function sendOTApprovalNotification(staffEmail, applicationData, decision, remarks) {
  try {
    if (!CONFIG.EMAIL.ENABLED) {
      Logger.log('Email notifications disabled');
      return false;
    }
    
    if (!staffEmail || !isValidEmail(staffEmail)) {
      Logger.log('Invalid staff email: ' + staffEmail);
      return false;
    }
    
    const isApproved = (decision === 'approved');
    const statusColor = isApproved ? '#34A853' : '#EA4335';
    const statusText = isApproved ? 'APPROVED' : 'REJECTED';
    
    const subject = `${CONFIG.EMAIL.SUBJECT_PREFIX} OT Application ${statusText}`;
    
    const htmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: ${statusColor}; color: white; padding: 20px; text-align: center;">
              <h2>OT Application ${statusText}</h2>
            </div>
            <div style="background-color: #f9f9f9; padding: 20px; margin-top: 20px;">
              <p>Dear ${applicationData.staffName},</p>
              <p>Your OT application has been <strong>${decision}</strong>.</p>
              <p><strong>Date:</strong> ${formatDate(applicationData.otDate, 'DATE')}</p>
              <p><strong>Hours:</strong> ${applicationData.totalHours} hours</p>
              ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
              <p style="text-align: center; margin-top: 20px;">
                <a href="${getSpreadsheetUrl()}" style="background-color: #4285F4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Dashboard</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    MailApp.sendEmail({
      to: staffEmail,
      subject: subject,
      htmlBody: htmlBody,
      name: CONFIG.EMAIL.SENDER_NAME
    });
    
    Logger.log(`✓ ${statusText} notification sent to Staff: ${staffEmail}`);
    return true;
  } catch (error) {
    Logger.log('sendOTApprovalNotification error: ' + error.toString());
    return false;
  }
}

/**
 * Get spreadsheet URL for email links
 */
function getSpreadsheetUrl() {
  try {
    const ss = getSpreadsheet();
    return ss.getUrl();
  } catch (error) {
    Logger.log('getSpreadsheetUrl error: ' + error.toString());
    return 'https://sheets.google.com';
  }
}
