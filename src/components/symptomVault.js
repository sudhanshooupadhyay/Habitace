import { saveAnxietyEntry, addXp } from '../lib/supabase.js';
import { getRandomGrounding } from '../lib/quotes.js';

export function renderVault(isAnxietyMode = true) {
  if (!isAnxietyMode) return renderJournal();

  return `
    <div id="vault-section" class="space-y-6 animate-slide-up">

      <!-- Header -->
      <div class="bg-gradient-to-br from-purple-900/40 to-navy-700 rounded-2xl border border-purple-500/20 p-6 relative overflow-hidden">
        <div class="flex items-start gap-4 relative">
          <div class="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-shield-halved text-xl text-purple-400"></i>
          </div>
          <div>
            <h2 class="text-white text-xl font-bold">Cognitive Symptom Vault</h2>
            <p class="text-slate-400 text-sm mt-1">
              A secure space to document, reframe, and neutralize health anxiety. Every entry earns
              <span class="text-purple-400 font-medium">+20 XP</span>.
            </p>
          </div>
        </div>

        <!-- Protective shield scene illustration -->
        <svg viewBox="0 0 360 85" xmlns="http://www.w3.org/2000/svg"
             class="w-full mt-4" aria-hidden="true">
          <!-- Shield silhouettes (distance gradient) -->
          <path d="M30,75 L30,42 Q30,32 40,28 L50,24 L60,28 Q70,32 70,42 L70,75 Z"
                fill="#4c1d95" opacity="0.2"/>
          <path d="M80,75 L80,38 Q80,26 92,22 L105,17 L118,22 Q130,26 130,38 L130,75 Z"
                fill="#4c1d95" opacity="0.28"/>
          <!-- Main shield (center) -->
          <path d="M155,75 L155,30 Q155,16 170,10 L180,6 L190,10 Q205,16 205,30 L205,75 Z"
                fill="#581c87" opacity="0.5" stroke="#7c3aed" stroke-width="1.2" stroke-opacity="0.5"/>
          <!-- Inner shield glow -->
          <path d="M160,72 L160,34 Q160,22 172,17 L180,13 L188,17 Q200,22 200,34 L200,72 Z"
                fill="#6d28d9" opacity="0.35"/>
          <!-- Lock in center shield -->
          <path d="M175,48 L175,44 Q175,40 180,40 Q185,40 185,44 L185,48"
                fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
          <rect x="173" y="48" width="14" height="10" rx="2.5" fill="#7c3aed" opacity="0.7"/>
          <circle cx="180" cy="53" r="2" fill="#c4b5fd" opacity="0.8"/>
          <!-- Right shields (fading) -->
          <path d="M232,75 L232,38 Q232,26 244,22 L257,17 L270,22 Q282,26 282,38 L282,75 Z"
                fill="#4c1d95" opacity="0.28"/>
          <path d="M300,75 L300,42 Q300,32 310,28 L320,24 L330,28 Q340,32 340,42 L340,75 Z"
                fill="#4c1d95" opacity="0.2"/>
          <!-- Floating particles -->
          <circle cx="20"  cy="30" r="1.5" fill="#a78bfa" opacity="0.4"/>
          <circle cx="145" cy="20" r="1.2" fill="#818cf8" opacity="0.35"/>
          <circle cx="215" cy="18" r="1.5" fill="#a78bfa" opacity="0.4"/>
          <circle cx="350" cy="28" r="1.2" fill="#818cf8" opacity="0.35"/>
          <!-- Horizontal rule at base -->
          <line x1="0" y1="75" x2="360" y2="75" stroke="#7c3aed" stroke-width="0.5" opacity="0.2"/>
        </svg>
      </div>

      <!-- Entry Form -->
      <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-6">
        <h3 class="text-white font-semibold mb-5 flex items-center gap-2">
          <i class="fa-solid fa-pen-to-square text-purple-400"></i>
          New Entry
        </h3>

        <form id="vault-form" class="space-y-4" novalidate>

          <div>
            <label class="form-label">What I feel right now</label>
            <textarea id="v-trigger" rows="3" required
              placeholder="Describe the sensation, thought, or trigger honestly..."
              class="input-field resize-none"></textarea>
          </div>

          <div>
            <label class="form-label">Physical symptoms</label>
            <textarea id="v-symptoms" rows="2"
              placeholder="e.g., racing heart, chest tightness, dizziness, tingling..."
              class="input-field resize-none"></textarea>
          </div>

          <div>
            <label class="form-label">What my fear is telling me</label>
            <textarea id="v-fear" rows="2"
              placeholder="e.g., 'This heart rate means something is wrong'..."
              class="input-field resize-none"></textarea>
          </div>

          <div>
            <label class="form-label">Cognitive reframe (optional — I'll help you)</label>
            <textarea id="v-reframe" rows="2"
              placeholder="How I rationally explain what is actually happening..."
              class="input-field resize-none"></textarea>
          </div>

          <div id="vault-error" class="hidden rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm"></div>

          <button type="submit" id="vault-submit"
            class="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition-all
                   focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-navy-600
                   disabled:opacity-50 disabled:cursor-not-allowed">
            <span id="vault-btn-text"><i class="fa-solid fa-lock mr-2"></i>Secure this entry</span>
            <span id="vault-spinner" class="hidden"><i class="fa-solid fa-circle-notch fa-spin"></i></span>
          </button>
        </form>
      </div>

      <!-- Past entries -->
      <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-6">
        <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
          <i class="fa-solid fa-clock-rotate-left text-slate-400"></i>
          Recent Entries
        </h3>
        <div id="vault-entries">
          <div class="flex items-center justify-center py-8">
            <i class="fa-solid fa-circle-notch fa-spin text-purple-400 text-xl"></i>
          </div>
        </div>
      </div>

    </div>

    <!-- Grounding Modal -->
    <div id="grounding-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" id="modal-backdrop"></div>
      <div class="relative bg-navy-600 border border-purple-500/40 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-slide-up overflow-hidden">

        <!-- Ripple background -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 500"
             preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <circle cx="200" cy="120" r="60"  fill="none" stroke="#7c3aed" stroke-width="1" opacity="0.12"/>
          <circle cx="200" cy="120" r="95"  fill="none" stroke="#7c3aed" stroke-width="1" opacity="0.09"/>
          <circle cx="200" cy="120" r="130" fill="none" stroke="#7c3aed" stroke-width="1" opacity="0.06"/>
          <circle cx="200" cy="120" r="170" fill="none" stroke="#7c3aed" stroke-width="1" opacity="0.04"/>
          <circle cx="200" cy="120" r="40"  fill="#7c3aed" opacity="0.04"/>
        </svg>

        <div class="relative text-center mb-6">
          <div class="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <i class="fa-solid fa-heart-pulse text-2xl text-purple-400"></i>
          </div>
          <p class="text-purple-400 text-xs uppercase tracking-widest mb-2">Entry Secured · +20 XP</p>
          <h3 id="grounding-headline" class="text-white text-xl font-bold leading-snug"></h3>
        </div>
        <p id="grounding-body" class="text-slate-300 text-sm leading-relaxed text-center"></p>
        <div class="mt-6 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
          <p class="text-purple-300 text-xs text-center font-medium">
            <i class="fa-solid fa-brain mr-2"></i>
            Remember: Feelings are data, not directives. You are safe.
          </p>
        </div>
        <button id="modal-dismiss"
          class="mt-6 w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition-colors">
          I am grounded. Continue.
        </button>
      </div>
    </div>
  `;
}

