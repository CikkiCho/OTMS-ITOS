# 📱 WEB APP QUICK REFERENCE

## 🌐 Access URLs

### Main Dashboard
```
https://script.google.com/macros/s/[YOUR_DEPLOYMENT_ID]/exec
```

### Direct Page Access
```
?page=dashboard         # Main dashboard (role-based)
?page=apply            # Submit OT application
?page=history          # View application history
?page=tl-dashboard     # Team leader dashboard
?page=approval-queue   # Approval queue
?page=team-summary     # Team summary
```

---

## 👤 USER ROLES & FEATURES

### 📋 STAFF
**Dashboard**: `StaffDashboard.html`
- View OT hours (current month)
- View money claim amount
- View leave days earned
- Progress bar (0-104h limit)
- Recent applications (latest 5)
- Application status counts

**Actions**:
- Submit new OT application
- View application history
- Export history to CSV

### 👔 TEAM LEADER
**Dashboard**: `TeamLeaderDashboard.html`
- View pending approvals count
- View team total OT hours
- View approved/rejected counts
- View team member count
- Quick review pending applications
- Team member OT summary

**Actions**:
- Approve/reject applications
- Bulk approve multiple applications
- Add remarks to approvals/rejections
- View team member details
- Export team reports

### 💼 MANAGEMENT
**Dashboard**: `ManagementDashboard.html`
- Organization-wide OT metrics
- Total OT hours and costs
- Department/team breakdown
- Top 10 staff by OT hours
- Recent activity log
- Budget tracking

**Actions**:
- View comprehensive analytics
- Export management reports
- Monitor approval workflows

---

## ⌨️ KEYBOARD SHORTCUTS

| Action | Shortcut |
|--------|----------|
| Open Dashboard | Menu > OT System > Open Web Dashboard |
| Submit Application | Menu > OT System > Submit OT Application |
| Refresh Page | F5 or Ctrl+R |
| Open Console (Debug) | F12 |
| Close Modal | ESC |

---

## 🎨 STATUS COLORS

