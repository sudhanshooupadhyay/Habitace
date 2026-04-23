import { calcBMI, bmiCategory } from '../lib/progressionEngine.js';
import { supabase } from '../lib/supabase.js';

const TOTAL_STEPS = 3;

// ─── State ────────────────────────────────────────────────────
let state = { height: '', weight: '', bmi: null, step: 1 };

// ─── Render ───────────────────────────────────────────────────
export function renderOnboarding() {
  return `
    <!-- Overlay -->
    <div id="onboarding-overlay"
      class="fixed inset-0 z-50 bg-navy-900/95 backdrop-blur-sm flex items-center justify-center p-4">

      <div id="onboarding-card"
        class="w-full max-w-md bg-navy-600 rounded-2xl border border-indigo-500/30 shadow-2xl overflow-hidden animate-slide-up">

        <!-- Progress bar -->
        <div class="h-1 bg-slate-700">
          <div id="ob-progress-bar"
            class="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style="width: 33%"></div>
        </div>

        <!-- Step content -->
        <div id="ob-step-content" class="p-8">
          <!-- injected per step -->
        </div>

      </div>
    </div>
  `;
}

export function initOnboarding(userId, onComplete) {
  state = { height: '', weight: '', bmi: null, step: 1 };
  renderStep(userId, onComplete);
}

// ─── Step renderer ────────────────────────────────────────────
function renderStep(userId, onComplete) {
  const content = document.getElementById('ob-step-content');
  const bar     = document.getElementById('ob-progress-bar');
  if (!content) return;

  bar.style.width = `${(state.step / TOTAL_STEPS) * 100}%`;

  switch (state.step) {
    case 1: renderStep1(content, userId, onComplete); break;
    case 2: renderStep2(content, userId, onComplete); break;
    case 3: renderStep3(content, userId, onComplete); break;
  }
}

// Step 1 — Welcome
function renderStep1(el, userId, onComplete) {
  el.innerHTML = `
    <div class="text-center space-y-6">
      <div class="w-20 h-20 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto animate-pulse-glow">
        <i class="fa-solid fa-brain text-3xl text-indigo-400"></i>
      </div>

      <!-- Warrior-on-mountain hero illustration -->
      <svg viewBox="0 0 320 110" xmlns="http://www.w3.org/2000/svg"
           class="w-full max-w-xs mx-auto" aria-hidden="true">
        <circle cx="28"  cy="18" r="1.4" fill="#e0e7ff" opacity="0.7"/>
        <circle cx="80"  cy="8"  r="1"   fill="#c7d2fe" opacity="0.5"/>
        <circle cx="158" cy="5"  r="1.6" fill="#e0e7ff" opacity="0.8"/>
        <circle cx="218" cy="12" r="1"   fill="#c7d2fe" opacity="0.5"/>
        <circle cx="290" cy="6"  r="1.4" fill="#e0e7ff" opacity="0.7"/>
        <circle cx="55"  cy="32" r="0.9" fill="#c7d2fe" opacity="0.4"/>
        <circle cx="245" cy="28" r="0.9" fill="#c7d2fe" opacity="0.4"/>
        <path d="M0,110 L45,72 L85,95 L125,58 L165,80 L205,45 L245,70 L285,38 L320,55 L320,110 Z"
              fill="#1e293b" opacity="0.6"/>
        <path d="M0,110 L55,68 L95,88 L145,42 L190,75 L230,35 L270,62 L310,48 L320,52 L320,110 Z"
              fill="#0f172a" opacity="0.95"/>
        <path d="M15,110 Q70,85 145,42" stroke="#6366f1" stroke-width="1.2"
              fill="none" opacity="0.45" stroke-dasharray="4,3"/>
        <circle cx="145" cy="42" r="12" fill="#6366f1" opacity="0.12"/>
        <circle cx="145" cy="33" r="4.5" fill="#818cf8" opacity="0.95"/>
        <line x1="145" y1="37" x2="145" y2="53" stroke="#818cf8" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
        <line x1="145" y1="43" x2="133" y2="34" stroke="#818cf8" stroke-width="2.2" stroke-linecap="round" opacity="0.9"/>
        <line x1="145" y1="43" x2="157" y2="34" stroke="#818cf8" stroke-width="2.2" stroke-linecap="round" opacity="0.9"/>
        <line x1="145" y1="53" x2="139" y2="64" stroke="#818cf8" stroke-width="2" stroke-linecap="round" opacity="0.9"/>
        <line x1="145" y1="53" x2="151" y2="64" stroke="#818cf8" stroke-width="2" stroke-linecap="round" opacity="0.9"/>
        <circle cx="145" cy="19" r="3" fill="#a5b4fc" opacity="0.9"/>
        <line x1="145" y1="13" x2="145" y2="25" stroke="#a5b4fc" stroke-width="0.8" opacity="0.6"/>
        <line x1="139" y1="19" x2="151" y2="19" stroke="#a5b4fc" stroke-width="0.8" opacity="0.6"/>
      </svg>

      <div>
        <p class="text-indigo-400 text-xs uppercase tracking-widest mb-2">First Login</p>
        <h2 class="text-white text-2xl font-bold">Welcome, Warrior.</h2>
        <p class="text-slate-400 text-sm mt-3 leading-relaxed">
          Let's establish your baseline. This takes 60 seconds and gives us the data
          to track your physical progression alongside your mental discipline.
        </p>
      </div>

      <div class="grid grid-cols-3 gap-3">
        ${[
          ['fa-dumbbell',      'Track',     'habits daily'],
          ['fa-chart-line',    'Measure',   'real progress'],
          ['fa-shield-halved', 'Conquer',   'health anxiety'],
        ].map(([icon, title, sub]) => `
          <div class="bg-navy-700/50 rounded-xl p-3 text-center">
            <i class="fa-solid ${icon} text-indigo-400 mb-1 block"></i>
            <p class="text-white text-xs font-semibold">${title}</p>
            <p class="text-slate-500 text-xs">${sub}</p>
          </div>
        `).join('')}
      </div>

      <button id="ob-next-1"
        class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors">
        Let's begin →
      </button>
    </div>
  `;

  document.getElementById('ob-next-1')?.addEventListener('click', () => {
    state.step = 2;
    renderStep(userId, onComplete);
  });
}

