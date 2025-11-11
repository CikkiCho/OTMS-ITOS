# 🚀 OT Management System - Google Apps Script

## 📋 Overview

A comprehensive **Overtime (OT) Management System** built with **Google Apps Script** and **Google Sheets as the database**. This system manages OT applications, approvals, tracking, and reporting with automated validations and email notifications.

## ✨ Features

- ✅ **OT Application Submission** with automatic validation
- ✅ **Rest Gap Validation** (minimum 4-hour rest period)
- ✅ **Monthly OT Limits** (104 hours max, with 90-hour warning)
- ✅ **Public Holiday Detection** (2x multiplier)
- ✅ **Leave Conversion** (6 OT hours = 1 leave day)
- ✅ **Approval Workflow** (Team Leader approval required)
- ✅ **Email Notifications** (alerts for applications, approvals, rejections)
- ✅ **Monthly Summaries** (automatic calculation)
- ✅ **Activity Logging** (audit trail for all actions)
- ✅ **Dashboard Views** (for staff and team leaders)

## 🗄️ Architecture

### Google Sheets as Database

The system uses **6 sheets** as database tables:

1. **OT_Applications** - All OT submissions and their status
2. **OT_Monthly_Summary** - Aggregated monthly OT data per staff
3. **Staff_Master** - Staff directory with roles and teams
4. **Attendance_Log** - Clock in/out records for rest gap validation
5. **Public_Holidays** - Public holiday calendar
6. **Activity_Log** - System activity audit trail

### Code Structure

```
OTMS-ITOS/
├── Code.gs              # Setup script and sheet creation
├── Config.gs            # Configuration and spreadsheet connection
├── Utils.gs             # Helper functions (date/time, validation)
├── DataAccess.gs        # Database CRUD operations
├── BusinessLogic.gs     # Core OT calculations and validations
├── OTApplication.gs     # OT submission, approval, rejection
├── ActivityLog.gs       # Activity logging functions
├── Notifications.gs     # Email notification templates
└── README.md           # This file
```

## 🛠️ Setup Instructions

### Step 1: Create a New Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it: **"OT Management System"**
4. Copy the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID_HERE/edit
   ```

### Step 2: Open Apps Script Editor

1. In your spreadsheet, click **Extensions > Apps Script**
2. This will open the Apps Script editor

### Step 3: Copy All Code Files

1. Delete the default `Code.gs` content
2. Create all the script files and copy their content:
   - `Code.gs`
   - `Config.gs`
   - `Utils.gs`
   - `DataAccess.gs`
   - `BusinessLogic.gs`
   - `OTApplication.gs`
   - `ActivityLog.gs`
   - `Notifications.gs`

### Step 4: Update Configuration

1. Open `Config.gs`
2. Find this line:
   ```javascript
   SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',
   ```
3. Replace `YOUR_SPREADSHEET_ID_HERE` with your actual Spreadsheet ID

### Step 5: Run Initial Setup

1. In Apps Script editor, select the `setupOTManagementSystem` function
2. Click **Run** (▶️ button)
3. **Grant permissions** when prompted:
   - Click "Review Permissions"
   - Choose your Google account
   - Click "Advanced" > "Go to OT Management System (unsafe)"
   - Click "Allow"
4. Wait for setup to complete (creates all 6 sheets with headers)
5. You'll see a success dialog

### Step 6: Verify Setup

1. Go back to your spreadsheet
2. You should see 6 new sheets:
   - OT_Applications
   - OT_Monthly_Summary
   - Staff_Master
   - Attendance_Log
   - Public_Holidays
   - Activity_Log

### Step 7: Populate Master Data

1. **Staff_Master**: Add your staff members
   - Sample data is already included
   - Update with actual staff names, emails, teams, roles

2. **Public_Holidays**: Add public holidays
   - Sample Malaysia holidays for 2024-2025 are included
   - Update with your country/region holidays

3. **Attendance_Log**: Import attendance records
   - Required for rest gap validation
   - Import from your attendance system

## 📊 Usage Guide

### Custom Menu

After setup, you'll see an **"OT Management"** menu in your spreadsheet:

- **⚙️ Setup System** - Run initial setup (one-time)
- **📊 Open Dashboard** - View staff/team leader dashboard
- **📝 New OT Application** - Submit new OT application
- **🔄 Recalculate All Summaries** - Refresh monthly summaries
- **📧 Test Email Notification** - Test email system
- **📖 View Documentation** - System documentation

### For Staff Members

#### Submit OT Application

```javascript
// Example: Submit OT application
const formData = {
  otDate: new Date('2024-12-15'),
  startTime: '18:00:00',
  endTime: '22:00:00',
  claimType: 'Money' // or 'Leave'
};

