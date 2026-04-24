import {
  fetchOrCreateTodayHabits, updateHabit, addXp, fetchUser,
  fetchTodaySleep, fetchFocusAreaData, saveWeightLog, saveWorkoutLog,
  saveTodaySleepManual, fetchWorkoutLogs,
} from '../lib/supabase.js';
import { getRandomQuote } from '../lib/quotes.js';
import {
  calcLevel, getRankTitle, calcBMI, bmiCategory, bmiProgressToTarget, generateInsights,
} from '../lib/progressionEngine.js';
import { renderViceTracker, initViceTracker, destroyViceTracker } from './viceTracker.js';

// ─── Habit definitions ────────────────────────────────────────
const BASE_HABITS = [
  { key: 'studying',     label: 'Studying',     icon: 'fa-book-open',   color: 'indigo'  },
  { key: 'workout',      label: 'Workout',       icon: 'fa-dumbbell',    color: 'emerald' },
  { key: 'eating_clean', label: 'Eating Clean',  icon: 'fa-apple-whole', color: 'amber'   },
  { key: 'meditation',   label: 'Meditation',    icon: 'fa-spa',         color: 'purple'  },
];

// Vice-based habits (only shown when user selected the vice during onboarding)
// All vices share the smoke_free DB column — the label/icon/color adapts per vice.
const VICE_HABITS = {
  smoking:      { key: 'smoke_free', label: 'Smoke Free',    icon: 'fa-wind',              color: 'sky'    },
  alcohol:      { key: 'smoke_free', label: 'Alcohol Free',  icon: 'fa-wine-bottle',       color: 'rose'   },
  gambling:     { key: 'smoke_free', label: 'No Gambling',   icon: 'fa-dice',              color: 'orange' },
  junk_food:    { key: 'smoke_free', label: 'No Junk Food',  icon: 'fa-burger',            color: 'amber'  },
  social_media: { key: 'smoke_free', label: 'Screen Limit',  icon: 'fa-mobile-screen',     color: 'indigo' },
};

// Returns the active habit list based on user's onboarding selections
function getHabits(userData) {
  const vices = userData?.vices || [];
  const viceHabits = vices
    .map((v) => VICE_HABITS[v])
    .filter(Boolean)
    .slice(0, 1); // cap at 1 vice habit to keep "Daily Five" intact
  return [...BASE_HABITS, ...viceHabits].slice(0, 5);
}

const HABITS = BASE_HABITS; // legacy alias used in some places below — overridden per-render

const COLOR_MAP = {
  indigo:  { bg: 'bg-indigo-500/20',  text: 'text-indigo-400'  },
  emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  amber:   { bg: 'bg-amber-500/20',   text: 'text-amber-400'   },
  purple:  { bg: 'bg-purple-500/20',  text: 'text-purple-400'  },
  sky:     { bg: 'bg-sky-500/20',     text: 'text-sky-400'     },
  rose:    { bg: 'bg-rose-500/20',    text: 'text-rose-400'    },
  orange:  { bg: 'bg-orange-500/20',  text: 'text-orange-400'  },
};

// Dynamic exercise list state (module-level so it survives re-renders)
let exerciseList  = [];
// Active habit list for the current user (set in renderDashboard)
let currentHabits = [...BASE_HABITS];
// Pending undo timer for habit un-tick
let pendingUntickTimer = null;

// Cardio keyword detection
const CARDIO_KEYWORDS = [
  'treadmill', 'walking', 'walk', 'run', 'running', 'jog', 'jogging',
  'cycling', 'cycle', 'bike', 'biking', 'rowing', 'row', 'rower',
  'elliptical', 'swimming', 'swim', 'stairmaster', 'stair', 'stairs',
  'hiit', 'cardio', 'skierg', 'ski erg', 'assault bike', 'spin',
  'spinning', 'jump rope', 'skipping', 'aerobics', 'zumba', 'dance',
];

