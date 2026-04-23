/**
 * Health Guide Component
 *
 * Displays:
 *  1. Bio Age breakdown (grade, delta, per-component bars)
 *  2. Personalized health protocols from generateHealthProtocol()
 *  3. Meditation program from generateMeditationProgram()
 */

import { supabase } from '../lib/supabase.js';
import {
  calcBioAge,
  bioAgeInterpretation,
  findWeakestComponent,
  generateHealthProtocol,
  generateMeditationProgram,
  vo2maxFitnessLabel,
  rhrLabel,
} from '../lib/bioAge.js';

// ─── Render shell ─────────────────────────────────────────────
export function renderHealthGuide() {
  return `
    <div id="health-guide-section" class="space-y-5 animate-slide-up">

      <!-- Header -->
      <div class="bg-gradient-to-br from-purple-900/40 to-navy-700 rounded-2xl border border-purple-500/20 p-5">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-dna text-xl text-purple-400"></i>
          </div>
          <div>
            <h2 class="text-white text-xl font-bold">Bio Age Engine</h2>
            <p class="text-slate-400 text-sm mt-1">
              Science-based biological age from 5 biomarkers — plus your personal health & meditation protocol.
            </p>
          </div>
        </div>
      </div>

      <!-- Bio Age Card -->
      <div id="bio-age-card" class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5">
        <div class="flex items-center justify-center py-6">
          <i class="fa-solid fa-circle-notch fa-spin text-purple-400 text-xl"></i>
        </div>
      </div>

      <!-- Health Protocols -->
      <div id="health-protocols-section" class="space-y-4 hidden"></div>

      <!-- Meditation Program -->
      <div id="meditation-section" class="space-y-4 hidden"></div>

      <!-- Garmin shortcut -->
      <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-watch text-teal-400"></i>
          </div>
          <div class="flex-1">
            <p class="text-white font-semibold text-sm">Improve Accuracy</p>
            <p class="text-slate-400 text-xs mt-0.5">Connect Garmin or enter metrics manually for a more precise bio age.</p>
          </div>
          <button id="go-to-garmin"
            class="bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex-shrink-0">
            Open →
          </button>
        </div>
      </div>

    </div>
  `;
}

// ─── Init ─────────────────────────────────────────────────────
export async function initHealthGuide(userId, userProfile) {
  document.getElementById('go-to-garmin')?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('navigate', { detail: 'garmin' }));
  });

  await loadBioAge(userId, userProfile);
}

// ─── Data loading + calculation ───────────────────────────────
async function loadBioAge(userId, userProfile) {
  const card = document.getElementById('bio-age-card');
  if (!card) return;

  try {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 864e5).toISOString().split('T')[0];

    // Fetch today's health metrics + recent workout count in parallel
    const [metricsRes, workoutsRes] = await Promise.all([
      supabase
        .from('daily_metrics')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle(),
      supabase
        .from('workout_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('date', sevenDaysAgo),
    ]);

    const metrics = metricsRes.data || {};
    const workoutsThisWeek = workoutsRes.count || 0;

    const bioInput = {
      vo2_max:          metrics.vo2_max        || null,
      resting_hr:       metrics.resting_hr     || null,
      bmi:              userProfile?.current_bmi || userProfile?.initial_bmi || null,
      sleep_score:      metrics.garmin_sleep_score || null,
      workouts_per_week: workoutsThisWeek,
      date_of_birth:    userProfile?.date_of_birth || null,
      hrv_rmssd:        metrics.hrv_rmssd      || null,
      stress_level:     metrics.stress_level   ?? null,
      body_battery:     metrics.body_battery   ?? null,
      max_hr:           metrics.max_hr         || null,
    };

    const bioResult = calcBioAge(bioInput);
    renderBioAgeCard(card, bioResult, bioInput, userProfile);

    if (bioResult) {
      const protocols   = generateHealthProtocol(bioResult, { ...bioInput, age: bioResult.chronoAge });
      const meditation  = generateMeditationProgram(bioInput);
      renderHealthProtocols(protocols);
      renderMeditationProgram(meditation);
    }
  } catch (err) {
    console.error('[HealthGuide]', err);
    card.innerHTML = `<p class="text-red-400 text-sm text-center py-4">Failed to load bio age data.</p>`;
  }
}

