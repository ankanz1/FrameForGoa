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

const PREFIXES = [
  'Certified',
  'Card-Carrying',
  'Self-Appointed',
  'Sunrise',
  'Late-Night',
  'Undisputed',
  'Beachside',
  'Full-Send',
  'Terminal-Dwelling',
  '247-Approved',
  'Ship-First',
  'No-Sleep',
];

const ROLE_TITLES: Record<string, string[]> = {
  default: ['Builder', 'Shipper', 'Prototyper', 'Stack Whisperer', 'Bug Whisperer'],
  frontend: ['Pixel Pusher', 'Layout Whisperer', 'CSS Alchemist'],
  backend: ['Query Slinger', 'Server Whisperer', 'Uptime Guardian'],
  fullstack: ['Full-Stack Nomad', 'Both-Ends Builder', 'Stack Whisperer'],
  design: ['Vibe Architect', 'Pixel Curator', 'Contrast Enforcer'],
  ml: ['Weight Whisperer', 'Gradient Chaser', 'Model Wrangler'],
  ai: ['Prompt Alchemist', 'Token Whisperer', 'Model Wrangler'],
  product: ['Roadmap Wrangler', 'Scope Slasher', 'Feature Whisperer'],
  founder: ['Chief Everything Officer', 'Deck Slinger', 'Zero-to-One Runner'],
  hardware: ['Solder Sorcerer', 'Circuit Whisperer', 'Prototype Tinkerer'],
  crypto: ['Chain Wrangler', 'Gas Fee Survivor', 'Block Whisperer'],
  data: ['Pipeline Plumber', 'Dashboard Druid', 'Query Whisperer'],
};

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function matchRole(role: string): keyof typeof ROLE_TITLES {
  const r = role.toLowerCase();
  if (/(front|react|next|ui)/.test(r)) return 'frontend';
  if (/(back|api|server|node|golang|go\b)/.test(r)) return 'backend';
  if (/(full ?stack)/.test(r)) return 'fullstack';
  if (/(design|figma|ux)/.test(r)) return 'design';
  if (/(ml|machine learning)/.test(r)) return 'ml';
  if (/(ai|llm|gpt|agent)/.test(r)) return 'ai';
  if (/(product|pm)/.test(r)) return 'product';
  if (/(founder|ceo|cxo)/.test(r)) return 'founder';
  if (/(hardware|iot|embedded)/.test(r)) return 'hardware';
  if (/(crypto|web3|solidity|chain)/.test(r)) return 'crypto';
  if (/(data|analytics)/.test(r)) return 'data';
  return 'default';
}

/**
 * Whimsical title derived from name + role, with a seed offset so the
 * user can "reroll" for a different flavor.
 */
export function generateBuilderTitle(
  name: string,
  role: string,
  seedOffset = 0
): string {
  const base = `${name}|${role}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash * 31 + base.charCodeAt(i)) | 0;
  }
  hash += seedOffset * 97;

  const bucket = ROLE_TITLES[matchRole(role || '')];
  const prefix = pick(PREFIXES, hash);
  const title = pick(bucket, hash >> 3);
  return `${prefix} ${title}`;
}
