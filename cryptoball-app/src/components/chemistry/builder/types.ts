import type { PlayerType } from "../../utils/playerType";

export type SlotRole = "attack" | "midfield" | "defense";

export type BuilderSlot = {
  id: string;
  label: string;
  playerType: PlayerType;
  role: SlotRole;
};

export const slotRoles: SlotRole[] = ["attack", "midfield", "defense"];

export const roleLabels: Record<SlotRole, string> = {
  attack: "Attack",
  midfield: "Midfield",
  defense: "Defense",
};
