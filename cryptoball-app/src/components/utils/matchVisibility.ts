const HIDDEN_MATCH_IDS = new Set<number>([5]);

export function isVisibleMatchId(matchId: number): boolean {
  return !HIDDEN_MATCH_IDS.has(matchId);
}