function isCardioExercise(name) {
  const lower = name.toLowerCase();
  return CARDIO_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── Helpers ──────────────────────────────────────────────────
const getGreeting   = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
const getTimeOfDay  = () => new Date().getHours() >= 17 ? 'evening' : 'morning';
const formatDate    = () => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const sleepLabel    = (score) => score >= 80 ? '✦ Excellent' : score >= 60 ? '◈ Good' : score >= 40 ? '◇ Fair' : '⚠ Poor';

// ─── Name extraction helpers ──────────────────────────────────
function _extractFirstName(authUser) {
  const fullName = authUser?.user_metadata?.full_name;
  if (fullName) return fullName.split(' ')[0] || 'Warrior';
  const email = authUser?.email || '';
  const local = email.split('@')[0];                          // "john.doe"
  const parts = local.split(/[._\-+]/);                      // ["john","doe"]
  const first = parts[0] || 'Warrior';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function _extractInitials(authUser) {
  const fullName = authUser?.user_metadata?.full_name;
  if (fullName) {
    return fullName.split(' ').map(n => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || '?';
  }
  const email = authUser?.email || '';
  const local = email.split('@')[0];
  const parts = local.split(/[._\-+]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase() || '?';
}

// ─── Avatar helpers ───────────────────────────────────────────
function avatarHtml(authUser, rankColor, rankIcon, size = 14) {
  const url      = authUser?.user_metadata?.avatar_url;
  const initials = _extractInitials(authUser);
  if (url) {
    return `<img src="${url}" alt="${initials}"
                 class="w-full h-full object-cover"
                 referrerpolicy="no-referrer"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
            <div class="w-full h-full bg-${rankColor}-600/30 items-center justify-center hidden">
              <i class="fa-solid ${rankIcon} text-${rankColor}-400 text-lg"></i>
            </div>`;
  }
  return `<div class="w-full h-full bg-${rankColor}-600/30 flex items-center justify-center">
            <span class="text-${rankColor}-300 font-bold text-lg">${initials}</span>
          </div>`;
}

// ─── Main render ──────────────────────────────────────────────
export function renderDashboard(userData, authUser = null) {
  exerciseList = [];
  currentHabits = getHabits(userData);  // dynamic per user
  const quote      = getRandomQuote(getTimeOfDay());
  const xp         = userData?.total_xp || 0;
  const { level, progress, xpToNext } = calcLevel(xp);
  const rank       = getRankTitle(level);
  const bmi        = userData?.current_bmi;
  const bmiCat     = bmiCategory(bmi);
  const bmiPct     = bmiProgressToTarget(bmi);
  const streak     = userData?.current_streak || 0;
  const greeting   = getGreeting();
  // Prefer saved username, fall back to auth name
  const firstName  = userData?.username || _extractFirstName(authUser);

  // Day-N counter — Day 1 = the day the account was created
  const joinDate  = userData?.created_at ? new Date(userData.created_at) : new Date();
  const dayNumber = Math.max(1, Math.floor((Date.now() - joinDate.getTime()) / 86_400_000) + 1);

  return `
    <div id="dashboard-section" class="space-y-5 animate-slide-up">

      <!-- ── Player Card ───────────────────────────────────── -->
      <div id="player-card" class="relative overflow-hidden bg-gradient-to-br from-navy-600 via-navy-600 to-indigo-900/30
                  rounded-2xl border border-indigo-500/25 p-5 shadow-xl transition-all duration-500">

        <!-- Subtle starfield / constellation background -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 200"
             preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <!-- Scattered stars -->
          <circle cx="12"  cy="18"  r="1"   fill="#e0e7ff" opacity="0.25"/>
          <circle cx="55"  cy="8"   r="0.8" fill="#c7d2fe" opacity="0.2"/>
          <circle cx="105" cy="22"  r="1.2" fill="#e0e7ff" opacity="0.18"/>
          <circle cx="175" cy="10"  r="0.8" fill="#c7d2fe" opacity="0.2"/>
          <circle cx="235" cy="25"  r="1"   fill="#e0e7ff" opacity="0.22"/>
          <circle cx="310" cy="12"  r="0.8" fill="#c7d2fe" opacity="0.18"/>
          <circle cx="375" cy="20"  r="1"   fill="#e0e7ff" opacity="0.2"/>
          <circle cx="395" cy="5"   r="0.7" fill="#c7d2fe" opacity="0.15"/>
          <circle cx="30"  cy="160" r="0.8" fill="#e0e7ff" opacity="0.15"/>
          <circle cx="90"  cy="175" r="1"   fill="#c7d2fe" opacity="0.18"/>
          <circle cx="340" cy="180" r="0.8" fill="#e0e7ff" opacity="0.15"/>
          <circle cx="390" cy="165" r="1"   fill="#c7d2fe" opacity="0.18"/>
          <!-- Subtle constellation lines -->
          <line x1="12"  y1="18"  x2="55"  y2="8"   stroke="#6366f1" stroke-width="0.4" opacity="0.08"/>
          <line x1="55"  y1="8"   x2="105" y2="22"  stroke="#6366f1" stroke-width="0.4" opacity="0.08"/>
          <line x1="235" y1="25"  x2="310" y2="12"  stroke="#6366f1" stroke-width="0.4" opacity="0.08"/>
          <line x1="310" y1="12"  x2="375" y2="20"  stroke="#6366f1" stroke-width="0.4" opacity="0.08"/>
          <!-- Rank glow orb (top-right) -->
          <circle cx="370" cy="30" r="55" fill="#6366f1" opacity="0.04"/>
        </svg>

        <!-- Top row: avatar + stats -->
        <div class="relative flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">

            <!-- Avatar with rank ring + level badge -->
            <div class="relative flex-shrink-0">
              <div class="w-14 h-14 rounded-full border-2 border-${rank.color}-500/60
                          overflow-hidden bg-${rank.color}-500/10 animate-pulse-glow">
                ${avatarHtml(authUser, rank.color, rank.icon)}
              </div>
              <!-- Level pip -->
              <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full
                          bg-navy-800 border border-${rank.color}-500/50
                          flex items-center justify-center">
                <span class="text-${rank.color}-400 text-xs font-bold leading-none">${level}</span>
              </div>
            </div>

            <div>
              <p class="text-slate-400 text-xs">${greeting}, ${firstName}</p>
              <p class="text-white font-bold text-lg leading-tight">${rank.title}</p>
              <p class="text-slate-500 text-xs mt-0.5">${xp.toLocaleString()} XP · ${xpToNext.toLocaleString()} to Lv.${level + 1}</p>
            </div>
          </div>

          <div class="text-right">
            <div class="flex items-center gap-1.5 justify-end mb-1">
              <i class="fa-solid fa-fire text-amber-400 text-xs"></i>
              <span class="text-amber-400 text-sm font-bold">${streak}</span>
              <span class="text-slate-500 text-xs">day streak</span>
            </div>
            ${bmi ? `
              <div class="flex items-center gap-1.5 justify-end">
                <i class="fa-solid fa-weight-scale text-${bmiCat?.color || 'slate'}-400 text-xs"></i>
                <span class="text-${bmiCat?.color || 'slate'}-400 text-sm font-bold">${bmi}</span>
                <span class="text-slate-500 text-xs">BMI</span>
              </div>
              <p class="text-${bmiCat?.color || 'slate'}-400 text-xs mt-0.5">${bmiCat?.label || ''}</p>
            ` : `<p class="text-slate-600 text-xs">BMI not set</p>`}
          </div>
        </div>

        <!-- XP progress bar -->
        <div class="relative mb-3">
          <div class="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Level ${level}</span>
            <span>${progress}%</span>
            <span>Level ${level + 1}</span>
          </div>
          <div class="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden">
            <div id="xp-bar"
              class="h-2.5 rounded-full bg-gradient-to-r from-${rank.color}-600 to-${rank.color}-400
                     transition-all duration-700"
              style="width: ${progress}%"></div>
          </div>
        </div>

        <!-- BMI progress bar (if set) -->
        ${bmi ? `
          <div>
            <div class="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>BMI Progress → Target</span>
              <span class="text-${bmiCat?.color || 'slate'}-400">${bmiPct}%</span>
            </div>
            <div class="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
              <div class="h-1.5 rounded-full bg-${bmiCat?.color || 'slate'}-500 transition-all duration-700"
                style="width: ${bmiPct}%"></div>
            </div>
          </div>
        ` : ''}

        <!-- Sleep row — populated async -->
        <div id="sleep-widget" class="relative mt-4 pt-4 border-t border-slate-700/40">
          <div class="flex items-center gap-2 text-slate-600 text-xs">
            <i class="fa-solid fa-moon text-slate-700 text-xs"></i>
            <span>Loading sleep data...</span>
          </div>
        </div>

      </div>

      <!-- ── Focus Area Intelligence ───────────────────────── -->
      <div id="focus-area" class="min-h-[72px]">
        <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-4 flex items-center gap-3">
          <i class="fa-solid fa-circle-notch fa-spin text-indigo-400"></i>
          <p class="text-slate-400 text-sm">Analysing your last 3 days...</p>
        </div>
      </div>

      <!-- ── Daily Briefing ────────────────────────────────── -->
      <div class="relative overflow-hidden bg-gradient-to-br from-navy-600 to-navy-700 rounded-2xl border border-indigo-500/15 p-5">
        <!-- Sunrise horizon illustration -->
        <svg class="absolute bottom-0 right-0 w-40 h-24 pointer-events-none" viewBox="0 0 160 96"
             xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- Sun glow -->
          <circle cx="120" cy="70" r="45" fill="#6366f1" opacity="0.07"/>
          <circle cx="120" cy="70" r="28" fill="#818cf8" opacity="0.08"/>
          <!-- Sun disk -->
          <circle cx="120" cy="70" r="16" fill="#6366f1" opacity="0.18"/>
          <!-- Sun rays -->
          <line x1="120" y1="42" x2="120" y2="36" stroke="#818cf8" stroke-width="1.2" opacity="0.25" stroke-linecap="round"/>
          <line x1="140" y1="50" x2="144" y2="45" stroke="#818cf8" stroke-width="1.2" opacity="0.2"  stroke-linecap="round"/>
          <line x1="148" y1="70" x2="154" y2="70" stroke="#818cf8" stroke-width="1.2" opacity="0.2"  stroke-linecap="round"/>
          <line x1="140" y1="90" x2="144" y2="95" stroke="#818cf8" stroke-width="1.2" opacity="0.15" stroke-linecap="round"/>
          <line x1="100" y1="50" x2="96"  y2="45" stroke="#818cf8" stroke-width="1.2" opacity="0.2"  stroke-linecap="round"/>
          <!-- Horizon line -->
          <line x1="0" y1="80" x2="160" y2="80" stroke="#6366f1" stroke-width="0.6" opacity="0.15"/>
          <!-- Horizon glow band -->
          <rect x="60" y="77" width="100" height="3" rx="1.5" fill="#6366f1" opacity="0.1"/>
          <!-- Stars (upper left) -->
          <circle cx="12" cy="15" r="1"   fill="#e0e7ff" opacity="0.3"/>
          <circle cx="38" cy="8"  r="0.8" fill="#c7d2fe" opacity="0.25"/>
          <circle cx="65" cy="20" r="1"   fill="#e0e7ff" opacity="0.2"/>
        </svg>

        <div class="flex items-start gap-4 relative">
          <div class="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-sun text-indigo-400"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <p class="text-slate-500 text-xs uppercase tracking-widest">${formatDate()}</p>
              <span class="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full font-semibold">Day ${dayNumber}</span>
            </div>
            <h2 class="text-white text-lg font-bold">${getGreeting()}, ${firstName}.</h2>
            <div class="relative mt-2">
              <blockquote id="daily-quote-block" class="text-slate-300 text-sm italic border-l-2 border-indigo-500/40 pl-3">
                "${quote.text}"
                <footer class="text-slate-500 text-xs mt-1 not-italic">— ${quote.author}</footer>
              </blockquote>
              <button id="copy-quote-btn"
                class="mt-2 flex items-center gap-1.5 text-slate-600 hover:text-indigo-400 text-xs transition-colors"
                data-quote="${quote.text.replace(/"/g, '&quot;')}" data-author="${quote.author}">
                <i class="fa-regular fa-copy text-xs"></i><span>Copy quote</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Daily 5 Habits ────────────────────────────────── -->
      <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-white font-semibold flex items-center gap-2">
            <i class="fa-solid fa-list-check text-indigo-400"></i>
            The Daily Five
          </h3>
          <span id="habit-score" class="text-slate-400 text-sm">0/5</span>
        </div>
        <div id="habits-list" class="space-y-2.5">
          <div class="flex items-center justify-center py-6">
            <i class="fa-solid fa-circle-notch fa-spin text-indigo-400 text-xl"></i>
          </div>
        </div>
      </div>

      <!-- ── Vice Quit Tracker ─────────────────────────────── -->
      ${(userData?.vices || []).length > 0 ? renderViceTracker(userData) : ''}

      <!-- ── Workout Log ────────────────────────────────────── -->
      <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5">
        <h3 class="text-white font-semibold flex items-center gap-2 mb-4">
          <i class="fa-solid fa-clipboard-list text-emerald-400"></i>
          Workout Log
          <span class="text-xs text-slate-500 font-normal ml-1">— optional</span>
        </h3>

        <form id="workout-log-form" class="space-y-4">

          <!-- Exercise builder -->
          <div>
            <label class="form-label">Exercises</label>
            <div id="exercise-list-display" class="space-y-2 mb-2"></div>

            <!-- Add row — fields swap between weights and cardio -->
            <div class="flex gap-2 items-center">
              <input id="ex-name" type="text"
                placeholder="Exercise (e.g. Bench Press or Treadmill)"
                class="input-field flex-1 text-sm py-2.5" />

              <!-- Weights fields (default) -->
              <div id="ex-weights-fields" class="flex gap-1.5">
                <input id="ex-sets" type="number" min="1" max="99" placeholder="Sets"
                  class="input-field w-14 text-sm py-2.5 text-center" />
                <input id="ex-reps" type="text" placeholder="Reps"
                  class="input-field w-16 text-sm py-2.5 text-center" />
              </div>

              <!-- Cardio fields (hidden until cardio detected) -->
              <div id="ex-cardio-fields" class="hidden flex gap-1.5">
                <select id="ex-effort"
                  class="input-field w-28 text-sm py-2.5 bg-navy-700">
                  <option value="Easy">Easy</option>
                  <option value="Moderate" selected>Moderate</option>
                  <option value="Hard">Hard</option>
                  <option value="Max Effort">Max Effort</option>
                </select>
                <div class="relative">
                  <input id="ex-duration" type="number" min="1" max="300"
                    placeholder="30" class="input-field w-16 text-sm py-2.5 text-center pr-7" />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">m</span>
                </div>
              </div>

              <button type="button" id="add-exercise"
                class="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors flex-shrink-0">
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
            <p id="ex-type-hint" class="text-slate-600 text-xs mt-1.5">
              Weights: enter sets &amp; reps. Cardio (treadmill, run, cycle…): enter effort &amp; minutes.
            </p>
          </div>

          <textarea id="wl-symptoms" rows="2"
            placeholder="Physical symptoms during workout? (Be honest — this builds your evidence log)"
            class="input-field resize-none text-sm"></textarea>

          <textarea id="wl-fears" rows="2"
            placeholder="Fears you pushed through..."
            class="input-field resize-none text-sm"></textarea>

          <textarea id="wl-notes" rows="2"
            placeholder="Personal notes, observations..."
            class="input-field resize-none text-sm"></textarea>

          <button type="submit"
            class="w-full bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl transition-colors">
            <i class="fa-solid fa-save mr-2"></i>Save Log
          </button>
          <div id="wl-status" class="hidden text-center text-sm text-emerald-400 py-1">
            <i class="fa-solid fa-check-circle mr-1"></i>Workout log saved!
          </div>
        </form>
      </div>

      <!-- ── Weight Update ─────────────────────────────────── -->
      <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5">
        <h3 class="text-white font-semibold flex items-center gap-2 mb-4">
          <i class="fa-solid fa-weight-scale text-sky-400"></i>
          Log Today's Weight
          <span class="text-xs text-slate-500 font-normal ml-1">— updates BMI</span>
        </h3>
        <div class="flex gap-3">
          <div class="relative flex-1">
            <input id="weight-input" type="number" min="30" max="300" step="0.1"
              placeholder="${userData?.weight_kg || '78.5'}"
              class="input-field pr-12 text-sm" />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs">kg</span>
          </div>
          <button id="weight-save"
            class="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
            Log
          </button>
        </div>
        <div id="weight-result" class="hidden mt-3 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center text-sm text-sky-300"></div>
      </div>

      <!-- ── Workout History ───────────────────────────────── -->
      <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5">
        <div class="flex items-center justify-between mb-1">
          <h3 class="text-white font-semibold flex items-center gap-2">
            <i class="fa-solid fa-clock-rotate-left text-indigo-400"></i>
            Workout History
          </h3>
          <button id="load-workout-logs-btn"
            class="text-indigo-400 hover:text-indigo-300 text-xs font-semibold transition-colors flex items-center gap-1.5">
            <i class="fa-solid fa-chevron-down text-xs"></i>View Logs
          </button>
        </div>
        <p class="text-slate-500 text-xs mb-3">Your past workout entries — everything you've logged.</p>
        <div id="workout-history-container" class="hidden space-y-3">
          <div class="flex items-center justify-center py-4">
            <i class="fa-solid fa-circle-notch fa-spin text-indigo-400"></i>
          </div>
        </div>
      </div>

    </div>
  `;
}

// ─── Init ─────────────────────────────────────────────────────
export async function initDashboard(userId, userData = null) {
  // Clean up any running vice tracker interval from a previous render
  destroyViceTracker();

  // Wire copy-quote button (synchronous — no await needed)
  document.getElementById('copy-quote-btn')?.addEventListener('click', (e) => {
    const btn    = e.currentTarget;
    const text   = btn.dataset.quote;
    const author = btn.dataset.author;
    navigator.clipboard?.writeText(`"${text}" — ${author}`).then(() => {
      const span = btn.querySelector('span');
      if (span) { span.textContent = 'Copied!'; setTimeout(() => { span.textContent = 'Copy quote'; }, 2000); }
    });
  });

  // Run in parallel — don't block habits on sleep/focus
  const [habitRow] = await Promise.all([
    fetchOrCreateTodayHabits(userId).catch((err) => {
      console.error('[Dashboard] Habits load failed:', err);
      document.getElementById('habits-list').innerHTML =
        '<p class="text-red-400 text-sm text-center py-4">Failed to load habits.</p>';
      return null;
    }),
    loadSleepWidget(userId),
    loadFocusArea(userId),
  ]);

  if (habitRow) renderHabits(habitRow, userId);
  initWorkoutLog(userId);
  initWeightLog(userId);
  initWorkoutHistory(userId);

  // Start the real-time vice quit tracker if the user has a vice and has committed
  if (userData?.vices?.length > 0) {
    initViceTracker(userData);
  }
}

// ─── Sleep widget — manual input ──────────────────────────────
async function loadSleepWidget(userId) {
  const widget = document.getElementById('sleep-widget');
  if (!widget) return;

  try {
    const sleep = await fetchTodaySleep(userId);
    if (sleep && sleep.garmin_sleep_hours) {
      _renderSleepDisplay(widget, sleep.garmin_sleep_hours, sleep.garmin_sleep_score, userId);
    } else {
      _renderSleepInput(widget, userId);
    }
  } catch (_) {
    _renderSleepInput(widget, userId);
  }
}

function _renderSleepInput(widget, userId) {
  widget.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
        <i class="fa-solid fa-moon text-indigo-400 text-xs"></i>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-slate-400 text-xs font-medium mb-1.5">How many hours did you sleep?</p>
        <div class="flex gap-2">
          <input id="sleep-hours-input" type="number" min="0" max="24" step="0.5"
            placeholder="e.g. 7.5"
            class="input-field text-sm py-1.5 w-24 text-center" />
          <button id="sleep-hours-save"
            class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
            Log Sleep
          </button>
        </div>
      </div>
    </div>`;

  const saveBtn = document.getElementById('sleep-hours-save');
  const doSave  = async () => {
    const input = document.getElementById('sleep-hours-input');
    const hours = parseFloat(input?.value);
    if (!hours || hours <= 0 || hours > 24) { input?.focus(); return; }
    saveBtn.disabled    = true;
    saveBtn.textContent = '...';
    try {
      const result = await saveTodaySleepManual(userId, hours);
      _renderSleepDisplay(widget, hours, result.score, userId);
    } catch (err) {
      console.error('[Sleep] Save failed:', err);
      saveBtn.disabled    = false;
      saveBtn.textContent = 'Log Sleep';
    }
  };

  saveBtn?.addEventListener('click', doSave);
  document.getElementById('sleep-hours-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSave();
  });
}

function _renderSleepDisplay(widget, hours, score, userId) {
  const label = sleepLabel(score);
  const color = score >= 80 ? 'emerald' : score >= 60 ? 'sky' : score >= 40 ? 'amber' : 'red';

  widget.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-${color}-500/20 flex items-center justify-center flex-shrink-0">
        <i class="fa-solid fa-moon text-${color}-400 text-sm"></i>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-0.5">
          <p class="text-white text-sm font-semibold">${hours}h sleep</p>
          <span class="text-xs px-2 py-0.5 rounded-full bg-${color}-500/20 text-${color}-400">${label}</span>
        </div>
        <div class="w-full bg-slate-700/60 rounded-full h-1.5">
          <div class="h-1.5 rounded-full bg-${color}-500 transition-all duration-700"
            style="width: ${score}%"></div>
        </div>
        <p class="text-slate-500 text-xs mt-0.5">Sleep score: ${score}/100</p>
      </div>
      <button id="sleep-edit-btn" title="Edit" class="text-slate-600 hover:text-indigo-400 transition-colors ml-1 flex-shrink-0">
        <i class="fa-solid fa-pen text-xs"></i>
      </button>
    </div>`;

  document.getElementById('sleep-edit-btn')?.addEventListener('click', () => {
    _renderSleepInput(widget, userId);
  });
}

// ─── Focus Area / Areas of Improvement ───────────────────────
async function loadFocusArea(userId) {
  const container = document.getElementById('focus-area');
  if (!container) return;

  try {
    const focusData = await fetchFocusAreaData(userId);
    const insights  = generateInsights(focusData);

    if (insights.length === 0) {
      container.innerHTML = `
        <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-4 flex items-start gap-3">
          <i class="fa-solid fa-circle-check text-emerald-400 mt-0.5"></i>
          <p class="text-slate-300 text-sm">Looking good — no focus areas flagged for today. Keep the momentum.</p>
        </div>`;
      return;
    }

    const top = insights[0]; // Show the highest priority insight
    const colorMap = {
      amber: 'amber', indigo: 'indigo', purple: 'purple',
      emerald: 'emerald', rose: 'rose', sky: 'sky', red: 'red',
    };
    const c = colorMap[top.color] || 'indigo';

    container.innerHTML = `
      <div class="bg-${c}-500/10 border border-${c}-500/30 rounded-2xl p-5">
        <div class="flex items-start gap-3 mb-3">
          <span class="text-lg flex-shrink-0">${top.emoji}</span>
          <div>
            <p class="text-${c}-400 text-xs uppercase tracking-widest font-semibold mb-1">
              Area of Improvement
            </p>
            <p class="text-white font-semibold text-sm">${top.area}</p>
          </div>
          ${insights.length > 1 ? `
            <span class="ml-auto bg-${c}-500/20 text-${c}-400 text-xs px-2 py-0.5 rounded-full flex-shrink-0">
              +${insights.length - 1} more
            </span>` : ''}
        </div>
        <p class="text-slate-300 text-sm leading-relaxed">${top.message}</p>
        ${top.action ? `
          <button class="focus-area-action mt-3 text-${c}-400 text-xs font-semibold hover:text-${c}-300 transition-colors"
            data-section="${top.section}">
            → ${top.action}
          </button>` : ''}
        ${insights.length > 1 ? `
          <div id="more-insights" class="hidden mt-4 space-y-3 pt-3 border-t border-${c}-500/20">
            ${insights.slice(1).map((ins) => `
              <div class="flex items-start gap-2">
                <span class="flex-shrink-0">${ins.emoji}</span>
                <div>
                  <p class="text-slate-400 text-xs font-medium">${ins.area}</p>
                  <p class="text-slate-500 text-xs mt-0.5 leading-relaxed">${ins.message}</p>
                </div>
              </div>
            `).join('')}
          </div>
          <button id="toggle-more-insights" class="mt-3 text-${c}-400/60 hover:text-${c}-400 text-xs transition-colors">
            Show all ${insights.length} insights ↓
          </button>` : ''}
      </div>`;

    // Wire up navigation from focus area
    container.querySelectorAll('.focus-area-action[data-section]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const event = new CustomEvent('navigate', { detail: btn.dataset.section });
        document.dispatchEvent(event);
      });
    });

    document.getElementById('toggle-more-insights')?.addEventListener('click', (e) => {
      const more = document.getElementById('more-insights');
      const isHidden = more.classList.contains('hidden');
      more.classList.toggle('hidden', !isHidden);
      e.target.textContent = isHidden
        ? 'Show less ↑'
        : `Show all ${insights.length} insights ↓`;
    });

  } catch (err) {
    console.error('[FocusArea] Failed:', err);
    container.innerHTML = '';
  }
}

// ─── Habits ───────────────────────────────────────────────────
function renderHabits(habitRow, userId) {
  const list = document.getElementById('habits-list');
  if (!list) return;

  // Check which habit is a "rest day"
  const restDayKey = localStorage.getItem(`rest-day-${new Date().toISOString().split('T')[0]}`);

  list.innerHTML = currentHabits.map((h) => {
    const checked  = habitRow[h.key];
    const isRestDay = h.key === 'workout' && restDayKey === 'workout';
    const c        = COLOR_MAP[h.color] || COLOR_MAP.indigo;
    const displayIcon  = isRestDay ? 'fa-bed' : h.icon;
    const displayLabel = isRestDay ? 'Rest Day' : h.label;
    const subLabel     = checked ? (isRestDay ? 'Recovery earned' : '+10 XP earned') : '10 XP on completion';

    return `
      <div class="habit-row flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200
                  ${checked ? `${c.bg} border-${h.color}-500/30` : 'bg-navy-700/40 border-slate-700/30'}"
           data-key="${h.key}">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${checked ? c.bg : 'bg-slate-700/50'}">
            <i class="fa-solid ${displayIcon} text-xs ${checked ? c.text : 'text-slate-500'}"></i>
          </div>
          <div class="min-w-0">
            <p class="text-white text-sm font-medium">${displayLabel}</p>
            <p class="text-slate-600 text-xs">${subLabel}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          ${h.key === 'workout' && !checked ? `
            <button class="rest-day-btn text-slate-500 hover:text-sky-400 transition-colors text-xs font-medium
                           px-2 py-1 rounded-lg border border-slate-700/50 hover:border-sky-500/30"
              data-habit-id="${habitRow.id}" data-user-id="${userId}">
              <i class="fa-solid fa-bed mr-1 text-xs"></i>Rest
            </button>` : ''}
          <button role="switch" aria-checked="${checked}"
            class="habit-toggle relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-navy-600
                   ${checked ? 'bg-indigo-600' : 'bg-slate-600'}"
            data-key="${h.key}" data-habit-id="${habitRow.id}" data-user-id="${userId}">
            <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200
                         ${checked ? 'translate-x-6' : 'translate-x-1'}"></span>
          </button>
        </div>
      </div>`;
  }).join('');

  updateHabitScore(habitRow);
  updatePlayerCardTheme();
  attachHabitListeners(userId);
}

function updateHabitScore(habitRow) {
  const count = currentHabits.filter((h) => habitRow[h.key]).length;
  const el    = document.getElementById('habit-score');
  if (el) el.textContent = `${count}/${currentHabits.length}`;
  updatePlayerCardTheme(count);
}

function updatePlayerCardTheme(count) {
  // Count from DOM if not supplied
  if (count === undefined) {
    const toggles = document.querySelectorAll('.habit-toggle');
    count = [...toggles].filter((b) => b.getAttribute('aria-checked') === 'true').length;
  }
  const card = document.getElementById('player-card');
  if (!card) return;

  if (count === 0) {
    card.style.borderColor = 'rgba(239,68,68,0.5)';
    card.style.boxShadow   = '0 0 30px rgba(239,68,68,0.08)';
  } else if (count <= 2) {
    card.style.borderColor = 'rgba(245,158,11,0.4)';
    card.style.boxShadow   = '0 0 30px rgba(245,158,11,0.06)';
  } else if (count >= currentHabits.length) {
    card.style.borderColor = 'rgba(16,185,129,0.45)';
    card.style.boxShadow   = '0 0 30px rgba(16,185,129,0.1)';
  } else {
    card.style.borderColor = 'rgba(99,102,241,0.25)';
    card.style.boxShadow   = '';
  }
}

function attachHabitListeners(userId) {
  // ── Rest Day button ──────────────────────────────────────────
  document.querySelectorAll('.rest-day-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id  = btn.dataset.habitId;
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`rest-day-${today}`, 'workout');

      // Mark workout as done (no inconsistency) then re-render the row visually
      try {
        await updateHabit(id, 'workout', true);
        await addXp(userId, 10);
        // Refresh DOM — find the workout toggle and simulate a "checked" state
        const toggle = document.querySelector('.habit-toggle[data-key="workout"]');
        if (toggle) {
          toggle.setAttribute('aria-checked', 'true');
          toggle.classList.replace('bg-slate-600', 'bg-indigo-600');
          toggle.querySelector('span').classList.replace('translate-x-1', 'translate-x-6');
          const row = toggle.closest('.habit-row');
          if (row) {
            row.className = row.className.replace(/bg-navy-700\/40|border-slate-700\/30/g, '');
            row.classList.add('bg-sky-500/20', 'border-sky-500/30');
          }
          // Swap label and icon in the row
          const icon  = row?.querySelector('i.fa-dumbbell');
          const label = row?.querySelector('p.text-white');
          const sub   = row?.querySelector('p.text-slate-600');
          if (icon)  { icon.classList.remove('fa-dumbbell'); icon.classList.add('fa-bed'); }
          if (label) label.textContent = 'Rest Day';
          if (sub)   sub.textContent   = 'Recovery earned';
          // Hide the Rest button
          btn.remove();
        }
        refreshPlayerCard(userId);
        _updateHabitScoreFromDOM();
      } catch (err) {
        console.error('[RestDay] Failed:', err);
        localStorage.removeItem(`rest-day-${today}`);
      }
    });
  });

  // ── Habit toggles ────────────────────────────────────────────
  document.querySelectorAll('.habit-toggle').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const key   = btn.dataset.key;
      const id    = btn.dataset.habitId;
      const wasOn = btn.getAttribute('aria-checked') === 'true';
      const nowOn = !wasOn;

      // Optimistic visual update
      _applyToggleVisual(btn, nowOn, key);
      _updateHabitScoreFromDOM();
      updatePlayerCardTheme();

      if (!nowOn && wasOn) {
        // UN-TICKING: defer DB write, show undo toast
        clearTimeout(pendingUntickTimer);
        _showUndoToast(`${currentHabits.find(h => h.key === key)?.label || 'Habit'} unticked`, () => {
          // UNDO: revert visual
          _applyToggleVisual(btn, wasOn, key);
          _updateHabitScoreFromDOM();
          updatePlayerCardTheme();
          clearTimeout(pendingUntickTimer);
          pendingUntickTimer = null;
        });
        pendingUntickTimer = setTimeout(async () => {
          try { await updateHabit(id, key, false); }
          catch (err) {
            console.error('[Habits] Untick failed:', err);
            _applyToggleVisual(btn, wasOn, key); // revert on error
            _updateHabitScoreFromDOM();
          }
          pendingUntickTimer = null;
        }, 5000);
        return;
      }

      // TICKING ON: immediate DB write
      try {
        await updateHabit(id, key, nowOn);
        if (nowOn) {
          await addXp(userId, 10);
          refreshPlayerCard(userId);
        }
      } catch (err) {
        console.error('[Habits] Update failed:', err);
        _applyToggleVisual(btn, wasOn, key); // revert
        _updateHabitScoreFromDOM();
        updatePlayerCardTheme();
      }
    });
  });
}

