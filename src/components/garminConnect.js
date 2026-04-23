/**
 * Garmin Connect Integration Component
 *
 * Handles:
 *  1. OAuth connection flow (initiates via /api/garmin-request-token)
 *  2. Live Garmin metrics display (from daily_metrics)
 *  3. Manual data entry fallback
 *  4. Sync status + last-synced timestamp
 */

import { supabase } from '../lib/supabase.js';
import { vo2maxFitnessLabel, rhrLabel } from '../lib/bioAge.js';

// ─── Render ───────────────────────────────────────────────────
export function renderGarminConnect() {
  return `
    <div id="garmin-section" class="space-y-5 animate-slide-up">

      <!-- Header -->
      <div class="bg-gradient-to-br from-teal-900/40 to-navy-700 rounded-2xl border border-teal-500/20 p-5">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-watch text-xl text-teal-400"></i>
          </div>
          <div>
            <h2 class="text-white text-xl font-bold">Garmin Connect</h2>
            <p class="text-slate-400 text-sm mt-1">
              Real-time HR, VO₂ Max, HRV, Sleep & Body Battery — powering your bio age engine.
            </p>
          </div>
        </div>
      </div>

      <!-- Connection Status -->
      <div id="garmin-connection-card" class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5">
        <div class="flex items-center justify-center py-4">
          <i class="fa-solid fa-circle-notch fa-spin text-teal-400 text-xl"></i>
        </div>
      </div>

      <!-- Today's Metrics -->
      <div id="garmin-metrics-card" class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5">
        <h3 class="text-white font-semibold flex items-center gap-2 mb-4">
          <i class="fa-solid fa-chart-bar text-teal-400"></i>
          Today's Health Metrics
        </h3>
        <div id="garmin-metrics-grid" class="grid grid-cols-2 gap-3">
          <div class="col-span-2 flex items-center justify-center py-4">
            <i class="fa-solid fa-circle-notch fa-spin text-teal-400"></i>
          </div>
        </div>
      </div>

      <!-- Manual Entry -->
      <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-white font-semibold flex items-center gap-2">
            <i class="fa-solid fa-pen text-slate-400"></i>
            Manual Entry
          </h3>
          <button id="toggle-manual"
            class="text-slate-500 hover:text-slate-300 text-xs transition-colors">
            Expand ↓
          </button>
        </div>

        <div id="manual-entry-form" class="hidden space-y-4">
          <p class="text-slate-500 text-xs leading-relaxed">
            Enter data manually if Garmin isn't connected yet. All fields are optional —
            even one or two inputs will improve your bio age accuracy.
          </p>

          <div class="grid grid-cols-2 gap-3">
            ${[
              { id: 'me-rhr',    label: 'Resting HR',    unit: 'bpm',  type: 'number', min: 30,  max: 120, placeholder: '58' },
              { id: 'me-vo2',    label: 'VO₂ Max',       unit: 'ml/kg/min', type: 'number', min: 15, max: 80, placeholder: '45.0', step: '0.1' },
              { id: 'me-hrv',    label: 'HRV (RMSSD)',   unit: 'ms',   type: 'number', min: 10,  max: 200, placeholder: '55' },
              { id: 'me-spo2',   label: 'SpO₂',          unit: '%',    type: 'number', min: 85,  max: 100, placeholder: '98' },
              { id: 'me-stress', label: 'Stress Level',  unit: '/100', type: 'number', min: 0,   max: 100, placeholder: '35' },
              { id: 'me-batt',   label: 'Body Battery',  unit: '/100', type: 'number', min: 0,   max: 100, placeholder: '72' },
              { id: 'me-steps',  label: 'Steps',         unit: '',     type: 'number', min: 0,   max: 100000, placeholder: '8500' },
              { id: 'me-sleep',  label: 'Sleep Score',   unit: '/100', type: 'number', min: 0,   max: 100, placeholder: '80' },
            ].map((f) => `
              <div>
                <label class="form-label">${f.label}</label>
                <div class="relative">
                  <input id="${f.id}" type="${f.type}" min="${f.min}" max="${f.max}"
                    ${f.step ? `step="${f.step}"` : ''} placeholder="${f.placeholder}"
                    class="input-field text-sm py-2.5 ${f.unit ? 'pr-14' : ''}" />
                  ${f.unit ? `<span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">${f.unit}</span>` : ''}
                </div>
              </div>
            `).join('')}
          </div>

          <div id="me-error" class="hidden text-red-400 text-xs text-center"></div>

          <button id="save-manual"
            class="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
            <i class="fa-solid fa-save mr-2"></i>Save Today's Metrics
          </button>
          <div id="me-success" class="hidden text-center text-emerald-400 text-sm py-1">
            <i class="fa-solid fa-check-circle mr-1"></i>Metrics saved!
          </div>
        </div>
      </div>

      <!-- Webhook Instructions -->
      <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5">
        <h3 class="text-white font-semibold flex items-center gap-2 mb-3">
          <i class="fa-solid fa-plug text-amber-400"></i>
          Garmin → Zapier Automation
        </h3>
        <div id="webhook-info" class="space-y-3">
          <div class="flex items-center justify-center py-2">
            <i class="fa-solid fa-circle-notch fa-spin text-amber-400 text-sm"></i>
          </div>
        </div>
      </div>

    </div>
  `;
}

