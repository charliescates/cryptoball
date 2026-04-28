import { getPlayerTypeName } from "./playerType";

export type AcademyPlayer = {
  id: bigint;
  attack: bigint;
  defense: bigint;
  potential: bigint;
  value: bigint;
  playerType: bigint;
};

export const getOverallRating = (player: AcademyPlayer): number => {
  const avg = (Number(player.attack) + Number(player.defense)) / 2;

  return Math.max(1, Math.min(99, Math.round(avg)));
};

export const getPositionFromType = (playerType: bigint): string => {
  const typeName = getPlayerTypeName(playerType).toLowerCase();

  if (typeName.includes("anchor")) return "CDM";
  if (typeName.includes("enforcer")) return "CB";
  if (typeName.includes("target")) return "ST";
  if (typeName.includes("creator")) return "CAM";
  if (typeName.includes("engine")) return "CM";
  if (typeName.includes("wing")) return "RW";

  return "CM";
};

export const formatPol = (value: bigint): string => {
  return (Number(value) / 1e18).toFixed(4);
};
