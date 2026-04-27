import { saveUserProfile, deleteUserAccount } from '../lib/supabase.js';

const VICE_OPTIONS = [
  { key: 'smoking',      label: 'Smoking',      icon: 'fa-smoking'        },
  { key: 'alcohol',      label: 'Alcohol',      icon: 'fa-wine-bottle'    },
  { key: 'gambling',     label: 'Gambling',     icon: 'fa-dice'           },
  { key: 'junk_food',    label: 'Junk Food',    icon: 'fa-burger'         },
  { key: 'social_media', label: 'Social Media', icon: 'fa-mobile-screen'  },
];

// Vices that support usage stats (cost + quantity tracking)
const QUANTITY_VICES = ['smoking', 'alcohol'];

// Per-vice copy for the usage fields
const VICE_USAGE_COPY = {
  smoking: {
    amountLabel: 'Cigarettes per day',
    sizeLabel:   'Cigarettes per pack',
    costLabel:   'Cost per pack',
    amountHint:  'How many cigarettes do you smoke daily?',
    sizeHint:    'Standard pack = 20. King size = 25.',
    costHint:    'Price of one pack in your currency.',
  },
  alcohol: {
    amountLabel: 'Drinks per day',
    sizeLabel:   'Drinks per bottle / case',
    costLabel:   'Cost per bottle / case',
    amountHint:  'Average number of drinks you have each day.',
    sizeHint:    'e.g. 6 for a six-pack, 1 for a single bottle.',
    costHint:    'Price of that unit in your currency.',
  },
};

const INTEREST_OPTIONS = [
  { key: 'anxiety',    label: 'Anxiety & Health Anxiety', icon: 'fa-brain'         },
  { key: 'fitness',    label: 'Fitness & Strength',       icon: 'fa-dumbbell'      },
  { key: 'mindset',    label: 'Mindset & Discipline',     icon: 'fa-fire'          },
  { key: 'sleep',      label: 'Sleep & Recovery',         icon: 'fa-moon'          },
  { key: 'journaling', label: 'Journaling & Gratitude',   icon: 'fa-pen-to-square' },
  { key: 'breathing',  label: 'Breathing & Meditation',   icon: 'fa-spa'           },
];

