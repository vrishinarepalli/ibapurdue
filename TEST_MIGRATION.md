# 🧪 Testing Guide - Phase 1 Migration

## Quick Test (2 minutes)

### 1. Open the Site
```bash
# If using local server:
# python3 -m http.server 8000
# or
# npx serve

# Then open: http://localhost:8000
```

### 2. Check Browser Console
Open browser DevTools (F12 or Cmd+Option+I) and look for:

**Expected output:**
```
✅ Auth persistence set to LOCAL
🔥 Firebase initialized
✅ Navigation initialized
✅ IBA Basketball App Initialized
```

**❌ If you see errors**, check:
- Is `js/app.js` loading? (Check Network tab)
- Is GSAP loaded? (Should be before app.js)
- Any 404 errors for module files?

### 3. Test Navigation (30 seconds)

**Tab Navigation:**
- [ ] Click "Schedule" tab → Content should switch
- [ ] Click "Teams" tab → Content should switch
- [ ] Click "Bracket" tab → Content should switch
- [ ] Press Arrow Right/Left keys → Should switch tabs

**Card Navigation:**
- [ ] Click hamburger menu (☰) → Should animate open
- [ ] Click a navigation card → Should switch to that tab
- [ ] Menu should close automatically
- [ ] On mobile, cards should stack vertically

**✅ If all work**: Navigation module is working correctly!

## Full Feature Test (10 minutes)

### Firebase & Data Loading
- [ ] Teams tab shows team data
- [ ] Schedule tab shows games
- [ ] Bracket tab shows bracket
- [ ] No "Firebase is not defined" errors

### Admin Functions
- [ ] "Admin" button visible in header
- [ ] Can click admin button
- [ ] Admin login/password works as before
- [ ] Admin mode toggles correctly

### Tournament Form
- [ ] Spring 2026 Tournament tab loads
- [ ] Form fields are visible
- [ ] Can fill out form (don't submit unless testing)

### Schedule Management
- [ ] Schedule table displays correctly
- [ ] Can search/filter schedule
- [ ] Games show with correct formatting

### Bracket Display
- [ ] Black bracket displays
- [ ] Gold bracket displays
- [ ] All slots show "TBD" or team names

### Teams Display
- [ ] Team cards display in grid
- [ ] Can click on team to see details
- [ ] Modal opens with team info

## Performance Check

### Page Load
- [ ] Page loads without delay
- [ ] No console warnings
- [ ] Animations are smooth

### Module Loading
Check Network tab:
- [ ] `js/app.js` loads (should be <1KB)
- [ ] `js/config/firebase.config.js` loads
- [ ] `js/ui/navigation.logic.js` loads
- [ ] All loads happen quickly (<100ms each)

## Regression Test

**These should work exactly as before:**

### User Actions
- [ ] Navigate between tabs
- [ ] View team information
- [ ] View schedule
- [ ] View bracket
- [ ] Fill out tournament form
- [ ] Sign in with Google (if applicable)

### Admin Actions (if admin)
- [ ] Enter admin mode
- [ ] Edit schedule
- [ ] Edit bracket
- [ ] View tournament submissions
- [ ] Add/edit teams

### Mobile/Responsive
- [ ] Test on mobile viewport
- [ ] Hamburger menu works
- [ ] All tabs accessible
- [ ] Forms are usable

## What to Do If Tests Fail

### Navigation Not Working
1. Check console for errors
2. Verify GSAP is loaded: `typeof gsap` should not be "undefined"
3. Check that `navigation.logic.js` is loading without errors
4. Look for typos in import statements

### Firebase Errors
1. Check Network tab - are Firebase scripts loading?
2. Verify `firebase.config.js` is loading
3. Check console for specific Firebase errors
4. Verify firebaseConfig credentials are correct

### Modules Not Loading
1. Check file paths are correct (case-sensitive!)
2. Verify all files are in correct directories
3. Check browser supports ES6 modules (modern browsers only)
4. Look for 404 errors in Network tab

### Features Broken
1. Check if error is in console
2. Verify the feature code is still in index.html script block
3. Check if feature depends on removed navigation code
4. Test in private/incognito window (clear cache)

## Browser Compatibility

### Tested Browsers (should work):
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Not Supported:
- ❌ Internet Explorer (no ES6 module support)
- ❌ Very old mobile browsers

## Rollback Plan

If something is broken and you need to rollback:

### Option 1: Git Revert (if using git)
```bash
git checkout HEAD~1 index.html
git checkout HEAD~1 js/
```

### Option 2: Manual Rollback
1. Open `index.html`
2. Replace line 20 with the old Firebase initialization:
```html
<!-- Firebase SDK -->
<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
  // ... (rest of old Firebase config)
</script>
```
3. Find comment `// Navigation code moved to js/ui/navigation.logic.js`
4. Paste back the navigation code from backup

### Option 3: Keep New Structure, Fix Issues
- Most issues are likely simple typos or path problems
- Check console errors carefully
- Compare with working examples in migration docs

## Success Criteria

**Phase 1 Migration is successful if:**

✅ All navigation features work (tabs, menu, cards)
✅ Firebase connects and loads data
✅ All other features work as before (schedule, teams, bracket, etc.)
✅ No console errors
✅ Page loads quickly
✅ Admin functions work
✅ Tournament form works

**If all checked**: Migration is successful! 🎉

## Next Steps After Testing

### If Tests Pass:
1. Commit changes to git (if using)
2. Deploy to production (if ready)
3. Consider Phase 2 migration (see MIGRATION_COMPLETE.md)

### If Tests Fail:
1. Document the failure (what doesn't work?)
2. Check console errors
3. Follow troubleshooting steps above
4. If stuck, rollback and review migration docs
5. Try again with fix

## Getting Help

If you're stuck:

1. **Check Documentation:**
   - `MIGRATION_COMPLETE.md` - What was changed
   - `MIGRATION_GUIDE.md` - How to migrate
   - `TROUBLESHOOTING.md` - Common issues (if exists)

2. **Debug Systematically:**
   - What specific feature is broken?
   - Is it a module loading issue?
   - Is it a code logic issue?
   - Check console errors first

3. **Test Incrementally:**
   - Did it work before migration? (rollback to verify)
   - Does Firebase initialize? (check console)
   - Does navigation module load? (check Network tab)
   - Does the specific broken feature work in isolation?

---

**Remember**: The goal is to maintain all existing functionality while improving code organization. If something doesn't work, it's likely a simple fix!
