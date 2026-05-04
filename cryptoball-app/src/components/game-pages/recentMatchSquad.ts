import type { Player } from "../player";
import { FORMATIONS, type Formation } from "./join-match/formations";

const RECENT_MATCH_SQUAD_KEY = "cryptoball.recentMatchSquad";

export interface RecentMatchSquad {
  attackingPlayerIds: string[];
  defensivePlayerIds: string[];
  formationName: string;
  matchId: number;
  midfieldPlayerIds: string[];
  opponentAddress?: string;
  savedAt: number;
}

export interface RestoredRecentSquad {
  formation: (Player | null)[];
  restoredCount: number;
  selectedFormation: Formation;
  totalCount: number;
}

export const saveRecentMatchSquad = (squad: Omit<RecentMatchSquad, "savedAt">) => {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(
    RECENT_MATCH_SQUAD_KEY,
    JSON.stringify({
      ...squad,
      savedAt: Date.now(),
    }),
  );
};

export const getRecentMatchSquad = (): RecentMatchSquad | null => {
  if (typeof window === "undefined") return null;

  try {
    const value = window.sessionStorage.getItem(RECENT_MATCH_SQUAD_KEY);
    return value ? (JSON.parse(value) as RecentMatchSquad) : null;
  } catch {
    return null;
  }
};

export const restoreRecentMatchSquad = (
  players: Player[],
  squad: RecentMatchSquad | null,
): RestoredRecentSquad | null => {
  if (!squad) return null;

  const selectedFormation = FORMATIONS.find((formation) => formation.name === squad.formationName) ?? FORMATIONS[0];
  const availablePlayersById = new Map(
    players.filter((player) => player.gamesLeft > 0n).map((player) => [player.id.toString(), player]),
  );

  const playerIds = [
    ...squad.attackingPlayerIds.slice(0, selectedFormation.attack),
    ...squad.midfieldPlayerIds.slice(0, selectedFormation.midfield),
    ...squad.defensivePlayerIds.slice(0, selectedFormation.defense),
  ];
  const formation = playerIds.map((playerId) => availablePlayersById.get(playerId) ?? null);

  while (formation.length < 5) {
    formation.push(null);
  }

  return {
    formation,
    restoredCount: formation.filter((player): player is Player => player !== null).length,
    selectedFormation,
    totalCount: playerIds.length,
  };
};
