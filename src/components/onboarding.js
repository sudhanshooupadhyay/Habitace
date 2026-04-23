import { calcBMI, bmiCategory } from '../lib/progressionEngine.js';
import { supabase } from '../lib/supabase.js';
import { saveUsername, saveUserInterests } from '../lib/supabase.js';

const TOTAL_STEPS = 4;

const INTEREST_OPTIONS = [
  { key: 'anxiety',    label: 'Anxiety & Health Anxiety', icon: 'fa-brain',        desc: 'CBT, panic, health anxiety techniques' },
  { key: 'fitness',    label: 'Fitness & Strength',       icon: 'fa-dumbbell',     desc: 'Workout protocols, progressive overload' },
  { key: 'mindset',    label: 'Mindset & Discipline',     icon: 'fa-fire',         desc: 'Mental toughness, stoicism, motivation' },
  { key: 'sleep',      label: 'Sleep & Recovery',         icon: 'fa-moon',         desc: 'Sleep science, recovery protocols' },
  { key: 'journaling', label: 'Journaling & Gratitude',   icon: 'fa-pen-to-square',desc: 'Reflection, gratitude practice' },
  { key: 'breathing',  label: 'Breathing & Meditation',   icon: 'fa-spa',          desc: 'Breathwork, meditation techniques' },
];

// ─── State ────────────────────────────────────────────────────
let state = {
  height: '', weight: '', bmi: null, step: 1,
  username: '', hasAnxiety: null, interests: [],
};

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

const VICE_OPTIONS = [
  { key: 'smoking',  label: 'Smoking',   icon: 'fa-smoking' },
  { key: 'alcohol',  label: 'Alcohol',   icon: 'fa-wine-bottle' },
  { key: 'gambling', label: 'Gambling',  icon: 'fa-dice' },
  { key: 'junk_food',label: 'Junk Food', icon: 'fa-burger' },
  { key: 'social_media', label: 'Social Media', icon: 'fa-mobile-screen' },
];

export function initOnboarding(userId, onComplete) {
  state = { height: '', weight: '', bmi: null, step: 1, username: '', hasAnxiety: null, interests: [], vices: [] };
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
    case 4: renderStep4(content, userId, onComplete); break;
  }
}

// Step 1 — Welcome + username
function renderStep1(el, userId, onComplete) {
  el.innerHTML = `
    <div class="space-y-6">
      <div class="text-center">
        <div class="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
          <i class="fa-solid fa-brain text-2xl text-indigo-400"></i>
        </div>
        <p class="text-indigo-400 text-xs uppercase tracking-widest mb-2">First Login</p>
        <h2 class="text-white text-2xl font-bold">Welcome, Warrior.</h2>
        <p class="text-slate-400 text-sm mt-2 leading-relaxed">
          Let's set up your profile — takes about 60 seconds.
        </p>
      </div>

      <!-- Username input -->
      <div>
        <label class="form-label">Your name / callsign</label>
        <input id="ob-username" type="text" maxlength="24"
          placeholder="e.g. Alex, Ghost, Warrior..."
          value="${state.username}"
          class="input-field" />
        <p class="text-slate-600 text-xs mt-1.5">This is how we'll address you throughout the app.</p>
      </div>

      <div id="ob-error-1" class="hidden text-red-400 text-sm text-center"></div>

      <button id="ob-next-1"
        class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors">
        Continue →
      </button>
    </div>
  `;

  document.getElementById('ob-next-1')?.addEventListener('click', () => {
    const username = document.getElementById('ob-username')?.value.trim();
    const errEl    = document.getElementById('ob-error-1');
    if (!username || username.length < 2) {
      errEl.textContent = 'Please enter at least 2 characters.';
      errEl.classList.remove('hidden');
      return;
    }
    state.username = username;
    state.step = 2;
    renderStep(userId, onComplete);
  });
}

