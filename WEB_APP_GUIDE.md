# 🚀 WEB APPLICATION DEPLOYMENT GUIDE

## Overview
The OT Management System now includes a complete web-based interface built with HTML, CSS, and JavaScript that runs on Google Apps Script.

## 📁 Web Application Files

### Core Files
1. **WebApp.gs** - Main router and API endpoints
2. **Styles.html** - Common CSS stylesheet
3. **Scripts.html** - Common JavaScript utilities

### Staff Interface
4. **StaffDashboard.html** - Main dashboard for staff members
5. **OTApplicationForm.html** - Form to submit OT applications
6. **ApplicationHistory.html** - View all submitted applications

### Team Leader Interface
7. **TeamLeaderDashboard.html** - Main dashboard for team leaders
8. **ApprovalQueue.html** - Review and approve/reject applications
9. **TeamSummary.html** - View team member OT summaries

### Management Interface
10. **ManagementDashboard.html** - High-level overview and analytics

### Error Pages
11. **Unauthorized.html** - Access denied page
12. **Error.html** - General error page

---

## 🔧 DEPLOYMENT STEPS

### Step 1: Upload Files to Apps Script

1. **Open Google Sheets** with your OT Management System
2. **Go to Extensions > Apps Script**
3. **Upload all .gs files** (if not already present):
   - Code.gs
   - Config.gs
   - Utils.gs
   - DataAccess.gs
   - BusinessLogic.gs
   - OTApplication.gs
   - ActivityLog.gs
   - Notifications.gs
   - **WebApp.gs** (new)

4. **Add HTML files** by clicking the "+" icon next to "Files":
   - Click "+" > "HTML"
   - For each HTML file, create a new file with the exact name
   - Copy and paste the content from each HTML file

### Step 2: Deploy as Web App

1. In Apps Script editor, click **Deploy > New deployment**
2. Click the **gear icon** ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure deployment:
   - **Description**: "OT Management System v1.0"
   - **Execute as**: **Me** (your account)
   - **Who has access**: **Anyone within [Your Organization]**
   
   ⚠️ **Important**: Using "Me" ensures the script runs with your permissions
   
5. Click **Deploy**
6. **Authorize** the application:
   - Click "Authorize access"
   - Select your Google account
   - Click "Advanced" > "Go to [Your Project]"
   - Click "Allow"
   
7. **Copy the Web App URL** - you'll need this!
   - Example: `https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec`

### Step 3: Update Spreadsheet Menu

The custom menu in Code.gs already includes functions to open the dashboard. Make sure these lines are present in `onOpen()`:

```javascript
.addItem('📊 Open Web Dashboard', 'openDashboard')
.addItem('📝 Submit OT Application', 'openOTApplicationForm')
```

### Step 4: Test the Deployment

1. **Refresh your Google Sheet**
2. Click **OT System > 📊 Open Web Dashboard**
3. The web app should open in a new tab
4. You should see your dashboard based on your role (Staff/Team Leader/Management)

---

## 🎨 WEB APP FEATURES

### Staff Members Can:
- ✅ View OT summary dashboard with stats and progress
- ✅ Submit new OT applications with validation
- ✅ Check public holiday automatically
- ✅ Calculate OT hours with 2x multiplier for holidays
- ✅ View application history with filters
- ✅ Export history to CSV
- ✅ See real-time warnings if approaching 104h limit

### Team Leaders Can:
- ✅ View team dashboard with pending approvals
- ✅ Review applications with detailed information
- ✅ Approve/reject applications with remarks
- ✅ Bulk approve multiple applications
- ✅ View team member OT summaries
- ✅ Filter and sort applications
- ✅ Export reports to CSV
- ✅ See warnings for limit violations

### Management Can:
- ✅ View organization-wide OT metrics
- ✅ See department/team breakdowns
- ✅ View top staff by OT hours
- ✅ Monitor pending approvals
- ✅ Track OT costs and budget
- ✅ View recent activity log
- ✅ Export management reports

---

## 🔐 SECURITY & ACCESS CONTROL