// ─── Bio Age Card ─────────────────────────────────────────────
function renderBioAgeCard(card, result, metrics, profile) {
  if (!result) {
    card.innerHTML = `
      <div class="text-center py-6 space-y-3">
        <i class="fa-solid fa-circle-info text-3xl text-slate-600 block"></i>
        <p class="text-slate-400 text-sm font-medium">Bio Age Unavailable</p>
        <p class="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
          We need your date of birth to calculate biological age.
          ${!profile?.date_of_birth
            ? 'Add your DOB in the onboarding step — re-launch from sign-out if needed.'
            : 'Also connect Garmin or enter metrics manually to improve accuracy.'}
        </p>
      </div>`;
    return;
  }

  const { chronoAge, bioAge, delta, compositeScore, components, dataCompleteness } = result;
  const interp  = bioAgeInterpretation(delta);
  const weakest = findWeakestComponent(components);

  const deltaText  = delta < 0
    ? `${Math.abs(delta)} years younger`
    : delta > 0
    ? `${delta} years older`
    : 'Same as chronological';

  const deltaColor = delta <= -5 ? 'emerald' : delta <= 0 ? 'sky' : delta <= 5 ? 'amber' : 'red';

  card.innerHTML = `
    <!-- Grade + headline -->
    <div class="flex items-start gap-4 mb-5">
      <div class="w-14 h-14 rounded-2xl bg-${interp.color}-500/20 border border-${interp.color}-500/30
                  flex items-center justify-center flex-shrink-0">
        <span class="text-${interp.color}-400 text-2xl font-black">${interp.grade}</span>
      </div>
      <div>
        <p class="text-xs text-slate-400 uppercase tracking-widest mb-0.5">Biological Age</p>
        <p class="text-${interp.color}-400 text-3xl font-bold leading-none">${bioAge}
          <span class="text-slate-400 text-base font-normal ml-1">yrs</span>
        </p>
        <p class="text-slate-400 text-xs mt-1">
          Chronological: <span class="text-white font-medium">${chronoAge}</span> yrs ·
          <span class="text-${deltaColor}-400 font-medium">${deltaText} than chrono</span>
        </p>
      </div>
    </div>

    <!-- Composite score bar -->
    <div class="mb-5">
      <div class="flex justify-between text-xs text-slate-500 mb-1.5">
        <span>Composite Health Score</span>
        <span class="text-${interp.color}-400 font-semibold">${compositeScore}/100</span>
      </div>
      <div class="h-2.5 bg-slate-700 rounded-full overflow-hidden">
        <div class="h-full rounded-full bg-gradient-to-r from-${interp.color}-600 to-${interp.color}-400 transition-all duration-700"
          style="width: ${compositeScore}%"></div>
      </div>
      <p class="text-slate-600 text-xs mt-1 text-right">Data completeness: ${dataCompleteness}%</p>
    </div>

    <!-- Interpretation -->
    <div class="bg-${interp.color}-500/10 border border-${interp.color}-500/20 rounded-xl p-4 mb-5">
      <p class="text-${interp.color}-300 font-semibold text-sm mb-1">${interp.headline}</p>
      <p class="text-slate-400 text-xs leading-relaxed">${interp.message}</p>
    </div>

    <!-- Component breakdown -->
    <div class="space-y-2.5">
      <p class="text-slate-400 text-xs uppercase tracking-widest mb-3">Biomarker Breakdown</p>
      ${componentRow('VO₂ Max',    'fa-lungs',      components.vo2max,   35, metrics.vo2_max,    vo2maxFitnessLabel(metrics.vo2_max))}
      ${componentRow('Resting HR', 'fa-heart',      components.rhr,      25, metrics.resting_hr, rhrLabel(metrics.resting_hr))}
      ${componentRow('Body Comp',  'fa-weight-scale',components.bmi,     15, metrics.bmi,        null)}
      ${componentRow('Sleep',      'fa-moon',       components.sleep,    15, metrics.sleep_score, null)}
      ${componentRow('Activity',   'fa-dumbbell',   components.activity, 10, metrics.workouts_per_week, null)}
    </div>

    ${weakest ? `
      <div class="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
        <p class="text-amber-400 text-xs font-semibold">
          <i class="fa-solid fa-triangle-exclamation mr-1"></i>
          Weakest biomarker: ${weakest.label} (+${weakest.delta} yrs)
        </p>
        <p class="text-slate-500 text-xs mt-1">Focus your health protocol here for maximum bio age improvement.</p>
      </div>` : ''}
  `;
}