// ─── Journaling / Gratitude mode ─────────────────────────────
function renderJournal() {
  return `
    <div id="vault-section" class="space-y-6 animate-slide-up">

      <!-- Header -->
      <div class="bg-gradient-to-br from-emerald-900/40 to-navy-700 rounded-2xl border border-emerald-500/20 p-6 relative overflow-hidden">
        <div class="flex items-start gap-4 relative">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-pen-to-square text-xl text-emerald-400"></i>
          </div>
          <div>
            <h2 class="text-white text-xl font-bold">Journal & Gratitude</h2>
            <p class="text-slate-400 text-sm mt-1">
              Reflect, appreciate, and grow. Every entry earns
              <span class="text-emerald-400 font-medium">+20 XP</span>.
            </p>
          </div>
        </div>
      </div>

      <!-- Entry Form -->
      <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-6">
        <h3 class="text-white font-semibold mb-5 flex items-center gap-2">
          <i class="fa-solid fa-feather text-emerald-400"></i>
          Today's Reflection
        </h3>

        <form id="vault-form" class="space-y-4" novalidate>

          <div>
            <label class="form-label">3 things I am grateful for today</label>
            <textarea id="v-trigger" rows="3" required
              placeholder="1. ... 2. ... 3. ..."
              class="input-field resize-none"></textarea>
          </div>

          <div>
            <label class="form-label">How am I feeling right now?</label>
            <textarea id="v-symptoms" rows="2"
              placeholder="Describe your mood, energy, mindset..."
              class="input-field resize-none"></textarea>
          </div>

          <div>
            <label class="form-label">What went well today?</label>
            <textarea id="v-fear" rows="2"
              placeholder="Any win, big or small..."
              class="input-field resize-none"></textarea>
          </div>

          <div>
            <label class="form-label">Intention for tomorrow</label>
            <textarea id="v-reframe" rows="2"
              placeholder="One thing you will focus on or do differently..."
              class="input-field resize-none"></textarea>
          </div>

          <div id="vault-error" class="hidden rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm"></div>

          <button type="submit" id="vault-submit"
            class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-all
                   focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-navy-600
                   disabled:opacity-50 disabled:cursor-not-allowed">
            <span id="vault-btn-text"><i class="fa-solid fa-leaf mr-2"></i>Save reflection</span>
            <span id="vault-spinner" class="hidden"><i class="fa-solid fa-circle-notch fa-spin"></i></span>
          </button>
        </form>
      </div>

      <!-- Past entries -->
      <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-6">
        <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
          <i class="fa-solid fa-clock-rotate-left text-slate-400"></i>
          Recent Reflections
        </h3>
        <div id="vault-entries">
          <div class="flex items-center justify-center py-8">
            <i class="fa-solid fa-circle-notch fa-spin text-emerald-400 text-xl"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Success modal (journaling) -->
    <div id="grounding-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" id="modal-backdrop"></div>
      <div class="relative bg-navy-600 border border-emerald-500/30 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-slide-up">
        <div class="text-center mb-4">
          <div class="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <i class="fa-solid fa-leaf text-2xl text-emerald-400"></i>
          </div>
          <p class="text-emerald-400 text-xs uppercase tracking-widest mb-2">Reflection Saved · +20 XP</p>
          <h3 id="grounding-headline" class="text-white text-xl font-bold"></h3>
        </div>
        <p id="grounding-body" class="text-slate-300 text-sm leading-relaxed text-center"></p>
        <button id="modal-dismiss"
          class="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors">
          Continue
        </button>
      </div>
    </div>
  `;
}

