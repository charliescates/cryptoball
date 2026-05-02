import type { Player } from "../player";
import { getPlayerName } from "../utils/playerName";
import { PlayerType, getPlayerTypeName } from "../utils/playerType";

export type SquadFilter = "all" | "attackers" | "defenders" | "high-potential" | "match-ready";
export type SquadSort = "overall" | "potential" | "attack" | "defense" | "games-left";

export type SquadMetric = {
  helper: string;
  label: string;
  value: string;
};

export type SquadInsight = {
  detail: string;
  label: string;
  value: string;
};

export const squadFilterOptions: Array<{ label: string; value: SquadFilter }> = [
  { label: "All players", value: "all" },
  { label: "Attack fit", value: "attackers" },
  { label: "Defense fit", value: "defenders" },
  { label: "High potential", value: "high-potential" },
  { label: "Match ready", value: "match-ready" },
];

export const squadSortOptions: Array<{ label: string; value: SquadSort }> = [
  { label: "Overall", value: "overall" },
  { label: "Potential", value: "potential" },
  { label: "Attack", value: "attack" },
  { label: "Defense", value: "defense" },
  { label: "Games left", value: "games-left" },
];

const toRating = (value: bigint): number => Number(value);

export const getOverallRating = (player: Player): number => {
  return Math.round((toRating(player.attack) + toRating(player.defense)) / 2);
};

const getAverageRating = (players: Player[], selector: (player: Player) => number): number => {
  if (players.length === 0) return 0;

  const total = players.reduce((sum, player) => sum + selector(player), 0);
  return Math.round(total / players.length);
};

const formatCount = (count: number, singular: string, plural = `${singular}s`): string => {
  return `${count} ${count === 1 ? singular : plural}`;
};

export const getRoleFitLabel = (player: Player): string => {
  const attack = toRating(player.attack);
  const defense = toRating(player.defense);
  const potential = toRating(player.potential);
  const type = Number(player.playerType);

  if (potential >= 85) return "Elite prospect";
  if (type === PlayerType.TARGET_MAN || attack >= defense + 8) return "Attack fit";
  if (type === PlayerType.ANCHOR || defense >= attack + 8) return "Defense fit";
  if (type === PlayerType.PLAYMAKER) return "Midfield link";
  if (type === PlayerType.ENFORCER) return "Physical cover";

  return getPlayerTypeName(player.playerType);
};

export const getSquadMetrics = (players: Player[]): SquadMetric[] => {
  const bestPlayer = players.reduce<Player | undefined>((best, player) => {
    if (!best) return player;
    return getOverallRating(player) > getOverallRating(best) ? player : best;
  }, undefined);

  return [
    {
      helper: "signed to the club",
      label: "Players",
      value: players.length.toString(),
    },
    {
      helper: "attack and defense",
      label: "Avg overall",
      value: getAverageRating(players, getOverallRating).toString(),
    },
    {
      helper: bestPlayer ? getPlayerName(bestPlayer.id) : "No players yet",
      label: "Best overall",
      value: bestPlayer ? getOverallRating(bestPlayer).toString() : "0",
    },
    {
      helper: "with games left",
      label: "Match ready",
      value: players.filter((player) => player.gamesLeft > 0n).length.toString(),
    },
  ];
};

export const getSquadInsights = (players: Player[]): SquadInsight[] => {
  const highPotentialCount = players.filter((player) => player.potential >= 80n).length;
  const lowGamesCount = players.filter((player) => player.gamesLeft <= 2n).length;
  const defendersCount = players.filter((player) => player.defense >= player.attack).length;
  const bestAttacker = players.reduce<Player | undefined>((best, player) => {
    if (!best) return player;
    return player.attack > best.attack ? player : best;
  }, undefined);

  return [
    {
      detail: "Plan your next starts around contract depth.",
      label: "Rotation watch",
      value: formatCount(lowGamesCount, "low-game player"),
    },
    {
      detail: "Build the long-term core around these players.",
      label: "High ceiling",
      value: formatCount(highPotentialCount, "prospect"),
    },
    {
      detail: "Keep enough cover before joining competitive matches.",
      label: "Defensive depth",
      value: formatCount(defendersCount, "cover option"),
    },
    {
      detail: bestAttacker
        ? `Top current threat is ${getPlayerName(bestAttacker.id)}.`
        : "Scout an attacker in Academy.",
      label: "Attack lead",
      value: bestAttacker ? bestAttacker.attack.toString() : "0",
    },
  ];
};

const squadFilterPredicates: Record<SquadFilter, (player: Player) => boolean> = {
  all: () => true,
  attackers: (player) => Number(player.playerType) === PlayerType.TARGET_MAN || player.attack >= player.defense,
  defenders: (player) => Number(player.playerType) === PlayerType.ANCHOR || player.defense >= player.attack,
  "high-potential": (player) => player.potential >= 80n,
  "match-ready": (player) => player.gamesLeft > 0n,
};

const squadSortSelectors: Record<SquadSort, (player: Player) => number> = {
  attack: (player) => toRating(player.attack),
  defense: (player) => toRating(player.defense),
  "games-left": (player) => toRating(player.gamesLeft),
  overall: getOverallRating,
  potential: (player) => toRating(player.potential),
};

export const getVisibleSquadPlayers = (players: Player[], filter: SquadFilter, sort: SquadSort): Player[] => {
  return players.filter(squadFilterPredicates[filter]).sort((firstPlayer, secondPlayer) => {
    const firstValue = squadSortSelectors[sort](firstPlayer);
    const secondValue = squadSortSelectors[sort](secondPlayer);

    if (secondValue !== firstValue) return secondValue - firstValue;
    return Number(firstPlayer.id - secondPlayer.id);
  });
};
