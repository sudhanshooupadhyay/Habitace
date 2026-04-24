// ─── Health benefit milestones per vice type ─────────────────
// Each milestone: { label, detail, seconds (since quit) }

const MILESTONES = {
  smoking: [
    { label: '20 minutes clean',   detail: 'Heart rate & blood pressure begin to drop.',                              seconds: 20 * 60                             },
    { label: '8 hours clean',      detail: 'Carbon monoxide in blood drops by half. Oxygen levels returning to normal.', seconds: 8 * 3600                           },
    { label: '24 hours clean',     detail: 'Carbon monoxide fully cleared. Lungs start clearing mucus & debris.',     seconds: 24 * 3600                           },
    { label: '48 hours clean',     detail: 'Nicotine entirely gone from your body. Taste & smell starting to improve.', seconds: 48 * 3600                          },
    { label: '72 hours clean',     detail: 'Breathing noticeably easier. Energy levels climbing.',                    seconds: 72 * 3600                           },
    { label: '2 weeks clean',      detail: 'Circulation improved. Physical activity is getting easier.',              seconds: 14 * 86400                          },
    { label: '1 month clean',      detail: 'Lung cilia repaired. Less coughing, better lung function.',               seconds: 30 * 86400                          },
    { label: '3 months clean',     detail: 'Lung capacity significantly improved. Breathing is much stronger.',        seconds: 90 * 86400                          },
    { label: '6 months clean',     detail: 'Respiratory infections and inflammation greatly reduced.',                 seconds: 180 * 86400                         },
    { label: '1 year clean',       detail: 'Risk of coronary heart disease cut in half vs. a smoker.',                seconds: 365 * 86400                         },
    { label: '5 years clean',      detail: 'Stroke risk now the same as a non-smoker.',                               seconds: 5 * 365 * 86400                     },
    { label: '10 years clean',     detail: 'Risk of lung cancer is half that of a continuing smoker.',                seconds: 10 * 365 * 86400                    },
    { label: '15 years clean',     detail: 'Heart disease risk equal to someone who never smoked. Incredible.',        seconds: 15 * 365 * 86400                    },
  ],

  alcohol: [
    { label: '1 hour in',          detail: 'Blood sugar starts to stabilise.',                                         seconds: 3600                                },
    { label: '12 hours in',        detail: 'Alcohol fully cleared from your bloodstream.',                             seconds: 12 * 3600                           },
    { label: '24 hours in',        detail: 'Hydration improves. Headaches and nausea fading.',                         seconds: 24 * 3600                           },
    { label: '48 hours in',        detail: 'Sleep quality improving. Liver beginning its recovery.',                   seconds: 48 * 3600                           },
    { label: '72 hours in',        detail: 'Energy levels increasing. Brain fog lifting.',                             seconds: 72 * 3600                           },
    { label: '1 week clean',       detail: 'Visible skin improvement. Better hydration showing.',                      seconds: 7 * 86400                           },
    { label: '2 weeks clean',      detail: 'Blood pressure beginning to normalise.',                                   seconds: 14 * 86400                          },
    { label: '1 month clean',      detail: 'Liver inflammation significantly reduced. Sleep quality much better.',     seconds: 30 * 86400                          },
    { label: '3 months clean',     detail: 'Cognitive function noticeably sharper. Liver well on the road to recovery.',seconds: 90 * 86400                         },
    { label: '6 months clean',     detail: 'Immune system significantly stronger. Mood more stable.',                  seconds: 180 * 86400                         },
    { label: '1 year clean',       detail: 'Risk of liver disease, cancer and heart disease meaningfully reduced.',    seconds: 365 * 86400                         },
  ],

  gambling: [
    { label: '24 hours in',        detail: 'The urge to gamble begins to weaken.',                                     seconds: 24 * 3600                           },
    { label: '3 days in',          detail: 'Financial clarity starting. Impulsive spending reduces.',                  seconds: 3 * 86400                           },
    { label: '1 week clean',       detail: 'Sleep and anxiety improving. Breathing room in your finances.',            seconds: 7 * 86400                           },
    { label: '2 weeks clean',      detail: 'Reduced stress and anxiety. Clearer thinking.',                            seconds: 14 * 86400                          },
    { label: '1 month clean',      detail: 'Relationships beginning to heal. Financial confidence growing.',           seconds: 30 * 86400                          },
    { label: '3 months clean',     detail: 'New hobbies and healthy coping habits established.',                       seconds: 90 * 86400                          },
    { label: '6 months clean',     detail: 'Financial situation stabilising. Self-worth rebuilt.',                     seconds: 180 * 86400                         },
    { label: '1 year clean',       detail: 'Rebuilt trust with loved ones. Freedom from the cycle.',                  seconds: 365 * 86400                         },
  ],

  junk_food: [
    { label: '24 hours in',        detail: 'Blood sugar starting to stabilise. Cravings at their peak — hold the line.', seconds: 24 * 3600                        },
    { label: '3 days in',          detail: 'Sugar cravings starting to ease.',                                         seconds: 3 * 86400                           },
    { label: '1 week clean',       detail: 'Energy levels more consistent throughout the day.',                        seconds: 7 * 86400                           },
    { label: '2 weeks clean',      detail: 'Digestive health improving. Less bloating.',                               seconds: 14 * 86400                          },
    { label: '1 month clean',      detail: 'Skin clearer. Weight loss may be underway.',                               seconds: 30 * 86400                          },
    { label: '3 months clean',     detail: 'Cholesterol and blood pressure improving measurably.',                     seconds: 90 * 86400                          },
    { label: '6 months clean',     detail: 'Sustained energy and a much more stable mood.',                            seconds: 180 * 86400                         },
    { label: '1 year clean',       detail: 'Significantly reduced risk of type 2 diabetes and heart disease.',         seconds: 365 * 86400                         },
  ],

  social_media: [
    { label: '1 hour in',          detail: 'Mind beginning to relax. FOMO starts fading.',                             seconds: 3600                                },
    { label: '24 hours in',        detail: 'Improved focus. Deeper presence in real-world moments.',                   seconds: 24 * 3600                           },
    { label: '3 days in',          detail: 'Anxiety dropping. Mental energy returning.',                               seconds: 3 * 86400                           },
    { label: '1 week clean',       detail: 'Noticeably better sleep. Less mental fatigue.',                            seconds: 7 * 86400                           },
    { label: '2 weeks clean',      detail: 'Deeper real-world connections. More present in conversations.',            seconds: 14 * 86400                          },
    { label: '1 month clean',      detail: 'Mental health significantly improved. Productivity up.',                   seconds: 30 * 86400                          },
    { label: '3 months clean',     detail: 'Greater sense of life satisfaction and purpose.',                          seconds: 90 * 86400                          },
    { label: '6 months clean',     detail: 'Markedly better attention span and creative focus.',                       seconds: 180 * 86400                         },
  ],
};

