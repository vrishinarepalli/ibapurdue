# 🏀 IBA Basketball Tournament Website

Official website for the IBA (Intramural Basketball Association) basketball tournaments.

## 🚀 Quick Start

### New to the Project?
**📚 [Read the Documentation](docs/START_HERE.md)** - Complete guide to get started

### Quick Links
- **[Getting Started](docs/START_HERE.md)** - Overview and next steps
- **[Test the Site](docs/TEST_MIGRATION.md)** - Testing checklist
- **[Migration Status](docs/MIGRATION_COMPLETE.md)** - Phase 1 complete summary
- **[All Documentation](docs/README.md)** - Full documentation index

## 📁 Project Structure

```
/IBA/website/
├── index.html              Main website
├── init-firestore.html     Admin database initialization
├── style.css               Styles
│
├── js/                     JavaScript modules ✨ NEW
│   ├── config/            Firebase configuration
│   ├── ui/                UI components (navigation)
│   ├── features/          Feature modules (ready for extraction)
│   ├── services/          Services (ready for extraction)
│   └── app.js             Main entry point
│
├── images/                 Images and assets
├── functions/              Firebase Cloud Functions
│
└── docs/                   📚 All documentation
    ├── README.md          Documentation index
    └── START_HERE.md      Quick start guide
```

## ✨ Recent Changes (Phase 1)

- ✅ **Modular Architecture** - Code organized into logical modules
- ✅ **Firebase Config Extracted** - Centralized Firebase setup
- ✅ **Navigation Module** - Dedicated navigation system
- ✅ **Reduced Complexity** - index.html reduced from 5,075 to 4,879 lines
- ✅ **Better Organization** - Clear separation of concerns
- ✅ **No Breaking Changes** - All features preserved

## 🎯 Features

### For Users
- 🏀 View tournament schedule
- 👥 Browse teams and rosters
- 🏆 Follow tournament brackets
- 📝 Submit tournament applications
- 📊 View standings and statistics

### For Admins
- ⚙️ Manage tournament data
- 📅 Edit schedule and games
- 👥 Manage teams and rosters
- 🏆 Update brackets
- ✅ Review tournament applications
- 🔐 Multi-admin system with approval workflow

## 🛠️ Technology Stack

- **Frontend**: HTML, CSS, JavaScript (ES6 Modules)
- **Backend**: Firebase
  - Firestore (Database)
  - Authentication (Google Sign-In, WebAuthn/Touch ID)
  - Cloud Functions
  - Hosting
- **Animation**: GSAP
- **Architecture**: Modular ES6

## 📖 Documentation

All documentation is organized in the [`docs/`](docs/) directory:

### Essential
- **[START_HERE.md](docs/START_HERE.md)** - Start here if new to the project
- **[MIGRATION_COMPLETE.md](docs/MIGRATION_COMPLETE.md)** - Phase 1 changes
- **[TEST_MIGRATION.md](docs/TEST_MIGRATION.md)** - How to test

### Migration & Restructuring
- **[MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md)** - Future migration steps
- **[RESTRUCTURE_PLAN.md](docs/RESTRUCTURE_PLAN.md)** - Architecture plan
- **[NEXT_STEPS.md](docs/NEXT_STEPS.md)** - Decision tree

### Authentication & Security
- **[ADMIN_REQUEST_SYSTEM.md](docs/ADMIN_REQUEST_SYSTEM.md)** - Admin approval
- **[USER_LOGIN_GUIDE.md](docs/USER_LOGIN_GUIDE.md)** - User auth guide
- **[WEBAUTHN_SETUP.md](docs/WEBAUTHN_SETUP.md)** - Touch ID setup
- **[FIRESTORE_SECURITY_RULES.md](docs/FIRESTORE_SECURITY_RULES.md)** - Security rules

**[View All Documentation](docs/README.md)**

## 🧪 Testing

```bash
# Run local server
python3 -m http.server 8000
# or
npx serve

# Open http://localhost:8000
# Follow testing guide: docs/TEST_MIGRATION.md
```

## 🚀 Deployment

Deployed on Firebase Hosting:
- Production: `https://iba-website-63cb3.web.app`
- Domain: `ibapurdue.online` (configured)

```bash
# Deploy
firebase deploy

# Deploy hosting only
firebase deploy --only hosting
```

## 📊 Status

- ✅ **Phase 1 Migration**: Complete
- ✅ **All Features**: Working
- ✅ **Production Ready**: Yes
- 📝 **Future Phases**: Optional (see docs)

## 🤝 Contributing

1. Read [START_HERE.md](docs/START_HERE.md)
2. Make changes following existing patterns
3. Test using [TEST_MIGRATION.md](docs/TEST_MIGRATION.md)
4. Document changes in appropriate docs

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: Check [TEST_MIGRATION.md](docs/TEST_MIGRATION.md) troubleshooting
- **Admin Access**: See [ADMIN_REQUEST_SYSTEM.md](docs/ADMIN_REQUEST_SYSTEM.md)

---

**Current Version**: Phase 1 Complete
**Last Updated**: December 16, 2024
**Status**: ✅ Production Ready

For detailed information, see the [documentation](docs/README.md).
