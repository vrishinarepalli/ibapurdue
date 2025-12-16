# IBA Website Migration Guide

## ✅ What's Been Done

### 1. Directory Structure Created
```
/IBA/website/
├── js/
│   ├── config/           ← Firebase configuration
│   ├── services/         ← Auth, Firestore services
│   ├── features/         ← Feature-specific logic
│   │   ├── tournament/
│   │   ├── bracket/
│   │   ├── schedule/
│   │   ├── teams/
│   │   └── admin/
│   ├── ui/              ← UI logic (navigation, modals)
│   └── app.js           ← Main entry point
```

### 2. Files Created

#### `js/config/firebase.config.js` ✅
- Firebase initialization
- Firestore, Auth, Functions setup
- Exposes Firebase globally for backward compatibility
- **Ready to use immediately**

#### `js/app.js` ✅
- Main application entry point
- Imports and initializes Firebase
- Ready for additional module imports

## 🔄 Migration Strategy

The migration follows this principle: **Incremental extraction without breaking existing code**

### Phase 1: Setup (DONE)
- [x] Create directory structure
- [x] Extract Firebase config
- [x] Create main app.js

### Phase 2: Update index.html to Load Modules
Replace the Firebase `<script type="module">` block (lines 20-59) with:

```html
<!-- Load modular JavaScript -->
<script type="module" src="js/app.js"></script>
```

**Why this works**: The new `firebase.config.js` exports Firebase to `window.db`, `window.auth`, etc., so all existing code in the `<script>` block (lines 1575-5035) will continue to work unchanged.

### Phase 3: Extract Features One-by-One

Extract features in this order (easiest to hardest):

#### 1. Navigation Logic (NEXT RECOMMENDED)
**Location in index.html**: Lines ~2848-2900
**Target file**: `js/ui/navigation.logic.js`

**What to extract**:
```javascript
// Function: activateTab()
// Function: tab click handlers
// Function: menu toggle logic
```

**Steps**:
1. Create `js/ui/navigation.logic.js`
2. Copy the functions
3. Add file header comment
4. Export `initNavigation()` function
5. Import and call in `app.js`
6. Remove from index.html `<script>` block

#### 2. Tournament Form Logic
**Location**: Lines ~4598-4730
**Target**: `js/features/tournament/tournament.logic.js`

**What to extract**:
```javascript
// Tournament form submission
// View all submissions (admin)
// Edit/withdraw submission
```

#### 3. Authentication Service
**Location**: Lines ~1610-1680, ~4354-4400
**Target**: `js/services/auth.service.js`

**What to extract**:
```javascript
// isApprovedAdmin()
// checkAdminSession()
// onAuthStateChanged handlers
```

#### 4. Bracket Management
**Location**: Search for `editBracketSlot`, `saveBracketSlot`
**Target**: `js/features/bracket/bracket.logic.js`

#### 5. Schedule Management
**Target**: `js/features/schedule/schedule.logic.js`

#### 6. Teams Management
**Target**: `js/features/teams/teams.logic.js`

#### 7. Admin Functions
**Target**: `js/features/admin/admin.logic.js`

#### 8. Modal Logic
**Target**: `js/ui/modals.logic.js`

## 📋 Extraction Template

When extracting a feature, follow this template:

```javascript
/**
 * File: feature-name.logic.js
 * Purpose: [What this feature does]
 * Scope: [What it modifies/manages]
 */

// Import dependencies if needed
// import { db } from '../../config/firebase.config.js';

// Feature code here
function someFeatureFunction() {
  // ...
}

// Initialize function
export function initFeatureName() {
  // Set up event listeners
  // Initialize state
  console.log('✅ Feature initialized');
}

// Export individual functions if needed by other modules
export { someFeatureFunction };
```

## 🎯 How to Extract a Feature (Step-by-Step)

### Example: Extracting Navigation

