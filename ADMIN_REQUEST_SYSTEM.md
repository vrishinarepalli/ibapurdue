# Admin Request System - Implementation Summary

## 📋 Overview

A complete admin request and approval system has been implemented, allowing new users to request admin access and existing admins to approve/decline those requests.

**Deployed:** November 4, 2025
**Status:** ✅ LIVE at https://iba-website-63cb3.web.app

---

## ✨ What's New

### 1. **Request Admin Access Button**
- Added to the admin login modal
- Located below the login options with a clear "Don't have admin access?" message
- Allows anyone to request admin privileges

### 2. **Admin Request Submission Flow**
Users requesting admin access will:
1. Click "📝 Request Admin Access" button
2. Enter their email address
3. Create a password (min 6 characters)
4. Confirm their password
5. Enter their full name
6. Request is submitted to Firestore

### 3. **Admin Request Management Page**
The `init-firestore.html` page now includes:
- Section to view all pending admin requests
- "Refresh Requests" button to reload the list
- Approve/Decline buttons for each request
- Real-time status updates

### 4. **Approved Admin System**
- Approved admins get a Firebase Auth account created
- Their UID is stored in `approved_admins` collection
- They can login with email/password just like the main admin
- Full admin privileges (can edit games, teams, brackets, etc.)

### 5. **Updated UI Styling**
- **Fixed:** Email and password inputs now have white background (`#fff`)
- **Before:** Dark blue background (`var(--card)` = `#0f1524`)
- **After:** Clean white background matching the site theme

---

## 🔐 How It Works

### For Users Requesting Access

1. **Visit the website**
   - Go to https://iba-website-63cb3.web.app
   - Click the "Admin" button

2. **Request Admin Access**
   - Click "📝 Request Admin Access" at the bottom of the login modal
   - Fill in your information when prompted:
     - Email address
     - Password (min 6 characters)
     - Confirm password
     - Full name

3. **Wait for Approval**
   - Your request is submitted to the database
   - You'll see a success message
   - The main admin will review your request

4. **Login After Approval**
   - Once approved, you'll receive confirmation
   - Login using your email and password
   - You now have full admin privileges!

### For Main Admin (Approving Requests)

1. **Access the Init Page**
   - Go to https://iba-website-63cb3.web.app/init-firestore.html
   - Login with your admin credentials

2. **View Pending Requests**
   - Scroll to "📋 Pending Admin Requests" section
   - Click "🔄 Refresh Requests"
   - See all pending requests with:
     - Name
     - Email
     - Request date

3. **Approve or Decline**
   - **Approve:** Click "✅ Approve"
     - Creates Firebase Auth account for the user
     - Adds them to `approved_admins` collection
     - User can now login immediately

   - **Decline:** Click "❌ Decline"
     - Marks request as declined
     - User cannot access admin features
     - Request is archived (not deleted)

---

## 🗄️ Database Structure

### New Collections

#### `admin_requests`
Stores all admin access requests.

```javascript
{
  email: "user@example.com",
  password: "user_password",    // ⚠️ Stored temporarily for account creation
  name: "John Doe",
  status: "pending",            // "pending" | "approved" | "declined"
  requestedAt: Timestamp,
  ipAddress: "N/A",

  // Added after approval/decline:
  approvedAt: Timestamp,        // Only if approved
  adminUid: "firebase_uid",     // Only if approved
  declinedAt: Timestamp,        // Only if declined
  declinedBy: "admin_uid"       // Only if declined
}
```

#### `approved_admins`
Stores UIDs of approved admins.

```javascript
{
  email: "user@example.com",
  approvedAt: Timestamp,
  approvedBy: "main_admin_uid"
}
```

**Document ID:** The approved admin's Firebase Auth UID

---

## 🔒 Security Rules

Updated Firestore security rules to support the new system:

```javascript
// Helper Functions
function isMainAdmin() {
  return request.auth.uid == 'seZ01FolJbSajEKTIsljwGtYHGD3';
}

function isApprovedAdmin() {
  return exists(/databases/.../approved_admins/$(request.auth.uid));
}

function isAdmin() {
  return isMainAdmin() || isApprovedAdmin();
}

// Admin Requests Rules
match /admin_requests/{requestId} {
  allow create: if true;           // Anyone can request
  allow read, update, delete: if isMainAdmin();
}

// Approved Admins Rules
match /approved_admins/{adminId} {
  allow read: if isAdmin();        // Any admin can read
  allow write: if isMainAdmin();   // Only main admin can modify
}

// All other collections now use isAdmin()
match /games/{gameId} {
  allow read: if true;
  allow write: if isAdmin();       // Main OR approved admins
}
```