function _applyToggleVisual(btn, isOn, key) {
  btn.setAttribute('aria-checked', String(isOn));
  btn.classList.toggle('bg-indigo-600', isOn);
  btn.classList.toggle('bg-slate-600',  !isOn);
  btn.querySelector('span')?.classList.toggle('translate-x-6', isOn);
  btn.querySelector('span')?.classList.toggle('translate-x-1', !isOn);
  const row = btn.closest('.habit-row');
  const h   = currentHabits.find((h) => h.key === key);
  const c   = COLOR_MAP[h?.color];
  if (row) {
    if (isOn && c) {
      row.className = row.className.replace(/bg-navy-700\/40|border-slate-700\/30/g, '');
      row.classList.add(c.bg, `border-${h.color}-500/30`);
    } else {
      row.className = row.className.replace(/bg-\S+\/20|border-\S+\/30/g, '');
      row.classList.add('bg-navy-700/40', 'border-slate-700/30');
    }
  }
}

function _updateHabitScoreFromDOM() {
  const toggles = document.querySelectorAll('.habit-toggle');
  const count   = [...toggles].filter((b) => b.getAttribute('aria-checked') === 'true').length;
  const el      = document.getElementById('habit-score');
  if (el) el.textContent = `${count}/${toggles.length}`;
  updatePlayerCardTheme(count);
}

