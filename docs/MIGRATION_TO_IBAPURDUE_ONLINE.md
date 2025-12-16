# 🚀 Migration to ibapurdue.online - Touch ID Domain Switch

**Status:** ✅ DEPLOYED TO MAIN BRANCH
**Date:** November 4, 2025
**New Domain:** https://ibapurdue.online

---

## ✨ What Changed

### **Touch ID Domain:**
- **Before:** `iba-website-63cb3.web.app`
- **After:** `ibapurdue.online`

### **Why This Matters:**

WebAuthn (Touch ID/Face ID) credentials are **bound to the domain** where they were registered. Since we changed from `iba-website-63cb3.web.app` → `ibapurdue.online`, **all existing Touch ID credentials will stop working**.

---

## ⚠️ CRITICAL: You MUST Re-Register Touch ID

### **Step 1: Clear Old Credentials from Firestore** 🔴 REQUIRED

1. **Go to Firebase Console:**
   - https://console.firebase.google.com/project/iba-website-63cb3/firestore

2. **Navigate to Firestore Database**

3. **Find and DELETE the `admin` collection → `biometric` document**
   - Click on `admin` collection
   - Click on `biometric` document
   - Click the **trash icon** to delete
   - Confirm deletion

4. **Why?** Old credentials have rpID = `iba-website-63cb3.web.app` which won't work on `ibapurdue.online`

---

### **Step 2: Re-Register Touch ID on ibapurdue.online** 🔴 REQUIRED

#### **For Main Admin (You):**

1. **Visit the NEW domain:** https://ibapurdue.online

2. **Click "Admin" button**

3. **Click "🔐 Use Touch ID / Face ID"**

4. **You'll see:** _"No biometric credentials registered"_

5. **Click OK to register**

6. **Enter your email/password** (one-time verification)

7. **Touch ID prompt appears** - Touch your sensor

8. **Success!** ✅ Touch ID is now registered for ibapurdue.online

9. **Test it:**
   - Logout or refresh page
   - Click Admin → Touch ID
   - Touch sensor
   - Should login successfully! ✅

---

#### **For Approved Admins:**

**If you have approved admins who were using Touch ID:**

1. **They need to visit:** https://ibapurdue.online

2. **They should login with email/password first**

3. **Then re-register Touch ID** (same steps as above)

4. **Their old credentials won't work** - they need to re-register

---

## 🌐 Domain Status

### **Both Domains Still Work:**

✅ **https://ibapurdue.online** (Primary)
- Touch ID will work here ✅
- All features available
- Use this going forward

✅ **https://iba-website-63cb3.web.app** (Secondary)
- Still accessible
- Email/password login works
- Touch ID will NOT work (wrong domain)

### **Which to Use:**

👉 **Always use ibapurdue.online** for Touch ID to work!

---

## 🧪 Testing Checklist

### **Test 1: Verify Old Credentials are Cleared**

1. Go to Firebase Console → Firestore
2. Check `admin` collection
3. ✅ `biometric` document should be DELETED
4. Or if it exists, `credentials` array should be empty

### **Test 2: Register Touch ID on New Domain**

1. Visit **https://ibapurdue.online**
2. Click Admin → Touch ID
3. Follow registration prompts
4. ✅ Should complete successfully

### **Test 3: Verify New Credential in Firestore**

1. Go to Firebase Console → Firestore
2. Check `admin/biometric` document
3. ✅ Should have new credential with:
   - `credentialID`
   - `credentialPublicKey`
   - `adminUid`
   - `adminEmail`
   - `registeredAt` (today's date)

### **Test 4: Login with Touch ID**

1. Logout or open new tab
2. Visit **https://ibapurdue.online**
3. Click Admin → Touch ID
4. Touch sensor
5. ✅ Should login instantly!

### **Test 5: Verify Wrong Domain Fails**

1. Visit **https://iba-website-63cb3.web.app**
2. Click Admin → Touch ID
3. ❌ Should fail (domain mismatch)
4. ✅ Email/password still works on this domain

---

## 📊 What's Deployed

### **Main Branch - Production:**
- ✅ All Touch ID features
- ✅ Multi-admin support
- ✅ Admin request system
- ✅ Security improvements
- ✅ rpID set to `ibapurdue.online`

### **Functions Updated:**
- `generateRegistrationOptions` - Uses ibapurdue.online
- `verifyRegistration` - Verifies against ibapurdue.online
- `generateAuthenticationOptions` - Uses ibapurdue.online
- `verifyAuthentication` - Verifies against ibapurdue.online

### **Files Changed:**
```
functions/index.js:
  rpID: 'ibapurdue.online'
  origin: ['https://ibapurdue.online', 'https://iba-website-63cb3.web.app']
```

---

## 🔧 Troubleshooting

### **Error: "The relying party ID is not a registrable domain suffix..."**

**Cause:** You're trying to use Touch ID on `iba-website-63cb3.web.app`

**Fix:** Use `ibapurdue.online` instead

---

### **Error: "No biometric credentials registered"**

**Status:** ✅ This is EXPECTED after migration!

**Fix:** Follow Step 2 above to re-register

---

### **Touch ID worked before, now doesn't work**

**Cause:** Domain changed, old credentials invalid

**Fix:**
1. Delete old credentials from Firestore (Step 1)
2. Re-register on ibapurdue.online (Step 2)

---

### **Can I keep my old credentials?**

**No.** WebAuthn credentials are cryptographically bound to the domain. You MUST re-register on the new domain.

---

## 📱 Custom Domain Setup (If Not Already Done)

### **Is ibapurdue.online already configured?**

Check here: https://console.firebase.google.com/project/iba-website-63cb3/hosting

If NOT configured:

1. **Go to Firebase Console → Hosting**
2. **Click "Add custom domain"**
3. **Enter:** `ibapurdue.online`
4. **Follow DNS setup instructions:**
   - Add A records
   - Add TXT record for verification
5. **Wait for SSL certificate** (can take up to 24 hours)
6. **Once complete:** ✅ Your site will be live on ibapurdue.online

---

## 🎯 Summary of Required Actions

### **YOU MUST DO (Before Touch ID Works):**

1. ✅ Delete `admin/biometric` from Firestore
2. ✅ Visit https://ibapurdue.online
3. ✅ Re-register Touch ID
4. ✅ Test that it works

### **What Happens Automatically:**

- ✅ Code deployed to Firebase
- ✅ Functions updated with new rpID
- ✅ Both domains still accessible
- ✅ Email/password login works on both

### **What Breaks Without Action:**

- ❌ Touch ID won't work until you clear old credentials
- ❌ Old Touch ID credentials will cause errors
- ❌ Users will see "credential not found" errors

---

## 📞 Support

**If Touch ID doesn't work after migration:**

1. Verify you're on https://ibapurdue.online (not .web.app)
2. Check Firestore - old credentials should be deleted
3. Try re-registering Touch ID
4. Check browser console (F12) for errors

**Contact:** ibapurdue@gmail.com

---

## ✅ Migration Complete!

Once you complete Steps 1 and 2 above, Touch ID will work perfectly on **ibapurdue.online**! 🎉

**Use this domain going forward:**
👉 **https://ibapurdue.online** 👈
