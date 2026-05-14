// Zen Center: Box Breathing, Meditation Timer, Pomodoro + Meditation Videos + Alarms
import { fetchOrCreateTodayHabits, updateHabit, addXp } from '../lib/supabase.js';
import { renderAlarmSection, initAlarmSection } from './alarmSystem.js';

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

// Ambient sound mode ('drone' | 'rain' | 'om' | 'off')
let _ambientMode = 'drone';

const MED_PRESETS = [
  { label: '3 min',  seconds: 3  * 60 },
  { label: '5 min',  seconds: 5  * 60 },
  { label: '10 min', seconds: 10 * 60 },
  { label: '20 min', seconds: 20 * 60 },
];

// Rotating mindfulness prompts — swap every breath cycle
const INHALE_PROMPTS = [
  'Breathe in slowly through your nose...',
  'Draw in calm with every breath...',
  'Inhale peace and stillness...',
  'Let your lungs expand fully...',
  'Breathe in presence...',
];
const EXHALE_PROMPTS = [
  'Release gently through your mouth...',
  'Let it all go with your breath...',
  'Exhale tension and thought...',
  'Soften as you breathe out...',
  'Surrender with each exhale...',
];
let _promptIndex = 0;

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
];

// Curated meditation video program — each video has a YouTube ID so we can embed it
const MEDITATION_VIDEOS = [
  {
    category: 'Healing & Recovery',
    icon: 'fa-heart-pulse',
    color: '#f472b6',
    glow: '#ec4899',
    desc: 'Deep healing meditations to restore nervous system balance and release stored tension.',
    videos: [
      { title: '10-Min Body Scan for Anxiety', channel: 'Headspace', duration: '10 min', id: 'MIr3RsUWrdo', tag: 'Anxiety Relief' },
      { title: 'NSDR / Yoga Nidra — Deep Rest Protocol', channel: 'Andrew Huberman', duration: '20 min', id: 'pL02HnFAMfk', tag: 'Sleep & Recovery' },
      { title: '528 Hz — Healing Frequency Meditation', channel: 'Meditative Mind', duration: '1 hr', id: 'LMHGvOHJ2s8', tag: '528 Hz' },
      { title: 'Letting Go — Release Anxiety & Fear', channel: 'Jason Stephenson', duration: '30 min', id: '1vx8iUvfyCY', tag: 'Emotional Release' },
    ],
  },
  {
    category: 'Focus & Deep Work',
    icon: 'fa-bullseye',
    color: '#60a5fa',
    glow: '#3b82f6',
    desc: 'Sharpen your mind and enter a state of deep, effortless concentration.',
    videos: [
      { title: 'Alpha Waves — Focus & Super Learning', channel: 'Greenred Productions', duration: '3 hr', id: 'WPni755-Krg', tag: 'Alpha Waves' },
      { title: '40 Hz Gamma Waves — Peak Mental Performance', channel: 'Binaural Beats', duration: '1 hr', id: 'tBBASzs9E5w', tag: 'Gamma Waves' },
      { title: '5-Min Grounding Exercise — 54321 Method', channel: 'Therapy in a Nutshell', duration: '5 min', id: '30VMIEmA114', tag: 'Grounding' },
      { title: 'Pomodoro Focus Music — Deep Work Session', channel: 'StudyMD', duration: '2 hr', id: '5qap5aO4i9A', tag: 'Work Music' },
    ],
  },
  {
    category: 'Manifestation & Abundance',
    icon: 'fa-wand-magic-sparkles',
    color: '#a78bfa',
    glow: '#8b5cf6',
    desc: 'Rewire your subconscious for success, abundance, and the life you\'re building.',
    videos: [
      { title: 'Law of Attraction — Morning Meditation', channel: 'Great Meditation', duration: '20 min', id: 'U923bN37SWE', tag: 'Morning' },
      { title: 'Reprogram Your Subconscious — Abundance', channel: 'Vortex Success', duration: '30 min', id: 'MfPzN4AO4ok', tag: 'Subconscious' },
      { title: '396 Hz — Release Fear, Guilt & Negativity', channel: 'Solfeggio Frequencies', duration: '1 hr', id: 'Dcp3HAFTojE', tag: 'Solfeggio' },
      { title: 'I Am Affirmations — Identity Shift', channel: 'Bob Baker', duration: '15 min', id: 'nBVE8BHaXqk', tag: 'Affirmations' },
    ],
  },
  {
    category: 'Morning Energy & Power',
    icon: 'fa-sun',
    color: '#fbbf24',
    glow: '#f59e0b',
    desc: 'Charge yourself with purpose and energy to dominate your day from the first breath.',
    videos: [
      { title: '10-Min Morning Meditation — Rise & Conquer', channel: 'Mindful Movement', duration: '10 min', id: 'inpok4MKVLM', tag: 'Morning Power' },
      { title: 'Wim Hof Breathing — Energy & Alertness', channel: 'Wim Hof Method', duration: '11 min', id: 'tybOi4hjZFQ', tag: 'Breathwork' },
      { title: 'Binaural Beats Morning — Alpha to Beta', channel: 'Quadible Integrity', duration: '30 min', id: 'xRKPH8YQGTE', tag: 'Morning Activation' },
      { title: '432 Hz — Full Body Positive Energy', channel: 'Meditative Mind', duration: '3 hr', id: 'JhLFRf4kXyM', tag: '432 Hz' },
    ],
  },
  {
    category: 'Sleep & Deep Relaxation',
    icon: 'fa-moon',
    color: '#38bdf8',
    glow: '#0ea5e9',
    desc: 'Wind down completely and enter the deep, restorative sleep your body deserves.',
    videos: [
      { title: '8-Hour Sleep Music — Delta Waves', channel: 'PowerThoughts Meditation', duration: '8 hr', id: 'rkZl5ghYMoQ', tag: 'Delta Waves' },
      { title: 'Body Scan for Sleep — Progressive Relaxation', channel: 'The Mindful Movement', duration: '25 min', id: 'hYmMJ1oWpRs', tag: 'Sleep' },
      { title: '174 Hz — Pain Relief & Relaxation', channel: 'Meditative Mind', duration: '3 hr', id: 'FNtMoXKR0Qk', tag: 'Solfeggio' },
      { title: 'Guided Sleep Meditation — Let Go of Worry', channel: 'Jason Stephenson', duration: '45 min', id: 'ezEo0r7BPEM', tag: 'Stress Relief' },
    ],
  },
  {
    category: 'Pure Meditation',
    icon: 'fa-spa',
    color: '#34d399',
    glow: '#10b981',
    desc: 'Classic, unguided meditation sessions. Sit. Breathe. Be.',
    videos: [
      { title: 'OM Chanting — 108 Times for Meditation', channel: 'Meditative Mind', duration: '60 min', id: 'cLR9eWfRl7A', tag: 'Mantra' },
      { title: 'Tibetan Singing Bowls — 1 Hour', channel: 'Tibetan Healing Sounds', duration: '1 hr', id: 'vO6mMnWkCkU', tag: 'Sound Bath' },
      { title: 'Zazen — Zen Meditation Session', channel: 'Tao Meditation', duration: '20 min', id: '7EBsCEEsTU4', tag: 'Zen' },
      { title: 'Vipassana — Silent Mindfulness Meditation', channel: 'Goenka', duration: '45 min', id: 'sAoYorFEHhA', tag: 'Vipassana' },
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
          <circle cx="18"  cy="10" r="1.2" fill="#99f6e4" opacity="0.5"/>
          <circle cx="55"  cy="5"  r="0.9" fill="#ccfbf1" opacity="0.4"/>
          <circle cx="110" cy="8"  r="1.2" fill="#99f6e4" opacity="0.5"/>
          <circle cx="175" cy="4"  r="0.9" fill="#ccfbf1" opacity="0.4"/>
          <circle cx="230" cy="9"  r="1"   fill="#99f6e4" opacity="0.45"/>
          <circle cx="295" cy="5"  r="1.2" fill="#ccfbf1" opacity="0.5"/>
          <circle cx="340" cy="11" r="0.9" fill="#99f6e4" opacity="0.4"/>
          <circle cx="310" cy="18" r="10" fill="#0f766e" opacity="0.25"/>
          <circle cx="314" cy="16" r="10" fill="#134e4a" opacity="0.5"/>
          <circle cx="310" cy="18" r="14" fill="none" stroke="#14b8a6" stroke-width="0.6" opacity="0.2"/>
          <path d="M0,90 L40,55 L75,72 L115,40 L155,68 L195,35 L235,60 L270,28 L310,52 L360,38 L360,90 Z"
                fill="#134e4a" opacity="0.35"/>
          <path d="M0,90 L50,62 L90,78 L135,48 L175,72 L215,42 L255,65 L295,36 L335,58 L360,50 L360,90 Z"
                fill="#0f172a" opacity="0.8"/>
          <rect x="0" y="82" width="360" height="8" fill="#0f766e" opacity="0.1"/>
          <line x1="60"  y1="84" x2="100" y2="84" stroke="#14b8a6" stroke-width="0.6" opacity="0.2"/>
          <line x1="180" y1="86" x2="230" y2="86" stroke="#14b8a6" stroke-width="0.6" opacity="0.2"/>
          <line x1="290" y1="84" x2="340" y2="84" stroke="#14b8a6" stroke-width="0.6" opacity="0.2"/>
          <circle cx="215" cy="40" r="4" fill="#0f766e" opacity="0.2"/>
          <circle cx="215" cy="42" r="2.5" fill="#14b8a6" opacity="0.5"/>
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

        <!-- Duration presets -->
        <div class="flex gap-2 mb-4">
          ${MED_PRESETS.map((p, i) => `
            <button class="med-preset flex-1 text-xs py-2 rounded-lg transition-colors font-medium border
                           ${i === 1 ? 'bg-purple-500/25 text-purple-400 border-purple-500/30' : 'bg-slate-700 text-slate-400 border-slate-600 hover:border-purple-500/30'}"
              data-seconds="${p.seconds}">${p.label}</button>
          `).join('')}
        </div>

        <!-- Ambient sound selector -->
        <div class="mb-3">
          <p class="text-slate-500 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <i class="fa-solid fa-headphones"></i> Ambient Sound
          </p>
          <div class="grid grid-cols-4 gap-1.5">
            <button class="med-sound-btn flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium border transition-all
                           bg-slate-700/40 border-slate-600/50 text-slate-400 hover:border-purple-500/30" data-mode="rain">
              <i class="fa-solid fa-cloud-rain text-base"></i>
              <span>Rain</span>
            </button>
            <button class="med-sound-btn flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium border transition-all
                           bg-purple-500/25 border-purple-500/40 text-purple-300" data-mode="drone">
              <i class="fa-solid fa-music text-base"></i>
              <span>Drone</span>
            </button>
            <button class="med-sound-btn flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium border transition-all
                           bg-slate-700/40 border-slate-600/50 text-slate-400 hover:border-purple-500/30" data-mode="om">
              <i class="fa-solid fa-om text-base"></i>
              <span>OM</span>
            </button>
            <button class="med-sound-btn flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium border transition-all
                           bg-slate-700/40 border-slate-600/50 text-slate-400 hover:border-purple-500/30" data-mode="off">
              <i class="fa-solid fa-volume-xmark text-base"></i>
              <span>Off</span>
            </button>
          </div>
        </div>

        <!-- Volume control -->
        <div class="flex items-center gap-3 mb-5">
          <i class="fa-solid fa-volume-low text-slate-600 text-xs flex-shrink-0"></i>
          <input type="range" id="med-volume" min="0" max="1" step="0.05" value="0.45"
            class="flex-1 cursor-pointer accent-purple-500"
            style="height: 4px; border-radius: 2px; background: #334155;">
          <i class="fa-solid fa-volume-high text-slate-600 text-xs flex-shrink-0"></i>
        </div>

        <!-- Breathing circle + countdown -->
        <div class="flex flex-col items-center mb-5">
          <div class="relative flex items-center justify-center">
            <!-- Outer ambient glow ring (pulses with breath) -->
            <div id="med-glow-ring"
              class="absolute rounded-full pointer-events-none transition-all ease-in-out"
              style="width: 200px; height: 200px;
                     background: radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%);
                     transition-duration: 4000ms;"></div>

            <div id="med-circle"
              class="relative z-10 w-36 h-36 rounded-full border-4 border-purple-500/30 flex items-center justify-center
                     transition-all ease-in-out"
              style="background: radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%);
                     transition-duration: 4000ms;">
              <div class="text-center">
                <p id="med-breath-word" class="text-purple-400/70 text-xs font-medium tracking-widest uppercase mb-1"></p>
                <p id="med-time" class="text-purple-300 text-3xl font-mono font-bold tabular-nums">5:00</p>
                <p class="text-slate-500 text-xs mt-1">remaining</p>
              </div>
            </div>
            <div id="med-ring"
              class="absolute w-40 h-40 rounded-full border border-purple-500/15 pointer-events-none"
              style="transition: all 4000ms ease-in-out;"></div>
          </div>
          <p id="med-instruction" class="text-slate-400 text-sm text-center mt-4 max-w-xs leading-relaxed">
            Select duration and sound, then press Start.
          </p>

          <!-- Interval bell indicator -->
          <div id="med-bell-indicator" class="hidden mt-2 flex items-center gap-1.5 text-purple-500/60 text-xs">
            <i class="fa-solid fa-bell text-xs"></i>
            <span>Gentle bell every minute</span>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="relative w-full bg-slate-700/60 rounded-full h-1.5 mb-5 overflow-hidden">
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

      <!-- Alarm System -->
      ${renderAlarmSection()}

      <!-- Meditation Video Program -->
      <div class="rounded-2xl border border-slate-700/40 overflow-hidden" style="background:rgba(10,12,24,0.95);">
        <div class="p-5 border-b border-slate-800/60">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                 style="background:linear-gradient(135deg,rgba(168,85,247,0.2),rgba(99,102,241,0.1));">
              <i class="fa-brands fa-youtube text-purple-400 text-sm"></i>
            </div>
            <div>
              <h3 class="text-white font-bold">Meditation Video Program</h3>
              <p class="text-slate-500 text-xs">Curated sessions for healing, focus, manifestation & sleep</p>
            </div>
          </div>
        </div>

        <!-- Category tabs -->
        <div class="flex overflow-x-auto gap-2 px-4 py-3 border-b border-slate-800/60 scrollbar-hide">
          ${MEDITATION_VIDEOS.map((cat, i) => `
            <button class="med-vid-tab flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              data-tab="${i}"
              style="${i === 0
                ? `background:${cat.color}20;color:${cat.color};border:1px solid ${cat.color}40;`
                : 'background:rgba(255,255,255,0.03);color:#64748b;border:1px solid rgba(255,255,255,0.06);'}">
              <i class="fa-solid ${cat.icon} mr-1.5"></i>${cat.category}
            </button>
          `).join('')}
        </div>

        <!-- Video panels -->
        <div id="med-vid-panels">
          ${MEDITATION_VIDEOS.map((cat, i) => `
            <div class="med-vid-panel ${i === 0 ? '' : 'hidden'}" data-panel="${i}">
              <div class="p-4 pb-2">
                <p class="text-slate-500 text-xs leading-relaxed">${cat.desc}</p>
              </div>
              <div class="grid grid-cols-1 gap-3 p-4 pt-2">
                ${cat.videos.map((v) => `
                  <a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener noreferrer"
                     class="flex gap-3 p-3 rounded-xl transition-all group"
                     style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.05);">
                    <!-- Thumbnail -->
                    <div class="relative flex-shrink-0 w-24 rounded-lg overflow-hidden"
                         style="aspect-ratio:16/9;background:#111;">
                      <img src="https://img.youtube.com/vi/${v.id}/mqdefault.jpg"
                           alt="${v.title}" loading="lazy"
                           class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div class="absolute inset-0 flex items-center justify-center">
                        <div class="w-7 h-7 rounded-full flex items-center justify-center"
                             style="background:rgba(220,38,38,0.9);">
                          <i class="fa-solid fa-play text-white" style="font-size:0.6rem;margin-left:2px;"></i>
                        </div>
                      </div>
                    </div>
                    <!-- Info -->
                    <div class="flex-1 min-w-0">
                      <p class="text-white text-xs font-semibold leading-snug mb-1 group-hover:text-purple-300 transition-colors line-clamp-2">${v.title}</p>
                      <p class="text-slate-600 text-xs">${v.channel}</p>
                      <div class="flex items-center gap-2 mt-1.5">
                        <span class="text-xs px-1.5 py-0.5 rounded font-medium"
                              style="background:${cat.color}15;color:${cat.color};font-size:0.6rem;">${v.tag}</span>
                        <span class="text-slate-700 text-xs">${v.duration}</span>
                      </div>
                    </div>
                  </a>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Resource Library -->
      <div class="rounded-2xl border border-slate-700/50 p-5" style="background:rgba(15,20,35,0.9);">
        <h3 class="text-white font-semibold mb-4 flex items-center gap-2 text-sm">
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
  initAlarmSection();
  initMeditationVideoTabs();
}

function initMeditationVideoTabs() {
  const tabs   = document.querySelectorAll('.med-vid-tab');
  const panels = document.querySelectorAll('.med-vid-panel');

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      const catIndex = parseInt(tab.dataset.tab, 10);
      const cat      = MEDITATION_VIDEOS[catIndex];

      tabs.forEach((t, j) => {
        const c = MEDITATION_VIDEOS[j];
        if (j === catIndex) {
          t.style.cssText = `background:${c.color}20;color:${c.color};border:1px solid ${c.color}40;`;
        } else {
          t.style.cssText = 'background:rgba(255,255,255,0.03);color:#64748b;border:1px solid rgba(255,255,255,0.06);';
        }
      });

      panels.forEach((panel) => {
        panel.classList.toggle('hidden', parseInt(panel.dataset.panel, 10) !== catIndex);
      });
    });
  });
}