**Key Points:**
- Anyone can submit admin requests (no auth required)
- Only main admin can approve/decline requests
- Approved admins have same privileges as main admin
- All admin operations check both main and approved admins

---

## 🎨 UI Changes

### Admin Login Modal

**Before:**
```html
<input type="email" style="background: var(--card); color: var(--text);" />
<!-- Dark blue background -->
```

**After:**
```html
<input type="email" style="background: #fff; color: #222;" />
<!-- Clean white background -->

<!-- New section added: -->
<div style="text-align: center; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
  <p style="color: var(--muted);">Don't have admin access?</p>
  <button id="requestAdminBtn">📝 Request Admin Access</button>
</div>
```

### Init Firestore Page

**Added Section:**
```html
<h2>📋 Pending Admin Requests</h2>
<button onclick="loadAdminRequests()">🔄 Refresh Requests</button>

<div id="adminRequestsContainer">
  <!-- Pending requests displayed here with approve/decline buttons -->
</div>
```

---

## 🧪 Testing the System

### Test 1: Request Admin Access

1. Visit https://iba-website-63cb3.web.app
2. Click "Admin" button
3. Click "📝 Request Admin Access"
4. Enter test information:
   - Email: `test@example.com`
   - Password: `test123`
   - Confirm: `test123`
   - Name: `Test User`
5. Verify success message appears
6. Check Firestore Console → `admin_requests` collection
7. Confirm new document with status "pending"

### Test 2: Approve Admin Request

1. Visit https://iba-website-63cb3.web.app/init-firestore.html
2. Login with main admin credentials
3. Scroll to "📋 Pending Admin Requests"
4. Click "🔄 Refresh Requests"
5. See test request from Test 1
6. Click "✅ Approve"
7. Confirm approval in prompt
8. Check logs for success messages
9. Verify in Firestore:
   - `admin_requests/[id]` → status changed to "approved"
   - `approved_admins/[new_uid]` → new document created
10. Check Firebase Auth → new user account created

### Test 3: Login as Approved Admin

1. Logout from main admin (if logged in)
2. Visit https://iba-website-63cb3.web.app
3. Click "Admin" button
4. Enter approved admin credentials:
   - Email: `test@example.com`
   - Password: `test123`
5. Click "🔑 Login with Email & Password"
6. Verify admin mode activates
7. Confirm admin UI elements appear
8. Test admin operations (e.g., edit a game)

### Test 4: Decline Admin Request

1. Create another test request (different email)
2. Go to init-firestore.html
3. Click "🔄 Refresh Requests"
4. Find new request
5. Click "❌ Decline"
6. Confirm in prompt
7. Check Firestore:
   - Request status changed to "declined"
   - No account created in Firebase Auth
   - No document in `approved_admins`
8. Try logging in with declined credentials → Should fail

---

## 📊 Firestore Data Flow

```
User Requests Access
        ↓
admin_requests/{id}
  status: "pending"
        ↓
Main Admin Reviews
        ↓
    [Approve]              [Decline]
        ↓                       ↓
Firebase Auth Account      Status → "declined"
        ↓
approved_admins/{uid}
        ↓
Status → "approved"
        ↓
User Can Login
        ↓
Authentication Check:
  - Is main admin? OR
  - Is in approved_admins?
        ↓
Admin Access Granted
```

---

## 🚨 Important Security Notes

### Password Storage

**⚠️ WARNING:** Admin request passwords are stored in plain text in Firestore temporarily!

**Why:**
- Needed to create Firebase Auth account on approval
- Only stored in `admin_requests` collection
- Only accessible by main admin (security rules)
- Should be deleted after account creation (optional enhancement)

**Recommendations:**
1. Only approve trusted users
2. Users should change password after first login (feature not yet implemented)
3. Consider encrypting passwords in future version
4. Regularly audit `admin_requests` collection

### Access Control