// Step 2 — Biometrics
function renderStep2(el, userId, onComplete) {
  el.innerHTML = `
    <div class="space-y-6">
      <div>
        <p class="text-slate-400 text-xs uppercase tracking-widest mb-1">Step 2 of 3</p>
        <h2 class="text-white text-xl font-bold">Baseline Biometrics</h2>
        <p class="text-slate-400 text-sm mt-2">
          Used only to calculate BMI and track physical progress over time.
          <span class="text-indigo-400">Never judged — only measured.</span>
        </p>
      </div>

      <div class="space-y-4">
        <div>
          <label class="form-label">Height</label>
          <div class="relative">
            <input id="ob-height" type="number" min="100" max="250"
              placeholder="e.g. 175"
              value="${state.height}"
              class="input-field pr-16" />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">cm</span>
          </div>
        </div>

        <div>
          <label class="form-label">Current Weight</label>
          <div class="relative">
            <input id="ob-weight" type="number" min="30" max="300" step="0.1"
              placeholder="e.g. 78.5"
              value="${state.weight}"
              class="input-field pr-16" />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">kg</span>
          </div>
        </div>
      </div>

      <div id="ob-bmi-preview" class="hidden p-4 rounded-xl border text-center"></div>

      <div id="ob-error" class="hidden text-red-400 text-sm text-center"></div>

      <div class="flex gap-3">
        <button id="ob-back-2"
          class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition-colors">
          ← Back
        </button>
        <button id="ob-next-2"
          class="flex-2 flex-grow bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors">
          Calculate BMI →
        </button>
      </div>
    </div>
  `;

  // Live BMI preview as user types
  const heightEl = document.getElementById('ob-height');
  const weightEl = document.getElementById('ob-weight');
  const preview  = document.getElementById('ob-bmi-preview');

  function updatePreview() {
    const h = parseFloat(heightEl.value);
    const w = parseFloat(weightEl.value);
    if (h > 100 && w > 20) {
      const bmi = calcBMI(w, h);
      const cat = bmiCategory(bmi);
      preview.className = `p-4 rounded-xl border text-center bg-${cat.color}-500/10 border-${cat.color}-500/30`;
      preview.innerHTML = `
        <p class="text-${cat.color}-400 text-2xl font-bold">${bmi}</p>
        <p class="text-${cat.color}-300 text-sm font-medium">${cat.label}</p>
        <p class="text-slate-500 text-xs mt-1">${cat.tip}</p>
      `;
      preview.classList.remove('hidden');
    } else {
      preview.classList.add('hidden');
    }
  }

  heightEl?.addEventListener('input', updatePreview);
  weightEl?.addEventListener('input', updatePreview);
  if (state.height && state.weight) updatePreview();

  document.getElementById('ob-back-2')?.addEventListener('click', () => {
    state.step = 1;
    renderStep(userId, onComplete);
  });

  document.getElementById('ob-next-2')?.addEventListener('click', () => {
    const h = parseFloat(heightEl.value);
    const w = parseFloat(weightEl.value);
    const errEl = document.getElementById('ob-error');

    if (!h || h < 100 || h > 250) {
      errEl.textContent = 'Please enter a valid height (100–250 cm).';
      errEl.classList.remove('hidden');
      return;
    }
    if (!w || w < 30 || w > 300) {
      errEl.textContent = 'Please enter a valid weight (30–300 kg).';
      errEl.classList.remove('hidden');
      return;
    }

    errEl.classList.add('hidden');
    state.height = h;
    state.weight = w;
    state.bmi    = calcBMI(w, h);
    state.step   = 3;
    renderStep(userId, onComplete);
  });
}

