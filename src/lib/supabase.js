import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example → .env and fill in your project credentials.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ─── Auth helpers ────────────────────────────────────────────

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ─── User helpers ────────────────────────────────────────────

export async function fetchUser(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function addXp(userId, xp) {
  const { error } = await supabase.rpc('add_xp', {
    p_user_id: userId,
    p_xp:      xp,
  });
  if (error) throw error;
}

// ─── Habits helpers ──────────────────────────────────────────

export async function fetchOrCreateTodayHabits(userId) {
  const today = new Date().toISOString().split('T')[0];

  // Try to fetch
  let { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (error && error.code === 'PGRST116') {
    // Row doesn't exist — create it
    const { data: created, error: insertErr } = await supabase
      .from('habits')
      .insert({ user_id: userId, date: today })
      .select()
      .single();
    if (insertErr) throw insertErr;
    return created;
  }

  if (error) throw error;
  return data;
}

export async function updateHabit(habitId, field, value) {
  const { error } = await supabase
    .from('habits')
    .update({ [field]: value })
    .eq('id', habitId);
  if (error) throw error;
}

export async function fetchHabitsRange(userId, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .gte('date', sinceStr)
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ─── Workout log helpers ─────────────────────────────────────

export async function saveWorkoutLog(userId, payload) {
  const { data, error } = await supabase
    .from('workout_logs')
    .insert({ user_id: userId, ...payload })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Anxiety vault helpers ───────────────────────────────────

export async function saveAnxietyEntry(userId, payload) {
  const { data, error } = await supabase
    .from('anxiety_vault')
    .insert({ user_id: userId, ...payload })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchAnxietyRange(userId, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('anxiety_vault')
    .select('timestamp')
    .eq('user_id', userId)
    .gte('timestamp', since.toISOString())
    .order('timestamp', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ─── Biometrics / onboarding helpers ─────────────────────────

export async function saveWeightLog(userId, weightKg, bmi) {
  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase
    .from('weight_logs')
    .insert({ user_id: userId, date: today, weight_kg: weightKg, bmi });
  if (error) throw error;

  // Also keep current_bmi in sync
  const { error: rpcErr } = await supabase.rpc('update_bmi', {
    p_user_id:   userId,
    p_weight_kg: weightKg,
    p_bmi:       bmi,
  });
  if (rpcErr) throw rpcErr;
}

export async function fetchWeightLogs(userId, limit = 30) {
  const { data, error } = await supabase
    .from('weight_logs')
    .select('date, weight_kg, bmi')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// ─── Sleep / daily_metrics helpers ───────────────────────────

export async function fetchTodaySleep(userId) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('daily_metrics')
    .select('garmin_sleep_hours, garmin_sleep_score, synced_at')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchSleepRange(userId, days = 3) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_metrics')
    .select('date, garmin_sleep_hours, garmin_sleep_score')
    .eq('user_id', userId)
    .gte('date', sinceStr)
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ─── Focus area intelligence data ────────────────────────────
// Fetches all data needed by the Areas of Improvement engine

export async function fetchFocusAreaData(userId) {
  const since = new Date();
  since.setDate(since.getDate() - 3);
  const sinceStr = since.toISOString().split('T')[0];

  const [habitsRes, sleepRes, anxietyRes] = await Promise.all([
    supabase
      .from('habits')
      .select('date, workout, meditation, studying, eating_clean, smoke_free')
      .eq('user_id', userId)
      .gte('date', sinceStr)
      .order('date', { ascending: false }),

    supabase
      .from('daily_metrics')
      .select('date, garmin_sleep_score')
      .eq('user_id', userId)
      .gte('date', sinceStr),

    supabase
      .from('anxiety_vault')
      .select('timestamp')
      .eq('user_id', userId)
      .gte('timestamp', since.toISOString()),
  ]);

  // Count anxiety entries per day (last 3 days)
  const anxietyCounts3d = [0, 1, 2].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    const dateStr = d.toISOString().split('T')[0];
    return (anxietyRes.data || []).filter(
      (a) => a.timestamp.startsWith(dateStr)
    ).length;
  });

  return {
    habits3d:        habitsRes.data  || [],
    sleep3d:         sleepRes.data   || [],
    anxietyCounts3d,
  };
}

// ─── Push subscription helpers ───────────────────────────────

export async function savePushSubscription(userId, subscription) {
  const { endpoint, keys: { p256dh, auth } } = subscription.toJSON();

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { user_id: userId, endpoint, p256dh, auth },
      { onConflict: 'user_id,endpoint' }
    );
  if (error) throw error;
}
