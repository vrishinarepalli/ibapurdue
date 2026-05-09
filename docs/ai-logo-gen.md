# AI Logo Generation — Team Logos via Pollinations.ai

## Overview
Let team captains generate a logo for their team using AI, based on the team name. Free, no API key required.

## How it works
Pollinations.ai generates images from a prompt URL directly in the browser:
```
https://image.pollinations.ai/prompt/{encoded-prompt}?width=512&height=512&nologo=true
```

No backend needed — the `<img src>` points directly to Pollinations.

## Implementation Plan

### 1. Where to add it
- **Teams screen** — in the team detail panel, below the team header, visible only to the captain (check `user.email === team.captainEmail`)
- Alternatively add it as Step 1.5 in the Register flow after the team name is entered

### 2. Prompt construction
```js
const buildPrompt = (teamName) =>
  encodeURIComponent(
    `basketball team logo for "${teamName}", minimalist flat design, dark background, bold typography, sport emblem style, no text`
  );

const url = `https://image.pollinations.ai/prompt/${buildPrompt(team.name)}?width=512&height=512&nologo=true&seed=${Date.now()}`;
```
Changing `seed` forces a new image on regenerate.

### 3. UI flow
1. Captain sees "Generate Logo" button in team detail panel
2. Click → show spinner, set `<img src>` to Pollinations URL
3. Image loads → show preview with "Regenerate" and "Save Logo" buttons
4. "Save Logo" → fetch the image as a blob → upload to Firebase Storage at `logos/{teamId}.png` → write the download URL back to the team's Firestore doc (`logoUrl` field)

### 4. Firestore change
Add `logoUrl` field to team documents. Display it in the team color swatch spot if present:
```jsx
{team.logoUrl
  ? <img src={team.logoUrl} style={{ width: 96, height: 96, borderRadius: 16, objectFit: "cover" }} />
  : <div style={{ width: 96, height: 96, borderRadius: 16, background: team.color ... }}>{team.short}</div>
}
```

### 5. Firebase Storage rules
```
match /logos/{teamId} {
  allow read: if true;
  allow write: if request.auth != null;
}
```

## Caveats
- Images regenerate each request unless saved to Storage — always save after captain approves
- Quality is inconsistent; add a "Regenerate" button so they can try again
- Pollinations has rate limits but they're generous for occasional use
- No content moderation — consider adding a report/reset option for admins

## Files to touch
- `js/screens/teams.jsx` — add generate/save UI in detail panel
- `js/firebase-config.js` — confirm Firebase Storage is initialized (`window.storage`)
- Firestore `teams` documents — add `logoUrl` field
- Firebase Storage rules — add `/logos` path
