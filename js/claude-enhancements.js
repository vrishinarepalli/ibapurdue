/**
 * ============================================================================
 * CLAUDE AI FRONTEND ENHANCEMENTS
 * ============================================================================
 *
 * Current feature:
 *   - Team creation form: AI team name suggestions informed by past IBA names
 * ============================================================================
 */

import { functions, functionsAPI } from './firebase-config.js';

const callClaude = functionsAPI.httpsCallable(functions, 'claudeAssistant');

// ─── Past IBA team names (used to guide AI suggestions) ──────────────────────
const PAST_TEAM_NAMES = [
  'KOS', 'Swish Kebabs', 'Tandoori Towers', '67 Elite Freaks',
  'BBB', 'ARE 3.0', 'Rasthuggers', 'Lafayette Lakers',
  'BBS', 'Naujawan', 'The Baboons', 'Walmart Oreos',
  'Nav/Sandeep', 'Diko & Co.', 'Tech Support', 'Kareem Puffs',
  'Mutts and Fulls', 'Buckit', 'The Blue Ballers', 'Certified Bucket Getters',
  'Club Ballers', 'Gutti Boys', 'RRN', 'Ja Wick',
  'LeMickey', 'Fuse', 'Hoop', 'Squirt Sisters',
  "Rajesh's Last Dance", 'SAP Center', 'Buzz Ballers', 'LeBronda The Chimps',
  'Zone 6', 'ABOG', 'Vishiepoo', 'Seattleites',
  'Rajesh Returns', 'Brick by Brick', 'Ice Spice Elite', 'Sj in November',
  'Maggi Munchers', 'The Goonies', 'Toyota Beef', '3ps in a Pot',
  'AKI', 'Angel Reese Elite', 'Buleros', 'Three Idiots',
  'Balls', 'AadrijUpad 2.0', 'AadrijUpad', 'Campeones', 'BandarEats',
  'Bay Ballers', 'Madrid Charlies', 'Pipers Rats', 'Lebonbon',
  'Rush', 'The Chimps', 'Rajesh', 'Curry Deo',
  'IBA Champs', 'BoilerBakers', 'Boiler Bucket Squad',
  'Brown Ballers', 'Chillers', 'Diddlers', 'Triple Chocolate Oreo', 'Boiler Bakchods',
  'Brown Boys Elite', 'Team Aura', 'BBK', 'JYE',
  'Golden State Warriors', 'Bucket Getters', 'Dawgs',
  'Momo', 'The Buckets', 'KVSS', 'Snipers',
  'Kesh', 'Pound Town', 'Gits', 'Indy Indians', 'Comeback Szn',
];

// ─── Styles ───────────────────────────────────────────────────────────────────
(function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .claude-ai-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 0.95rem;
      background: linear-gradient(135deg, #f8f5f0, #faf7f2);
      border: 1.5px solid #CFB991;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #0a1122;
      cursor: pointer;
      transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
      box-shadow: 0 1px 4px rgba(207,185,145,0.2);
    }
    .claude-ai-btn:hover:not(:disabled) {
      background: #faf7f2;
      transform: translateY(-1px);
      box-shadow: 0 3px 10px rgba(207,185,145,0.35);
    }
    .claude-ai-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    #claude-name-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
      margin-top: 0.6rem;
    }
    .claude-name-chip {
      padding: 0.35rem 0.85rem;
      background: #fff;
      border: 1.5px solid #CFB991;
      border-radius: 20px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #0a1122;
      cursor: pointer;
      transition: background 0.15s, transform 0.12s;
    }
    .claude-name-chip:hover {
      background: #faf7f2;
      transform: scale(1.04);
    }
    #claude-name-error {
      font-size: 0.82rem;
      color: #888;
      margin-top: 0.4rem;
    }
  `;
  document.head.appendChild(style);
})();

// ─── Team name suggestions ─────────────────────────────────────────────────────
function enhanceTeamName() {
  const teamNameInput = document.getElementById('teamName');
  if (!teamNameInput) return;
  const wrapper = teamNameInput.closest('div') || teamNameInput.parentElement;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'claude-ai-btn';
  btn.style.marginTop = '0.5rem';
  btn.innerHTML = '✨ Suggest team names';

  const chips = document.createElement('div');
  chips.id = 'claude-name-chips';

  const errorEl = document.createElement('div');
  errorEl.id = 'claude-name-error';

  wrapper.appendChild(btn);
  wrapper.appendChild(chips);
  wrapper.appendChild(errorEl);

  btn.addEventListener('click', async () => {
    chips.innerHTML = '';
    errorEl.textContent = '';

    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '✨ Generating…';

    const pastContext = PAST_TEAM_NAMES.length > 0
      ? `Here are some past IBA team names for reference: ${PAST_TEAM_NAMES.join(', ')}. `
      : '';

    try {
      const res = await callClaude({
        message: `${pastContext}Generate exactly 5 basketball team names for a Purdue University intramural league. 4 of them should be short and punchy (1-3 words max, like "KOS", "Buckit", "Swish Kebabs", "Tech Support"). 1 of them should be a longer funny phrase (4-6 words, like "Certified Bucket Getters"). Keep the vibe casual and fun — think group chat humor, Purdue references, food puns, or basketball wordplay. Return only the 5 names, one per line, no numbering or extra text.`
      });

      const names = res.data.reply
        .split('\n')
        .map(n => n.replace(/^[\d.\-\*\s]+/, '').trim())
        .filter(Boolean)
        .slice(0, 5);

      names.forEach(name => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'claude-name-chip';
        chip.textContent = name;
        chip.title = 'Click to use this name';
        chip.addEventListener('click', () => {
          teamNameInput.value = name;
          teamNameInput.focus();
        });
        chips.appendChild(chip);
      });
    } catch (err) {
      if (err?.code === 'functions/resource-exhausted') {
        errorEl.textContent = err.message;
      } else if (err?.code === 'functions/unauthenticated') {
        errorEl.textContent = 'Sign in to use AI name suggestions.';
      } else {
        errorEl.textContent = 'Couldn\'t load suggestions right now.';
      }
    }

    btn.disabled = false;
    btn.innerHTML = original;
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', enhanceTeamName);
} else {
  enhanceTeamName();
}
