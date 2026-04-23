/**
 * Resources & Progress Component
 *
 * Shows:
 *  1. Motivational progress showcase — level, XP, rank, streak
 *  2. 14-day consistency heatmap
 *  3. Milestone badges
 *  4. Personalised YouTube resource recommendations
 */

import { supabase } from '../lib/supabase.js';
import { calcLevel, getRankTitle } from '../lib/progressionEngine.js';

// ─── YouTube resource library ─────────────────────────────────
const LIBRARY = [
  {
    id:       'huberman',
    channel:  'Huberman Lab',
    handle:   '@hubermanlab',
    url:      'https://www.youtube.com/@hubermanlab',
    icon:     'fa-brain',
    color:    'indigo',
    tagline:  'Neuroscience tools for everyday life',
    desc:     'Andrew Huberman (Stanford) breaks down the science of stress, anxiety, sleep, focus, and physical performance with actionable protocols you can use immediately.',
    topics:   ['Stress & Anxiety Management', 'Sleep Optimisation', 'Focus & Dopamine', 'Breathing Protocols'],
    triggers: { anxiety: 3, sleep: 2, stress: 3, performance: 2 },
    baseScore: 70,
  },
  {
    id:       'therapynutshell',
    channel:  'Therapy in a Nutshell',
    handle:   '@TherapyinaNutshell',
    url:      'https://www.youtube.com/@TherapyinaNutshell',
    icon:     'fa-heart',
    color:    'rose',
    tagline:  'CBT & anxiety skills — practical & clinical',
    desc:     'Emma McAdam (licensed therapist) teaches Cognitive Behavioural Therapy tools used in real clinical practice — specific episodes target health anxiety, panic, and catastrophic thinking.',
    topics:   ['Health Anxiety (specific)', 'CBT Techniques', 'Panic & Catastrophising', 'Emotional Regulation'],
    triggers: { anxiety: 5, health_anxiety: 5 },
    baseScore: 50,
  },
  {
    id:       'healthygamergg',
    channel:  'HealthyGamerGG',
    handle:   '@HealthyGamerGG',
    url:      'https://www.youtube.com/@HealthyGamerGG',
    icon:     'fa-shield-halved',
    color:    'teal',
    tagline:  'Dr. K — Harvard psychiatrist, no fluff',
    desc:     "Dr. Alok Kanojia (Harvard psychiatrist) addresses anxiety, burnout, and mental health through a lens that's direct, evidence-based, and actually relatable. Particularly strong on breaking anxiety loops.",
    topics:   ['Breaking Anxiety Cycles', 'Mental Clarity', 'Burnout Recovery', 'Building Discipline'],
    triggers: { anxiety: 4, consistency_low: 3, motivation: 3 },
    baseScore: 55,
  },
  {
    id:       'jeffnippard',
    channel:  'Jeff Nippard',
    handle:   '@JeffNippard',
    url:      'https://www.youtube.com/@JeffNippard',
    icon:     'fa-dumbbell',
    color:    'emerald',
    tagline:  'Science-based training — zero broscience',
    desc:     'Kinesiology graduate. Every video is peer-reviewed and referenced. Ideal if you want to optimise your workout program rather than just survive it — technique, volume, and progressive overload done right.',
    topics:   ['Full-Body Programming', 'Progressive Overload Science', 'Injury-Free Training', 'Body Recomposition'],
    triggers: { workout_low: 2, fitness: 3, performance: 2 },
    baseScore: 60,
  },
  {
    id:       'athleanx',
    channel:  'AthleanX',
    handle:   '@athleanx',
    url:      'https://www.youtube.com/@athleanx',
    icon:     'fa-person-running',
    color:    'sky',
    tagline:  'Athletic performance, injury prevention',
    desc:     "Jeff Cavaliere (physical therapist + strength coach) focuses on training like an athlete — strong emphasis on injury prevention, joint health, and building functional strength that actually carries over to real life.",
    topics:   ['Injury Prevention', 'Home & Gym Workouts', 'Posture & Mobility', 'Athletic Conditioning'],
    triggers: { workout_low: 3, fitness: 3, beginner: 2 },
    baseScore: 55,
  },
  {
    id:       'rp',
    channel:  'Renaissance Periodization',
    handle:   '@RenaissancePeriodization',
    url:      'https://www.youtube.com/@RenaissancePeriodization',
    icon:     'fa-chart-line',
    color:    'violet',
    tagline:  'PhD-level lifting science made practical',
    desc:     'Dr. Mike Israetel and team apply sport science to bodybuilding — hypertrophy research, diet phases, recovery science. Best for intermediate to advanced lifters who want to stop guessing and start optimising.',
    topics:   ['Hypertrophy Science', 'Diet & Cutting', 'Training Volume', 'Periodisation'],
    triggers: { fitness: 2, advanced: 3, performance: 3 },
    baseScore: 45,
  },
  {
    id:       'thomas',
    channel:  'Thomas DeLauer',
    handle:   '@ThomasDeLauerOfficial',
    url:      'https://www.youtube.com/@ThomasDeLauerOfficial',
    icon:     'fa-apple-whole',
    color:    'amber',
    tagline:  'Nutrition, fasting & metabolic health',
    desc:     'Deep dives into nutrition science — intermittent fasting, metabolic flexibility, body composition, and how food choices directly affect cognition, energy, and inflammation. Highly relevant if BMI is a focus.',
    topics:   ['Intermittent Fasting', 'Fat Loss Science', 'Anti-Inflammation Diet', 'Metabolic Health'],
    triggers: { bmi_high: 4, nutrition: 3, fitness: 1 },
    baseScore: 50,
  },
  {
    id:       'wimhof',
    channel:  'Wim Hof',
    handle:   '@wimhof1',
    url:      'https://www.youtube.com/@wimhof1',
    icon:     'fa-wind',
    color:    'cyan',
    tagline:  'Breathing & cold exposure — immediate calm',
    desc:     'Wim Hof Method combines specific breathing exercises with cold exposure to lower stress hormones, boost immune function, and create a measurable shift in mood and energy within minutes.',
    topics:   ['Wim Hof Breathing', 'Cold Exposure Protocol', 'Stress Hormones', 'Immune Resilience'],
    triggers: { anxiety: 2, stress: 3, meditation: 2 },
    baseScore: 55,
  },
  {
    id:       'peterattia',
    channel:  'Peter Attia MD',
    handle:   '@PeterAttiaMD',
    url:      'https://www.youtube.com/@PeterAttiaMD',
    icon:     'fa-stethoscope',
    color:    'slate',
    tagline:  'Longevity science & health optimisation',
    desc:     "Dr. Peter Attia translates longevity research into practical protocols — Zone 2 cardio, VO₂ Max, cancer screening, sleep, strength training for a longer healthspan. Best for those who want to understand the 'why' behind everything.",
    topics:   ['Zone 2 Cardio', 'VO₂ Max & Longevity', 'Sleep Architecture', 'Strength for Longevity'],
    triggers: { advanced: 2, performance: 3, sleep: 2 },
    baseScore: 45,
  },
  {
    id:       'kati',
    channel:  'Kati Morton',
    handle:   '@KatiMorton',
    url:      'https://www.youtube.com/@KatiMorton',
    icon:     'fa-comment-medical',
    color:    'pink',
    tagline:  'Licensed therapist — mental health made clear',
    desc:     'Kati Morton is a licensed marriage and family therapist covering anxiety disorders, OCD, health anxiety, and panic in clear, non-clinical language — great companion resource to professional therapy.',
    topics:   ['OCD & Health Anxiety', 'Panic Disorder', 'Therapy Techniques', 'Self-Care Strategies'],
    triggers: { anxiety: 3, health_anxiety: 4 },
    baseScore: 45,
  },
];

