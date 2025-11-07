/**
 * ============================================================================
 * NAVIGATION MODULE
 * ============================================================================
 *
 * Handles card navigation functionality:
 * - Hamburger menu toggle
 * - Tab switching
 * - Smooth scrolling
 */

export function initializeNavigation() {
  console.log('🧭 Initializing navigation module');

  const hamburger = document.getElementById('hamburger');
  const cardNav = document.getElementById('cardNav');
  const navLinks = document.querySelectorAll('.nav-card-link');

  /**
   * Toggle card navigation
   */
  function toggleNav() {
    const isOpen = cardNav.classList.contains('active');
    if (isOpen) {
      cardNav.classList.remove('active');
      hamburger.classList.remove('active');
    } else {
      cardNav.classList.add('active');
      hamburger.classList.add('active');
    }
  }

  /**
   * Close navigation
   */
  function closeNav() {
    cardNav.classList.remove('active');
    hamburger.classList.remove('active');
  }

  /**
   * Switch to a specific tab
   */
  function switchToTab(tabId) {
    // Hide all panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    // Remove active from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });

    // Show selected panel
    const panel = document.getElementById(`panel-${tabId.replace('tab-', '')}`);
    if (panel) {
      panel.classList.add('active');
    }

    // Mark tab as active
    const tab = document.getElementById(tabId);
    if (tab) {
      tab.classList.add('active');
    }
  }

  // Hamburger menu toggle
  if (hamburger) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNav();
    });
  }

  // Navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.dataset.tab;
      if (tabId) {
        switchToTab(tabId);
        closeNav();
      }
    });
  });

  // Close nav when clicking outside
  document.addEventListener('click', (e) => {
    if (cardNav && !cardNav.contains(e.target) && !hamburger.contains(e.target)) {
      closeNav();
    }
  });

  // Tab navigation
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchToTab(tab.id);
    });
  });

  // Export navigation functions
  window.navigation = {
    toggleNav,
    closeNav,
    switchToTab
  };
}
