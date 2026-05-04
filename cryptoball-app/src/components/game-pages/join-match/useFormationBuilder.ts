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

const getRoleScore = (player: Player, role: FormationRole): number => {
  if (role === "attack") return Number(player.attack) * 1.2 + Number(player.potential) * 0.25;
  if (role === "defense") return Number(player.defense) * 1.2 + Number(player.potential) * 0.25;
  return (Number(player.attack) + Number(player.defense) + Number(player.potential)) / 3;
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

  const autoPickFormation = (players: Player[]) => {
    const availablePlayers = players.filter((player) => player.gamesLeft > 0n);
    const nextFormation: (Player | null)[] = Array(5).fill(null);
    const usedPlayerIds = new Set<bigint>();

    for (let index = 0; index < 5; index += 1) {
      const { role } = getFormationPositionMeta(index, selectedFormation);
      const bestPlayer = availablePlayers
        .filter((player) => !usedPlayerIds.has(player.id))
        .sort((first, second) => getRoleScore(second, role) - getRoleScore(first, role))[0];

      if (bestPlayer) {
        nextFormation[index] = bestPlayer;
        usedPlayerIds.add(bestPlayer.id);
      }
    }

    setFormation(nextFormation);
    const nextEmptyIndex = nextFormation.findIndex((player) => player === null);
    setActivePositionIndex(nextEmptyIndex === -1 ? null : nextEmptyIndex);
  };

  const applyFormation = (nextFormation: (Player | null)[], nextSelectedFormation: Formation) => {
    const normalizedFormation = [...nextFormation].slice(0, 5);
    while (normalizedFormation.length < 5) {
      normalizedFormation.push(null);
    }

    setSelectedFormation(nextSelectedFormation);
    setFormation(normalizedFormation);
    const nextEmptyIndex = normalizedFormation.findIndex((player) => player === null);
    setActivePositionIndex(nextEmptyIndex === -1 ? null : nextEmptyIndex);
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
    applyFormation,
    attackingPlayers,
    autoPickFormation,
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
