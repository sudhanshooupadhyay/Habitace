import { fetchHabitsRange, fetchAnxietyRange } from '../lib/supabase.js';
import Chart from 'chart.js/auto';

let chartInstance = null;

export function renderAnalytics() {
  return `
    <div id="analytics-section" class="space-y-6 animate-slide-up">

      <!-- Header -->
      <div class="bg-gradient-to-br from-sky-900/40 to-navy-700 rounded-2xl border border-sky-500/20 p-6 overflow-hidden relative">
        <div class="flex items-start gap-4 relative">
          <div class="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-chart-line text-xl text-sky-400"></i>
          </div>
          <div>
            <h2 class="text-white text-xl font-bold">Discipline Analytics</h2>
            <p class="text-slate-400 text-sm mt-1">
              Visual proof that your workouts don't cause emergencies — they prevent them.
            </p>
          </div>
        </div>

        <!-- Brain + data chart illustration -->
        <svg viewBox="0 0 360 80" xmlns="http://www.w3.org/2000/svg"
             class="w-full mt-4" aria-hidden="true">
          <!-- Grid lines -->
          <line x1="0" y1="65" x2="360" y2="65" stroke="#0284c7" stroke-width="0.4" opacity="0.2"/>
          <line x1="0" y1="48" x2="360" y2="48" stroke="#0284c7" stroke-width="0.4" opacity="0.15"/>
          <line x1="0" y1="31" x2="360" y2="31" stroke="#0284c7" stroke-width="0.4" opacity="0.1"/>
          <!-- Workout (emerald) trend line — generally higher -->
          <polyline
            points="10,58 38,50 66,62 94,42 122,55 150,35 178,48 206,30 234,42 262,22 290,35 318,20 346,28"
            stroke="#10b981" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
          <!-- Fill under workout line -->
          <path
            d="M10,58 38,50 66,62 94,42 122,55 150,35 178,48 206,30 234,42 262,22 290,35 318,20 346,28 L346,72 L10,72 Z"
            fill="#10b981" opacity="0.07"/>
          <!-- Anxiety (red) trend line — lower as workout rises -->
          <polyline
            points="10,38 38,48 66,35 94,55 122,40 150,58 178,45 206,60 234,50 262,65 290,52 318,62 346,58"
            stroke="#f87171" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
          <!-- Fill under anxiety line -->
          <path
            d="M10,38 38,48 66,35 94,55 122,40 150,58 178,45 206,60 234,50 262,65 290,52 318,62 346,58 L346,72 L10,72 Z"
            fill="#f87171" opacity="0.06"/>
          <!-- Data points — workout -->
          <circle cx="150" cy="35" r="3" fill="#10b981" opacity="0.8"/>
          <circle cx="262" cy="22" r="3" fill="#10b981" opacity="0.8"/>
          <circle cx="346" cy="28" r="3" fill="#10b981" opacity="0.8"/>
          <!-- Data points — anxiety -->
          <circle cx="150" cy="58" r="3" fill="#f87171" opacity="0.7"/>
          <circle cx="262" cy="65" r="3" fill="#f87171" opacity="0.7"/>
          <circle cx="346" cy="58" r="3" fill="#f87171" opacity="0.7"/>
          <!-- Insight arrow (upward at right) -->
          <path d="M340,30 L348,20 L356,30" stroke="#38bdf8" stroke-width="1.5" fill="none"
                stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
        </svg>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-2 gap-4" id="summary-cards">
        <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5 text-center">
          <p class="text-2xl font-bold text-slate-500">—</p>
          <p class="text-slate-600 text-xs mt-1">Loading…</p>
        </div>
        <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5 text-center">
          <p class="text-2xl font-bold text-slate-500">—</p>
          <p class="text-slate-600 text-xs mt-1">Loading…</p>
        </div>
      </div>

      <!-- Chart -->
      <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-6">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-white font-semibold flex items-center gap-2">
            <i class="fa-solid fa-magnifying-glass-chart text-sky-400"></i>
            30-Day: Anxiety vs Workouts
          </h3>
          <select id="chart-range"
            class="bg-navy-700 border border-slate-600 text-slate-300 text-xs rounded-lg px-3 py-1.5
                   focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="30">Last 30 days</option>
            <option value="14">Last 14 days</option>
            <option value="7">Last 7 days</option>
          </select>
        </div>

        <div class="relative h-64">
          <canvas id="main-chart"></canvas>
          <div id="chart-loading" class="absolute inset-0 flex items-center justify-center">
            <i class="fa-solid fa-circle-notch fa-spin text-sky-400 text-2xl"></i>
          </div>
        </div>

        <div class="flex items-center justify-center gap-6 mt-4">
          <span class="flex items-center gap-2 text-xs text-slate-400">
            <span class="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
            Workouts
          </span>
          <span class="flex items-center gap-2 text-xs text-slate-400">
            <span class="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
            Anxiety Spikes
          </span>
        </div>

        <div class="mt-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          <p class="text-emerald-300 text-xs text-center">
            <i class="fa-solid fa-lightbulb mr-2"></i>
            <strong>The Pattern:</strong> Days with workouts rarely align with elevated anxiety spikes.
            Your body is stronger than your fear believes.
          </p>
        </div>
      </div>

      <!-- Habit Streak Grid -->
      <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-6">
        <h3 class="text-white font-semibold mb-5 flex items-center gap-2">
          <i class="fa-solid fa-fire text-amber-400"></i>
          Habit Completion Grid
          <span class="text-xs text-slate-500 font-normal ml-1">— last 30 days</span>
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

  const totalWorkouts = habits.filter((h) => h.workout).length;
  const totalAnxiety  = anxiety.length;
  const bestStreak    = computeStreak(habits);

  cards.innerHTML = `
    <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5 text-center">
      <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
        <i class="fa-solid fa-dumbbell text-emerald-400"></i>
      </div>
      <p class="text-2xl font-bold text-white">${totalWorkouts}</p>
      <p class="text-slate-400 text-xs mt-1">Workouts completed</p>
    </div>
    <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5 text-center">
      <div class="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center mx-auto mb-3">
        <i class="fa-solid fa-heart-crack text-red-400"></i>
      </div>
      <p class="text-2xl font-bold text-white">${totalAnxiety}</p>
      <p class="text-slate-400 text-xs mt-1">Anxiety spikes logged</p>
    </div>
    <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5 text-center">
      <div class="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
        <i class="fa-solid fa-fire text-amber-400"></i>
      </div>
      <p class="text-2xl font-bold text-white">${bestStreak}</p>
      <p class="text-slate-400 text-xs mt-1">Longest daily streak</p>
    </div>
    <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5 text-center">
      <div class="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-3">
        <i class="fa-solid fa-percent text-indigo-400"></i>
      </div>
      <p class="text-2xl font-bold text-white">
        ${habits.length ? Math.round((habits.filter((h) => h.workout).length / habits.length) * 100) : 0}%
      </p>
      <p class="text-slate-400 text-xs mt-1">Workout compliance</p>
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
