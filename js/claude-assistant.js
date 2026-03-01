/**
 * ============================================================================
 * CLAUDE AI ASSISTANT MODULE
 * ============================================================================
 *
 * Floating chat widget that lets users ask the Claude AI assistant questions
 * about the IBA tournament — schedules, teams, rules, brackets, sign-up info.
 *
 * Architecture:
 *   Browser → Firebase callable function (claudeAssistant) → Anthropic Claude API
 *
 * The API key lives only in the Cloud Function; it is never sent to the browser.
 * ============================================================================
 */

import { functions, functionsAPI } from './firebase-config.js';

const callClaude = functionsAPI.httpsCallable(functions, 'claudeAssistant');

// ─── Inject styles ────────────────────────────────────────────────────────────
(function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* ── Floating toggle button ─────────────────────────────────────── */
    #claude-toggle {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9998;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #CFB991, #b8a07a);
      border: none;
      cursor: pointer;
      font-size: 1.5rem;
      box-shadow: 0 4px 20px rgba(207, 185, 145, 0.5);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #claude-toggle:hover {
      transform: scale(1.08) translateY(-2px);
      box-shadow: 0 6px 28px rgba(207, 185, 145, 0.65);
    }
    #claude-toggle.panel-open {
      transform: rotate(45deg) scale(0.9);
    }

    /* ── Chat panel ─────────────────────────────────────────────────── */
    #claude-panel {
      position: fixed;
      bottom: 5.5rem;
      right: 1.5rem;
      z-index: 9999;
      width: 360px;
      max-width: calc(100vw - 2rem);
      height: 480px;
      max-height: calc(100vh - 8rem);
      background: #fff;
      border-radius: 18px;
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.18);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1.5px solid rgba(207, 185, 145, 0.4);
      transform: scale(0.92) translateY(12px);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
                  opacity 0.18s ease;
    }
    #claude-panel.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    /* ── Header ─────────────────────────────────────────────────────── */
    #claude-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1rem;
      background: linear-gradient(135deg, #0a1122, #1a2540);
      color: #CFB991;
      border-bottom: 2px solid #CFB991;
      flex-shrink: 0;
    }
    #claude-header-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      font-size: 0.95rem;
      letter-spacing: 0.3px;
    }
    #claude-header-title .badge {
      font-size: 0.65rem;
      font-weight: 700;
      background: #CFB991;
      color: #0a1122;
      padding: 0.15rem 0.45rem;
      border-radius: 20px;
      letter-spacing: 0.5px;
    }
    #claude-close {
      background: none;
      border: none;
      color: #CFB991;
      cursor: pointer;
      font-size: 1.1rem;
      line-height: 1;
      padding: 0.2rem 0.4rem;
      border-radius: 6px;
      transition: background 0.15s;
    }
    #claude-close:hover { background: rgba(207, 185, 145, 0.15); }

    /* ── Messages area ──────────────────────────────────────────────── */
    #claude-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      background: #f7f8fa;
    }
    #claude-messages::-webkit-scrollbar { width: 4px; }
    #claude-messages::-webkit-scrollbar-track { background: transparent; }
    #claude-messages::-webkit-scrollbar-thumb {
      background: rgba(207, 185, 145, 0.5);
      border-radius: 2px;
    }

    .claude-msg {
      max-width: 86%;
      padding: 0.65rem 0.9rem;
      border-radius: 14px;
      font-size: 0.88rem;
      line-height: 1.5;
      word-wrap: break-word;
      animation: claudeFadeIn 0.18s ease;
    }
    @keyframes claudeFadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .claude-msg-user {
      align-self: flex-end;
      background: linear-gradient(135deg, #CFB991, #b8a07a);
      color: #0a1122;
      font-weight: 500;
      border-bottom-right-radius: 4px;
    }
    .claude-msg-assistant {
      align-self: flex-start;
      background: #fff;
      color: #1a1a1a;
      border: 1px solid #e8e8e8;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .claude-msg-typing {
      align-self: flex-start;
      background: #fff;
      border: 1px solid #e8e8e8;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      display: flex;
      gap: 4px;
      align-items: center;
      padding: 0.65rem 0.9rem;
    }
    .claude-dot {
      width: 7px;
      height: 7px;
      background: #CFB991;
      border-radius: 50%;
      animation: claudeBounce 1.2s infinite ease-in-out;
    }
    .claude-dot:nth-child(2) { animation-delay: 0.2s; }
    .claude-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes claudeBounce {
      0%, 80%, 100% { transform: translateY(0); }
      40%            { transform: translateY(-6px); }
    }

    /* ── Input area ─────────────────────────────────────────────────── */
    #claude-input-area {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem;
      border-top: 1px solid #e8e8e8;
      background: #fff;
      flex-shrink: 0;
    }
    #claude-input {
      flex: 1;
      padding: 0.6rem 0.875rem;
      border: 1.5px solid #ddd;
      border-radius: 24px;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.15s;
      background: #f7f8fa;
    }
    #claude-input:focus { border-color: #CFB991; background: #fff; }
    #claude-input::placeholder { color: #aaa; }
    #claude-send {
      padding: 0.6rem 1rem;
      background: linear-gradient(135deg, #CFB991, #b8a07a);
      color: #0a1122;
      border: none;
      border-radius: 24px;
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.15s;
      white-space: nowrap;
    }
    #claude-send:hover:not(:disabled) { opacity: 0.88; transform: scale(1.04); }
    #claude-send:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Suggestion chips ────────────────────────────────────────────── */
    #claude-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      padding: 0 1rem 0.75rem;
      background: #f7f8fa;
    }
    .claude-chip {
      padding: 0.3rem 0.7rem;
      background: #fff;
      border: 1.5px solid #CFB991;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #0a1122;
      cursor: pointer;
      transition: background 0.15s;
      white-space: nowrap;
    }
    .claude-chip:hover { background: #faf7f2; }

    /* ── Mobile adjustments ─────────────────────────────────────────── */
    @media (max-width: 420px) {
      #claude-panel { right: 0.75rem; width: calc(100vw - 1.5rem); }
      #claude-toggle { right: 0.75rem; bottom: 1rem; }
    }
  `;
  document.head.appendChild(style);
})();

// ─── Widget state ─────────────────────────────────────────────────────────────
let isOpen = false;

// ─── Build widget DOM ─────────────────────────────────────────────────────────
function createWidget() {
  // Toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'claude-toggle';
  toggleBtn.title = 'Ask the IBA Assistant';
  toggleBtn.innerHTML = '🏀';

  // Panel
  const panel = document.createElement('div');
  panel.id = 'claude-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'IBA AI Assistant');
  panel.innerHTML = `
    <div id="claude-header">
      <div id="claude-header-title">
        <span>IBA Assistant</span>
        <span class="badge">AI</span>
      </div>
      <button id="claude-close" aria-label="Close">✕</button>
    </div>
    <div id="claude-messages" role="log" aria-live="polite"></div>
    <div id="claude-suggestions">
      <button class="claude-chip" data-q="When are the next games?">Next games</button>
      <button class="claude-chip" data-q="How do I register my team?">Register team</button>
      <button class="claude-chip" data-q="How does the Gold bracket work?">Gold bracket</button>
      <button class="claude-chip" data-q="What are the fair play rules?">Fair play rules</button>
    </div>
    <div id="claude-input-area">
      <input
        type="text"
        id="claude-input"
        placeholder="Ask about schedules, teams, rules…"
        maxlength="400"
        autocomplete="off"
      />
      <button id="claude-send">Send</button>
    </div>
  `;

  document.body.appendChild(toggleBtn);
  document.body.appendChild(panel);

  // Add initial greeting
  addMessage('assistant',
    "Hi! I'm the IBA Assistant 🏀 Ask me anything about the tournament — schedules, teams, brackets, sign-up, or rules!"
  );

  // ── Event listeners ──
  toggleBtn.addEventListener('click', togglePanel);
  panel.querySelector('#claude-close').addEventListener('click', closePanel);
  panel.querySelector('#claude-send').addEventListener('click', sendMessage);
  panel.querySelector('#claude-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  panel.querySelectorAll('.claude-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      panel.querySelector('#claude-input').value = chip.dataset.q;
      sendMessage();
      // Hide suggestions after first use
      panel.querySelector('#claude-suggestions').style.display = 'none';
    });
  });
}

// ─── Panel open/close ─────────────────────────────────────────────────────────
function togglePanel() {
  isOpen ? closePanel() : openPanel();
}

function openPanel() {
  isOpen = true;
  document.getElementById('claude-panel').classList.add('open');
  document.getElementById('claude-toggle').classList.add('panel-open');
  document.getElementById('claude-input').focus();
}

function closePanel() {
  isOpen = false;
  document.getElementById('claude-panel').classList.remove('open');
  document.getElementById('claude-toggle').classList.remove('panel-open');
}

// ─── Message rendering ────────────────────────────────────────────────────────
function addMessage(role, text) {
  const messagesDiv = document.getElementById('claude-messages');
  const el = document.createElement('div');
  el.className = `claude-msg claude-msg-${role}`;
  el.textContent = text;
  messagesDiv.appendChild(el);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showTyping() {
  const messagesDiv = document.getElementById('claude-messages');
  const el = document.createElement('div');
  el.className = 'claude-msg-typing';
  el.id = 'claude-typing';
  el.innerHTML = '<div class="claude-dot"></div><div class="claude-dot"></div><div class="claude-dot"></div>';
  messagesDiv.appendChild(el);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function removeTyping() {
  document.getElementById('claude-typing')?.remove();
}

// ─── Send message ─────────────────────────────────────────────────────────────
async function sendMessage() {
  const input = document.getElementById('claude-input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  addMessage('user', text);

  // Hide suggestion chips after first real interaction
  const suggestions = document.getElementById('claude-suggestions');
  if (suggestions) suggestions.style.display = 'none';

  const sendBtn = document.getElementById('claude-send');
  sendBtn.disabled = true;
  showTyping();

  try {
    const result = await callClaude({ message: text });
    removeTyping();
    addMessage('assistant', result.data.reply);
  } catch (err) {
    removeTyping();
    const msg = err?.code === 'functions/failed-precondition'
      ? 'The AI assistant isn\'t configured yet. Ask an admin to set the API key.'
      : 'Sorry, I\'m having trouble right now. Try again in a moment!';
    addMessage('assistant', msg);
    console.error('Claude assistant error:', err);
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createWidget);
} else {
  createWidget();
}