// ─── Init ─────────────────────────────────────────────────────
export async function initGarminConnect(userId, userProfile) {
  await Promise.all([
    loadConnectionStatus(userId, userProfile),
    loadTodayMetrics(userId),
    loadWebhookInfo(userId, userProfile),
  ]);

  initManualEntry(userId, userProfile);
  initToggleManual();
}

// ─── Connection status ────────────────────────────────────────
async function loadConnectionStatus(userId, userProfile) {
  const card = document.getElementById('garmin-connection-card');
  if (!card) return;

  try {
    const { data: conn } = await supabase
      .from('garmin_connections')
      .select('connected_at, last_synced_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (conn) {
      const syncTime = conn.last_synced_at
        ? new Date(conn.last_synced_at).toLocaleString()
        : 'Never';

      card.innerHTML = `
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <i class="fa-solid fa-circle-check text-emerald-400"></i>
          </div>
          <div>
            <p class="text-white font-semibold">Garmin Connected</p>
            <p class="text-slate-400 text-xs">Last sync: ${syncTime}</p>
          </div>
          <button id="garmin-sync-now"
            class="ml-auto bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
            <i class="fa-solid fa-rotate mr-1"></i>Sync Now
          </button>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-500">Connected since: ${new Date(conn.connected_at).toLocaleDateString()}</span>
          <button id="garmin-disconnect" class="text-red-400/60 hover:text-red-400 transition-colors">Disconnect</button>
        </div>`;

      document.getElementById('garmin-sync-now')?.addEventListener('click', () => triggerSync(userId));
      document.getElementById('garmin-disconnect')?.addEventListener('click', () => disconnectGarmin(userId));
    } else {
      renderConnectButton(card, userId);
    }
  } catch (_) {
    renderConnectButton(card, userId);
  }
}

function renderConnectButton(card, userId) {
  card.innerHTML = `
    <div class="text-center">
      <div class="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-4">
        <i class="fa-solid fa-watch text-2xl text-teal-400/60"></i>
      </div>
      <h3 class="text-white font-semibold mb-1">Connect Your Garmin</h3>
      <p class="text-slate-400 text-sm mb-5 leading-relaxed">
        Link your Garmin account to automatically sync HR, VO₂ Max, HRV, sleep, stress,
        and body battery — powering your real-time bio age calculation.
      </p>

      <button id="garmin-connect-btn"
        class="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3 rounded-xl transition-colors mb-3">
        <i class="fa-solid fa-link mr-2"></i>Connect Garmin Account
      </button>

      <div class="text-xs text-slate-600 space-y-1">
        <p><i class="fa-solid fa-info-circle mr-1"></i>Requires Garmin Developer API access</p>
        <p>Use Manual Entry below while you set up the connection</p>
      </div>
    </div>`;

  document.getElementById('garmin-connect-btn')?.addEventListener('click', () => initiateGarminOAuth(userId));
}

