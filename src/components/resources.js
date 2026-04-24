/**
 * Resources & Progress Component
 *
 * Shows:
 *  1. Motivational progress showcase — level, XP, rank, streak
 *  2. 14-day consistency heatmap
 *  3. Milestone badges
 *  4. Personalised YouTube resource recommendations
 */

import { supabase } from '../lib/supabase.js';
import { calcLevel, getRankTitle } from '../lib/progressionEngine.js';

// ─── Short motivational video library (~5–15 min each) ────────
const LIBRARY = [
  {
    id:       'goggins_discipline',
    title:    'David Goggins — Discipline Is The Answer',
    channel:  'David Goggins',
    duration: '8–12 min',
    url:      'https://www.youtube.com/results?search_query=david+goggins+discipline+motivation&sp=EgIYBA%3D%3D',
    icon:     'fa-fire-flame-curved',
    color:    'red',
    tagline:  'The hardest man alive. No excuses.',
    desc:     'Goggins built himself from nothing using callus-your-mind discipline. Every clip cuts through mental weakness and shows you what the human body and mind are actually capable of.',
    topics:   ['Discipline', 'No Excuses', 'Mental Calluses', 'Breaking Limits'],
    triggers: { motivation: 3, consistency_low: 3, workout_low: 2 },
    baseScore: 85,
  },
  {
    id:       'jocko_discipline',
    title:    'Jocko Willink — Discipline Equals Freedom',
    channel:  'Jocko Willink',
    duration: '5–10 min',
    url:      'https://www.youtube.com/results?search_query=jocko+willink+discipline+equals+freedom+short&sp=EgIYBA%3D%3D',
    icon:     'fa-crosshairs',
    color:    'slate',
    tagline:  'Navy SEAL commander on ownership & control.',
    desc:     "Jocko's core thesis: discipline is the path to freedom, not its enemy. Former SEAL commander, no nonsense. Every clip is a direct injection of accountability and hard ownership.",
    topics:   ['Ownership', 'Military Discipline', 'No Excuses', 'Leadership'],
    triggers: { consistency_low: 3, motivation: 2, workout_low: 2 },
    baseScore: 80,
  },
  {
    id:       'eric_thomas',
    title:    'Eric Thomas — How Bad Do You Want It',
    channel:  'Eric Thomas',
    duration: '5–10 min',
    url:      'https://www.youtube.com/results?search_query=eric+thomas+how+bad+do+you+want+success&sp=EgIYBA%3D%3D',
    icon:     'fa-bullseye',
    color:    'orange',
    tagline:  'When you want it as bad as you want to breathe.',
    desc:     "ET the Hip-Hop Preacher turned sleeping under a bridge into a PhD. His energy is unmatched. Best for the moments when you want to quit — 8 minutes of this will reset your entire mindset.",
    topics:   ['Hunger', 'Sacrifice', 'Commitment', 'No Quit'],
    triggers: { motivation: 5, consistency_low: 4 },
    baseScore: 80,
  },
  {
    id:       'mcraven_bed',
    title:    'Admiral McRaven — Make Your Bed',
    channel:  'UT Austin',
    duration: '~10 min',
    url:      'https://www.youtube.com/results?search_query=admiral+mcraven+make+your+bed+short&sp=EgIYBA%3D%3D',
    icon:     'fa-star',
    color:    'sky',
    tagline:  '10 lessons from SEAL training that change everything.',
    desc:     "Commander of the Navy SEALs delivers one of the most shared speeches in history. Starts with making your bed — a small win that sets the tone for the entire day. Pure discipline in 10 minutes.",
    topics:   ['Small Wins First', 'Never Quit', 'Team Matters', 'Change The World'],
    triggers: { motivation: 3, consistency_low: 2, beginner: 3 },
    baseScore: 75,
  },
  {
    id:       'denzel_fall',
    title:    'Denzel Washington — Fall Forward',
    channel:  'Denzel Washington',
    duration: '~12 min',
    url:      'https://www.youtube.com/results?search_query=denzel+washington+fall+forward+motivation&sp=EgIYBA%3D%3D',
    icon:     'fa-person-falling-burst',
    color:    'amber',
    tagline:  'Fall forward, not backward.',
    desc:     "Denzel doesn't talk about talent — he talks about failure, showing up, and what happens when you fall in the right direction. One of the most grounded pieces of advice ever put on a stage.",
    topics:   ['Failure = Progress', 'Work Ethic', 'Purpose', 'Faith'],
    triggers: { motivation: 3, consistency_low: 2 },
    baseScore: 70,
  },
  {
    id:       'jordan_peterson',
    title:    'Jordan Peterson — Sort Yourself Out',
    channel:  'Jordan B Peterson',
    duration: '5–15 min',
    url:      'https://www.youtube.com/results?search_query=jordan+peterson+sort+yourself+out+motivation+short&sp=EgIYBA%3D%3D',
    icon:     'fa-brain',
    color:    'indigo',
    tagline:  'Clean your room. Fix your life.',
    desc:     "Peterson on responsibility, order from chaos, and why you fix the small things around you first. Directly applicable when anxiety or overwhelm is making the big picture impossible to face.",
    topics:   ['Order vs Chaos', 'Responsibility', 'Self-Mastery', 'Small Steps'],
    triggers: { anxiety: 3, motivation: 2, consistency_low: 2 },
    baseScore: 70,
  },
  {
    id:       'kobe_mamba',
    title:    'Kobe Bryant — Mamba Mentality',
    channel:  'Kobe Bryant',
    duration: '5–10 min',
    url:      'https://www.youtube.com/results?search_query=kobe+bryant+mamba+mentality+short+motivation&sp=EgIYBA%3D%3D',
    icon:     'fa-basketball',
    color:    'purple',
    tagline:  '4AM. Every day. No days off.',
    desc:     "Kobe's relentless work ethic is legendary not for talent, but for obsessive consistency. Every clip shows what happens when you out-prepare everyone else while they sleep.",
    topics:   ['Obsessive Preparation', 'No Days Off', 'Competitive Edge', '4AM Mentality'],
    triggers: { workout_low: 3, consistency_low: 3, performance: 3 },
    baseScore: 75,
  },
  {
    id:       'huberman_anxiety',
    title:    'Huberman Lab — Stop Anxiety Now (Breathing Tool)',
    channel:  'Huberman Lab',
    duration: '5–15 min',
    url:      'https://www.youtube.com/results?search_query=huberman+lab+anxiety+breathing+tool+short&sp=EgIYBA%3D%3D',
    icon:     'fa-lungs',
    color:    'teal',
    tagline:  'Neuroscience protocol — works within minutes.',
    desc:     "Huberman's short clips deliver actionable science to manage anxiety in real time — the physiological sigh, double nasal inhale, and other tools proven to calm your nervous system within 60 seconds.",
    topics:   ['Physiological Sigh', 'Breathing Tools', 'Nervous System', 'Immediate Calm'],
    triggers: { anxiety: 5, stress: 4, health_anxiety: 4 },
    baseScore: 75,
  },
  {
    id:       'wimhof_breathing',
    title:    'Wim Hof — Breathing Technique (Guided)',
    channel:  'Wim Hof',
    duration: '~10 min',
    url:      'https://www.youtube.com/results?search_query=wim+hof+breathing+technique+guided+tutorial&sp=EgIYBA%3D%3D',
    icon:     'fa-wind',
    color:    'cyan',
    tagline:  'Control your breath. Control your mind.',
    desc:     "The Iceman walks you through his breathing method in one short session. Proven to lower cortisol, reduce anxiety, and shift your mood within a single practice. Do this once and you'll feel it.",
    topics:   ['Breathwork', 'Cortisol Control', 'Stress Response', 'Immediate Effect'],
    triggers: { anxiety: 4, stress: 3, meditation: 3 },
    baseScore: 70,
  },
  {
    id:       'ct_fletcher',
    title:    'CT Fletcher — Command Your Body',
    channel:  'CT Fletcher',
    duration: '5–10 min',
    url:      'https://www.youtube.com/results?search_query=ct+fletcher+motivation+short+gym&sp=EgIYBA%3D%3D',
    icon:     'fa-dumbbell',
    color:    'emerald',
    tagline:  '7x world champion. Iron discipline. Zero mercy.',
    desc:     "CT Fletcher — 7x world strictcurl champion and powerlifting legend. Raw, unfiltered energy about commanding your body to do what your mind tells it. The definition of iron will in short clips.",
    topics:   ['Iron Will', 'Command Your Body', 'Gym Mentality', 'Mental Strength'],
    triggers: { workout_low: 4, fitness: 3, motivation: 3 },
    baseScore: 65,
  },
];

