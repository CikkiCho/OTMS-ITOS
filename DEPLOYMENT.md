# 🚀 DEPLOYMENT INSTRUCTIONS

## 📦 What You Have

Your **OT Management System** is now complete with:

### Code Files (8 files)
1. ✅ **Code.gs** - Setup script and sheet creation
2. ✅ **Config.gs** - Configuration and connection
3. ✅ **Utils.gs** - Helper utilities
4. ✅ **DataAccess.gs** - Database operations
5. ✅ **BusinessLogic.gs** - Core calculations
6. ✅ **OTApplication.gs** - OT submission & approval
7. ✅ **ActivityLog.gs** - Activity logging
8. ✅ **Notifications.gs** - Email notifications

### Documentation (3 files)
1. ✅ **README.md** - Complete documentation
2. ✅ **QUICK_START.md** - Quick setup guide
3. ✅ **PROJECT_SUMMARY.md** - Project overview

---

## 🎯 Deployment Steps

### Step 1: Create Google Spreadsheet

1. Go to https://sheets.google.com
2. Click **+ Blank** to create new spreadsheet
3. Rename it: **"OT Management System"**
4. Copy the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/COPY_THIS_PART/edit
   ```

### Step 2: Open Apps Script Editor

1. In your spreadsheet: **Extensions > Apps Script**
2. This opens the Apps Script editor in a new tab

### Step 3: Copy Code Files

1. **Delete** the default `Code.gs` content
2. For each `.gs` file in this project:
   - In Apps Script editor, click **+** next to Files
   - Select **Script**
   - Name it exactly as shown (e.g., `Config`, `Utils`)
   - Copy and paste the entire content from the file

**Files to create** (in this order):
```
1. Code        (from Code.gs)
2. Config      (from Config.gs)
3. Utils       (from Utils.gs)
4. DataAccess  (from DataAccess.gs)
5. BusinessLogic (from BusinessLogic.gs)
6. OTApplication (from OTApplication.gs)
7. ActivityLog (from ActivityLog.gs)
8. Notifications (from Notifications.gs)
```

### Step 4: Update Configuration

1. Open the `Config` file
2. Find line 22:
   ```javascript
   SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',
   ```
3. Replace `YOUR_SPREADSHEET_ID_HERE` with your actual Spreadsheet ID
4. Save: **Ctrl+S** or **File > Save**

### Step 5: Grant Permissions

1. In Apps Script editor, at the top:
   - Select function: `setupOTManagementSystem`
   - Click **Run** (▶️ button)
2. **Authorization Required** dialog appears:
   - Click **Review permissions**
3. Choose your Google account
4. You'll see "Google hasn't verified this app":
   - Click **Advanced**
   - Click **Go to OT Management System (unsafe)**
   - Click **Allow**

**Permissions needed:**
- ✅ View and manage spreadsheets
- ✅ Send email as you
- ✅ Manage files in Google Drive

### Step 6: Run Setup

1. After granting permissions, click **Run** again
2. Watch the **Execution log** (bottom of screen)
3. Wait for completion (~30 seconds)
4. You'll see a success dialog in the spreadsheet

### Step 7: Verify Setup

1. Go back to your spreadsheet
2. **Refresh the page** (F5)
3. You should see **6 new sheets**:
   - 🔵 OT_Applications
   - 🟢 OT_Monthly_Summary
   - 🟡 Staff_Master
   - 🔴 Attendance_Log
   - 🟣 Public_Holidays
   - ⚫ Activity_Log
4. You should see a new menu: **OT Management**

### Step 8: Test Connection

1. In spreadsheet, click **OT Management > View Documentation**
2. If documentation shows, connection is working ✅
3. In Apps Script, run: `testSpreadsheetConnection()`
4. Check execution log for "✓ Connection successful!"

### Step 9: Populate Master Data

#### Staff_Master Sheet
1. Open the **Staff_Master** tab
2. Delete sample data (rows 2-4)
3. Add your actual staff:
   ```
   | StaffName    | Email              | Team       | Role        | TeamLeaderEmail    | Status |
   |--------------|-------------------|------------|-------------|-------------------|---------|
   | John Doe     | john@company.com   | Operations | Staff       | lead@company.com   | Active  |
   | Jane Smith   | jane@company.com   | Operations | Staff       | lead@company.com   | Active  |
   | Team Lead    | lead@company.com   | Operations | Team Leader | manager@company.com| Active  |
   ```

#### Public_Holidays Sheet
1. Open the **Public_Holidays** tab
2. Sample holidays for Malaysia 2024-2025 are included
3. Update with your country's holidays:
   ```
   | Date       | HolidayName      | Year | Region   |
   |------------|------------------|------|----------|
   | 2025-01-01 | New Year's Day   | 2025 | National |
   | 2025-12-25 | Christmas        | 2025 | National |
   ```

#### Attendance_Log Sheet
1. Open the **Attendance_Log** tab
2. Delete sample data
3. Import your attendance data (if available)
4. Format: `StaffEmail | Date | ClockIn | ClockOut | DurationHours | ShiftType | Notes`

### Step 10: Test Email Notifications

1. In spreadsheet: **OT Management > Test Email Notification**
2. Check your email inbox
3. You should receive a test approval notification
4. If email arrives: ✅ Email system working!

---

## ✅ Post-Deployment Checklist

### Immediate
- [ ] Spreadsheet created
- [ ] All 8 code files copied
- [ ] Spreadsheet ID updated
- [ ] Permissions granted
- [ ] Setup script executed successfully
- [ ] 6 sheets created
- [ ] Custom menu appears
- [ ] Connection test passed
- [ ] Staff data populated
- [ ] Holidays populated
- [ ] Test email received

### Optional
- [ ] Attendance data imported
- [ ] Email settings configured
- [ ] OT limits adjusted (if needed)
- [ ] Timezone verified
- [ ] Drive folder for proofs created

---

## 🧪 Testing Workflow

### Test 1: Submit OT Application

1. In Apps Script editor, run this test:
   ```javascript
   function testSubmitOT() {
     const result = submitOTApplication({
       otDate: new Date(),
       startTime: '18:00:00',
       endTime: '22:00:00',
       claimType: 'Money'
     }, 'john@company.com'); // Use your staff email
     
     Logger.log(JSON.stringify(result));
   }
   ```

2. Check **OT_Applications** sheet for new row
3. Check **Activity_Log** sheet for log entry

### Test 2: Approve Application

1. Copy the Application ID from OT_Applications sheet
2. Run this test:
   ```javascript
   function testApproveOT() {
     const result = approveOTApplication(
       'APPLICATION_ID_HERE',
       'lead@company.com', // Team Leader email
       'Approved for testing'
     );
     
     Logger.log(JSON.stringify(result));
   }
   ```

3. Check OT_Applications sheet - Status should be "Approved"
4. Check OT_Monthly_Summary sheet - Summary should be updated

### Test 3: View Dashboard

1. Run this test:
   ```javascript
   function testDashboard() {
     const dashboard = getStaffOTDashboard('john@company.com');
     Logger.log(JSON.stringify(dashboard, null, 2));
   }
   ```

2. Check execution log for dashboard data

---

## 🎓 Training Your Team

### For Staff

**How to check OT status:**
1. Open the spreadsheet
2. Go to **OT_Applications** sheet
3. Find your applications by email
4. Check Status column (Pending/Approved/Rejected)

**Current limitations (Phase 1):**
- No web interface yet (Phase 2)
- Submit via spreadsheet or programmatically
- View data directly in sheets

### For Team Leaders

**How to approve OT:**
1. Check email for new OT notifications
2. Open spreadsheet > **OT_Applications** sheet
3. Filter by Team and Status = "Pending"
4. Note the Application ID
5. Use Apps Script to approve/reject

**Quick approval script:**
```javascript
function quickApprove() {
  const appId = 'PASTE_APPLICATION_ID_HERE';
  const result = approveOTApplication(
    appId,
    Session.getActiveUser().getEmail(),
    'Approved'
  );
  Logger.log(result.message);
}
```

### For Admins

**Monthly tasks:**
1. Run: `recalculateAllMonthlySummaries()`
2. Review Activity_Log for issues
3. Update Public_Holidays for next year
4. Send monthly reports: `sendBulkMonthlySummaries()`

---

## 🔧 Troubleshooting

### Issue: "Cannot access any spreadsheet"
**Fix:** Update `SPREADSHEET_ID` in Config.gs file

### Issue: "Staff not found"
**Fix:** Add staff to Staff_Master sheet

### Issue: No email notifications
**Fix:** 
1. Check `CONFIG.EMAIL.ENABLED = true`
2. Run `testEmailNotification()`
3. Check spam folder

### Issue: Rest gap validation failing
**Fix:** Import attendance data to Attendance_Log sheet

### Issue: Public holidays not detected
**Fix:** Add holidays to Public_Holidays sheet (correct date format)

### Issue: Permission denied
**Fix:** Re-run authorization from Apps Script editor

---

## 📊 Monitoring

### Check System Health

1. **Activity Log**: Review for errors
   ```javascript
   getRecentActivityLogs(50)
   ```

2. **Error Count**: Check for SYSTEM_ERROR actions
   ```javascript
   generateActivityReport(startDate, endDate)
   ```

3. **Email Delivery**: Test regularly
   ```javascript
   testEmailNotification()
   ```

### Performance Metrics

- Applications submitted today
- Pending approvals count
- Average approval time
- Monthly OT trend

---

## 🎉 You're Ready!

Your OT Management System is now **fully deployed and operational**!

### What You Can Do Now

✅ Staff can submit OT applications  
✅ System validates all rules automatically  
✅ Team Leaders receive email alerts  
✅ Approvals/rejections tracked  
✅ Monthly summaries calculated  
✅ Activity logged for audit  

### Next Steps (Optional)

1. **Phase 2**: Build web interface (HTML/JS)
2. **Phase 3**: Advanced reporting and analytics
3. **Integration**: Connect with HR systems
4. **Mobile**: Create mobile-friendly interface

---

## 📞 Support

### Quick Fixes
1. Check execution logs: **View > Logs**
2. Run test functions
3. Review Activity_Log sheet
4. Check CONFIG settings

### Documentation
- **README.md** - Complete documentation
- **QUICK_START.md** - Quick reference
- **PROJECT_SUMMARY.md** - System overview

---

## 🏆 Success!

**Congratulations! Your OT Management System is live!** 🎊

Built with ❤️ using Google Apps Script  
Version 1.0.0 | 2025-11-11

