// ─── Progression Engine ───────────────────────────────────────
// Formula: Level = floor(0.1 * sqrt(total_xp)) + 1
// This gives a satisfying logarithmic curve:
//   Level 2  →   100 XP   (10 habits)
//   Level 3  →   400 XP   (40 habits / 20 anxiety logs)
//   Level 5  →  1600 XP
//   Level 10 →  8100 XP
//   Level 20 → 36100 XP

export function calcLevel(totalXp) {
  const xp    = Math.max(0, totalXp || 0);
  const level = Math.floor(0.1 * Math.sqrt(xp)) + 1;

  // XP boundaries for current and next level
  const xpForLevel  = (lvl) => lvl <= 1 ? 0 : Math.pow((lvl - 1) * 10, 2);
  const current     = xpForLevel(level);
  const next        = xpForLevel(level + 1);
  const progress    = Math.min(100, Math.round(((xp - current) / (next - current)) * 100));
  const xpToNext    = next - xp;

  return { level, progress, xpToNext, xpForNextLevel: next };
}

// RPG rank titles
const RANK_TITLES = [
  { min: 1,   max: 2,   title: 'Initiate',     icon: 'fa-seedling',       color: 'slate'   },
  { min: 3,   max: 4,   title: 'Apprentice',   icon: 'fa-shield-halved',  color: 'sky'     },
  { min: 5,   max: 7,   title: 'Warrior',      icon: 'fa-dumbbell',       color: 'indigo'  },
  { min: 8,   max: 10,  title: 'Champion',     icon: 'fa-trophy',         color: 'amber'   },
  { min: 11,  max: 14,  title: 'Legend',       icon: 'fa-star',           color: 'orange'  },
  { min: 15,  max: 19,  title: 'Titan',        icon: 'fa-bolt',           color: 'purple'  },
  { min: 20,  max: 999, title: 'Transcendent', icon: 'fa-crown',          color: 'rose'    },
];

export function getRankTitle(level) {
  return RANK_TITLES.find((r) => level >= r.min && level <= r.max) || RANK_TITLES[0];
}

// BMI utilities
export function calcBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

export function bmiCategory(bmi) {
  if (!bmi) return null;
  if (bmi < 18.5) return { label: 'Underweight', color: 'sky',     tip: 'Below optimal range' };
  if (bmi < 25)   return { label: 'Optimal',     color: 'emerald', tip: 'Healthy range (18.5–24.9)' };
  if (bmi < 30)   return { label: 'Elevated',    color: 'amber',   tip: 'Above optimal range' };
  return                  { label: 'High',        color: 'red',     tip: 'Significantly above optimal' };
}

export function bmiProgressToTarget(bmi) {
  if (!bmi) return null;
  // Target: 18.5–24.9. Progress = how close to target center (21.7)
  const target = 21.7;
  const diff   = Math.abs(bmi - target);
  // Within 1 point = 90%+, within 5 = ~50%
  const pct    = Math.max(0, Math.min(100, Math.round(100 - (diff / 10) * 100)));
  return pct;
}

// ─── Areas of Improvement Engine ─────────────────────────────
// Analyses last 3 days of habits, sleep, and anxiety data
// Returns an array of insight objects sorted by priority

export function generateInsights({ habits3d, sleep3d, anxietyCounts3d }) {
  const insights = [];

  // ── Sleep deficit ────────────────────────────────────────────
  const lowSleepDays = sleep3d.filter(
    (d) => d.garmin_sleep_score !== null && d.garmin_sleep_score < 60
  ).length;

  if (lowSleepDays >= 2) {
    insights.push({
      priority: 1,
      emoji:    '⚠️',
      type:     'warning',
      area:     'Sleep Deficit Detected',
      message:  'Low sleep spikes baseline cortisol and chemically mimics anxiety symptoms — racing heart, tension, and dread. Your body is tired, not broken. Prioritize 7–8 hours tonight above all else.',
      color:    'amber',
      action:   'Start Zen breathing now',
      section:  'zen',
    });
  }

  // ── No workout 3 days ────────────────────────────────────────
  const noWorkoutDays = habits3d.filter((d) => !d.workout).length;
  if (noWorkoutDays >= 3) {
    insights.push({
      priority: 2,
      emoji:    '💡',
      type:     'nudge',
      area:     'Movement Creates Momentum',
      message:  "You haven't moved in 3 days. Inactivity increases anxiety sensitivity. A 15-minute walk today — just 15 — will regulate your nervous system and protect your streak. You don't need a full session.",
      color:    'indigo',
      action:   'Log a workout',
      section:  'dashboard',
    });
  }

  // ── Anxiety active but no meditation ─────────────────────────
  const anxietyActive   = anxietyCounts3d.reduce((a, b) => a + b, 0) > 0;
  const noMeditationDays = habits3d.filter((d) => !d.meditation).length;

  if (anxietyActive && noMeditationDays >= 2) {
    insights.push({
      priority: 3,
      emoji:    '🧠',
      type:     'focus',
      area:     'Breathing Tools Unused',
      message:  "Your Symptom Vault has been active, but your breathing exercises remain unused. This is the gap anxiety wants. Box breathing directly engages your vagus nerve and interrupts the adrenaline loop within 4 minutes.",
      color:    'purple',
      action:   'Open Box Breathing',
      section:  'zen',
    });
  }

  // ── Eating clean missed ──────────────────────────────────────
  const noEatingCleanDays = habits3d.filter((d) => !d.eating_clean).length;
  if (noEatingCleanDays >= 3) {
    insights.push({
      priority: 4,
      emoji:    '🥗',
      type:     'nudge',
      area:     'Nutrition Gap',
      message:  'Three days without clean eating. High sugar and processed food amplify cortisol and worsen anxiety reactivity. One clean meal today is enough to start reversing the pattern.',
      color:    'emerald',
      action:   null,
      section:  null,
    });
  }

  // ── Smoke free at risk ───────────────────────────────────────
  const smokingDays = habits3d.filter((d) => !d.smoke_free).length;
  if (smokingDays >= 2) {
    insights.push({
      priority: 5,
      emoji:    '🫁',
      type:     'warning',
      area:     'Smoke-Free Streak at Risk',
      message:  'Nicotine raises resting heart rate and mimics anxiety symptoms — exactly the kind of sensation that triggers health anxiety spirals. Your discipline here directly protects your mental clarity.',
      color:    'rose',
      action:   null,
      section:  null,
    });
  }

  // ── All good — reinforcement ─────────────────────────────────
  const allComplete3d = habits3d.every(
    (d) => d.workout && d.meditation && d.studying && d.eating_clean && d.smoke_free
  );
  if (allComplete3d && habits3d.length >= 3) {
    insights.push({
      priority: 0,
      emoji:    '🏆',
      type:     'success',
      area:     'Elite Consistency',
      message:  "Three perfect days. This isn't luck — it's character. Your discipline is actively reshaping your neural pathways. Keep the identity: you are someone who shows up every single day.",
      color:    'emerald',
      action:   null,
      section:  null,
    });
  }

  // Return sorted by priority (lower = more important)
  return insights.sort((a, b) => a.priority - b.priority);
}