// ─── Learning protocol video library ─────────────────────────
// Personalized by anxietyCount and workoutCount via priority()
const LEARNING_LIBRARY = [
  {
    id:       'cbt_health_anxiety',
    title:    'CBT for Health Anxiety — Step by Step',
    channel:  'Therapy in a Nutshell',
    duration: '10–15 min',
    url:      'https://www.youtube.com/results?search_query=therapy+in+a+nutshell+health+anxiety+CBT+techniques&sp=EgIYBA%3D%3D',
    icon:     'fa-heart-pulse',
    color:    'rose',
    tagline:  'Emma McAdam — licensed therapist, clinical CBT.',
    desc:     'Step-by-step CBT protocol for health anxiety: how catastrophic health thoughts form, why reassurance-seeking makes anxiety worse, and the exact cognitive restructuring steps to interrupt the cycle permanently.',
    topics:   ['Health Anxiety', 'CBT Protocol', 'Reassurance Traps', 'Thought Restructuring'],
    priority: (a) => a >= 1 ? 100 : 60,
  },
  {
    id:       'panic_clinical',
    title:    'Stop a Panic Attack — Clinical Protocol',
    channel:  'Therapy in a Nutshell',
    duration: '8–12 min',
    url:      'https://www.youtube.com/results?search_query=therapy+in+a+nutshell+how+to+stop+panic+attack&sp=EgIYBA%3D%3D',
    icon:     'fa-heart-crack',
    color:    'red',
    tagline:  'Physiology + evidence-based interruption technique.',
    desc:     'Explains exactly what happens in your body during a panic attack — and why it feels like danger but isn\'t. Covers grounding, interoceptive exposure, and cognitive defusion to interrupt the spiral mid-way.',
    topics:   ['Panic Disorder', 'Grounding Technique', 'Interoceptive Exposure', 'Anxiety Cycle'],
    priority: (a) => a >= 2 ? 95 : 55,
  },
  {
    id:       'claire_weekes',
    title:    'Dr. Claire Weekes — Float Through Anxiety',
    channel:  'Anxiety Recovery',
    duration: '8–15 min',
    url:      'https://www.youtube.com/results?search_query=claire+weekes+accept+float+anxiety+recovery&sp=EgIYBA%3D%3D',
    icon:     'fa-water',
    color:    'sky',
    tagline:  'Accept, float, let time pass. The original anxiety cure.',
    desc:     'Dr. Claire Weekes pioneered the acceptance method for anxiety — the insight that fighting the sensations is what maintains them. Float rather than resist. This approach specifically targets the "fear of fear" that keeps health anxiety alive.',
    topics:   ['Acceptance Method', 'Fear of Fear', 'Float Protocol', 'Recovery Mindset'],
    priority: (a) => a >= 1 ? 90 : 50,
  },
  {
    id:       'ocd_erp',
    title:    'ERP for OCD & Health OCD — Gold Standard Protocol',
    channel:  'NOCD Therapy',
    duration: '10–15 min',
    url:      'https://www.youtube.com/results?search_query=ERP+exposure+response+prevention+OCD+health+anxiety+protocol&sp=EgIYBA%3D%3D',
    icon:     'fa-arrows-spin',
    color:    'violet',
    tagline:  'The only evidence-based OCD treatment that works.',
    desc:     'ERP (Exposure and Response Prevention) is the gold-standard for OCD and health OCD. You face the feared situation, resist the compulsion, and the anxiety falls on its own — because it always does. This video teaches you the exact framework.',
    topics:   ['ERP Protocol', 'OCD Loops', 'Compulsion Breaking', 'Habituation Science'],
    priority: (a) => a >= 3 ? 85 : 40,
  },
  {
    id:       'vagus_nerve',
    title:    'Vagus Nerve Reset — Activate Your Calm System',
    channel:  'Huberman Lab',
    duration: '10–15 min',
    url:      'https://www.youtube.com/results?search_query=huberman+lab+vagus+nerve+calm+anxiety+breathing&sp=EgIYBA%3D%3D',
    icon:     'fa-network-wired',
    color:    'teal',
    tagline:  'Neuroscience-backed off-switch for the stress response.',
    desc:     'Huberman explains the vagus nerve pathway and how specific breathing patterns, cold exposure, and humming directly stimulate it — activating your parasympathetic nervous system and physically switching off the anxiety response.',
    topics:   ['Vagus Nerve', 'Parasympathetic Switch', 'Breathing Protocol', 'Cold Exposure'],
    priority: () => 80,
  },
  {
    id:       'cognitive_defusion',
    title:    'Cognitive Defusion — Stop Believing Anxious Thoughts',
    channel:  'Kati Morton',
    duration: '8–12 min',
    url:      'https://www.youtube.com/results?search_query=cognitive+defusion+ACT+therapy+anxious+thoughts&sp=EgIYBA%3D%3D',
    icon:     'fa-comment-slash',
    color:    'pink',
    tagline:  'ACT therapy — you are not your thoughts.',
    desc:     'Cognitive defusion from ACT (Acceptance & Commitment Therapy) trains you to see thoughts as just words, not facts. Critical for health anxiety, where the mind treats "I might be sick" as a truth requiring immediate investigation.',
    topics:   ['ACT Technique', 'Thought Defusion', 'Observer Self', 'Mindful Distance'],
    priority: (a) => a >= 1 ? 78 : 45,
  },
  {
    id:       'exercise_mental_health',
    title:    'Exercise Is Medicine — Anxiety & Depression Science',
    channel:  'Huberman Lab',
    duration: '10–15 min',
    url:      'https://www.youtube.com/results?search_query=exercise+mental+health+anxiety+depression+neuroscience&sp=EgIYBA%3D%3D',
    icon:     'fa-dumbbell',
    color:    'emerald',
    tagline:  'Your workout is literally a prescription drug.',
    desc:     'The neuroscience of why exercise is clinically equivalent to SSRIs for mild-moderate anxiety and depression. Covers BDNF, serotonin upregulation, cortisol clearance, and why skipping workouts specifically worsens anxiety sensitivity.',
    topics:   ['Exercise & Anxiety', 'BDNF & Brain', 'Cortisol Reset', 'Workout as Treatment'],
    priority: (a, w) => w < 3 ? 88 : 65,
  },
  {
    id:       'sleep_anxiety',
    title:    'Sleep & Anxiety — Breaking the Two-Way Trap',
    channel:  'Matthew Walker',
    duration: '8–12 min',
    url:      'https://www.youtube.com/results?search_query=matthew+walker+sleep+anxiety+depression+short&sp=EgIYBA%3D%3D',
    icon:     'fa-moon',
    color:    'indigo',
    tagline:  'Why poor sleep creates anxiety, and how to fix it.',
    desc:     "Sleep scientist Matthew Walker explains the bidirectional trap: anxiety disrupts sleep, poor sleep amplifies anxiety sensitivity the next day. Covers the neuroscience and practical protocols to break out — no sleeping pills required.",
    topics:   ['Sleep & Anxiety Link', 'REM & Emotional Regulation', 'Sleep Protocol', 'Wind-Down Routine'],
    priority: () => 70,
  },
];

