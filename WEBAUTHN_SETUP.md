# Touch ID / Face ID Authentication Setup Guide

This guide explains how to deploy and use the new server-verified biometric authentication system for IBA admin access.

## 🔒 Security Architecture

### Previous System (Client-Side Only)
- ❌ Credentials stored in browser localStorage
- ❌ No server verification
- ❌ Anyone could delete localStorage and re-register

### New System (Server-Verified)
- ✅ Admin public key stored securely in Firestore
- ✅ All authentication verified server-side
- ✅ Firebase Functions handle all security logic
- ✅ Custom tokens issued only after successful verification
- ✅ Firestore security rules enforce admin authentication

---

## 📋 Prerequisites

1. **Firebase CLI** - Install globally:
   ```bash
   npm install -g firebase-tools
   ```

2. **Node.js 18+** - Required for Firebase Functions

3. **Admin Access** - You need your current admin email/password for initial setup

---

## 🚀 Deployment Steps

### Step 1: Login to Firebase
```bash
firebase login
```

### Step 2: Initialize Firebase Project (if not already done)
```bash
cd /Users/vrishinarepalli/Desktop/IBA/website
firebase use iba-website-63cb3
```

### Step 3: Install Function Dependencies
```bash
cd functions
npm install
```

This will install:
- `firebase-admin` - Server-side Firebase SDK
- `firebase-functions` - Cloud Functions framework
- `@simplewebauthn/server` - WebAuthn verification library

### Step 4: Update Domain Configuration

**IMPORTANT:** Before deploying, update the domain in `functions/index.js`:

```javascript
// Line 12-13 in functions/index.js
const rpID = 'iba-purdue.com'; // Change to your actual domain
const origin = 'https://iba-purdue.com'; // Change to your actual URL
```

**For testing locally:**
```javascript
const rpID = 'localhost';
const origin = 'http://localhost:5000';
```

### Step 5: Deploy Firebase Functions
```bash
cd /Users/vrishinarepalli/Desktop/IBA/website
firebase deploy --only functions
```

This deploys 5 Cloud Functions:
- `generateRegistrationOptions` - Creates registration challenge
- `verifyRegistration` - Verifies and stores credentials
- `generateAuthenticationOptions` - Creates authentication challenge
- `verifyAuthentication` - Verifies biometric authentication
- `checkAdminStatus` - Helper function to check admin status

### Step 6: Deploy Firestore Security Rules
```bash
firebase deploy --only firestore:rules
```

This ensures:
- Admin credentials are only accessible by Cloud Functions
- Database operations require verified admin token

### Step 7: Deploy Updated Website
```bash
firebase deploy --only hosting
```

---

## 🎯 First-Time Setup (Admin Registration)

After deployment, the admin needs to register their biometric credentials **once**:

### On Mac with Touch ID:
1. Open the website in **Safari or Chrome**
2. Click the "Admin" button (bottom-right)
3. Click "🔐 Use Touch ID / Face ID"
4. A confirmation dialog appears explaining this is first-time setup
5. Click "OK" to continue
6. **Enter your admin email and password** (one-time only)
7. Touch ID prompt appears - authenticate with your fingerprint
8. ✅ Success message: "Successfully registered! Click again to login."
9. Click the button again
10. Touch ID prompt - authenticate
11. ✅ Admin mode activated!

### On iPhone/iPad with Face ID:
1. Open website in **Safari**
2. Follow same steps as above
3. Face ID will be used instead of Touch ID

### Important Notes:
- ⚠️ You only need email/password **once** during initial registration
- ⚠️ After registration, **only biometrics** are required
- ⚠️ If you clear browser data, you may need to re-register

---

## 🔐 How Authentication Works

### Registration Flow:
```
1. Admin clicks biometric button
2. Client calls `generateRegistrationOptions` function
3. Server creates cryptographic challenge
4. Browser prompts for Touch ID/Face ID
5. Device creates credential using Secure Enclave
6. Client sends credential to `verifyRegistration` function
7. Server verifies and stores public key in Firestore
8. ✅ Registration complete
```

### Authentication Flow:
```
1. Admin clicks biometric button
2. Client calls `generateAuthenticationOptions` function
3. Server creates cryptographic challenge
4. Browser prompts for Touch ID/Face ID
5. Device signs challenge with private key (never leaves device)
6. Client sends assertion to `verifyAuthentication` function
7. Server verifies signature using stored public key
8. Server creates custom Firebase token with admin claims
9. Client signs in with custom token
10. ✅ Admin access granted
```

---

## 🗂️ Data Storage

### Server-Side (Firestore)
**Collection: `admin/biometric`**
```json
{
  "credentials": [
    {
      "credentialID": "base64_credential_id",
      "credentialPublicKey": "base64_public_key",
      "counter": 0,
      "credentialDeviceType": "singleDevice",
      "credentialBackedUp": false,
      "transports": ["internal"],
      "registeredAt": "2025-10-23T12:00:00Z"
    }
  ],
  "lastUpdated": "2025-10-23T12:00:00Z"
}
```

