import { supabase } from '../lib/supabase.js';

// ─── Render ───────────────────────────────────────────────────
export function renderAuth() {
  return `
    <div id="auth-screen" class="min-h-screen bg-navy-800 flex flex-col items-center justify-center p-6 relative overflow-hidden">

      <!-- ── Neural network background ──────────────────────── -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 480 900"
           preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="ag1" cx="20%" cy="15%">
            <stop offset="0%" stop-color="#6366f1" stop-opacity="0.18"/>
            <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="ag2" cx="80%" cy="85%">
            <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.14"/>
            <stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="80"  cy="140" r="130" fill="url(#ag1)"/>
        <circle cx="400" cy="760" r="160" fill="url(#ag2)"/>
        <circle cx="55"  cy="75"  r="2.5" fill="#818cf8" opacity="0.5"/>
        <circle cx="148" cy="42"  r="1.8" fill="#6366f1" opacity="0.6"/>
        <circle cx="238" cy="105" r="3"   fill="#818cf8" opacity="0.4"/>
        <circle cx="338" cy="55"  r="2"   fill="#a78bfa" opacity="0.5"/>
        <circle cx="428" cy="98"  r="2.5" fill="#6366f1" opacity="0.5"/>
        <circle cx="35"  cy="310" r="2"   fill="#818cf8" opacity="0.4"/>
        <circle cx="158" cy="268" r="2.5" fill="#6366f1" opacity="0.5"/>
        <circle cx="278" cy="325" r="2"   fill="#a78bfa" opacity="0.4"/>
        <circle cx="418" cy="282" r="3"   fill="#818cf8" opacity="0.5"/>
        <circle cx="75"  cy="685" r="2"   fill="#6366f1" opacity="0.4"/>
        <circle cx="195" cy="722" r="2.5" fill="#818cf8" opacity="0.5"/>
        <circle cx="345" cy="662" r="2"   fill="#a78bfa" opacity="0.4"/>
        <circle cx="438" cy="705" r="2.5" fill="#6366f1" opacity="0.5"/>
        <circle cx="128" cy="824" r="1.8" fill="#818cf8" opacity="0.4"/>
        <circle cx="298" cy="802" r="2"   fill="#6366f1" opacity="0.4"/>
        <polyline points="55,75 148,42 238,105 338,55 428,98"
                  stroke="#6366f1" stroke-width="0.5" fill="none" opacity="0.22"/>
        <polyline points="35,310 158,268 278,325 418,282"
                  stroke="#6366f1" stroke-width="0.5" fill="none" opacity="0.2"/>
        <line x1="55"  y1="75"  x2="35"  y2="310" stroke="#818cf8" stroke-width="0.4" opacity="0.14"/>
        <line x1="238" y1="105" x2="158" y2="268" stroke="#818cf8" stroke-width="0.4" opacity="0.14"/>
        <line x1="428" y1="98"  x2="418" y2="282" stroke="#818cf8" stroke-width="0.4" opacity="0.14"/>
        <polyline points="75,685 195,722 345,662 438,705"
                  stroke="#6366f1" stroke-width="0.5" fill="none" opacity="0.15"/>
        <line x1="158" y1="268" x2="75"  y2="685" stroke="#818cf8" stroke-width="0.4" opacity="0.1"/>
        <line x1="278" y1="325" x2="195" y2="722" stroke="#818cf8" stroke-width="0.4" opacity="0.1"/>
      </svg>

      <div class="w-full max-w-sm animate-slide-up relative">

        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-3xl
                      bg-gradient-to-br from-indigo-600/30 to-purple-600/20
                      border border-indigo-500/40 mb-5 animate-pulse-glow">
            <i class="fa-solid fa-brain text-3xl text-indigo-400"></i>
          </div>
          <h1 class="text-3xl font-bold text-white tracking-tight">Discipline Tracker</h1>
          <p class="text-slate-400 mt-2 text-sm">Your psychological fortress. Built daily.</p>
        </div>

        <!-- Auth card -->
        <div class="bg-navy-600 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">

          <!-- Tab switcher -->
          <div class="flex border-b border-slate-700/50">
            <button id="tab-signin"
              class="flex-1 py-3.5 text-sm font-semibold transition-colors
                     text-white border-b-2 border-indigo-500 bg-indigo-500/5">
              Sign In
            </button>
            <button id="tab-signup"
              class="flex-1 py-3.5 text-sm font-semibold transition-colors
                     text-slate-500 hover:text-slate-300 border-b-2 border-transparent">
              Create Account
            </button>
          </div>

          <div class="p-6 space-y-5">

            <!-- ── Sign In form ─────────────────────────────── -->
            <form id="form-signin" class="space-y-4" novalidate>
              <div>
                <label class="form-label">Email</label>
                <input id="si-email" type="email" autocomplete="email"
                  placeholder="you@example.com"
                  class="input-field" />
              </div>
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="form-label mb-0">Password</label>
                  <button type="button" id="show-forgot"
                    class="text-indigo-400 hover:text-indigo-300 text-xs transition-colors">
                    Forgot password?
                  </button>
                </div>
                <div class="relative">
                  <input id="si-password" type="password" autocomplete="current-password"
                    placeholder="••••••••"
                    class="input-field pr-10" />
                  <button type="button" class="toggle-pw absolute right-3 top-1/2 -translate-y-1/2
                                               text-slate-500 hover:text-slate-300 transition-colors"
                    data-target="si-password">
                    <i class="fa-solid fa-eye text-sm"></i>
                  </button>
                </div>
              </div>

              <div id="si-error"
                class="hidden rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3
                       text-red-400 text-sm text-center"></div>

              <button id="btn-signin" type="submit"
                class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold
                       py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Sign In
              </button>
            </form>

            <!-- ── Sign Up form ─────────────────────────────── -->
            <form id="form-signup" class="hidden space-y-4" novalidate>
              <div>
                <label class="form-label">Email</label>
                <input id="su-email" type="email" autocomplete="email"
                  placeholder="you@example.com"
                  class="input-field" />
              </div>
              <div>
                <label class="form-label">Password</label>
                <div class="relative">
                  <input id="su-password" type="password" autocomplete="new-password"
                    placeholder="At least 8 characters"
                    class="input-field pr-10" />
                  <button type="button" class="toggle-pw absolute right-3 top-1/2 -translate-y-1/2
                                               text-slate-500 hover:text-slate-300 transition-colors"
                    data-target="su-password">
                    <i class="fa-solid fa-eye text-sm"></i>
                  </button>
                </div>
              </div>
              <div>
                <label class="form-label">Confirm Password</label>
                <div class="relative">
                  <input id="su-confirm" type="password" autocomplete="new-password"
                    placeholder="Repeat password"
                    class="input-field pr-10" />
                  <button type="button" class="toggle-pw absolute right-3 top-1/2 -translate-y-1/2
                                               text-slate-500 hover:text-slate-300 transition-colors"
                    data-target="su-confirm">
                    <i class="fa-solid fa-eye text-sm"></i>
                  </button>
                </div>
              </div>

              <!-- Password strength bar -->
              <div id="pw-strength-bar" class="hidden space-y-1">
                <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div id="pw-strength-fill" class="h-full rounded-full transition-all duration-300"></div>
                </div>
                <p id="pw-strength-label" class="text-xs text-slate-500 text-right"></p>
              </div>

              <div id="su-error"
                class="hidden rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3
                       text-red-400 text-sm text-center"></div>
              <div id="su-success"
                class="hidden rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3
                       text-emerald-400 text-sm text-center"></div>

              <button id="btn-signup" type="submit"
                class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold
                       py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Create Account
              </button>
            </form>

            <!-- ── Forgot password form ──────────────────────── -->
            <div id="form-forgot" class="hidden space-y-4">
              <div class="text-center">
                <div class="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                  <i class="fa-solid fa-envelope-circle-check text-indigo-400 text-lg"></i>
                </div>
                <p class="text-white font-semibold">Reset your password</p>
                <p class="text-slate-400 text-xs mt-1 leading-relaxed">
                  Enter your account email and we'll send a reset link to your inbox.
                </p>
              </div>

              <div>
                <label class="form-label">Account Email</label>
                <input id="fp-email" type="email" autocomplete="email"
                  placeholder="you@example.com"
                  class="input-field" />
              </div>

              <div id="fp-error"
                class="hidden rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3
                       text-red-400 text-sm text-center"></div>
              <div id="fp-success"
                class="hidden rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3
                       text-emerald-400 text-sm text-center leading-relaxed"></div>

              <button id="btn-reset"
                class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold
                       py-3 rounded-xl transition-colors disabled:opacity-50">
                Send Reset Link
              </button>
              <button id="back-to-signin" type="button"
                class="w-full text-slate-500 hover:text-slate-300 text-sm py-1 transition-colors">
                ← Back to Sign In
              </button>
            </div>

          </div>
        </div>

        <!-- Security note -->
        <p class="text-slate-700 text-xs text-center mt-5">
          Your data is encrypted at rest. Only you can access your records.
        </p>

      </div>
    </div>
  `;
}

