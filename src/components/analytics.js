import { fetchHabitsRange, fetchAnxietyRange } from '../lib/supabase.js';
import Chart from 'chart.js/auto';

let chartInstance = null;

export function renderAnalytics() {
  return `
    <div id="analytics-section" class="space-y-5 animate-slide-up">

      <!-- Header -->
      <div class="rounded-2xl border p-6 overflow-hidden relative"
           style="background:linear-gradient(135deg,rgba(14,165,233,0.12) 0%,rgba(10,15,30,0.9) 100%);border-color:rgba(14,165,233,0.2);">
        <div class="flex items-start gap-4 relative">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
               style="background:rgba(14,165,233,0.15);">
            <i class="fa-solid fa-chart-line text-xl text-sky-400"></i>
          </div>
          <div>
            <h2 class="text-white text-xl font-bold">Discipline Analytics</h2>
            <p class="text-slate-400 text-sm mt-1">Your data tells your story. Let it motivate you.</p>
          </div>
        </div>
      </div>

      <!-- Wellness Score -->
      <div id="wellness-score-card" class="rounded-2xl border p-5"
           style="background:rgba(15,20,35,0.95);border-color:rgba(99,102,241,0.2);">
        <p class="text-slate-500 text-xs text-center py-2">Computing your wellness score…</p>
      </div>

      <!-- Training Program Analysis -->
      <div id="training-analysis-card" class="rounded-2xl border p-5"
           style="background:rgba(15,20,35,0.95);border-color:rgba(16,185,129,0.2);">
        <p class="text-slate-500 text-xs text-center py-2">Analysing training data…</p>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-2 gap-3" id="summary-cards">
        <div class="rounded-2xl border border-slate-700/50 p-5 text-center" style="background:rgba(15,20,35,0.9);">
          <p class="text-2xl font-bold text-slate-500">—</p>
          <p class="text-slate-600 text-xs mt-1">Loading…</p>
        </div>
        <div class="rounded-2xl border border-slate-700/50 p-5 text-center" style="background:rgba(15,20,35,0.9);">
          <p class="text-2xl font-bold text-slate-500">—</p>
          <p class="text-slate-600 text-xs mt-1">Loading…</p>
        </div>
      </div>

      <!-- Chart -->
      <div class="rounded-2xl border border-slate-700/50 p-5" style="background:rgba(15,20,35,0.9);">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-white font-semibold flex items-center gap-2 text-sm">
            <i class="fa-solid fa-magnifying-glass-chart text-sky-400"></i>
            Anxiety vs Workouts
          </h3>
          <select id="chart-range"
            class="bg-navy-700 border border-slate-600 text-slate-300 text-xs rounded-lg px-3 py-1.5
                   focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="30">Last 30 days</option>
            <option value="14">Last 14 days</option>
            <option value="7">Last 7 days</option>
          </select>
        </div>

        <div class="relative h-56">
          <canvas id="main-chart"></canvas>
          <div id="chart-loading" class="absolute inset-0 flex items-center justify-center">
            <i class="fa-solid fa-circle-notch fa-spin text-sky-400 text-2xl"></i>
          </div>
        </div>

        <div class="flex items-center justify-center gap-6 mt-3">
          <span class="flex items-center gap-2 text-xs text-slate-400">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>Workouts
          </span>
          <span class="flex items-center gap-2 text-xs text-slate-400">
            <span class="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>Anxiety Spikes
          </span>
        </div>

        <div class="mt-3 p-3 rounded-xl" style="background:rgba(16,185,129,0.07);border:1px solid rgba(16,185,129,0.15);">
          <p class="text-emerald-300 text-xs text-center">
            <i class="fa-solid fa-lightbulb mr-2"></i>
            <strong>The Pattern:</strong> Workout days rarely overlap with anxiety spikes. Movement is medicine.
          </p>
        </div>
      </div>

      <!-- Habit Streak Grid -->
      <div class="rounded-2xl border border-slate-700/50 p-5" style="background:rgba(15,20,35,0.9);">
        <h3 class="text-white font-semibold mb-4 flex items-center gap-2 text-sm">
          <i class="fa-solid fa-fire text-amber-400"></i>
          Habit Completion Grid
          <span class="text-xs text-slate-500 font-normal ml-1">last 30 days</span>
        </h3>
        <div id="habit-grid" class="space-y-3">
          <p class="text-slate-600 text-sm text-center py-3">Loading habit data…</p>
        </div>
      </div>

    </div>
  `;
}

