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

// ─── Detailed quit programs per vice ─────────────────────────
const QUIT_PROGRAMS = {
  smoking: {
    strategies: [
      {
        name: 'Cold Turkey',
        icon: 'fa-bolt',
        color: 'sky',
        desc: 'Stop completely on a chosen date. Counter-intuitively, this has the highest long-term success rate — your brain chemistry resets faster without partial doses of nicotine.',
        steps: ['Set a hard quit date (24–72h away)', 'Remove every cigarette, lighter and ashtray', 'Tell 2–3 people who will hold you accountable', 'Prepare NRT (gum/lozenges) for acute craving spikes'],
      },
      {
        name: 'NRT (Nicotine Replacement)',
        icon: 'fa-capsules',
        color: 'emerald',
        desc: 'Patches, gum, lozenges or inhalers deliver controlled nicotine so you can break the behavioural habit first, then taper the physical addiction.',
        steps: ['Start the patch on quit day — wear 16–24hr', 'Use gum or lozenge for acute spikes (do not smoke on top)', 'Patch doses: 21mg (wks 1–6) → 14mg (wks 7–8) → 7mg (wks 9–10)', 'Combine two NRT forms for 2× the effectiveness'],
      },
      {
        name: 'Hypnotherapy',
        icon: 'fa-brain',
        color: 'purple',
        desc: 'Clinical meta-analyses show 20–36% success rate — triple unassisted. Works by reprogramming your unconscious identity: you stop seeing yourself as a smoker.',
        steps: ['3–6 sessions with a certified clinical hypnotherapist', 'Audio programs: search "Paul McKenna stop smoking hypnosis" or "Andrew Johnson quit smoking"', 'Listen to sessions nightly for 21 days to cement reprogramming', 'Combine with behavioural change for best results'],
      },
      {
        name: 'Gradual Reduction',
        icon: 'fa-chart-line-down',
        color: 'amber',
        desc: 'Systematically delay the first cigarette and cut count each week. Lower success rate than cold turkey alone — works best when paired with a hard quit date at the end.',
        steps: ['Week 1: push first cigarette back by 1 hour daily', 'Weeks 2–3: cut daily count by 50%', 'Week 4: set a final quit date and go cold turkey', 'Track every cigarette — awareness alone reduces consumption'],
      },
    ],
    weekPlan: [
      { week: 'Days 1–3', color: 'red', title: 'The Hardest Part', tasks: ['Nicotine peaks then crashes — cravings are intense but brief (3–5 min max)', 'Drink 2–3L water daily to flush nicotine metabolites faster', 'Replace hand-to-mouth habit: straw, carrot sticks, pen or toothpick', 'Use 4-7-8 breathing every time a craving hits'] },
      { week: 'Week 1', color: 'orange', title: 'Ride the Wave', tasks: ['Carbon monoxide fully cleared — oxygen levels normalising', 'Keep hands busy: stress ball, gym, cold shower when urges spike', 'Remove yourself from smoking environments for 7–10 days', 'Track money saved in real time — make it visible'] },
      { week: 'Weeks 2–4', color: 'amber', title: 'Build the New You', tasks: ['Exercise daily — dopamine release replaces what nicotine provided', 'Taste and smell returning — reward yourself with a great meal', 'Social triggers (alcohol, breaks) are peak danger — have a plan', 'Journalling: write what you gain each day, not what you miss'] },
      { week: 'Months 2–3', color: 'emerald', title: 'Cement the Identity', tasks: ['"I am a non-smoker" — say it out loud daily until it is automatic', 'Lung capacity improving measurably — you can feel it', 'Any slip is data, not failure — analyse the trigger and tighten the gap', 'Book a GP check-up and let the numbers validate your progress'] },
    ],
    craving: [
      'The 4D Method: Delay 5 min · Deep breath · Drink water · Distract',
      'Box breathing: 4s in → 4s hold → 4s out → 4s hold (repeat 4×)',
      'Every craving lasts max 3–5 minutes — ride it like a wave, it will pass',
      'Cold water on your wrists or face shocks the pattern and breaks the loop',
      'Text your accountability partner instead of reaching for a cigarette',
      'Exercise immediately — even 5 min of push-ups resets the dopamine spike',
      'Visualise your lungs and airways getting cleaner with every clean minute',
    ],
    hypnosis: [
      { title: 'Stop Smoking Hypnosis — Paul McKenna', url: 'https://www.youtube.com/results?search_query=paul+mckenna+stop+smoking+hypnosis&sp=EgIYBA%3D%3D' },
      { title: 'Quit Smoking Deep Hypnosis Session', url: 'https://www.youtube.com/results?search_query=quit+smoking+deep+hypnosis+session+subconscious&sp=EgIYBA%3D%3D' },
      { title: 'I Am a Non-Smoker — Identity Reprogramming', url: 'https://www.youtube.com/results?search_query=quit+smoking+identity+reprogramming+hypnosis+non+smoker&sp=EgIYBA%3D%3D' },
    ],
    resources: [
      { title: 'NHS Quit Smoking — Free Support & Tools', url: 'https://www.nhs.uk/better-health/quit-smoking/' },
      { title: 'Allen Carr\'s Easy Way — Free Summary', url: 'https://www.youtube.com/results?search_query=allen+carr+easy+way+quit+smoking+summary&sp=EgIYBA%3D%3D' },
      { title: 'r/stopsmoking — Daily Support Community', url: 'https://www.reddit.com/r/stopsmoking/' },
    ],
  },

  alcohol: {
    strategies: [
      {
        name: 'Total Abstinence',
        icon: 'fa-ban',
        color: 'rose',
        desc: 'Complete cessation with professional support. If drinking heavily daily, consult a doctor first — alcohol withdrawal can be medically serious and may require supervision.',
        steps: ['See a GP if drinking daily — withdrawal needs to be managed safely', 'Remove all alcohol from your home', 'Avoid pubs/bars for the first 30 days', 'Join AA or SMART Recovery for structured support'],
      },
      {
        name: 'Controlled Reduction',
        icon: 'fa-chart-line-down',
        color: 'amber',
        desc: 'Systematically reduce intake each week toward zero. Effective for moderate drinkers — less so for dependency. Track every unit honestly.',
        steps: ['Week 1: log every drink with time, location and trigger', 'Week 2: cut intake by 30% and add 2 alcohol-free days', 'Weeks 3–4: alcohol-free days increase to 5 per week', 'Month 2: set a total sobriety date and stop completely'],
      },
      {
        name: 'Hypnotherapy & CBT',
        icon: 'fa-brain',
        color: 'purple',
        desc: 'Changes the emotional driver behind drinking rather than just using willpower. CBT challenges the thoughts that trigger drinking; hypnosis rewires the desire itself.',
        steps: ['Look for a therapist specialising in addiction-focused CBT', 'Audio: search "quit drinking hypnosis" or "alcohol-free mindset hypnosis"', 'Daily affirmations: "alcohol no longer serves me, I choose clarity"', 'Pair with journalling — identify and reroute emotional triggers'],
      },
    ],
    weekPlan: [
      { week: 'Days 1–3', color: 'red', title: 'Detox Phase', tasks: ['Hydrate aggressively — alcohol is severely dehydrating', 'B1 (Thiamine) supplement is critical — alcohol depletes it', 'Sleep will be disrupted — this is normal and temporary', 'IMPORTANT: if shaking or sweating heavily, see a doctor same day'] },
      { week: 'Week 1', color: 'orange', title: 'Chemistry Shifts', tasks: ['Liver begins repairing within 24–48 hours', 'Replace evening ritual: herbal tea, sparkling water, kombucha', 'Mood may dip before it rises — your brain is rebalancing dopamine', 'Avoid high-risk social situations in week one'] },
      { week: 'Weeks 2–4', color: 'amber', title: 'The Fog Lifts', tasks: ['Sleep quality measurably improving by night 7–10', 'Skin hydration and clarity noticeably better', 'Mental sharpness returning — enjoy the new clarity', 'Exercise is your most powerful mood stabiliser right now'] },
      { week: 'Months 2–3', color: 'emerald', title: 'New Baseline', tasks: ['Liver inflammation significantly reduced', 'Social confidence rebuilds naturally — you did not need it', 'Build a life you do not need to escape from', 'Acknowledge every milestone — 30, 60, 90 days are huge'] },
    ],
    craving: [
      'Urge surf: watch the craving like a wave — observe it without acting, it passes in 5–10 min',
      'HALT check: are you Hungry, Angry, Lonely or Tired? Address the real need',
      'Cold shower or intense exercise to reset the dopamine-seeking signal',
      'Call someone from your support network before you make any decisions',
      'Play the tape forward: imagine how you will feel tomorrow morning if you drink vs. if you do not',
      'Mocktail swap: have a go-to alcohol-free drink ready for high-risk moments',
    ],
    hypnosis: [
      { title: 'Stop Drinking Hypnosis — Deep Session', url: 'https://www.youtube.com/results?search_query=stop+drinking+alcohol+hypnosis+deep+session&sp=EgIYBA%3D%3D' },
      { title: 'Alcohol-Free Mindset Reprogramming', url: 'https://www.youtube.com/results?search_query=alcohol+free+mindset+hypnosis+reprogramming+subconscious&sp=EgIYBA%3D%3D' },
      { title: 'Quit Drinking — CBT Guided Visualisation', url: 'https://www.youtube.com/results?search_query=quit+drinking+CBT+guided+visualisation+therapy&sp=EgIYBA%3D%3D' },
    ],
    resources: [
      { title: 'Alcoholics Anonymous — Find a Meeting', url: 'https://www.aa.org/find-aa' },
      { title: 'SMART Recovery — Science-Based Sobriety', url: 'https://www.smartrecovery.org/' },
      { title: 'r/stopdrinking — 700k+ Members, Daily Support', url: 'https://www.reddit.com/r/stopdrinking/' },
    ],
  },

  gambling: {
    strategies: [
      {
        name: 'Complete Stop + Block',
        icon: 'fa-shield-halved',
        color: 'orange',
        desc: 'Block all access immediately — gambling apps, websites, casinos, and betting accounts. Willpower alone cannot beat availability. Remove the option entirely.',
        steps: ['Self-exclude from all betting sites (Gamstop UK, BetBlocker globally — both free)', 'Delete all gambling apps and unsubscribe from all promotional emails', 'Block gambling sites via your router or parental controls app', 'Hand financial control to a trusted person temporarily if needed'],
      },
      {
        name: 'Financial Restructuring',
        icon: 'fa-sack-dollar',
        color: 'amber',
        desc: 'Gambling is inseparable from money. Restructure access to funds so impulse gambling is structurally impossible, not just resisted.',
        steps: ['Set up a separate account for bills — direct debits go here automatically', 'Use a prepaid card with a daily spending limit for personal expenses', 'Cancel all credit cards or freeze them in a block of ice', 'Track every penny spent for 90 days — transparency kills denial'],
      },
      {
        name: 'Therapy & Hypnosis',
        icon: 'fa-brain',
        color: 'purple',
        desc: 'Gambling addiction is behavioural — therapy rewires the reward cycle, replaces the dopamine chase with healthier stimulation.',
        steps: ['CBT is the gold standard — find an addiction specialist', 'Gamblers Anonymous works similarly to AA — community accountability is powerful', 'Hypnosis targets the subconscious "thrill seeking" drive — search "stop gambling hypnosis"', 'Journalling: write what feeling you are chasing when urges arise'],
      },
    ],
    weekPlan: [
      { week: 'Days 1–7', color: 'red', title: 'Lockdown Phase', tasks: ['Block everything before the urge returns — do it now, not later', 'You will feel bored and restless — this is withdrawal, it is temporary', 'Redirect gambling time: gym, walk, skill learning, anything physical', 'Calculate your total losses honestly — make it real and visible'] },
      { week: 'Weeks 2–4', color: 'orange', title: 'Rebuild Structure', tasks: ['Replace the adrenaline: competitive sport, gaming, investing in skills', 'Financial anxiety peaks here — make a clear debt repayment plan', 'Attend GA or an online community — you need external accountability', 'Track the money you did NOT lose this week'] },
      { week: 'Months 2–3', color: 'amber', title: 'Identity Shift', tasks: ['Sleep and mood stabilising as dopamine system rebalances', 'Relationships beginning to repair — be honest about what happened', 'Start a micro-investment account — channel the "beat the odds" urge productively', 'Celebrate 30, 60, 90 day milestones — they are massive achievements'] },
      { week: 'Months 3+', color: 'emerald', title: 'New Life', tasks: ['Financial situation measurably improving', 'You are building real assets instead of burning them', 'Help someone else starting their gambling-free journey', 'Your story is a superpower — you know what recovery actually costs'] },
    ],
    craving: [
      'Surf the urge: sit with it for 10 minutes without acting — it will peak and fade',
      'Call the gambling helpline before you act: GamCare (UK) 0808 8020 133',
      'Calculate what one session costs in hours of work — make it visceral',
      'Go somewhere gambling is impossible: a park, a gym, a library',
      'Remind yourself: the house always wins in the long run — this is mathematical certainty',
      'Text your accountability partner the exact amount you would have lost',
    ],
    hypnosis: [
      { title: 'Stop Gambling Hypnosis — Subconscious Reprogramming', url: 'https://www.youtube.com/results?search_query=stop+gambling+hypnosis+subconscious+reprogramming&sp=EgIYBA%3D%3D' },
      { title: 'Gambling Addiction Recovery — Guided Meditation', url: 'https://www.youtube.com/results?search_query=gambling+addiction+recovery+guided+meditation+hypnosis&sp=EgIYBA%3D%3D' },
    ],
    resources: [
      { title: 'GamCare — Free Gambling Support (UK)', url: 'https://www.gamcare.org.uk/' },
      { title: 'BetBlocker — Free Multi-Device Blocker', url: 'https://betblocker.org/' },
      { title: 'Gamblers Anonymous — Find a Meeting', url: 'https://www.gamblersanonymous.org/' },
    ],
  },

  junk_food: {
    strategies: [
      {
        name: 'Clean Environment Method',
        icon: 'fa-ban',
        color: 'amber',
        desc: 'You cannot eat what is not there. Restructure your environment so healthy choices are the path of least resistance — willpower is not required when the option does not exist.',
        steps: ['Purge all junk food from your home in one session', 'Meal prep on Sunday: 5 healthy meals ready in the fridge', 'Shop on a full stomach with a list — never browse hungry', 'Healthy snacks visible and at hand level; junk stored high or removed entirely'],
      },
      {
        name: 'Gradual Substitution',
        icon: 'fa-arrow-right-arrow-left',
        color: 'emerald',
        desc: 'Replace one junk item at a time with a whole-food alternative. Works for people who find cold-turkey restrictive eating unsustainable.',
        steps: ['Week 1: replace fizzy drinks with sparkling water + fruit', 'Week 2: replace crisps/chips with nuts, seeds or fruit', 'Week 3: replace takeaways with home-cooked equivalents', 'Each swap becomes automatic after 21 repetitions'],
      },
      {
        name: 'Mindful Eating & Hypnosis',
        icon: 'fa-brain',
        color: 'purple',
        desc: 'Junk food cravings are mostly emotional or habitual, not hunger. Mindful eating retrains you to eat consciously; hypnosis works on the emotional drive directly.',
        steps: ['Eat without screens — phone away, taste every bite', 'Hunger vs. craving: rate hunger 1–10 before eating anything', 'Search "stop junk food cravings hypnosis" for audio sessions', 'Journalling: note what emotion precedes every junk food craving'],
      },
    ],
    weekPlan: [
      { week: 'Days 1–3', color: 'amber', title: 'Sugar Withdrawal', tasks: ['Blood sugar spikes and crashes are intense — cravings peak here', 'Protein at every meal stabilises blood sugar and kills hunger faster', 'Drink more water — thirst is frequently misread as hunger', 'Headaches and fatigue are normal withdrawal from processed sugar'] },
      { week: 'Week 1', color: 'orange', title: 'New Rhythms', tasks: ['Plan every meal 24h in advance — decision fatigue causes junk relapses', 'Cook one new healthy recipe that genuinely tastes good', 'Energy beginning to stabilise as blood sugar steadies', 'Replace after-dinner junk habit with herbal tea + fruit'] },
      { week: 'Weeks 2–4', color: 'emerald', title: 'Gut Resets', tasks: ['Gut microbiome shifting toward diverse, healthy bacteria', 'Bloating and digestive discomfort reducing', 'Skin clarity often noticeable by week 2–3', 'Cravings dropping sharply — the brain is adapting'] },
      { week: 'Month 2+', color: 'teal', title: 'New Palate', tasks: ['Whole foods taste better now — taste receptors have recalibrated', 'Junk food often tastes overwhelmingly sweet or greasy now', 'Energy is stable all day — no afternoon crash', 'Track body composition changes: the mirror does not lie'] },
    ],
    craving: [
      'Drink a full glass of water and wait 10 minutes — craving often disappears',
      'Eat a high-protein snack: Greek yoghurt, boiled eggs, handful of nuts',
      'Brush your teeth immediately — food tastes worse after and the ritual signals "eating is done"',
      '5-minute walk outside — craving intensity drops 40% with even brief exercise',
      'Ask: am I actually hungry (1–4/10) or is this emotional? Address the emotion instead',
      'The craving is not for the food — it is for the dopamine hit. Exercise gives the same hit',
    ],
    hypnosis: [
      { title: 'Stop Junk Food Cravings — Hypnosis Session', url: 'https://www.youtube.com/results?search_query=stop+junk+food+cravings+hypnosis+weight+loss&sp=EgIYBA%3D%3D' },
      { title: 'Healthy Eating Mindset — Subconscious Reprogramming', url: 'https://www.youtube.com/results?search_query=healthy+eating+mindset+hypnosis+subconscious+reprogramming&sp=EgIYBA%3D%3D' },
    ],
    resources: [
      { title: 'Glucose Revolution — Beat Sugar Spikes', url: 'https://www.youtube.com/results?search_query=glucose+goddess+glucose+revolution+blood+sugar+hacks&sp=EgIYBA%3D%3D' },
      { title: 'Whole Foods on a Budget — Practical Guide', url: 'https://www.youtube.com/results?search_query=healthy+eating+budget+meal+prep+beginner&sp=EgIYBA%3D%3D' },
      { title: 'r/EatCheapAndHealthy — Community Recipes', url: 'https://www.reddit.com/r/EatCheapAndHealthy/' },
    ],
  },

  social_media: {
    strategies: [
      {
        name: 'Cold Turkey Digital Detox',
        icon: 'fa-mobile-screen-button',
        color: 'indigo',
        desc: 'Delete all social media apps from your phone for a fixed period (start with 30 days). The research is clear: even a 4-week break measurably improves mood, focus and life satisfaction.',
        steps: ['Delete apps — not just log out — from every device', 'Tell your social circle to reach you by text/call only', 'Set an end date: 7, 30, or 90 days', 'Use the time for one meaningful creative or learning project'],
      },
      {
        name: 'Scheduled Usage Windows',
        icon: 'fa-clock',
        color: 'amber',
        desc: 'Collapse social media into one or two 15-minute windows per day. Breaks the dopamine loop of constant checking without full abstinence.',
        steps: ['Set phone Screen Time / Digital Wellbeing limits for each app', 'Designate specific times: e.g. 12:30pm and 6:30pm only', 'Phone goes in another room during meals, work and 1hr before bed', 'Track screen time weekly — the trend motivates you more than the daily number'],
      },
      {
        name: 'Intentional Replacement',
        icon: 'fa-brain',
        color: 'purple',
        desc: 'Social media fills boredom and loneliness. Replace it with activities that provide real connection, creativity or growth — so the absence does not feel like deprivation.',
        steps: ['For every social media session you skip, do one real-world thing', 'Daily journalling replaces the urge to "share" or "broadcast"', 'Call a friend instead of scrolling their feed', 'Search "dopamine detox hypnosis" for subconscious reprogramming of the checking habit'],
      },
    ],
    weekPlan: [
      { week: 'Days 1–3', color: 'indigo', title: 'Phantom Phone Syndrome', tasks: ['You will reach for your phone constantly — this is conditioned reflex, not need', 'FOMO peaks in the first 48–72 hours then drops sharply', 'Boredom is not bad — it is the gateway to creativity', 'Put your phone face-down or in a different room during waking hours'] },
      { week: 'Week 1', color: 'blue', title: 'Mental Silence', tasks: ['Sleep quality improving measurably by night 5–7', 'Anxiety dropping — social comparison is gone', 'You have 2–4 hours back per day — invest it intentionally', 'Read one book, start one project, or call someone you care about'] },
      { week: 'Weeks 2–4', color: 'purple', title: 'Deep Focus Returns', tasks: ['Attention span lengthening — deep work sessions becoming possible', 'Relationships in real life feel richer without the digital dilution', 'Mood stability noticeably better — no more algorithmic mood manipulation', 'Journal what you have done with the reclaimed time'] },
      { week: 'Month 2+', color: 'emerald', title: 'New Relationship with Tech', tasks: ['If you return, you will use it very differently — intentionally, not compulsively', 'Productivity has likely made a measurable leap', 'Identity shift: "I am someone who creates, not just consumes"', 'The algorithm no longer owns your attention — you do'] },
    ],
    craving: [
      'The checking urge lasts 90 seconds — set a timer and breathe through it',
      'Replace the unlock habit with one deep breath and asking: "what do I actually want right now?"',
      'Put your phone in a drawer or another room — physical distance matters',
      'Text a real person instead of scrolling a feed',
      'Do 10 push-ups every time you feel the urge — your body will thank you by month 2',
      'Ask: "Is anything actually happening that requires my attention right now?" The answer is almost always no',
    ],
    hypnosis: [
      { title: 'Dopamine Detox — Phone Addiction Hypnosis', url: 'https://www.youtube.com/results?search_query=dopamine+detox+phone+addiction+hypnosis+social+media&sp=EgIYBA%3D%3D' },
      { title: 'Social Media Addiction — Subconscious Reset', url: 'https://www.youtube.com/results?search_query=social+media+addiction+subconscious+reset+hypnosis&sp=EgIYBA%3D%3D' },
    ],
    resources: [
      { title: 'Digital Minimalism — Cal Newport Summary', url: 'https://www.youtube.com/results?search_query=digital+minimalism+cal+newport+summary+social+media&sp=EgIYBA%3D%3D' },
      { title: 'The Social Dilemma — Netflix Documentary', url: 'https://www.youtube.com/results?search_query=the+social+dilemma+documentary+trailer+netflix&sp=EgIYBA%3D%3D' },
      { title: 'r/nosurf — Digital Minimalism Community', url: 'https://www.reddit.com/r/nosurf/' },
    ],
  },
};