const result = submitOTApplication(formData, 'staff@company.com');
// Returns: {success: true, applicationId: '...', message: '...', warnings: [...]}
```

#### View Dashboard

```javascript
const dashboard = getStaffOTDashboard('staff@company.com');
// Returns current month summary, applications, limits
```

### For Team Leaders

#### Approve OT Application

```javascript
const result = approveOTApplication(
  'application-id',
  'teamlead@company.com',
  'Approved for urgent work'
);
```

#### Reject OT Application

```javascript
const result = rejectOTApplication(
  'application-id',
  'teamlead@company.com',
  'Insufficient proof provided'
);
```

#### View Pending Applications

```javascript
const dashboard = getTeamLeaderDashboard('teamlead@company.com');
// Returns pending applications, team summaries
```

## ⚙️ Configuration

### OT Limits (in `Config.gs`)

```javascript
LIMITS: {
  MAX_OT_HOURS: 104,              // Maximum OT hours per month
  WARNING_THRESHOLD: 90,          // Warning threshold (amber status)
  MAX_HOURS_PER_SESSION: 12,     // Maximum hours in single session
  MIN_REST_GAP_HOURS: 4,         // Minimum rest period
  MAX_FUTURE_DAYS: 7             // Max days in advance to apply
}
```

### Leave Conversion

```javascript
CLAIM_CONVERSION: {
  HOURS_PER_LEAVE_DAY: 6,        // 6 OT hours = 1 leave day
  PUBLIC_HOLIDAY_MULTIPLIER: 2   // Public holiday OT counted at 2x
}
```

### Email Notifications

```javascript
EMAIL: {
  ENABLED: true,                  // Enable/disable emails
  SENDER_NAME: 'OT Management System',
  SUBJECT_PREFIX: '[OT System]'
}
```

## 🧪 Testing Functions

### Test Spreadsheet Connection

```javascript
testSpreadsheetConnection()
// Verifies spreadsheet connection and displays info
```

### Test Utility Functions

```javascript
testUtilityFunctions()
// Tests date/time parsing, holiday checks, calculations
```

### Test Data Access

```javascript
testDataAccess()
// Tests reading/writing to sheets
```

### Test Business Logic

```javascript
testBusinessLogic()
// Tests OT calculations, validations, limit checks
```

### Test Email Notification

```javascript
testEmailNotification()
// Sends test email to your account
```

## 📈 Business Rules

### OT Application Validation

1. **Date Validation**
   - Cannot be more than 7 days in the future
   - Must be in current or previous month

2. **Time Validation**
   - End time must be after start time
   - Maximum 12 hours per session

3. **Rest Gap Validation**
   - Minimum 4 hours rest between last clock-out and OT start
   - Checks Attendance_Log for last clock-out record

4. **Monthly Limit Check**
   - Maximum 104 hours per month
   - Warning at 90 hours (amber status)
   - Blocks submission if would exceed limit

5. **Duplicate Check**
   - Cannot submit overlapping OT times for same date
   - Checks against existing applications

6. **Public Holiday Detection**
   - Auto-detects from Public_Holidays sheet
   - Applies 2x multiplier

### Approval Workflow

1. Staff submits OT application
2. System validates all rules
3. Status set to "Pending"
4. Team Leader receives email notification
5. Team Leader approves/rejects
6. Staff receives email notification
7. Monthly summary updated automatically

### Monthly Summary Calculation

- Runs automatically after each approval/rejection
- Aggregates all approved OT hours for the month
- Separates money vs leave claims
- Calculates leave days earned (6 hours = 1 day)
- Sets status: Green (0-89h), Amber (90-103h), Red (104h+)

## 🔐 Security & Permissions

### Required Permissions

- **Google Sheets**: Read/write access to spreadsheet
- **Gmail**: Send emails as you
- **Google Drive**: Create folders and upload files

### Data Access Control

- Staff can only see their own applications
- Team Leaders can only see their team's applications
- Role validation on all approval/rejection actions

## 🐛 Troubleshooting

### Error: "Cannot access any spreadsheet"

**Solution**: Update `SPREADSHEET_ID` in `Config.gs`

### Error: "Staff not found"

**Solution**: Add staff to `Staff_Master` sheet

### No email notifications

**Solution**: 
1. Check `CONFIG.EMAIL.ENABLED = true`
2. Verify email addresses are valid
3. Run `testEmailNotification()` to debug

### Rest gap validation failing

**Solution**: Import attendance records to `Attendance_Log` sheet

### Public holidays not detected

**Solution**: Add holidays to `Public_Holidays` sheet with correct date format

## 📝 Logging & Debugging

### View Logs

1. In Apps Script editor: **View > Logs** or **View > Executions**
2. All functions log their operations with ✓/✗ indicators

### Activity Audit Trail

All actions are logged to `Activity_Log` sheet:
- User who performed action
- Action type
- Timestamp
- Related application ID

```javascript
// View recent activity
const logs = getRecentActivityLogs(50);