// ─── Password reset screen (shown after clicking the email link) ───
export function renderPasswordReset() {
  return `
    <div id="auth-screen" class="min-h-screen bg-navy-800 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 480 900"
           preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="pg1" cx="50%" cy="40%">
            <stop offset="0%" stop-color="#6366f1" stop-opacity="0.15"/>
            <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="240" cy="350" r="180" fill="url(#pg1)"/>
        <circle cx="60"  cy="80"  r="2"   fill="#818cf8" opacity="0.4"/>
        <circle cx="420" cy="120" r="2.5" fill="#6366f1" opacity="0.4"/>
        <circle cx="100" cy="780" r="2"   fill="#818cf8" opacity="0.3"/>
        <circle cx="380" cy="820" r="2.5" fill="#6366f1" opacity="0.3"/>
        <line x1="60" y1="80" x2="420" y2="120" stroke="#6366f1" stroke-width="0.4" opacity="0.1"/>
      </svg>
      <div class="w-full max-w-sm animate-slide-up relative">

        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-3xl
                      bg-gradient-to-br from-indigo-600/30 to-purple-600/20
                      border border-indigo-500/40 mb-5">
            <i class="fa-solid fa-lock-open text-3xl text-indigo-400"></i>
          </div>
          <h1 class="text-2xl font-bold text-white">Set New Password</h1>
          <p class="text-slate-400 mt-2 text-sm">Choose a strong password for your account.</p>
        </div>

        <div class="bg-navy-600 rounded-2xl border border-slate-700/50 shadow-2xl p-6 space-y-4">
          <div>
            <label class="form-label">New Password</label>
            <div class="relative">
              <input id="rp-password" type="password" autocomplete="new-password"
                placeholder="At least 8 characters"
                class="input-field pr-10" />
              <button type="button" class="toggle-pw absolute right-3 top-1/2 -translate-y-1/2
                                           text-slate-500 hover:text-slate-300 transition-colors"
                data-target="rp-password">
                <i class="fa-solid fa-eye text-sm"></i>
              </button>
            </div>
          </div>
          <div>
            <label class="form-label">Confirm New Password</label>
            <div class="relative">
              <input id="rp-confirm" type="password" autocomplete="new-password"
                placeholder="Repeat password"
                class="input-field pr-10" />
              <button type="button" class="toggle-pw absolute right-3 top-1/2 -translate-y-1/2
                                           text-slate-500 hover:text-slate-300 transition-colors"
                data-target="rp-confirm">
                <i class="fa-solid fa-eye text-sm"></i>
              </button>
            </div>
          </div>

          <div id="rp-error"
            class="hidden rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3
                   text-red-400 text-sm text-center"></div>

          <button id="btn-set-password"
            class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold
                   py-3 rounded-xl transition-colors disabled:opacity-50">
            Save New Password
          </button>
        </div>
      </div>
    </div>
  `;
}