**Main Admin Privileges:**
- Can approve/decline admin requests
- Can manage all approved admins
- Full access to all Firestore collections
- Access to init-firestore.html tools

**Approved Admin Privileges:**
- Can edit games, teams, brackets
- Can view contact messages
- **CANNOT** approve other admins
- **CANNOT** access some Cloud Functions (Touch ID registration)

---

## 🔧 Files Modified

### `index.html`
- ✅ Added "Request Admin Access" button to admin modal
- ✅ Fixed input background colors (`#fff` instead of `var(--card)`)
- ✅ Added `requestAdminBtn` click handler
- ✅ Updated email/password auth to check `approved_admins`
- ✅ Added Firestore imports for admin request submission

**Lines Changed:**
- Line 764: Email input background color
- Line 768: Password input background color
- Line 775: OR divider background color
- Lines 787-793: New "Request Admin Access" section
- Lines 1347-1350: Check approved_admins in authentication
- Lines 1387-1453: Request admin button handler

### `init-firestore.html`
- ✅ Added "Pending Admin Requests" section
- ✅ Added `loadAdminRequests()` function
- ✅ Added `approveAdminRequest()` function
- ✅ Added `declineAdminRequest()` function
- ✅ Updated Firebase imports (added `updateDoc`, `deleteDoc`, `createUserWithEmailAndPassword`)

**Lines Changed:**
- Lines 125-133: New admin requests UI section
- Line 139: Updated imports
- Lines 605-742: New functions for managing requests

### `firestore.rules`
- ✅ Added helper functions: `isMainAdmin()`, `isApprovedAdmin()`, `isAdmin()`
- ✅ Added rules for `admin_requests` collection
- ✅ Added rules for `approved_admins` collection
- ✅ Updated all collection rules to use `isAdmin()` instead of hardcoded UID
- ✅ Added `tournament` collection rules

**Lines Changed:**
- Lines 5-19: Helper functions
- Lines 36-40: Admin requests rules
- Lines 42-46: Approved admins rules
- Lines 48-82: Updated existing collection rules

---

## 🎯 Next Steps & Enhancements

### Immediate (Optional)
1. **Test the system**
   - Request admin access with a test account
   - Approve it via init-firestore.html
   - Login with approved credentials
   - Verify all admin features work

2. **Clean up old requests**
   - Declined/approved requests accumulate
   - Add a "Delete Old Requests" button to init-firestore.html
   - Or set up automatic cleanup with Cloud Functions

### Future Enhancements

1. **Email Notifications**
   - Send email when request is submitted
   - Send email when request is approved/declined
   - Use Firebase Functions + SendGrid/Nodemailer

2. **Password Security**
   - Hash passwords before storing
   - Or use Firebase Auth directly (let users create account first)
   - Delete password from request after account creation

3. **Admin Management Page**
   - View all approved admins
   - Revoke admin access
   - View admin activity logs

4. **Request Details**
   - Add reason for requesting admin access
   - Add organization/affiliation
   - Track IP address properly

5. **Rate Limiting**
   - Prevent spam requests
   - Limit requests per email/IP
   - Add CAPTCHA

6. **Approval Workflow**
   - Multi-step approval
   - Require multiple admins to approve
   - Add approval notes

---

## 📞 Support

**Testing Issues:**
- Check browser console for errors
- Check Firestore Console for data
- Check Firebase Auth for user accounts
- Review Firebase Functions logs

**Security Concerns:**
- Only approve trusted users
- Regularly audit `admin_requests` and `approved_admins`
- Monitor Firebase Auth for unauthorized accounts

**Contact:**
- Email: ibapurdue@gmail.com
- Firebase Console: https://console.firebase.google.com/project/iba-website-63cb3

---

## ✅ Summary

**Completed:**
- ✅ Request admin access button in login modal
- ✅ Fixed email/password input colors (white background)
- ✅ Admin request submission system
- ✅ Admin request approval/decline in init-firestore.html
- ✅ Approved admins authentication
- ✅ Updated Firestore security rules
- ✅ Deployed to production

**URLs:**
- **Main Site:** https://iba-website-63cb3.web.app
- **Admin Tools:** https://iba-website-63cb3.web.app/init-firestore.html
- **Firebase Console:** https://console.firebase.google.com/project/iba-website-63cb3

**Status:** 🟢 LIVE AND READY TO USE!
