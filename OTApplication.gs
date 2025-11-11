/**
 * ==============================================================================
 * OT MANAGEMENT SYSTEM - OT APPLICATION MODULE
 * ==============================================================================
 * This file contains functions for submitting, updating, approving, and
 * rejecting OT applications.
 * 
 * @version 1.0.0
 * @date 2025-11-11
 */

/**
 * Submit OT application with full validation
 * Main function called by staff to submit OT claims
 * 
 * @param {Object} formData - Form data from user
 *   {
 *     otDate: Date,
 *     startTime: string,
 *     endTime: string,
 *     claimType: string (Money/Leave),
 *     proofFile: File object (optional for now, URL-based later)
 *   }
 * @param {string} staffEmail - Staff email (from session)
 * @returns {Object} {success, applicationId, message, warnings, limitStatus}
 */
function submitOTApplication(formData, staffEmail) {
  try {
    Logger.log(`=== SUBMITTING OT APPLICATION: ${staffEmail} ===`);
    
    // 1. Validate all inputs and calculate OT hours
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
    
    // 2. Handle proof file upload (placeholder for now)
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
        // Continue anyway, proof can be uploaded later
      }
    }
    
    // 3. Create application record
    const applicationId = generateUUID();
    const otStartDateTime = combineDateAndTime(formData.otDate, formData.startTime);
    
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
    
    // 4. Insert into database
    insertOTApplication(applicationData);
    
    // 5. Send notification to Team Leader
    try {
      sendOTApplicationAlert(calc.staffData.teamLeaderEmail, applicationData);
    } catch (error) {
      Logger.log('⚠️ Failed to send notification: ' + error.toString());
      // Continue anyway, notification is not critical
    }
    
    // 6. Log activity
    logActivity(
      staffEmail,
      CONFIG.ACTIVITY_ACTIONS.OT_APPLICATION_SUBMIT,
      `OT Application submitted: ${applicationId} - ${calc.totalHours}h on ${formatDate(formData.otDate, 'DATE')}`,
      applicationId
    );
    
    // 7. Recalculate monthly summary
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
    
    // Log error activity
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
 * Save OT application as draft (without validation)
 * Allows staff to save partial applications
 * 
 * @param {Object} formData - Form data from user
 * @param {string} staffEmail - Staff email
 * @returns {Object} {success, applicationId, message}
 */