export async function initAnalytics(userId, userProfile = {}) {
  await loadChartData(userId, 30, userProfile);

  document.getElementById('chart-range')?.addEventListener('change', async (e) => {
    await loadChartData(userId, parseInt(e.target.value, 10), userProfile);
  });
}

async function loadChartData(userId, days, userProfile = {}) {
  const loading = document.getElementById('chart-loading');
  if (loading) loading.style.display = 'flex';

  try {
    const [habits, anxiety] = await Promise.all([
      fetchHabitsRange(userId, days),
      fetchAnxietyRange(userId, days),
    ]);

    renderSummaryCards(habits, anxiety);
    renderChart(habits, anxiety, days);
    renderHabitGrid(habits, userProfile);
    renderWellnessScore(habits, anxiety, userProfile);
    renderTrainingAnalysis(habits, userProfile);
  } catch (err) {
    console.error('[Analytics] Load failed:', err);

    const loading = document.getElementById('chart-loading');
    if (loading) loading.innerHTML = '<p class="text-red-400 text-sm text-center">Could not load data.</p>';

    const cards = document.getElementById('summary-cards');
    if (cards) cards.innerHTML = `
      <div class="col-span-2 text-center py-6 text-slate-500 text-sm">
        <i class="fa-solid fa-circle-exclamation text-red-400 mr-2"></i>
        Failed to load analytics. Check your connection.
      </div>`;

    const grid = document.getElementById('habit-grid');
    if (grid) grid.innerHTML = '<p class="text-slate-600 text-sm text-center py-4">No data available.</p>';
  }
}

function renderSummaryCards(habits, anxiety) {
  const cards = document.getElementById('summary-cards');
  if (!cards) return;

  const totalWorkouts     = habits.filter((h) => h.workout).length;
  const totalAnxiety      = anxiety.length;
  const bestStreak        = computeStreak(habits);
  const workoutCompliance = habits.length
    ? Math.round((totalWorkouts / habits.length) * 100)
    : 0;

  const _card = (icon, iconColor, bg, value, label) => `
    <div class="rounded-2xl border border-slate-700/40 p-4 text-center" style="background:rgba(15,20,35,0.9);">
      <div class="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2.5" style="background:${bg};">
        <i class="fa-solid ${icon}" style="color:${iconColor};font-size:0.85rem;"></i>
      </div>
      <p class="text-xl font-bold text-white">${value}</p>
      <p class="text-slate-500 text-xs mt-0.5">${label}</p>
    </div>
  `;

  cards.innerHTML = `
    ${_card('fa-dumbbell',    '#34d399', 'rgba(16,185,129,0.15)', totalWorkouts,       'Workouts done')}
    ${_card('fa-heart-crack', '#f87171', 'rgba(239,68,68,0.15)',  totalAnxiety,        'Anxiety entries')}
    ${_card('fa-fire',        '#fbbf24', 'rgba(245,158,11,0.15)', bestStreak + ' d',   'Longest streak')}
    ${_card('fa-percent',     '#818cf8', 'rgba(99,102,241,0.15)', workoutCompliance + '%', 'Workout rate')}
  `;
}

// ─── Wellness Score ───────────────────────────────────────────