// ─── Motivational messages (must match getRankTitle() titles) ─
const RANK_MOTIVATIONS = {
  Initiate:     "Every legend starts exactly here. The fact that you're tracking means you're already ahead of 90% of people.",
  Apprentice:   "Momentum is building. Consistency compounds. The version of you in 90 days will be unrecognisable.",
  Warrior:      "You've proven you can start. Now prove you can sustain. Warriors aren't born — they're forged through repetition.",
  Champion:     "You're in rare company. Most people quit before reaching this level. This is where real transformation lives.",
  Legend:       "Your habits are becoming part of your identity. You're not just doing the work — you ARE the work.",
  Titan:        "Elite tier. Your discipline is no longer willpower — it's a system. Protect it like the asset it is.",
  Transcendent: "You've built something most people only dream about. Your only opponent now is the ceiling you set.",
};

// ─── Render ───────────────────────────────────────────────────
export function renderResources() {
  return `
    <div id="resources-section" class="space-y-5 animate-slide-up">

      <!-- Progress hero -->
      <div id="progress-hero" class="relative overflow-hidden bg-gradient-to-br from-indigo-900/50 to-navy-700 rounded-2xl border border-indigo-500/20 p-5">
        <div class="flex items-center justify-center py-4">
          <i class="fa-solid fa-circle-notch fa-spin text-indigo-400 text-xl"></i>
        </div>
      </div>

      <!-- Consistency heatmap -->
      <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-white font-semibold flex items-center gap-2">
            <i class="fa-solid fa-fire text-amber-400"></i>
            14-Day Consistency
          </h3>
          <span id="consistency-pct" class="text-slate-500 text-sm"></span>
        </div>
        <div id="heatmap-grid" class="flex gap-1.5 flex-wrap">
          ${Array.from({ length: 14 }, (_, i) => `
            <div class="heatmap-day w-8 h-8 rounded-lg bg-slate-700/50 border border-slate-700/30 flex items-center justify-center"
              data-day="${i}" title="Loading...">
              <span class="text-slate-600 text-xs">${14 - i}</span>
            </div>`).join('')}
        </div>
        <div id="heatmap-legend" class="flex items-center gap-3 mt-3 text-xs text-slate-600">
          <div class="flex items-center gap-1"><div class="w-3 h-3 rounded bg-slate-700"></div><span>0%</span></div>
          <div class="flex items-center gap-1"><div class="w-3 h-3 rounded bg-amber-600/50"></div><span>≤40%</span></div>
          <div class="flex items-center gap-1"><div class="w-3 h-3 rounded bg-indigo-500/60"></div><span>≤80%</span></div>
          <div class="flex items-center gap-1"><div class="w-3 h-3 rounded bg-emerald-500"></div><span>100%</span></div>
        </div>
      </div>

      <!-- Milestones -->
      <div id="milestones-section" class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5">
        <h3 class="text-white font-semibold flex items-center gap-2 mb-4">
          <i class="fa-solid fa-trophy text-amber-400"></i>
          Milestone Badges
        </h3>
        <div id="milestones-grid" class="grid grid-cols-3 gap-2">
          <div class="flex items-center justify-center py-3 col-span-3">
            <i class="fa-solid fa-circle-notch fa-spin text-slate-500 text-sm"></i>
          </div>
        </div>
      </div>

      <!-- YouTube Resources -->
      <div>
        <div class="flex items-center gap-2 px-1 mb-4">
          <i class="fa-brands fa-youtube text-red-500 text-lg"></i>
          <h3 class="text-white font-bold text-lg">Your Resource Stack</h3>
        </div>
        <p id="resources-context" class="text-slate-400 text-xs px-1 mb-4 leading-relaxed"></p>
        <div id="resources-grid" class="space-y-4">
          <div class="flex items-center justify-center py-6">
            <i class="fa-solid fa-circle-notch fa-spin text-red-400 text-xl"></i>
          </div>
        </div>
      </div>

    </div>
  `;
}

