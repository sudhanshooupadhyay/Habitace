// Zen Center: Box Breathing, Meditation Timer, Pomodoro + Resource library
import { fetchOrCreateTodayHabits, updateHabit, addXp } from '../lib/supabase.js';

let pomodoroInterval  = null;
let pomodoroSeconds   = 25 * 60;
let pomodoroMode      = 'work'; // 'work' | 'break'
let pomodoroRunning   = false;

let breathPhase       = 0; // 0=inhale 1=hold 2=exhale 3=hold
let breathTimer       = null;
const BREATH_PHASES   = ['Inhale', 'Hold', 'Exhale', 'Hold'];
const BREATH_DURATION = 4000; // 4 seconds each

// Meditation timer state
let medInterval  = null;
let medRemaining = 5 * 60;
let medTarget    = 5 * 60;
let medRunning   = false;
let medBreathDir = 1; // 1=expand, -1=contract

const MED_PRESETS = [
  { label: '3 min',  seconds: 3  * 60 },
  { label: '5 min',  seconds: 5  * 60 },
  { label: '10 min', seconds: 10 * 60 },
];

const RESOURCES = [
  {
    category: 'CBT & Health Anxiety',
    icon: 'fa-brain',
    color: 'indigo',
    items: [
      { title: 'What is Health Anxiety? (NHS)', url: 'https://www.nhs.uk/mental-health/conditions/health-anxiety/' },
      { title: 'CBT for Health Anxiety — A Guide', url: 'https://www.verywellmind.com/cognitive-behavioral-therapy-for-health-anxiety-1393204' },
      { title: 'Thought Records Worksheet (CBT)', url: 'https://www.therapistaid.com/therapy-worksheet/thought-record' },
    ],
  },
  {
    category: 'Stoicism & Mental Resilience',
    icon: 'fa-scroll',
    color: 'amber',
    items: [
      { title: 'The Daily Stoic — Ryan Holiday', url: 'https://dailystoic.com/' },
      { title: 'Meditations by Marcus Aurelius (free)', url: 'https://www.gutenberg.org/ebooks/2680' },
      { title: 'Seneca: Letters on Anxiety', url: 'https://www.gutenberg.org/ebooks/900' },
    ],
  },
  {
    category: 'Workout Splits',
    icon: 'fa-dumbbell',
    color: 'emerald',
    items: [
      { title: 'PPL (Push/Pull/Legs) Program Guide', url: 'https://www.reddit.com/r/Fitness/wiki/weekly_thread/' },
      { title: '5/3/1 Beginner Program', url: 'https://www.jimwendler.com/blogs/jimwendler-com/101065094-5-3-1-for-a-beginner' },
      { title: 'GZCLP — Full Body Progression', url: 'https://www.reddit.com/r/Fitness/wiki/gzclp' },
    ],
  },
  {
    category: 'Guided Meditation (YouTube)',
    icon: 'fa-play-circle',
    color: 'purple',
    items: [
      { title: '10-Min Body Scan for Anxiety (Headspace)', url: 'https://www.youtube.com/watch?v=MIr3RsUWrdo' },
      { title: 'NSDR / Yoga Nidra (Andrew Huberman)', url: 'https://www.youtube.com/watch?v=pL02HnFAMfk' },
      { title: '5-Min Grounding Exercise (54321 Method)', url: 'https://www.youtube.com/watch?v=30VMIEmA114' },
    ],
  },
];