### Role-Based Access
The system automatically routes users based on their role in the Staff Master sheet:

- **Staff** → Staff Dashboard
- **Team Leader** → Team Leader Dashboard
- **Management** → Management Dashboard

### Access Requirements
Users must:
1. Be logged into their Google account
2. Have their email registered in the **Staff_Master** sheet
3. Be part of your organization (if deployed with org restrictions)

### Unauthorized Access
If a user is not found in Staff Master:
- They see the **Unauthorized.html** page
- They're shown instructions to contact HR/admin

---

## 🎯 PAGE ROUTING

### URL Parameters
The web app uses URL parameters for navigation:

- `?page=dashboard` - Main dashboard (role-based)
- `?page=apply` - OT application form
- `?page=history` - Application history
- `?page=tl-dashboard` - Team leader dashboard
- `?page=approval-queue` - Approval queue
- `?page=team-summary` - Team summary

### Navigation
- **Navbar** provides quick links between pages
- **Back buttons** return to dashboard
- **Breadcrumbs** show current location

---

## 📊 API ENDPOINTS

All client-side JavaScript calls backend APIs via `google.script.run`:

| API Function | Purpose |
|-------------|---------|
| `apiGetCurrentUser()` | Get logged-in user info |
| `apiGetStaffDashboard()` | Get staff dashboard data |
| `apiGetTeamLeaderDashboard()` | Get team leader dashboard data |
| `apiGetManagementDashboard()` | Get management dashboard data |
| `apiSubmitOTApplication(formData)` | Submit new OT application |
| `apiApproveApplication(id, remarks)` | Approve application |
| `apiRejectApplication(id, remarks)` | Reject application |
| `apiGetApplication(id)` | Get application details |
| `apiGetPendingApplications()` | Get pending approvals |
| `apiGetApplicationHistory(month)` | Get application history |
| `apiCheckPublicHoliday(date)` | Check if date is holiday |
| `apiValidateOTApplication(formData)` | Validate before submission |
| `apiGetTeamMembers()` | Get team members |
| `apiGetMonthlySummary(monthYear)` | Get monthly summary |

---

## 🎨 DESIGN SYSTEM

### Color Scheme
- **Primary Blue**: `#4285F4` (Actions, headers)
- **Success Green**: `#4CAF50` (Approved, safe status)
- **Warning Amber**: `#FF9800` (Pending, warnings)
- **Danger Red**: `#F44336` (Rejected, errors)
- **Purple**: `#9C27B0` (Public holidays, special)

### Status Badges
- **Pending**: 🟡 Yellow/Amber
- **Approved**: 🟢 Green
- **Rejected**: 🔴 Red
- **Draft**: ⚪ Gray

### Progress Bar Colors
- **Green** (< 70%): Safe zone
- **Amber** (70-90%): Warning zone
- **Red** (> 90%): Critical zone

### Responsive Breakpoints
- **Desktop**: > 768px (full grid layout)
- **Mobile**: ≤ 768px (stacked layout)

---

## 🧪 TESTING CHECKLIST

### Before Going Live

#### Staff Role Testing
- [ ] Can view dashboard with correct stats
- [ ] Can submit OT application
- [ ] Public holiday detection works
- [ ] Hours calculation is correct (including 2x multiplier)
- [ ] Monthly limit validation works
- [ ] Can view application history
- [ ] Export to CSV works

#### Team Leader Role Testing
- [ ] Can view team dashboard
- [ ] Pending count is accurate
- [ ] Can review applications
- [ ] Can approve applications (email sent)
- [ ] Can reject applications with remarks
- [ ] Bulk approve works
- [ ] Team summary displays correctly
- [ ] Filters work correctly

#### Management Role Testing
- [ ] Can view management dashboard
- [ ] Metrics are accurate
- [ ] Department breakdown is correct
- [ ] Top staff list is sorted correctly
- [ ] Recent activity shows up

#### Error Handling
- [ ] Unauthorized users see proper error page
- [ ] Invalid data shows validation errors
- [ ] Network errors are handled gracefully
- [ ] Loading states appear during API calls

---

