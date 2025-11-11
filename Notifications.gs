/**
 * ==============================================================================
 * OT MANAGEMENT SYSTEM - EMAIL NOTIFICATIONS
 * ==============================================================================
 * This file contains functions for sending email notifications to users.
 * 
 * @version 1.0.0
 * @date 2025-11-11
 */

/**
 * Send OT application notification to Team Leader
 * 
 * @param {string} teamLeaderEmail - Team leader's email
 * @param {Object} applicationData - Application data object
 * @returns {boolean} Success status
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
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4285F4; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #666; }
            .value { color: #000; }
            .warning { background-color: #FFF3CD; border-left: 4px solid #FFC107; padding: 10px; margin: 10px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .button { background-color: #4285F4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🔔 New OT Application Pending Approval</h2>
            </div>
            
            <div class="content">
              <p>Dear Team Leader,</p>
              <p>A new overtime application has been submitted and requires your approval.</p>
              
              <div class="field">
                <span class="label">Application ID:</span>
                <span class="value">${applicationData.applicationId}</span>
              </div>
              
              <div class="field">
                <span class="label">Staff Name:</span>
                <span class="value">${applicationData.staffName}</span>
              </div>
              
              <div class="field">
                <span class="label">Team:</span>
                <span class="value">${applicationData.team}</span>
              </div>
              
              <div class="field">
                <span class="label">OT Date:</span>
                <span class="value">${formatDate(applicationData.otDate, 'DATE')}</span>
              </div>
              
              <div class="field">
                <span class="label">Time:</span>
                <span class="value">${applicationData.startTime} - ${applicationData.endTime}</span>
              </div>
              
              <div class="field">
                <span class="label">OT Hours:</span>
                <span class="value">${applicationData.totalHours} hours ${applicationData.isPublicHoliday ? '(Public Holiday - 2x)' : ''}</span>
              </div>
              
              <div class="field">
                <span class="label">Claim Type:</span>
                <span class="value">${applicationData.claimType}${applicationData.leaveDays > 0 ? ' (' + applicationData.leaveDays + ' days)' : ''}</span>
              </div>
              
              <div class="field">
                <span class="label">Rest Gap:</span>
                <span class="value">${applicationData.restGapHours} hours ${applicationData.restGapValid ? '✓' : '⚠️ Below minimum'}</span>
              </div>
              
              ${applicationData.validationErrors ? `
                <div class="warning">
                  <strong>⚠️ Validation Warnings:</strong><br>
                  ${applicationData.validationErrors}
                </div>
              ` : ''}
              
              <div class="field">
                <span class="label">Submitted:</span>
                <span class="value">${formatDate(applicationData.submittedDate, 'DATETIME')}</span>
              </div>
              
              <p style="margin-top: 20px;">
                <strong>Action Required:</strong> Please review and approve/reject this application.
              </p>
              
              <div style="text-align: center; margin-top: 20px;">
                <a href="${getSpreadsheetUrl()}" class="button">📊 Review Application</a>
              </div>
            </div>
            
            <div class="footer">
              <p>This is an automated notification from OT Management System</p>
              <p>Please do not reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const plainBody = `
New OT Application Pending Approval

Application ID: ${applicationData.applicationId}
Staff Name: ${applicationData.staffName}
Team: ${applicationData.team}
OT Date: ${formatDate(applicationData.otDate, 'DATE')}
Time: ${applicationData.startTime} - ${applicationData.endTime}
OT Hours: ${applicationData.totalHours} hours
Claim Type: ${applicationData.claimType}
Rest Gap: ${applicationData.restGapHours} hours

Please review and approve/reject this application.

View Application: ${getSpreadsheetUrl()}
    `;
    
    MailApp.sendEmail({
      to: teamLeaderEmail,
      subject: subject,
      body: plainBody,
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
 * 
 * @param {string} staffEmail - Staff email
 * @param {Object} applicationData - Application data
 * @param {string} decision - 'approved' or 'rejected'
 * @param {string} remarks - Approver's remarks
 * @returns {boolean} Success status
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
    const statusIcon = isApproved ? '✓' : '✗';
    const statusText = isApproved ? 'APPROVED' : 'REJECTED';
    
    const subject = `${CONFIG.EMAIL.SUBJECT_PREFIX} OT Application ${statusText} - ${formatDate(applicationData.otDate, 'DATE')}`;
    
    const htmlBody = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: ${statusColor}; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #666; }
            .value { color: #000; }
            .remarks { background-color: #E8F0FE; border-left: 4px solid #4285F4; padding: 10px; margin: 10px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .button { background-color: #4285F4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${statusIcon} OT Application ${statusText}</h2>
            </div>
            
            <div class="content">
              <p>Dear ${applicationData.staffName},</p>
              <p>Your overtime application has been <strong>${decision}</strong>.</p>
              
              <div class="field">
                <span class="label">Application ID:</span>
                <span class="value">${applicationData.applicationId}</span>
              </div>
              
              <div class="field">
                <span class="label">OT Date:</span>
                <span class="value">${formatDate(applicationData.otDate, 'DATE')}</span>
              </div>
              
              <div class="field">
                <span class="label">Time:</span>
                <span class="value">${applicationData.startTime} - ${applicationData.endTime}</span>
              </div>
              
              <div class="field">
                <span class="label">OT Hours:</span>
                <span class="value">${applicationData.totalHours} hours</span>
              </div>
              
              <div class="field">
                <span class="label">Claim Type:</span>
                <span class="value">${applicationData.claimType}${applicationData.leaveDays > 0 ? ' (' + applicationData.leaveDays + ' days)' : ''}</span>
              </div>
              
              ${remarks ? `
                <div class="remarks">
                  <strong>${isApproved ? 'Approval' : 'Rejection'} Remarks:</strong><br>
                  ${remarks}
                </div>
              ` : ''}
              
              <div class="field">
                <span class="label">${isApproved ? 'Approved' : 'Rejected'} By:</span>
                <span class="value">${applicationData.approvedBy || 'Team Leader'}</span>
              </div>
              
              <div class="field">
                <span class="label">Date:</span>
                <span class="value">${formatDate(new Date(), 'DATETIME')}</span>
              </div>
              
              ${isApproved ? `
                <p style="margin-top: 20px; color: #34A853;">
                  ✓ Your OT hours have been added to your monthly summary.
                </p>
              ` : `
                <p style="margin-top: 20px; color: #EA4335;">
                  If you believe this rejection is incorrect, please contact your Team Leader.
                </p>
              `}
              
              <div style="text-align: center; margin-top: 20px;">
                <a href="${getSpreadsheetUrl()}" class="button">📊 View Dashboard</a>
              </div>
            </div>
            
            <div class="footer">
              <p>This is an automated notification from OT Management System</p>
              <p>Please do not reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const plainBody = `
OT Application ${statusText}

Dear ${applicationData.staffName},

Your overtime application has been ${decision}.

Application ID: ${applicationData.applicationId}
OT Date: ${formatDate(applicationData.otDate, 'DATE')}
Time: ${applicationData.startTime} - ${applicationData.endTime}
OT Hours: ${applicationData.totalHours} hours
Claim Type: ${applicationData.claimType}

${remarks ? `Remarks: ${remarks}` : ''}

${isApproved ? 'Approved' : 'Rejected'} By: ${applicationData.approvedBy || 'Team Leader'}
Date: ${formatDate(new Date(), 'DATETIME')}

View Dashboard: ${getSpreadsheetUrl()}
    `;
    
    MailApp.sendEmail({
      to: staffEmail,
      subject: subject,
      body: plainBody,
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
 * Send monthly OT summary report to staff
 * 
 * @param {string} staffEmail - Staff email
 * @param {Object} summaryData - Monthly summary data
 * @returns {boolean} Success status
 */