// ─── Render ───────────────────────────────────────────────────
export function renderAccountSettings(profile) {
  const vices      = profile?.vices      || [];
  const interests  = profile?.interests  || [];
  const username   = profile?.username   || '';
  const hasAnxiety = profile?.has_anxiety;

  // Vice quit data
  const quitDate    = profile?.vice_quit_date    ? profile.vice_quit_date.split('T')[0] : _todayStr();
  const dailyAmount = profile?.vice_daily_amount ?? '';
  const packSize    = profile?.vice_pack_size    ?? '';
  const packCost    = profile?.vice_pack_cost    ?? '';
  const hasCommit   = !!profile?.vice_quit_date;

  // Determine which usage copy to show (first vice with quantity support)
  const primaryVice    = vices.find((v) => QUANTITY_VICES.includes(v)) || null;
  const usageCopy      = primaryVice ? VICE_USAGE_COPY[primaryVice] : null;
  const hasVice        = vices.length > 0;

  return `
    <div id="settings-overlay"
      class="fixed inset-0 z-50 bg-navy-900/95 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-4">

      <div class="w-full max-w-md bg-navy-600 rounded-2xl border border-slate-700/50 shadow-2xl my-4 animate-slide-up">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <h2 class="text-white font-bold text-lg flex items-center gap-2">
            <i class="fa-solid fa-gear text-indigo-400"></i>
            Account Settings
          </h2>
          <button id="settings-close"
            class="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/50">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div class="p-5 space-y-6">

          <!-- ── Username ─────────────────────────────────────── -->
          <div>
            <label class="form-label">Name / Callsign</label>
            <input id="settings-username" type="text" maxlength="24"
              value="${escapeAttr(username)}"
              placeholder="e.g. Alex, Ghost, Warrior..."
              class="input-field" />
            <p class="text-slate-600 text-xs mt-1.5">This is how the app addresses you.</p>
          </div>

          <!-- ── Anxiety preference ────────────────────────────── -->
          <div>
            <p class="text-white text-sm font-medium mb-3">
              <i class="fa-solid fa-brain text-indigo-400 mr-2"></i>
              Anxiety or health anxiety?
            </p>
            <div class="flex gap-3">
              <button id="settings-anxiety-yes"
                class="settings-anxiety-btn flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors
                       ${hasAnxiety === true
                         ? 'bg-indigo-600 border-indigo-500 text-white'
                         : 'bg-slate-700/60 border-slate-600 text-slate-400 hover:border-indigo-500/50'}">
                <i class="fa-solid fa-check mr-1.5"></i>Yes
              </button>
              <button id="settings-anxiety-no"
                class="settings-anxiety-btn flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors
                       ${hasAnxiety === false
                         ? 'bg-slate-600 border-slate-500 text-white'
                         : 'bg-slate-700/60 border-slate-600 text-slate-400 hover:border-slate-500'}">
                <i class="fa-solid fa-xmark mr-1.5"></i>No
              </button>
            </div>
            <p id="settings-anxiety-hint" class="text-slate-500 text-xs mt-1.5">
              ${hasAnxiety === true  ? 'Vault = anxiety tracking &amp; evidence log.'
              : hasAnxiety === false ? 'Vault = journaling &amp; gratitude space.'
              :                       'Affects how your Symptom Vault is framed.'}
            </p>
          </div>

          <!-- ── Vices ─────────────────────────────────────────── -->
          <div>
            <p class="text-white text-sm font-medium mb-1">
              <i class="fa-solid fa-triangle-exclamation text-amber-400 mr-2"></i>
              Habits to break
              <span class="text-slate-500 font-normal">(affects Daily Five &amp; Learn tab)</span>
            </p>
            <p class="text-slate-500 text-xs mb-3">
              Your vice habit tracker and quit-support content will update to match.
              Only the first selected vice shows as a habit tracker.
            </p>
            <div class="flex flex-wrap gap-2">
              ${VICE_OPTIONS.map((v) => `
                <button class="settings-vice-btn px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5
                               ${vices.includes(v.key)
                                 ? 'bg-red-500/20 border-red-500/40 text-red-300'
                                 : 'bg-slate-700/40 border-slate-600/50 text-slate-400 hover:border-slate-500'}"
                  data-key="${v.key}">
                  <i class="fa-solid ${v.icon} text-xs"></i>${v.label}
                </button>`).join('')}
            </div>
          </div>

          <!-- ── Vice Quit Commitment ──────────────────────────── -->
          <div id="settings-quit-section" class="${hasVice ? '' : 'hidden'}">
            <div class="bg-navy-700/60 border border-slate-700/50 rounded-2xl p-4 space-y-4">

              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <i class="fa-solid fa-person-running text-emerald-400 text-xs"></i>
                </div>
                <div>
                  <p class="text-white text-sm font-semibold">Commit to Quit</p>
                  <p class="text-slate-400 text-xs">
                    ${hasCommit
                      ? 'You&apos;re committed — update your quit date or usage details below.'
                      : 'Set your quit start date to unlock real-time progress tracking.'}
                  </p>
                </div>
              </div>

              <!-- Quit date -->
              <div>
                <label class="form-label">Quit start date</label>
                <input id="settings-quit-date" type="date"
                  value="${quitDate}"
                  max="${_todayStr()}"
                  class="input-field" />
                <p class="text-slate-500 text-xs mt-1">Can be today or a past date.</p>
              </div>

              <!-- Usage details — only for smoking / alcohol -->
              <div id="settings-usage-fields" class="${usageCopy ? '' : 'hidden'} space-y-3">

                <div class="h-px bg-slate-700/50"></div>
                <p class="text-slate-400 text-xs font-medium uppercase tracking-wider">Usage before quitting</p>

                <div>
                  <label class="form-label" id="settings-amount-label">${usageCopy?.amountLabel ?? ''}</label>
                  <input id="settings-daily-amount" type="number" min="0" step="1"
                    value="${dailyAmount}"
                    placeholder="e.g. 10"
                    class="input-field" />
                  <p class="text-slate-500 text-xs mt-1" id="settings-amount-hint">${usageCopy?.amountHint ?? ''}</p>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="form-label" id="settings-size-label">${usageCopy?.sizeLabel ?? ''}</label>
                    <input id="settings-pack-size" type="number" min="1" step="1"
                      value="${packSize}"
                      placeholder="e.g. 20"
                      class="input-field" />
                    <p class="text-slate-500 text-xs mt-1" id="settings-size-hint">${usageCopy?.sizeHint ?? ''}</p>
                  </div>
                  <div>
                    <label class="form-label" id="settings-cost-label">${usageCopy?.costLabel ?? ''}</label>
                    <input id="settings-pack-cost" type="number" min="0" step="0.01"
                      value="${packCost}"
                      placeholder="e.g. 12.50"
                      class="input-field" />
                    <p class="text-slate-500 text-xs mt-1" id="settings-cost-hint">${usageCopy?.costHint ?? ''}</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <!-- ── Interests ──────────────────────────────────────── -->
          <div>
            <p class="text-white text-sm font-medium mb-3">
              <i class="fa-solid fa-book text-amber-400 mr-2"></i>
              Learning interests
              <span class="text-slate-500 font-normal">(affects Learn tab content)</span>
            </p>
            <div class="grid grid-cols-2 gap-2">
              ${INTEREST_OPTIONS.map((opt) => `
                <button class="settings-interest-btn text-left px-3 py-2.5 rounded-xl text-sm border transition-colors flex items-start gap-2
                               ${interests.includes(opt.key)
                                 ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                                 : 'bg-slate-700/40 border-slate-600/50 text-slate-400 hover:border-slate-500'}"
                  data-key="${opt.key}">
                  <i class="fa-solid ${opt.icon} mt-0.5 flex-shrink-0 text-xs"></i>
                  <span class="font-medium text-xs leading-tight">${opt.label}</span>
                </button>`).join('')}
            </div>
          </div>

          <div id="settings-error" class="hidden text-red-400 text-sm text-center"></div>

          <!-- ── Save ───────────────────────────────────────────── -->
          <button id="settings-save"
            class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed">
            <span id="settings-save-text"><i class="fa-solid fa-check mr-2"></i>Save Changes</span>
            <span id="settings-save-spinner" class="hidden"><i class="fa-solid fa-circle-notch fa-spin"></i></span>
          </button>

          <!-- ── Danger Zone ────────────────────────────────────── -->
          <div class="border-t border-slate-700/50 pt-4">
            <p class="text-slate-500 text-xs font-medium uppercase tracking-wider mb-3">Danger Zone</p>
            <button id="settings-delete-account"
              class="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50
                     text-red-400 hover:text-red-300 font-semibold py-3 rounded-xl transition-colors text-sm">
              <i class="fa-solid fa-trash-can mr-2"></i>Delete Account &amp; All Data
            </button>
            <p class="text-slate-600 text-xs mt-1.5 text-center">Permanently erases everything. Cannot be undone.</p>
          </div>

        </div>
      </div>
    </div>
  `;
}

