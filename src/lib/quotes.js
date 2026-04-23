// Curated anti-anxiety, pro-discipline quotes
export const MORNING_QUOTES = [
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'The body keeps the score, but the mind writes the narrative. Rewrite it.', author: 'Discipline Tracker' },
  { text: 'You have survived 100% of your worst days. Today is no different.', author: 'Discipline Tracker' },
  { text: "Don't watch the clock; do what it does. Keep going.", author: 'Sam Levenson' },
  { text: 'The first and best victory is to conquer self.', author: 'Plato' },
  { text: 'Anxiety is the dizziness of freedom. Ground yourself in action.', author: 'Søren Kierkegaard (adapted)' },
  { text: 'Feelings are visitors. Let them come, acknowledge them, and let them go.', author: 'Mooji' },
  { text: 'You are not your thoughts. You are the observer of your thoughts.', author: 'Eckhart Tolle' },
  { text: "The obstacle is the way. Today's discomfort is tomorrow's strength.", author: 'Marcus Aurelius (adapted)' },
  { text: 'Fear is a signal that something matters. Breathe, and move toward it anyway.', author: 'Discipline Tracker' },
  { text: 'What is not started today is never finished tomorrow.', author: 'Johann Wolfgang von Goethe' },
  { text: 'Small disciplines repeated with consistency everyday lead to great achievements.', author: 'John C. Maxwell' },
  { text: 'Your mind is a powerful thing. When you fill it with positive thoughts, your life will start to change.', author: 'Discipline Tracker' },
  { text: 'Courage is not the absence of fear, but the triumph over it.', author: 'Nelson Mandela' },
  { text: 'The present moment is the only moment available to us, and it is the door to all moments.', author: 'Thich Nhat Hanh' },
];

export const EVENING_QUOTES = [
  { text: 'Rest and recovery are not rewards — they are requirements.', author: 'Discipline Tracker' },
  { text: "Tonight, release what you cannot control. Tomorrow, act on what you can.", author: 'Discipline Tracker' },
  { text: 'End the day with gratitude. Begin tomorrow with intention.', author: 'Discipline Tracker' },
  { text: 'Every day ends. Every storm passes. Every anxiety subsides. You are safe.', author: 'Discipline Tracker' },
  { text: 'Do not go gentle into that good night — but do rest deeply.', author: 'Discipline Tracker' },
];

// Grounding statements shown after anxiety vault submission
export const GROUNDING_STATEMENTS = [
  {
    headline: 'You are experiencing an adrenaline spike — not a crisis.',
    body: 'Your nervous system is doing its job, flagging a perceived threat. That\'s biology, not evidence of danger. Adrenaline has a half-life of roughly 3 minutes. Breathe slowly, and let it metabolize.',
  },
  {
    headline: 'Log secured. You have survived 100% of these moments.',
    body: 'Every single episode of fear, every racing heart, every catastrophic thought — you\'ve outlasted all of them. Your track record is perfect. This one is no exception.',
  },
  {
    headline: 'Your body is speaking — but anxiety is not a medical emergency.',
    body: 'The physical sensations you feel are real, but their cause is stress hormones, not pathology. Chest tightness, dizziness, and palpitations are textbook anxiety responses. They are uncomfortable, not dangerous.',
  },
  {
    headline: 'The thought is not the thing.',
    body: 'Thinking "something is wrong" is not evidence that something is wrong. Cognitive Behavioral Therapy teaches us that thoughts are hypotheses, not facts. You have successfully challenged this before.',
  },
  {
    headline: 'Discomfort is not danger.',
    body: 'Anxiety evolved to keep you safe. It amplifies sensations to demand attention. But amplified does not mean lethal. The fire alarm is loud — that doesn\'t mean the building is burning.',
  },
  {
    headline: 'You chose to log this. That is an act of courage and self-awareness.',
    body: 'Most people white-knuckle through anxiety alone. You documented it, named it, and challenged it. This is exactly what emotional resilience looks like. Well done.',
  },
  {
    headline: 'Acknowledge → Accept → Act.',
    body: 'Acknowledge: I feel anxious right now. Accept: This feeling is temporary and survivable. Act: I will take three slow breaths, drink water, and return to my next task. Repeat as needed.',
  },
];

export function getRandomQuote(timeOfDay = 'morning') {
  const pool = timeOfDay === 'evening' ? EVENING_QUOTES : MORNING_QUOTES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getRandomGrounding() {
  return GROUNDING_STATEMENTS[Math.floor(Math.random() * GROUNDING_STATEMENTS.length)];
}
