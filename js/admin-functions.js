/**
 * ============================================================================
 * ADMIN FUNCTIONS MODULE
 * ============================================================================
 *
 * Handles admin-specific functionality:
 * - Admin mode toggle
 * - CRUD operations for games and teams
 * - Quick add functionality
 */

export function initializeAdminFunctions() {
  console.log('🔐 Initializing admin functions module');

  const adminBtn = document.getElementById('adminBtn');
  let isAdminMode = false;

  /**
   * Enable admin mode
   */
  function enableAdminMode() {
    isAdminMode = true;
    document.body.classList.add('admin-mode');
    adminBtn.textContent = 'Exit Admin';
    adminBtn.style.background = 'var(--success)';
    document.querySelectorAll('thead th:last-child').forEach(th => th.style.display = '');
    document.querySelectorAll('.admin-mode').forEach(el => el.style.display = 'block');
    const quickAddSection = document.querySelector('.quick-add-section');
    if (quickAddSection) quickAddSection.style.display = 'block';
    const bulkImportBtn = document.getElementById('bulkImportBracketBtn');
    if (bulkImportBtn) bulkImportBtn.style.display = 'block';
    console.log('✅ Admin mode enabled');
  }

  /**
   * Disable admin mode
   */
  function disableAdminMode() {
    isAdminMode = false;
    document.body.classList.remove('admin-mode');
    adminBtn.textContent = 'Admin';
    adminBtn.style.background = 'var(--brand)';
    document.querySelectorAll('thead th:last-child').forEach(th => th.style.display = 'none');
    document.querySelectorAll('.admin-mode').forEach(el => el.style.display = 'none');
    const quickAddSection = document.querySelector('.quick-add-section');
    if (quickAddSection) quickAddSection.style.display = 'none';
    const bulkImportBtn = document.getElementById('bulkImportBracketBtn');
    if (bulkImportBtn) bulkImportBtn.style.display = 'none';
    console.log('❌ Admin mode disabled');
  }

  /**
   * Toggle admin mode
   */
  function toggleAdminMode() {
    if (isAdminMode) {
      disableAdminMode();
    } else {
      enableAdminMode();
    }
  }

  // Admin button click handler
  if (adminBtn) {
    adminBtn.addEventListener('click', toggleAdminMode);
  }

  // Export admin functions
  window.adminFunctions = {
    isAdminMode: () => isAdminMode,
    enableAdminMode,
    disableAdminMode,
    toggleAdminMode
  };

  // Make logout function global
  window.adminLogout = disableAdminMode;
}
