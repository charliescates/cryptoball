export interface Formation {
  name: string;
  attack: number;
  midfield: number;
  defense: number;
  summary: string;
  intent: string;
}

export const FORMATIONS: Formation[] = [
  { name: "3-1-1", attack: 3, midfield: 1, defense: 1, summary: "Front foot", intent: "Overload attack" },
  { name: "1-3-1", attack: 1, midfield: 3, defense: 1, summary: "Control", intent: "Win midfield" },
  { name: "1-1-3", attack: 1, midfield: 1, defense: 3, summary: "Lockdown", intent: "Protect the back" },
  { name: "2-2-1", attack: 2, midfield: 2, defense: 1, summary: "Press", intent: "Fast transitions" },
  { name: "2-1-2", attack: 2, midfield: 1, defense: 2, summary: "Balanced", intent: "Stable shape" },
  { name: "1-2-2", attack: 1, midfield: 2, defense: 2, summary: "Counter", intent: "Absorb and break" },
];