// ─── Interest keys → learning protocol IDs (for boosting) ────
const INTEREST_BOOST_MAP = {
  anxiety:    ['cbt_health_anxiety', 'panic_clinical', 'claire_weekes', 'ocd_erp', 'vagus_nerve', 'cognitive_defusion'],
  fitness:    ['exercise_mental_health'],
  breathing:  ['vagus_nerve'],
  sleep:      ['sleep_anxiety'],
  mindset:    ['cognitive_defusion', 'exercise_mental_health'],
  journaling: ['cognitive_defusion'],
};

// ─── Vice-specific educational content ────────────────────────
const VICE_LIBRARY = {
  smoking: [{
    id: 'quit_smoking', title: 'How to Quit Smoking — Science-Backed Guide',
    channel: 'Huberman Lab', duration: '10–15 min',
    url: 'https://www.youtube.com/results?search_query=how+to+quit+smoking+science+brain+nicotine&sp=EgIYBA%3D%3D',
    icon: 'fa-ban', color: 'red', tagline: 'Nicotine, dopamine, and how to escape.',
    desc: 'The neuroscience of nicotine addiction — why quitting is hard, the withdrawal timeline, and exactly what works. No motivation speeches — just the brain science and a clear action plan.',
    topics: ['Nicotine Withdrawal', 'Dopamine Reset', 'Quit Protocol', 'Timeline'],
  }],
  alcohol: [{
    id: 'quit_alcohol', title: 'Alcohol & Your Brain — What Really Happens',
    channel: 'Huberman Lab', duration: '8–12 min',
    url: 'https://www.youtube.com/results?search_query=huberman+lab+alcohol+effects+brain+quit&sp=EgIYBA%3D%3D',
    icon: 'fa-droplet-slash', color: 'amber', tagline: 'Why "moderate drinking" is a myth.',
    desc: "Huberman's neuroscience breakdown: alcohol disrupts sleep architecture, raises anxiety the following day, and hijacks dopamine in ways that demand escalation. Practical reduction protocol included.",
    topics: ['Alcohol & Anxiety', 'Sleep Disruption', 'Dopamine Hijack', 'Reduction Plan'],
  }],
  gambling: [{
    id: 'quit_gambling', title: 'Gambling Addiction — Breaking the Loop',
    channel: 'Therapy in a Nutshell', duration: '8–12 min',
    url: 'https://www.youtube.com/results?search_query=how+to+stop+gambling+addiction+psychology&sp=EgIYBA%3D%3D',
    icon: 'fa-dice', color: 'orange', tagline: 'Variable reward is the trap. Here\'s the exit.',
    desc: 'CBT approach to gambling: why variable reward schedules are more addictive than fixed ones, why losses feel recoverable, and practical strategies to break reinforcement loops.',
    topics: ['Variable Reward', 'CBT Approach', 'Impulse Control', 'Relapse Prevention'],
  }],
  junk_food: [{
    id: 'quit_junk', title: 'Ultra-Processed Food — How to Reset Your Taste',
    channel: 'Dr. Robert Lustig', duration: '8–12 min',
    url: 'https://www.youtube.com/results?search_query=ultra+processed+food+addiction+quit+science&sp=EgIYBA%3D%3D',
    icon: 'fa-burger', color: 'yellow', tagline: 'Why willpower always fails against junk food.',
    desc: 'Ultra-processed food hijacks dopamine pathways more than cocaine in animal studies. Covers the brain science, why willpower is the wrong tool, and how dietary reset actually works.',
    topics: ['Food Dopamine', 'Sugar Science', 'Dietary Reset', 'Brain Chemistry'],
  }],
  social_media: [{
    id: 'screen_limit', title: 'Digital Minimalism — Reclaim Your Attention',
    channel: 'Cal Newport', duration: '10–15 min',
    url: 'https://www.youtube.com/results?search_query=cal+newport+digital+minimalism+quit+social+media&sp=EgIYBA%3D%3D',
    icon: 'fa-mobile-screen-button', color: 'slate', tagline: 'Your attention is a resource. Protect it.',
    desc: 'Why social media apps are designed to exploit psychological vulnerabilities, why most limit attempts fail, and the 30-day digital detox that actually changes your relationship with screens.',
    topics: ['Attention Economy', '30-Day Detox', 'Deep Work', 'Screen Habits'],
  }],
};