## 🐛 TROUBLESHOOTING

### Common Issues

#### 1. "Access Denied" Error
**Problem**: User sees unauthorized page even though they're in Staff Master

**Solutions**:
- Check if email in Staff Master matches Google account email exactly
- Ensure email column is not empty
- Verify user is using correct Google account
- Re-deploy with correct "Who has access" setting

#### 2. Dashboard Not Loading
**Problem**: Blank page or endless loading

**Solutions**:
- Open browser console (F12) to see JavaScript errors
- Check if all HTML files are uploaded correctly
- Verify API functions exist in backend .gs files
- Check Apps Script execution logs

#### 3. Data Not Updating
**Problem**: Changes in sheets not reflected in web app

**Solutions**:
- Click refresh button in web app
- Clear browser cache
- Check if read-once pattern is working (data cached in memory)
- Verify sheet names match CONFIG constants

#### 4. Approval Emails Not Sending
**Problem**: Notifications not received

**Solutions**:
- Check email addresses in Staff Master
- Verify CONFIG.ADMIN_EMAIL is set
- Check Apps Script quotas (daily email limit)
- Check spam/junk folders

#### 5. Performance Issues
**Problem**: Slow loading or timeouts

**Solutions**:
- Reduce data range if sheets are very large
- Add month filters to limit data fetched
- Check for infinite loops in code
- Optimize large table rendering (paginate)

---

## 📈 FUTURE ENHANCEMENTS

### Potential Features
1. **Charts & Graphs**: Add Google Charts for visual analytics
2. **Bulk Import**: Upload multiple applications via CSV
3. **Mobile App**: Create dedicated mobile interface
4. **Push Notifications**: Browser notifications for approvals
5. **Audit Trail**: Detailed change history
6. **Custom Reports**: Configurable report builder
7. **Budget Tracking**: Set and monitor OT budget
8. **Attendance Integration**: Auto-fill from attendance system
9. **Leave Integration**: Auto-apply leave days
10. **Multi-language**: Support multiple languages

---

## 📞 SUPPORT

### Getting Help
1. **Check Documentation**: README.md, QUICK_START.md
2. **Review Logs**: Extensions > Apps Script > Executions
3. **Test Mode**: Use test functions in Code.gs
4. **Contact Admin**: Email configured in CONFIG.ADMIN_EMAIL

### Reporting Issues
When reporting issues, include:
- User email and role
- Page where error occurred
- Browser console errors (F12)
- Steps to reproduce
- Expected vs actual behavior

---

## 📝 MAINTENANCE

### Regular Tasks
- **Weekly**: Review activity logs for anomalies
- **Monthly**: Archive old application data
- **Quarterly**: Review and update public holidays
- **Annually**: Update OT rates and limits

### Backup Strategy
1. **Sheet Backup**: File > Make a copy (weekly)
2. **Code Backup**: Download all .gs files (before changes)
3. **Version Control**: Use Apps Script versions feature

### Updating the System
1. Make changes in a test copy first
2. Test thoroughly with all roles
3. Document changes in version notes
4. Deploy new version with description
5. Notify users of new features

---

## ✅ POST-DEPLOYMENT CHECKLIST

After deploying, verify:

- [ ] Web app URL is accessible
- [ ] All users can access based on role
- [ ] Navigation between pages works
- [ ] Forms submit successfully
- [ ] Approval workflow completes
- [ ] Emails are sent correctly
- [ ] Calculations are accurate
- [ ] Public holidays are detected
- [ ] Exports work (CSV)
- [ ] Mobile responsive design works
- [ ] Error pages display properly
- [ ] Performance is acceptable

---

## 🎉 YOU'RE READY!

Your OT Management System web application is now complete and ready to deploy!

**Key Points to Remember**:
1. Deploy as Web App with "Execute as: Me"
2. Set access to "Anyone within organization"
3. Test with each role before going live
4. Keep the web app URL handy for sharing
5. Monitor the activity log regularly

**Need Help?**
- Check the documentation files
- Review Apps Script execution logs
- Test with the provided test functions

Good luck with your deployment! 🚀