function renderQuitProgram(vice) {
  const prog = QUIT_PROGRAMS[vice];
  if (!prog) return '';

  const display = VICE_DISPLAY[vice] || { color: 'indigo' };
  const colorCls = _colorCls(display.color);

  const strategyColors = { sky: '#38bdf8', emerald: '#34d399', purple: '#a78bfa', amber: '#fbbf24', rose: '#fb7185', orange: '#fb923c', indigo: '#818cf8', red: '#f87171', teal: '#2dd4bf' };
  const weekColors     = { red: '#ef4444', orange: '#f97316', amber: '#f59e0b', emerald: '#10b981', indigo: '#6366f1', blue: '#3b82f6', purple: '#a855f7', teal: '#14b8a6' };

  return `
    <div class="mt-4 pt-4 border-t border-slate-700/50 space-y-4">
      <p class="text-slate-400 text-xs font-medium uppercase tracking-wider flex items-center gap-2">
        <i class="fa-solid fa-road"></i> Your Quit Program
      </p>

      <!-- Strategies -->
      <div class="space-y-2">
        ${prog.strategies.map((s) => {
          const sc = strategyColors[s.color] || '#818cf8';
          return `
          <details class="group rounded-xl overflow-hidden" style="border:1px solid ${sc}22;background:${sc}06;">
            <summary class="flex items-center gap-3 px-4 py-3 cursor-pointer list-none">
              <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style="background:${sc}18;">
                <i class="fa-solid ${s.icon} text-xs" style="color:${sc};"></i>
              </div>
              <p class="text-white text-sm font-semibold flex-1">${s.name}</p>
              <i class="fa-solid fa-chevron-down text-slate-600 text-xs transition-transform group-open:rotate-180"></i>
            </summary>
            <div class="px-4 pb-4 space-y-2">
              <p class="text-slate-400 text-xs leading-relaxed">${s.desc}</p>
              <ul class="space-y-1 mt-2">
                ${s.steps.map((st) => `
                  <li class="flex items-start gap-2 text-xs text-slate-300">
                    <i class="fa-solid fa-circle-dot text-xs mt-0.5 flex-shrink-0" style="color:${sc};"></i>
                    ${st}
                  </li>
                `).join('')}
              </ul>
            </div>
          </details>
        `}).join('')}
      </div>

      <!-- Week-by-week plan -->
      <div>
        <p class="text-slate-500 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <i class="fa-solid fa-calendar-days"></i> Week-by-week plan
        </p>
        <div class="space-y-2">
          ${prog.weekPlan.map((w) => {
            const wc = weekColors[w.color] || '#818cf8';
            return `
            <div class="rounded-xl px-4 py-3" style="background:${wc}08;border:1px solid ${wc}20;">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xs font-bold px-2 py-0.5 rounded-full" style="background:${wc}18;color:${wc};">${w.week}</span>
                <span class="text-white text-xs font-semibold">${w.title}</span>
              </div>
              <ul class="space-y-1">
                ${w.tasks.map((t) => `
                  <li class="flex items-start gap-2 text-xs text-slate-400">
                    <i class="fa-solid fa-arrow-right text-xs mt-0.5 flex-shrink-0" style="color:${wc};"></i>
                    ${t}
                  </li>
                `).join('')}
              </ul>
            </div>
          `}).join('')}
        </div>
      </div>

      <!-- Emergency craving toolkit -->
      <div class="rounded-xl px-4 py-3 bg-red-500/5 border border-red-500/15">
        <p class="text-red-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <i class="fa-solid fa-siren-on"></i> Emergency Craving Toolkit
        </p>
        <ul class="space-y-1.5">
          ${prog.craving.map((c) => `
            <li class="flex items-start gap-2 text-xs text-slate-400">
              <i class="fa-solid fa-bolt text-red-400/60 text-xs mt-0.5 flex-shrink-0"></i>
              ${c}
            </li>
          `).join('')}
        </ul>
      </div>

      <!-- Hypnosis resources -->
      ${prog.hypnosis && prog.hypnosis.length ? `
      <div class="rounded-xl px-4 py-3 bg-purple-500/5 border border-purple-500/15">
        <p class="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <i class="fa-solid fa-brain"></i> Hypnotherapy & Subconscious Reprogramming
        </p>
        <div class="space-y-1.5">
          ${prog.hypnosis.map((h) => `
            <a href="${h.url}" target="_blank" rel="noopener noreferrer"
               class="flex items-center gap-2 text-xs text-purple-300 hover:text-purple-200 transition-colors group">
              <i class="fa-brands fa-youtube text-red-500/70 flex-shrink-0"></i>
              <span class="group-hover:underline">${h.title}</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-xs opacity-0 group-hover:opacity-60 ml-auto"></i>
            </a>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Support resources -->
      <div class="space-y-1">
        <p class="text-slate-500 text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <i class="fa-solid fa-link"></i> Support Resources
        </p>
        ${prog.resources.map((r) => `
          <a href="${r.url}" target="_blank" rel="noopener noreferrer"
             class="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors group px-1">
            <i class="fa-solid fa-arrow-up-right-from-square text-xs opacity-0 group-hover:opacity-60 flex-shrink-0"></i>
            ${r.title}
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

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

      <!-- Quit program -->
      ${renderQuitProgram(primaryVice)}

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