// Per-vice display copy
const VICE_DISPLAY = {
  smoking:      { label: 'Smoke-Free',        icon: 'fa-wind',         color: 'sky',     moneyLabel: 'cigarette' },
  alcohol:      { label: 'Alcohol-Free',       icon: 'fa-wine-bottle',  color: 'rose',    moneyLabel: 'drink'     },
  gambling:     { label: 'Gambling-Free',      icon: 'fa-dice',         color: 'orange',  moneyLabel: null        },
  junk_food:    { label: 'Junk-Food-Free',     icon: 'fa-burger',       color: 'amber',   moneyLabel: null        },
  social_media: { label: 'Screen-Free',        icon: 'fa-mobile-screen',color: 'indigo',  moneyLabel: null        },
};

// Module-level interval handle so we can stop it when the section unmounts
let _trackerInterval = null;

// ─── Render (static shell — dynamic values injected by init) ──
export function renderViceTracker(profile) {
  const vices = profile?.vices || [];
  const primaryVice = vices[0] || null;
  const quitDate    = profile?.vice_quit_date;

  if (!primaryVice) return '';

  const display  = VICE_DISPLAY[primaryVice] || { label: 'Vice-Free', icon: 'fa-check', color: 'emerald', moneyLabel: null };
  const hasQuit  = !!quitDate;
  const colorCls = _colorCls(display.color);
  const hasMoney = !!display.moneyLabel && profile?.vice_daily_amount && profile?.vice_pack_size && profile?.vice_pack_cost;

  if (!hasQuit) {
    // No commit yet — show a CTA
    return `
      <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-9 h-9 rounded-xl ${colorCls.iconBg} flex items-center justify-center flex-shrink-0">
            <i class="fa-solid ${display.icon} ${colorCls.text}"></i>
          </div>
          <div>
            <h3 class="text-white font-semibold text-sm">${display.label} Tracker</h3>
            <p class="text-slate-400 text-xs">Commit to quit to start tracking your progress.</p>
          </div>
        </div>
        <p class="text-slate-500 text-sm">
          Open <i class="fa-solid fa-gear"></i> Settings and set your <strong class="text-slate-300">quit start date</strong> to unlock
          real-time health milestones and ${hasMoney ? 'money saved' : 'progress tracking'}.
        </p>
      </div>
    `;
  }

  return `
    <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5 space-y-4">

      <!-- Title -->
      <div class="flex items-center justify-between">
        <h3 class="text-white font-semibold flex items-center gap-2">
          <i class="fa-solid ${display.icon} ${colorCls.text}"></i>
          ${display.label} Progress
        </h3>
        <span class="text-xs text-slate-500">Since ${_formatQuitDate(quitDate)}</span>
      </div>

      <!-- Live timer -->
      <div class="bg-navy-700/60 border ${colorCls.border} rounded-xl p-4 text-center">
        <p class="text-slate-400 text-xs mb-2 uppercase tracking-wider">Time clean</p>
        <div id="vice-timer" class="text-2xl font-bold font-mono ${colorCls.text} tracking-tight">
          —
        </div>
        <p id="vice-timer-sub" class="text-slate-500 text-xs mt-1"></p>
      </div>

      <!-- Money saved (smoking / alcohol only) -->
      ${hasMoney ? `
      <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-sack-dollar text-emerald-400 text-sm"></i>
        </div>
        <div>
          <p class="text-emerald-400 text-xs uppercase tracking-wider font-medium">Money saved</p>
          <p id="vice-money" class="text-emerald-300 font-bold text-lg">—</p>
          <p class="text-slate-500 text-xs" id="vice-money-sub"></p>
        </div>
      </div>
      ` : ''}

      <!-- Health milestones -->
      <div>
        <p class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Health milestones</p>
        <div id="vice-milestones" class="space-y-2 max-h-72 overflow-y-auto pr-1">
          <!-- injected by initViceTracker -->
        </div>
      </div>

    </div>
  `;
}

