# IBA Website Restructuring Plan

## Current State
- **index.html**: 5,075 lines - contains ALL HTML, CSS, and JavaScript
- Difficult to find and edit specific features
- High cognitive load when making changes

## Target Structure

### Directory Layout
```
/IBA/website/
├── index.html (HTML markup only, ~500 lines)
├── styles/
│   └── main.css (extracted CSS)
├── js/
│   ├── config/
│   │   └── firebase.config.js (Firebase initialization)
│   ├── services/
│   │   ├── auth.service.js (Authentication logic)
│   │   └── firestore.service.js (Firestore operations)
│   ├── features/
│   │   ├── tournament/
│   │   │   └── tournament.logic.js (Form submission, viewing)
│   │   ├── bracket/
│   │   │   └── bracket.logic.js (Bracket editing, display)
│   │   ├── schedule/
│   │   │   └── schedule.logic.js (Schedule management)
│   │   ├── teams/
│   │   │   └── teams.logic.js (Teams CRUD)
│   │   └── admin/
│   │       └── admin.logic.js (Admin functions)
│   ├── ui/
│   │   ├── navigation.logic.js (Tab switching)
│   │   └── modals.logic.js (Modal handling)
│   └── app.js (Main initialization)
```

## Extraction Order
1. ✅ Create directory structure
2. Extract Firebase config → `js/config/firebase.config.js`
3. Extract CSS → `styles/main.css` (if not already separate)
4. Extract authentication → `js/services/auth.service.js`
5. Extract Firestore operations → `js/services/firestore.service.js`
6. Extract tournament logic → `js/features/tournament/tournament.logic.js`
7. Extract bracket logic → `js/features/bracket/bracket.logic.js`
8. Extract schedule logic → `js/features/schedule/schedule.logic.js`
9. Extract teams logic → `js/features/teams/teams.logic.js`
10. Extract admin logic → `js/features/admin/admin.logic.js`
11. Extract navigation → `js/ui/navigation.logic.js`
12. Extract modals → `js/ui/modals.logic.js`
13. Create main app → `js/app.js`
14. Update index.html to reference new files

## Benefits
- Find specific features quickly
- Edit one feature without affecting others
- Reduced file size for AI context
- Clear separation of concerns
- Easier testing and maintenance