// ─── Init main auth screen ────────────────────────────────────
export function initAuth() {
  _initTabs();
  _initTogglePasswords();
  _initSignIn();
  _initSignUp();
  _initForgotPassword();
}

// ─── Init password reset screen ──────────────────────────────
export function initPasswordReset(onSuccess) {
  _initTogglePasswords();

  document.getElementById('btn-set-password')?.addEventListener('click', async () => {
    const pw      = document.getElementById('rp-password')?.value.trim();
    const confirm = document.getElementById('rp-confirm')?.value.trim();
    const errEl   = document.getElementById('rp-error');
    const btn     = document.getElementById('btn-set-password');

    errEl.classList.add('hidden');

    if (!pw || pw.length < 8) {
      errEl.textContent = 'Password must be at least 8 characters.';
      errEl.classList.remove('hidden');
      return;
    }
    if (pw !== confirm) {
      errEl.textContent = 'Passwords do not match.';
      errEl.classList.remove('hidden');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Saving…';

    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      onSuccess();
    } catch (err) {
      errEl.textContent = err.message || 'Failed to update password. Try again.';
      errEl.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'Save New Password';
    }
  });
}

// ─── Private helpers ──────────────────────────────────────────
function _initTabs() {
  const tabSignin = document.getElementById('tab-signin');
  const tabSignup = document.getElementById('tab-signup');
  const formSignin = document.getElementById('form-signin');
  const formSignup = document.getElementById('form-signup');
  const formForgot = document.getElementById('form-forgot');

  const ACTIVE   = 'text-white border-b-2 border-indigo-500 bg-indigo-500/5';
  const INACTIVE = 'text-slate-500 hover:text-slate-300 border-b-2 border-transparent';

  tabSignin?.addEventListener('click', () => {
    tabSignin.className = `flex-1 py-3.5 text-sm font-semibold transition-colors ${ACTIVE}`;
    tabSignup.className = `flex-1 py-3.5 text-sm font-semibold transition-colors ${INACTIVE}`;
    formSignin.classList.remove('hidden');
    formSignup.classList.add('hidden');
    formForgot.classList.add('hidden');
  });

  tabSignup?.addEventListener('click', () => {
    tabSignup.className = `flex-1 py-3.5 text-sm font-semibold transition-colors ${ACTIVE}`;
    tabSignin.className = `flex-1 py-3.5 text-sm font-semibold transition-colors ${INACTIVE}`;
    formSignup.classList.remove('hidden');
    formSignin.classList.add('hidden');
    formForgot.classList.add('hidden');
  });
}

