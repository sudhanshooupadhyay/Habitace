/**
 * Supabase Edge Function: sleep-webhook
 *
 * Receives automated sleep data from Garmin via Zapier / IFTTT / Google Fit webhook.
 * Validates the user's webhook_token, then upserts into daily_metrics.
 *
 * Deploy:
 *   supabase functions deploy sleep-webhook --no-verify-jwt
 *
 * Set secrets in Supabase Dashboard → Edge Functions → sleep-webhook → Secrets:
 *   SUPABASE_URL         (auto-available)
 *   SUPABASE_SERVICE_ROLE_KEY  (add manually)
 *
 * Webhook URL for Zapier/IFTTT:
 *   https://<project-ref>.supabase.co/functions/v1/sleep-webhook
 *
 * Required JSON body:
 *   {
 *     "webhook_token": "<user's token from users table>",
 *     "date": "2026-04-23",          // optional, defaults to today UTC
 *     "sleep_hours": 7.5,
 *     "sleep_score": 85
 *   }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ── Parse body ─────────────────────────────────────────────
  let body: {
    webhook_token: string;
    date?: string;
    sleep_hours: number;
    sleep_score: number;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { webhook_token, sleep_hours, sleep_score } = body;
  const date = body.date || new Date().toISOString().split('T')[0];

  // ── Validate fields ────────────────────────────────────────
  if (!webhook_token) {
    return new Response(
      JSON.stringify({ error: 'Missing webhook_token' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (typeof sleep_hours !== 'number' || sleep_hours < 0 || sleep_hours > 24) {
    return new Response(
      JSON.stringify({ error: 'Invalid sleep_hours (must be 0–24)' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (typeof sleep_score !== 'number' || sleep_score < 0 || sleep_score > 100) {
    return new Response(
      JSON.stringify({ error: 'Invalid sleep_score (must be 0–100)' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ── Admin client (bypasses RLS) ───────────────────────────
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // ── Validate webhook_token → resolve user_id ──────────────
  const { data: userRow, error: userErr } = await supabase
    .from('users')
    .select('id')
    .eq('webhook_token', webhook_token)
    .single();

  if (userErr || !userRow) {
    return new Response(
      JSON.stringify({ error: 'Invalid webhook_token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const userId = userRow.id;

  // ── Upsert daily_metrics ───────────────────────────────────
  const { error: upsertErr } = await supabase
    .from('daily_metrics')
    .upsert(
      {
        user_id:            userId,
        date,
        garmin_sleep_hours: sleep_hours,
        garmin_sleep_score: sleep_score,
        synced_at:          new Date().toISOString(),
      },
      { onConflict: 'user_id,date' }
    );

  if (upsertErr) {
    console.error('[sleep-webhook] upsert error:', upsertErr);
    return new Response(
      JSON.stringify({ error: 'Database error', detail: upsertErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Sleep data synced for ${date}`,
      data:    { date, sleep_hours, sleep_score },
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