// ─── Init ─────────────────────────────────────────────────────
export async function initResources(userId, userProfile, authUser = null) {
  const today        = new Date().toISOString().split('T')[0];
  const days14Ago    = new Date(Date.now() - 13 * 864e5).toISOString().split('T')[0];
  const days30Ago    = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];

  // Load all data in parallel
  const [habitsRes, anxietyRes, workoutsRes] = await Promise.allSettled([
    supabase.from('habits').select('*').eq('user_id', userId).gte('date', days14Ago).order('date', { ascending: true }),
    supabase.from('anxiety_vault').select('id').eq('user_id', userId).gte('created_at', days30Ago),
    supabase.from('workout_logs').select('id').eq('user_id', userId).gte('date', days14Ago),
  ]);

  const habits14  = habitsRes.status === 'fulfilled'  ? (habitsRes.value.data  || []) : [];
  const anxietyCount = anxietyRes.status === 'fulfilled' ? (anxietyRes.value.data?.length || 0) : 0;
  const workoutCount = workoutsRes.status === 'fulfilled' ? (workoutsRes.value.data?.length || 0) : 0;

  const profile = userProfile || {};

  renderProgressHero(profile, authUser);
  renderHeatmap(habits14);
  renderMilestones(profile, habits14, anxietyCount);
  renderResourceCards(profile, habits14, anxietyCount, workoutCount);
}

