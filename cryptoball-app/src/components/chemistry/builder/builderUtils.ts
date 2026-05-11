import type { Player } from "../../player";
import { calculateTeamStats } from "../../utils/chemistryCalculator";
import { PlayerType } from "../../utils/playerType";
import type { ChemistryFormation } from "../data";
import { type BuilderSlot, type SlotRole, roleLabels } from "./types";

const defaultTypesByRole: Record<SlotRole, PlayerType> = {
  attack: PlayerType.TARGET_MAN,
  midfield: PlayerType.PLAYMAKER,
  defense: PlayerType.ANCHOR,
};

const roleBaseStats: Record<SlotRole, { attack: number; defense: number; idPrefix: string }> = {
  attack: { attack: 64, defense: 44, idPrefix: "1" },
  midfield: { attack: 56, defense: 56, idPrefix: "2" },
  defense: { attack: 44, defense: 64, idPrefix: "3" },
};

export const createFormationSlots = (formation: ChemistryFormation): BuilderSlot[] => [
  ...createRoleSlots(formation, "attack"),
  ...createRoleSlots(formation, "midfield"),
  ...createRoleSlots(formation, "defense"),
];

export const createInitialSlotsByFormation = (formations: ChemistryFormation[]) =>
  Object.fromEntries(formations.map((formation) => [formation.name, createFormationSlots(formation)]));

export const getSlotsByRole = (slots: BuilderSlot[], role: SlotRole) => slots.filter((slot) => slot.role === role);

export const getRoleQuality = (slot: BuilderSlot) => {
  if (slot.role === "attack" && slot.playerType === PlayerType.TARGET_MAN) return "Ideal";
  if (slot.role === "midfield" && slot.playerType === PlayerType.PLAYMAKER) return "Ideal";
  if (slot.role === "defense" && slot.playerType === PlayerType.ANCHOR) return "Ideal";
  if (slot.role === "defense" && slot.playerType === PlayerType.ENFORCER) return "Strong";
  if (slot.role === "attack" && slot.playerType === PlayerType.PLAYMAKER) return "Useful";
  if (slot.role === "midfield" && slot.playerType === PlayerType.ANCHOR) return "Useful";
  if (slot.role === "midfield" && slot.playerType === PlayerType.ENFORCER) return "Useful";
  return "No role boost";
};

export const calculatePreviewStats = (slots: BuilderSlot[]) =>
  calculateTeamStats(
    toPreviewPlayers(slots, "attack"),
    toPreviewPlayers(slots, "midfield"),
    toPreviewPlayers(slots, "defense"),
  );

export const getNearMissTips = (slots: BuilderSlot[]) => {
  const attackSlots = getSlotsByRole(slots, "attack");
  const midfieldSlots = getSlotsByRole(slots, "midfield");
  const defenseSlots = getSlotsByRole(slots, "defense");
  const tips: string[] = [];

  const attackTargetMen = attackSlots.filter((slot) => slot.playerType === PlayerType.TARGET_MAN).length;
  const midfieldPlaymakers = midfieldSlots.filter((slot) => slot.playerType === PlayerType.PLAYMAKER).length;
  const defenseAnchors = defenseSlots.filter((slot) => slot.playerType === PlayerType.ANCHOR).length;
  const defenseEnforcers = defenseSlots.filter((slot) => slot.playerType === PlayerType.ENFORCER).length;

  const canBuildStrikeForce = attackSlots.length >= 2 && midfieldSlots.length >= 1;
  const canBuildDefensiveWall = defenseSlots.length >= 3;

  const strikePieces = Math.min(midfieldPlaymakers, 1) + Math.min(attackTargetMen, 2);
  const wallPieces = Math.min(defenseAnchors, 1) + Math.min(defenseEnforcers, 2);

  if (canBuildStrikeForce && strikePieces === 2) {
    tips.push("You are one role away from Strike Force: Playmaker plus two Target Men.");
  }
  if (canBuildDefensiveWall && wallPieces === 2) {
    tips.push("You are one role away from Defensive Wall: Anchor plus two Enforcers.");
  }

  return tips.length > 0 ? tips : ["Try building one major combo first, then use the final slots to balance the team."];
};

const createRoleSlots = (formation: ChemistryFormation, role: SlotRole) =>
  Array.from({ length: formation[role] }, (_, index) => ({
    id: `${role}-${index}`,
    label: `${roleLabels[role]} ${index + 1}`,
    playerType: defaultTypesByRole[role],
    role,
  }));

const toPreviewPlayers = (slots: BuilderSlot[], role: SlotRole): Player[] =>
  getSlotsByRole(slots, role).map((slot, index) => {
    const stats = roleBaseStats[slot.role];

    return {
      attack: BigInt(stats.attack),
      defense: BigInt(stats.defense),
      gamesLeft: 5n,
      goalsScored: 0n,
      id: BigInt(`${stats.idPrefix}${index + 1}`),
      originalAttack: BigInt(stats.attack),
      originalDefense: BigInt(stats.defense),
      playerType: BigInt(slot.playerType),
      potential: 70n,
    };
  });