// ─── Init ─────────────────────────────────────────────────────
export function initAccountSettings(userId, currentProfile, onSave) {
  const state = {
    hasAnxiety:      currentProfile?.has_anxiety ?? null,
    vices:           [...(currentProfile?.vices     || [])],
    interests:       [...(currentProfile?.interests || [])],
  };

  // ── Close ───────────────────────────────────────────────────
  const close = () => document.getElementById('settings-overlay')?.remove();

  document.getElementById('settings-close')?.addEventListener('click', close);
  document.getElementById('settings-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'settings-overlay') close();
  });

  // ── Delete account ───────────────────────────────────────────
  document.getElementById('settings-delete-account')?.addEventListener('click', () => {
    // Remove any stale modal first, then inject a fresh one
    document.getElementById('delete-confirm-overlay')?.remove();
    document.body.insertAdjacentHTML('beforeend', renderDeleteConfirmModal());
    initDeleteConfirmModal(userId);
  });

  // ── Anxiety toggles ─────────────────────────────────────────
  const yesBtn = document.getElementById('settings-anxiety-yes');
  const noBtn  = document.getElementById('settings-anxiety-no');
  const hint   = document.getElementById('settings-anxiety-hint');

  function applyAnxiety(val) {
    state.hasAnxiety = val;
    yesBtn.className = `settings-anxiety-btn flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
      val === true
        ? 'bg-indigo-600 border-indigo-500 text-white'
        : 'bg-slate-700/60 border-slate-600 text-slate-400 hover:border-indigo-500/50'}`;
    noBtn.className = `settings-anxiety-btn flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
      val === false
        ? 'bg-slate-600 border-slate-500 text-white'
        : 'bg-slate-700/60 border-slate-600 text-slate-400 hover:border-slate-500'}`;
    if (hint) hint.textContent =
      val === true  ? 'Vault = anxiety tracking & evidence log.'
      : val === false ? 'Vault = journaling & gratitude space.'
      :                 'Affects how your Symptom Vault is framed.';
  }

  yesBtn?.addEventListener('click', () => applyAnxiety(true));
  noBtn?.addEventListener('click',  () => applyAnxiety(false));

  // ── Vice toggles + quit section visibility ───────────────────
  function updateQuitSection() {
    const quitSection  = document.getElementById('settings-quit-section');
    const usageFields  = document.getElementById('settings-usage-fields');
    if (!quitSection) return;

    // Show quit section if any vice is selected
    quitSection.classList.toggle('hidden', state.vices.length === 0);

    // Show usage fields if the first vice is smoking/alcohol
    const primaryVice = state.vices.find((v) => QUANTITY_VICES.includes(v));
    const copy        = primaryVice ? VICE_USAGE_COPY[primaryVice] : null;

    if (usageFields) {
      usageFields.classList.toggle('hidden', !copy);
      if (copy) {
        const lbl = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
        lbl('settings-amount-label', copy.amountLabel);
        lbl('settings-amount-hint',  copy.amountHint);
        lbl('settings-size-label',   copy.sizeLabel);
        lbl('settings-size-hint',    copy.sizeHint);
        lbl('settings-cost-label',   copy.costLabel);
        lbl('settings-cost-hint',    copy.costHint);
      }
    }
  }

  document.querySelectorAll('.settings-vice-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const idx = state.vices.indexOf(key);
      if (idx >= 0) {
        state.vices.splice(idx, 1);
        btn.className = btn.className
          .replace('bg-red-500/20 border-red-500/40 text-red-300', 'bg-slate-700/40 border-slate-600/50 text-slate-400');
      } else {
        state.vices.push(key);
        btn.className = btn.className
          .replace('bg-slate-700/40 border-slate-600/50 text-slate-400', 'bg-red-500/20 border-red-500/40 text-red-300');
      }
      updateQuitSection();
    });
  });

  // ── Interest toggles ─────────────────────────────────────────
  document.querySelectorAll('.settings-interest-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const idx = state.interests.indexOf(key);
      if (idx >= 0) {
        state.interests.splice(idx, 1);
        btn.className = btn.className
          .replace('bg-indigo-600/20 border-indigo-500/50 text-indigo-300', 'bg-slate-700/40 border-slate-600/50 text-slate-400');
      } else {
        state.interests.push(key);
        btn.className = btn.className
          .replace('bg-slate-700/40 border-slate-600/50 text-slate-400', 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300');
      }
    });
  });

  // ── Save ────────────────────────────────────────────────────
  document.getElementById('settings-save')?.addEventListener('click', async () => {
    const saveBtn     = document.getElementById('settings-save');
    const saveText    = document.getElementById('settings-save-text');
    const saveSpinner = document.getElementById('settings-save-spinner');
    const errEl       = document.getElementById('settings-error');

    const username = document.getElementById('settings-username')?.value.trim() || null;
    if (username !== null && username.length < 2) {
      errEl.textContent = 'Name must be at least 2 characters.';
      errEl.classList.remove('hidden');
      return;
    }

    // Collect quit fields (only when quit section is visible)
    const quitSection = document.getElementById('settings-quit-section');
    let viceQuitDate    = undefined;
    let viceDailyAmount = undefined;
    let vicePackSize    = undefined;
    let vicePackCost    = undefined;

    if (quitSection && !quitSection.classList.contains('hidden')) {
      const dateVal = document.getElementById('settings-quit-date')?.value;
      if (dateVal) {
        // Store as ISO datetime at midnight UTC
        viceQuitDate = new Date(dateVal + 'T00:00:00.000Z').toISOString();
      }

      const usageFields = document.getElementById('settings-usage-fields');
      if (usageFields && !usageFields.classList.contains('hidden')) {
        const da = parseFloat(document.getElementById('settings-daily-amount')?.value);
        const ps = parseFloat(document.getElementById('settings-pack-size')?.value);
        const pc = parseFloat(document.getElementById('settings-pack-cost')?.value);
        if (!isNaN(da)) viceDailyAmount = da;
        if (!isNaN(ps)) vicePackSize    = ps;
        if (!isNaN(pc)) vicePackCost    = pc;
      }
    }

    saveBtn.disabled = true;
    saveText.classList.add('hidden');
    saveSpinner.classList.remove('hidden');
    errEl.classList.add('hidden');

    const updates = {
      username,
      vices:             state.vices.length     ? state.vices : null,
      interests:         state.interests.length ? state.interests : null,
      has_anxiety:       state.hasAnxiety       ?? null,
      vice_quit_date:    viceQuitDate,
      vice_daily_amount: viceDailyAmount,
      vice_pack_size:    vicePackSize,
      vice_pack_cost:    vicePackCost,
    };

    try {
      await saveUserProfile(userId, updates);
      close();
      onSave(updates);
    } catch (err) {
      console.error('[Settings] Save failed:', err);
      errEl.textContent = 'Failed to save. Please try again.';
      errEl.classList.remove('hidden');
      saveBtn.disabled = false;
      saveText.classList.remove('hidden');
      saveSpinner.classList.add('hidden');
    }
  });
}