// ─── Name extraction helpers ──────────────────────────────────
function _extractFirstName(authUser) {
  const fullName = authUser?.user_metadata?.full_name;
  if (fullName) return fullName.split(' ')[0] || 'Warrior';
  const email = authUser?.email || '';
  const local = email.split('@')[0];
  const parts = local.split(/[._\-+]/);
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

// ─── Progress hero ────────────────────────────────────────────
function renderProgressHero(profile, authUser = null) {
  const hero = document.getElementById('progress-hero');
  if (!hero) return;

  const xp         = profile.total_xp    || 0;
  const level      = profile.current_level || 1;
  const streak     = profile.streak_days  || 0;
  const { progress, xpToNext } = calcLevel(xp);
  const rank       = getRankTitle(level);
  const motivation = RANK_MOTIVATIONS[rank.title] || RANK_MOTIVATIONS.Initiate;

  const avatarUrl  = authUser?.user_metadata?.avatar_url;
  const firstName  = _extractFirstName(authUser);
  const initials   = _extractInitials(authUser);

  const avatarEl = avatarUrl
    ? `<img src="${avatarUrl}" alt="${firstName}"
            class="w-full h-full object-cover"
            referrerpolicy="no-referrer"
            onerror="this.parentElement.innerHTML='<span class=\\'text-${rank.color}-300 font-bold text-xl\\'>${initials}</span>'" />`
    : `<span class="text-${rank.color}-300 font-bold text-xl">${initials}</span>`;

  const streakEl = streak >= 3
    ? `<div class="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg px-2.5 py-1">
         <i class="fa-solid fa-fire text-amber-400 text-xs"></i>
         <span class="text-amber-300 text-xs font-semibold">${streak}-day streak</span>
       </div>`
    : `<span class="text-slate-500 text-xs">Start your streak today →</span>`;

  hero.innerHTML = `
    <!-- Rank constellation background -->
    <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 220"
         preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="heroGlow" cx="85%" cy="20%">
          <stop offset="0%" stop-color="currentColor" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Glow orb top-right in rank color -->
      <circle cx="360" cy="30" r="90" fill="#6366f1" opacity="0.1"/>
      <!-- Stars -->
      <circle cx="20"  cy="15" r="1.2" fill="#e0e7ff" opacity="0.35"/>
      <circle cx="70"  cy="8"  r="0.9" fill="#c7d2fe" opacity="0.3"/>
      <circle cx="140" cy="18" r="1.4" fill="#e0e7ff" opacity="0.3"/>
      <circle cx="210" cy="10" r="0.9" fill="#c7d2fe" opacity="0.25"/>
      <circle cx="290" cy="20" r="1.2" fill="#e0e7ff" opacity="0.3"/>
      <circle cx="370" cy="8"  r="0.9" fill="#c7d2fe" opacity="0.25"/>
      <circle cx="40"  cy="190" r="1"  fill="#e0e7ff" opacity="0.2"/>
      <circle cx="380" cy="195" r="1"  fill="#c7d2fe" opacity="0.2"/>
      <!-- Subtle geometric diamond at top-right -->
      <path d="M360,5 L375,20 L360,35 L345,20 Z" fill="#6366f1" opacity="0.08"/>
      <path d="M360,10 L370,20 L360,30 L350,20 Z" fill="#818cf8" opacity="0.1"/>
      <!-- Faint constellation lines -->
      <line x1="20"  y1="15" x2="70"  y2="8"  stroke="#6366f1" stroke-width="0.4" opacity="0.1"/>
      <line x1="70"  y1="8"  x2="140" y2="18" stroke="#6366f1" stroke-width="0.4" opacity="0.1"/>
      <line x1="210" y1="10" x2="290" y2="20" stroke="#6366f1" stroke-width="0.4" opacity="0.1"/>
    </svg>

    <div class="flex items-start gap-4 mb-5 relative">

      <!-- Avatar with rank ring -->
      <div class="relative flex-shrink-0">
        <div class="w-16 h-16 rounded-full border-2 border-${rank.color}-500/60
                    overflow-hidden bg-${rank.color}-500/10 flex items-center justify-center">
          ${avatarEl}
        </div>
        <!-- Rank icon badge -->
        <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full
                    bg-navy-800 border border-${rank.color}-500/50
                    flex items-center justify-center">
          <i class="fa-solid ${rank.icon} text-${rank.color}-400 text-xs"></i>
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-slate-400 text-xs mb-0.5">Keep going, ${firstName}</p>
        <div class="flex items-center gap-2 flex-wrap mb-1">
          <span class="text-white font-bold text-lg leading-none">${rank.title}</span>
          <span class="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full font-semibold">Lv.${level}</span>
        </div>
        <p class="text-slate-400 text-sm font-medium">${xp.toLocaleString()} XP</p>
        <div class="flex items-center gap-2 mt-1.5">
          ${streakEl}
        </div>
      </div>
    </div>

    <!-- XP Progress bar -->
    <div class="mb-4 relative">
      <div class="flex justify-between text-xs mb-1.5">
        <span class="text-slate-500">Level ${level} → ${level + 1}</span>
        <span class="text-indigo-400 font-medium">${xpToNext} XP to go</span>
      </div>
      <div class="h-2.5 bg-slate-700 rounded-full overflow-hidden">
        <div class="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-500 transition-all duration-700"
          style="width: ${progress}%"></div>
      </div>
      <p class="text-slate-600 text-xs mt-1 text-right">${Math.round(progress)}% to next level</p>
    </div>

    <!-- Motivation quote -->
    <div class="relative bg-slate-800/60 rounded-xl p-3.5 border-l-2 border-${rank.color}-500/50">
      <p class="text-slate-300 text-xs leading-relaxed italic">"${motivation}"</p>
    </div>
  `;
}

// ─── Consistency heatmap ──────────────────────────────────────
function renderHeatmap(habits14) {
  const grid    = document.getElementById('heatmap-grid');
  const pctEl   = document.getElementById('consistency-pct');
  if (!grid) return;

  const FIELDS  = ['studying', 'workout', 'eating_clean', 'meditation', 'smoke_free'];
  const today   = new Date();

  // Build lookup by date string
  const byDate = {};
  habits14.forEach((h) => { byDate[h.date] = h; });

  let totalPct = 0;
  let totalDays = 0;

  const tiles = Array.from({ length: 14 }, (_, i) => {
    const d     = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    const dateStr = d.toISOString().split('T')[0];
    const h     = byDate[dateStr];
    const isToday = dateStr === today.toISOString().split('T')[0];

    let completed = 0;
    if (h) {
      FIELDS.forEach((f) => { if (h[f]) completed++; });
    }
    const pct = h ? completed / FIELDS.length : 0;
    totalPct += pct;
    totalDays++;

    const color = pct === 0
      ? 'bg-slate-700/50 border-slate-700/30'
      : pct <= 0.4
      ? 'bg-amber-600/40 border-amber-600/20'
      : pct <= 0.8
      ? 'bg-indigo-500/50 border-indigo-500/20'
      : 'bg-emerald-500/80 border-emerald-500/40';

    const label = isToday ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });

    return `
      <div class="relative group w-8 h-8 rounded-lg ${color} border flex items-center justify-center ${isToday ? 'ring-2 ring-white/30' : ''}
                  cursor-default transition-all duration-200">
        <span class="text-white/60 text-xs font-medium">${completed || (h ? '0' : '')}</span>
        <!-- Tooltip -->
        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 border border-slate-700
                    rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
          ${label}: ${h ? `${completed}/5` : 'No data'}
        </div>
      </div>`;
  });

  grid.innerHTML = tiles.join('');

  const avgPct = totalDays > 0 ? Math.round((totalPct / totalDays) * 100) : 0;
  if (pctEl) {
    const color = avgPct >= 75 ? 'emerald' : avgPct >= 50 ? 'indigo' : 'amber';
    pctEl.innerHTML = `<span class="text-${color}-400 font-semibold">${avgPct}% average</span>`;
  }
}

