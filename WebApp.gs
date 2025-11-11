/**
 * ==============================================================================
 * OT MANAGEMENT SYSTEM - WEB APPLICATION
 * ==============================================================================
 * This file handles the web application deployment and routing.
 * Serves HTML interfaces for Staff and Team Leaders.
 * 
 * @version 1.0.0
 * @date 2025-11-11
 */

/**
 * Serve the web application
 * This is the main entry point for the web app
 * 
 * @param {Object} e - Event object
 * @returns {HtmlOutput} HTML page
 */
function doGet(e) {
  try {
    // Get user email
    const userEmail = Session.getActiveUser().getEmail();
    
    // Check if user exists in system
    const staffData = getStaffByEmail(userEmail);
    
    if (!staffData) {
      return showUnauthorizedPage(userEmail);
    }
    
    // Get page parameter (default: dashboard)
    const page = e.parameter.page || 'dashboard';
    
    // Route to appropriate page based on role
    if (staffData.role === CONFIG.ROLES.TEAM_LEADER) {
      return serveTeamLeaderPage(page, staffData);
    } else if (staffData.role === CONFIG.ROLES.STAFF) {
      return serveStaffPage(page, staffData);
    } else if (staffData.role === CONFIG.ROLES.MANAGEMENT) {
      return serveManagementPage(page, staffData);
    }
    
    // Default: staff dashboard
    return serveStaffPage('dashboard', staffData);
    
  } catch (error) {
    Logger.log('doGet error: ' + error.toString());
    return showErrorPage(error.toString());
  }
}

/**
 * Serve staff pages
 * 
 * @param {string} page - Page name
 * @param {Object} staffData - Staff data
 * @returns {HtmlOutput} HTML page
 */
