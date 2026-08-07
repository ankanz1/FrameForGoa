const ADJECTIVES = [
  'Full-Stack', 'Async', 'Zero-Knowledge', 'Autonomous', 'Decentralized',
  'Recursive', 'Parallel', 'Event-Driven', 'Hyper-Scale', 'Prompt-Engineered',
  'Quantum', 'Deterministic', 'Unstoppable', 'Bionic', 'Cybernetic',
  'Sub-Second', 'Resilient', 'Generative', 'Serverless', 'Stateful'
];

const NOUNS = [
  'Architect', 'Alchemist', 'Wizard', 'Ninja', 'Craftsman',
  'Hacker', 'Innovator', 'Pioneer', 'Catalyst', 'Strategist',
  'Gladiator', 'Sculptor', 'Maestro', 'Navigator', 'Engineer',
  'Conductor', 'Pathfinder', 'Visionary', 'Operative', 'Summoner'
];

const SUFFIXES = [
  'of Goa', 'in the Sandbox', 'at HH Goa 2026', 'on Mainnet',
  'Ship It Edition', 'Building in Public', 'with 100x Energy',
  'fueled by Feni & Code', 'on 0ms Latency', 'shipped at 4 AM'
];

export function getRandomBuilderTitle(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  return `${adj} ${noun} ${suffix}`;
}
