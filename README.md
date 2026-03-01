# IBA Basketball Tournament Website

Official website for the IBA (Intramural Basketball Association) at Purdue University.

**Production URL:** https://ibapurdue.online

---

## Project Structure

```
/
├── index.html              Main site (desktop)
├── mobile.html             Main site (mobile)
├── profile.html            User profile page
├── iba-admin.html          Admin dashboard (restricted access)
├── style.css               Global styles
│
├── js/                     JavaScript modules
│   ├── firebase-config.js  Firebase initialization
│   ├── claude-enhancements.js  AI-powered features
│   └── auth.js             Authentication logic
│
├── functions/              Firebase Cloud Functions
│   ├── index.js            Cloud Function definitions
│   └── package.json        Functions dependencies
│
├── assets/                 Icons and static assets
└── images/                 Site images
```

## Technology Stack

- **Frontend:** HTML, CSS, JavaScript (ES6 Modules)
- **Backend:** Firebase (Firestore, Authentication, Cloud Functions, Hosting)
- **AI:** Anthropic Claude API (team name suggestions)
- **Animation:** GSAP

## Features

**Public**
- Tournament schedule and bracket
- Team roster browser
- Standings and statistics
- Tournament registration form

**Admin (restricted)**
- Payment status management
- Team and roster editing
- Schedule and bracket updates
- Admin access approval workflow

## Deployment

Hosted on Firebase Hosting. To deploy:

```bash
# Full deploy
firebase deploy --project iba-website-63cb3

# Hosting only
firebase deploy --only hosting --project iba-website-63cb3

# Functions only
firebase deploy --only functions --project iba-website-63cb3
```

## Environment Setup

Cloud Functions require an Anthropic API key. Create `functions/.env`:

```
ANTHROPIC_API_KEY=your_key_here
```

This file is gitignored and must never be committed.

## Security Notes

- Firebase client-side API keys are intentionally public and scoped by Firebase Security Rules and authorized domains.
- The Anthropic API key is server-side only, stored in `functions/.env`, and never exposed to the client.
- Admin access requires an approved Google account verified against Firestore.

---

**Last Updated:** March 2026