// View activity for specific application
const appLogs = getApplicationActivityLogs('application-id');
```

## 🚀 Advanced Features

### Bulk Operations

```javascript
// Recalculate all monthly summaries
recalculateAllMonthlySummaries('2024-12');

// Send monthly summaries to all staff
sendBulkMonthlySummaries('2024-12');
```

### Activity Reports

```javascript
// Generate activity report for date range
const report = generateActivityReport(
  new Date('2024-12-01'),
  new Date('2024-12-31')
);
```

### Cleanup Old Logs

```javascript
// Delete activity logs older than 365 days
cleanupOldActivityLogs(365);
```

## 📚 API Reference

### Main Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `submitOTApplication(formData, staffEmail)` | Submit OT application | Form data, staff email | Success/error object |
| `approveOTApplication(appId, approverEmail, remarks)` | Approve OT | Application ID, approver email, remarks | Success/error object |
| `rejectOTApplication(appId, approverEmail, remarks)` | Reject OT | Application ID, approver email, remarks | Success/error object |
| `getStaffOTDashboard(staffEmail)` | Get staff dashboard | Staff email | Dashboard data |
| `getTeamLeaderDashboard(teamLeaderEmail)` | Get TL dashboard | Team leader email | Dashboard data |
| `calculateMonthlySummary(staffEmail, monthYear)` | Calculate summary | Staff email, month | Summary object |

## 🤝 Support

For issues or questions:
1. Check logs: `View > Logs` in Apps Script editor
2. Verify configuration in `Config.gs`
3. Run test functions to diagnose issues
4. Check `Activity_Log` sheet for audit trail

## 📄 License

Internal use only. All rights reserved.

## 🎯 Roadmap

- [ ] Web-based UI (HTML/JavaScript frontend)
- [ ] Mobile-responsive interface
- [ ] Report exports (PDF/Excel)
- [ ] Advanced analytics dashboard
- [ ] Integration with HR systems
- [ ] Automated monthly report emails
- [ ] Multi-language support

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-11  
**Built with**: Google Apps Script + Google Sheets