function _showUndoToast(label, onUndo) {
  // Remove any existing undo toast
  document.getElementById('undo-toast')?.remove();

  const toast = document.createElement('div');
  toast.id = 'undo-toast';
  toast.className = 'fixed left-1/2 -translate-x-1/2 z-50 animate-slide-up';
  toast.style.bottom = 'calc(80px + env(safe-area-inset-bottom, 0px))';
  toast.innerHTML = `
    <div class="flex items-center gap-3 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl px-4 py-2.5 text-sm">
      <span class="text-slate-300">${label}</span>
      <button id="undo-toast-btn" class="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
        Undo
      </button>
    </div>`;
  document.body.appendChild(toast);

  const timer = setTimeout(() => toast.remove(), 5000);
  document.getElementById('undo-toast-btn')?.addEventListener('click', () => {
    clearTimeout(timer);
    toast.remove();
    onUndo();
  });
}

async function refreshPlayerCard(userId) {
  try {
    const user = await fetchUser(userId);
    const { level, progress, xpToNext } = calcLevel(user.total_xp || 0);
    const rank = getRankTitle(level);

    const bar = document.getElementById('xp-bar');
    if (bar) bar.style.width = `${progress}%`;

    // Dispatch a global refresh event so the header XP also updates
    document.dispatchEvent(new CustomEvent('xp-updated', { detail: { user } }));
  } catch (_) { /* non-critical */ }
}