function saveDraftOTApplication(formData, staffEmail) {
  try {
    Logger.log(`=== SAVING DRAFT OT APPLICATION: ${staffEmail} ===`);
    
    // Get staff details
    const staffData = getStaffByEmail(staffEmail);
    if (!staffData) {
      return { success: false, message: 'Staff not found' };
    }
    
    // Create draft application with minimal data
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
    
    Logger.log(`✓ Draft saved: ${applicationId}`);
    
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
 * Approve OT application (Team Leader function)
 * 
 * @param {string} applicationId - Application ID to approve
 * @param {string} approverEmail - Team leader's email
 * @param {string} remarks - Approval remarks (optional)
 * @returns {Object} {success, message}
 */
function approveOTApplication(applicationId, approverEmail, remarks) {
  try {
    Logger.log(`=== APPROVING OT APPLICATION: ${applicationId} by ${approverEmail} ===`);
    
    // 1. Verify approver is a team leader
    const approverData = getStaffByEmail(approverEmail);
    if (!approverData || approverData.role !== CONFIG.ROLES.TEAM_LEADER) {
      return {
        success: false,
        message: 'Only Team Leaders can approve OT applications'
      };
    }
    
    // 2. Get application details
    const application = getOTApplicationById(applicationId);
    if (!application) {
      return {
        success: false,
        message: 'Application not found'
      };
    }
    
    // 3. Verify application is pending
    if (application.status !== CONFIG.STATUS.PENDING) {
      return {
        success: false,
        message: `Application is not pending (current status: ${application.status})`
      };
    }
    
    // 4. Verify team leader has authority (same team)
    if (application.team !== approverData.team) {
      return {
        success: false,
        message: 'You can only approve applications from your team'
      };
    }
    
    // 5. Check if approval would exceed staff's monthly limit
    const monthYear = getMonthYear(application.otDate);
    const limitCheck = checkOTLimit(application.staffEmail, application.totalHours, monthYear);
    
    if (!limitCheck.canApply) {
      return {
        success: false,
        message: 'Cannot approve: ' + limitCheck.message
      };
    }
    
    // 6. Update application status
    const updateSuccess = updateOTApplicationStatus(
      applicationId,
      CONFIG.STATUS.APPROVED,
      approverEmail,
      remarks || 'Approved'
    );
    
    if (!updateSuccess) {
      return {
        success: false,
        message: 'Failed to update application status'
      };
    }
    
    // 7. Recalculate monthly summary for staff
    try {
      const summary = calculateMonthlySummary(application.staffEmail, monthYear);
      upsertOTMonthlySummary(summary);
    } catch (error) {
      Logger.log('⚠️ Failed to update summary: ' + error.toString());
    }
    
    // 8. Send notification to staff
    try {
      sendOTApprovalNotification(application.staffEmail, application, 'approved', remarks);
    } catch (error) {
      Logger.log('⚠️ Failed to send notification: ' + error.toString());
    }
    
    // 9. Log activity
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
 * Reject OT application (Team Leader function)
 * 
 * @param {string} applicationId - Application ID to reject
 * @param {string} approverEmail - Team leader's email
 * @param {string} remarks - Rejection reason (required)
 * @returns {Object} {success, message}
 */
function rejectOTApplication(applicationId, approverEmail, remarks) {
  try {
    Logger.log(`=== REJECTING OT APPLICATION: ${applicationId} by ${approverEmail} ===`);
    
    // 1. Verify approver is a team leader
    const approverData = getStaffByEmail(approverEmail);
    if (!approverData || approverData.role !== CONFIG.ROLES.TEAM_LEADER) {
      return {
        success: false,
        message: 'Only Team Leaders can reject OT applications'
      };
    }
    
    // 2. Get application details
    const application = getOTApplicationById(applicationId);
    if (!application) {
      return {
        success: false,
        message: 'Application not found'
      };
    }
    
    // 3. Verify application is pending
    if (application.status !== CONFIG.STATUS.PENDING) {
      return {
        success: false,
        message: `Application is not pending (current status: ${application.status})`
      };
    }
    
    // 4. Verify team leader has authority
    if (application.team !== approverData.team) {
      return {
        success: false,
        message: 'You can only reject applications from your team'
      };
    }
    
    // 5. Rejection reason is required
    if (!remarks || remarks.trim() === '') {
      return {
        success: false,
        message: 'Rejection reason is required'
      };
    }
    
    // 6. Update application status
    const updateSuccess = updateOTApplicationStatus(
      applicationId,
      CONFIG.STATUS.REJECTED,
      approverEmail,
      remarks
    );
    
    if (!updateSuccess) {
      return {
        success: false,
        message: 'Failed to update application status'
      };
    }
    
    // 7. Send notification to staff
    try {
      sendOTApprovalNotification(application.staffEmail, application, 'rejected', remarks);
    } catch (error) {
      Logger.log('⚠️ Failed to send notification: ' + error.toString());
    }
    
    // 8. Log activity
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
 * 
 * @param {Blob} fileBlob - File blob to upload
 * @param {string} staffName - Staff name
 * @param {Date} otDate - OT date
 * @returns {Object} {success, fileName, url, fileId}
 */
function uploadProofToDrive(fileBlob, staffName, otDate) {
  try {
    // Get or create proof storage folder
    const folder = getProofStorageFolder();
    
    // Generate unique filename
    const dateStr = formatDate(otDate, 'DATE');
    const timestamp = new Date().getTime();
    const fileName = `${staffName}_${dateStr}_${timestamp}_${fileBlob.getName()}`;
    
    // Upload file
    const file = folder.createFile(fileBlob);
    file.setName(fileName);
    file.setDescription(`OT Proof for ${staffName} on ${dateStr}`);
    
    // Make file accessible (viewer access)
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
 * 
 * @param {string} staffEmail - Staff email
 * @returns {Object} Dashboard data
 */
function getStaffOTDashboard(staffEmail) {
  try {
    const currentMonth = getMonthYear(new Date());
    
    // Get current month summary
    const summary = getOTMonthlySummary(staffEmail, currentMonth);
    
    // Get all applications for current month
    const applications = getOTApplicationsByStaff(staffEmail, currentMonth);
    
    // Count by status
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
 * 
 * @param {string} teamLeaderEmail - Team leader email
 * @returns {Object} Dashboard data
 */
function getTeamLeaderDashboard(teamLeaderEmail) {
  try {
    // Get pending applications for approval
    const pendingApplications = getPendingOTApplicationsForApproval(teamLeaderEmail);
    
    // Get team members
    const teamMembers = getTeamMembers(teamLeaderEmail);
    
    // Get current month summaries for team
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

/**
 * Test OT application functions
 */
function testOTApplication() {
  Logger.log('=== TESTING OT APPLICATION FUNCTIONS ===');
  
  // Test submit application
  const formData = {
    otDate: new Date('2024-12-15'),
    startTime: '18:00:00',
    endTime: '22:00:00',
    claimType: CONFIG.CLAIM_TYPE.MONEY
  };
  
  const result = submitOTApplication(formData, 'ahmad@company.com');
  Logger.log('Submit result: ' + JSON.stringify(result));
  
  // Test get dashboard
  const dashboard = getStaffOTDashboard('ahmad@company.com');
  Logger.log('Dashboard: ' + JSON.stringify(dashboard));
  
  Logger.log('========================================');
}