**Collection: `admin/pending_challenge`** (temporary during registration)
```json
{
  "challenge": "random_base64url_string",
  "timestamp": "2025-10-23T12:00:00Z",
  "expiresAt": "2025-10-23T12:05:00Z"
}
```

**Collection: `auth_challenges/{id}`** (temporary during authentication)
```json
{
  "challenge": "random_base64url_string",
  "timestamp": "2025-10-23T12:00:00Z",
  "expiresAt": "2025-10-23T12:05:00Z"
}
```

### Client-Side
- ❌ **NO sensitive data stored**
- ❌ **NO credentials in localStorage**
- ✅ Only authentication state managed by Firebase Auth SDK

### Device Hardware (Secure Enclave)
- Private key stored in hardware
- Biometric templates (fingerprint/face data)
- **Never accessible to any software**

---

## 🔧 Troubleshooting

### "Firebase not initialized" Error
**Solution:** Refresh the page and wait a few seconds before clicking Admin button.

### "No biometric credentials registered" Error
**Solution:** This is expected for first-time setup. Follow the registration flow above.

### "Touch ID / Face ID not available on this device"
**Solution:**
- Ensure you're using Safari or Chrome on Mac/iOS
- Check that Touch ID/Face ID is enabled in System Preferences/Settings
- Make sure you have at least one fingerprint/face registered

### "Authentication cancelled or not allowed"
**Solution:** You cancelled the Touch ID/Face ID prompt. Click the button again to retry.

### Functions Not Deploying
**Solution:**
```bash
# Check Node version
node --version  # Should be 18+

# Clear functions cache
rm -rf functions/node_modules
cd functions && npm install

# Deploy again
firebase deploy --only functions
```

### "Permission Denied" in Firestore
**Solution:** Ensure security rules are deployed:
```bash
firebase deploy --only firestore:rules
```

---

## 🧪 Testing Locally

### Option 1: Firebase Emulators
```bash
# Install emulators
firebase init emulators

# Start emulators
firebase emulators:start

# Open http://localhost:5000
```

### Option 2: Deploy to Staging
Create a separate Firebase project for testing:
```bash
firebase use --add  # Add staging project
firebase deploy --only functions,firestore:rules,hosting
```

---

## 🔑 Security Best Practices

### ✅ Implemented
- Server-side credential verification
- Challenge-response authentication
- Time-limited challenges (5 minutes)
- Counter-based replay protection
- Hardware-bound credentials (Secure Enclave)
- Firestore security rules
- Custom tokens with admin claims

### 🔒 Additional Recommendations
1. **Enable Firebase App Check** - Prevents unauthorized API access
2. **Monitor Firebase Console** - Watch for suspicious function calls
3. **Audit Logs** - Review Firestore admin collection periodically
4. **Backup Credentials** - Keep admin email/password secure for re-registration if needed
5. **Multiple Devices** - Each device can register separately (supported)

---

## 📊 Monitoring

### Firebase Console
- **Functions Logs:** `console.cloud.google.com/functions`
- **Firestore Data:** Firebase Console → Firestore Database
- **Authentication:** Firebase Console → Authentication

### Key Metrics to Watch
- Number of failed authentication attempts
- Unusual timestamps in `auth_challenges` collection
- Changes to `admin/biometric` document

---

## 🆘 Emergency Access

If biometric authentication fails and you can't access admin:

### Option 1: Re-register Credentials
1. Delete the `admin/biometric` document in Firestore
2. Follow first-time setup flow again

### Option 2: Temporary Email/Password Access
1. Uncomment the old email/password code (not recommended)
2. Access admin
3. Re-register biometrics
4. Remove email/password code

### Option 3: Firebase Console
Use Firestore directly in Firebase Console to make changes.

---

## 📝 Changelog

### Version 2.0 (Current)
- ✅ Server-side WebAuthn verification
- ✅ Credentials stored in Firestore
- ✅ Custom token-based authentication
- ✅ Firestore security rules
- ✅ No localStorage usage

### Version 1.0 (Previous)
- ❌ Client-side only verification
- ❌ Credentials in localStorage
- ❌ Firebase email/password authentication

---

## 🤝 Support

For issues or questions:
- Check Firebase Functions logs: `firebase functions:log`
- Review browser console for client-side errors
- Contact: ibapurdue@gmail.com

---

## 📚 Technical References

- [WebAuthn Specification](https://w3c.github.io/webauthn/)
- [SimpleWebAuthn Documentation](https://simplewebauthn.dev/)
- [Firebase Functions Guide](https://firebase.google.com/docs/functions)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
