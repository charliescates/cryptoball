import { useMemo, useState } from "react";

import type { Player } from "../player";
import { calculateTeamStats } from "../utils/chemistryCalculator";
import { PlayerType, getPlayerTypeColor } from "../utils/playerType";
import { type ChemistryFormation, builderFormations, roleCards } from "./data";

type SlotRole = "attack" | "midfield" | "defense";

type BuilderSlot = {
  id: string;
  label: string;
  role: SlotRole;
  playerType: PlayerType;
};

const roleLabels: Record<SlotRole, string> = {
  attack: "Attack",
  midfield: "Midfield",
  defense: "Defense",
};

const defaultTypesByRole: Record<SlotRole, PlayerType> = {
  attack: PlayerType.TARGET_MAN,
  midfield: PlayerType.PLAYMAKER,
  defense: PlayerType.ANCHOR,
};

const createSlots = (formation: ChemistryFormation): BuilderSlot[] => [
  ...Array.from({ length: formation.attack }, (_, index) => ({
    id: `attack-${index}`,
    label: `Attack ${index + 1}`,
    role: "attack" as const,
    playerType: defaultTypesByRole.attack,
  })),
  ...Array.from({ length: formation.midfield }, (_, index) => ({
    id: `midfield-${index}`,
    label: `Midfield ${index + 1}`,
    role: "midfield" as const,
    playerType: defaultTypesByRole.midfield,
  })),
  ...Array.from({ length: formation.defense }, (_, index) => ({
    id: `defense-${index}`,
    label: `Defense ${index + 1}`,
    role: "defense" as const,
    playerType: defaultTypesByRole.defense,
  })),
];

const toPlayers = (slots: BuilderSlot[], role: SlotRole): Player[] =>
  slots
    .filter((slot) => slot.role === role)
    .map((slot, index) => ({
      attack: BigInt(slot.role === "attack" ? 64 : slot.role === "midfield" ? 56 : 44),
      defense: BigInt(slot.role === "defense" ? 64 : slot.role === "midfield" ? 56 : 44),
      gamesLeft: 5n,
      goalsScored: 0n,
      id: BigInt(`${role === "attack" ? 1 : role === "midfield" ? 2 : 3}${index + 1}`),
      originalAttack: BigInt(slot.role === "attack" ? 64 : slot.role === "midfield" ? 56 : 44),
      originalDefense: BigInt(slot.role === "defense" ? 64 : slot.role === "midfield" ? 56 : 44),
      playerType: BigInt(slot.playerType),
      potential: 70n,
    }));

const getRoleQuality = (slot: BuilderSlot) => {
  if (slot.role === "attack" && slot.playerType === PlayerType.TARGET_MAN) return "Ideal";
  if (slot.role === "midfield" && slot.playerType === PlayerType.PLAYMAKER) return "Ideal";
  if (slot.role === "defense" && slot.playerType === PlayerType.ANCHOR) return "Ideal";
  if (slot.role === "defense" && slot.playerType === PlayerType.ENFORCER) return "Strong";
  if (slot.role === "attack" && slot.playerType === PlayerType.PLAYMAKER) return "Useful";
  if (slot.role === "midfield" && slot.playerType === PlayerType.ANCHOR) return "Useful";
  if (slot.role === "midfield" && slot.playerType === PlayerType.ENFORCER) return "Useful";
  return "No role boost";
};

const getNearMisses = (slots: BuilderSlot[]) => {
  const hasAttack = (index: number, type: PlayerType) =>
    slots.filter((slot) => slot.role === "attack")[index]?.playerType === type;
  const hasMidfield = (index: number, type: PlayerType) =>
    slots.filter((slot) => slot.role === "midfield")[index]?.playerType === type;
  const hasDefense = (index: number, type: PlayerType) =>
    slots.filter((slot) => slot.role === "defense")[index]?.playerType === type;

  const tips: string[] = [];
  const strikePieces = [
    hasMidfield(0, PlayerType.PLAYMAKER),
    hasAttack(0, PlayerType.TARGET_MAN),
    hasAttack(1, PlayerType.TARGET_MAN),
  ].filter(Boolean).length;
  const wallPieces = [
    hasDefense(0, PlayerType.ANCHOR),
    hasDefense(1, PlayerType.ENFORCER),
    hasDefense(2, PlayerType.ENFORCER),
  ].filter(Boolean).length;

  if (strikePieces === 2) {
    tips.push("You are one role away from Strike Force: Playmaker plus two Target Men.");
  }
  if (wallPieces === 2) {
    tips.push("You are one role away from Defensive Wall: Anchor plus two Enforcers.");
  }
  if (tips.length === 0) {
    tips.push("Try building one major combo first, then use the final slots to balance the team.");
  }

  return tips;
};