const JOURNAL_AFFIRMATIONS = [
  { headline: 'Reflection builds resilience.', body: 'Taking time to notice what you\'re grateful for rewires the brain toward optimism. Keep going.' },
  { headline: 'Growth lives in small moments.', body: 'Every reflection you write is a data point on your journey. The pattern will become clear.' },
  { headline: 'You showed up for yourself today.', body: 'That matters more than any single result. Consistency over intensity.' },
  { headline: 'Your story is worth telling.', body: 'Writing gives your experiences meaning. Keep documenting your path.' },
];

// ─────────────────────────────────────────────────────────────

export async function initVault(userId, isAnxietyMode = true) {
  const form      = document.getElementById('vault-form');
  const errEl     = document.getElementById('vault-error');
  const btnText   = document.getElementById('vault-btn-text');
  const spinner   = document.getElementById('vault-spinner');
  const submitBtn = document.getElementById('vault-submit');
  const modal     = document.getElementById('grounding-modal');
  const backdrop  = document.getElementById('modal-backdrop');
  const dismiss   = document.getElementById('modal-dismiss');

  // Dismiss modal
  [backdrop, dismiss].forEach((el) => {
    el?.addEventListener('click', () => modal.classList.add('hidden'));
  });

  // Load past entries
  loadVaultEntries(userId);

  // Form submit
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.classList.add('hidden');

    const trigger    = document.getElementById('v-trigger')?.value.trim();
    const symptoms   = document.getElementById('v-symptoms')?.value.trim();
    const fear       = document.getElementById('v-fear')?.value.trim();
    const reframe    = document.getElementById('v-reframe')?.value.trim();

    if (!trigger) {
      errEl.textContent = 'Please describe what you are feeling right now.';
      errEl.classList.remove('hidden');
      return;
    }

    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    spinner.classList.remove('hidden');

    try {
      await saveAnxietyEntry(userId, {
        trigger,
        physical_symptoms: symptoms || null,
        cognitive_reframing: [fear, reframe].filter(Boolean).join('\n\nMy reframe: ') || null,
      });

      await addXp(userId, 20);

      form.reset();
      _showModal(isAnxietyMode);
      loadVaultEntries(userId);
    } catch (err) {
      console.error('[Vault] Save failed:', err);
      errEl.textContent = 'Failed to save entry. Please check your connection.';
      errEl.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      btnText.classList.remove('hidden');
      spinner.classList.add('hidden');
    }
  });
}

function _showModal(isAnxietyMode) {
  let headline, body;
  if (isAnxietyMode) {
    const g = getRandomGrounding();
    headline = g.headline;
    body     = g.body;
  } else {
    const a  = JOURNAL_AFFIRMATIONS[Math.floor(Math.random() * JOURNAL_AFFIRMATIONS.length)];
    headline = a.headline;
    body     = a.body;
  }
  document.getElementById('grounding-headline').textContent = headline;
  document.getElementById('grounding-body').textContent     = body;
  document.getElementById('grounding-modal').classList.remove('hidden');
}