function _initTogglePasswords() {
  document.querySelectorAll('.toggle-pw').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btn.querySelector('i').className = isHidden ? 'fa-solid fa-eye-slash text-sm' : 'fa-solid fa-eye text-sm';
    });
  });
}

function _setLoading(btn, loading, label = 'Sign In') {
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Loading…'
    : label;
}

function _initSignIn() {
  document.getElementById('form-signin')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('si-email')?.value.trim();
    const password = document.getElementById('si-password')?.value;
    const errEl    = document.getElementById('si-error');
    const btn      = document.getElementById('btn-signin');

    errEl.classList.add('hidden');

    if (!email) { errEl.textContent = 'Please enter your email.'; errEl.classList.remove('hidden'); return; }
    if (!password) { errEl.textContent = 'Please enter your password.'; errEl.classList.remove('hidden'); return; }

    _setLoading(btn, true, 'Sign In');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // onAuthStateChange in main.js handles the rest
    } catch (err) {
      errEl.textContent = _friendlyError(err.message);
      errEl.classList.remove('hidden');
      _setLoading(btn, false, 'Sign In');
    }
  });
}

function _initSignUp() {
  const pwInput  = document.getElementById('su-password');
  const barWrap  = document.getElementById('pw-strength-bar');
  const barFill  = document.getElementById('pw-strength-fill');
  const barLabel = document.getElementById('pw-strength-label');

  pwInput?.addEventListener('input', () => {
    const pw = pwInput.value;
    if (!pw) { barWrap?.classList.add('hidden'); return; }
    barWrap?.classList.remove('hidden');

    const { score, label, color } = _pwStrength(pw);
    const pct = (score / 4) * 100;
    if (barFill) { barFill.style.width = pct + '%'; barFill.className = `h-full rounded-full transition-all duration-300 bg-${color}-500`; }
    if (barLabel) { barLabel.textContent = label; barLabel.className = `text-xs text-${color}-400 text-right`; }
  });

  let signupCooldownTimer = null;

  document.getElementById('form-signup')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('su-email')?.value.trim();
    const password = document.getElementById('su-password')?.value;
    const confirm  = document.getElementById('su-confirm')?.value;
    const errEl    = document.getElementById('su-error');
    const succEl   = document.getElementById('su-success');
    const btn      = document.getElementById('btn-signup');

    // If still in cooldown, do nothing
    if (btn.disabled) return;

    errEl.classList.add('hidden');
    succEl.classList.add('hidden');

    if (!email)              { errEl.textContent = 'Please enter your email.'; errEl.classList.remove('hidden'); return; }
    if (password.length < 8) { errEl.textContent = 'Password must be at least 8 characters.'; errEl.classList.remove('hidden'); return; }
    if (password !== confirm) { errEl.textContent = 'Passwords do not match.'; errEl.classList.remove('hidden'); return; }

    _setLoading(btn, true, 'Create Account');
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      succEl.textContent = 'Account created! Check your email to confirm, then sign in.';
      succEl.classList.remove('hidden');
      _setLoading(btn, false, 'Create Account');
    } catch (err) {
      const friendly = _friendlyError(err.message);
      errEl.textContent = friendly;
      errEl.classList.remove('hidden');

      // If rate-limited, disable the button with a countdown
      const isRateLimited = _isRateLimitError(err.message);
      if (isRateLimited) {
        clearInterval(signupCooldownTimer);
        let seconds = _extractCooldownSeconds(err.message) || 60;
        btn.disabled = true;

        const tick = () => {
          if (seconds <= 0) {
            clearInterval(signupCooldownTimer);
            _setLoading(btn, false, 'Create Account');
            errEl.classList.add('hidden');
            return;
          }
          btn.innerHTML = `<i class="fa-solid fa-clock mr-2"></i>Wait ${seconds}s…`;
          seconds--;
        };
        tick();
        signupCooldownTimer = setInterval(tick, 1000);
      } else {
        _setLoading(btn, false, 'Create Account');
      }
    }
  });
}

