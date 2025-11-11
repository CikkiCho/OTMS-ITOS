/**
 * ==============================================================================
 * OT MANAGEMENT SYSTEM - UTILITY FUNCTIONS
 * ==============================================================================
 * This file contains helper functions for date/time parsing, validation,
 * and other utility operations.
 * 
 * @version 1.0.0
 * @date 2025-11-11
 */

/**
 * Parse time string or Time object to Date object
 * Handles formats: "HH:MM", "HH:MM:SS", Time object, Date object
 * 
 * @param {string|Date} timeInput - Time to parse
 * @returns {Date} Date object with time set
 */
function parseTime(timeInput) {
  // If already a Date object, return it
  if (timeInput instanceof Date) {
    return timeInput;
  }
  
  // If string, parse it
  if (typeof timeInput === 'string') {
    const timeParts = timeInput.split(':');
    const today = new Date();
    today.setHours(parseInt(timeParts[0]) || 0);
    today.setMinutes(parseInt(timeParts[1]) || 0);
    today.setSeconds(parseInt(timeParts[2]) || 0);
    today.setMilliseconds(0);
    return today;
  }
  
  throw new Error('Invalid time input: ' + timeInput);
}

/**
 * Combine date and time strings/objects into a single DateTime
 * 
 * @param {Date|string} date - Date object or string
 * @param {string|Date} time - Time string ("HH:MM") or Date object
 * @returns {Date} Combined DateTime object
 */
function combineDateAndTime(date, time) {
  // Parse date
  const dateObj = (date instanceof Date) ? new Date(date) : new Date(date);
  
  // Parse time
  const timeObj = parseTime(time);
  
  // Combine
  const combined = new Date(dateObj);
  combined.setHours(timeObj.getHours());
  combined.setMinutes(timeObj.getMinutes());
  combined.setSeconds(timeObj.getSeconds());
  combined.setMilliseconds(0);
  
  return combined;
}

/**
 * Format time from Date object to "HH:MM:SS" string
 * 
 * @param {Date} dateTime - DateTime object
 * @returns {string} Time string in format "HH:MM:SS"
 */
function formatTimeString(dateTime) {
  if (!dateTime || !(dateTime instanceof Date)) {
    return '';
  }
  
  const hours = String(dateTime.getHours()).padStart(2, '0');
  const minutes = String(dateTime.getMinutes()).padStart(2, '0');
  const seconds = String(dateTime.getSeconds()).padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Check if a given date is a public holiday
 * 
 * @param {Date} date - Date to check
 * @returns {boolean} True if public holiday, false otherwise
 */
function checkIsPublicHoliday(date) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.PUBLIC_HOLIDAYS);
    const data = sheet.getDataRange().getValues();
    
    // Normalize input date to compare only date part (ignore time)
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const holidayDate = new Date(row[0]); // Column A: Date
      holidayDate.setHours(0, 0, 0, 0);
      
      if (checkDate.getTime() === holidayDate.getTime()) {
        Logger.log(`✓ Date ${formatDate(date, 'DATE')} is a public holiday: ${row[1]}`);
        return true;
      }
    }
    
    Logger.log(`Date ${formatDate(date, 'DATE')} is not a public holiday`);
    return false;
    
  } catch (error) {
    Logger.log('checkIsPublicHoliday error: ' + error.toString());
    return false; // Fail safe: if error, assume not a holiday
  }
}

/**
 * Get public holiday details for a given date
 * 
 * @param {Date} date - Date to check
 * @returns {Object|null} Holiday details {date, name, year, region} or null
 */
function getPublicHolidayDetails(date) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.PUBLIC_HOLIDAYS);
    const data = sheet.getDataRange().getValues();
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const holidayDate = new Date(row[0]);
      holidayDate.setHours(0, 0, 0, 0);
      
      if (checkDate.getTime() === holidayDate.getTime()) {
        return {
          date: row[0],
          name: row[1],
          year: row[2],
          region: row[3]
        };
      }
    }
    
    return null;
    
  } catch (error) {
    Logger.log('getPublicHolidayDetails error: ' + error.toString());
    return null;
  }
}