function componentRow(label, icon, delta, weight, rawValue, labelObj) {
  if (delta === null) {
    return `
      <div class="flex items-center gap-3 opacity-40">
        <i class="fa-solid ${icon} text-slate-500 text-xs w-4 text-center"></i>
        <div class="flex-1">
          <div class="flex justify-between text-xs mb-1">
            <span class="text-slate-500">${label} <span class="text-slate-700 text-xs">(${weight}% weight)</span></span>
            <span class="text-slate-600">No data</span>
          </div>
          <div class="h-1.5 bg-slate-700/50 rounded-full"></div>
        </div>
      </div>`;
  }

  const color   = delta <= -4 ? 'emerald' : delta <= 0 ? 'sky' : delta <= 4 ? 'amber' : 'red';
  const barPct  = Math.max(5, Math.min(100, 60 - delta * 4));
  const sign    = delta > 0 ? '+' : '';
  const sub     = labelObj?.label || (rawValue !== null && rawValue !== undefined ? String(rawValue) : '');

  return `
    <div class="flex items-center gap-3">
      <i class="fa-solid ${icon} text-${color}-400 text-xs w-4 text-center"></i>
      <div class="flex-1">
        <div class="flex justify-between text-xs mb-1">
          <span class="text-slate-400">${label} <span class="text-slate-600 text-xs">(${weight}%)</span></span>
          <span class="text-${color}-400 font-medium">${sign}${delta} yrs ${sub ? `· ${sub}` : ''}</span>
        </div>
        <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full rounded-full bg-${color}-500 transition-all duration-700"
            style="width: ${barPct}%"></div>
        </div>
      </div>
    </div>`;
}

// ─── Health Protocols ─────────────────────────────────────────
function renderHealthProtocols(protocols) {
  const section = document.getElementById('health-protocols-section');
  if (!section || protocols.length === 0) return;
  section.classList.remove('hidden');

  section.innerHTML = `
    <div class="flex items-center gap-2 px-1">
      <i class="fa-solid fa-shield-heart text-emerald-400"></i>
      <h3 class="text-white font-bold text-lg">Your Health Protocol</h3>
    </div>
    ${protocols.map((p) => protocolCard(p)).join('')}
  `;
}