function sendMonthlySummaryReport(staffEmail, summaryData) {
  try {
    if (!CONFIG.EMAIL.ENABLED) {
      Logger.log('Email notifications disabled');
      return false;
    }
    
    const statusColor = {
      'Green': '#34A853',
      'Amber': '#FFC107',
      'Red': '#EA4335'
    };
    
    const color = statusColor[summaryData.status] || '#666';
    
    const subject = `${CONFIG.EMAIL.SUBJECT_PREFIX} Monthly OT Summary - ${summaryData.monthYear}`;
    
    const htmlBody = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4285F4; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
            .summary-box { background-color: white; border: 2px solid ${color}; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .status-badge { display: inline-block; background-color: ${color}; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #666; }
            .value { color: #000; font-size: 18px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📊 Monthly OT Summary</h2>
              <p>${summaryData.monthYear}</p>
            </div>
            
            <div class="content">
              <p>Dear ${summaryData.staffName},</p>
              <p>Here is your overtime summary for ${summaryData.monthYear}:</p>
              
              <div class="summary-box">
                <div class="field">
                  <span class="label">Status:</span><br>
                  <span class="status-badge">${summaryData.status}</span>
                </div>
                
                <div class="field">
                  <span class="label">Total OT Hours:</span><br>
                  <span class="value">${summaryData.totalOTHours} / ${CONFIG.LIMITS.MAX_OT_HOURS} hours</span>
                </div>
                
                <div class="field">
                  <span class="label">Money Claim:</span><br>
                  <span class="value">${summaryData.moneyClaimHours} hours</span>
                </div>
                
                <div class="field">
                  <span class="label">Leave Claim:</span><br>
                  <span class="value">${summaryData.leaveClaimHours} hours (${summaryData.leaveDaysEarned} days)</span>
                </div>
                
                <div class="field">
                  <span class="label">Remaining Capacity:</span><br>
                  <span class="value">${CONFIG.LIMITS.MAX_OT_HOURS - summaryData.totalOTHours} hours</span>
                </div>
              </div>
              
              ${summaryData.status === 'Red' ? `
                <p style="color: #EA4335; font-weight: bold;">
                  ⚠️ You have reached the maximum OT limit for this month.
                </p>
              ` : summaryData.status === 'Amber' ? `
                <p style="color: #FFC107; font-weight: bold;">
                  ⚠️ You are approaching the maximum OT limit for this month.
                </p>
              ` : ''}
              
              <p style="margin-top: 20px; text-align: center;">
                <a href="${getSpreadsheetUrl()}" style="background-color: #4285F4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Detailed Report</a>
              </p>
            </div>
            
            <div class="footer">
              <p>This is an automated report from OT Management System</p>
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
    
    Logger.log(`✓ Monthly summary sent to: ${staffEmail}`);
    return true;
    
  } catch (error) {
    Logger.log('sendMonthlySummaryReport error: ' + error.toString());
    return false;
  }
}

/**
 * Get spreadsheet URL for email links
 * 
 * @returns {string} Spreadsheet URL
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

/**
 * Test email notification
 */
function testEmailNotification() {
  try {
    const testData = {
      applicationId: 'TEST-001',
      staffName: 'Test User',
      staffEmail: getCurrentUserEmail(),
      team: 'Test Team',
      otDate: new Date(),
      startTime: '18:00:00',
      endTime: '22:00:00',
      totalHours: 4,
      claimType: 'Money',
      leaveDays: 0,
      isPublicHoliday: false,
      submittedDate: new Date(),
      restGapHours: 5,
      restGapValid: true,
      validationErrors: '',
      approvedBy: 'Test Approver'
    };
    
    const currentEmail = getCurrentUserEmail();
    
    if (!currentEmail) {
      SpreadsheetApp.getUi().alert(
        'Test Failed',
        'Could not get your email address. Make sure you are logged in.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }
    
    Logger.log('Sending test notification to: ' + currentEmail);
    
    // Test approval notification
    const result = sendOTApprovalNotification(currentEmail, testData, 'approved', 'Test approval message');
    
    if (result) {
      SpreadsheetApp.getUi().alert(
        'Test Successful',
        `Test notification sent to: ${currentEmail}\n\nCheck your email inbox.`,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } else {
      SpreadsheetApp.getUi().alert(
        'Test Failed',
        'Failed to send test notification. Check the logs for details.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }
    
  } catch (error) {
    Logger.log('testEmailNotification error: ' + error.toString());
    SpreadsheetApp.getUi().alert(
      'Test Error',
      'Error: ' + error.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Send bulk monthly summaries to all active staff
 * Run this at the end of each month
 * 
 * @param {string} monthYear - Month in YYYY-MM format (optional, defaults to current)
 * @returns {Object} {success, sentCount, failedCount}
 */
function sendBulkMonthlySummaries(monthYear) {
  try {
    if (!monthYear) {
      monthYear = getMonthYear(new Date());
    }
    
    Logger.log(`=== SENDING BULK MONTHLY SUMMARIES: ${monthYear} ===`);
    
    const allStaff = getAllStaff({ status: 'Active' });
    let sentCount = 0;
    let failedCount = 0;
    
    for (let staff of allStaff) {
      try {
        const summary = getOTMonthlySummary(staff.email, monthYear);
        
        if (summary && summary.totalOTHours > 0) {
          const sent = sendMonthlySummaryReport(staff.email, summary);
          if (sent) {
            sentCount++;
          } else {
            failedCount++;
          }
        }
        
        // Avoid hitting email quota limits
        Utilities.sleep(1000); // 1 second delay between emails
        
      } catch (error) {
        Logger.log(`Failed to send summary to ${staff.email}: ${error.toString()}`);
        failedCount++;
      }
    }
    
    Logger.log(`✓ Sent ${sentCount} summaries, ${failedCount} failed`);
    
    return {
      success: true,
      monthYear: monthYear,
      sentCount: sentCount,
      failedCount: failedCount,
      totalStaff: allStaff.length
    };
    
  } catch (error) {
    Logger.log('sendBulkMonthlySummaries error: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}