// ─── Milestones ───────────────────────────────────────────────
const MILESTONES = [
  { id: 'first_log',    icon: 'fa-flag',           color: 'indigo',  label: 'First Step',    desc: 'Logged your first habit',          check: (p, h) => h.length > 0 },
  { id: 'streak3',      icon: 'fa-fire',            color: 'amber',   label: '3-Day Streak',  desc: '3 consecutive days tracked',       check: (p) => (p.streak_days || 0) >= 3 },
  { id: 'streak7',      icon: 'fa-fire-flame-curved',color: 'orange', label: 'Week Warrior',  desc: '7-day streak achieved',            check: (p) => (p.streak_days || 0) >= 7 },
  { id: 'streak30',     icon: 'fa-crown',           color: 'yellow',  label: '30-Day Iron',   desc: '30 consecutive days — elite',      check: (p) => (p.streak_days || 0) >= 30 },
  { id: 'xp500',        icon: 'fa-star',            color: 'sky',     label: '500 XP',        desc: 'Earned 500 total XP',              check: (p) => (p.total_xp || 0) >= 500 },
  { id: 'xp1000',       icon: 'fa-star',            color: 'indigo',  label: '1,000 XP',      desc: 'Crossed 1,000 XP — Level milestone',check: (p) => (p.total_xp || 0) >= 1000 },
  { id: 'xp5000',       icon: 'fa-gem',             color: 'violet',  label: '5,000 XP',      desc: 'Elite XP threshold',              check: (p) => (p.total_xp || 0) >= 5000 },
  { id: 'lvl5',         icon: 'fa-shield-halved',   color: 'emerald', label: 'Level 5',       desc: 'Reached Level 5 — Guardian',      check: (p) => (p.current_level || 1) >= 5 },
  { id: 'lvl10',        icon: 'fa-award',           color: 'rose',    label: 'Level 10',      desc: 'Level 10 — Champion rank',        check: (p) => (p.current_level || 1) >= 10 },
];

