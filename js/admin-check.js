/**
 * ============================================================================
 * ADMIN CHECK MODULE
 * ============================================================================
 *
 * Checks if a user is an approved admin by querying Firestore
 * NO HARDCODED EMAILS - Everything comes from the database
 */

/**
 * Check if a user email is in the approved_admins collection
 * @param {string} email - User's email address
 * @returns {Promise<boolean>} - True if user is an approved admin
 */
export async function isApprovedAdmin(email) {
  try {
    if (!email || !window.db || !window.firestoreImports) {
      return false;
    }

    const { collection, query, where, getDocs } = window.firestoreImports;

    // Query approved_admins collection for this email
    const approvedAdminsQuery = query(
      collection(window.db, 'approved_admins'),
      where('email', '==', email)
    );

    const snapshot = await getDocs(approvedAdminsQuery);

    if (!snapshot.empty) {
      console.log('✅ User is approved admin (from approved_admins collection):', email);
      return true;
    }

    // Also check admin_requests collection for approved requests
    const { doc, getDoc } = window.firestoreImports;
    const userUid = window.auth?.currentUser?.uid;

    if (userUid) {
      const requestDoc = await getDoc(doc(window.db, 'admin_requests', userUid));
      if (requestDoc.exists() && requestDoc.data().status === 'approved') {
        console.log('✅ User is approved admin (from admin_requests):', email);
        return true;
      }
    }

    console.log('❌ User is not an approved admin:', email);
    return false;

  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get all approved admin emails from Firestore
 * @returns {Promise<string[]>} - Array of approved admin emails
 */
export async function getApprovedAdmins() {
  try {
    if (!window.db || !window.firestoreImports) {
      return [];
    }

    const { collection, getDocs } = window.firestoreImports;
    const snapshot = await getDocs(collection(window.db, 'approved_admins'));

    const adminEmails = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email) {
        adminEmails.push(data.email);
      }
    });

    return adminEmails;

  } catch (error) {
    console.error('Error fetching approved admins:', error);
    return [];
  }
}