// ─── Workout Log with dynamic exercise builder ────────────────
function initWorkoutLog(userId) {
  exerciseList = [];
  renderExerciseList();

  const nameEl     = document.getElementById('ex-name');
  const weightsDiv = document.getElementById('ex-weights-fields');
  const cardioDiv  = document.getElementById('ex-cardio-fields');
  const hintEl     = document.getElementById('ex-type-hint');

  // ── Live cardio / weights detection ──────────────────────────
  nameEl?.addEventListener('input', () => {
    const cardio = isCardioExercise(nameEl.value);
    weightsDiv?.classList.toggle('hidden', cardio);
    cardioDiv?.classList.toggle('hidden', !cardio);
    if (hintEl) {
      hintEl.innerHTML = cardio
        ? '<i class="fa-solid fa-person-running text-sky-400 mr-1"></i><span class="text-sky-500">Cardio detected</span> — select effort level and enter duration in minutes.'
        : 'Weights: enter sets &amp; reps. Cardio (treadmill, run, cycle…): enter effort &amp; minutes.';
    }
  });

  // ── Add exercise ──────────────────────────────────────────────
  document.getElementById('add-exercise')?.addEventListener('click', () => {
    const name = nameEl?.value.trim();
    if (!name) { nameEl?.focus(); return; }

    if (isCardioExercise(name)) {
      const effort   = document.getElementById('ex-effort')?.value  || 'Moderate';
      const duration = document.getElementById('ex-duration')?.value.trim() || '';
      exerciseList.push({ type: 'cardio', name, effort, duration: duration || '?' });
      if (document.getElementById('ex-duration')) document.getElementById('ex-duration').value = '';
    } else {
      const sets = document.getElementById('ex-sets')?.value.trim();
      const reps = document.getElementById('ex-reps')?.value.trim();
      exerciseList.push({ type: 'weights', name, sets: sets || '—', reps: reps || '—' });
      if (document.getElementById('ex-sets')) document.getElementById('ex-sets').value = '';
      if (document.getElementById('ex-reps')) document.getElementById('ex-reps').value = '';
    }

    renderExerciseList();
    if (nameEl) nameEl.value = '';
    // Reset field state back to weights (default)
    weightsDiv?.classList.remove('hidden');
    cardioDiv?.classList.add('hidden');
    if (hintEl) hintEl.innerHTML = 'Weights: enter sets &amp; reps. Cardio (treadmill, run, cycle…): enter effort &amp; minutes.';
    nameEl?.focus();
  });

  // Enter key on name field triggers add
  nameEl?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('add-exercise')?.click();
    }
  });

  // ── Form submit ───────────────────────────────────────────────
  const form   = document.getElementById('workout-log-form');
  const status = document.getElementById('wl-status');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const routineStr = exerciseList.length
      ? exerciseList.map((ex) =>
          ex.type === 'cardio'
            ? `${ex.name} — ${ex.duration} min (${ex.effort})`
            : `${ex.name} — ${ex.sets} sets × ${ex.reps}`
        ).join('\n')
      : null;

    const payload = {
      routine:         routineStr,
      symptoms_faced:  document.getElementById('wl-symptoms')?.value.trim() || null,
      fears_conquered: document.getElementById('wl-fears')?.value.trim()    || null,
      personal_notes:  document.getElementById('wl-notes')?.value.trim()    || null,
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Saving...';

    try {
      await saveWorkoutLog(userId, payload);
      exerciseList = [];
      renderExerciseList();
      form.reset();
      status.className = 'text-center text-sm text-emerald-400 py-1';
      status.innerHTML = '<i class="fa-solid fa-check-circle mr-1"></i>Workout log saved!';
      status.classList.remove('hidden');
      setTimeout(() => status.classList.add('hidden'), 3500);
    } catch (err) {
      console.error('[WorkoutLog] Save failed:', err);
      status.className = 'text-center text-sm text-red-400 py-1';
      status.textContent = 'Failed to save. Check your connection.';
      status.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-save mr-2"></i>Save Log';
    }
  });
}