// ─── Cleanup (called from main.js when navigating away) ───────
export function destroyZen() {
  _teardownAudio();
  clearTimeout(breathTimer);
  clearInterval(medInterval);
  clearInterval(pomodoroInterval);
  breathTimer       = null;
  medInterval       = null;
  pomodoroInterval  = null;
  medRunning        = false;
  pomodoroRunning   = false;
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

  fsBtn?.addEventListener('click', () => overlay.classList.remove('hidden'));
  fsClose?.addEventListener('click', () => overlay.classList.add('hidden'));
}

function startBreathing() {
  breathPhase = 0;
  runBreathPhase();
}

function stopBreathing() {
  clearTimeout(breathTimer);
  breathTimer = null;
  breathPhase = 0;

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
  const phase     = breathPhase % 4;
  const phaseName = BREATH_PHASES[phase];

  updateBreathUI(phaseName, 4, phase);

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

  const isExpand = phaseName === 'Inhale';
  const isShrink = phaseName === 'Exhale';

  if (circle) {
    circle.style.transform    = isExpand ? 'scale(1.35)' : isShrink ? 'scale(0.8)' : '';
    circle.style.borderColor  = phaseName === 'Exhale' ? 'rgba(20,184,166,0.6)' : 'rgba(20,184,166,0.3)';
  }
  if (ring) {
    ring.style.transform = isExpand ? 'scale(1.5)' : isShrink ? 'scale(0.9)' : '';
    ring.style.opacity   = isExpand ? '0.6' : '0.15';
  }
  if (fsCirc) {
    fsCirc.style.transform = isExpand ? 'scale(1.3)' : isShrink ? 'scale(0.75)' : '';
  }

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

  // Duration presets
  presets.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (medRunning) return;
      const secs   = parseInt(btn.dataset.seconds, 10);
      medTarget    = secs;
      medRemaining = secs;
      _updateMedDisplay();
      _updateMedProgress(0);
      presets.forEach((b) => {
        b.className = b.className
          .replace('bg-purple-500/25 text-purple-400 border-purple-500/30', '')
          + ' bg-slate-700 text-slate-400 border-slate-600';
      });
      btn.className = btn.className
        .replace('bg-slate-700 text-slate-400 border-slate-600', '')
        + ' bg-purple-500/25 text-purple-400 border-purple-500/30';
      if (completeEl) completeEl.classList.add('hidden');
    });
  });

  // Sound mode buttons
  document.querySelectorAll('.med-sound-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      _ambientMode = btn.dataset.mode;

      // Update button styles
      document.querySelectorAll('.med-sound-btn').forEach((b) => {
        b.className = b.className
          .replace('bg-purple-500/25 border-purple-500/40 text-purple-300', '')
          + ' bg-slate-700/40 border-slate-600/50 text-slate-400';
      });
      btn.className = btn.className
        .replace('bg-slate-700/40 border-slate-600/50 text-slate-400', '')
        + ' bg-purple-500/25 border-purple-500/40 text-purple-300';

      // If session is running, switch sound live
      if (medRunning) {
        const vol = parseFloat(document.getElementById('med-volume')?.value ?? '0.45');
        _startAmbient(_ambientMode, vol);
      }
    });
  });

  // Volume slider
  document.getElementById('med-volume')?.addEventListener('input', (e) => {
    _setAmbientVolume(parseFloat(e.target.value));
  });

  // Start
  startBtn?.addEventListener('click', () => {
    if (medRunning) return;
    medRunning = true;
    startBtn.classList.add('hidden');
    stopBtn?.classList.remove('hidden');
    if (badge)      { badge.textContent = 'Running'; badge.className = 'ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 font-medium'; }
    if (completeEl) completeEl.classList.add('hidden');
    document.getElementById('med-bell-indicator')?.classList.remove('hidden');

    const vol = parseFloat(document.getElementById('med-volume')?.value ?? '0.45');
    _playStartBell();
    _startAmbient(_ambientMode, vol);
    _startMedBreath();
    _scheduleIntervalBells(medRemaining);
    _runMedTimer(userId);
  });

  // Stop
  stopBtn?.addEventListener('click', () => {
    _stopMeditation();
    _updateMedInstruction('Session paused. Press Start to continue.');
    document.getElementById('med-bell-indicator')?.classList.add('hidden');
    if (badge) { badge.textContent = 'Stopped'; badge.className = 'ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-600 text-slate-400 font-medium'; }
  });

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
      _playEndBells();
      _onMedComplete(userId, true);
      document.getElementById('med-bell-indicator')?.classList.add('hidden');
    }
  }, 1000);
}

