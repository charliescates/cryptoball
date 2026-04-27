export type RoleCard = {
  title: string;
  icon: string;
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

export const roleCards: RoleCard[] = [
  {
    title: "Enforcer",
    icon: "💪",
    color: "#ef4444",
    position: "Defense-first, flexible elsewhere",
    bonuses: ["Attack: +5% Attack", "Midfield: +5% Defense", "Defense: +10% Defense"],
    note: "A hard-running defender who keeps pressure off the back line.",
  },
  {
    title: "Target Man",
    icon: "🎯",
    color: "#f97316",
    position: "Attack",
    bonuses: ["Attack: +10% Attack", "Midfield / Defense: No bonus"],
    note: "A direct finisher who makes the most of chances near goal.",
  },
  {
    title: "Playmaker",
    icon: "⚡",
    color: "#38bdf8",
    position: "Midfield",
    bonuses: ["Attack: +5% Attack", "Midfield: +10% Attack", "Defense: No bonus"],
    note: "The engine of the side, linking possession into chances.",
  },
  {
    title: "Anchor",
    icon: "⚓",
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
    positions: "Mid-Left + Attack-Left + Attack-Center",
  },
  {
    tier: "6-Point",
    title: "Defensive Wall",
    summary: "+6% Defense",
    combination: "Anchor + Enforcer + Enforcer",
    positions: "Defense-Left + Defense-Center + Defense-Right",
  },
  {
    tier: "3-Point",
    title: "Balanced Trio",
    summary: "+3% Attack, +3% Defense",
    combination: "Anchor + Playmaker + Target Man",
    positions: "Defense-Left + Mid-Left + Attack-Left",
  },
  {
    tier: "3-Point",
    title: "Midfield Dominance",
    summary: "+3% Attack, +3% Defense",
    combination: "Playmaker + Anchor + Enforcer",
    positions: "Mid-Left + Mid-Center + Mid-Right",
  },
  {
    tier: "3-Point",
    title: "Playmaker Link",
    summary: "+3% Attack",
    combination: "Playmaker + Target Man",
    positions: "Mid-Left + Attack-Left",
  },
  {
    tier: "3-Point",
    title: "Pressure Pair",
    summary: "+3% Attack",
    combination: "Target Man + Enforcer",
    positions: "Attack-Left + Attack-Center",
  },
  {
    tier: "3-Point",
    title: "Anchor Link",
    summary: "+3% Defense",
    combination: "Anchor + Enforcer",
    positions: "Defense-Left + Defense-Center",
  },
  {
    tier: "3-Point",
    title: "Enforcer Duo",
    summary: "+3% Defense",
    combination: "Enforcer + Enforcer",
    positions: "Defense-Left + Defense-Center",
  },
];

export const calcSteps = [
  "Start with each player's raw attack and defense values.",
  "Apply the base position multipliers for attack, midfield, and defense slots.",
  "Apply player type bonuses based on the position each player occupies.",
  "Resolve chemistry bonuses, checking the highest-value combinations first.",
  "Round the result to the nearest whole number for the final match stats.",
];

export const quickRules = [
  "Match each player type to the role that brings out its strengths.",
  "Aim for six-point combos first, then add three-point support.",
  "Look for gold when a player has elite potential, and teal when the player is an Anchor.",
  "Think of chemistry as squad building, not just a list of hidden bonuses.",
];
