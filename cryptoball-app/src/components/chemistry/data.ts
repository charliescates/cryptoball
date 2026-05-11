export type RoleCard = {
  title: string;
  id: number;
  shorthand: string;
  color: string;
  position: string;
  bonuses: string[];
  note: string;
};

export type ComboRule = {
  tier: string;
  title: string;
  summary: string;
  combination: string;
  positions: string;
};

export type ChemistryFormation = {
  name: string;
  attack: number;
  midfield: number;
  defense: number;
  summary: string;
  intent: string;
};

export const builderFormations: ChemistryFormation[] = [
  { name: "3-1-1", attack: 3, midfield: 1, defense: 1, summary: "Front foot", intent: "Overload attack" },
  { name: "1-3-1", attack: 1, midfield: 3, defense: 1, summary: "Control", intent: "Win midfield" },
  { name: "1-1-3", attack: 1, midfield: 1, defense: 3, summary: "Lockdown", intent: "Protect the back" },
  { name: "2-2-1", attack: 2, midfield: 2, defense: 1, summary: "Press", intent: "Fast transitions" },
  { name: "2-1-2", attack: 2, midfield: 1, defense: 2, summary: "Balanced", intent: "Stable shape" },
  { name: "1-2-2", attack: 1, midfield: 2, defense: 2, summary: "Counter", intent: "Absorb and break" },
];

export const roleCards: RoleCard[] = [
  {
    title: "Enforcer",
    id: 0,
    shorthand: "ENF",
    color: "#ef4444",
    position: "Defense-first, flexible elsewhere",
    bonuses: ["Attack: +5% Attack", "Midfield: +5% Defense", "Defense: +10% Defense"],
    note: "A hard-running defender who keeps pressure off the back line.",
  },
  {
    title: "Target Man",
    id: 1,
    shorthand: "TGT",
    color: "#f97316",
    position: "Attack",
    bonuses: ["Attack: +10% Attack", "Midfield / Defense: No bonus"],
    note: "A direct finisher who makes the most of chances near goal.",
  },
  {
    title: "Playmaker",
    id: 2,
    shorthand: "PLY",
    color: "#38bdf8",
    position: "Midfield",
    bonuses: ["Attack: +5% Attack", "Midfield: +10% Attack", "Defense: No bonus"],
    note: "The engine of the side, linking possession into chances.",
  },
  {
    title: "Anchor",
    id: 3,
    shorthand: "ANC",
    color: "#14b8a6",
    position: "Defense",
    bonuses: ["Attack: No bonus", "Midfield: +5% Defense", "Defense: +10% Defense"],
    note: "A steady defender built to hold shape and protect the line.",
  },
];

export const comboRules: ComboRule[] = [
  {
    tier: "6-Point",
    title: "Strike Force",
    summary: "+6% Attack",
    combination: "Playmaker + Target Man + Target Man",
    positions: "Any Midfield + Any 2 Attack slots",
  },
  {
    tier: "6-Point",
    title: "Defensive Wall",
    summary: "+6% Defense",
    combination: "Anchor + Enforcer + Enforcer",
    positions: "Any 3 Defense slots",
  },
  {
    tier: "3-Point",
    title: "Balanced Trio",
    summary: "+3% Attack, +3% Defense",
    combination: "Anchor + Playmaker + Target Man",
    positions: "Any Defense + Any Midfield + Any Attack",
  },
  {
    tier: "3-Point",
    title: "Midfield Dominance",
    summary: "+3% Attack, +3% Defense",
    combination: "Playmaker + Anchor + Enforcer",
    positions: "Any 3 Midfield slots",
  },
  {
    tier: "3-Point",
    title: "Playmaker Link",
    summary: "+3% Attack",
    combination: "Playmaker + Target Man",
    positions: "Any Midfield + Any Attack",
  },
  {
    tier: "3-Point",
    title: "Pressure Pair",
    summary: "+3% Attack",
    combination: "Target Man + Enforcer",
    positions: "Any 2 Attack slots",
  },
  {
    tier: "3-Point",
    title: "Anchor Link",
    summary: "+3% Defense",
    combination: "Anchor + Enforcer",
    positions: "Any 2 Defense slots",
  },
  {
    tier: "3-Point",
    title: "Enforcer Duo",
    summary: "+3% Defense",
    combination: "Enforcer + Enforcer",
    positions: "Any 2 Defense slots",
  },
];

export const calcSteps = [
  "Choose a formation that gives your best roles enough space.",
  "Place players where their role has the strongest position bonus.",
  "Build one major chemistry combo before chasing smaller bonuses.",
  "Use leftover slots to add support combos or balance attack and defense.",
  "Lock the team once the final attack and defense numbers fit your plan.",
];

export const quickRules = [
  "Match each player type to the role that brings out its strengths.",
  "Aim for six-point combos first, then add three-point support.",
  "Gold means elite potential. Teal means Anchor. Both are easy to spot while building.",
  "Think of chemistry as squad building, not just a list of hidden bonuses.",
];
