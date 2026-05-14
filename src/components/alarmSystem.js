// Alarm System — Wake-up alarms + Routine reminders
// Persists via localStorage, checks every 30 s, uses Web Audio API for sounds

const STORAGE_KEY  = 'discipline_alarms';
const ROUTINES_KEY = 'discipline_routines';

const MOTIVATIONAL_MESSAGES = [
  "Rise and conquer. Today is YOUR day.",
  "The world belongs to those who show up. RISE.",
  "Alarm OFF. Excuses OFF. Discipline ON.",
  "Champions wake when others sleep. Move NOW.",
  "You promised yourself. GET UP.",
  "Pain is temporary. Discipline is permanent. GO.",
  "Your future self is counting on you. NOW.",
  "Iron will. Iron discipline. WAKE UP.",
  "Every great day starts with this moment. RISE.",
  "Do it now. Sleep later when you're dead. MOVE.",
];

const ROUTINE_MESSAGES = {
  water:      ["Drink water NOW. Your body needs it.", "Hydration check — down a glass.", "Water break. Your brain runs on it."],
  phone_down: ["PUT THE PHONE DOWN. Be present.", "Offline mode. Step away. Breathe.", "Digital detox — phone aside, eyes up."],
  posture:    ["Posture check — sit tall, shoulders back.", "Stand straight. Own your space.", "Roll shoulders back. Reset your spine."],
  eyes:       ["20-20-20: Look 20 ft away for 20 seconds.", "Eye break. Rest from the screen.", "Close your eyes for 30 seconds. Rest."],
  breathe:    ["5 deep breaths. Right NOW.", "Breathing reset — 4 in, 4 out.", "One conscious breath changes everything."],
  move:       ["Stand up and stretch. 2 minutes.", "Get UP and walk around.", "Movement break — loosen your body."],
};

let _alarmCheckInterval = null;
let _audioCtx           = null;
let _activeAlarmNodes   = [];
let _alarmActive        = false;

// ─── Public API ───────────────────────────────────────────────

export function initAlarmSystem() {
  _startAlarmChecker();
}

export function destroyAlarmSystem() {
  if (_alarmCheckInterval) {
    clearInterval(_alarmCheckInterval);
    _alarmCheckInterval = null;
  }
  _stopAlarmSound();
}

// ─── Storage ──────────────────────────────────────────────────

function loadAlarms() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveAlarms(alarms) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
}

function loadRoutines() {
  try { return JSON.parse(localStorage.getItem(ROUTINES_KEY) || JSON.stringify(_defaultRoutines())); }
  catch { return _defaultRoutines(); }
}

function saveRoutines(routines) {
  localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
}

function _defaultRoutines() {
  return [
    { id: 'water',      label: 'Drink Water',      icon: 'fa-droplet',        enabled: true,  intervalMinutes: 60,  lastFired: null },
    { id: 'phone_down', label: 'Put Phone Down',    icon: 'fa-mobile-screen',  enabled: true,  intervalMinutes: 90,  lastFired: null },
    { id: 'posture',    label: 'Posture Check',     icon: 'fa-person',         enabled: true,  intervalMinutes: 45,  lastFired: null },
    { id: 'eyes',       label: 'Eye Break',         icon: 'fa-eye',            enabled: false, intervalMinutes: 20,  lastFired: null },
    { id: 'breathe',    label: 'Breathing Reset',   icon: 'fa-wind',           enabled: false, intervalMinutes: 120, lastFired: null },
    { id: 'move',       label: 'Movement Break',    icon: 'fa-person-running', enabled: true,  intervalMinutes: 60,  lastFired: null },
  ];
}

// ─── Alarm checker ────────────────────────────────────────────

function _startAlarmChecker() {
  if (_alarmCheckInterval) clearInterval(_alarmCheckInterval);
  _checkAlarms();
  _alarmCheckInterval = setInterval(_checkAlarms, 30000);
}