/**
 * Get month-year string from date
 * Format: "YYYY-MM"
 * 
 * @param {Date} date - Date object
 * @returns {string} Month-year string
 */
function getMonthYear(date) {
  return formatDate(date, 'MONTH_YEAR');
}

/**
 * Get first day of month
 * 
 * @param {Date} date - Date in the month
 * @returns {Date} First day of the month
 */
function getFirstDayOfMonth(date) {
  const firstDay = new Date(date);
  firstDay.setDate(1);
  firstDay.setHours(0, 0, 0, 0);
  return firstDay;
}

/**
 * Get last day of month
 * 
 * @param {Date} date - Date in the month
 * @returns {Date} Last day of the month
 */
function getLastDayOfMonth(date) {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  lastDay.setHours(23, 59, 59, 999);
  return lastDay;
}

/**
 * Check if date is within valid range for OT application
 * Cannot be too far in the past or too far in the future
 * 
 * @param {Date} otDate - OT date to validate
 * @returns {Object} {valid: boolean, message: string}
 */
function validateOTDateRange(otDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(otDate);
  checkDate.setHours(0, 0, 0, 0);
  
  // Check if date is in the future
  const maxFutureDate = new Date(today);
  maxFutureDate.setDate(maxFutureDate.getDate() + CONFIG.LIMITS.MAX_FUTURE_DAYS);
  
  if (checkDate > maxFutureDate) {
    return {
      valid: false,
      message: `OT date cannot be more than ${CONFIG.LIMITS.MAX_FUTURE_DAYS} days in the future`
    };
  }
  
  // Check if date is too far in the past (current month or previous month only)
  const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  firstDayOfLastMonth.setHours(0, 0, 0, 0);
  
  if (checkDate < firstDayOfLastMonth) {
    return {
      valid: false,
      message: 'OT date can only be in current month or previous month'
    };
  }
  
  return {
    valid: true,
    message: 'OT date is valid'
  };
}

/**
 * Generate a unique UUID for application IDs
 * 
 * @returns {string} UUID string
 */
function generateUUID() {
  return Utilities.getUuid();
}

/**
 * Validate email format
 * 
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Calculate duration in hours between two times
 * Handles overnight shifts (end time before start time)
 * 
 * @param {Date|string} startTime - Start time
 * @param {Date|string} endTime - End time
 * @returns {number} Duration in hours (decimal)
 */