### Application Status
| Status | Color | Badge |
|--------|-------|-------|
| Pending | 🟡 Amber (#FF9800) | PENDING |
| Approved | 🟢 Green (#4CAF50) | APPROVED |
| Rejected | 🔴 Red (#F44336) | REJECTED |
| Draft | ⚪ Gray (#9E9E9E) | DRAFT |

### OT Limit Progress
| Range | Color | Status |
|-------|-------|--------|
| 0-70h (0-67%) | 🟢 Green | Safe |
| 70-90h (67-86%) | 🟡 Amber | Warning |
| 90-104h (86-100%) | 🔴 Red | Critical |
| >104h | 🔴 Red | Exceeded |

---

## 📝 FORM VALIDATION RULES

### OT Application Form

#### Required Fields
- ✅ OT Date (cannot be future date)
- ✅ Start Time
- ✅ End Time
- ✅ Claim Type (Money/Leave)

#### Business Rules
- ⏰ Minimum duration: 1 hour
- ⏰ Maximum daily: 12 hours
- ⏰ Rest gap: 4 hours minimum before next shift
- 📅 Monthly limit: 104 hours maximum
- ⚠️ Warning threshold: 90 hours
- 🎉 Public holiday: 2x multiplier
- 💰 Leave conversion: 6 hours = 1 leave day

#### Auto-Validations
- Public holiday detection (shows ⭐ PH badge)
- Monthly limit checking (shows remaining hours)
- Real-time hours calculation
- Color-coded warnings (green/amber/red)

---

## 🔔 NOTIFICATION TRIGGERS

### Email Notifications Sent When:
1. **Application Submitted** → Team Leader receives notification
2. **Application Approved** → Staff receives approval email
3. **Application Rejected** → Staff receives rejection email with remarks
4. **Approaching Limit** → Staff receives warning at 90h
5. **Limit Exceeded** → Admin receives alert

---

## 📊 EXPORT OPTIONS

### CSV Exports Available
- Application History (staff view)
- Pending Applications (team leader view)
- Team Summary (team leader view)
- Management Reports (management view)

### Export Format
```csv
Application ID,OT Date,Start Time,End Time,Hours,Status,...
OT-2025-11-001,2025-11-01,18:00,22:00,4,Approved,...
```

---

## 🔍 SEARCH & FILTER

### Application History
- **Month Filter**: Select specific month
- **Status Filter**: All/Pending/Approved/Rejected/Draft
- **Claim Filter**: All/Money/Leave

### Approval Queue
- **Staff Filter**: View specific staff member
- **Month Filter**: View specific month
- **Warning Filter**: All/With Warnings/No Warnings

### Team Summary
- **Sort Options**:
  - Staff Name (A-Z)
  - OT Hours (High to Low / Low to High)
  - Limit Progress (%)
  - Pending Count

---

## ⚠️ WARNING MESSAGES

### System Warnings
| Warning | Meaning | Action |
|---------|---------|--------|
| "Monthly limit exceeded" | Staff over 104h | Cannot approve |
| "Nearing monthly limit" | Staff at 90h+ | Review carefully |
| "Rest gap < 4 hours" | Violation of rest rules | Consider rejecting |
| "Public Holiday detected" | 2x multiplier applied | Verify attendance |

### Error Messages
| Error | Meaning | Solution |
|-------|---------|----------|
| "Access Denied" | User not in Staff Master | Contact HR/Admin |
| "Invalid date" | Date format wrong | Use date picker |
| "Cannot submit" | Validation failed | Check error details |
| "Network error" | Connection issue | Retry or refresh |

---

## 🛠️ BROWSER COMPATIBILITY

### Supported Browsers
- ✅ Google Chrome (recommended)
- ✅ Mozilla Firefox
- ✅ Microsoft Edge
- ✅ Safari (iOS/macOS)
- ⚠️ Internet Explorer (not recommended)

### Required Settings
- JavaScript: **Enabled**
- Cookies: **Enabled**
- Pop-ups: **Allow** (for opening web app)

---

## 📱 MOBILE RESPONSIVENESS

### Mobile View (≤ 768px)
- Single column layout
- Stacked cards
- Hamburger menu (if implemented)
- Touch-friendly buttons
- Simplified tables (scrollable)

### Desktop View (> 768px)
- Multi-column grid
- Side-by-side cards
- Full navigation bar
- Larger data tables
- Hover effects

---

## 🔐 SECURITY NOTES

### Access Control
- Users must be logged into Google account
- Email must be in Staff Master sheet
- Role determines accessible pages
- API calls check user permissions

### Data Privacy
- Application data visible only to:
  - Staff member (own applications)
  - Team leader (team applications)
  - Management (all applications)
- No data shared outside organization

### Session Management
- Auto-login via Google account
- Session persists until logout
- No password required (SSO)

---

## 🆘 QUICK TROUBLESHOOTING

### "Page Not Loading"
1. Check internet connection
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try incognito/private mode
4. Check browser console for errors (F12)

### "Data Not Showing"
1. Click refresh button
2. Verify you're on correct month
3. Check if filters are applied
4. Reload page (F5)

### "Cannot Submit Application"
1. Check all required fields filled
2. Review validation errors
3. Verify dates are correct
4. Check if monthly limit reached

### "Email Not Received"
1. Check spam/junk folder
2. Verify email in Staff Master
3. Check Apps Script email quota
4. Contact admin

---

## 📞 CONTACT INFO

### For Issues
- **Technical Support**: [Admin Email from CONFIG]
- **HR/Staff Master**: [HR Contact]
- **System Admin**: [Your Email]

### Escalation Path
1. Check this guide first
2. Try troubleshooting steps
3. Contact your team leader
4. Contact system admin

---

## 📚 RELATED DOCUMENTATION

- **README.md** - System overview and architecture
- **QUICK_START.md** - Initial setup guide
- **DEPLOYMENT.md** - Backend deployment steps
- **WEB_APP_GUIDE.md** - Detailed web app guide
- **PROJECT_SUMMARY.md** - Complete project documentation

---

## ✨ TIPS & TRICKS

### For Staff
- 💡 Submit OT applications promptly (don't wait until month-end)
- 💡 Add notes/remarks for clarity
- 💡 Check public holiday calendar before submitting
- 💡 Monitor your monthly limit progress bar

### For Team Leaders
- 💡 Review applications daily to avoid backlog
- 💡 Use bulk approve for multiple valid applications
- 💡 Add meaningful remarks for rejections
- 💡 Export team reports for record-keeping

### For Management
- 💡 Monitor pending approvals regularly
- 💡 Review staff exceeding limits
- 💡 Track department comparisons
- 💡 Export monthly reports for finance

---

## 🎯 BEST PRACTICES

1. **Submit Early**: Don't wait until last day of month
2. **Be Accurate**: Double-check times and dates
3. **Add Context**: Include notes explaining OT reason
4. **Review Warnings**: Don't ignore system warnings
5. **Keep Records**: Export your history monthly
6. **Timely Approval**: TLs should approve within 48 hours
7. **Clear Remarks**: Provide clear reasons for rejection
8. **Monitor Trends**: Review monthly summaries

---

**Version**: 1.0.0  
**Last Updated**: November 11, 2025  
**System**: OT Management System Web Application