// ─── OAuth initiation ─────────────────────────────────────────
async function initiateGarminOAuth(userId) {
  const btn = document.getElementById('garmin-connect-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Redirecting to Garmin...';
  }

  try {
    const res  = await fetch(`/api/garmin-request-token?user_id=${userId}`);
    const data = await res.json();

    if (!res.ok || !data.authorizeUrl) {
      throw new Error(data.error || 'Failed to get Garmin auth URL');
    }

    // Redirect to Garmin OAuth page
    window.location.href = data.authorizeUrl;
  } catch (err) {
    console.error('[Garmin OAuth]', err);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-link mr-2"></i>Connect Garmin Account';
    }
    alert('Could not initiate Garmin connection: ' + err.message);
  }
}

// ─── Today's metrics ──────────────────────────────────────────
async function loadTodayMetrics(userId) {
  const grid = document.getElementById('garmin-metrics-grid');
  if (!grid) return;

  const today = new Date().toISOString().split('T')[0];

  try {
    const { data } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (!data) {
      grid.innerHTML = `
        <div class="col-span-2 text-center py-6">
          <i class="fa-solid fa-satellite-dish text-3xl text-slate-700 mb-3 block"></i>
          <p class="text-slate-500 text-sm">No metrics synced today.</p>
          <p class="text-slate-600 text-xs mt-1">Use Manual Entry below or connect your Garmin.</p>
        </div>`;
      return;
    }

    grid.innerHTML = buildMetricsGrid(data);
  } catch (_) {
    grid.innerHTML = `<p class="col-span-2 text-red-400 text-sm text-center">Failed to load metrics.</p>`;
  }
}