// Step 3 — BMI result + save
function renderStep3(el, userId, onComplete) {
  const cat    = bmiCategory(state.bmi);
  const target = { min: 18.5, max: 24.9 };
  const diff   = state.bmi < target.min
    ? `${(target.min - state.bmi).toFixed(1)} points below target`
    : state.bmi > target.max
    ? `${(state.bmi - target.max).toFixed(1)} points above target`
    : 'You are already in the optimal range';

  // How much weight change to reach midpoint (21.7)
  const heightM    = state.height / 100;
  const targetBmi  = 21.7;
  const targetKg   = parseFloat((targetBmi * heightM * heightM).toFixed(1));
  const deltaKg    = parseFloat((targetKg - state.weight).toFixed(1));
  const directionMsg = deltaKg === 0
    ? 'You are at your target weight.'
    : deltaKg > 0
    ? `Gaining ~${deltaKg} kg would bring you to target weight.`
    : `Losing ~${Math.abs(deltaKg)} kg would bring you to target weight.`;

  el.innerHTML = `
    <div class="space-y-6">
      <div>
        <p class="text-slate-400 text-xs uppercase tracking-widest mb-1">Step 3 of 3 — Your Baseline</p>
        <h2 class="text-white text-xl font-bold">Analytical Profile</h2>
        <p class="text-slate-400 text-sm mt-1">Purely data. No judgement. Only trajectory.</p>
      </div>

      <!-- BMI result card -->
      <!-- Achievement target illustration -->
      <div class="flex justify-center">
        <svg viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg"
             class="w-40" aria-hidden="true">
          <!-- Concentric rings (target) -->
          <circle cx="80" cy="40" r="36" fill="none" stroke="#6366f1" stroke-width="1" opacity="0.15"/>
          <circle cx="80" cy="40" r="26" fill="none" stroke="#6366f1" stroke-width="1" opacity="0.25"/>
          <circle cx="80" cy="40" r="16" fill="none" stroke="#6366f1" stroke-width="1.2" opacity="0.4"/>
          <circle cx="80" cy="40" r="8"  fill="#6366f1" opacity="0.3"/>
          <!-- Rising bar chart (left side) -->
          <rect x="16" y="58" width="8" height="14" rx="1.5" fill="#6366f1" opacity="0.3"/>
          <rect x="28" y="48" width="8" height="24" rx="1.5" fill="#6366f1" opacity="0.4"/>
          <rect x="40" y="38" width="8" height="34" rx="1.5" fill="#6366f1" opacity="0.5"/>
          <!-- Rising bar chart (right side, mirrored) -->
          <rect x="136" y="58" width="8" height="14" rx="1.5" fill="#6366f1" opacity="0.3"/>
          <rect x="124" y="48" width="8" height="24" rx="1.5" fill="#6366f1" opacity="0.4"/>
          <rect x="112" y="38" width="8" height="34" rx="1.5" fill="#6366f1" opacity="0.5"/>
          <!-- Checkmark in center -->
          <path d="M72,40 L78,47 L90,33" stroke="#818cf8" stroke-width="2.5"
                fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
          <!-- Sparkles -->
          <circle cx="80" cy="6"  r="1.5" fill="#a5b4fc" opacity="0.7"/>
          <circle cx="65" cy="12" r="1"   fill="#c7d2fe" opacity="0.5"/>
          <circle cx="95" cy="12" r="1"   fill="#c7d2fe" opacity="0.5"/>
        </svg>
      </div>

      <!-- BMI result card -->
      <div class="bg-${cat.color}-500/10 border border-${cat.color}-500/30 rounded-2xl p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-slate-400 text-xs uppercase tracking-wide mb-1">Your BMI</p>
            <p class="text-${cat.color}-400 text-4xl font-bold">${state.bmi}</p>
            <p class="text-${cat.color}-300 text-sm font-medium mt-0.5">${cat.label}</p>
          </div>
          <div class="text-right">
            <p class="text-slate-400 text-xs mb-1">Target range</p>
            <p class="text-white text-sm font-semibold">18.5 – 24.9</p>
            <p class="text-slate-400 text-xs mt-0.5">${diff}</p>
          </div>
        </div>

        <!-- BMI scale bar -->
        <div class="space-y-1.5">
          <div class="flex text-xs text-slate-500 justify-between">
            <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
          </div>
          <div class="relative h-3 rounded-full bg-slate-700 overflow-hidden">
            <div class="absolute inset-y-0 bg-emerald-500/40 rounded-full"
              style="left: ${((18.5-15)/25)*100}%; right: ${100-((24.9-15)/25)*100}%"></div>
            <div class="absolute top-0 h-full w-0.5 bg-white rounded-full"
              style="left: ${Math.min(95, Math.max(2, ((state.bmi-15)/25)*100))}%"></div>
          </div>
          <p class="text-slate-500 text-xs text-center">${directionMsg}</p>
        </div>
      </div>

      <!-- Stats grid -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-navy-700/50 rounded-xl p-3 text-center">
          <p class="text-slate-400 text-xs mb-1">Height</p>
          <p class="text-white font-bold">${state.height} cm</p>
        </div>
        <div class="bg-navy-700/50 rounded-xl p-3 text-center">
          <p class="text-slate-400 text-xs mb-1">Weight</p>
          <p class="text-white font-bold">${state.weight} kg</p>
        </div>
      </div>

      <div class="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
        <p class="text-indigo-300 text-xs text-center leading-relaxed">
          <i class="fa-solid fa-circle-info mr-1"></i>
          This is your Day 0 baseline. The app will track BMI over time as you log weight updates.
          Progress, not perfection.
        </p>
      </div>

      <div id="ob-save-error" class="hidden text-red-400 text-sm text-center"></div>

      <div class="flex gap-3">
        <button id="ob-back-3"
          class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition-colors">
          ← Back
        </button>
        <button id="ob-save"
          class="flex-grow bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed">
          <span id="ob-save-text"><i class="fa-solid fa-check mr-2"></i>Save & Enter App</span>
          <span id="ob-save-spinner" class="hidden"><i class="fa-solid fa-circle-notch fa-spin"></i></span>
        </button>
      </div>
    </div>
  `;

  document.getElementById('ob-back-3')?.addEventListener('click', () => {
    state.step = 2;
    renderStep(userId, onComplete);
  });

  document.getElementById('ob-save')?.addEventListener('click', async () => {
    const saveBtn     = document.getElementById('ob-save');
    const saveText    = document.getElementById('ob-save-text');
    const saveSpinner = document.getElementById('ob-save-spinner');
    const errEl       = document.getElementById('ob-save-error');

    saveBtn.disabled = true;
    saveText.classList.add('hidden');
    saveSpinner.classList.remove('hidden');

    try {
      // Save biometrics via RPC
      const { error: rpcErr } = await supabase.rpc('save_biometrics', {
        p_user_id:   userId,
        p_height_cm: Math.round(state.height),
        p_weight_kg: state.weight,
        p_bmi:       state.bmi,
      });
      if (rpcErr) throw rpcErr;

      // Also write initial weight_log row
      const today = new Date().toISOString().split('T')[0];
      const { error: logErr } = await supabase.from('weight_logs').insert({
        user_id:   userId,
        date:      today,
        weight_kg: state.weight,
        bmi:       state.bmi,
      });
      if (logErr) throw logErr;

      // Remove overlay and signal completion
      document.getElementById('onboarding-overlay')?.remove();
      onComplete();
    } catch (err) {
      console.error('[Onboarding] Save failed:', err);
      errEl.textContent = 'Failed to save. Please try again.';
      errEl.classList.remove('hidden');
      saveBtn.disabled = false;
      saveText.classList.remove('hidden');
      saveSpinner.classList.add('hidden');
    }
  });
}