function protocolCard(p) {
  return `
    <div class="bg-navy-600 rounded-2xl border border-${p.color}-500/20 overflow-hidden">
      <!-- Header -->
      <div class="flex items-start gap-3 p-4 pb-0">
        <div class="w-9 h-9 rounded-xl bg-${p.color}-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <i class="fa-solid ${p.icon} text-${p.color}-400 text-sm"></i>
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-${p.color}-400 text-xs font-semibold uppercase tracking-wide">${p.category}</span>
            ${p.urgency === 'high' ? `<span class="bg-red-500/20 text-red-400 text-xs px-1.5 py-0.5 rounded-md font-medium">Priority</span>` : ''}
          </div>
          <p class="text-white font-semibold text-sm mt-0.5">${p.title}</p>
        </div>
      </div>

      <div class="px-4 pb-4 mt-3 space-y-3">
        <p class="text-slate-400 text-xs leading-relaxed">${p.body}</p>

        <!-- Protocol steps -->
        <div class="bg-navy-700/50 rounded-xl p-3 space-y-2">
          ${p.protocol.map((step, i) => `
            <div class="flex items-start gap-2">
              <div class="w-5 h-5 rounded-full bg-${p.color}-500/20 text-${p.color}-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">${i + 1}</div>
              <p class="text-slate-300 text-xs leading-relaxed">${step}</p>
            </div>
          `).join('')}
        </div>

        <p class="text-slate-600 text-xs">
          <i class="fa-solid fa-flask mr-1"></i>${p.evidence}
        </p>
      </div>
    </div>
  `;
}

// ─── Meditation Program ───────────────────────────────────────
function renderMeditationProgram({ sessions, urgencyScore }) {
  const section = document.getElementById('meditation-section');
  if (!section) return;
  section.classList.remove('hidden');

  const urgColor = urgencyScore >= 70 ? 'red' : urgencyScore >= 50 ? 'amber' : 'sky';

  section.innerHTML = `
    <div class="flex items-center gap-2 px-1">
      <i class="fa-solid fa-spa text-purple-400"></i>
      <h3 class="text-white font-bold text-lg">Meditation Protocol</h3>
      <span class="ml-auto bg-${urgColor}-500/20 text-${urgColor}-400 text-xs px-2 py-0.5 rounded-lg font-medium">
        Urgency: ${urgencyScore}%
      </span>
    </div>

    <div class="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
      <p class="text-purple-300 text-xs leading-relaxed">
        <i class="fa-solid fa-circle-info mr-1.5"></i>
        Your meditation sessions are calibrated to your stress level, HRV, and sleep score.
        ${urgencyScore >= 70 ? 'Your metrics indicate elevated urgency — do not skip tonight's protocol.' : 'Consistent practice reduces anxiety episodes by 40-60% within 30 days (JAMA Internal Medicine, 2014).'}
      </p>
    </div>

    ${sessions.map((s) => meditationCard(s)).join('')}
  `;
}

function meditationCard(s) {
  return `
    <div class="bg-navy-600 rounded-2xl border border-${s.color}-500/20 overflow-hidden">
      <div class="flex items-start gap-3 p-4 pb-0">
        <div class="w-9 h-9 rounded-xl bg-${s.color}-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <i class="fa-solid ${s.icon} text-${s.color}-400 text-sm"></i>
        </div>
        <div class="flex-1">
          <p class="text-slate-400 text-xs">${s.time}</p>
          <p class="text-white font-semibold text-sm mt-0.5">${s.title}</p>
          <span class="inline-block bg-${s.color}-500/20 text-${s.color}-400 text-xs px-2 py-0.5 rounded-md mt-1">${s.duration}</span>
        </div>
      </div>

      <div class="px-4 pb-4 mt-3 space-y-2">
        ${s.steps.map((step) => `
          <div class="bg-navy-700/50 rounded-xl p-3">
            <div class="flex items-center justify-between mb-1">
              <p class="text-white text-xs font-semibold">${step.name}</p>
              <span class="text-slate-500 text-xs">${step.time}</span>
            </div>
            <p class="text-slate-400 text-xs leading-relaxed">${step.desc}</p>
          </div>
        `).join('')}

        ${s.notes ? `
          <p class="text-slate-500 text-xs italic leading-relaxed mt-1">
            <i class="fa-solid fa-lightbulb mr-1 text-${s.color}-500/60"></i>${s.notes}
          </p>` : ''}

        ${s.resource ? `
          <a href="${s.resource}" target="_blank" rel="noopener noreferrer"
            class="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-1">
            <i class="fa-brands fa-youtube text-red-400"></i>
            ${s.resourceLabel}
            <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i>
          </a>` : ''}
      </div>
    </div>
  `;
}
