import { getPlayerName } from "../utils/playerName";
import {
  POTENTIAL_GOLD,
  getPlayerTypeColor,
  getPlayerTypeIcon,
  getPlayerTypeName,
  getPotentialColor,
} from "../utils/playerType";
import { type AcademyPlayer, getOverallRating } from "../utils/playerUtils";
import { formatPol } from "./formatters";

export type AcademyStatTone = "attack" | "defense";

export type AcademyCardStat = {
  label: string;
  tone?: AcademyStatTone;
  value: string;
};

export const getPlayerCardModel = (player: AcademyPlayer) => {
  const playerTypeColor = getPlayerTypeColor(player.playerType);
  const accentColor = getPotentialColor(player.potential, playerTypeColor);
  const hasEliteAttack = player.attack >= 85n;
  const hasEliteDefense = player.defense >= 85n;

  return {
    accentColor,
    hasEliteAttack,
    hasEliteDefense,
    isHighPotential: accentColor === POTENTIAL_GOLD,
    playerName: getPlayerName(player.id),
    playerSeed: `${player.id.toString()}-${player.playerType.toString()}`,
    playerTypeColor,
    playerTypeIcon: getPlayerTypeIcon(player.playerType),
    playerTypeName: getPlayerTypeName(player.playerType),
    rating: getOverallRating(player),
    stats: [
      { label: "Attack", value: player.attack.toString(), tone: hasEliteAttack ? "attack" : undefined },
      { label: "Defense", value: player.defense.toString(), tone: hasEliteDefense ? "defense" : undefined },
      { label: "Potential", value: player.potential.toString() },
      { label: "Value", value: formatPol(player.value) },
    ] satisfies AcademyCardStat[],
  };
};