// ─── Init ─────────────────────────────────────────────────────
export function initViceTracker(profile) {
  // Clear any previously running interval
  if (_trackerInterval) { clearInterval(_trackerInterval); _trackerInterval = null; }

  const vices      = profile?.vices || [];
  const primaryVice = vices[0] || null;
  const quitDate    = profile?.vice_quit_date;

  if (!primaryVice || !quitDate) return;

  const quitMs     = new Date(quitDate).getTime();
  const milestones = MILESTONES[primaryVice] || [];
  const display    = VICE_DISPLAY[primaryVice] || {};
  const hasMoney   = !!display.moneyLabel && profile?.vice_daily_amount && profile?.vice_pack_size && profile?.vice_pack_cost;

  // Daily cost = (daily_amount / pack_size) * pack_cost
  const dailyCostUSD = hasMoney
    ? (parseFloat(profile.vice_daily_amount) / parseFloat(profile.vice_pack_size)) * parseFloat(profile.vice_pack_cost)
    : 0;

  function tick() {
    const now        = Date.now();
    const elapsed    = Math.max(0, Math.floor((now - quitMs) / 1000)); // seconds

    // ── Timer display ──
    const timerEl    = document.getElementById('vice-timer');
    const timerSubEl = document.getElementById('vice-timer-sub');
    if (!timerEl) { clearInterval(_trackerInterval); return; } // element gone — unmounted

    timerEl.textContent = _formatElapsed(elapsed);
    if (timerSubEl) timerSubEl.textContent = _elapsedSubline(elapsed);

    // ── Money saved ──
    if (hasMoney) {
      const moneyEl    = document.getElementById('vice-money');
      const moneySubEl = document.getElementById('vice-money-sub');
      if (moneyEl) {
        const days  = elapsed / 86400;
        const saved = dailyCostUSD * days;
        moneyEl.textContent = _formatCurrency(saved);
      }
      if (moneySubEl) {
        const perDay = dailyCostUSD;
        moneySubEl.textContent = `≈ ${_formatCurrency(perDay)} saved per day`;
      }
    }

    // ── Milestones ──
    const container = document.getElementById('vice-milestones');
    if (!container) return;

    // Find index of next upcoming milestone
    const nextIdx = milestones.findIndex((m) => m.seconds > elapsed);

    container.innerHTML = milestones.map((m, i) => {
      const achieved = m.seconds <= elapsed;
      const isNext   = i === nextIdx;
      const remaining = m.seconds - elapsed;

      return `
        <div class="flex items-start gap-3 ${achieved ? '' : 'opacity-60'}">
          <!-- Icon -->
          <div class="flex-shrink-0 mt-0.5">
            ${achieved
              ? `<div class="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                   <i class="fa-solid fa-check text-emerald-400 text-xs"></i>
                 </div>`
              : isNext
              ? `<div class="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                   <i class="fa-solid fa-clock text-indigo-400 text-xs"></i>
                 </div>`
              : `<div class="w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center">
                   <i class="fa-solid fa-lock text-slate-500 text-xs"></i>
                 </div>`}
          </div>
          <!-- Text -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <p class="text-sm font-medium ${achieved ? 'text-white' : isNext ? 'text-indigo-300' : 'text-slate-500'}">${m.label}</p>
              ${achieved
                ? `<span class="text-emerald-400 text-xs flex-shrink-0"><i class="fa-solid fa-check-double"></i></span>`
                : isNext
                ? `<span class="text-indigo-400 text-xs flex-shrink-0">${_formatElapsedShort(remaining)}</span>`
                : ''}
            </div>
            <p class="text-slate-500 text-xs mt-0.5 leading-relaxed">${m.detail}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  tick();
  _trackerInterval = setInterval(tick, 1000);
}

// ─── Cleanup (call when navigating away) ─────────────────────
export function destroyViceTracker() {
  if (_trackerInterval) { clearInterval(_trackerInterval); _trackerInterval = null; }
}

// ─── Helpers ──────────────────────────────────────────────────
function _colorCls(color) {
  const map = {
    sky:    { text: 'text-sky-400',    iconBg: 'bg-sky-500/20',    border: 'border-sky-500/20'    },
    rose:   { text: 'text-rose-400',   iconBg: 'bg-rose-500/20',   border: 'border-rose-500/20'   },
    orange: { text: 'text-orange-400', iconBg: 'bg-orange-500/20', border: 'border-orange-500/20' },
    amber:  { text: 'text-amber-400',  iconBg: 'bg-amber-500/20',  border: 'border-amber-500/20'  },
    indigo: { text: 'text-indigo-400', iconBg: 'bg-indigo-500/20', border: 'border-indigo-500/20' },
    emerald:{ text: 'text-emerald-400',iconBg: 'bg-emerald-500/20',border: 'border-emerald-500/20'},
  };
  return map[color] || map.indigo;
}

function _formatQuitDate(isoStr) {
  try {
    return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return '—'; }
}

function _formatElapsed(totalSeconds) {
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600) % 24;
  const d = Math.floor(totalSeconds / 86400);

  if (d > 0) {
    // Show days + hours
    return `${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m`;
  }
  if (h > 0) {
    return `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
  }
  return `${m}m ${String(s).padStart(2,'0')}s`;
}

function _elapsedSubline(totalSeconds) {
  const d  = Math.floor(totalSeconds / 86400);
  const h  = Math.floor(totalSeconds / 3600) % 24;
  const m  = Math.floor(totalSeconds / 60) % 60;
  const s  = totalSeconds % 60;

  if (d >= 365) {
    const yrs = Math.floor(d / 365);
    const rem = d % 365;
    const months = Math.floor(rem / 30);
    return `${yrs} year${yrs > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''} clean`;
  }
  if (d >= 30) {
    const months = Math.floor(d / 30);
    const remD   = d % 30;
    return `${months} month${months > 1 ? 's' : ''}${remD > 0 ? ` ${remD} day${remD > 1 ? 's' : ''}` : ''} clean`;
  }
  if (d >= 7) {
    const weeks = Math.floor(d / 7);
    const remD  = d % 7;
    return `${weeks} week${weeks > 1 ? 's' : ''}${remD > 0 ? ` ${remD} day${remD > 1 ? 's' : ''}` : ''} clean`;
  }
  if (d >= 1) return `${d} day${d > 1 ? 's' : ''} ${h}h ${m}m clean`;
  if (h >= 1) return `${h} hour${h > 1 ? 's' : ''} ${m}m ${s}s clean`;
  return `${m} minute${m !== 1 ? 's' : ''} clean`;
}

function _formatElapsedShort(totalSeconds) {
  if (totalSeconds <= 0) return 'now';
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor(totalSeconds / 3600) % 24;
  const m = Math.floor(totalSeconds / 60) % 60;
  if (d > 0) return `in ${d}d ${h}h`;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
}

function _formatCurrency(amount) {
  if (amount < 0.01) return '< $0.01';
  return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