function _stopMeditation() {
  medRunning = false;
  clearInterval(medInterval);
  medInterval = null;
  _cancelIntervalBells();
  _teardownAudio();
  _stopMedBreath();
  document.getElementById('med-start')?.classList.remove('hidden');
  document.getElementById('med-stop')?.classList.add('hidden');
}

function _onMedComplete(userId, autoMark) {
  const completeEl = document.getElementById('med-complete');
  const badge      = document.getElementById('med-status-badge');
  if (completeEl) completeEl.classList.remove('hidden');
  if (badge) { badge.textContent = 'Done ✓'; badge.className = 'ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium'; }
  _updateMedInstruction('Well done. Sit with this stillness for a moment.');

  if (autoMark && userId) {
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

// ─── Breathing animation for meditation ───────────────────────
let medBreathTimer = null;
let medBreathPhase = 0; // 0 = expand / inhale, 1 = contract / exhale

function _startMedBreath() {
  _stopMedBreath();
  medBreathPhase = 0;
  _promptIndex   = 0;
  _runMedBreathCycle();
}

function _stopMedBreath() {
  clearTimeout(medBreathTimer);
  medBreathTimer = null;
  const circle  = document.getElementById('med-circle');
  const ring    = document.getElementById('med-ring');
  const glow    = document.getElementById('med-glow-ring');
  const word    = document.getElementById('med-breath-word');
  if (circle) circle.style.transform = '';
  if (ring)   ring.style.transform   = '';
  if (glow)   glow.style.transform   = '';
  if (word)   word.textContent        = '';
}

function _runMedBreathCycle() {
  const circle = document.getElementById('med-circle');
  const ring   = document.getElementById('med-ring');
  const glow   = document.getElementById('med-glow-ring');
  const word   = document.getElementById('med-breath-word');
  if (!circle) return;

  const isInhale = medBreathPhase === 0;

  // Visual
  if (isInhale) {
    circle.style.transform = 'scale(1.22)';
    circle.style.borderColor = 'rgba(168,85,247,0.55)';
    if (ring) ring.style.transform = 'scale(1.42)';
    if (glow) glow.style.transform = 'scale(1.4)';
    if (word) word.textContent = 'INHALE';

    // Rotating text prompts
    _updateMedInstruction(INHALE_PROMPTS[_promptIndex % INHALE_PROMPTS.length]);
  } else {
    circle.style.transform = 'scale(0.88)';
    circle.style.borderColor = 'rgba(168,85,247,0.25)';
    if (ring) ring.style.transform = 'scale(0.95)';
    if (glow) glow.style.transform = 'scale(0.9)';
    if (word) word.textContent = 'EXHALE';

    _updateMedInstruction(EXHALE_PROMPTS[_promptIndex % EXHALE_PROMPTS.length]);
    _promptIndex++;
  }

  // Sync audio envelope to breath
  _syncBreathToAudio(isInhale);

  medBreathPhase = isInhale ? 1 : 0;
  if (medRunning) {
    medBreathTimer = setTimeout(_runMedBreathCycle, 4000);
  }
}

// ─── Ambient Audio Engine ─────────────────────────────────────
let _audioCtx        = null;
let _ambientGainNode = null;
let _breathEnvNode   = null;
let _activeAudioNodes = [];
let _intervalBellIds  = [];

function _createOrResumeCtx() {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function _teardownAudio() {
  _cancelIntervalBells();
  _activeAudioNodes.forEach((node) => {
    try { if (node.stop) node.stop(0); } catch (_) {}
    try { node.disconnect(); } catch (_) {}
  });
  _activeAudioNodes = [];
  _ambientGainNode  = null;
  _breathEnvNode    = null;
}

function _startAmbient(mode, volume = 0.45) {
  _teardownAudio();
  if (mode === 'off') return;

  try {
    const ctx = _createOrResumeCtx();

    // Master output gain (volume slider controls this)
    _ambientGainNode = ctx.createGain();
    _ambientGainNode.gain.value = volume;
    _ambientGainNode.connect(ctx.destination);

    // Breath envelope gain — modulated by inhale/exhale
    _breathEnvNode = ctx.createGain();
    _breathEnvNode.gain.value = 1.0;
    _breathEnvNode.connect(_ambientGainNode);

    _activeAudioNodes.push(_ambientGainNode, _breathEnvNode);

    if (mode === 'drone') _buildDrone(ctx, _breathEnvNode);
    else if (mode === 'rain') _buildRain(ctx, _breathEnvNode);
    else if (mode === 'om') _buildOm(ctx, _breathEnvNode);
  } catch (err) {
    console.warn('[Zen Audio] Ambient start failed:', err);
  }
}

function _setAmbientVolume(vol) {
  if (_ambientGainNode && _audioCtx) {
    const now = _audioCtx.currentTime;
    _ambientGainNode.gain.cancelScheduledValues(now);
    _ambientGainNode.gain.linearRampToValueAtTime(Math.max(0, vol), now + 0.15);
  }
}

function _syncBreathToAudio(isInhale) {
  if (!_breathEnvNode || !_audioCtx) return;
  const now = _audioCtx.currentTime;
  _breathEnvNode.gain.cancelScheduledValues(now);
  _breathEnvNode.gain.setValueAtTime(_breathEnvNode.gain.value, now);
  // Swell to 1.35 on inhale, soften to 0.68 on exhale — creates a breathing feel
  _breathEnvNode.gain.linearRampToValueAtTime(isInhale ? 1.35 : 0.68, now + 3.8);
}

// ── Drone — Solfeggio 174Hz + warm harmonics ──────────────────
function _buildDrone(ctx, dest) {
  const layers = [
    { freq:  87.0, detune:  0, gain: 0.20 }, // sub-octave warmth
    { freq: 174.0, detune:  0, gain: 0.38 }, // fundamental (174Hz Solfeggio)
    { freq: 174.0, detune:  9, gain: 0.25 }, // slightly detuned twin for chorus
    { freq: 261.0, detune: -4, gain: 0.16 }, // perfect fifth
    { freq: 348.0, detune:  3, gain: 0.09 }, // octave
  ];

  layers.forEach(({ freq, detune, gain: g }) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type            = 'sine';
    osc.frequency.value = freq;
    osc.detune.value    = detune;
    gain.gain.value     = g;
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    _activeAudioNodes.push(osc, gain);
  });

  // Very slow LFO tremolo — makes it feel alive
  const lfo     = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type            = 'sine';
  lfo.frequency.value = 0.08; // ~12 second cycle
  lfoGain.gain.value  = 0.06;
  lfo.connect(lfoGain);
  lfoGain.connect(dest.gain);
  lfo.start();
  _activeAudioNodes.push(lfo, lfoGain);
}

// ── Rain — brown noise with gust LFO ──────────────────────────
function _buildRain(ctx, dest) {
  // Brown noise — warmer and deeper than white
  const bufSize = ctx.sampleRate * 5;
  const buffer  = ctx.createBuffer(2, bufSize, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let lastOut = 0;
    for (let i = 0; i < bufSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut  = (lastOut + (0.02 * white)) / 1.02;
      data[i]  = lastOut * 4.0;
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop   = true;

  const hiPass  = ctx.createBiquadFilter();
  hiPass.type   = 'highpass';
  hiPass.frequency.value = 350;

  const loPass  = ctx.createBiquadFilter();
  loPass.type   = 'lowpass';
  loPass.frequency.value = 5000;
  loPass.Q.value = 0.5;

  // Gust LFO — slow 22-second rain intensity variation
  const lfo     = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  const modGain = ctx.createGain();
  lfo.type            = 'sine';
  lfo.frequency.value = 0.045;
  lfoGain.gain.value  = 0.18;
  modGain.gain.value  = 0.82;
  lfo.connect(lfoGain);
  lfoGain.connect(modGain.gain);

  source.connect(hiPass);
  hiPass.connect(loPass);
  loPass.connect(modGain);
  modGain.connect(dest);
  source.start();
  lfo.start();

  _activeAudioNodes.push(source, hiPass, loPass, lfo, lfoGain, modGain);
}

// ── OM — 136Hz sacred drone with vibrato & rich harmonics ─────
function _buildOm(ctx, dest) {
  const fundamental = 136; // approx. frequency of OM/AUM

  // Slow vibrato for organic, human feel
  const vibrato     = ctx.createOscillator();
  const vibratoGain = ctx.createGain();
  vibrato.type            = 'sine';
  vibrato.frequency.value = 5.5;
  vibratoGain.gain.value  = 5; // ±5 cents
  vibrato.connect(vibratoGain);
  vibrato.start();
  _activeAudioNodes.push(vibrato, vibratoGain);

  const harmonics = [
    { freq: fundamental / 2,  gain: 0.18 }, // sub-octave
    { freq: fundamental,      gain: 0.40 },
    { freq: fundamental * 2,  gain: 0.20 },
    { freq: fundamental * 3,  gain: 0.11 },
    { freq: fundamental * 4,  gain: 0.06 },
    { freq: fundamental * 5,  gain: 0.03 },
  ];

  harmonics.forEach(({ freq, gain: g }) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type            = 'sine';
    osc.frequency.value = freq;
    vibratoGain.connect(osc.detune);
    gain.gain.value = g;
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    _activeAudioNodes.push(osc, gain);
  });

  // Slow swell LFO — breathing OM quality
  const swellLfo  = ctx.createOscillator();
  const swellGain = ctx.createGain();
  swellLfo.type            = 'sine';
  swellLfo.frequency.value = 0.07; // ~14 second swell
  swellGain.gain.value     = 0.12;
  swellLfo.connect(swellGain);
  swellGain.connect(dest.gain);
  swellLfo.start();
  _activeAudioNodes.push(swellLfo, swellGain);
}

// ─── Bell system ──────────────────────────────────────────────

// Gentle single bell played at session start
function _playStartBell() {
  _playBellTone(396, 0, 2.2, 0.28);
}

// Three layered bells at session end
function _playEndBells() {
  _playBellTone(528, 0.0, 3.0, 0.38);
  _playBellTone(396, 0.9, 2.5, 0.28);
  _playBellTone(528, 1.8, 3.0, 0.32);
}

// Softer single bell played at each 60s interval
function _playIntervalBell() {
  _playBellTone(440, 0, 2.0, 0.18);
}

function _playBellTone(freq, delaySeconds, duration, gain) {
  try {
    const ctx = _createOrResumeCtx();
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delaySeconds);
    amp.gain.setValueAtTime(0, ctx.currentTime + delaySeconds);
    amp.gain.linearRampToValueAtTime(gain, ctx.currentTime + delaySeconds + 0.06);
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delaySeconds + duration);
    osc.start(ctx.currentTime + delaySeconds);
    osc.stop(ctx.currentTime + delaySeconds + duration);
  } catch (_) {}
}

// Schedule a gentle bell every 60s throughout the session
function _scheduleIntervalBells(totalSeconds) {
  _cancelIntervalBells();
  for (let elapsed = 60; elapsed < totalSeconds; elapsed += 60) {
    const id = setTimeout(() => {
      if (medRunning) _playIntervalBell();
    }, elapsed * 1000);
    _intervalBellIds.push(id);
  }
}

function _cancelIntervalBells() {
  _intervalBellIds.forEach(clearTimeout);
  _intervalBellIds = [];
}

// ─── Pomodoro ────────────────────────────────────────────────

const POMO_PRESETS = {
  work:  25 * 60,
  short: 5  * 60,
  long:  15 * 60,
};

function initPomodoro() {
  const startBtn = document.getElementById('pomo-start');
  const pauseBtn = document.getElementById('pomo-pause');
  const resetBtn = document.getElementById('pomo-reset');
  const workBtn  = document.getElementById('pomo-work');
  const shortBtn = document.getElementById('pomo-short');
  const longBtn  = document.getElementById('pomo-long');

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
    { btn: workBtn,  preset: 'work',  mode: 'work',  label: 'Focus',       color: 'red' },
    { btn: shortBtn, preset: 'short', mode: 'break', label: 'Short Break', color: 'green' },
    { btn: longBtn,  preset: 'long',  mode: 'break', label: 'Long Break',  color: 'blue' },
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
    updatePomoRing((totalSeconds - pomodoroSeconds) / totalSeconds);

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
  const isWork    = pomodoroMode === 'work';
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

  if (Notification.permission === 'granted') {
    new Notification('Pomodoro Complete!', {
      body: isWork ? 'Time for a 5-minute break.' : 'Break over — back to focus!',
      icon: '/icons/icon-192.png',
    });
  }
}
