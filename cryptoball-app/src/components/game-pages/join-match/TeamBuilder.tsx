import FormationGrid from "../../formation-grid";
import type { Player } from "../../player";
import PlayerRoster from "./PlayerRoster";
import { FORMATIONS, type Formation } from "./formations";

interface TeamBuilderProps {
  formation: (Player | null)[];
  isFormationEmpty: boolean;
  ownedPlayers: Player[];
  selectedCount: number;
  selectedFormation: Formation;
  selectedPlayerIds: Set<bigint>;
  onClearFormation: () => void;
  onFormationChange: (formationName: string) => void;
  onPlayerClick: (player: Player) => void;
  onPositionClick: (index: number) => void;
}

const TeamBuilder = ({
  formation,
  isFormationEmpty,
  ownedPlayers,
  selectedCount,
  selectedFormation,
  selectedPlayerIds,
  onClearFormation,
  onFormationChange,
  onPlayerClick,
  onPositionClick,
}: TeamBuilderProps) => (
  <div className="team-building-section">
    <div className="team-header">
      <h2>Build Your Team (5-a-side)</h2>
      <div className="formation-controls">
        <label htmlFor="formation-select">Formation:</label>
        <select
          id="formation-select"
          className="formation-select"
          value={selectedFormation.name}
          onChange={(event) => onFormationChange(event.target.value)}
        >
          {FORMATIONS.map((formationOption) => (
            <option key={formationOption.name} value={formationOption.name}>
              {formationOption.name} (ATT: {formationOption.attack}, MID: {formationOption.midfield}, DEF:{" "}
              {formationOption.defense})
            </option>
          ))}
        </select>
        <button className="clear-formation-button" onClick={onClearFormation} disabled={isFormationEmpty} type="button">
          Clear Formation
        </button>
      </div>
    </div>

    <div className="team-builder">
      <PlayerRoster
        players={ownedPlayers}
        selectedCount={selectedCount}
        selectedPlayerIds={selectedPlayerIds}
        onPlayerClick={onPlayerClick}
      />

      <div className="formation-section">
        <FormationGrid
          teamColour="#32ff7e"
          teamName="Your Team"
          formation={formation}
          selectedFormation={selectedFormation}
          onPositionClick={onPositionClick}
        />

        {selectedCount < 5 && (
          <p className="formation-hint">
            Click players on the left to add them to your {selectedFormation.name} formation. You need 5 players total.
          </p>
        )}
      </div>
    </div>
  </div>
);

export default TeamBuilder;