function renderMilestones(profile, habits14, anxietyCount) {
  const grid = document.getElementById('milestones-grid');
  if (!grid) return;

  const tiles = MILESTONES.map((m) => {
    const earned = m.check(profile, habits14, anxietyCount);
    return `
      <div class="flex flex-col items-center gap-1.5 p-2.5 rounded-xl ${earned ? `bg-${m.color}-500/15 border border-${m.color}-500/30` : 'bg-slate-800/30 border border-slate-700/20'}">
        <div class="w-9 h-9 rounded-xl ${earned ? `bg-${m.color}-500/30` : 'bg-slate-700/50'} flex items-center justify-center">
          <i class="fa-solid ${m.icon} text-sm ${earned ? `text-${m.color}-400` : 'text-slate-600'}"></i>
        </div>
        <p class="text-xs font-semibold text-center leading-tight ${earned ? 'text-white' : 'text-slate-600'}">${m.label}</p>
        ${earned ? `<div class="w-1.5 h-1.5 rounded-full bg-${m.color}-400"></div>` : `<div class="w-1.5 h-1.5 rounded-full bg-slate-700"></div>`}
      </div>`;
  });

  grid.innerHTML = tiles.join('');
}

// ─── Resource personalisation ─────────────────────────────────
function scoreResources(profile, habits14, anxietyCount, workoutCount) {
  const level    = profile.current_level || 1;
  const bmi      = profile.current_bmi || profile.initial_bmi || 22;

  const FIELDS   = ['studying', 'workout', 'eating_clean', 'meditation', 'smoke_free'];
  let totalDone  = 0, totalPossible = 0;
  let workoutDone = 0;

  habits14.forEach((h) => {
    FIELDS.forEach((f) => { if (h[f]) totalDone++; });
    if (h.workout) workoutDone++;
    totalPossible += FIELDS.length;
  });

  const consistencyRate = totalPossible > 0 ? totalDone / totalPossible : 0;
  const workoutRate     = habits14.length > 0 ? workoutDone / habits14.length : 0;

  const signals = {
    anxiety:          anxietyCount >= 3,
    health_anxiety:   anxietyCount >= 5,
    stress:           anxietyCount >= 2,
    consistency_low:  consistencyRate < 0.5,
    motivation:       consistencyRate < 0.4,
    workout_low:      workoutRate < 0.3,
    fitness:          true,
    sleep:            true,
    performance:      level >= 5,
    advanced:         level >= 7,
    beginner:         level < 3,
    bmi_high:         bmi > 26,
    nutrition:        bmi > 24 || bmi < 19,
    meditation:       true,
  };

  return LIBRARY
    .map((r) => {
      let score = r.baseScore;
      Object.entries(r.triggers).forEach(([trigger, weight]) => {
        if (signals[trigger]) score += weight * 10;
      });
      return { ...r, score };
    })
    .sort((a, b) => b.score - a.score);
}