function buildMetricsGrid(d) {
  const tiles = [];

  if (d.resting_hr) {
    const label = rhrLabel(d.resting_hr);
    tiles.push(metricTile('fa-heart', d.resting_hr, 'bpm', 'Resting HR', label?.color, label?.label));
  }
  if (d.vo2_max) {
    const lbl = vo2maxFitnessLabel(d.vo2_max);
    tiles.push(metricTile('fa-lungs', d.vo2_max, 'ml/kg/min', 'VO₂ Max', lbl?.color, lbl?.label));
  }
  if (d.hrv_rmssd) {
    const c = d.hrv_rmssd >= 60 ? 'emerald' : d.hrv_rmssd >= 40 ? 'sky' : 'amber';
    tiles.push(metricTile('fa-wave-square', d.hrv_rmssd, 'ms', 'HRV (RMSSD)', c, d.hrv_rmssd >= 60 ? 'High' : d.hrv_rmssd >= 40 ? 'Moderate' : 'Low'));
  }
  if (d.spo2) {
    const c = d.spo2 >= 97 ? 'emerald' : d.spo2 >= 95 ? 'sky' : 'red';
    tiles.push(metricTile('fa-droplet', d.spo2, '%', 'Blood O₂ (SpO₂)', c, d.spo2 >= 97 ? 'Optimal' : 'Below Optimal'));
  }
  if (d.stress_level !== null && d.stress_level !== undefined) {
    const c = d.stress_level < 25 ? 'emerald' : d.stress_level < 50 ? 'sky' : d.stress_level < 75 ? 'amber' : 'red';
    tiles.push(metricTile('fa-brain', d.stress_level, '/100', 'Stress', c, d.stress_level < 25 ? 'Low' : d.stress_level < 50 ? 'Moderate' : d.stress_level < 75 ? 'High' : 'Very High'));
  }
  if (d.body_battery !== null && d.body_battery !== undefined) {
    const c = d.body_battery >= 60 ? 'emerald' : d.body_battery >= 30 ? 'amber' : 'red';
    tiles.push(metricTile('fa-battery-full', d.body_battery, '%', 'Body Battery', c, d.body_battery >= 60 ? 'Charged' : d.body_battery >= 30 ? 'Moderate' : 'Depleted'));
  }
  if (d.steps) {
    const c = d.steps >= 10000 ? 'emerald' : d.steps >= 7000 ? 'sky' : 'amber';
    tiles.push(metricTile('fa-shoe-prints', d.steps.toLocaleString(), '', 'Steps', c, d.steps >= 10000 ? 'Goal Met' : 'In Progress'));
  }
  if (d.garmin_sleep_hours && d.garmin_sleep_score) {
    const c = d.garmin_sleep_score >= 80 ? 'emerald' : d.garmin_sleep_score >= 60 ? 'sky' : 'amber';
    tiles.push(metricTile('fa-moon', `${d.garmin_sleep_hours}h`, `(${d.garmin_sleep_score}/100)`, 'Sleep', c, d.garmin_sleep_score >= 80 ? 'Excellent' : d.garmin_sleep_score >= 60 ? 'Good' : 'Fair'));
  }
  if (d.respiration_rate) {
    tiles.push(metricTile('fa-wind', d.respiration_rate, '/min', 'Respiration', 'sky', 'Rate'));
  }

  if (tiles.length === 0) return `
    <div class="col-span-2 text-center py-4">
      <p class="text-slate-500 text-sm">Metrics available but empty today. Sync your device.</p>
    </div>`;

  // Ensure even number for grid
  const html = tiles.join('');
  return html;
}

function metricTile(icon, value, unit, label, color = 'slate', sublabel = '') {
  return `
    <div class="bg-navy-700/50 border border-slate-700/30 rounded-xl p-3">
      <div class="flex items-center gap-1.5 mb-1.5">
        <i class="fa-solid ${icon} text-${color}-400 text-xs"></i>
        <p class="text-slate-500 text-xs">${label}</p>
      </div>
      <p class="text-white font-bold text-lg leading-none">${value}<span class="text-slate-500 text-xs font-normal ml-1">${unit}</span></p>
      ${sublabel ? `<p class="text-${color}-400 text-xs mt-1">${sublabel}</p>` : ''}
    </div>`;
}

