import { useMemo, useState } from "react";

import BonusBreakdown from "./formation-grid-parts/BonusBreakdown";
import FormationRow from "./formation-grid-parts/FormationRow";
import TeamStatsSummary from "./formation-grid-parts/TeamStatsSummary";
import { formatFormationLabel, type Formation, getFormationGroups } from "./formation-grid-parts/formationRows";
import type { Player } from "./player";
import { calculateTeamStats } from "./utils/chemistryCalculator";

interface FormationGridProps {
  teamColour: string;
  teamName: string;
  formation: (Player | null)[];
  selectedFormation: Formation;
  activePositionIndex?: number | null;
  teamAddress?: string;
  onPositionClick: (index: number) => void;
}

const FormationGrid = ({
  teamColour,
  teamName,
  formation,
  selectedFormation,
  activePositionIndex = null,
  teamAddress,
  onPositionClick,
}: FormationGridProps) => {
  const [showBonusBreakdown, setShowBonusBreakdown] = useState(false);

  const teamStats = useMemo(() => {
    const groups = getFormationGroups(formation, selectedFormation);
    return calculateTeamStats(groups.attackPlayers, groups.midfieldPlayers, groups.defensePlayers);
  }, [formation, selectedFormation]);

  return (
    <div className="formation-grid-wrapper">
      <h2 style={{ color: teamColour }}>{teamName}</h2>
      <div className="formation-name-display">{formatFormationLabel(selectedFormation)}</div>

      <FormationRow
        label="ATTACK"
        icon="⚔️"
        startIndex={0}
        count={selectedFormation.attack}
        formation={formation}
        teamAddress={teamAddress}
        teamColour={teamColour}
        activePositionIndex={activePositionIndex}
        onPositionClick={onPositionClick}
      />
      <FormationRow
        label="MIDFIELD"
        icon="⚡"
        startIndex={selectedFormation.attack}
        count={selectedFormation.midfield}
        formation={formation}
        teamAddress={teamAddress}
        teamColour={teamColour}
        activePositionIndex={activePositionIndex}
        onPositionClick={onPositionClick}
      />
      <FormationRow
        label="DEFENSE"
        icon="🛡️"
        startIndex={selectedFormation.attack + selectedFormation.midfield}
        count={selectedFormation.defense}
        formation={formation}
        teamAddress={teamAddress}
        teamColour={teamColour}
        activePositionIndex={activePositionIndex}
        onPositionClick={onPositionClick}
      />

      <TeamStatsSummary teamStats={teamStats} />
      <BonusBreakdown
        isOpen={showBonusBreakdown}
        teamStats={teamStats}
        onToggle={() => setShowBonusBreakdown((isOpen) => !isOpen)}
      />
    </div>
  );
};

export default FormationGrid;