// ─── Motivational messages (must match getRankTitle() titles) ─
const RANK_MOTIVATIONS = {
  Initiate:     "Every legend starts exactly here. The fact that you're tracking means you're already ahead of 90% of people.",
  Apprentice:   "Momentum is building. Consistency compounds. The version of you in 90 days will be unrecognisable.",
  Warrior:      "You've proven you can start. Now prove you can sustain. Warriors aren't born — they're forged through repetition.",
  Champion:     "You're in rare company. Most people quit before reaching this level. This is where real transformation lives.",
  Legend:       "Your habits are becoming part of your identity. You're not just doing the work — you ARE the work.",
  Titan:        "Elite tier. Your discipline is no longer willpower — it's a system. Protect it like the asset it is.",
  Transcendent: "You've built something most people only dream about. Your only opponent now is the ceiling you set.",
};

// ─── Render ───────────────────────────────────────────────────
export function renderResources() {
  return `
    <div id="resources-section" class="space-y-5 animate-slide-up">

      <!-- Progress hero -->
      <div id="progress-hero" class="relative overflow-hidden bg-gradient-to-br from-indigo-900/50 to-navy-700 rounded-2xl border border-indigo-500/20 p-5">
        <div class="flex items-center justify-center py-4">
          <i class="fa-solid fa-circle-notch fa-spin text-indigo-400 text-xl"></i>
        </div>
      </div>

      <!-- Consistency heatmap -->
      <div class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-white font-semibold flex items-center gap-2">
            <i class="fa-solid fa-fire text-amber-400"></i>
            14-Day Consistency
          </h3>
          <span id="consistency-pct" class="text-slate-500 text-sm"></span>
        </div>
        <div id="heatmap-grid" class="flex gap-1.5 flex-wrap">
          ${Array.from({ length: 14 }, (_, i) => `
            <div class="heatmap-day w-8 h-8 rounded-lg bg-slate-700/50 border border-slate-700/30 flex items-center justify-center"
              data-day="${i}" title="Loading...">
              <span class="text-slate-600 text-xs">${14 - i}</span>
            </div>`).join('')}
        </div>
        <div id="heatmap-legend" class="flex items-center gap-3 mt-3 text-xs text-slate-600">
          <div class="flex items-center gap-1"><div class="w-3 h-3 rounded bg-slate-700"></div><span>0%</span></div>
          <div class="flex items-center gap-1"><div class="w-3 h-3 rounded bg-amber-600/50"></div><span>≤40%</span></div>
          <div class="flex items-center gap-1"><div class="w-3 h-3 rounded bg-indigo-500/60"></div><span>≤80%</span></div>
          <div class="flex items-center gap-1"><div class="w-3 h-3 rounded bg-emerald-500"></div><span>100%</span></div>
        </div>
      </div>

      <!-- Milestones -->
      <div id="milestones-section" class="bg-navy-600 rounded-2xl border border-slate-700/50 p-5">
        <h3 class="text-white font-semibold flex items-center gap-2 mb-4">
          <i class="fa-solid fa-trophy text-amber-400"></i>
          Milestone Badges
        </h3>
        <div id="milestones-grid" class="grid grid-cols-3 gap-2">
          <div class="flex items-center justify-center py-3 col-span-3">
            <i class="fa-solid fa-circle-notch fa-spin text-slate-500 text-sm"></i>
          </div>
        </div>
      </div>

      <!-- Learning Protocols -->
      <div>
        <div class="flex items-center gap-2 px-1 mb-2">
          <i class="fa-solid fa-graduation-cap text-sky-400 text-lg"></i>
          <h3 class="text-white font-bold text-lg">Learning Protocols</h3>
        </div>
        <p id="learning-context" class="text-slate-400 text-xs px-1 mb-4 leading-relaxed">Clinical techniques and science — ranked by what's most relevant to you right now.</p>
        <div id="learning-grid" class="space-y-4">
          <p class="text-slate-600 text-sm text-center py-4">Loading protocols…</p>
        </div>
      </div>

      <!-- Short Motivation Videos -->
      <div>
        <div class="flex items-center gap-2 px-1 mb-4">
          <i class="fa-brands fa-youtube text-red-500 text-lg"></i>
          <h3 class="text-white font-bold text-lg">Short Motivation Videos</h3>
        </div>
        <p id="resources-context" class="text-slate-400 text-xs px-1 mb-4 leading-relaxed"></p>
        <div id="resources-grid" class="space-y-4">
          <p class="text-slate-600 text-sm text-center py-4">Loading videos…</p>
        </div>
      </div>

    </div>
  `;
}

// ─── Init ─────────────────────────────────────────────────────
export async function initResources(userId, userProfile, authUser = null) {
  try {
    const days14Ago = new Date(Date.now() - 13 * 864e5).toISOString().split('T')[0];
    const days30Ago = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];

    // Load all data in parallel — allSettled so one failure doesn't block others
    const [habitsRes, anxietyRes, workoutsRes] = await Promise.allSettled([
      supabase.from('habits').select('*').eq('user_id', userId).gte('date', days14Ago).order('date', { ascending: true }),
      supabase.from('anxiety_vault').select('id').eq('user_id', userId).gte('created_at', days30Ago),
      supabase.from('workout_logs').select('id').eq('user_id', userId).gte('date', days14Ago),
    ]);

    const habits14     = habitsRes.status   === 'fulfilled' ? (habitsRes.value.data   || []) : [];
    const anxietyCount = anxietyRes.status  === 'fulfilled' ? (anxietyRes.value.data?.length  || 0) : 0;
    const workoutCount = workoutsRes.status === 'fulfilled' ? (workoutsRes.value.data?.length || 0) : 0;

    const profile = userProfile || {};

    renderProgressHero(profile, authUser);
    renderHeatmap(habits14, profile);
    renderMilestones(profile, habits14, anxietyCount);
    renderLearningSection(habits14, anxietyCount, workoutCount, profile);
    renderResourceCards(profile, habits14, anxietyCount, workoutCount);

  } catch (err) {
    console.error('[Resources] Init failed:', err);

    // Ensure no section stays stuck in a spinner state
    const hero = document.getElementById('progress-hero');
    if (hero) hero.innerHTML = `
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-user text-slate-500 text-lg"></i>
        </div>
        <div>
          <p class="text-white font-bold text-lg">Your Journey</p>
          <p class="text-slate-500 text-sm mt-1">Start logging habits to see your progress here.</p>
        </div>
      </div>`;

    const milestonesGrid = document.getElementById('milestones-grid');
    if (milestonesGrid) milestonesGrid.innerHTML =
      '<p class="text-slate-600 text-sm text-center col-span-3 py-4">Log habits to unlock badges.</p>';

    // Still render both video sections — they're static and don't need DB data
    const profile = userProfile || {};
    renderLearningSection([], 0, 0, profile);
    renderResourceCards(profile, [], 0, 0);
  }
}