function renderExerciseList() {
  const container = document.getElementById('exercise-list-display');
  if (!container) return;

  if (exerciseList.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = exerciseList.map((ex, i) => {
    const isCardio  = ex.type === 'cardio';
    const icon      = isCardio ? 'fa-person-running' : 'fa-dumbbell';
    const colorBg   = isCardio ? 'bg-sky-500/10 border-sky-500/20'    : 'bg-emerald-500/10 border-emerald-500/20';
    const colorText = isCardio ? 'text-sky-400'                        : 'text-emerald-400';
    const details   = isCardio
      ? `${ex.duration} min · ${ex.effort}`
      : `${ex.sets}×${ex.reps}`;
    return `
      <div class="flex items-center gap-2 ${colorBg} border rounded-lg px-3 py-2">
        <i class="fa-solid ${icon} ${colorText} text-xs flex-shrink-0"></i>
        <span class="text-white text-sm flex-1">${escapeHtml(ex.name)}</span>
        <span class="${colorText} text-xs font-mono">${details}</span>
        <button type="button" class="edit-exercise text-slate-500 hover:text-indigo-400 transition-colors ml-1"
          title="Edit" data-index="${i}">
          <i class="fa-solid fa-pen text-xs"></i>
        </button>
        <button type="button" class="remove-exercise text-slate-500 hover:text-red-400 transition-colors"
          data-index="${i}">
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>`;
  }).join('');

  container.querySelectorAll('.edit-exercise').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      const ex  = exerciseList[idx];
      if (!ex) return;

      const nameEl     = document.getElementById('ex-name');
      const weightsDiv = document.getElementById('ex-weights-fields');
      const cardioDiv  = document.getElementById('ex-cardio-fields');
      const hintEl     = document.getElementById('ex-type-hint');

      if (nameEl) nameEl.value = ex.name;

      if (ex.type === 'cardio') {
        weightsDiv?.classList.add('hidden');
        cardioDiv?.classList.remove('hidden');
        const effortEl = document.getElementById('ex-effort');
        const durEl    = document.getElementById('ex-duration');
        if (effortEl) effortEl.value = ex.effort || 'Moderate';
        if (durEl)    durEl.value    = ex.duration || '';
        if (hintEl) hintEl.innerHTML = '<i class="fa-solid fa-person-running text-sky-400 mr-1"></i><span class="text-sky-500">Cardio detected</span> — select effort level and enter duration in minutes.';
      } else {
        weightsDiv?.classList.remove('hidden');
        cardioDiv?.classList.add('hidden');
        const setsEl = document.getElementById('ex-sets');
        const repsEl = document.getElementById('ex-reps');
        if (setsEl) setsEl.value = ex.sets !== '—' ? ex.sets : '';
        if (repsEl) repsEl.value = ex.reps !== '—' ? ex.reps : '';
        if (hintEl) hintEl.innerHTML = 'Weights: enter sets &amp; reps. Cardio (treadmill, run, cycle…): enter effort &amp; minutes.';
      }

      exerciseList.splice(idx, 1);
      renderExerciseList();
      nameEl?.focus();
    });
  });

  container.querySelectorAll('.remove-exercise').forEach((btn) => {
    btn.addEventListener('click', () => {
      exerciseList.splice(parseInt(btn.dataset.index, 10), 1);
      renderExerciseList();
    });
  });
}

