/**
 * Bio Age Engine
 * ─────────────────────────────────────────────────────────────
 * Science-based biological age calculator using five biomarkers.
 * Primary reference: Levine et al. (2018), Klemera-Doubal method,
 * and VO2 Max longevity research (Mandsager et al., JAMA 2018).
 *
 * Formula: BioAge = ChronoAge + Σ(delta_i × weight_i)
 * Composite Score (0–100): inverse of weighted penalty sum.
 */

// ── Component weights ──────────────────────────────────────────
const W = {
  vo2max:   0.35,
  rhr:      0.25,
  bmi:      0.15,
  sleep:    0.15,
  activity: 0.10,
};

// ── VO2 Max delta table (years offset from chrono age) ────────
function vo2maxDelta(vo2) {
  if (!vo2) return null;
  if (vo2 >= 55) return -10;
  if (vo2 >= 50) return -7;
  if (vo2 >= 45) return -4;
  if (vo2 >= 40) return -1;
  if (vo2 >= 35) return  2;
  if (vo2 >= 30) return  5;
  if (vo2 >= 25) return  9;
  return 13;
}

export function vo2maxFitnessLabel(vo2) {
  if (!vo2) return null;
  if (vo2 >= 55) return { label: 'Superior',   color: 'emerald', pct: 100 };
  if (vo2 >= 50) return { label: 'Excellent',  color: 'emerald', pct: 88  };
  if (vo2 >= 45) return { label: 'Good',       color: 'sky',     pct: 72  };
  if (vo2 >= 40) return { label: 'Above Avg',  color: 'indigo',  pct: 58  };
  if (vo2 >= 35) return { label: 'Average',    color: 'amber',   pct: 42  };
  if (vo2 >= 30) return { label: 'Below Avg',  color: 'orange',  pct: 28  };
  if (vo2 >= 25) return { label: 'Poor',       color: 'red',     pct: 15  };
  return               { label: 'Very Poor',   color: 'red',     pct: 5   };
}

// ── Resting HR delta ──────────────────────────────────────────
function rhrDelta(rhr) {
  if (!rhr) return null;
  if (rhr <= 45) return -9;
  if (rhr <= 50) return -6;
  if (rhr <= 55) return -3;
  if (rhr <= 60) return -1;
  if (rhr <= 70) return  1;
  if (rhr <= 75) return  4;
  if (rhr <= 80) return  7;
  return 11;
}

export function rhrLabel(rhr) {
  if (!rhr) return null;
  if (rhr <= 45) return { label: 'Athlete',    color: 'emerald' };
  if (rhr <= 55) return { label: 'Excellent',  color: 'sky'     };
  if (rhr <= 65) return { label: 'Good',       color: 'indigo'  };
  if (rhr <= 75) return { label: 'Average',    color: 'amber'   };
  return               { label: 'Elevated',    color: 'red'     };
}

// ── BMI delta ─────────────────────────────────────────────────
function bmiDelta(bmi) {
  if (!bmi) return null;
  if (bmi < 18.5) return  3;
  if (bmi < 21)   return -5;
  if (bmi < 23)   return -2;
  if (bmi < 25)   return  0;
  if (bmi < 27.5) return  2;
  if (bmi < 30)   return  5;
  return 10;
}

// ── Sleep score delta ─────────────────────────────────────────
function sleepDelta(score) {
  if (!score) return null;
  if (score >= 85) return -4;
  if (score >= 75) return -1;
  if (score >= 60) return  2;
  if (score >= 45) return  5;
  return 8;
}

// ── Activity delta (workouts per week) ───────────────────────
function activityDelta(workoutsPerWeek) {
  if (workoutsPerWeek === null || workoutsPerWeek === undefined) return null;
  if (workoutsPerWeek >= 6) return -6;
  if (workoutsPerWeek >= 5) return -4;
  if (workoutsPerWeek >= 4) return -2;
  if (workoutsPerWeek >= 3) return  0;
  if (workoutsPerWeek >= 2) return  2;
  if (workoutsPerWeek >= 1) return  4;
  return 7;
}