const ChemistryBuilder = () => {
  const [selectedFormationName, setSelectedFormationName] = useState(builderFormations[4].name);
  const selectedFormation =
    builderFormations.find((formation) => formation.name === selectedFormationName) ?? builderFormations[4];
  const [slotsByFormation, setSlotsByFormation] = useState<Record<string, BuilderSlot[]>>(() =>
    Object.fromEntries(builderFormations.map((formation) => [formation.name, createSlots(formation)])),
  );

  const slots = slotsByFormation[selectedFormation.name] ?? createSlots(selectedFormation);
  const groupedPlayers = useMemo(
    () => ({
      attack: toPlayers(slots, "attack"),
      defense: toPlayers(slots, "defense"),
      midfield: toPlayers(slots, "midfield"),
    }),
    [slots],
  );
  const teamStats = useMemo(
    () => calculateTeamStats(groupedPlayers.attack, groupedPlayers.midfield, groupedPlayers.defense),
    [groupedPlayers],
  );
  const nearMisses = useMemo(() => getNearMisses(slots), [slots]);

  const updateSlot = (slotId: string, playerType: PlayerType) => {
    setSlotsByFormation((previous) => ({
      ...previous,
      [selectedFormation.name]: slots.map((slot) => (slot.id === slotId ? { ...slot, playerType } : slot)),
    }));
  };

  return (
    <section className="chemistry-builder" aria-labelledby="chemistry-builder-title">
      <div className="chemistry-builder-header">
        <div>
          <p className="chemistry-kicker">Chemistry Builder</p>
          <h2 id="chemistry-builder-title">Try a Team Shape</h2>
          <p>Pick a formation, set each role, and see which bonuses activate before you build your real squad.</p>
        </div>
        <div className="chemistry-scoreboard" aria-label="Preview team stats">
          <div>
            <span>Attack</span>
            <strong>{teamStats.finalAttack}</strong>
          </div>
          <div>
            <span>Defense</span>
            <strong>{teamStats.finalDefense}</strong>
          </div>
        </div>
      </div>

      <div className="chemistry-formation-picker" aria-label="Choose a formation">
        {builderFormations.map((formation) => (
          <button
            key={formation.name}
            className={`chemistry-formation-option ${formation.name === selectedFormation.name ? "selected" : ""}`}
            type="button"
            onClick={() => setSelectedFormationName(formation.name)}
          >
            <strong>{formation.name}</strong>
            <span>{formation.summary}</span>
            <small>{formation.intent}</small>
          </button>
        ))}
      </div>

      <div className="chemistry-builder-grid">
        <div className="chemistry-pitch" aria-label="Formation slots">
          {(["attack", "midfield", "defense"] as SlotRole[]).map((role) => {
            const roleSlots = slots.filter((slot) => slot.role === role);
            if (roleSlots.length === 0) return null;

            return (
              <div className="chemistry-line" key={role}>
                <div className="chemistry-line-label">{roleLabels[role]}</div>
                <div
                  className="chemistry-line-slots"
                  style={{ gridTemplateColumns: `repeat(${roleSlots.length}, 1fr)` }}
                >
                  {roleSlots.map((slot) => {
                    const color = getPlayerTypeColor(slot.playerType);

                    return (
                      <div className="chemistry-slot" key={slot.id} style={{ borderColor: color }}>
                        <div className="chemistry-slot-heading">
                          <span>{slot.label}</span>
                          <strong style={{ color }}>{getRoleQuality(slot)}</strong>
                        </div>
                        <select
                          aria-label={`${slot.label} player type`}
                          value={slot.playerType}
                          onChange={(event) => updateSlot(slot.id, Number(event.target.value) as PlayerType)}
                        >
                          {roleCards.map((roleCard) => (
                            <option key={roleCard.title} value={roleCard.id}>
                              {roleCard.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <aside className="chemistry-live-panel" aria-label="Active chemistry bonuses">
          <div className="chemistry-live-card">
            <span>Active bonuses</span>
            {teamStats.activeChemistryBonuses.length > 0 ? (
              <ul>
                {teamStats.activeChemistryBonuses.map((bonus) => (
                  <li key={bonus.description}>
                    <strong>{bonus.description}</strong>
                    <small>
                      {bonus.attackBonus > 0 ? `+${bonus.attackBonus}% Attack` : ""}
                      {bonus.attackBonus > 0 && bonus.defenseBonus > 0 ? " / " : ""}
                      {bonus.defenseBonus > 0 ? `+${bonus.defenseBonus}% Defense` : ""}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No chemistry combo is active yet.</p>
            )}
          </div>
          <div className="chemistry-live-card">
            <span>Coach tip</span>
            <ul>
              {nearMisses.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
          <div className="chemistry-live-card">
            <span>Role colors</span>
            <div className="chemistry-role-chips">
              {roleCards.map((role) => (
                <span key={role.title} style={{ borderColor: role.color, color: role.color }}>
                  {role.shorthand} {role.title}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default ChemistryBuilder;
