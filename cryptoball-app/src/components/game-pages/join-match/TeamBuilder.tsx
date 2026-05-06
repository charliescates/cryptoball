import FormationGrid from "../../formation-grid";
import type { Player } from "../../player";
import PlayerRoster from "./PlayerRoster";
import { FORMATIONS, type Formation } from "./formations";
import type { FormationRole } from "./useFormationBuilder";

interface TeamBuilderProps {
  activePositionIndex: number | null;
  activePositionMeta: { label: string; role: FormationRole } | null;
  formation: (Player | null)[];
  isFormationEmpty: boolean;
  ownedPlayers: Player[];
  selectedCount: number;
  selectedFormation: Formation;
  selectedPlayerIds: Set<bigint>;
  teamAddress?: string;
  onAutoPick: () => void;
  onClearFormation: () => void;
  onFormationChange: (formationName: string) => void;
  onPlayerClick: (player: Player) => void;
  onPositionClick: (index: number) => void;
  onUseRecentSquad?: () => void;
  recentSquadLabel?: string;
  recentSquadMessage?: string | null;
}

const TeamBuilder = ({
  activePositionIndex,
  activePositionMeta,
  formation,
  isFormationEmpty,
  ownedPlayers,
  selectedCount,
  selectedFormation,
  selectedPlayerIds,
  teamAddress,
  onAutoPick,
  onClearFormation,
  onFormationChange,
  onPlayerClick,
  onPositionClick,
  onUseRecentSquad,
  recentSquadLabel,
  recentSquadMessage,
}: TeamBuilderProps) => (
  <div className="team-building-section join-flow-shell">
    <div className="team-header join-flow-header">
      <div>
        <p className="join-flow-kicker">Squad setup</p>
        <h2>Build Your Match Five</h2>
        <p className="join-flow-copy">Pick a shape, tap a pitch slot, then choose the player you want in that role.</p>
      </div>
      <div className="join-flow-actions">
        {onUseRecentSquad ? (
          <button className="recent-squad-button" onClick={onUseRecentSquad} type="button">
            {recentSquadLabel ?? "Use recent squad"}
          </button>
        ) : null}
        <button className="auto-pick-button" onClick={onAutoPick} disabled={ownedPlayers.length < 5} type="button">
          Best Team
        </button>
        <button className="clear-formation-button" onClick={onClearFormation} disabled={isFormationEmpty} type="button">
          Reset Team
        </button>
      </div>
    </div>
    {recentSquadMessage ? <p className="recent-squad-message">{recentSquadMessage}</p> : null}

    <div className="match-readiness-panel" aria-label="Match readiness">
      <div>
        <span>Readiness</span>
        <strong>{selectedCount === 5 ? "Ready to submit" : `${5 - selectedCount} picks needed`}</strong>
      </div>
      <div>
        <span>Available</span>
        <strong>{ownedPlayers.filter((player) => player.gamesLeft > 0n).length}</strong>
      </div>
      <div>
        <span>Shape</span>
        <strong>{selectedFormation.name}</strong>
      </div>
      <div>
        <span>Risk</span>
        <strong>{ownedPlayers.some((player) => player.gamesLeft <= 1n) ? "Rotation watch" : "Clear"}</strong>
      </div>
    </div>

    <div className="join-flow-stepper" aria-label="Join match progress">
      <div className={`join-flow-step ${selectedFormation ? "complete" : "active"}`}>
        <span>1</span>
        <strong>Shape</strong>
      </div>
      <div className={`join-flow-step ${selectedCount > 0 ? "complete" : "active"}`}>
        <span>2</span>
        <strong>Pick players</strong>
      </div>
      <div className={`join-flow-step ${selectedCount === 5 ? "complete" : "pending"}`}>
        <span>3</span>
        <strong>Review</strong>
      </div>
    </div>

    <div className="formation-card-grid" aria-label="Choose formation">
      {FORMATIONS.map((formationOption) => (
        <button
          key={formationOption.name}
          className={`formation-card-option ${formationOption.name === selectedFormation.name ? "selected" : ""}`}
          type="button"
          onClick={() => onFormationChange(formationOption.name)}
        >
          <span className="formation-card-name">{formationOption.name}</span>
          <span className="formation-card-summary">{formationOption.summary}</span>
          <span className="formation-card-intent">{formationOption.intent}</span>
          <span className="formation-card-split">
            {formationOption.attack} ATT / {formationOption.midfield} MID / {formationOption.defense} DEF
          </span>
        </button>
      ))}
    </div>

    <div className="team-builder">
      <PlayerRoster
        activePositionLabel={activePositionMeta?.label ?? "next empty slot"}
        activePositionRole={activePositionMeta?.role ?? null}
        players={ownedPlayers}
        selectedCount={selectedCount}
        selectedPlayerIds={selectedPlayerIds}
        onPlayerClick={onPlayerClick}
      />

      <div className="formation-section">
        <FormationGrid
          teamColour="#32ff7e"
          teamName="Your Team"
          teamAddress={teamAddress}
          formation={formation}
          selectedFormation={selectedFormation}
          activePositionIndex={activePositionIndex}
          onPositionClick={onPositionClick}
        />

        {selectedCount < 5 && (
          <p className="formation-hint">
            {activePositionMeta
              ? `Choose a player for ${activePositionMeta.label}, or tap another pitch slot to change role.`
              : `Choose players for your ${selectedFormation.name} formation. You need 5 players total.`}
          </p>
        )}
      </div>
    </div>
  </div>
);

export default TeamBuilder;
