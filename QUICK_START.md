# 🎯 OT Management System - Quick Start Guide

## ⚡ 5-Minute Setup

### 1️⃣ Create Spreadsheet
1. Create new Google Spreadsheet
2. Copy the Spreadsheet ID from URL
3. Open **Extensions > Apps Script**

### 2️⃣ Add Code Files
Copy these 8 files to Apps Script:
- ✅ Code.gs
- ✅ Config.gs
- ✅ Utils.gs
- ✅ DataAccess.gs
- ✅ BusinessLogic.gs
- ✅ OTApplication.gs
- ✅ ActivityLog.gs
- ✅ Notifications.gs

### 3️⃣ Configure
Edit `Config.gs`:
```javascript
SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE'
```

### 4️⃣ Run Setup
1. Select function: `setupOTManagementSystem`
2. Click Run ▶️
3. Grant permissions
4. Wait for completion

### 5️⃣ Populate Data
- Add staff to **Staff_Master**
- Add holidays to **Public_Holidays**
- Import attendance to **Attendance_Log**

## 🚀 Common Tasks

### Submit OT Application
```javascript
submitOTApplication({
  otDate: new Date('2024-12-15'),
  startTime: '18:00:00',
  endTime: '22:00:00',
  claimType: 'Money'
}, 'staff@company.com');
```

### Approve Application
```javascript
approveOTApplication(
  'app-id',
  'teamlead@company.com',
  'Approved'
);
```

### View Dashboard
```javascript
getStaffOTDashboard('staff@company.com');
```

## 📊 Key Limits

| Limit | Value |
|-------|-------|
| Max OT per month | 104 hours |
| Warning threshold | 90 hours |
| Max per session | 12 hours |
| Min rest gap | 4 hours |
| Leave conversion | 6h = 1 day |
| Public holiday multiplier | 2x |

## 🎨 Sheet Color Codes

| Sheet | Color | Purpose |
|-------|-------|---------|
| OT_Applications | 🔵 Blue | Main OT records |
| OT_Monthly_Summary | 🟢 Green | Monthly aggregates |
| Staff_Master | 🟡 Yellow | Staff directory |
| Attendance_Log | 🔴 Red | Clock in/out |
| Public_Holidays | 🟣 Purple | Holiday calendar |
| Activity_Log | ⚫ Gray | Audit trail |

## ✅ Status Colors

| Status | Color | Hours |
|--------|-------|-------|
| Green | 🟢 | 0-89 hours |
| Amber | 🟡 | 90-103 hours |
| Red | 🔴 | 104+ hours |

## 📧 Email Notifications

Automatic emails sent for:
- ✉️ New OT application (to Team Leader)
- ✉️ OT approved (to Staff)
- ✉️ OT rejected (to Staff)
- ✉️ Monthly summary (optional)

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| Cannot access spreadsheet | Update SPREADSHEET_ID in Config.gs |
| Staff not found | Add to Staff_Master sheet |
| No emails | Check EMAIL.ENABLED = true |
| Rest gap failing | Add attendance records |
| Holiday not detected | Add to Public_Holidays sheet |

## 🧪 Test Functions

Run these to verify setup:
```javascript
testSpreadsheetConnection()  // Test connection
testUtilityFunctions()       // Test helpers
testDataAccess()            // Test database
testBusinessLogic()         // Test calculations
testEmailNotification()     // Test emails
```

## 📱 Custom Menu

Access via **OT Management** menu:
- ⚙️ Setup System
- 📊 Open Dashboard
- 📝 New OT Application
- 🔄 Recalculate Summaries
- 📧 Test Email
- 📖 Documentation

## 🎯 Validation Rules

### ✅ Auto Checks
- [x] OT date range (current/previous month)
- [x] Time range validation
- [x] Rest gap (min 4 hours)
- [x] Monthly limit (max 104 hours)
- [x] Duplicate detection
- [x] Public holiday detection
- [x] Max session hours (12 hours)

### ⚠️ Warnings (Can Still Submit)
- Rest gap below 4 hours
- Approaching 90-hour threshold

### ❌ Errors (Cannot Submit)
- Exceeds 104-hour limit
- Invalid date/time
- Duplicate OT claim
- Over 12 hours per session

## 📈 Workflow

```
Staff Submits
    ↓
System Validates
    ↓
Status: Pending
    ↓
TL Receives Email
    ↓
TL Approves/Rejects
    ↓
Staff Receives Email
    ↓
Summary Updated
```

## 💡 Pro Tips

1. **Import Attendance Data**: Critical for rest gap validation
2. **Update Holidays Annually**: Add next year's holidays in advance
3. **Monitor Activity Log**: Track all system actions
4. **Test Email First**: Run `testEmailNotification()` before going live
5. **Backup Regularly**: Export sheets or use version history
6. **Check Logs**: View > Logs in Apps Script for debugging
7. **Set Quotas**: Be aware of Google Apps Script limits

## 🔗 Quick Links

- [Google Sheets](https://sheets.google.com)
- [Apps Script Documentation](https://developers.google.com/apps-script)
- [Apps Script Quotas](https://developers.google.com/apps-script/guides/services/quotas)

## 📞 Support Checklist

Before asking for help:
- [ ] Checked logs (View > Logs)
- [ ] Ran test functions
- [ ] Verified CONFIG settings
- [ ] Checked Activity_Log sheet
- [ ] Updated master data (Staff, Holidays)

---

**Need Help?** Check README.md for detailed documentation.