function serveStaffPage(page, staffData) {
  let template;
  
  switch(page) {
    case 'dashboard':
      template = HtmlService.createTemplateFromFile('StaffDashboard');
      break;
    case 'apply':
      template = HtmlService.createTemplateFromFile('OTApplicationForm');
      break;
    case 'history':
      template = HtmlService.createTemplateFromFile('ApplicationHistory');
      break;
    default:
      template = HtmlService.createTemplateFromFile('StaffDashboard');
  }
  
  // Pass data to template
  template.userData = staffData;
  template.userEmail = staffData.email;
  
  return template.evaluate()
    .setTitle('OT Management System - ' + staffData.staffName)
    .setFaviconUrl('https://ssl.gstatic.com/docs/spreadsheets/favicon3.ico')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Serve team leader pages
 * 
 * @param {string} page - Page name
 * @param {Object} staffData - Staff data
 * @returns {HtmlOutput} HTML page
 */
function serveTeamLeaderPage(page, staffData) {
  let template;
  
  switch(page) {
    case 'tl-dashboard':
    case 'dashboard':
      template = HtmlService.createTemplateFromFile('TeamLeaderDashboard');
      break;
    case 'approval-queue':
    case 'approvals':
      template = HtmlService.createTemplateFromFile('ApprovalQueue');
      break;
    case 'team-summary':
    case 'team':
      template = HtmlService.createTemplateFromFile('TeamSummary');
      break;
    case 'apply':
      template = HtmlService.createTemplateFromFile('OTApplicationForm');
      break;
    case 'history':
      template = HtmlService.createTemplateFromFile('ApplicationHistory');
      break;
    default:
      template = HtmlService.createTemplateFromFile('TeamLeaderDashboard');
  }
  
  template.userData = staffData;
  template.userEmail = staffData.email;
  
  return template.evaluate()
    .setTitle('OT Management System - Team Leader')
    .setFaviconUrl('https://ssl.gstatic.com/docs/spreadsheets/favicon3.ico')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Serve management pages
 * 
 * @param {string} page - Page name
 * @param {Object} staffData - Staff data
 * @returns {HtmlOutput} HTML page
 */
function serveManagementPage(page, staffData) {
  const template = HtmlService.createTemplateFromFile('ManagementDashboard');
  template.userData = staffData;
  template.userEmail = staffData.email;
  
  return template.evaluate()
    .setTitle('OT Management System - Management')
    .setFaviconUrl('https://ssl.gstatic.com/docs/spreadsheets/favicon3.ico')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Show unauthorized page
 * 
 * @param {string} email - User email
 * @returns {HtmlOutput} HTML page
 */
function showUnauthorizedPage(email) {
  const template = HtmlService.createTemplateFromFile('Unauthorized');
  template.email = email;
  
  return template.evaluate()
    .setTitle('Access Denied')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Show error page
 * 
 * @param {string} errorMessage - Error message
 * @returns {HtmlOutput} HTML page
 */
function showErrorPage(errorMessage) {
  const template = HtmlService.createTemplateFromFile('Error');
  template.errorMessage = errorMessage;
  
  return template.evaluate()
    .setTitle('Error')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Include HTML files (for modular design)
 * 
 * @param {string} filename - File name
 * @returns {string} HTML content
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// =============================================================================
// API ENDPOINTS (called from frontend via google.script.run)
// =============================================================================

/**
 * API: Get current user data
 * 
 * @returns {Object} User data
 */
function apiGetCurrentUser() {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const staffData = getStaffByEmail(userEmail);
    
    return {
      success: true,
      data: staffData
    };
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * API: Get staff dashboard data
 * 
 * @returns {Object} Dashboard data
 */
function apiGetStaffDashboard() {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    return getStaffOTDashboard(userEmail);
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * API: Get team leader dashboard data
 * 
 * @returns {Object} Dashboard data
 */
function apiGetTeamLeaderDashboard() {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    return getTeamLeaderDashboard(userEmail);
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * API: Submit OT application
 * 
 * @param {Object} formData - Form data
 * @returns {Object} Result
 */
function apiSubmitOTApplication(formData) {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    return submitOTApplication(formData, userEmail);
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * API: Approve OT application
 * 
 * @param {string} applicationId - Application ID
 * @param {string} remarks - Approval remarks
 * @returns {Object} Result
 */
function apiApproveApplication(applicationId, remarks) {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    return approveOTApplication(applicationId, userEmail, remarks);
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * API: Reject OT application
 * 
 * @param {string} applicationId - Application ID
 * @param {string} remarks - Rejection reason
 * @returns {Object} Result
 */
function apiRejectApplication(applicationId, remarks) {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    return rejectOTApplication(applicationId, userEmail, remarks);
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * API: Get application details
 * 
 * @param {string} applicationId - Application ID
 * @returns {Object} Application data
 */
function apiGetApplication(applicationId) {
  try {
    const application = getOTApplicationById(applicationId);
    return {
      success: true,
      data: application
    };
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * API: Get pending applications for team leader
 * 
 * @returns {Object} Applications data
 */
function apiGetPendingApplications() {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const applications = getPendingOTApplicationsForApproval(userEmail);
    return {
      success: true,
      data: applications
    };
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * API: Get staff applications history
 * 
 * @param {string} monthYear - Optional month filter (YYYY-MM)
 * @returns {Object} Applications data
 */
function apiGetApplicationHistory(monthYear) {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const applications = getOTApplicationsByStaff(userEmail, monthYear);
    return {
      success: true,
      data: applications
    };
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * API: Check if date is public holiday
 * 
 * @param {string} dateString - Date in ISO format
 * @returns {Object} Holiday info
 */
function apiCheckPublicHoliday(dateString) {
  try {
    const date = new Date(dateString);
    const isHoliday = checkIsPublicHoliday(date);
    const details = isHoliday ? getPublicHolidayDetails(date) : null;
    
    return {
      success: true,
      isHoliday: isHoliday,
      details: details
    };
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * API: Validate OT application before submission
 * 
 * @param {Object} formData - Form data
 * @returns {Object} Validation result
 */
function apiValidateOTApplication(formData) {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const validation = validateOTApplication(formData, userEmail);
    
    return {
      success: true,
      validation: validation
    };
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * API: Get team members for team leader
 * 
 * @returns {Object} Team members data
 */
function apiGetTeamMembers() {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const members = getTeamMembers(userEmail);
    return {
      success: true,
      data: members
    };
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * API: Get monthly summary for staff
 * 
 * @param {string} monthYear - Month in YYYY-MM format
 * @returns {Object} Summary data
 */
function apiGetMonthlySummary(monthYear) {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const summary = getOTMonthlySummary(userEmail, monthYear || getMonthYear(new Date()));
    return {
      success: true,
      data: summary
    };
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * API: Get management dashboard data
 * 
 * @returns {Object} Management dashboard data
 */
function apiGetManagementDashboard() {
  try {
    const monthYear = getMonthYear(new Date());
    
    // Get all OT applications for the month
    const allApplications = getOTApplicationsByMonth(monthYear);
    
    // Get all staff
    const allStaff = getAllStaff();
    
    // Calculate metrics
    const totalOTHours = allApplications
      .filter(app => app.status === CONFIG.STATUS.APPROVED)
      .reduce((sum, app) => sum + app.totalOTHours, 0);
    
    const activeStaffCount = new Set(
      allApplications
        .filter(app => app.status === CONFIG.STATUS.APPROVED)
        .map(app => app.staffId)
    ).size;
    
    const pendingApprovals = allApplications.filter(app => app.status === CONFIG.STATUS.PENDING).length;
    
    const totalCost = allApplications
      .filter(app => app.status === CONFIG.STATUS.APPROVED && app.claimType === 'Money')
      .reduce((sum, app) => sum + (app.totalOTHours * CONFIG.OT_HOURLY_RATE), 0);
    
    // Staff exceeding limit
    const monthlySummaries = getMonthlySummaries(monthYear);
    const staffExceedingLimit = monthlySummaries.filter(s => s.totalOTHours > CONFIG.MAX_OT_HOURS);
    
    // Department breakdown (using teams as departments)
    const departments = {};
    allStaff.forEach(staff => {
      if (!departments[staff.teamName]) {
        departments[staff.teamName] = {
          teamName: staff.teamName,
          staffCount: 0,
          totalHours: 0,
          totalCost: 0,
          pendingCount: 0
        };
      }
      departments[staff.teamName].staffCount++;
    });
    
    allApplications.forEach(app => {
      const staff = allStaff.find(s => s.staffId === app.staffId);
      if (staff && departments[staff.teamName]) {
        if (app.status === CONFIG.STATUS.APPROVED) {
          departments[staff.teamName].totalHours += app.totalOTHours;
          if (app.claimType === 'Money') {
            departments[staff.teamName].totalCost += app.totalOTHours * CONFIG.OT_HOURLY_RATE;
          }
        }
        if (app.status === CONFIG.STATUS.PENDING) {
          departments[staff.teamName].pendingCount++;
        }
      }
    });
    
    // Top staff by OT hours
    const topStaff = monthlySummaries
      .map(summary => {
        const staff = allStaff.find(s => s.staffId === summary.staffId);
        return {
          staffId: summary.staffId,
          staffName: staff ? staff.staffName : summary.staffId,
          teamName: staff ? staff.teamName : 'Unknown',
          totalOT: summary.totalOTHours,
          moneyClaim: summary.moneyClaimHours * CONFIG.OT_HOURLY_RATE,
          leaveDays: summary.leaveDaysEarned
        };
      })
      .sort((a, b) => b.totalOT - a.totalOT);
    
    // Recent activity (last 20 activities)
    const recentActivity = getRecentActivityLog(20);
    
    return {
      success: true,
      data: {
        totalOTHours: totalOTHours,
        activeStaffCount: activeStaffCount,
        pendingApprovals: pendingApprovals,
        totalCost: totalCost,
        otHoursChange: 0, // Would need historical comparison
        staffExceedingLimit: staffExceedingLimit,
        budgetExceeded: false, // Would need budget configuration
        budgetOverage: 0,
        departments: Object.values(departments),
        topStaff: topStaff,
        recentActivity: recentActivity
      }
    };
  } catch (error) {
    Logger.log('apiGetManagementDashboard error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * Get web app URL for sharing
 * 
 * @returns {string} Web app URL
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * Open web app in browser (from custom menu)
 */
function openDashboard() {
  const url = getWebAppUrl();
  const html = HtmlService.createHtmlOutput(
    '<script>window.open("' + url + '", "_blank");google.script.host.close();</script>'
  );
  SpreadsheetApp.getUi().showModalDialog(html, 'Opening Dashboard...');
}

/**
 * Open OT application form (from custom menu)
 */
function openOTApplicationForm() {
  const url = getWebAppUrl() + '?page=apply';
  const html = HtmlService.createHtmlOutput(
    '<script>window.open("' + url + '", "_blank");google.script.host.close();</script>'
  );
  SpreadsheetApp.getUi().showModalDialog(html, 'Opening Application Form...');
}