// ─── Weight log ───────────────────────────────────────────────
function initWeightLog(userId) {
  document.getElementById('weight-save')?.addEventListener('click', async () => {
    const input   = document.getElementById('weight-input');
    const result  = document.getElementById('weight-result');
    const saveBtn = document.getElementById('weight-save');

    const weight = parseFloat(input?.value);
    if (!weight || weight < 30 || weight > 300) {
      input?.focus();
      return;
    }

    // Need height from profile — fetch it
    saveBtn.disabled = true;
    saveBtn.textContent = '...';

    try {
      const user = await fetchUser(userId);
      if (!user.height_cm) {
        result.textContent = 'Height not set — complete onboarding first.';
        result.className = 'mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center text-sm text-amber-400';
        result.classList.remove('hidden');
        return;
      }

      const bmi = calcBMI(weight, user.height_cm);
      const cat = bmiCategory(bmi);

      await saveWeightLog(userId, weight, bmi);

      if (input) input.value = '';
      result.innerHTML = `
        <span class="text-${cat.color}-400 font-semibold">BMI ${bmi}</span>
        <span class="text-slate-400 text-xs ml-2">${cat.label} — ${cat.tip}</span>`;
      result.className = `mt-3 p-3 rounded-xl bg-${cat.color}-500/10 border border-${cat.color}-500/20 text-center text-sm`;
      result.classList.remove('hidden');

      // Refresh player card BMI display
      refreshPlayerCard(userId);
      setTimeout(() => result.classList.add('hidden'), 5000);
    } catch (err) {
      console.error('[WeightLog] Failed:', err);
      result.textContent = 'Failed to save weight.';
      result.className = 'mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center text-sm text-red-400';
      result.classList.remove('hidden');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Log';
    }
  });
}