async function loadVaultEntries(userId) {
  const container = document.getElementById('vault-entries');
  if (!container) return;

  try {
    const { supabase } = await import('../lib/supabase.js');
    const { data, error } = await supabase
      .from('anxiety_vault')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="text-center py-6">
          <svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg"
               class="w-36 mx-auto mb-4" aria-hidden="true">
            <!-- Outer ambient glow -->
            <circle cx="100" cy="78" r="58" fill="#7c3aed" opacity="0.05"/>
            <!-- Shield body -->
            <path d="M100,22 L138,37 L138,82 Q138,112 100,128 Q62,112 62,82 L62,37 Z"
                  fill="#3b0764" opacity="0.35" stroke="#7c3aed" stroke-width="1.5" stroke-opacity="0.5"/>
            <!-- Shield inner -->
            <path d="M100,34 L128,46 L128,81 Q128,104 100,118 Q72,104 72,81 L72,46 Z"
                  fill="#4c1d95" opacity="0.4" stroke="#a78bfa" stroke-width="0.8" stroke-opacity="0.35"/>
            <!-- Lock shackle -->
            <path d="M91,72 L91,65 Q91,57 100,57 Q109,57 109,65 L109,72"
                  fill="none" stroke="#a78bfa" stroke-width="2.8" stroke-linecap="round" opacity="0.8"/>
            <!-- Lock body -->
            <rect x="88" y="72" width="24" height="18" rx="3.5" fill="#6d28d9" opacity="0.7"/>
            <!-- Lock keyhole -->
            <circle cx="100" cy="80" r="3" fill="#c4b5fd" opacity="0.85"/>
            <rect x="98.5" y="80" width="3" height="5" rx="1" fill="#c4b5fd" opacity="0.85"/>
            <!-- Floating sparkles -->
            <circle cx="50"  cy="48" r="2.2" fill="#a78bfa" opacity="0.5"/>
            <circle cx="150" cy="52" r="1.8" fill="#818cf8" opacity="0.45"/>
            <circle cx="55"  cy="108" r="1.8" fill="#a78bfa" opacity="0.4"/>
            <circle cx="146" cy="106" r="2.2" fill="#818cf8" opacity="0.5"/>
            <circle cx="100" cy="136" r="1.5" fill="#a78bfa" opacity="0.35"/>
            <!-- 4-point stars -->
            <path d="M48,65 L49,68 L52,69 L49,70 L48,73 L47,70 L44,69 L47,68 Z"
                  fill="#c4b5fd" opacity="0.45"/>
            <path d="M150,72 L151,74 L153,75 L151,76 L150,78 L149,76 L147,75 L149,74 Z"
                  fill="#a78bfa" opacity="0.4"/>
          </svg>
          <p class="text-slate-400 text-sm font-medium">Your vault is sealed and ready.</p>
          <p class="text-slate-600 text-xs mt-1.5 leading-relaxed max-w-[220px] mx-auto">
            Every entry you secure helps neutralize the pattern. Start when you're ready.
          </p>
        </div>`;
      return;
    }

    container.innerHTML = data.map((entry) => {
      const ts = new Date(entry.timestamp);
      const dateStr = ts.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });

      return `
        <div class="vault-entry border border-slate-700/40 rounded-xl p-4 mb-3 bg-navy-700/30 hover:border-purple-500/30 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-purple-400 text-xs font-medium uppercase tracking-wide">
              <i class="fa-solid fa-shield-halved mr-1"></i>Secured
            </span>
            <span class="text-slate-500 text-xs">${dateStr}</span>
          </div>
          <p class="text-slate-300 text-sm leading-relaxed truncate-entry">
            ${escapeHtml(entry.trigger || 'No description')}
          </p>
          ${entry.physical_symptoms ? `
            <p class="text-slate-500 text-xs mt-1 truncate">
              <i class="fa-solid fa-heart-pulse mr-1"></i>${escapeHtml(entry.physical_symptoms)}
            </p>` : ''}
          <button class="vault-expand text-purple-400 text-xs mt-2 hover:text-purple-300 transition-colors"
            data-id="${entry.id}">
            View full entry →
          </button>
          <div class="vault-full hidden mt-3 pt-3 border-t border-slate-700/50 space-y-2">
            ${entry.cognitive_reframing ? `
              <div>
                <p class="text-slate-400 text-xs uppercase tracking-wide mb-1">Reframe</p>
                <p class="text-slate-300 text-sm">${escapeHtml(entry.cognitive_reframing)}</p>
              </div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Expand/collapse
    container.querySelectorAll('.vault-expand').forEach((btn) => {
      btn.addEventListener('click', () => {
        const full = btn.nextElementSibling;
        const isHidden = full.classList.contains('hidden');
        full.classList.toggle('hidden', !isHidden);
        btn.textContent = isHidden ? 'Collapse ↑' : 'View full entry →';
      });
    });

  } catch (err) {
    console.error('[Vault] Load entries failed:', err);
    container.innerHTML = `<p class="text-red-400 text-sm text-center">Failed to load entries.</p>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
