/**
 * ==============================================================================
 * OT MANAGEMENT SYSTEM - BUSINESS LOGIC
 * ==============================================================================
 * This file contains the core business logic for OT calculations, validations,
 * and rule enforcement.
 * 
 * @version 1.0.0
 * @date 2025-11-11
 */

/**
 * Calculate OT hours with multiplier for public holidays
 * 
 * @param {string|Date} startTime - OT start time
 * @param {string|Date} endTime - OT end time
 * @param {boolean} isPublicHoliday - Whether OT is on public holiday
 * @returns {Object} {baseHours, multiplier, totalHours}
 * @throws {Error} If validation fails
 */
function calculateOTHours(startTime, endTime, isPublicHoliday) {
  try {
    // Parse time strings to Date objects
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    
    // Calculate duration in hours
    let durationMs = end - start;
    
    // Handle overnight shifts (end time before start time)
    if (durationMs < 0) {
      durationMs += 24 * 60 * 60 * 1000; // Add 24 hours
    }
    
    // Convert milliseconds to hours
    const baseHours = durationMs / (1000 * 60 * 60);
    
    // Validate: OT session cannot exceed maximum hours
    if (baseHours > CONFIG.LIMITS.MAX_HOURS_PER_SESSION) {
      throw new Error(
        `OT session cannot exceed ${CONFIG.LIMITS.MAX_HOURS_PER_SESSION} hours. ` +
        `Requested: ${baseHours.toFixed(2)} hours`
      );
    }
    
    // Validate: Must have positive hours
    if (baseHours <= 0) {
      throw new Error('OT duration must be greater than 0 hours');
    }
    
    // Apply multiplier for public holidays
    const multiplier = isPublicHoliday ? CONFIG.CLAIM_CONVERSION.PUBLIC_HOLIDAY_MULTIPLIER : 1;
    const totalHours = baseHours * multiplier;
    
    Logger.log(
      `calculateOTHours: ${baseHours.toFixed(2)}h × ${multiplier} = ${totalHours.toFixed(2)}h ` +
      `(Public Holiday: ${isPublicHoliday})`
    );
    
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
 * 
 * @param {string} staffEmail - Staff email address
 * @param {number} additionalHours - Hours to add
 * @param {string} monthYear - Month in YYYY-MM format (optional, defaults to current)
 * @returns {Object} {canApply, status, currentHours, remainingHours, message}
 */
function checkOTLimit(staffEmail, additionalHours, monthYear) {
  try {
    // Default to current month if not specified
    if (!monthYear) {
      monthYear = getMonthYear(new Date());
    }
    
    // Get current approved OT hours for the month
    const currentHours = getCurrentMonthOTHours(staffEmail, monthYear);
    const projectedHours = currentHours + additionalHours;
    
    Logger.log(
      `checkOTLimit: Staff=${staffEmail}, Current=${currentHours}h, ` +
      `Additional=${additionalHours}h, Projected=${projectedHours}h`
    );
    
    // Block if exceeds maximum
    if (projectedHours > CONFIG.LIMITS.MAX_OT_HOURS) {
      return {
        canApply: false,
        status: CONFIG.SUMMARY_STATUS.RED,
        currentHours: currentHours,
        projectedHours: projectedHours,
        remainingHours: CONFIG.LIMITS.MAX_OT_HOURS - currentHours,
        maxHours: CONFIG.LIMITS.MAX_OT_HOURS,
        message: `❌ Cannot apply. Would exceed maximum limit of ${CONFIG.LIMITS.MAX_OT_HOURS} hours. ` +
                `Current: ${currentHours}h, Requested: ${additionalHours}h, Would be: ${projectedHours}h`
      };
    }
    
    // Warning if approaching limit (amber zone)
    if (projectedHours >= CONFIG.LIMITS.WARNING_THRESHOLD) {
      return {
        canApply: true,
        status: CONFIG.SUMMARY_STATUS.AMBER,
        currentHours: currentHours,
        projectedHours: projectedHours,
        remainingHours: CONFIG.LIMITS.MAX_OT_HOURS - projectedHours,
        maxHours: CONFIG.LIMITS.MAX_OT_HOURS,
        message: `⚠️ Warning: Approaching limit. Current: ${currentHours}h, ` +
                `After this: ${projectedHours}/${CONFIG.LIMITS.MAX_OT_HOURS}h`
      };
    }
    
    // All good (green zone)
    return {
      canApply: true,
      status: CONFIG.SUMMARY_STATUS.GREEN,
      currentHours: currentHours,
      projectedHours: projectedHours,
      remainingHours: CONFIG.LIMITS.MAX_OT_HOURS - projectedHours,
      maxHours: CONFIG.LIMITS.MAX_OT_HOURS,
      message: `✓ OT hours: ${projectedHours}/${CONFIG.LIMITS.MAX_OT_HOURS}h (${formatDecimal(remainingHours)}h remaining)`
    };
    
  } catch (error) {
    Logger.log('checkOTLimit error: ' + error.toString());
    throw error;
  }
}

/**
 * Get current month's total approved OT hours for a staff member
 * 
 * @param {string} staffEmail - Staff email address
 * @param {string} monthYear - Month in YYYY-MM format
 * @returns {number} Total approved OT hours
 */
function getCurrentMonthOTHours(staffEmail, monthYear) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.OT_APPLICATIONS);
    const data = sheet.getDataRange().getValues();
    
    let totalHours = 0;
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      const email = row[2];        // Column C: StaffEmail
      const status = row[15];      // Column P: Status
      const otDate = row[4];       // Column E: OTDate
      const hours = row[10];       // Column K: TotalHours
      
      // Only count approved OT for the specified month
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
 * Ensures minimum 4-hour rest period
 * 
 * @param {string} staffEmail - Staff email address
 * @param {Date} otStartDateTime - OT start date and time
 * @returns {Object} {valid, gapHours, lastClockOut, message}
 */
function validateRestGap(staffEmail, otStartDateTime) {
  try {
    // Get last clock-out before OT start
    const lastClockOutRecord = getLastClockOutBefore(staffEmail, otStartDateTime);
    
    if (!lastClockOutRecord) {
      Logger.log(`⚠️ No clock-out record found for ${staffEmail} before ${otStartDateTime}`);
      return {
        valid: false,
        gapHours: 0,
        lastClockOut: null,
        message: 'No previous clock-out found in attendance log. Cannot verify rest gap.'
      };
    }
    
    // Calculate gap in hours
    const gapMs = otStartDateTime - lastClockOutRecord.clockOutDateTime;
    const gapHours = gapMs / (1000 * 60 * 60);
    
    const isValid = gapHours >= CONFIG.LIMITS.MIN_REST_GAP_HOURS;
    
    Logger.log(
      `validateRestGap: Last clock-out=${formatDate(lastClockOutRecord.clockOutDateTime, 'DATETIME')}, ` +
      `OT start=${formatDate(otStartDateTime, 'DATETIME')}, Gap=${gapHours.toFixed(2)}h, Valid=${isValid}`
    );
    
    return {
      valid: isValid,
      gapHours: formatDecimal(gapHours),
      lastClockOut: lastClockOutRecord.clockOutDateTime,
      lastClockOutFormatted: formatDate(lastClockOutRecord.clockOutDateTime, 'DATETIME'),
      message: isValid 
        ? `✓ Rest gap: ${formatDecimal(gapHours)} hours (Valid)` 
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
 * Check for duplicate OT claims (same staff, date, and overlapping time)
 * 
 * @param {string} staffEmail - Staff email
 * @param {Date} otDate - OT date
 * @param {string} startTime - Start time
 * @param {string} endTime - End time
 * @param {string} excludeApplicationId - Application ID to exclude from check (for updates)
 * @returns {Object} {isDuplicate, message, conflictingApplications}
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
    
    // Check all existing applications
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      const appId = row[0];
      const email = row[2];
      const existingDate = new Date(row[4]);
      existingDate.setHours(0, 0, 0, 0);
      const status = row[15];
      
      // Skip if different staff or excluded application
      if (email !== staffEmail) continue;
      if (appId === excludeApplicationId) continue;
      
      // Skip rejected applications
      if (status === CONFIG.STATUS.REJECTED) continue;
      
      // Check if same date
      if (checkDate.getTime() !== existingDate.getTime()) continue;
      
      // Check for time overlap
      const existingStart = parseTime(row[5]);
      const existingEnd = parseTime(row[6]);
      
      // Two time ranges overlap if:
      // (newStart < existingEnd) AND (newEnd > existingStart)
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
      Logger.log(`❌ Duplicate claim detected for ${staffEmail} on ${formatDate(otDate, 'DATE')}`);
      return {
        isDuplicate: true,
        message: `Duplicate OT claim detected for this time period. ${conflicts.length} conflicting application(s) found.`,
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
 * 
 * @param {string} staffEmail - Staff email
 * @param {string} monthYear - Month in YYYY-MM format
 * @returns {Object} Summary data object
 */
function calculateMonthlySummary(staffEmail, monthYear) {
  try {
    // Get staff details
    const staffData = getStaffByEmail(staffEmail);
    if (!staffData) {
      throw new Error('Staff not found: ' + staffEmail);
    }
    
    // Get all approved applications for the month
    const applications = getAllOTApplications({
      staffEmail: staffEmail,
      status: CONFIG.STATUS.APPROVED,
      monthYear: monthYear
    });
    
    let totalOTHours = 0;
    let moneyClaimHours = 0;
    let leaveClaimHours = 0;
    
    // Sum up hours by claim type
    for (let app of applications) {
      const hours = parseFloat(app.totalHours) || 0;
      totalOTHours += hours;
      
      if (app.claimType === CONFIG.CLAIM_TYPE.MONEY) {
        moneyClaimHours += hours;
      } else if (app.claimType === CONFIG.CLAIM_TYPE.LEAVE) {
        leaveClaimHours += hours;
      }
    }
    
    // Calculate leave days earned
    const leaveDaysEarned = convertHoursToLeaveDays(leaveClaimHours);
    
    // Determine status based on total hours
    const status = getOTStatus(totalOTHours);
    
    const summary = {
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
    
    Logger.log(
      `calculateMonthlySummary: ${staffEmail} - ${monthYear} - ` +
      `Total: ${totalOTHours}h, Money: ${moneyClaimHours}h, Leave: ${leaveClaimHours}h (${leaveDaysEarned} days), ` +
      `Status: ${status}`
    );
    
    return summary;
    
  } catch (error) {
    Logger.log('calculateMonthlySummary error: ' + error.toString());
    throw error;
  }
}

/**
 * Recalculate monthly summaries for all staff
 * Run this after bulk approvals or data corrections
 * 
 * @param {string} monthYear - Optional: specific month to recalculate (YYYY-MM)
 * @returns {Object} {success, summariesUpdated, errors}
 */
function recalculateAllMonthlySummaries(monthYear) {
  try {
    Logger.log('=== RECALCULATING MONTHLY SUMMARIES ===');
    
    // If no month specified, use current month
    if (!monthYear) {
      monthYear = getMonthYear(new Date());
    }
    
    // Get all active staff
    const allStaff = getAllStaff({ status: 'Active' });
    
    let summariesUpdated = 0;
    let errors = [];
    
    for (let staff of allStaff) {
      try {
        // Calculate summary
        const summary = calculateMonthlySummary(staff.email, monthYear);
        
        // Update/insert in database
        upsertOTMonthlySummary(summary);
        
        summariesUpdated++;
        
      } catch (error) {
        Logger.log(`Error calculating summary for ${staff.email}: ${error.toString()}`);
        errors.push({
          staffEmail: staff.email,
          error: error.toString()
        });
      }
    }
    
    Logger.log(`✓ Recalculated ${summariesUpdated} summaries for ${monthYear}`);
    Logger.log(`✗ ${errors.length} errors encountered`);
    Logger.log('======================================');
    
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
 * Runs all validation checks
 * 
 * @param {Object} formData - Form data from user
 * @param {string} staffEmail - Staff email
 * @returns {Object} {valid, errors, warnings, calculatedData}
 */
function validateOTApplication(formData, staffEmail) {
  try {
    const errors = [];
    const warnings = [];
    let calculatedData = {};
    
    // 1. Validate staff exists
    const staffData = getStaffByEmail(staffEmail);
    if (!staffData) {
      errors.push('Staff not found in system');
      return { valid: false, errors: errors, warnings: warnings };
    }
    
    // 2. Validate OT date range
    const otDate = new Date(formData.otDate);
    const dateValidation = validateOTDateRange(otDate);
    if (!dateValidation.valid) {
      errors.push(dateValidation.message);
    }
    
    // 3. Validate time range
    const timeValidation = validateTimeRange(formData.startTime, formData.endTime);
    if (!timeValidation.valid) {
      errors.push(timeValidation.message);
    }
    
    // If basic validations fail, return early
    if (errors.length > 0) {
      return { valid: false, errors: errors, warnings: warnings };
    }
    
    // 4. Check if public holiday
    const isPublicHoliday = checkIsPublicHoliday(otDate);
    if (isPublicHoliday) {
      const holidayDetails = getPublicHolidayDetails(otDate);
      warnings.push(`Public Holiday: ${holidayDetails.name} (2x multiplier applied)`);
    }
    
    // 5. Calculate OT hours
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
    
    // 6. Check OT limits
    const limitCheck = checkOTLimit(staffEmail, calculatedData.totalHours);
    if (!limitCheck.canApply) {
      errors.push(limitCheck.message);
    } else if (limitCheck.status === CONFIG.SUMMARY_STATUS.AMBER) {
      warnings.push(limitCheck.message);
    }
    calculatedData.limitCheck = limitCheck;
    
    // 7. Validate rest gap
    const otStartDateTime = combineDateAndTime(otDate, formData.startTime);
    const restGapCheck = validateRestGap(staffEmail, otStartDateTime);
    if (!restGapCheck.valid) {
      warnings.push(restGapCheck.message); // Warning, not error (can still submit)
    }
    calculatedData.restGapCheck = restGapCheck;
    
    // 8. Check for duplicates
    const duplicateCheck = checkDuplicateClaim(staffEmail, otDate, formData.startTime, formData.endTime);
    if (duplicateCheck.isDuplicate) {
      errors.push(duplicateCheck.message);
    }
    
    // 9. Calculate leave days if applicable
    if (formData.claimType === CONFIG.CLAIM_TYPE.LEAVE) {
      calculatedData.leaveDays = convertHoursToLeaveDays(calculatedData.totalHours);
    } else {
      calculatedData.leaveDays = 0;
    }
    
    calculatedData.staffData = staffData;
    
    const isValid = errors.length === 0;
    
    Logger.log(
      `validateOTApplication: Valid=${isValid}, Errors=${errors.length}, Warnings=${warnings.length}`
    );
    
    return {
      valid: isValid,
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

/**
 * Test business logic functions
 */
function testBusinessLogic() {
  Logger.log('=== TESTING BUSINESS LOGIC ===');
  
  // Test calculateOTHours
  const calc1 = calculateOTHours('18:00:00', '22:00:00', false);
  Logger.log('Normal OT: ' + JSON.stringify(calc1));
  
  const calc2 = calculateOTHours('18:00:00', '22:00:00', true);
  Logger.log('Public Holiday OT: ' + JSON.stringify(calc2));
  
  // Test checkOTLimit
  const limit = checkOTLimit('ahmad@company.com', 10);
  Logger.log('OT Limit Check: ' + JSON.stringify(limit));
  
  // Test getCurrentMonthOTHours
  const currentHours = getCurrentMonthOTHours('ahmad@company.com', getMonthYear(new Date()));
  Logger.log('Current month hours: ' + currentHours);
  
  Logger.log('==============================');
}