// ─── Delete-account confirmation modal ────────────────────────
function renderDeleteConfirmModal() {
  return `
    <div id="delete-confirm-overlay"
      class="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="w-full max-w-sm bg-navy-600 rounded-2xl border border-red-500/30 shadow-2xl p-5 animate-slide-up">

        <!-- Header -->
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-triangle-exclamation text-red-400"></i>
          </div>
          <div>
            <h3 class="text-white font-bold">Delete Account</h3>
            <p class="text-slate-400 text-xs">This cannot be undone</p>
          </div>
        </div>

        <p class="text-slate-300 text-sm mb-5 leading-relaxed">
          All your habits, streaks, vault entries, analytics, and settings will be
          <span class="text-red-400 font-semibold">permanently erased</span>.
          You will be logged out immediately.
        </p>

        <!-- Confirmation input -->
        <div class="mb-5">
          <label class="text-slate-400 text-xs font-medium mb-1.5 block">
            Type <span class="text-red-400 font-mono font-bold">delete</span> to confirm
          </label>
          <input id="delete-confirm-input" type="text"
            placeholder="delete"
            autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
            class="w-full bg-slate-800 border border-slate-600 focus:border-red-500/60 rounded-xl
                   px-3 py-2.5 text-white text-sm placeholder-slate-600
                   focus:outline-none transition-colors" />
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button id="delete-confirm-cancel"
            class="flex-1 py-2.5 rounded-xl text-sm font-medium
                   bg-slate-700/60 border border-slate-600 text-slate-300
                   hover:text-white hover:bg-slate-700 transition-colors">
            Cancel
          </button>
          <button id="delete-confirm-go" disabled
            class="flex-1 py-2.5 rounded-xl text-sm font-semibold
                   bg-red-600 text-white
                   disabled:opacity-40 disabled:cursor-not-allowed
                   hover:bg-red-500 transition-colors">
            <span id="delete-confirm-text"><i class="fa-solid fa-trash-can mr-1.5"></i>Delete</span>
            <span id="delete-confirm-spinner" class="hidden">
              <i class="fa-solid fa-circle-notch fa-spin"></i>
            </span>
          </button>
        </div>

      </div>
    </div>
  `;
}