export function renderZen() {
  return `
    <div id="zen-section" class="space-y-6 animate-slide-up">

      <!-- Header -->
      <div class="bg-gradient-to-br from-teal-900/40 to-navy-700 rounded-2xl border border-teal-500/20 p-6 overflow-hidden relative">
        <div class="flex items-start gap-4 relative">
          <div class="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-spa text-xl text-teal-400"></i>
          </div>
          <div>
            <h2 class="text-white text-xl font-bold">Zen Center</h2>
            <p class="text-slate-400 text-sm mt-1">
              Breathing protocols, focus timers, and curated resources. Your calm toolkit.
            </p>
          </div>
        </div>

        <!-- Mountain & moon zen scene -->
        <svg viewBox="0 0 360 90" xmlns="http://www.w3.org/2000/svg"
             class="w-full mt-4" aria-hidden="true">
          <!-- Stars -->
          <circle cx="18"  cy="10" r="1.2" fill="#99f6e4" opacity="0.5"/>
          <circle cx="55"  cy="5"  r="0.9" fill="#ccfbf1" opacity="0.4"/>
          <circle cx="110" cy="8"  r="1.2" fill="#99f6e4" opacity="0.5"/>
          <circle cx="175" cy="4"  r="0.9" fill="#ccfbf1" opacity="0.4"/>
          <circle cx="230" cy="9"  r="1"   fill="#99f6e4" opacity="0.45"/>
          <circle cx="295" cy="5"  r="1.2" fill="#ccfbf1" opacity="0.5"/>
          <circle cx="340" cy="11" r="0.9" fill="#99f6e4" opacity="0.4"/>
          <!-- Moon -->
          <circle cx="310" cy="18" r="10" fill="#0f766e" opacity="0.25"/>
          <circle cx="314" cy="16" r="10" fill="#134e4a" opacity="0.5"/>
          <!-- Moon glow ring -->
          <circle cx="310" cy="18" r="14" fill="none" stroke="#14b8a6" stroke-width="0.6" opacity="0.2"/>
          <!-- Mountain range back layer -->
          <path d="M0,90 L40,55 L75,72 L115,40 L155,68 L195,35 L235,60 L270,28 L310,52 L360,38 L360,90 Z"
                fill="#134e4a" opacity="0.35"/>
          <!-- Mountain range front layer -->
          <path d="M0,90 L50,62 L90,78 L135,48 L175,72 L215,42 L255,65 L295,36 L335,58 L360,50 L360,90 Z"
                fill="#0f172a" opacity="0.8"/>
          <!-- Water reflection (bottom strip) -->
          <rect x="0" y="82" width="360" height="8" fill="#0f766e" opacity="0.1"/>
          <!-- Reflection shimmer lines -->
          <line x1="60"  y1="84" x2="100" y2="84" stroke="#14b8a6" stroke-width="0.6" opacity="0.2"/>
          <line x1="180" y1="86" x2="230" y2="86" stroke="#14b8a6" stroke-width="0.6" opacity="0.2"/>
          <line x1="290" y1="84" x2="340" y2="84" stroke="#14b8a6" stroke-width="0.6" opacity="0.2"/>
          <!-- Lotus at peak -->
          <circle cx="215" cy="40" r="4" fill="#0f766e" opacity="0.2"/>
          <circle cx="215" cy="42" r="2.5" fill="#14b8a6" opacity="0.5"/>
          <!-- Petal shapes -->
          <ellipse cx="215" cy="38" rx="2" ry="3.5" fill="#14b8a6" opacity="0.35" transform="rotate(0,215,38)"/>
          <ellipse cx="215" cy="38" rx="2" ry="3.5" fill="#14b8a6" opacity="0.3"  transform="rotate(60,215,42)"/>
          <ellipse cx="215" cy="38" rx="2" ry="3.5" fill="#14b8a6" opacity="0.3"  transform="rotate(-60,215,42)"/>
        </svg>
      </div>

      <!-- Box Breathing -->
      <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-white font-semibold flex items-center gap-2">
            <i class="fa-solid fa-lungs text-teal-400"></i>
            Box Breathing (4-4-4-4)
          </h3>
          <button id="breath-fullscreen"
            class="text-slate-400 hover:text-white transition-colors text-sm">
            <i class="fa-solid fa-expand mr-1"></i>Full screen
          </button>
        </div>

        <div id="breath-container" class="flex flex-col items-center">
          <!-- Circle visualizer -->
          <div class="relative flex items-center justify-center mb-6">
            <div id="breath-circle"
              class="w-40 h-40 rounded-full border-4 border-teal-500/30 flex items-center justify-center
                     transition-all duration-[4000ms] ease-in-out"
              style="background: radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%);">
              <div class="text-center">
                <p id="breath-phase-label" class="text-teal-400 text-xl font-bold">Ready</p>
                <p id="breath-count" class="text-slate-400 text-4xl font-mono font-bold tabular-nums">4</p>
                <p class="text-slate-600 text-xs mt-1">seconds</p>
              </div>
            </div>
            <!-- Outer pulse ring -->
            <div id="breath-ring" class="absolute w-44 h-44 rounded-full border-2 border-teal-500/10 transition-all duration-[4000ms] ease-in-out pointer-events-none"></div>
          </div>

          <p id="breath-instruction" class="text-slate-400 text-sm text-center mb-5">
            Press Start to begin a 4-4-4-4 box breathing session.
          </p>

          <div class="flex gap-3">
            <button id="breath-start"
              class="bg-teal-600 hover:bg-teal-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
              <i class="fa-solid fa-play mr-2"></i>Start
            </button>
            <button id="breath-stop"
              class="hidden bg-slate-600 hover:bg-slate-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
              <i class="fa-solid fa-stop mr-2"></i>Stop
            </button>
          </div>

          <!-- Phase indicator dots -->
          <div class="flex gap-3 mt-5">
            ${BREATH_PHASES.map((p, i) => `
              <div class="flex flex-col items-center gap-1">
                <div class="breath-dot w-2 h-2 rounded-full bg-slate-600 transition-colors" data-phase="${i}"></div>
                <span class="text-slate-600 text-xs">${p}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Meditation Timer -->
      <div class="bg-navy-600 rounded-2xl border border-purple-500/20 p-6">
        <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
          <i class="fa-solid fa-spa text-purple-400"></i>
          Meditation Timer
          <span id="med-status-badge" class="ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-medium">
            Ready
          </span>
        </h3>

        <!-- Preset buttons -->
        <div class="flex gap-2 mb-5">
          ${MED_PRESETS.map((p, i) => `
            <button class="med-preset flex-1 text-xs py-2 rounded-lg transition-colors font-medium
                           ${i === 1 ? 'bg-purple-500/25 text-purple-400 border border-purple-500/30' : 'bg-slate-700 text-slate-400 border border-slate-600 hover:border-purple-500/30'}"
              data-seconds="${p.seconds}">${p.label}</button>
          `).join('')}
        </div>

        <!-- Breathing circle + countdown -->
        <div class="flex flex-col items-center mb-5">
          <div class="relative flex items-center justify-center">
            <div id="med-circle"
              class="w-36 h-36 rounded-full border-4 border-purple-500/30 flex items-center justify-center
                     transition-all ease-in-out"
              style="background: radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%);
                     transition-duration: 4000ms;">
              <div class="text-center">
                <p id="med-time" class="text-purple-300 text-3xl font-mono font-bold tabular-nums">5:00</p>
                <p class="text-slate-500 text-xs mt-1">remaining</p>
              </div>
            </div>
            <div id="med-ring"
              class="absolute w-40 h-40 rounded-full border border-purple-500/15 pointer-events-none"
              style="transition: all 4000ms ease-in-out;"></div>
          </div>
          <p id="med-instruction" class="text-slate-400 text-sm text-center mt-4 max-w-xs leading-relaxed">
            Select duration, then press Start.
          </p>
        </div>

        <!-- Progress bar -->
        <div class="w-full bg-slate-700/60 rounded-full h-1.5 mb-5 overflow-hidden">
          <div id="med-progress-bar"
            class="h-1.5 rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-1000"
            style="width: 0%"></div>
        </div>

        <!-- Controls -->
        <div class="flex gap-3">
          <button id="med-start"
            class="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
            <i class="fa-solid fa-play mr-2"></i>Start
          </button>
          <button id="med-stop" class="hidden flex-1 bg-slate-600 hover:bg-slate-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
            <i class="fa-solid fa-stop mr-2"></i>Stop
          </button>
        </div>

        <div id="med-complete" class="hidden mt-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center text-sm text-purple-300">
          <i class="fa-solid fa-circle-check mr-2"></i>Meditation complete — <strong>+10 XP</strong> awarded!
        </div>
      </div>

      <!-- Pomodoro Timer -->
      <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-6">
        <h3 class="text-white font-semibold mb-5 flex items-center gap-2">
          <i class="fa-solid fa-clock text-red-400"></i>
          Pomodoro Timer
          <span id="pomo-mode-badge"
            class="ml-2 text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">
            Focus
          </span>
        </h3>

        <div class="text-center mb-6">
          <div class="text-6xl font-mono font-bold text-white tabular-nums" id="pomo-display">25:00</div>
          <p class="text-slate-400 text-sm mt-2" id="pomo-status">Ready to focus</p>
        </div>

        <!-- Progress ring -->
        <div class="flex justify-center mb-6">
          <svg width="120" height="120" class="-rotate-90">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#1e293b" stroke-width="8"/>
            <circle id="pomo-progress" cx="60" cy="60" r="54" fill="none"
              stroke="#ef4444" stroke-width="8" stroke-linecap="round"
              stroke-dasharray="339.3" stroke-dashoffset="0"
              class="transition-all duration-1000"/>
          </svg>
        </div>

        <div class="flex gap-3 justify-center">
          <button id="pomo-start"
            class="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
            <i class="fa-solid fa-play mr-2"></i>Start
          </button>
          <button id="pomo-pause"
            class="hidden bg-amber-600 hover:bg-amber-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
            <i class="fa-solid fa-pause mr-2"></i>Pause
          </button>
          <button id="pomo-reset"
            class="bg-slate-600 hover:bg-slate-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
            <i class="fa-solid fa-rotate-left mr-2"></i>Reset
          </button>
        </div>

        <div class="flex gap-3 mt-4 justify-center">
          <button id="pomo-work"
            class="text-xs px-4 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors pomo-preset active-preset">
            25 min Focus
          </button>
          <button id="pomo-short"
            class="text-xs px-4 py-1.5 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 transition-colors pomo-preset">
            5 min Break
          </button>
          <button id="pomo-long"
            class="text-xs px-4 py-1.5 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 transition-colors pomo-preset">
            15 min Break
          </button>
        </div>
      </div>

      <!-- Resource Library -->
      <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-6">
        <h3 class="text-white font-semibold mb-5 flex items-center gap-2">
          <i class="fa-solid fa-book text-amber-400"></i>
          Resource Library
        </h3>

        <div class="space-y-4">
          ${RESOURCES.map((cat) => `
            <div>
              <div class="flex items-center gap-2 mb-2">
                <i class="fa-solid ${cat.icon} text-${cat.color}-400 text-sm"></i>
                <p class="text-slate-300 text-sm font-medium">${cat.category}</p>
              </div>
              <div class="space-y-1.5 pl-6">
                ${cat.items.map((item) => `
                  <a href="${item.url}" target="_blank" rel="noopener noreferrer"
                    class="flex items-center gap-2 text-slate-400 hover:text-${cat.color}-400 text-sm transition-colors group">
                    <i class="fa-solid fa-arrow-up-right-from-square text-xs opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    ${item.title}
                  </a>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

    </div>

    <!-- Full-screen breathing overlay -->
    <div id="breath-fullscreen-overlay" class="hidden fixed inset-0 z-40 bg-navy-900 flex flex-col items-center justify-center">
      <button id="breath-fs-close" class="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
        <i class="fa-solid fa-xmark text-2xl"></i>
      </button>
      <div id="breath-fs-circle"
        class="w-64 h-64 rounded-full border-4 border-teal-500/30 flex items-center justify-center
               transition-all duration-[4000ms] ease-in-out"
        style="background: radial-gradient(circle, rgba(20,184,166,0.2) 0%, transparent 70%);">
        <div class="text-center">
          <p id="breath-fs-phase" class="text-teal-400 text-3xl font-bold">Ready</p>
          <p id="breath-fs-count" class="text-slate-300 text-6xl font-mono font-bold tabular-nums">4</p>
        </div>
      </div>
      <p id="breath-fs-instruction" class="text-slate-400 mt-8 text-lg">Take a moment. You are safe.</p>
    </div>
  `;
}

export function initZen(userId = null) {
  initBreathing();
  initMeditation(userId);
  initPomodoro();
}

// ─── Breathing ──────────────────────────────────────────────

function initBreathing() {
  const startBtn  = document.getElementById('breath-start');
  const stopBtn   = document.getElementById('breath-stop');
  const fsBtn     = document.getElementById('breath-fullscreen');
  const fsClose   = document.getElementById('breath-fs-close');
  const overlay   = document.getElementById('breath-fullscreen-overlay');

  startBtn?.addEventListener('click', () => {
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    startBreathing();
  });

  stopBtn?.addEventListener('click', () => {
    stopBtn.classList.add('hidden');
    startBtn.classList.remove('hidden');
    stopBreathing();
  });

  fsBtn?.addEventListener('click', () => {
    overlay.classList.remove('hidden');
  });

  fsClose?.addEventListener('click', () => {
    overlay.classList.add('hidden');
  });
}

function startBreathing() {
  breathPhase = 0;
  runBreathPhase();
}

function stopBreathing() {
  clearTimeout(breathTimer);
  breathTimer  = null;
  breathPhase  = 0;

  const label = document.getElementById('breath-phase-label');
  const count = document.getElementById('breath-count');
  const instr = document.getElementById('breath-instruction');
  if (label) label.textContent = 'Ready';
  if (count) count.textContent = '4';
  if (instr) instr.textContent = 'Press Start to begin a 4-4-4-4 box breathing session.';

  resetBreathCircle();
  document.querySelectorAll('.breath-dot').forEach((d) => {
    d.className = 'breath-dot w-2 h-2 rounded-full bg-slate-600 transition-colors';
  });
}

function runBreathPhase() {
  const phase = breathPhase % 4;
  const phaseName = BREATH_PHASES[phase];

  updateBreathUI(phaseName, 4, phase);

  // Count down 4 → 1
  let count = 4;
  const tick = setInterval(() => {
    count--;
    const countEl   = document.getElementById('breath-count');
    const countFsEl = document.getElementById('breath-fs-count');
    if (countEl)   countEl.textContent   = count > 0 ? count : '→';
    if (countFsEl) countFsEl.textContent = count > 0 ? count : '→';
  }, 1000);

  breathTimer = setTimeout(() => {
    clearInterval(tick);
    breathPhase++;
    runBreathPhase();
  }, BREATH_DURATION);
}

function updateBreathUI(phaseName, seconds, phaseIndex) {
  const label   = document.getElementById('breath-phase-label');
  const count   = document.getElementById('breath-count');
  const instr   = document.getElementById('breath-instruction');
  const circle  = document.getElementById('breath-circle');
  const ring    = document.getElementById('breath-ring');
  const fsPhase = document.getElementById('breath-fs-phase');
  const fsCirc  = document.getElementById('breath-fs-circle');

  if (label)   label.textContent = phaseName;
  if (count)   count.textContent = seconds;
  if (fsPhase) fsPhase.textContent = phaseName;

  const instructions = {
    Inhale: 'Breathe in slowly through your nose.',
    Hold:   'Hold gently. Stay still.',
    Exhale: 'Release slowly through your mouth.',
  };
  if (instr) instr.textContent = instructions[phaseName] || 'Hold gently.';

  // Circle animation
  const isExpand = phaseName === 'Inhale';
  const isShink  = phaseName === 'Exhale';

  if (circle) {
    circle.style.transform = isExpand ? 'scale(1.35)' : isShink ? 'scale(0.8)' : '';
    circle.style.borderColor = phaseName === 'Exhale' ? 'rgba(20,184,166,0.6)' : 'rgba(20,184,166,0.3)';
  }
  if (ring) {
    ring.style.transform  = isExpand ? 'scale(1.5)' : isShink ? 'scale(0.9)' : '';
    ring.style.opacity    = isExpand ? '0.6' : '0.15';
  }
  if (fsCirc) {
    fsCirc.style.transform = isExpand ? 'scale(1.3)' : isShink ? 'scale(0.75)' : '';
  }

  // Update phase dots
  document.querySelectorAll('.breath-dot').forEach((d, i) => {
    d.className = i === phaseIndex
      ? 'breath-dot w-2 h-2 rounded-full bg-teal-400 transition-colors'
      : 'breath-dot w-2 h-2 rounded-full bg-slate-600 transition-colors';
  });
}

function resetBreathCircle() {
  const circle = document.getElementById('breath-circle');
  const ring   = document.getElementById('breath-ring');
  if (circle) { circle.style.transform = ''; circle.style.borderColor = ''; }
  if (ring)   { ring.style.transform   = ''; ring.style.opacity       = ''; }
}

// ─── Meditation Timer ─────────────────────────────────────────

function initMeditation(userId) {
  const startBtn   = document.getElementById('med-start');
  const stopBtn    = document.getElementById('med-stop');
  const completeEl = document.getElementById('med-complete');
  const badge      = document.getElementById('med-status-badge');
  const presets    = document.querySelectorAll('.med-preset');

  // Preset selection
  presets.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (medRunning) return;
      const secs = parseInt(btn.dataset.seconds, 10);
      medTarget    = secs;
      medRemaining = secs;
      _updateMedDisplay();
      _updateMedProgress(0);
      presets.forEach((b) => {
        b.className = b.className
          .replace('bg-purple-500/25 text-purple-400 border-purple-500/30', '')
          .replace('bg-slate-700 text-slate-400 border-slate-600', '')
          + ' bg-slate-700 text-slate-400 border border-slate-600';
      });
      btn.className = btn.className
        .replace('bg-slate-700 text-slate-400 border-slate-600', '')
        + ' bg-purple-500/25 text-purple-400 border-purple-500/30';
      if (completeEl) completeEl.classList.add('hidden');
    });
  });

  startBtn?.addEventListener('click', () => {
    if (medRunning) return;
    medRunning = true;
    startBtn.classList.add('hidden');
    stopBtn?.classList.remove('hidden');
    if (badge)   { badge.textContent = 'Running'; badge.className = 'ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 font-medium'; }
    if (completeEl) completeEl.classList.add('hidden');
    _playMedBell();
    _updateMedInstruction('Breathe gently. Let thoughts pass without holding.');
    _startMedBreath();
    _runMedTimer(userId);
  });

  stopBtn?.addEventListener('click', () => {
    _stopMeditation();
    _updateMedInstruction('Session paused. Press Start to continue.');
    if (badge) { badge.textContent = 'Stopped'; badge.className = 'ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-600 text-slate-400 font-medium'; }
  });

  // Initialize display
  _updateMedDisplay();
}

function _runMedTimer(userId) {
  const totalSecs = medTarget;
  clearInterval(medInterval);

  medInterval = setInterval(() => {
    if (!medRunning) return;
    medRemaining--;
    _updateMedDisplay();
    _updateMedProgress((totalSecs - medRemaining) / totalSecs);

    if (medRemaining <= 0) {
      _stopMeditation();
      _playMedBell(true);
      _onMedComplete(userId, true);
    }
  }, 1000);
}

function _stopMeditation() {
  medRunning = false;
  clearInterval(medInterval);
  medInterval = null;
  document.getElementById('med-start')?.classList.remove('hidden');
  document.getElementById('med-stop')?.classList.add('hidden');
  _stopMedBreath();
}

function _onMedComplete(userId, autoMark) {
  const completeEl = document.getElementById('med-complete');
  const badge      = document.getElementById('med-status-badge');
  if (completeEl) completeEl.classList.remove('hidden');
  if (badge) { badge.textContent = 'Done ✓'; badge.className = 'ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium'; }
  _updateMedInstruction('Well done. Sit with this stillness for a moment.');

  if (autoMark && userId) {
    // Auto-mark meditation habit with ±10s tolerance (remaining is 0 here)
    fetchOrCreateTodayHabits(userId).then((row) => {
      if (row && !row.meditation) {
        return updateHabit(row.id, 'meditation', true).then(() => addXp(userId, 10));
      }
    }).catch((err) => console.warn('[Zen] Auto-mark meditation failed:', err));
  }
}

function _updateMedDisplay() {
  const m  = Math.floor(medRemaining / 60).toString().padStart(2, '0');
  const s  = (medRemaining % 60).toString().padStart(2, '0');
  const el = document.getElementById('med-time');
  if (el) el.textContent = `${m}:${s}`;
}

function _updateMedProgress(fraction) {
  const bar = document.getElementById('med-progress-bar');
  if (bar) bar.style.width = `${Math.min(100, fraction * 100)}%`;
}

function _updateMedInstruction(text) {
  const el = document.getElementById('med-instruction');
  if (el) el.textContent = text;
}

// Slow breathing animation for meditation (4s inhale, 4s exhale)
let medBreathTimer = null;
let medBreathPhase = 0; // 0=expand, 1=contract

function _startMedBreath() {
  _stopMedBreath();
  medBreathPhase = 0;
  _runMedBreathCycle();
}

function _stopMedBreath() {
  clearTimeout(medBreathTimer);
  medBreathTimer = null;
  const circle = document.getElementById('med-circle');
  const ring   = document.getElementById('med-ring');
  if (circle) circle.style.transform = '';
  if (ring)   ring.style.transform = '';
}

function _runMedBreathCycle() {
  const circle = document.getElementById('med-circle');
  const ring   = document.getElementById('med-ring');
  if (!circle) return;

  if (medBreathPhase === 0) {
    // Inhale — expand
    circle.style.transform = 'scale(1.25)';
    if (ring) ring.style.transform = 'scale(1.45)';
    _updateMedInstruction('Breathe in slowly through your nose...');
  } else {
    // Exhale — contract
    circle.style.transform = 'scale(0.85)';
    if (ring) ring.style.transform = 'scale(0.95)';
    _updateMedInstruction('Exhale gently through your mouth...');
  }

  medBreathPhase = medBreathPhase === 0 ? 1 : 0;

  if (medRunning) {
    medBreathTimer = setTimeout(_runMedBreathCycle, 4000);
  }
}

// Web Audio API — soft meditation bell
function _playMedBell(isEnd = false) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const playTone = (freq, start, duration, gain = 0.3) => {
      const osc  = ctx.createOscillator();
      const amp  = ctx.createGain();
      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      amp.gain.setValueAtTime(0, ctx.currentTime + start);
      amp.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.05);
      amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    if (isEnd) {
      // Three gentle bells at end
      playTone(528, 0,    2.5, 0.35);
      playTone(396, 0.8,  2.0, 0.25);
      playTone(528, 1.6,  2.5, 0.3);
    } else {
      // Single soft bell at start
      playTone(396, 0, 2.0, 0.25);
    }
  } catch (_) { /* AudioContext not available */ }
}

// ─── Pomodoro ────────────────────────────────────────────────

const POMO_PRESETS = {
  work:  25 * 60,
  short: 5  * 60,
  long:  15 * 60,
};

function initPomodoro() {
  const startBtn  = document.getElementById('pomo-start');
  const pauseBtn  = document.getElementById('pomo-pause');
  const resetBtn  = document.getElementById('pomo-reset');
  const workBtn   = document.getElementById('pomo-work');
  const shortBtn  = document.getElementById('pomo-short');
  const longBtn   = document.getElementById('pomo-long');

  startBtn?.addEventListener('click', () => {
    pomodoroRunning = true;
    startBtn.classList.add('hidden');
    pauseBtn?.classList.remove('hidden');
    runPomodoro();
  });

  pauseBtn?.addEventListener('click', () => {
    pomodoroRunning = false;
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
    pauseBtn.classList.add('hidden');
    startBtn?.classList.remove('hidden');
    document.getElementById('pomo-status').textContent = 'Paused';
  });

  resetBtn?.addEventListener('click', () => {
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
    pomodoroRunning  = false;
    pomodoroSeconds  = POMO_PRESETS[pomodoroMode === 'work' ? 'work' : 'short'];
    pauseBtn?.classList.add('hidden');
    startBtn?.classList.remove('hidden');
    updatePomoDisplay();
    document.getElementById('pomo-status').textContent = 'Ready to focus';
    updatePomoRing(0);
  });

  [
    { btn: workBtn,  preset: 'work',  mode: 'work',  label: 'Focus',      color: 'red'   },
    { btn: shortBtn, preset: 'short', mode: 'break', label: 'Short Break', color: 'green' },
    { btn: longBtn,  preset: 'long',  mode: 'break', label: 'Long Break',  color: 'blue'  },
  ].forEach(({ btn, preset, mode, label }) => {
    btn?.addEventListener('click', () => {
      clearInterval(pomodoroInterval);
      pomodoroInterval = null;
      pomodoroRunning  = false;
      pomodoroMode     = mode;
      pomodoroSeconds  = POMO_PRESETS[preset];
      pauseBtn?.classList.add('hidden');
      startBtn?.classList.remove('hidden');
      updatePomoDisplay();
      updatePomoRing(0);

      document.getElementById('pomo-status').textContent = `Ready for ${label}`;
      document.getElementById('pomo-mode-badge').textContent = label;

      document.querySelectorAll('.pomo-preset').forEach((b) => {
        b.className = b.className.replace('bg-red-500/20 text-red-400', '').replace('active-preset', '');
        b.className += ' bg-slate-700 text-slate-400';
      });
      btn.className = btn.className.replace('bg-slate-700 text-slate-400', '');
      btn.className += ` bg-red-500/20 text-red-400 active-preset`;
    });
  });
}

function runPomodoro() {
  const totalSeconds = pomodoroMode === 'work' ? POMO_PRESETS.work : pomodoroSeconds;

  clearInterval(pomodoroInterval);
  pomodoroInterval = setInterval(() => {
    if (!pomodoroRunning) return;

    pomodoroSeconds--;
    updatePomoDisplay();

    const elapsed = totalSeconds - pomodoroSeconds;
    updatePomoRing(elapsed / totalSeconds);

    if (pomodoroSeconds <= 0) {
      clearInterval(pomodoroInterval);
      pomodoroRunning = false;
      onPomodoroComplete();
    }
  }, 1000);
}

function updatePomoDisplay() {
  const m  = Math.floor(pomodoroSeconds / 60).toString().padStart(2, '0');
  const s  = (pomodoroSeconds % 60).toString().padStart(2, '0');
  const el = document.getElementById('pomo-display');
  if (el) el.textContent = `${m}:${s}`;
}

function updatePomoRing(fraction) {
  const circ = 339.3;
  const el   = document.getElementById('pomo-progress');
  if (el) el.style.strokeDashoffset = String(circ * (1 - fraction));
}

function onPomodoroComplete() {
  const isWork = pomodoroMode === 'work';
  pomodoroMode    = isWork ? 'break' : 'work';
  pomodoroSeconds = isWork ? POMO_PRESETS.short : POMO_PRESETS.work;

  const status = document.getElementById('pomo-status');
  if (status) status.textContent = isWork ? 'Break time! Well done.' : 'Focus session complete!';

  const badge = document.getElementById('pomo-mode-badge');
  if (badge) badge.textContent = isWork ? 'Break' : 'Focus';

  document.getElementById('pomo-start')?.classList.remove('hidden');
  document.getElementById('pomo-pause')?.classList.add('hidden');
  updatePomoDisplay();
  updatePomoRing(0);

  // Browser notification if permitted
  if (Notification.permission === 'granted') {
    new Notification('Pomodoro Complete!', {
      body: isWork ? 'Time for a 5-minute break.' : 'Break over — back to focus!',
      icon: '/icons/icon-192.png',
    });
  }
}