function renderWellnessScore(habits, anxiety, userProfile) {
  const card = document.getElementById('wellness-score-card');
  if (!card) return;

  const days30  = Math.max(habits.length, 1);
  const workouts = habits.filter((h) => h.workout).length;
  const meditations = habits.filter((h) => h.meditation).length;
  const study       = habits.filter((h) => h.studying).length;
  const eating      = habits.filter((h) => h.eating_clean).length;
  const viceFree    = habits.filter((h) => h.smoke_free).length;

  const workoutScore   = Math.round((workouts    / days30) * 25);
  const meditateScore  = Math.round((meditations / days30) * 20);
  const studyScore     = Math.round((study       / days30) * 15);
  const eatingScore    = Math.round((eating      / days30) * 15);
  const viceScore      = Math.round((viceFree    / days30) * 20);
  const anxietyScore   = Math.max(0, 5 - Math.min(anxiety.length, 5)); // bonus for low anxiety

  const total = Math.min(100, workoutScore + meditateScore + studyScore + eatingScore + viceScore + anxietyScore);

  const grade = total >= 85 ? { label: 'Elite', color: '#34d399', glow: '#10b981' }
    : total >= 70 ? { label: 'Strong', color: '#818cf8', glow: '#6366f1' }
    : total >= 50 ? { label: 'Building', color: '#fbbf24', glow: '#f59e0b' }
    : total >= 30 ? { label: 'Starting', color: '#fb923c', glow: '#f97316' }
    : { label: 'New Journey', color: '#f87171', glow: '#ef4444' };

  const pillars = [
    { label: 'Workout',   score: workoutScore,  max: 25, color: '#34d399', icon: 'fa-dumbbell' },
    { label: 'Meditate',  score: meditateScore, max: 20, color: '#a78bfa', icon: 'fa-spa' },
    { label: 'Study',     score: studyScore,    max: 15, color: '#60a5fa', icon: 'fa-book' },
    { label: 'Nutrition', score: eatingScore,   max: 15, color: '#fbbf24', icon: 'fa-apple-whole' },
    { label: 'Vice-Free', score: viceScore,     max: 20, color: '#38bdf8', icon: 'fa-shield-halved' },
    { label: 'Calm',      score: anxietyScore,  max: 5,  color: '#f0abfc', icon: 'fa-brain' },
  ];

  card.innerHTML = `
    <div class="flex items-center gap-3 mb-5">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
           style="background:rgba(99,102,241,0.15);">
        <i class="fa-solid fa-star text-indigo-400 text-sm"></i>
      </div>
      <div>
        <h3 class="text-white font-bold text-sm">Overall Wellness Score</h3>
        <p class="text-slate-500 text-xs">Based on your last 30 days of data</p>
      </div>
    </div>

    <div class="flex items-center gap-5 mb-5">
      <!-- Big score circle -->
      <div class="relative flex-shrink-0" style="width:90px;height:90px;">
        <svg width="90" height="90" class="-rotate-90" style="position:absolute;inset:0;">
          <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="7"/>
          <circle cx="45" cy="45" r="38" fill="none" stroke="${grade.color}" stroke-width="7"
            stroke-linecap="round"
            stroke-dasharray="${2 * Math.PI * 38}"
            stroke-dashoffset="${2 * Math.PI * 38 * (1 - total / 100)}"
            style="filter:drop-shadow(0 0 6px ${grade.glow});transition:all 1s ease;"/>
        </svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <span style="color:white;font-size:1.35rem;font-weight:800;line-height:1;">${total}</span>
          <span style="color:#64748b;font-size:0.6rem;letter-spacing:0.05em;">/100</span>
        </div>
      </div>

      <div class="flex-1">
        <div class="inline-block px-3 py-1 rounded-full text-xs font-bold mb-2"
             style="background:rgba(255,255,255,0.05);color:${grade.color};border:1px solid ${grade.color}40;">
          ${grade.label}
        </div>
        <p class="text-slate-400 text-xs leading-relaxed">
          ${total >= 70
            ? 'Outstanding discipline. You\'re becoming the person you want to be.'
            : total >= 50
            ? 'Good momentum. Stay consistent and watch the score climb.'
            : 'Every day you improve is a victory. Keep showing up.'}
        </p>
      </div>
    </div>

    <!-- Pillar breakdown -->
    <div class="space-y-2.5">
      ${pillars.map((p) => `
        <div>
          <div class="flex items-center justify-between mb-1">
            <span class="flex items-center gap-1.5 text-xs text-slate-400">
              <i class="fa-solid ${p.icon}" style="color:${p.color};font-size:0.7rem;"></i>${p.label}
            </span>
            <span class="text-xs font-bold" style="color:${p.color};">${p.score}/${p.max}</span>
          </div>
          <div class="h-1.5 rounded-full" style="background:rgba(255,255,255,0.05);">
            <div class="h-1.5 rounded-full transition-all duration-700"
                 style="width:${Math.round((p.score / p.max) * 100)}%;
                        background:${p.color};
                        box-shadow:0 0 6px ${p.color}80;"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ─── Training Program Analysis ────────────────────────────────

function renderTrainingAnalysis(habits, userProfile) {
  const card = document.getElementById('training-analysis-card');
  if (!card) return;

  const total30     = Math.max(habits.length, 1);
  const workouts    = habits.filter((h) => h.workout).length;
  const weeklyAvg   = Math.round((workouts / total30) * 7 * 10) / 10;
  const consistency = Math.round((workouts / total30) * 100);

  // Determine program tier
  let program;
  if (weeklyAvg < 2) {
    program = {
      tier:        'Foundation Builder',
      color:       '#fbbf24',
      glow:        '#f59e0b',
      icon:        'fa-seedling',
      frequency:   '3× per week',
      type:        'Full Body',
      description: 'Build the habit of movement first. 3 full-body sessions per week, 30-45 min each.',
      days:        ['Monday', 'Wednesday', 'Friday'],
      focus:       ['Compound lifts (squat, press, row)', 'Cardio 20 min LISS', 'Mobility & stretching'],
      nextStep:    'Hit 3 workouts/week consistently for 4 weeks, then advance.',
      badge:       '🌱 Starting Out',
    };
  } else if (weeklyAvg < 4) {
    program = {
      tier:        'Intermediate Athlete',
      color:       '#60a5fa',
      glow:        '#3b82f6',
      icon:        'fa-person-running',
      frequency:   '4× per week',
      type:        'Upper / Lower Split',
      description: 'You\'re consistent. Time to split upper and lower body for targeted growth.',
      days:        ['Mon (Upper)', 'Tue (Lower)', 'Thu (Upper)', 'Fri (Lower)'],
      focus:       ['Strength: progressive overload', 'HIIT 2× week', 'Active recovery Sunday'],
      nextStep:    'Aim for 4+ sessions/week and track progressive overload.',
      badge:       '⚡ Building Strength',
    };
  } else {
    program = {
      tier:        'Advanced Warrior',
      color:       '#34d399',
      glow:        '#10b981',
      icon:        'fa-dumbbell',
      frequency:   '5-6× per week',
      type:        'Push / Pull / Legs',
      description: 'Elite consistency. PPL split maximizes volume and recovery for each muscle group.',
      days:        ['Push', 'Pull', 'Legs', 'Push', 'Pull/Legs', 'Rest/Active'],
      focus:       ['Volume: 15-20 sets per muscle/week', 'Periodization', 'Deload every 4-6 weeks'],
      nextStep:    'Focus on sleep & nutrition to match your training volume.',
      badge:       '🔥 Elite Consistency',
    };
  }

  card.innerHTML = `
    <div class="flex items-center gap-3 mb-4">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
           style="background:rgba(16,185,129,0.12);">
        <i class="fa-solid fa-person-running text-emerald-400 text-sm"></i>
      </div>
      <div>
        <h3 class="text-white font-bold text-sm">Training Program Analysis</h3>
        <p class="text-slate-500 text-xs">Personalised based on your data</p>
      </div>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-3 gap-2 mb-4">
      ${[
        { label: 'Weekly Avg',    value: weeklyAvg + 'x',       color: program.color },
        { label: 'Consistency',   value: consistency + '%',     color: program.color },
        { label: 'Total (30d)',   value: workouts + ' sessions', color: '#94a3b8'     },
      ].map((s) => `
        <div class="text-center rounded-xl py-3 px-2" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">
          <p class="font-bold text-sm" style="color:${s.color};">${s.value}</p>
          <p class="text-slate-600 text-xs mt-0.5">${s.label}</p>
        </div>
      `).join('')}
    </div>

    <!-- Program card -->
    <div class="rounded-xl p-4 mb-3" style="background:rgba(255,255,255,0.03);border:1px solid ${program.color}30;">
      <div class="flex items-center gap-2 mb-2">
        <i class="fa-solid ${program.icon}" style="color:${program.color};"></i>
        <span class="text-white font-bold text-sm">${program.tier}</span>
        <span class="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
              style="background:${program.color}20;color:${program.color};">${program.type}</span>
      </div>
      <p class="text-slate-400 text-xs leading-relaxed mb-3">${program.description}</p>

      <div class="mb-3">
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Schedule</p>
        <div class="flex flex-wrap gap-1.5">
          ${program.days.map((d) => `
            <span class="text-xs px-2 py-1 rounded-lg font-medium"
                  style="background:${program.color}15;color:${program.color};border:1px solid ${program.color}30;">${d}</span>
          `).join('')}
        </div>
      </div>

      <div>
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Focus Areas</p>
        ${program.focus.map((f) => `
          <div class="flex items-start gap-2 mb-1">
            <i class="fa-solid fa-check text-xs mt-0.5 flex-shrink-0" style="color:${program.color};"></i>
            <span class="text-slate-400 text-xs">${f}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="rounded-lg p-3" style="background:rgba(255,255,255,0.02);border-left:3px solid ${program.color};">
      <p class="text-xs" style="color:${program.color};">
        <i class="fa-solid fa-arrow-right mr-1.5"></i><strong>Next step:</strong> ${program.nextStep}
      </p>
    </div>
  `;
}

function renderChart(habits, anxiety, days) {
  const ctx     = document.getElementById('main-chart');
  const loading = document.getElementById('chart-loading');

  // Always hide the overlay — even if canvas isn't found
  if (loading) loading.style.display = 'none';
  if (!ctx) return;

  // Build date labels for range
  const labels = [];
  const workoutData = [];
  const anxietyData = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

    const habitRow = habits.find((h) => h.date === dateStr);
    workoutData.push(habitRow?.workout ? 1 : 0);

    const dayStart = `${dateStr}T00:00:00`;
    const dayEnd   = `${dateStr}T23:59:59`;
    const count    = anxiety.filter(
      (a) => a.timestamp >= dayStart && a.timestamp <= dayEnd
    ).length;
    anxietyData.push(count);
  }

  // Destroy old chart if exists
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Workouts',
          data: workoutData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.1)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#10b981',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Anxiety Spikes',
          data: anxietyData,
          borderColor: '#f87171',
          backgroundColor: 'rgba(248,113,113,0.1)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#f87171',
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          borderColor: '#334155',
          borderWidth: 1,
          titleColor: '#e2e8f0',
          bodyColor: '#94a3b8',
          padding: 10,
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(51,65,85,0.4)' },
          ticks: {
            color: '#64748b',
            maxTicksLimit: 8,
            font: { size: 10 },
          },
        },
        y: {
          grid: { color: 'rgba(51,65,85,0.4)' },
          ticks: {
            color: '#64748b',
            stepSize: 1,
            font: { size: 10 },
          },
          beginAtZero: true,
        },
      },
    },
  });
}

// Vice → display label map for the analytics grid
const VICE_LABELS = {
  smoking:      'Smoke Free',
  alcohol:      'Alcohol Free',
  gambling:     'No Gambling',
  junk_food:    'No Junk Food',
  social_media: 'Screen Limit',
};

function renderHabitGrid(habits, userProfile = {}) {
  const grid = document.getElementById('habit-grid');
  if (!grid) return;

  if (!habits || habits.length === 0) {
    grid.innerHTML = `
      <div class="text-center py-6">
        <i class="fa-solid fa-seedling text-amber-400/40 text-2xl mb-3"></i>
        <p class="text-slate-500 text-sm">No habit data yet — start ticking off your Daily Five and your grid will fill in here.</p>
      </div>`;
    return;
  }

  const userVice    = Array.isArray(userProfile.vices) ? userProfile.vices[0] : null;
  const viceLabel   = userVice ? (VICE_LABELS[userVice] || 'Vice Free') : null;

  const HABIT_KEYS = [
    { key: 'studying',     label: 'Study',    color: '#6366f1' },
    { key: 'workout',      label: 'Workout',  color: '#10b981' },
    { key: 'eating_clean', label: 'Eating',   color: '#f59e0b' },
    { key: 'meditation',   label: 'Meditate', color: '#8b5cf6' },
    // Only show the vice habit row if the user has a vice set
    ...(viceLabel ? [{ key: 'smoke_free', label: viceLabel, color: '#38bdf8' }] : []),
  ];

  // Build last 30 dates
  const dates = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  grid.innerHTML = HABIT_KEYS.map((h) => `
    <div>
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-slate-400 text-xs">${h.label}</span>
        <span class="text-slate-500 text-xs">
          ${habits.filter((r) => r[h.key]).length}/${dates.length} days
        </span>
      </div>
      <div class="flex gap-1 flex-wrap">
        ${dates.map((d) => {
          const row  = habits.find((r) => r.date === d);
          const done = row?.[h.key];
          return `<div title="${d}"
            class="w-4 h-4 rounded-sm transition-all"
            style="background:${done ? h.color : 'rgba(51,65,85,0.5)'}; opacity:${done ? '1' : '0.4'}"></div>`;
        }).join('')}
      </div>
    </div>
  `).join('');
}

function computeStreak(habits) {
  const sorted = [...habits].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  let prev   = null;

  for (const row of sorted) {
    const anyDone = ['studying', 'workout', 'eating_clean', 'meditation', 'smoke_free']
      .some((k) => row[k]);
    if (!anyDone) break;

    if (!prev) {
      streak = 1;
    } else {
      const diff = (new Date(prev) - new Date(row.date)) / 86400000;
      if (diff === 1) streak++;
      else break;
    }
    prev = row.date;
  }
  return streak;
}