**1. Find the code in index.html**
```bash
# Search for relevant functions
grep -n "function activateTab" index.html
grep -n "tabs.forEach" index.html
```

**2. Create the new file**
```javascript
// js/ui/navigation.logic.js

/**
 * File: navigation.logic.js
 * Purpose: Handle tab navigation and menu toggling
 * Scope: Manages tab switching, mobile menu, smooth scrolling
 */

export function initNavigation() {
  const tabs = document.querySelectorAll('[role="tab"]');
  const panels = document.querySelectorAll('.tabpanel');
  const menuToggle = document.querySelector('.menu-toggle');
  let isExpanded = false;

  function activateTab(tabId) {
    const tab = document.getElementById(tabId);
    if (!tab) return;

    tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
    panels.forEach(p => p.classList.remove('active'));

    tab.setAttribute('aria-selected', 'true');
    const panelId = tab.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.classList.add('active');
    }

    if (isExpanded) {
      toggleMenu();
    }
  }

  function toggleMenu() {
    // ... menu toggle logic ...
  }

  // Set up event listeners
  tabs.forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab.id));
  });

  console.log('✅ Navigation initialized');
}
```

**3. Import in app.js**
```javascript
import { initializeFirebase } from './config/firebase.config.js';
import { initNavigation } from './ui/navigation.logic.js';

initializeFirebase();
initNavigation();
```

**4. Remove from index.html**
Delete the extracted code from the `<script>` block

**5. Test**
- Refresh the page
- Verify tab switching still works
- Check console for initialization message

## 🧪 Testing After Each Extraction

After extracting each feature:

1. **Refresh the page** (hard refresh: Cmd+Shift+R / Ctrl+Shift+R)
2. **Check console** for errors
3. **Test the feature** manually
4. **Verify** other features still work

## ⚠️ Important Notes

### Don't Break Existing Code
- Features can be extracted **one at a time**
- Each extraction should be tested before moving to the next
- The old code and new code can coexist during migration

### Global Window Access
- Many functions are attached to `window` (e.g., `window.editBracketSlot`)
- When extracting, either:
  - Keep exposing via `window` for HTML `onclick` handlers
  - Or convert HTML onclick to `addEventListener` in JS

### Firebase Access
- All modules can access Firebase via:
  ```javascript
  const { db, auth } = window;
  // OR import from config
  import { db, auth } from './config/firebase.config.js';
  ```

## 📊 Progress Tracking

Track your migration progress:

- [x] Firebase config
- [x] App.js entry point
- [ ] Navigation logic
- [ ] Tournament form logic
- [ ] Authentication service
- [ ] Bracket management
- [ ] Schedule management
- [ ] Teams management
- [ ] Admin functions
- [ ] Modal logic

## 🎉 Benefits After Migration

Once complete, you'll have:

✅ **Faster edits** - Find specific features instantly
✅ **Smaller context** - AI tools work more efficiently
✅ **Less risk** - Changes isolated to single files
✅ **Better testing** - Test features independently
✅ **Clearer code** - Each file has one responsibility
✅ **Easier debugging** - Console logs show which module logged

## 🆘 Troubleshooting

### "Firebase is not defined"
- Ensure `app.js` is loaded with `type="module"`
- Check `firebase.config.js` calls `initializeFirebase()`

### "Function is not defined" in HTML onclick
- Function needs to be on `window`:
  ```javascript
  window.myFunction = function() { ... }
  ```
- Or convert onclick to addEventListener in JS

### Module import errors
- Check file paths are correct
- Ensure `type="module"` on script tag
- Verify export/import syntax matches

## 📞 Next Steps

1. **Update index.html** to load `app.js` (Phase 2)
2. **Extract navigation** logic first (easiest win)
3. **Test thoroughly**
4. **Continue with tournament logic** (visible user feature)
5. **Gradually migrate** the rest

---

**Remember**: This is an incremental migration. You can stop at any point and still have a working site!