// Step 2 — Profile: anxiety, interests, vices
function renderStep2(el, userId, onComplete) {
  el.innerHTML = `
    <div class="space-y-6">
      <div>
        <p class="text-slate-400 text-xs uppercase tracking-widest mb-1">Step 2 of 4</p>
        <h2 class="text-white text-xl font-bold">Your Profile</h2>
        <p class="text-slate-400 text-sm mt-1">Help us personalise your experience.</p>
      </div>

      <!-- Anxiety question -->
      <div>
        <p class="text-white text-sm font-medium mb-3">
          <i class="fa-solid fa-brain text-indigo-400 mr-2"></i>Do you experience anxiety or health anxiety?
        </p>
        <div class="flex gap-3">
          <button id="ob-anxiety-yes"
            class="ob-anxiety-btn flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors
                   ${state.hasAnxiety === true ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-700/60 border-slate-600 text-slate-400 hover:border-indigo-500/50'}">
            <i class="fa-solid fa-check mr-1.5"></i>Yes
          </button>
          <button id="ob-anxiety-no"
            class="ob-anxiety-btn flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors
                   ${state.hasAnxiety === false ? 'bg-slate-600 border-slate-500 text-white' : 'bg-slate-700/60 border-slate-600 text-slate-400 hover:border-slate-500'}">
            <i class="fa-solid fa-xmark mr-1.5"></i>No
          </button>
        </div>
        <p id="ob-anxiety-hint" class="text-slate-600 text-xs mt-1.5">
          ${state.hasAnxiety === false ? 'Your Vault will be a journaling & gratitude space instead.' : 'Your Vault will be an anxiety tracking & evidence log.'}
        </p>
      </div>

      <!-- Interests -->
      <div>
        <p class="text-white text-sm font-medium mb-3">
          <i class="fa-solid fa-book text-amber-400 mr-2"></i>What would you like to learn about?
          <span class="text-slate-500 font-normal">(pick all that apply)</span>
        </p>
        <div class="grid grid-cols-2 gap-2">
          ${INTEREST_OPTIONS.map((opt) => `
            <button class="ob-interest-btn text-left px-3 py-2.5 rounded-xl text-sm border transition-colors
                           ${state.interests.includes(opt.key) ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' : 'bg-slate-700/40 border-slate-600/50 text-slate-400 hover:border-slate-500'}
                           flex items-start gap-2"
              data-key="${opt.key}">
              <i class="fa-solid ${opt.icon} mt-0.5 flex-shrink-0 text-xs"></i>
              <div>
                <p class="font-medium text-xs leading-tight">${opt.label}</p>
                <p class="text-xs text-slate-500 leading-snug mt-0.5">${opt.desc}</p>
              </div>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Vices -->
      <div>
        <p class="text-white text-sm font-medium mb-1">
          <i class="fa-solid fa-triangle-exclamation text-amber-400 mr-2"></i>Any habits you want to break?
          <span class="text-slate-500 font-normal">(optional)</span>
        </p>
        <p class="text-slate-500 text-xs mb-3">We'll add these as habit reminders and suggest content to help you quit.</p>
        <div class="flex flex-wrap gap-2">
          ${VICE_OPTIONS.map((v) => `
            <button class="ob-vice-btn px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                           ${state.vices.includes(v.key) ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-slate-700/40 border-slate-600/50 text-slate-400 hover:border-slate-500'}
                           flex items-center gap-1.5"
              data-key="${v.key}">
              <i class="fa-solid ${v.icon} text-xs"></i>${v.label}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="flex gap-3">
        <button id="ob-back-2"
          class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition-colors">
          ← Back
        </button>
        <button id="ob-next-2"
          class="flex-grow bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors">
          Continue →
        </button>
      </div>
    </div>
  `;

  // Anxiety toggle
  document.getElementById('ob-anxiety-yes')?.addEventListener('click', () => {
    state.hasAnxiety = true;
    document.getElementById('ob-anxiety-yes').className = document.getElementById('ob-anxiety-yes').className
      .replace(/bg-slate-700\/60|border-slate-600|text-slate-400/g, '') + ' bg-indigo-600 border-indigo-500 text-white';
    document.getElementById('ob-anxiety-no').className = 'ob-anxiety-btn flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors bg-slate-700/60 border-slate-600 text-slate-400 hover:border-slate-500';
    const hint = document.getElementById('ob-anxiety-hint');
    if (hint) hint.textContent = 'Your Vault will be an anxiety tracking & evidence log.';
  });

  document.getElementById('ob-anxiety-no')?.addEventListener('click', () => {
    state.hasAnxiety = false;
    document.getElementById('ob-anxiety-no').className = document.getElementById('ob-anxiety-no').className
      .replace(/bg-slate-700\/60|border-slate-600|text-slate-400/g, '') + ' bg-slate-600 border-slate-500 text-white';
    document.getElementById('ob-anxiety-yes').className = 'ob-anxiety-btn flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors bg-slate-700/60 border-slate-600 text-slate-400 hover:border-indigo-500/50';
    const hint = document.getElementById('ob-anxiety-hint');
    if (hint) hint.textContent = 'Your Vault will be a journaling & gratitude space instead.';
  });

  // Interest toggles
  el.querySelectorAll('.ob-interest-btn').forEach((btn) => {
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

  // Vice toggles
  el.querySelectorAll('.ob-vice-btn').forEach((btn) => {
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
    });
  });

  document.getElementById('ob-back-2')?.addEventListener('click', () => { state.step = 1; renderStep(userId, onComplete); });
  document.getElementById('ob-next-2')?.addEventListener('click', () => { state.step = 3; renderStep(userId, onComplete); });
}

// Step 3 — Biometrics
function renderStep3(el, userId, onComplete) {
  el.innerHTML = `
    <div class="space-y-6">
      <div>
        <p class="text-slate-400 text-xs uppercase tracking-widest mb-1">Step 3 of 4</p>
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
        <button id="ob-back-3"
          class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition-colors">
          ← Back
        </button>
        <button id="ob-next-3"
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

  document.getElementById('ob-back-3')?.addEventListener('click', () => {
    state.step = 2;
    renderStep(userId, onComplete);
  });

  document.getElementById('ob-next-3')?.addEventListener('click', () => {
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
    state.step   = 4;
    renderStep(userId, onComplete);
  });
}

// Step 4 — BMI result + save
function renderStep4(el, userId, onComplete) {
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
        <p class="text-slate-400 text-xs uppercase tracking-widest mb-1">Step 4 of 4 — Your Baseline</p>
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
        <button id="ob-back-4"
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

  document.getElementById('ob-back-4')?.addEventListener('click', () => {
    state.step = 3;
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

      // Save profile preferences (username, interests, vices, anxiety flag)
      const { error: profileErr } = await supabase
        .from('users')
        .update({
          username:    state.username  || null,
          interests:   state.interests.length ? state.interests : null,
          vices:       state.vices.length     ? state.vices     : null,
          has_anxiety: state.hasAnxiety       ?? null,
        })
        .eq('id', userId);
      if (profileErr) console.warn('[Onboarding] Profile save warning:', profileErr);

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