function calculateDuration(startTime, endTime) {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  
  let durationMs = end - start;
  
  // Handle overnight shifts
  if (durationMs < 0) {
    durationMs += 24 * 60 * 60 * 1000; // Add 24 hours
  }
  
  // Convert to hours
  const hours = durationMs / (1000 * 60 * 60);
  
  return Math.round(hours * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert OT hours to leave days
 * 
 * @param {number} otHours - Total OT hours
 * @returns {number} Leave days (rounded to 2 decimal places)
 */
function convertHoursToLeaveDays(otHours) {
  const days = otHours / CONFIG.CLAIM_CONVERSION.HOURS_PER_LEAVE_DAY;
  return Math.round(days * 100) / 100;
}

/**
 * Convert leave days to OT hours
 * 
 * @param {number} leaveDays - Leave days
 * @returns {number} OT hours
 */
function convertLeaveDaysToHours(leaveDays) {
  return leaveDays * CONFIG.CLAIM_CONVERSION.HOURS_PER_LEAVE_DAY;
}

/**
 * Get status color based on OT hours
 * 
 * @param {number} totalHours - Total OT hours
 * @returns {string} Status: 'Green', 'Amber', or 'Red'
 */
function getOTStatus(totalHours) {
  if (totalHours >= CONFIG.LIMITS.MAX_OT_HOURS) {
    return CONFIG.SUMMARY_STATUS.RED;
  } else if (totalHours >= CONFIG.LIMITS.WARNING_THRESHOLD) {
    return CONFIG.SUMMARY_STATUS.AMBER;
  } else {
    return CONFIG.SUMMARY_STATUS.GREEN;
  }
}

/**
 * Sanitize string for safe storage (remove special characters)
 * 
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
function sanitizeString(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.trim().replace(/[<>\"\']/g, '');
}

/**
 * Format number to 2 decimal places
 * 
 * @param {number} num - Number to format
 * @returns {number} Formatted number
 */
function formatDecimal(num) {
  return Math.round(num * 100) / 100;
}

/**
 * Check if two dates are on the same day
 * 
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if same day
 */
function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * Get date range description for display
 * 
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {string} Formatted date range
 */
function formatDateRange(startDate, endDate) {
  const start = formatDate(startDate, 'DATE');
  const end = formatDate(endDate, 'DATE');
  
  if (start === end) {
    return start;
  }
  
  return `${start} to ${end}`;
}

/**
 * Validate time range (end must be after start)
 * 
 * @param {string|Date} startTime - Start time
 * @param {string|Date} endTime - End time
 * @returns {Object} {valid: boolean, message: string}
 */
function validateTimeRange(startTime, endTime) {
  try {
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    
    // For same-day validation (not allowing overnight initially for simplicity)
    if (end <= start) {
      return {
        valid: false,
        message: 'End time must be after start time'
      };
    }
    
    return {
      valid: true,
      message: 'Time range is valid'
    };
    
  } catch (error) {
    return {
      valid: false,
      message: 'Invalid time format'
    };
  }
}

/**
 * Get current user's email
 * 
 * @returns {string} User's email address
 */
function getCurrentUserEmail() {
  try {
    return Session.getActiveUser().getEmail();
  } catch (error) {
    Logger.log('getCurrentUserEmail error: ' + error.toString());
    return '';
  }
}

/**
 * Get current user's effective email (for testing)
 * Falls back to effective user if active user is not available
 * 
 * @returns {string} User's email address
 */
function getEffectiveUserEmail() {
  try {
    let email = Session.getActiveUser().getEmail();
    if (!email) {
      email = Session.getEffectiveUser().getEmail();
    }
    return email;
  } catch (error) {
    Logger.log('getEffectiveUserEmail error: ' + error.toString());
    return '';
  }
}

/**
 * Test all utility functions
 */
function testUtilityFunctions() {
  Logger.log('=== TESTING UTILITY FUNCTIONS ===');
  
  // Test parseTime
  const time1 = parseTime('14:30:00');
  Logger.log('parseTime("14:30:00"): ' + time1);
  
  // Test combineDateAndTime
  const date = new Date('2024-12-15');
  const datetime = combineDateAndTime(date, '18:00:00');
  Logger.log('combineDateAndTime(2024-12-15, 18:00:00): ' + datetime);
  
  // Test checkIsPublicHoliday
  const isHoliday = checkIsPublicHoliday(new Date('2024-12-25'));
  Logger.log('checkIsPublicHoliday(2024-12-25): ' + isHoliday);
  
  // Test calculateDuration
  const duration = calculateDuration('18:00:00', '22:00:00');
  Logger.log('calculateDuration(18:00, 22:00): ' + duration + ' hours');
  
  // Test convertHoursToLeaveDays
  const leaveDays = convertHoursToLeaveDays(12);
  Logger.log('convertHoursToLeaveDays(12): ' + leaveDays + ' days');
  
  // Test getOTStatus
  const status1 = getOTStatus(50);
  const status2 = getOTStatus(95);
  const status3 = getOTStatus(104);
  Logger.log('getOTStatus(50): ' + status1);
  Logger.log('getOTStatus(95): ' + status2);
  Logger.log('getOTStatus(104): ' + status3);
  
  // Test validateOTDateRange
  const validation = validateOTDateRange(new Date());
  Logger.log('validateOTDateRange(today): ' + JSON.stringify(validation));
  
  Logger.log('=================================');
}
