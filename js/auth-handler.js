/**
 * ============================================================================
 * AUTHENTICATION HANDLER MODULE
 * ============================================================================
 *
 * Handles user authentication state and UI updates for the navigation
 */

import { isApprovedAdmin } from './admin-check.js';

export async function initializeAuthListener() {
  const { onAuthStateChanged, signOut } = window.authImports;
  const { doc, getDoc } = window.firestoreImports;
  const auth = window.auth;
  const db = window.db;

  onAuthStateChanged(auth, async (user) => {
    const loginLink = document.getElementById('loginLink');
    const userProfileChip = document.getElementById('userProfileChip');
    const userDisplayName = document.getElementById('userDisplayName');
    const notificationsIcon = document.getElementById('notificationsIcon');
    const myTeamsTab = document.getElementById('tab-myteams');

    // Card navigation elements
    const navSignInBtn = document.getElementById('navSignInBtn');
    const navUserProfile = document.getElementById('navUserProfile');
    const navUserAvatar = document.getElementById('navUserAvatar');
    const navUserButton = document.getElementById('navUserButton');
    const navUserDropdown = document.getElementById('navUserDropdown');
    const navSignOutBtn = document.getElementById('navSignOutBtn');

    console.log('🔐 Auth state changed. User:', user ? user.email : 'Not signed in');
    console.log('Nav elements found:', { navSignInBtn: !!navSignInBtn, navUserProfile: !!navUserProfile, navUserAvatar: !!navUserAvatar });
    console.log('Other elements found:', { loginLink: !!loginLink, userProfileChip: !!userProfileChip, userDisplayName: !!userDisplayName });

    if (user) {
      // User is signed in
      console.log('✅ User is signed in:', user.email);
      if (loginLink) loginLink.style.display = 'none';
      if (userProfileChip) userProfileChip.style.display = 'block';
      if (userDisplayName) userDisplayName.textContent = user.displayName || user.email.split('@')[0];

      // Show user profile in card navigation
      if (navSignInBtn) {
        navSignInBtn.style.display = 'none';
        console.log('Hidden sign in button');
      }
      if (navUserProfile) {
        navUserProfile.style.display = 'flex';
        console.log('Showing user profile');
      }
      if (navUserAvatar) {
        // Use Google profile photo if available, otherwise use a default avatar
        const avatarUrl = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email.split('@')[0])}&background=CFB991&color=fff&size=128`;
        navUserAvatar.src = avatarUrl;
        navUserAvatar.alt = user.displayName || user.email;
        console.log('Set avatar URL:', avatarUrl);
      }

      // Toggle dropdown when user button is clicked
      if (navUserButton) {
        navUserButton.onclick = (e) => {
          e.stopPropagation();
          if (navUserDropdown) {
            const isVisible = navUserDropdown.style.display === 'block';
            navUserDropdown.style.display = isVisible ? 'none' : 'block';
          }
        };
      }

      // Close dropdown when clicking outside
      if (navUserDropdown) {
        document.addEventListener('click', (e) => {
          if (navUserDropdown && !navUserProfile.contains(e.target)) {
            navUserDropdown.style.display = 'none';
          }
        });
      }

      // Profile button - navigate to profile page
      const navProfileBtn = document.getElementById('navProfileBtn');
      if (navProfileBtn) {
        navProfileBtn.onclick = () => {
          window.location.href = 'profile.html';
        };
      }

      // Sign out button
      if (navSignOutBtn) {
        navSignOutBtn.onclick = async () => {
          try {
            await signOut(auth);
            console.log('✅ Signed out successfully');
            window.location.href = 'index.html';
          } catch (error) {
            console.error('Error signing out:', error);
          }
        };
      }

      // Click to go to profile page
      if (userProfileChip) {
        userProfileChip.onclick = () => {
          window.location.href = 'profile.html';
        };
      }

      // Check if user has player role and admin privileges
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        // Check if user is an approved admin (fetched from Firestore)
        const isAdmin = await isApprovedAdmin(user.email);
        console.log('Is admin check:', { email: user.email, isAdmin });

        // Show/hide admin button and admin-only elements based on admin status
        const adminBtn = document.getElementById('adminBtn');
        const adminRequestsTab = document.getElementById('tab-adminrequests');

        if (adminBtn) {
          if (isAdmin) {
            adminBtn.style.display = 'flex';
            console.log('✅ User is admin - showing admin button');

            // Show admin requests tab
            if (adminRequestsTab) {
              adminRequestsTab.style.display = 'block';
            }
          } else {
            adminBtn.style.display = 'none';
            console.log('❌ User is not admin - hiding admin button');

            // Hide admin requests tab
            if (adminRequestsTab) {
              adminRequestsTab.style.display = 'none';
            }
          }
        }

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const roles = userData.roles || [];

          // Show player-only elements if user has player role
          if (roles.includes('player')) {
            if (myTeamsTab) myTeamsTab.style.display = 'block';
            if (notificationsIcon) notificationsIcon.style.display = 'block';

            // Store current user data globally for team management
            window.currentUserData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              roles: roles,
              isAdmin: isAdmin
            };
          }
        }
      } catch (error) {
        console.error('Error checking user roles:', error);
      }
    } else {
      // User is signed out
      console.log('❌ User is signed out');
      if (loginLink) loginLink.style.display = 'block';
      if (userProfileChip) userProfileChip.style.display = 'none';
      if (myTeamsTab) myTeamsTab.style.display = 'none';
      if (notificationsIcon) notificationsIcon.style.display = 'none';
      window.currentUserData = null;

      // Hide admin button when signed out
      const adminBtn = document.getElementById('adminBtn');
      if (adminBtn) {
        adminBtn.style.display = 'none';
      }

      // Show sign in button in card navigation
      if (navSignInBtn) {
        navSignInBtn.style.display = 'block';
        console.log('Showing sign in button');
      }
      if (navUserProfile) {
        navUserProfile.style.display = 'none';
        console.log('Hidden user profile');
      }
    }
  });
}
