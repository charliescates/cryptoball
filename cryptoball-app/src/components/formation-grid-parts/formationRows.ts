import type { Player } from "../player";

export interface Formation {
  name: string;
  attack: number;
  midfield: number;
  defense: number;
}

export interface FormationGroups {
  attackPlayers: (Player | null)[];
  midfieldPlayers: (Player | null)[];
  defensePlayers: (Player | null)[];
}

export const formatFormationLabel = (formation: Pick<Formation, "attack" | "midfield" | "defense">): string =>
  `${formation.defense}-${formation.midfield}-${formation.attack}`;

export const getFormationGroups = (formation: (Player | null)[], selectedFormation: Formation): FormationGroups => {
  const attackEnd = selectedFormation.attack;
  const midfieldEnd = attackEnd + selectedFormation.midfield;

  return {
    attackPlayers: formation.slice(0, attackEnd),
    midfieldPlayers: formation.slice(attackEnd, midfieldEnd),
    defensePlayers: formation.slice(midfieldEnd, midfieldEnd + selectedFormation.defense),
  };
};