function _checkAlarms() {
  const now         = new Date();
  const hh          = String(now.getHours()).padStart(2, '0');
  const mm          = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${hh}:${mm}`;
  const today       = now.toISOString().split('T')[0];

  const alarms  = loadAlarms();
  let   changed = false;

  alarms.forEach((alarm) => {
    if (!alarm.enabled) return;
    if (alarm.lastFiredDate === today && alarm.time === currentTime) return;
    if (alarm.time !== currentTime) return;

    const dayOfWeek = now.getDay();
    const days      = alarm.days || [0, 1, 2, 3, 4, 5, 6];
    if (!days.includes(dayOfWeek)) return;

    alarm.lastFiredDate = today;
    changed = true;
    _fireAlarm(alarm);
  });

  if (changed) saveAlarms(alarms);
  _checkRoutines(now);
}

function _checkRoutines(now) {
  const routines = loadRoutines();
  let   changed  = false;

  routines.forEach((routine) => {
    if (!routine.enabled) return;
    const intervalMs = routine.intervalMinutes * 60 * 1000;
    const lastFired  = routine.lastFired ? new Date(routine.lastFired) : null;
    if (!lastFired || (now - lastFired) >= intervalMs) {
      routine.lastFired = now.toISOString();
      changed = true;
      _fireRoutineReminder(routine);
    }
  });

  if (changed) saveRoutines(routines);
}

// ─── Fire alarm ───────────────────────────────────────────────

function _fireAlarm(alarm) {
  const msg = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
  _showAlarmModal(alarm.label || 'Wake Up!', msg, alarm);
  _playPowerAlarm();
  if (Notification.permission === 'granted') {
    new Notification(`⏰ ${alarm.label || 'Alarm!'}`, {
      body:     msg,
      icon:     '/icons/icon-192.png',
      badge:    '/icons/badge-72.png',
      tag:      `alarm-${alarm.id}`,
      renotify: true,
      vibrate:  [500, 200, 500, 200, 500, 200, 800],
    });
  }
}

function _fireRoutineReminder(routine) {
  const msgs = ROUTINE_MESSAGES[routine.id] || [`Time for: ${routine.label}`];
  const msg  = msgs[Math.floor(Math.random() * msgs.length)];
  _showRoutineToast(routine, msg);
  _playRoutineChime();
  if (Notification.permission === 'granted') {
    new Notification(routine.label, {
      body:     msg,
      icon:     '/icons/icon-192.png',
      tag:      `routine-${routine.id}`,
      renotify: true,
      vibrate:  [200, 100, 200],
    });
  }
}

// ─── Alarm modal ──────────────────────────────────────────────

function _showAlarmModal(title, message, alarm) {
  document.getElementById('alarm-firing-overlay')?.remove();

  const div = document.createElement('div');
  div.id = 'alarm-firing-overlay';
  div.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center; padding: 1.5rem;
    background: rgba(6,9,20,0.97); backdrop-filter: blur(24px);
  `;
  div.innerHTML = `
    <div style="width:100%;max-width:380px;text-align:center;animation:slideUp 0.4s ease-out;">
      <div style="position:relative;width:130px;height:130px;margin:0 auto 1.5rem;">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(239,68,68,0.25);animation:ping 1s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="position:absolute;inset:8px;border-radius:50%;background:rgba(239,68,68,0.15);animation:ping 1s cubic-bezier(0,0,0.2,1) infinite;animation-delay:0.3s;"></div>
        <div style="position:relative;width:100%;height:100%;border-radius:50%;display:flex;align-items:center;justify-content:center;
                    background:linear-gradient(135deg,rgba(239,68,68,0.25),rgba(185,28,28,0.1));
                    border:2px solid rgba(239,68,68,0.5);box-shadow:0 0 40px rgba(239,68,68,0.3);">
          <i class="fa-solid fa-bell" style="font-size:3rem;color:#f87171;animation:pulse 0.6s ease-in-out infinite alternate;"></i>
        </div>
      </div>

      <p style="color:#64748b;font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:0.5rem;">ALARM</p>
      <h2 style="color:white;font-size:1.75rem;font-weight:800;margin-bottom:1rem;">${title}</h2>

      <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:1rem;padding:1rem 1.25rem;margin-bottom:1.5rem;">
        <p style="color:#fca5a5;font-size:1rem;font-weight:600;line-height:1.6;">${message}</p>
      </div>

      <div style="display:flex;gap:0.75rem;">
        <button id="alarm-snooze-btn"
          style="flex:1;padding:0.875rem;border-radius:1rem;font-size:0.875rem;font-weight:600;
                 background:rgba(71,85,105,0.3);border:1px solid rgba(71,85,105,0.5);color:#94a3b8;cursor:pointer;">
          <i class="fa-solid fa-clock" style="margin-right:0.4rem;"></i>Snooze 5 min
        </button>
        <button id="alarm-dismiss-btn"
          style="flex:2;padding:0.875rem;border-radius:1rem;font-size:0.875rem;font-weight:700;
                 background:linear-gradient(135deg,#dc2626,#b91c1c);color:white;cursor:pointer;
                 box-shadow:0 0 25px rgba(220,38,38,0.5);border:none;">
          <i class="fa-solid fa-fire" style="margin-right:0.4rem;"></i>I'M UP — LET'S GO!
        </button>
      </div>
    </div>
    <style>
      @keyframes ping { 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(1.6);opacity:0} }
      @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      @keyframes pulse { from{transform:scale(1)} to{transform:scale(1.15)} }
    </style>
  `;

  document.body.appendChild(div);

  document.getElementById('alarm-dismiss-btn')?.addEventListener('click', () => {
    _stopAlarmSound();
    div.remove();
  });

  document.getElementById('alarm-snooze-btn')?.addEventListener('click', () => {
    _stopAlarmSound();
    div.remove();
    setTimeout(() => {
      _showAlarmModal('Snooze Over!', "No more delays. GET UP RIGHT NOW.", alarm);
      _playPowerAlarm();
    }, 5 * 60 * 1000);
  });
}