function renderResourceCards(profile, habits14, anxietyCount, workoutCount) {
  const grid    = document.getElementById('resources-grid');
  const ctxEl   = document.getElementById('resources-context');
  if (!grid) return;

  const ranked = scoreResources(profile, habits14, anxietyCount, workoutCount);

  // Context blurb
  if (ctxEl) {
    const parts = [];
    if (anxietyCount >= 3) parts.push('mental health resources prioritised based on your vault activity');
    if (workoutCount < 3)  parts.push('fitness foundations emphasised to build workout consistency');
    if ((profile.current_level || 1) >= 7) parts.push('advanced performance channels surfaced for your level');
    ctxEl.textContent = parts.length
      ? `Curated for you — ${parts.join('; ')}.`
      : 'Curated based on your habits and progress. Every channel below is peer-reviewed, evidence-based, and zero fluff.';
  }

  // Top 4 featured
  const top4  = ranked.slice(0, 4);
  const rest  = ranked.slice(4);

  grid.innerHTML = `
    ${top4.map((r, i) => resourceCard(r, i === 0)).join('')}

    <!-- Show more -->
    <div>
      <button id="show-more-resources"
        class="w-full text-slate-500 hover:text-slate-300 text-sm py-2 border border-dashed border-slate-700/50
               rounded-xl hover:border-slate-600 transition-colors">
        <i class="fa-solid fa-chevron-down mr-2"></i>Show ${rest.length} more channels
      </button>
      <div id="more-resources" class="hidden space-y-4 mt-4">
        ${rest.map((r) => resourceCard(r, false)).join('')}
      </div>
    </div>
  `;

  document.getElementById('show-more-resources')?.addEventListener('click', (e) => {
    const more = document.getElementById('more-resources');
    const btn  = e.currentTarget;
    const hidden = more.classList.contains('hidden');
    more.classList.toggle('hidden', !hidden);
    btn.innerHTML = hidden
      ? '<i class="fa-solid fa-chevron-up mr-2"></i>Show less'
      : `<i class="fa-solid fa-chevron-down mr-2"></i>Show ${rest.length} more channels`;
  });
}

function resourceCard(r, featured = false) {
  const topicsHtml = r.topics.map((t) => `
    <span class="inline-flex items-center gap-1 text-xs text-${r.color}-400/80 bg-${r.color}-500/10
                 border border-${r.color}-500/20 rounded-full px-2.5 py-0.5">${t}</span>`
  ).join('');

  return `
    <div class="bg-navy-600 rounded-2xl border ${featured ? `border-${r.color}-500/40 shadow-lg` : 'border-slate-700/50'} overflow-hidden">

      ${featured ? `<div class="h-0.5 bg-gradient-to-r from-${r.color}-600 to-${r.color}-400"></div>` : ''}

      <div class="p-5">
        <div class="flex items-start gap-3 mb-3">
          <div class="w-11 h-11 rounded-xl bg-${r.color}-500/20 border border-${r.color}-500/30
                      flex items-center justify-center flex-shrink-0">
            <i class="fa-solid ${r.icon} text-${r.color}-400"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-white font-semibold text-sm">${r.channel}</p>
              ${featured ? `<span class="bg-amber-500/20 text-amber-400 text-xs px-1.5 py-0.5 rounded font-medium">Top Pick</span>` : ''}
            </div>
            <p class="text-${r.color}-400 text-xs mt-0.5">${r.tagline}</p>
          </div>
        </div>

        <p class="text-slate-400 text-xs leading-relaxed mb-3">${r.desc}</p>

        <div class="flex flex-wrap gap-1.5 mb-4">${topicsHtml}</div>

        <a href="${r.url}" target="_blank" rel="noopener noreferrer"
          class="flex items-center justify-center gap-2.5 w-full
                 bg-red-600 hover:bg-red-500 text-white font-semibold
                 py-2.5 rounded-xl transition-colors text-sm">
          <i class="fa-brands fa-youtube text-base"></i>
          Open ${r.channel}
          <i class="fa-solid fa-arrow-up-right-from-square text-xs opacity-70"></i>
        </a>
      </div>
    </div>
  `;
}