// ── Compute chronological age from DOB ───────────────────────
export function chronologicalAge(dob) {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ── Main calculator ───────────────────────────────────────────
/**
 * @param {object} metrics
 * @param {number|null} metrics.vo2_max
 * @param {number|null} metrics.resting_hr
 * @param {number|null} metrics.bmi
 * @param {number|null} metrics.sleep_score     - 0-100
 * @param {number|null} metrics.workouts_per_week
 * @param {string|null} metrics.date_of_birth   - ISO date string
 */
export function calcBioAge(metrics) {
  const { vo2_max, resting_hr, bmi, sleep_score, workouts_per_week, date_of_birth } = metrics;

  const chronoAge = chronologicalAge(date_of_birth);
  if (!chronoAge) return null;

  const components = {
    vo2max:   { delta: vo2maxDelta(vo2_max),               weight: W.vo2max,   value: vo2_max      },
    rhr:      { delta: rhrDelta(resting_hr),               weight: W.rhr,      value: resting_hr   },
    bmi:      { delta: bmiDelta(bmi),                      weight: W.bmi,      value: bmi          },
    sleep:    { delta: sleepDelta(sleep_score),            weight: W.sleep,    value: sleep_score  },
    activity: { delta: activityDelta(workouts_per_week),   weight: W.activity, value: workouts_per_week },
  };

  // Weighted average of available deltas
  let totalWeight = 0;
  let weightedDelta = 0;
  const breakdown = {};

  for (const [key, { delta, weight }] of Object.entries(components)) {
    if (delta !== null) {
      weightedDelta += delta * weight;
      totalWeight   += weight;
      breakdown[key] = parseFloat((delta).toFixed(1));
    } else {
      breakdown[key] = null;
    }
  }

  if (totalWeight === 0) return null;

  // Normalise if some components are missing
  const normalisedDelta = totalWeight < 1
    ? weightedDelta / totalWeight
    : weightedDelta;

  const bioAge = parseFloat((chronoAge + normalisedDelta).toFixed(1));

  // Composite score: 0-100 (higher = better)
  // Map delta of -10 → 100, 0 → 60, +10 → 20
  const compositeScore = Math.max(0, Math.min(100, Math.round(60 - normalisedDelta * 4)));

  return {
    chronoAge,
    bioAge,
    delta:          parseFloat(normalisedDelta.toFixed(1)),
    compositeScore,
    components:     breakdown,
    dataCompleteness: Math.round((totalWeight / 1) * 100),
  };
}

// ── Bio age interpretation ────────────────────────────────────
export function bioAgeInterpretation(delta) {
  if (delta <= -10) return {
    grade: 'S', color: 'emerald',
    headline: 'Exceptional Biological Profile',
    message: "Your body is performing a decade younger than your birth date. This is the upper tier of human longevity research — your habits are measurably reversing the aging clock.",
  };
  if (delta <= -5) return {
    grade: 'A', color: 'sky',
    headline: 'Strong Anti-Aging Trajectory',
    message: "Your lifestyle is producing a meaningful biological advantage. 5+ years of biological youth is the result of consistent high-quality inputs: sleep, cardio, and recovery.",
  };
  if (delta <= -2) return {
    grade: 'B', color: 'indigo',
    headline: 'On Track — Minor Optimisations Available',
    message: "You're performing younger than your age. Minor targeted improvements in your weakest biomarker will accelerate this further.",
  };
  if (delta <= 2) return {
    grade: 'C', color: 'amber',
    headline: 'Neutral — Habits Are Maintaining',
    message: "Your biological age matches your chronological age. Your current habits are preventing decline but not yet reversing it. One or two targeted improvements will shift the needle.",
  };
  if (delta <= 5) return {
    grade: 'D', color: 'orange',
    headline: 'Opportunity Detected',
    message: "Your biology is running slightly ahead of your age. This is fully reversible. Focus on your weakest biomarker first — small, consistent changes create compounding returns.",
  };
  if (delta <= 10) return {
    grade: 'E', color: 'red',
    headline: 'Significant Reversal Opportunity',
    message: "Your body is aging faster than the calendar. This is not a verdict — it is a diagnosis. Targeted intervention in VO2 Max and sleep quality can produce 2–5 years of biological reversal within 90 days.",
  };
  return {
    grade: 'F', color: 'rose',
    headline: 'Code Red — Immediate Intervention',
    message: "The data is a call to action, not a judgment. Every biomarker here is modifiable. Start with resting heart rate reduction (zone 2 cardio, 3×/week) and sleep hygiene. The body has remarkable plasticity at any age.",
  };
}

// ── Weakest biomarker finder ──────────────────────────────────
export function findWeakestComponent(components) {
  const labels = {
    vo2max:   'VO₂ Max (Cardiovascular Fitness)',
    rhr:      'Resting Heart Rate',
    bmi:      'Body Composition (BMI)',
    sleep:    'Sleep Quality',
    activity: 'Physical Activity Level',
  };

  let worst = null;
  let worstDelta = -Infinity;

  for (const [key, delta] of Object.entries(components)) {
    if (delta !== null && delta > worstDelta) {
      worstDelta = delta;
      worst      = { key, label: labels[key], delta };
    }
  }
  return worst;
}

// ── Health protocol generator ─────────────────────────────────
export function generateHealthProtocol(bioAgeResult, metrics) {
  if (!bioAgeResult) return [];

  const { delta, components } = bioAgeResult;
  const protocols = [];
  const vo2   = metrics.vo2_max;
  const rhr   = metrics.resting_hr;
  const hrv   = metrics.hrv_rmssd;
  const sleep = metrics.sleep_score;
  const stress = metrics.stress_level;
  const batt   = metrics.body_battery;

  // ── Zone 2 Cardio Protocol ───────────────────────────────
  const maxHr   = metrics.max_hr || (metrics.age ? 220 - metrics.age : 185);
  const z2Low   = Math.round(maxHr * 0.60);
  const z2High  = Math.round(maxHr * 0.70);

  protocols.push({
    icon:     'fa-heart-pulse',
    color:    'emerald',
    category: 'Cardiovascular Protocol',
    title:    'Zone 2 Cardio — The Longevity Foundation',
    urgency:  vo2 && vo2 < 40 ? 'high' : 'standard',
    body: `Zone 2 is the single most evidence-backed intervention for VO₂ Max improvement and metabolic health. Your target HR zone: <strong>${z2Low}–${z2High} bpm</strong>.`,
    protocol: [
      `3–4 sessions per week, 30–45 minutes each`,
      `Pace: conversational — you should be able to speak full sentences`,
      `Modalities: brisk walk, light jog, cycling, rowing, swimming`,
      `Week 1–4: Build to 150 minutes of Zone 2 per week total`,
      `VO₂ Max responds in 6–8 weeks of consistent Zone 2 training`,
    ],
    evidence: 'Dr. Peter Attia, Iñigo San Millán — Zone 2 research, Stanford & CU Boulder',
  });

  // ── HRV Protocol ────────────────────────────────────────
  if (hrv !== null) {
    const hrvStatus = hrv >= 60 ? 'optimal' : hrv >= 40 ? 'moderate' : 'low';
    protocols.push({
      icon:     'fa-wave-square',
      color:    hrvStatus === 'optimal' ? 'sky' : hrvStatus === 'moderate' ? 'amber' : 'red',
      category: 'HRV & Recovery',
      title:    `HRV: ${hrv} ms — ${hrvStatus === 'optimal' ? 'Train' : hrvStatus === 'moderate' ? 'Train with Caution' : 'Recovery Day'}`,
      urgency:  hrvStatus === 'low' ? 'high' : 'standard',
      body: `Heart Rate Variability (HRV) is your nervous system's readiness score. ${
        hrvStatus === 'optimal'
          ? 'Your HRV indicates high readiness. Today is a green-light training day.'
          : hrvStatus === 'moderate'
          ? 'Moderate HRV — train at 70% intensity. Monitor perceived exertion closely.'
          : 'Low HRV signals systemic stress. Skip high-intensity today. Walk, stretch, meditate.'
      }`,
      protocol: hrvStatus === 'low'
        ? ['Rest or active recovery only', 'Prioritise sleep tonight', 'Box breathing: 4×4×4×4, 3 sets', 'Cold water facial immersion: 30 seconds']
        : ['Proceed with planned training', 'Monitor HR during session for accuracy', 'Post-session: legs up wall, 10 min'],
      evidence: 'Plews et al. (2013) — HRV-guided training optimisation, Journal of Sports Sciences',
    });
  }

  // ── Sleep Optimization ──────────────────────────────────
  if (sleep !== null && sleep < 75) {
    protocols.push({
      icon:     'fa-moon',
      color:    'purple',
      category: 'Sleep Optimisation',
      title:    'Sleep Quality Intervention',
      urgency:  sleep < 50 ? 'high' : 'standard',
      body: `Your sleep score of ${sleep}/100 is ${sleep < 50 ? 'significantly' : 'moderately'} below optimal. Poor sleep accelerates biological aging by 1.5–3 years per chronic year of disruption (Walker, 2017).`,
      protocol: [
        'Fixed wake time — same every day, including weekends',
        'Bedroom: 18–19°C, total blackout, no screens 60 min before bed',
        'Magnesium glycinate 400mg, 30 min before sleep',
        'No alcohol within 3 hours of sleep (destroys REM)',
        'NSDR (Yoga Nidra) 20 min if you cannot sleep — restores adenosine',
        'Morning: 10 min outdoor light exposure within 30 min of waking',
      ],
      evidence: 'Matthew Walker — Why We Sleep (2017); Huberman Lab, sleep toolkit',
    });
  }

  // ── Body Battery / Recovery ─────────────────────────────
  if (batt !== null && batt < 40) {
    protocols.push({
      icon:     'fa-battery-quarter',
      color:    'amber',
      category: 'Energy & Recovery',
      title:    `Body Battery: ${batt}% — Recovery Mode`,
      urgency:  batt < 20 ? 'high' : 'standard',
      body: `Your Garmin Body Battery is critically low. This reflects accumulated physiological stress that sleep hasn't fully resolved. High-intensity training today would be counterproductive.`,
      protocol: [
        'Today: active recovery only — walk, gentle stretch, foam roll',
        'Nap protocol: 20 min before 3 PM (prevents sleep pressure disruption)',
        'Avoid caffeine after 12 PM',
        'Hydrate: 35ml per kg body weight today',
        'Tomorrow: reassess Body Battery before committing to intensity',
      ],
      evidence: 'Garmin Body Battery algorithm — based on HRV, sleep, and stress data',
    });
  }

  // ── Stress Management ───────────────────────────────────
  if (stress !== null && stress > 50) {
    protocols.push({
      icon:     'fa-brain',
      color:    stress > 75 ? 'red' : 'orange',
      category: 'Stress Regulation',
      title:    `Stress Level: ${stress}/100 — ${stress > 75 ? 'High' : 'Elevated'}`,
      urgency:  stress > 75 ? 'high' : 'standard',
      body: `Elevated physiological stress increases cortisol, which mimics — and worsens — health anxiety symptoms. Your nervous system needs active downregulation tools, not passive waiting.`,
      protocol: [
        'Physiological sigh: 2 quick inhales through nose, long exhale through mouth — 5 reps',
        'Cold water face immersion: 30 sec triggers diving reflex (immediate HRV boost)',
        '4-7-8 breathing: Inhale 4s, hold 7s, exhale 8s — directly engages vagus nerve',
        'Limit stimulant intake today (caffeine, pre-workout)',
        'Evening: 20-min NSDR / Yoga Nidra session',
      ],
      evidence: 'Huberman Lab — stress inoculation & HRV tools; Zaccaro et al. (2018)',
    });
  }

  return protocols;
}

// ── Meditation program generator ─────────────────────────────
export function generateMeditationProgram(metrics) {
  const stress    = metrics.stress_level;
  const sleep     = metrics.sleep_score;
  const hrv       = metrics.hrv_rmssd;
  const bodyBatt  = metrics.body_battery;

  const urgencyScore = (
    ((stress || 50) / 100)    * 0.4  +
    ((100 - (sleep || 70)) / 100) * 0.3 +
    ((hrv ? Math.max(0, 80 - hrv) : 40) / 80) * 0.3
  );

  const sessions = [];

  // ── Morning session ────────────────────────────────────
  sessions.push({
    time:     'Morning (within 30 min of waking)',
    icon:     'fa-sun',
    color:    'amber',
    duration: urgencyScore > 0.6 ? '15 min' : '10 min',
    title:    'Morning Activation Protocol',
    steps: [
      { time: '2 min',  name: 'Physiological Sigh Reset',   desc: '2 short nasal inhales + long oral exhale. Clears residual CO₂ from sleep and activates alertness.' },
      { time: '5 min',  name: 'Body Scan Awareness',         desc: 'Scan from feet to crown. Identify and consciously release any held tension. Note: awareness is not anxiety — it is intelligence.' },
      { time: '3 min',  name: 'Intention Setting',           desc: "Three values you will embody today. Say them internally: 'I am disciplined. I am safe. I am capable.'" },
    ],
    notes: 'Do this before phone. Pair with morning light exposure (eyes open, outdoors).',
  });

  // ── Midday reset ───────────────────────────────────────
  sessions.push({
    time:     'Midday (12–2 PM, during cortisol dip)',
    icon:     'fa-clock',
    color:    'indigo',
    duration: '5 min',
    title:    'Cortisol Reset — Box Breathing',
    steps: [
      { time: '4 min', name: '4-4-4-4 Box Breathing', desc: 'Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. 4 complete cycles. This directly engages the parasympathetic system and reduces cortisol within minutes.' },
      { time: '1 min', name: 'Open Monitoring',        desc: 'Close eyes. Observe thoughts like clouds. No engagement. You are the sky — thoughts are weather passing through.' },
    ],
    notes: 'Most effective done after lunch, before returning to focused work.',
  });

  // ── Evening wind-down ──────────────────────────────────
  const eveningMinutes = urgencyScore > 0.7 ? 20 : 15;
  sessions.push({
    time:     `Evening (60–90 min before sleep)`,
    icon:     'fa-moon',
    color:    'purple',
    duration: `${eveningMinutes} min`,
    title:    'NSDR / Yoga Nidra Wind-Down',
    steps: [
      { time: '2 min',               name: '4-7-8 Breathing',           desc: 'Inhale 4s → Hold 7s → Exhale 8s. 4 cycles. Activates the longest exhalation ratio — maximum parasympathetic activation.' },
      { time: `${eveningMinutes - 5} min`, name: 'NSDR Body Rotation',  desc: 'Guided attention through each body part. Non-Sleep Deep Rest (NSDR) has been shown in Stanford studies to increase dopamine baseline and restore cognitive resources equivalent to a 90-min sleep.' },
      { time: '3 min',               name: 'Gratitude Anchoring',        desc: 'Recall 3 specific moments from today. Detail matters — the more specific, the more dopamine is released.' },
    ],
    notes: urgencyScore > 0.6
      ? '⚠ Your stress/HRV data suggests you need the full protocol tonight. Do not skip this.'
      : 'Consistent evening practice reduces sleep latency by 20–40%.',
    resource: 'https://www.youtube.com/watch?v=pL02HnFAMfk',
    resourceLabel: 'NSDR (Yoga Nidra) — Andrew Huberman',
  });

  // ── Acute anxiety protocol (always present) ────────────
  sessions.push({
    time:     'On Demand — Acute Anxiety Episode',
    icon:     'fa-shield-halved',
    color:    'rose',
    duration: '3 min',
    title:    'Anxiety Interrupt Protocol',
    steps: [
      { time: '30 sec', name: 'Name it',            desc: '"I am experiencing an adrenaline spike. My nervous system is doing its job. This is temporary."' },
      { time: '90 sec', name: 'Physiological Sigh', desc: '5 double-inhale sighs. Fastest known method to lower physiological arousal (Stanford, 2023).' },
      { time: '60 sec', name: '5-4-3-2-1 Grounding', desc: 'Name: 5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste. Forces prefrontal cortex back online.' },
    ],
    notes: 'Bookmark this. Use it the moment you notice the spiral starting — not after it peaks.',
  });

  return { sessions, urgencyScore: Math.round(urgencyScore * 100) };
}