// ─── Workout History ──────────────────────────────────────────
function initWorkoutHistory(userId) {
  const btn       = document.getElementById('load-workout-logs-btn');
  const container = document.getElementById('workout-history-container');
  if (!btn || !container) return;

  let loaded = false;

  btn.addEventListener('click', async () => {
    const isHidden = container.classList.contains('hidden');
    container.classList.toggle('hidden', !isHidden);

    // Update button label + chevron direction
    btn.innerHTML = isHidden
      ? '<i class="fa-solid fa-chevron-up text-xs"></i>Hide Logs'
      : '<i class="fa-solid fa-chevron-down text-xs"></i>View Logs';

    if (isHidden && !loaded) {
      loaded = true;
      try {
        const logs = await fetchWorkoutLogs(userId, 20);
        renderWorkoutHistoryLogs(container, logs);
      } catch (err) {
        console.error('[WorkoutHistory] Failed:', err);
        container.innerHTML = '<p class="text-red-400 text-sm text-center py-2">Failed to load logs.</p>';
      }
    }
  });
}

function renderWorkoutHistoryLogs(container, logs) {
  if (!logs.length) {
    container.innerHTML = `
      <div class="text-center py-4">
        <i class="fa-solid fa-clipboard-list text-slate-700 text-2xl mb-2"></i>
        <p class="text-slate-500 text-sm">No workout logs yet. Start logging above!</p>
      </div>`;
    return;
  }

  container.innerHTML = logs.map((log) => {
    const dateStr  = new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const exercises = (log.routine || '').split('\n').filter(Boolean);

    return `
      <div class="bg-navy-700/50 rounded-xl border border-slate-700/40 overflow-hidden">
        <div class="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/40">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-calendar-day text-indigo-400 text-xs"></i>
            <span class="text-white text-sm font-semibold">${escapeHtml(dateStr)}</span>
          </div>
          ${exercises.length ? `<span class="text-slate-500 text-xs">${exercises.length} exercise${exercises.length > 1 ? 's' : ''}</span>` : ''}
        </div>
        <div class="px-4 py-3 space-y-2.5">
          ${exercises.length ? `
            <div>
              <p class="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1.5">Exercises</p>
              <div class="space-y-1">
                ${exercises.map((ex) => `
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-dumbbell text-emerald-500/60 text-xs flex-shrink-0"></i>
                    <span class="text-slate-300 text-xs">${escapeHtml(ex)}</span>
                  </div>`).join('')}
              </div>
            </div>` : ''}
          ${log.symptoms_faced ? `
            <div>
              <p class="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Symptoms</p>
              <p class="text-slate-400 text-xs leading-relaxed">${escapeHtml(log.symptoms_faced)}</p>
            </div>` : ''}
          ${log.fears_conquered ? `
            <div>
              <p class="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Fears Pushed Through</p>
              <p class="text-slate-400 text-xs leading-relaxed">${escapeHtml(log.fears_conquered)}</p>
            </div>` : ''}
          ${log.personal_notes ? `
            <div>
              <p class="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Notes</p>
              <p class="text-slate-400 text-xs leading-relaxed">${escapeHtml(log.personal_notes)}</p>
            </div>` : ''}
          ${!exercises.length && !log.symptoms_faced && !log.fears_conquered && !log.personal_notes
            ? '<p class="text-slate-600 text-xs italic">No details recorded.</p>' : ''}
        </div>
      </div>`;
  }).join('');
}

// ─── Util ─────────────────────────────────────────────────────
function escapeHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
