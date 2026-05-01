import { useMemo, useState } from "react";

import type { Player } from "../../player";
import { FORMATIONS, type Formation } from "./formations";

const EMPTY_FORMATION: (Player | null)[] = Array(5).fill(null);

export type FormationRole = "attack" | "midfield" | "defense";

export const getFormationPositionMeta = (index: number, formation: Formation) => {
  if (index < formation.attack) {
    return { label: `Attack ${index + 1}`, role: "attack" as const };
  }

  if (index < formation.attack + formation.midfield) {
    return { label: `Midfield ${index - formation.attack + 1}`, role: "midfield" as const };
  }

  return { label: `Defense ${index - formation.attack - formation.midfield + 1}`, role: "defense" as const };
};

export const useFormationBuilder = () => {
  const [formation, setFormation] = useState<(Player | null)[]>(EMPTY_FORMATION);
  const [selectedFormation, setSelectedFormation] = useState<Formation>(FORMATIONS[0]);
  const [activePositionIndex, setActivePositionIndex] = useState<number | null>(null);

  const selectedPlayerIds = useMemo(
    () => new Set(formation.filter((player): player is Player => player !== null).map((player) => player.id)),
    [formation],
  );

  const selectedCount = selectedPlayerIds.size;
  const isFormationComplete = formation.every((player) => player !== null);
  const isFormationEmpty = formation.every((player) => player === null);
  const activePositionMeta =
    activePositionIndex !== null ? getFormationPositionMeta(activePositionIndex, selectedFormation) : null;

  const handlePlayerClick = (player: Player) => {
    const isAlreadySelected = formation.some((item) => item?.id === player.id);

    if (isAlreadySelected) {
      setFormation((previous) => previous.map((item) => (item?.id === player.id ? null : item)));
      setActivePositionIndex((currentIndex) => currentIndex ?? formation.findIndex((item) => item?.id === player.id));
      return;
    }

    const targetIndex =
      activePositionIndex !== null && formation[activePositionIndex] === null
        ? activePositionIndex
        : formation.findIndex((item) => item === null);

    if (targetIndex !== -1) {
      setFormation((previous) => {
        const next = [...previous];
        next[targetIndex] = player;
        return next;
      });

      const nextEmptyIndex = formation.findIndex((item, index) => index !== targetIndex && item === null);
      setActivePositionIndex(nextEmptyIndex === -1 ? null : nextEmptyIndex);
    }
  };

  const handlePositionClick = (index: number) => {
    setActivePositionIndex(index);
    setFormation((previous) => {
      const next = [...previous];
      next[index] = null;
      return next;
    });
  };

  const clearFormation = () => {
    setFormation(EMPTY_FORMATION);
    setActivePositionIndex(0);
  };

  const handleFormationChange = (formationName: string) => {
    const nextFormation = FORMATIONS.find((item) => item.name === formationName);

    if (nextFormation) {
      setSelectedFormation(nextFormation);
      setFormation(EMPTY_FORMATION);
      setActivePositionIndex(0);
    }
  };

  const attackingPlayers = formation
    .slice(0, selectedFormation.attack)
    .filter((player): player is Player => player !== null);
  const midfieldPlayers = formation
    .slice(selectedFormation.attack, selectedFormation.attack + selectedFormation.midfield)
    .filter((player): player is Player => player !== null);
  const defensivePlayers = formation
    .slice(selectedFormation.attack + selectedFormation.midfield, 5)
    .filter((player): player is Player => player !== null);

  return {
    activePositionIndex,
    activePositionMeta,
    attackingPlayers,
    clearFormation,
    defensivePlayers,
    formation,
    handleFormationChange,
    handlePlayerClick,
    handlePositionClick,
    isFormationComplete,
    isFormationEmpty,
    midfieldPlayers,
    selectedCount,
    selectedFormation,
    selectedPlayerIds,
  };
};
