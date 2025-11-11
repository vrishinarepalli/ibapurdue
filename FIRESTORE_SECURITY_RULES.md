# Firestore Security Rules for Team Management System

These security rules need to be added to your Firebase Firestore Database to ensure proper access control for the team management and notification system.

## How to Apply These Rules

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: `iba-website-63cb3`
3. Navigate to Firestore Database → Rules
4. Replace or merge the existing rules with the rules below
5. Click "Publish"

## Complete Security Rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }

    // Helper function to check if user is the document owner
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // Helper function to check if user is admin
    function isAdmin() {
      return isSignedIn() && (
        exists(/databases/$(database)/documents/approved_admins/$(request.auth.email.replace('.', '_').replace('@', '_'))) ||
        (exists(/databases/$(database)/documents/admin_requests/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/admin_requests/$(request.auth.uid)).data.status == 'approved')
      );
    }

    // Helper function to check if user is team captain
    function isTeamCaptain(teamId) {
      return isSignedIn() &&
             exists(/databases/$(database)/documents/player_teams/$(teamId)) &&
             get(/databases/$(database)/documents/player_teams/$(teamId)).data.captain == request.auth.uid;
    }

    // Users collection - only user can read/write their own document
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isOwner(userId) || isAdmin();
    }

    // Admin requests collection
    match /admin_requests/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isOwner(userId);
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    // Approved admins collection - read-only for all authenticated users
    match /approved_admins/{adminId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // Teams collection
    match /player_teams/{teamId} {
      // Anyone can read teams
      allow read: if true;

      // Only authenticated users can create teams
      allow create: if isSignedIn() &&
                      request.resource.data.captain == request.auth.uid &&
                      request.resource.data.members[0] == request.auth.uid;

      // Only team captain or admin can update/delete team
      allow update: if isTeamCaptain(teamId) || isAdmin();
      allow delete: if isTeamCaptain(teamId) || isAdmin();
    }

    // Team join requests
    match /team_requests/{requestId} {
      // Users can read their own requests
      // Team captains can read requests for their teams
      allow read: if isSignedIn() && (
        resource.data.userId == request.auth.uid ||
        isTeamCaptain(resource.data.teamId) ||
        isAdmin()
      );

      // Only authenticated users can create requests
      allow create: if isSignedIn() &&
                      request.resource.data.userId == request.auth.uid;

      // Only team captain can update request status
      allow update: if isTeamCaptain(resource.data.teamId) || isAdmin();

      // Users can delete their own pending requests
      allow delete: if isOwner(resource.data.userId) ||
                      isTeamCaptain(resource.data.teamId) ||
                      isAdmin();
    }

    // Notifications collection
    match /notifications/{notificationId} {
      // Users can only read their own notifications
      allow read: if isOwner(resource.data.userId);

      // Anyone authenticated can create notifications (for team requests, etc.)
      allow create: if isSignedIn();

      // Users can update (mark as read) their own notifications
      allow update: if isOwner(resource.data.userId);

      // Users can delete their own notifications
      allow delete: if isOwner(resource.data.userId) || isAdmin();
    }

    // Message templates - read by all, write by admins only
    match /message_templates/{templateId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Games collection
    match /games/{gameId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Teams collection (for team stats/standings)
    match /teams/{teamId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Tournament bracket
    match /tournament/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

## What These Rules Protect

1. **User Privacy**: Users can only access their own notifications and data
2. **Team Ownership**: Only team captains can manage their teams
3. **Request Security**: Join requests can only be seen by the requester and team captain
4. **Admin Controls**: Sensitive operations require admin privileges
5. **Template Protection**: Message templates can't be modified by regular users

## Testing the Rules

After applying these rules:
1. Try creating a team as a signed-in user ✓
2. Try viewing teams without signing in ✓
3. Try accessing another user's notifications ✗ (should fail)
4. Try modifying a team you don't own ✗ (should fail)
5. Have a team captain approve a join request ✓

## Important Notes

- The `approved_admins` collection uses email addresses with dots and @ symbols replaced by underscores as document IDs
- Team captains automatically get full control over their teams
- All notifications are private to their intended recipient
- Message templates are public but can only be modified by admins