// ─── Name extraction helpers ──────────────────────────────────
function _extractFirstName(authUser) {
  const fullName = authUser?.user_metadata?.full_name;
  if (fullName) return fullName.split(' ')[0] || 'Warrior';
  const email = authUser?.email || '';
  const local = email.split('@')[0];
  const parts = local.split(/[._\-+]/);
  const first = parts[0] || 'Warrior';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function _extractInitials(authUser) {
  const fullName = authUser?.user_metadata?.full_name;
  if (fullName) {
    return fullName.split(' ').map(n => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || '?';
  }
  const email = authUser?.email || '';
  const local = email.split('@')[0];
  const parts = local.split(/[._\-+]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase() || '?';
}

// ─── Progress hero ────────────────────────────────────────────
function renderProgressHero(profile, authUser = null) {
  const hero = document.getElementById('progress-hero');
  if (!hero) return;

  const xp         = profile.total_xp    || 0;
  const level      = profile.current_level || 1;
  const streak     = profile.streak_days  || 0;
  const { progress, xpToNext } = calcLevel(xp);
  const rank       = getRankTitle(level);
  const motivation = RANK_MOTIVATIONS[rank.title] || RANK_MOTIVATIONS.Initiate;

  const avatarUrl  = authUser?.user_metadata?.avatar_url;
  const firstName  = _extractFirstName(authUser);
  const initials   = _extractInitials(authUser);

  const avatarEl = avatarUrl
    ? `<img src="${avatarUrl}" alt="${firstName}"
            class="w-full h-full object-cover"
            referrerpolicy="no-referrer"
            onerror="this.parentElement.innerHTML='<span class=\\'text-${rank.color}-300 font-bold text-xl\\'>${initials}</span>'" />`
    : `<span class="text-${rank.color}-300 font-bold text-xl">${initials}</span>`;

  const streakEl = streak >= 3
    ? `<div class="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg px-2.5 py-1">
         <i class="fa-solid fa-fire text-amber-400 text-xs"></i>
         <span class="text-amber-300 text-xs font-semibold">${streak}-day streak</span>
       </div>`
    : `<span class="text-slate-500 text-xs">Start your streak today →</span>`;

  hero.innerHTML = `
    <!-- Rank constellation background -->
    <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 220"
         preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="heroGlow" cx="85%" cy="20%">
          <stop offset="0%" stop-color="currentColor" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Glow orb top-right in rank color -->
      <circle cx="360" cy="30" r="90" fill="#6366f1" opacity="0.1"/>
      <!-- Stars -->
      <circle cx="20"  cy="15" r="1.2" fill="#e0e7ff" opacity="0.35"/>
      <circle cx="70"  cy="8"  r="0.9" fill="#c7d2fe" opacity="0.3"/>
      <circle cx="140" cy="18" r="1.4" fill="#e0e7ff" opacity="0.3"/>
      <circle cx="210" cy="10" r="0.9" fill="#c7d2fe" opacity="0.25"/>
      <circle cx="290" cy="20" r="1.2" fill="#e0e7ff" opacity="0.3"/>
      <circle cx="370" cy="8"  r="0.9" fill="#c7d2fe" opacity="0.25"/>
      <circle cx="40"  cy="190" r="1"  fill="#e0e7ff" opacity="0.2"/>
      <circle cx="380" cy="195" r="1"  fill="#c7d2fe" opacity="0.2"/>
      <!-- Subtle geometric diamond at top-right -->
      <path d="M360,5 L375,20 L360,35 L345,20 Z" fill="#6366f1" opacity="0.08"/>
      <path d="M360,10 L370,20 L360,30 L350,20 Z" fill="#818cf8" opacity="0.1"/>
      <!-- Faint constellation lines -->
      <line x1="20"  y1="15" x2="70"  y2="8"  stroke="#6366f1" stroke-width="0.4" opacity="0.1"/>
      <line x1="70"  y1="8"  x2="140" y2="18" stroke="#6366f1" stroke-width="0.4" opacity="0.1"/>
      <line x1="210" y1="10" x2="290" y2="20" stroke="#6366f1" stroke-width="0.4" opacity="0.1"/>
    </svg>

    <div class="flex items-start gap-4 mb-5 relative">

      <!-- Avatar with rank ring -->
      <div class="relative flex-shrink-0">
        <div class="w-16 h-16 rounded-full border-2 border-${rank.color}-500/60
                    overflow-hidden bg-${rank.color}-500/10 flex items-center justify-center">
          ${avatarEl}
        </div>
        <!-- Rank icon badge -->
        <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full
                    bg-navy-800 border border-${rank.color}-500/50
                    flex items-center justify-center">
          <i class="fa-solid ${rank.icon} text-${rank.color}-400 text-xs"></i>
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-slate-400 text-xs mb-0.5">Keep going, ${firstName}</p>
        <div class="flex items-center gap-2 flex-wrap mb-1">
          <span class="text-white font-bold text-lg leading-none">${rank.title}</span>
          <span class="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full font-semibold">Lv.${level}</span>
        </div>
        <p class="text-slate-400 text-sm font-medium">${xp.toLocaleString()} XP</p>
        <div class="flex items-center gap-2 mt-1.5">
          ${streakEl}
        </div>
      </div>
    </div>

    <!-- XP Progress bar -->
    <div class="mb-4 relative">
      <div class="flex justify-between text-xs mb-1.5">
        <span class="text-slate-500">Level ${level} → ${level + 1}</span>
        <span class="text-indigo-400 font-medium">${xpToNext} XP to go</span>
      </div>
      <div class="h-2.5 bg-slate-700 rounded-full overflow-hidden">
        <div class="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-500 transition-all duration-700"
          style="width: ${progress}%"></div>
      </div>
      <p class="text-slate-600 text-xs mt-1 text-right">${Math.round(progress)}% to next level</p>
    </div>

    <!-- Motivation quote -->
    <div class="relative bg-slate-800/60 rounded-xl p-3.5 border-l-2 border-${rank.color}-500/50">
      <p class="text-slate-300 text-xs leading-relaxed italic">"${motivation}"</p>
    </div>
  `;
}

// ─── Consistency heatmap ──────────────────────────────────────
function renderHeatmap(habits14, profile = {}) {
  const grid    = document.getElementById('heatmap-grid');
  const pctEl   = document.getElementById('consistency-pct');
  if (!grid) return;

  // Only count the 5th (vice) habit if the user actually has a vice set
  const hasVice = Array.isArray(profile.vices) && profile.vices.length > 0;
  const FIELDS  = hasVice
    ? ['studying', 'workout', 'eating_clean', 'meditation', 'smoke_free']
    : ['studying', 'workout', 'eating_clean', 'meditation'];
  const today   = new Date();

  // Build lookup by date string
  const byDate = {};
  habits14.forEach((h) => { byDate[h.date] = h; });

  let totalPct = 0;
  let totalDays = 0;

  const tiles = Array.from({ length: 14 }, (_, i) => {
    const d     = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    const dateStr = d.toISOString().split('T')[0];
    const h     = byDate[dateStr];
    const isToday = dateStr === today.toISOString().split('T')[0];

    let completed = 0;
    if (h) {
      FIELDS.forEach((f) => { if (h[f]) completed++; });
    }
    const pct = h ? completed / FIELDS.length : 0;
    totalPct += pct;
    totalDays++;

    const color = pct === 0
      ? 'bg-slate-700/50 border-slate-700/30'
      : pct <= 0.4
      ? 'bg-amber-600/40 border-amber-600/20'
      : pct <= 0.8
      ? 'bg-indigo-500/50 border-indigo-500/20'
      : 'bg-emerald-500/80 border-emerald-500/40';

    const label = isToday ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });

    return `
      <div class="relative group w-8 h-8 rounded-lg ${color} border flex items-center justify-center ${isToday ? 'ring-2 ring-white/30' : ''}
                  cursor-default transition-all duration-200">
        <span class="text-white/60 text-xs font-medium">${completed || (h ? '0' : '')}</span>
        <!-- Tooltip -->
        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 border border-slate-700
                    rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
          ${label}: ${h ? `${completed}/${FIELDS.length}` : 'No data'}
        </div>
      </div>`;
  });

  grid.innerHTML = tiles.join('');

  const avgPct = totalDays > 0 ? Math.round((totalPct / totalDays) * 100) : 0;
  if (pctEl) {
    const color = avgPct >= 75 ? 'emerald' : avgPct >= 50 ? 'indigo' : 'amber';
    pctEl.innerHTML = `<span class="text-${color}-400 font-semibold">${avgPct}% average</span>`;
  }
}

// ─── Milestones ───────────────────────────────────────────────
const MILESTONES = [
  { id: 'first_log',    icon: 'fa-flag',           color: 'indigo',  label: 'First Step',    desc: 'Logged your first habit',          check: (p, h) => h.length > 0 },
  { id: 'streak3',      icon: 'fa-fire',            color: 'amber',   label: '3-Day Streak',  desc: '3 consecutive days tracked',       check: (p) => (p.streak_days || 0) >= 3 },
  { id: 'streak7',      icon: 'fa-fire-flame-curved',color: 'orange', label: 'Week Warrior',  desc: '7-day streak achieved',            check: (p) => (p.streak_days || 0) >= 7 },
  { id: 'streak30',     icon: 'fa-crown',           color: 'yellow',  label: '30-Day Iron',   desc: '30 consecutive days — elite',      check: (p) => (p.streak_days || 0) >= 30 },
  { id: 'xp500',        icon: 'fa-star',            color: 'sky',     label: '500 XP',        desc: 'Earned 500 total XP',              check: (p) => (p.total_xp || 0) >= 500 },
  { id: 'xp1000',       icon: 'fa-star',            color: 'indigo',  label: '1,000 XP',      desc: 'Crossed 1,000 XP — Level milestone',check: (p) => (p.total_xp || 0) >= 1000 },
  { id: 'xp5000',       icon: 'fa-gem',             color: 'violet',  label: '5,000 XP',      desc: 'Elite XP threshold',              check: (p) => (p.total_xp || 0) >= 5000 },
  { id: 'lvl5',         icon: 'fa-shield-halved',   color: 'emerald', label: 'Level 5',       desc: 'Reached Level 5 — Guardian',      check: (p) => (p.current_level || 1) >= 5 },
  { id: 'lvl10',        icon: 'fa-award',           color: 'rose',    label: 'Level 10',      desc: 'Level 10 — Champion rank',        check: (p) => (p.current_level || 1) >= 10 },
];

function renderMilestones(profile, habits14, anxietyCount) {
  const grid = document.getElementById('milestones-grid');
  if (!grid) return;

  const tiles = MILESTONES.map((m) => {
    const earned = m.check(profile, habits14, anxietyCount);
    return `
      <div class="flex flex-col items-center gap-1.5 p-2.5 rounded-xl ${earned ? `bg-${m.color}-500/15 border border-${m.color}-500/30` : 'bg-slate-800/30 border border-slate-700/20'}">
        <div class="w-9 h-9 rounded-xl ${earned ? `bg-${m.color}-500/30` : 'bg-slate-700/50'} flex items-center justify-center">
          <i class="fa-solid ${m.icon} text-sm ${earned ? `text-${m.color}-400` : 'text-slate-600'}"></i>
        </div>
        <p class="text-xs font-semibold text-center leading-tight ${earned ? 'text-white' : 'text-slate-600'}">${m.label}</p>
        ${earned ? `<div class="w-1.5 h-1.5 rounded-full bg-${m.color}-400"></div>` : `<div class="w-1.5 h-1.5 rounded-full bg-slate-700"></div>`}
      </div>`;
  });

  grid.innerHTML = tiles.join('');
}

// ─── Resource personalisation ─────────────────────────────────
function scoreResources(profile, habits14, anxietyCount, workoutCount) {
  const level    = profile.current_level || 1;
  const bmi      = profile.current_bmi || profile.initial_bmi || 22;

  const FIELDS   = ['studying', 'workout', 'eating_clean', 'meditation', 'smoke_free'];
  let totalDone  = 0, totalPossible = 0;
  let workoutDone = 0;

  habits14.forEach((h) => {
    FIELDS.forEach((f) => { if (h[f]) totalDone++; });
    if (h.workout) workoutDone++;
    totalPossible += FIELDS.length;
  });

  const consistencyRate = totalPossible > 0 ? totalDone / totalPossible : 0;
  const workoutRate     = habits14.length > 0 ? workoutDone / habits14.length : 0;

  const signals = {
    anxiety:          anxietyCount >= 3,
    health_anxiety:   anxietyCount >= 5,
    stress:           anxietyCount >= 2,
    consistency_low:  consistencyRate < 0.5,
    motivation:       consistencyRate < 0.4,
    workout_low:      workoutRate < 0.3,
    fitness:          true,
    sleep:            true,
    performance:      level >= 5,
    advanced:         level >= 7,
    beginner:         level < 3,
    bmi_high:         bmi > 26,
    nutrition:        bmi > 24 || bmi < 19,
    meditation:       true,
  };

  return LIBRARY
    .map((r) => {
      let score = r.baseScore;
      Object.entries(r.triggers).forEach(([trigger, weight]) => {
        if (signals[trigger]) score += weight * 10;
      });
      return { ...r, score };
    })
    .sort((a, b) => b.score - a.score);
}

function renderResourceCards(profile, habits14, anxietyCount, workoutCount) {
  const grid    = document.getElementById('resources-grid');
  const ctxEl   = document.getElementById('resources-context');
  if (!grid) return;

  const ranked = scoreResources(profile, habits14, anxietyCount, workoutCount);

  // Context blurb
  if (ctxEl) {
    const parts = [];
    if (anxietyCount >= 3) parts.push('anxiety management videos prioritised based on your Vault activity');
    if (workoutCount < 3)  parts.push('discipline and gym motivation surfaced to rebuild workout consistency');
    if ((profile.current_level || 1) >= 7) parts.push('advanced performance picks unlocked for your level');
    ctxEl.textContent = parts.length
      ? `Curated short videos for you — ${parts.join('; ')}.`
      : 'Curated short motivational videos — all under 15 minutes, zero filler. Watch one whenever you need a reset.';
  }

  // Top 4 featured
  const top4  = ranked.slice(0, 4);
  const rest  = ranked.slice(4);

  grid.innerHTML = `
    ${top4.map((r, i) => resourceCard(r, i === 0)).join('')}

    <!-- Show more -->
    <div>
      <button id="show-more-resources"
        class="w-full text-slate-500 hover:text-slate-300 text-sm py-2 border border-dashed border-slate-700/50
               rounded-xl hover:border-slate-600 transition-colors">
        <i class="fa-solid fa-chevron-down mr-2"></i>Show ${rest.length} more videos
      </button>
      <div id="more-resources" class="hidden space-y-4 mt-4">
        ${rest.map((r) => resourceCard(r, false)).join('')}
      </div>
    </div>
  `;

  document.getElementById('show-more-resources')?.addEventListener('click', (e) => {
    const more = document.getElementById('more-resources');
    const btn  = e.currentTarget;
    const hidden = more.classList.contains('hidden');
    more.classList.toggle('hidden', !hidden);
    btn.innerHTML = hidden
      ? '<i class="fa-solid fa-chevron-up mr-2"></i>Show less'
      : `<i class="fa-solid fa-chevron-down mr-2"></i>Show ${rest.length} more videos`;
  });
}

function resourceCard(r, featured = false) {
  const topicsHtml = r.topics.map((t) => `
    <span class="inline-flex items-center gap-1 text-xs text-${r.color}-400/80 bg-${r.color}-500/10
                 border border-${r.color}-500/20 rounded-full px-2.5 py-0.5">${t}</span>`
  ).join('');

  return `
    <div class="bg-navy-600 rounded-2xl border ${featured ? `border-${r.color}-500/40 shadow-lg` : 'border-slate-700/50'} overflow-hidden">

      ${featured ? `<div class="h-0.5 bg-gradient-to-r from-${r.color}-600 to-${r.color}-400"></div>` : ''}

      <div class="p-5">
        <div class="flex items-start gap-3 mb-3">
          <div class="w-11 h-11 rounded-xl bg-${r.color}-500/20 border border-${r.color}-500/30
                      flex items-center justify-center flex-shrink-0">
            <i class="fa-solid ${r.icon} text-${r.color}-400"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-white font-semibold text-sm leading-tight">${r.title}</p>
              ${featured ? `<span class="bg-amber-500/20 text-amber-400 text-xs px-1.5 py-0.5 rounded font-medium">Top Pick</span>` : ''}
            </div>
            <div class="flex items-center gap-2 mt-0.5">
              <p class="text-${r.color}-400 text-xs">${r.channel}</p>
              <span class="text-slate-700 text-xs">·</span>
              <span class="text-slate-500 text-xs flex items-center gap-1">
                <i class="fa-regular fa-clock"></i>${r.duration}
              </span>
            </div>
          </div>
        </div>

        <p class="text-slate-400 text-xs leading-relaxed mb-3">${r.desc}</p>

        <div class="flex flex-wrap gap-1.5 mb-4">${topicsHtml}</div>

        <a href="${r.url}" target="_blank" rel="noopener noreferrer"
          class="flex items-center justify-center gap-2.5 w-full
                 bg-red-600 hover:bg-red-500 text-white font-semibold
                 py-2.5 rounded-xl transition-colors text-sm">
          <i class="fa-brands fa-youtube text-base"></i>
          Watch Now
          <i class="fa-solid fa-arrow-up-right-from-square text-xs opacity-70"></i>
        </a>
      </div>
    </div>
  `;
}

// ─── Learning protocols ───────────────────────────────────────
function renderLearningSection(habits14, anxietyCount, workoutCount, userProfile = {}) {
  const container = document.getElementById('learning-grid');
  const ctxEl     = document.getElementById('learning-context');
  if (!container) return;

  const interests = Array.isArray(userProfile.interests) ? userProfile.interests : [];
  const vices     = Array.isArray(userProfile.vices)     ? userProfile.vices     : [];

  // Score each protocol — base priority + +25 per matched interest
  const boostedIds = new Set(interests.flatMap((k) => INTEREST_BOOST_MAP[k] || []));
  const scored = LEARNING_LIBRARY.map((v) => ({
    ...v,
    score: v.priority(anxietyCount, workoutCount) + (boostedIds.has(v.id) ? 25 : 0),
  })).sort((a, b) => b.score - a.score);

  // Collect vice cards (one per vice, first entry)
  const viceCards = vices
    .filter((k) => VICE_LIBRARY[k]?.length)
    .flatMap((k) => VICE_LIBRARY[k]);

  // Update context line based on interests / vices / activity
  if (ctxEl) {
    if (vices.length && interests.length)
      ctxEl.textContent = `Personalised for your interests (${interests.join(', ')}) and quit-support for ${vices.join(', ')} — ranked by relevance to your current data.`;
    else if (vices.length)
      ctxEl.textContent = `Quit-support content prioritised for your listed vices (${vices.join(', ')}) plus clinically-ranked protocols.`;
    else if (interests.length)
      ctxEl.textContent = `Ranked by your selected interests (${interests.join(', ')}) and your current habit data.`;
    else if (anxietyCount >= 3)
      ctxEl.textContent = `Based on your Symptom Vault activity (${anxietyCount} entries), anxiety management protocols have been prioritised for you.`;
    else if (workoutCount < 3)
      ctxEl.textContent = 'Exercise protocols ranked first — consistency in movement directly reduces anxiety sensitivity.';
    else
      ctxEl.textContent = 'Clinical techniques and science — ranked by what is most relevant to your current habits and vault data.';
  }

  // Vice lifestyle reminder banner
  const viceReminderHtml = vices.length ? `
    <div class="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3 mb-2">
      <i class="fa-solid fa-triangle-exclamation text-rose-400 mt-0.5 flex-shrink-0"></i>
      <div>
        <p class="text-rose-300 text-sm font-semibold mb-0.5">Lifestyle Change Reminder</p>
        <p class="text-rose-300/70 text-xs leading-relaxed">
          You listed <span class="font-medium text-rose-300">${vices.join(', ')}</span> as a vice${vices.length > 1 ? 's' : ''}.
          The videos below are specifically chosen to help you understand the science and take the first steps to break free.
          Small, consistent changes compound into transformation.
        </p>
      </div>
    </div>
  ` : '';

  // Vice cards at top, then scored protocols
  const top3    = scored.slice(0, 3);
  const rest    = scored.slice(3);
  const hasMore = rest.length > 0;

  container.innerHTML = `
    ${viceReminderHtml}

    ${viceCards.length ? `
      <div class="space-y-4">
        <p class="text-xs text-slate-500 uppercase tracking-wide font-medium px-1">Quit-Support Content</p>
        ${viceCards.map((v) => learningCard(v, true)).join('')}
        <div class="border-t border-slate-700/50 pt-2">
          <p class="text-xs text-slate-500 uppercase tracking-wide font-medium px-1 pb-3">Learning Protocols</p>
        </div>
      </div>
    ` : ''}

    ${top3.map((v, i) => learningCard(v, i === 0)).join('')}

    ${hasMore ? `
    <div>
      <button id="show-more-learning"
        class="w-full text-slate-500 hover:text-slate-300 text-sm py-2 border border-dashed border-slate-700/50
               rounded-xl hover:border-slate-600 transition-colors">
        <i class="fa-solid fa-chevron-down mr-2"></i>Show ${rest.length} more protocols
      </button>
      <div id="more-learning" class="hidden space-y-4 mt-4">
        ${rest.map((v) => learningCard(v, false)).join('')}
      </div>
    </div>
    ` : ''}
  `;

  document.getElementById('show-more-learning')?.addEventListener('click', (e) => {
    const more   = document.getElementById('more-learning');
    const btn    = e.currentTarget;
    const hidden = more.classList.contains('hidden');
    more.classList.toggle('hidden', !hidden);
    btn.innerHTML = hidden
      ? '<i class="fa-solid fa-chevron-up mr-2"></i>Show less'
      : `<i class="fa-solid fa-chevron-down mr-2"></i>Show ${rest.length} more protocols`;
  });
}

function learningCard(v, featured = false) {
  const topicsHtml = v.topics.map((t) => `
    <span class="inline-flex items-center gap-1 text-xs text-${v.color}-400/80 bg-${v.color}-500/10
                 border border-${v.color}-500/20 rounded-full px-2.5 py-0.5">${t}</span>`
  ).join('');

  return `
    <div class="bg-navy-600 rounded-2xl border ${featured ? `border-${v.color}-500/40 shadow-lg` : 'border-slate-700/50'} overflow-hidden">

      ${featured ? `<div class="h-0.5 bg-gradient-to-r from-${v.color}-600 to-${v.color}-400"></div>` : ''}

      <div class="p-5">
        <div class="flex items-start gap-3 mb-3">
          <div class="w-11 h-11 rounded-xl bg-${v.color}-500/20 border border-${v.color}-500/30
                      flex items-center justify-center flex-shrink-0">
            <i class="fa-solid ${v.icon} text-${v.color}-400"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-white font-semibold text-sm leading-tight">${v.title}</p>
              ${featured ? `<span class="bg-sky-500/20 text-sky-400 text-xs px-1.5 py-0.5 rounded font-medium">Most Relevant</span>` : ''}
            </div>
            <div class="flex items-center gap-2 mt-0.5">
              <p class="text-${v.color}-400 text-xs">${v.channel}</p>
              <span class="text-slate-700 text-xs">·</span>
              <span class="text-slate-500 text-xs flex items-center gap-1">
                <i class="fa-regular fa-clock"></i>${v.duration}
              </span>
            </div>
          </div>
        </div>

        <p class="text-slate-400 text-xs leading-relaxed mb-3">${v.desc}</p>

        <div class="flex flex-wrap gap-1.5 mb-4">${topicsHtml}</div>

        <a href="${v.url}" target="_blank" rel="noopener noreferrer"
          class="flex items-center justify-center gap-2.5 w-full
                 bg-slate-700 hover:bg-slate-600 border border-slate-600/50
                 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
          <i class="fa-brands fa-youtube text-red-400 text-base"></i>
          Watch Protocol
          <i class="fa-solid fa-arrow-up-right-from-square text-xs opacity-70"></i>
        </a>
      </div>
    </div>
  `;
}