function initDeleteConfirmModal(userId) {
  const removeModal = () => document.getElementById('delete-confirm-overlay')?.remove();

  document.getElementById('delete-confirm-cancel')?.addEventListener('click', removeModal);

  // Enable the Delete button only when the user has typed exactly "delete"
  const input  = document.getElementById('delete-confirm-input');
  const goBtn  = document.getElementById('delete-confirm-go');
  input?.addEventListener('input', () => {
    goBtn.disabled = input.value.trim().toLowerCase() !== 'delete';
  });

  goBtn?.addEventListener('click', async () => {
    if (input.value.trim().toLowerCase() !== 'delete') return;

    goBtn.disabled = true;
    document.getElementById('delete-confirm-text').classList.add('hidden');
    document.getElementById('delete-confirm-spinner').classList.remove('hidden');

    try {
      await deleteUserAccount(userId);
      // onAuthStateChange in main.js will handle rendering the login screen
    } catch (err) {
      console.error('[deleteAccount] Failed:', err);
      // Restore button so user can retry
      goBtn.disabled = false;
      document.getElementById('delete-confirm-text').classList.remove('hidden');
      document.getElementById('delete-confirm-spinner').classList.add('hidden');
      input.style.borderColor = 'rgb(239 68 68 / 0.8)';
    }
  });

  // Auto-focus the input
  setTimeout(() => input?.focus(), 50);
}

// ─── Util ─────────────────────────────────────────────────────
function escapeAttr(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function _todayStr() {
  return new Date().toISOString().split('T')[0];
}
