/**
 * File: navigation.logic.js
 * Purpose: Handle tab navigation, hamburger menu, and card navigation animations
 * Scope: Manages tab switching, mobile menu toggling, smooth scrolling, keyboard navigation
 */

export function initNavigation() {
  // Card Navigation Elements
  const cardNav = document.getElementById('cardNav');
  const hamburgerMenu = document.getElementById('hamburgerMenu');
  const cardNavContent = document.getElementById('cardNavContent');
  const navCards = document.querySelectorAll('.nav-card');

  // Tab Navigation Elements
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
  const cardLinks = document.querySelectorAll('.nav-card-link[data-tab]');

  // State
  let isExpanded = false;
  let animationTimeline = null;

  // ============================================================================
  // CARD NAVIGATION ANIMATION (GSAP)
  // ============================================================================

  /**
   * Calculate the expanded height of the card navigation based on viewport size
   */
  function calculateExpandedHeight() {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      // Mobile: stack cards vertically
      const topBarHeight = 60;
      const padding = 16;
      let totalCardHeight = 0;
      navCards.forEach(card => {
        const cardHeight = card.scrollHeight || 100;
        totalCardHeight += cardHeight;
      });
      const gaps = (navCards.length - 1) * 10;
      return topBarHeight + totalCardHeight + gaps + padding;
    } else {
      // Desktop: fixed height
      return 280;
    }
  }

  /**
   * Create GSAP animation timeline for card navigation
   */
  function createTimeline() {
    if (animationTimeline) {
      animationTimeline.kill();
    }

    gsap.set(cardNav, { height: 70, overflow: 'hidden' });
    gsap.set(navCards, { y: 30, opacity: 0 });

    animationTimeline = gsap.timeline({ paused: true });

    animationTimeline.to(cardNav, {
      height: calculateExpandedHeight(),
      duration: 0.4,
      ease: 'power3.out'
    });

    animationTimeline.to(navCards, {
      y: 0,
      opacity: 1,
      duration: 0.4,
      stagger: 0.08,
      ease: 'power3.out'
    }, '-=0.2');

    return animationTimeline;
  }

  /**
   * Toggle the hamburger menu open/closed
   */
  function toggleMenu() {
    if (!animationTimeline) {
      createTimeline();
    }

    if (!isExpanded) {
      hamburgerMenu.classList.add('open');
      cardNav.classList.add('open');
      isExpanded = true;
      animationTimeline.play(0);
    } else {
      hamburgerMenu.classList.remove('open');
      animationTimeline.eventCallback('onReverseComplete', () => {
        cardNav.classList.remove('open');
        isExpanded = false;
      });
      animationTimeline.reverse();
    }
  }

  // ============================================================================
  // TAB NAVIGATION
  // ============================================================================

  /**
   * Activate a specific tab by its ID
   * @param {string} tabId - The ID of the tab button to activate
   */
  function activateTab(tabId) {
    const tab = document.getElementById(tabId);
    if (!tab) return;

    // Deactivate all tabs and panels
    tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
    panels.forEach(p => p.classList.remove('active'));

    // Activate selected tab and panel
    tab.setAttribute('aria-selected', 'true');
    const panelId = tab.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.classList.add('active');
    }

    // Close menu after selection (mobile)
    if (isExpanded) {
      toggleMenu();
    }
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  // Initialize on load
  window.addEventListener('load', () => {
    createTimeline();
  });

  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (isExpanded) {
        gsap.set(cardNav, { height: calculateExpandedHeight() });
      }
      createTimeline();
      if (isExpanded) {
        animationTimeline.progress(1);
      }
    }, 250);
  });

  // Hamburger menu click
  if (hamburgerMenu) {
    hamburgerMenu.addEventListener('click', toggleMenu);
  }

  // Card link clicks
  cardLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const tabId = link.getAttribute('data-tab');
      if (tabId) {
        e.preventDefault();
        activateTab(tabId);

        // Smooth scroll to content
        setTimeout(() => {
          const tabsElement = document.querySelector('.tabs');
          if (tabsElement) {
            tabsElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }, 100);
      }
    });
  });

  // Tab button clicks
  tabs.forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab.id));

    // Keyboard navigation (arrow keys)
    tab.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(tab);
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        activateTab(tabs[(i + 1) % tabs.length].id);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        activateTab(tabs[(i - 1 + tabs.length) % tabs.length].id);
      }
    });
  });

  console.log('✅ Navigation initialized');
}