function _initForgotPassword() {
  const formSignin = document.getElementById('form-signin');
  const formForgot = document.getElementById('form-forgot');
  const tabSignin  = document.getElementById('tab-signin');
  const tabSignup  = document.getElementById('tab-signup');

  const ACTIVE   = 'flex-1 py-3.5 text-sm font-semibold transition-colors text-white border-b-2 border-indigo-500 bg-indigo-500/5';
  const INACTIVE = 'flex-1 py-3.5 text-sm font-semibold transition-colors text-slate-500 hover:text-slate-300 border-b-2 border-transparent';

  document.getElementById('show-forgot')?.addEventListener('click', () => {
    formSignin.classList.add('hidden');
    formForgot.classList.remove('hidden');
    if (tabSignin) tabSignin.className = INACTIVE;
    if (tabSignup) tabSignup.className = INACTIVE;
    // Pre-fill email if already typed
    const email = document.getElementById('si-email')?.value;
    if (email) { const fpEmail = document.getElementById('fp-email'); if (fpEmail) fpEmail.value = email; }
  });

  document.getElementById('back-to-signin')?.addEventListener('click', () => {
    formForgot.classList.add('hidden');
    formSignin.classList.remove('hidden');
    if (tabSignin) tabSignin.className = ACTIVE;
    if (tabSignup) tabSignup.className = INACTIVE;
    document.getElementById('fp-error')?.classList.add('hidden');
    document.getElementById('fp-success')?.classList.add('hidden');
  });

  document.getElementById('btn-reset')?.addEventListener('click', async () => {
    const email  = document.getElementById('fp-email')?.value.trim();
    const errEl  = document.getElementById('fp-error');
    const succEl = document.getElementById('fp-success');
    const btn    = document.getElementById('btn-reset');

    errEl.classList.add('hidden');
    succEl.classList.add('hidden');

    if (!email) { errEl.textContent = 'Please enter your email address.'; errEl.classList.remove('hidden'); return; }

    btn.disabled = true;
    btn.textContent = 'Sending…';

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      succEl.innerHTML = `Reset link sent to <strong>${email}</strong>.<br>Check your inbox (and spam folder).`;
      succEl.classList.remove('hidden');
    } catch (err) {
      errEl.textContent = _friendlyError(err.message);
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Reset Link';
    }
  });
}

// ─── Helpers ──────────────────────────────────────────────────
function _friendlyError(msg = '') {
  if (msg.includes('Invalid login credentials')) return 'Incorrect email or password.';
  if (msg.includes('Email not confirmed'))       return 'Please confirm your email first — check your inbox.';
  if (msg.includes('User already registered'))   return 'An account with this email already exists. Try signing in.';
  if (_isRateLimitError(msg)) {
    const secs = _extractCooldownSeconds(msg);
    return secs
      ? `Too many attempts. Please wait ${secs} seconds before trying again.`
      : 'Too many attempts. Please wait a moment and try again.';
  }
  return msg || 'Something went wrong. Please try again.';
}

function _isRateLimitError(msg = '') {
  const lower = msg.toLowerCase();
  return (
    lower.includes('rate limit') ||
    lower.includes('too many') ||
    lower.includes('for security purposes') ||
    lower.includes('over_email_send_rate_limit') ||
    lower.includes('email rate limit')
  );
}

function _extractCooldownSeconds(msg = '') {
  // Supabase sometimes includes "after X seconds" in the error message
  const match = msg.match(/after\s+(\d+)\s+second/i);
  return match ? parseInt(match[1], 10) : null;
}

function _pwStrength(pw) {
  let score = 0;
  if (pw.length >= 8)                    score++;
  if (pw.length >= 12)                   score++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw))          score++;
  const levels = [
    { label: 'Too weak', color: 'red'    },
    { label: 'Weak',     color: 'orange' },
    { label: 'Fair',     color: 'amber'  },
    { label: 'Good',     color: 'sky'    },
    { label: 'Strong',   color: 'emerald'},
  ];
  return { score, ...levels[score] };
}