// ─── Routine toast ────────────────────────────────────────────

function _showRoutineToast(routine, message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const PALETTE = {
    water:      { bg: 'rgba(14,165,233,0.12)',  border: 'rgba(14,165,233,0.35)',  color: '#7dd3fc' },
    phone_down: { bg: 'rgba(168,85,247,0.12)',  border: 'rgba(168,85,247,0.35)',  color: '#d8b4fe' },
    posture:    { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.35)',  color: '#6ee7b7' },
    eyes:       { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)',  color: '#fcd34d' },
    breathe:    { bg: 'rgba(20,184,166,0.12)',  border: 'rgba(20,184,166,0.35)',  color: '#5eead4' },
    move:       { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)',   color: '#fca5a5' },
  };
  const p = PALETTE[routine.id] || PALETTE.water;

  const toast = document.createElement('div');
  toast.className = 'toast pointer-events-auto animate-slide-up';
  toast.style.cssText = `
    background:${p.bg}; border:1px solid ${p.border}; border-radius:1rem;
    padding:0.75rem 1rem; display:flex; align-items:flex-start; gap:0.75rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4); width:100%;
  `;
  toast.innerHTML = `
    <div style="width:2.25rem;height:2.25rem;border-radius:0.6rem;flex-shrink:0;
                display:flex;align-items:center;justify-content:center;
                background:${p.border};">
      <i class="fa-solid ${routine.icon}" style="font-size:0.8rem;color:${p.color};"></i>
    </div>
    <div style="flex:1;min-width:0;">
      <p style="color:${p.color};font-size:0.8125rem;font-weight:700;">${routine.label}</p>
      <p style="color:#94a3b8;font-size:0.75rem;margin-top:0.15rem;line-height:1.4;">${message}</p>
    </div>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s';
    setTimeout(() => toast.remove(), 400);
  }, 8000);
}

// ─── Audio engine ─────────────────────────────────────────────

function _getCtx() {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function _stopAlarmSound() {
  _alarmActive = false;
  _activeAlarmNodes.forEach((n) => {
    try { if (n.stop) n.stop(); } catch (_) {}
    try { n.disconnect(); } catch (_) {}
  });
  _activeAlarmNodes = [];
}

// Powerful military-reveille style alarm — square wave + sawtooth overtones
export function _playPowerAlarm() {
  _stopAlarmSound();
  _alarmActive = true;
  try {
    const ctx = _getCtx();
    _buildAlarmPattern(ctx);
  } catch (err) {
    console.warn('[Alarm] Sound failed:', err);
  }
}

function _buildAlarmPattern(ctx) {
  // Master output chain: compressor → destination
  const master     = ctx.createGain();
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -4;
  compressor.knee.value      = 2;
  compressor.ratio.value     = 8;
  compressor.attack.value    = 0.001;
  compressor.release.value   = 0.08;
  master.gain.value = 0.7;
  master.connect(compressor);
  compressor.connect(ctx.destination);
  _activeAlarmNodes.push(master, compressor);

  // Rising reveille + power burst pattern
  const notes = [
    // First rising phrase
    { f: 523,  t: 0.00, d: 0.12, g: 0.6 },
    { f: 659,  t: 0.12, d: 0.12, g: 0.7 },
    { f: 784,  t: 0.24, d: 0.12, g: 0.8 },
    { f: 659,  t: 0.36, d: 0.10, g: 0.7 },
    { f: 784,  t: 0.46, d: 0.25, g: 0.9 },
    { f: 1047, t: 0.71, d: 0.45, g: 1.0 }, // climax C6
    // Short silence gap
    // Second power burst — faster, louder
    { f: 784,  t: 1.35, d: 0.08, g: 0.85 },
    { f: 1047, t: 1.43, d: 0.08, g: 0.95 },
    { f: 1319, t: 1.51, d: 0.08, g: 1.0  },
    { f: 1047, t: 1.59, d: 0.08, g: 0.95 },
    { f: 1319, t: 1.67, d: 0.08, g: 1.0  },
    { f: 1568, t: 1.75, d: 0.5,  g: 1.0  }, // G6 peak
  ];

  const now = ctx.currentTime;

  const _buildNote = (freq, startSec, dur, gain, offsetBase) => {
    const t = now + offsetBase + startSec;

    // Square wave — buzzy, powerful
    const osc1 = ctx.createOscillator();
    const amp1 = ctx.createGain();
    osc1.type            = 'square';
    osc1.frequency.value = freq;
    amp1.gain.setValueAtTime(0, t);
    amp1.gain.linearRampToValueAtTime(gain * 0.55, t + 0.008);
    amp1.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.02);
    osc1.connect(amp1); amp1.connect(master);
    osc1.start(t); osc1.stop(t + dur + 0.05);

    // Sawtooth overtone — brightness
    const osc2 = ctx.createOscillator();
    const amp2 = ctx.createGain();
    osc2.type            = 'sawtooth';
    osc2.frequency.value = freq * 1.5;
    amp2.gain.setValueAtTime(0, t);
    amp2.gain.linearRampToValueAtTime(gain * 0.25, t + 0.008);
    amp2.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.02);
    osc2.connect(amp2); amp2.connect(master);
    osc2.start(t); osc2.stop(t + dur + 0.05);

    // Sub bass punch
    const osc3 = ctx.createOscillator();
    const amp3 = ctx.createGain();
    osc3.type            = 'sine';
    osc3.frequency.value = freq * 0.5;
    amp3.gain.setValueAtTime(0, t);
    amp3.gain.linearRampToValueAtTime(gain * 0.2, t + 0.01);
    amp3.gain.exponentialRampToValueAtTime(0.001, t + Math.min(dur, 0.12));
    osc3.connect(amp3); amp3.connect(master);
    osc3.start(t); osc3.stop(t + Math.min(dur, 0.15));

    _activeAlarmNodes.push(osc1, amp1, osc2, amp2, osc3, amp3);
  };

  // Play 4 repetitions
  for (let rep = 0; rep < 4; rep++) {
    const offset = rep * 2.6;
    notes.forEach(({ f, t, d, g }) => _buildNote(f, t, d, g, offset));
  }

  // Loop after 10.5 seconds if still active
  const loopId = setTimeout(() => {
    if (_alarmActive) _buildAlarmPattern(ctx);
  }, 10600);
  _activeAlarmNodes.push({ stop: () => clearTimeout(loopId), disconnect: () => {} });
}

// Gentle ascending chime for routine reminders
function _playRoutineChime() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const now  = ctx.currentTime;
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      const t   = now + i * 0.18;
      osc.type            = 'sine';
      osc.frequency.value = freq;
      amp.gain.setValueAtTime(0, t);
      amp.gain.linearRampToValueAtTime(0.28, t + 0.04);
      amp.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.connect(amp); amp.connect(ctx.destination);
      osc.start(t); osc.stop(t + 1.3);
    });
  } catch (_) {}
}

// ─── Render ───────────────────────────────────────────────────

export function renderAlarmSection() {
  const alarms   = loadAlarms();
  const routines = loadRoutines();

  return `
    <div id="alarm-section" class="space-y-5">

      <!-- Add Alarm Card -->
      <div class="rounded-2xl border p-5" style="background:rgba(17,24,39,0.8);border-color:rgba(220,38,38,0.25);">
        <h3 class="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
          <i class="fa-solid fa-plus-circle text-red-400"></i> Add Wake-Up Alarm
        </h3>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="form-label">Label</label>
            <input id="alarm-label" type="text" maxlength="24" value="Wake Up"
              class="input-field text-sm" placeholder="e.g. Morning Rise" />
          </div>
          <div>
            <label class="form-label">Time</label>
            <input id="alarm-time" type="time" value="06:00"
              class="input-field text-sm" />
          </div>
        </div>

        <div class="mb-4">
          <label class="form-label">Repeat Days</label>
          <div class="flex gap-1.5" id="alarm-days-row">
            ${['S','M','T','W','T','F','S'].map((d, i) => `
              <button class="alarm-day-btn w-9 h-9 rounded-full text-xs font-bold border transition-all
                             ${i >= 1 && i <= 5
                               ? 'bg-red-500/20 border-red-500/40 text-red-300'
                               : 'bg-slate-800/60 border-slate-700 text-slate-600'}"
                data-day="${i}">${d}</button>
            `).join('')}
          </div>
        </div>

        <button id="alarm-add-btn"
          class="w-full py-3 rounded-xl font-bold text-sm transition-all"
          style="background:linear-gradient(135deg,#dc2626,#b91c1c);color:white;
                 box-shadow:0 4px 20px rgba(220,38,38,0.35);">
          <i class="fa-solid fa-bell mr-2"></i>Set Alarm
        </button>
      </div>

      <!-- Active Alarms -->
      <div class="rounded-2xl border border-slate-700/50 p-5" style="background:rgba(15,20,35,0.9);">
        <h3 class="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
          <i class="fa-solid fa-clock text-red-400"></i> Active Alarms
        </h3>
        <div id="alarm-list">
          ${alarms.length === 0
            ? '<p class="text-slate-600 text-sm text-center py-4">No alarms yet. Add one above.</p>'
            : alarms.map(_renderAlarmCard).join('')}
        </div>
      </div>

      <!-- Routine Reminders -->
      <div class="rounded-2xl border border-slate-700/50 p-5" style="background:rgba(15,20,35,0.9);">
        <h3 class="text-white font-semibold mb-1 flex items-center gap-2 text-sm">
          <i class="fa-solid fa-rotate text-indigo-400"></i> Routine Reminders
        </h3>
        <p class="text-slate-500 text-xs mb-4">Periodic nudges to keep you on track while the app is open.</p>
        <div class="space-y-3" id="routine-list">
          ${routines.map(_renderRoutineCard).join('')}
        </div>
      </div>

      <!-- Sound Test -->
      <div class="rounded-2xl border border-slate-700/50 p-5" style="background:rgba(15,20,35,0.9);">
        <h3 class="text-white font-semibold mb-1 flex items-center gap-2 text-sm">
          <i class="fa-solid fa-volume-high text-amber-400"></i> Test Alarm Sound
        </h3>
        <p class="text-slate-500 text-xs mb-3">
          Alarm plays when app is open. Enable notifications for background alerts.
        </p>
        <div class="flex gap-3">
          <button id="alarm-test-btn"
            class="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all"
            style="background:rgba(245,158,11,0.1);border-color:rgba(245,158,11,0.3);color:#fbbf24;">
            <i class="fa-solid fa-play mr-2"></i>Play Alarm
          </button>
          <button id="alarm-stop-btn"
            class="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all"
            style="background:rgba(100,116,139,0.1);border-color:rgba(100,116,139,0.3);color:#64748b;">
            <i class="fa-solid fa-stop mr-2"></i>Stop
          </button>
        </div>
      </div>

    </div>
  `;
}

function _renderAlarmCard(alarm) {
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days      = alarm.days || [0, 1, 2, 3, 4, 5, 6];
  const daysStr   = days.length === 7 ? 'Every day'
    : days.length === 5 && !days.includes(0) && !days.includes(6) ? 'Weekdays'
    : days.map((d) => DAY_NAMES[d]).join(', ');

  return `
    <div class="alarm-card flex items-center gap-3 py-3.5 border-b border-slate-800/60 last:border-0" data-id="${alarm.id}">
      <div class="flex-1 min-w-0">
        <p class="text-white font-extrabold text-2xl tabular-nums leading-none">${alarm.time}</p>
        <p class="text-slate-500 text-xs mt-0.5">${alarm.label} · ${daysStr}</p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button class="alarm-toggle relative w-12 h-6 rounded-full transition-colors" data-id="${alarm.id}"
          style="background:${alarm.enabled ? '#4f46e5' : '#374151'};">
          <span class="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all"
            style="left:${alarm.enabled ? '26px' : '4px'};"></span>
        </button>
        <button class="alarm-delete w-8 h-8 rounded-lg flex items-center justify-center transition-all" data-id="${alarm.id}"
          style="background:rgba(239,68,68,0.08);color:#f87171;">
          <i class="fa-solid fa-trash-can text-xs"></i>
        </button>
      </div>
    </div>
  `;
}

function _renderRoutineCard(routine) {
  const ICONS = {
    water: 'fa-droplet', phone_down: 'fa-mobile-screen', posture: 'fa-person',
    eyes: 'fa-eye', breathe: 'fa-wind', move: 'fa-person-running',
  };
  const COLORS = {
    water: '#7dd3fc', phone_down: '#d8b4fe', posture: '#6ee7b7',
    eyes: '#fcd34d', breathe: '#5eead4', move: '#fca5a5',
  };
  const color = COLORS[routine.id] || '#94a3b8';

  return `
    <div class="routine-card flex items-center gap-3 py-1" data-id="${routine.id}">
      <div class="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
        style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);">
        <i class="fa-solid ${ICONS[routine.id] || 'fa-bell'} text-sm" style="color:${color};"></i>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-slate-200 text-sm font-semibold">${routine.label}</p>
        <p class="text-slate-600 text-xs">Every ${routine.intervalMinutes} min</p>
      </div>
      <button class="routine-toggle relative w-12 h-6 rounded-full transition-colors flex-shrink-0" data-id="${routine.id}"
        style="background:${routine.enabled ? '#4f46e5' : '#374151'};">
        <span class="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all"
          style="left:${routine.enabled ? '26px' : '4px'};"></span>
      </button>
    </div>
  `;
}

// ─── Init interactions ────────────────────────────────────────

export function initAlarmSection() {
  const selectedDays = new Set([1, 2, 3, 4, 5]);

  document.querySelectorAll('.alarm-day-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const day = parseInt(btn.dataset.day, 10);
      if (selectedDays.has(day)) {
        selectedDays.delete(day);
        btn.style.background = '';
        btn.classList.remove('bg-red-500/20', 'border-red-500/40', 'text-red-300');
        btn.classList.add('bg-slate-800/60', 'border-slate-700', 'text-slate-600');
      } else {
        selectedDays.add(day);
        btn.classList.remove('bg-slate-800/60', 'border-slate-700', 'text-slate-600');
        btn.classList.add('bg-red-500/20', 'border-red-500/40', 'text-red-300');
      }
    });
  });

  document.getElementById('alarm-add-btn')?.addEventListener('click', () => {
    const label = document.getElementById('alarm-label')?.value.trim() || 'Wake Up';
    const time  = document.getElementById('alarm-time')?.value;
    if (!time) return;

    const alarms   = loadAlarms();
    const newAlarm = {
      id:            Date.now().toString(),
      label,
      time,
      days:          [...selectedDays].sort((a, b) => a - b),
      enabled:       true,
      lastFiredDate: null,
    };
    alarms.push(newAlarm);
    saveAlarms(alarms);

    const list = document.getElementById('alarm-list');
    if (list) list.innerHTML = alarms.map(_renderAlarmCard).join('');
    _bindAlarmCards();
  });

  document.getElementById('alarm-test-btn')?.addEventListener('click', () => {
    _alarmActive = true;
    _playPowerAlarm();
  });
  document.getElementById('alarm-stop-btn')?.addEventListener('click', () => {
    _stopAlarmSound();
  });

  _bindAlarmCards();
  _bindRoutineCards();
}

function _bindAlarmCards() {
  document.querySelectorAll('.alarm-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const alarms = loadAlarms();
      const alarm  = alarms.find((a) => a.id === btn.dataset.id);
      if (!alarm) return;
      alarm.enabled = !alarm.enabled;
      saveAlarms(alarms);
      btn.style.background = alarm.enabled ? '#4f46e5' : '#374151';
      const dot = btn.querySelector('span');
      if (dot) dot.style.left = alarm.enabled ? '26px' : '4px';
    });
  });

  document.querySelectorAll('.alarm-delete').forEach((btn) => {
    btn.addEventListener('click', () => {
      const remaining = loadAlarms().filter((a) => a.id !== btn.dataset.id);
      saveAlarms(remaining);
      btn.closest('.alarm-card')?.remove();
      if (remaining.length === 0) {
        const list = document.getElementById('alarm-list');
        if (list) list.innerHTML = '<p class="text-slate-600 text-sm text-center py-4">No alarms yet.</p>';
      }
    });
  });
}

function _bindRoutineCards() {
  document.querySelectorAll('.routine-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const routines = loadRoutines();
      const routine  = routines.find((r) => r.id === btn.dataset.id);
      if (!routine) return;
      routine.enabled   = !routine.enabled;
      routine.lastFired = null;
      saveRoutines(routines);
      btn.style.background = routine.enabled ? '#4f46e5' : '#374151';
      const dot = btn.querySelector('span');
      if (dot) dot.style.left = routine.enabled ? '26px' : '4px';
    });
  });
}
