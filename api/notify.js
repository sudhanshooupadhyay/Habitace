/**
 * Vercel Serverless Function — /api/notify
 *
 * Called by Vercel Cron at 14:00 and 21:00 UTC daily (see vercel.json).
 * Fetches all push subscriptions from Supabase and sends a Web Push
 * notification to each subscriber using the web-push library.
 *
 * Required environment variables (set in Vercel dashboard):
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   ← service-role key (not anon, to bypass RLS)
 *   VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *   VAPID_EMAIL
 */

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VITE_VAPID_PUBLIC_KEY,   // same key used by client-side
  process.env.VAPID_PRIVATE_KEY
);

function buildPayload(hour) {
  const is2pm = hour >= 12 && hour < 15;

  if (is2pm) {
    return {
      title: '2 PM Check-In — Discipline Tracker',
      body:  'Afternoon update: have you moved your body today? Tick your habits.',
      url:   '/',
    };
  }

  return {
    title: '9 PM Mental Check-In — Discipline Tracker',
    body:  "Evening reflection time. Log today's wins and any anxiety moments.",
    url:   '/',
  };
}

export default async function handler(req, res) {
  // Vercel Cron calls with Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const hour = new Date().getUTCHours();
  const payload = JSON.stringify(buildPayload(hour));

  // Fetch all subscriptions
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth');

  if (error) {
    console.error('[notify] Supabase fetch error:', error);
    return res.status(500).json({ error: error.message });
  }

  if (!subs || subs.length === 0) {
    return res.status(200).json({ sent: 0, message: 'No subscribers.' });
  }

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      )
    )
  );

  const sent   = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  // Clean up expired subscriptions (410 Gone)
  const expiredEndpoints = results
    .filter((r) => r.status === 'rejected' && r.reason?.statusCode === 410)
    .map((r, i) => subs[i]?.endpoint)
    .filter(Boolean);

  if (expiredEndpoints.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', expiredEndpoints);
  }

  console.log(`[notify] Sent: ${sent}, Failed: ${failed}, Cleaned: ${expiredEndpoints.length}`);
  return res.status(200).json({ sent, failed, cleaned: expiredEndpoints.length });
}
