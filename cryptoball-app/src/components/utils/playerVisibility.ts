const HIDDEN_PLAYER_IDS = new Set<bigint>([2n, 4n]);

export function isVisiblePlayerId(playerId: bigint): boolean {
  return !HIDDEN_PLAYER_IDS.has(playerId);
}