// ─── Sync trigger ─────────────────────────────────────────────
async function triggerSync(userId) {
  const btn = document.getElementById('garmin-sync-now');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1"></i>Syncing...'; }

  try {
    const res = await fetch(`/api/garmin-sync?user_id=${userId}`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    await loadTodayMetrics(userId);
  } catch (err) {
    console.error('[Garmin Sync]', err);
    alert('Sync failed: ' + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-rotate mr-1"></i>Sync Now'; }
  }
}

// ─── Disconnect ───────────────────────────────────────────────
async function disconnectGarmin(userId) {
  if (!confirm('Disconnect Garmin? Your historical data will be preserved.')) return;
  await supabase.from('garmin_connections').delete().eq('user_id', userId);
  await supabase.from('users').update({ garmin_connected: false }).eq('id', userId);
  location.reload();
}

// ─── Webhook info ─────────────────────────────────────────────
async function loadWebhookInfo(userId, userProfile) {
  const container = document.getElementById('webhook-info');
  if (!container) return;

  const token     = userProfile?.webhook_token || '...';
  const projectId = import.meta.env.VITE_SUPABASE_URL?.match(/\/\/([^.]+)/)?.[1] || 'YOUR_PROJECT';
  const webhookUrl = `https://${projectId}.supabase.co/functions/v1/sleep-webhook`;

  container.innerHTML = `
    <p class="text-slate-400 text-sm leading-relaxed">
      Use Zapier or IFTTT to forward Garmin Connect data to this app automatically.
    </p>

    <div class="bg-navy-700/60 rounded-xl p-3 space-y-2">
      <div>
        <p class="text-slate-500 text-xs uppercase tracking-wide mb-1">Webhook URL</p>
        <div class="flex items-center gap-2">
          <code class="text-teal-400 text-xs break-all flex-1">${webhookUrl}</code>
          <button class="copy-btn text-slate-500 hover:text-white transition-colors flex-shrink-0"
            data-copy="${webhookUrl}">
            <i class="fa-solid fa-copy text-xs"></i>
          </button>
        </div>
      </div>
      <div>
        <p class="text-slate-500 text-xs uppercase tracking-wide mb-1">Your Webhook Token</p>
        <div class="flex items-center gap-2">
          <code class="text-amber-400 text-xs font-mono flex-1">${token}</code>
          <button class="copy-btn text-slate-500 hover:text-white transition-colors flex-shrink-0"
            data-copy="${token}">
            <i class="fa-solid fa-copy text-xs"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="space-y-2">
      <p class="text-slate-400 text-xs font-medium">Zapier POST body template:</p>
      <pre class="bg-navy-700/60 rounded-xl p-3 text-xs text-slate-300 overflow-x-auto">{
  "webhook_token": "${token}",
  "date": "{{date}}",
  "sleep_hours": {{garmin_sleep_total_seconds}} / 3600,
  "sleep_score": {{garmin_sleep_score}},
  "resting_hr": {{garmin_resting_hr}},
  "stress_level": {{garmin_avg_stress}},
  "steps": {{garmin_steps}}
}</pre>
    </div>`;

  // Copy buttons
  container.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      navigator.clipboard?.writeText(btn.dataset.copy).then(() => {
        btn.innerHTML = '<i class="fa-solid fa-check text-xs text-emerald-400"></i>';
        setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-copy text-xs"></i>'; }, 2000);
      });
    });
  });
}

// ─── Manual entry ─────────────────────────────────────────────
function initManualEntry(userId, userProfile) {
  document.getElementById('save-manual')?.addEventListener('click', async () => {
    const today   = new Date().toISOString().split('T')[0];
    const saveBtn = document.getElementById('save-manual');
    const errEl   = document.getElementById('me-error');
    const success = document.getElementById('me-success');

    const val = (id) => {
      const v = document.getElementById(id)?.value;
      return v === '' || v === null || v === undefined ? null : parseFloat(v);
    };

    errEl.classList.add('hidden');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Saving...';

    try {
      const { error } = await supabase.rpc('upsert_garmin_daily', {
        p_user_id:           userId,
        p_date:              today,
        p_resting_hr:        val('me-rhr'),
        p_vo2_max:           val('me-vo2'),
        p_hrv_rmssd:         val('me-hrv'),
        p_spo2:              val('me-spo2'),
        p_stress_level:      val('me-stress'),
        p_body_battery:      val('me-batt'),
        p_steps:             val('me-steps'),
        p_sleep_score:       val('me-sleep'),
      });

      if (error) throw error;

      success.classList.remove('hidden');
      setTimeout(() => success.classList.add('hidden'), 3000);
      await loadTodayMetrics(userId);
    } catch (err) {
      errEl.textContent = 'Failed to save: ' + err.message;
      errEl.classList.remove('hidden');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fa-solid fa-save mr-2"></i>Save Today\'s Metrics';
    }
  });
}

function initToggleManual() {
  const btn  = document.getElementById('toggle-manual');
  const form = document.getElementById('manual-entry-form');

  btn?.addEventListener('click', () => {
    const hidden = form.classList.contains('hidden');
    form.classList.toggle('hidden', !hidden);
    btn.textContent = hidden ? 'Collapse ↑' : 'Expand ↓';
  });
}
