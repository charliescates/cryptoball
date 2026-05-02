import { formatEther } from "viem";

import AddTeam from "../../actions/addTeam";
import type { Player } from "../../player";
import type { MatchDetails } from "./types";

interface SubmitTeamSectionProps {
  attackingPlayers: Player[];
  defensivePlayers: Player[];
  hasBothTeamsSubmitted: boolean;
  hasOwnTeamSubmitted: boolean;
  isFormationComplete: boolean;
  isReplayPending: boolean;
  isReplayReady: boolean;
  matchDetails?: MatchDetails;
  midfieldPlayers: Player[];
  onTransactionConfirmed?: () => void;
  onTransactionFailed?: () => void;
  onTransactionStarted?: () => void;
  onWatchReplay: () => void;
  selectedMatchId: number | null;
}

const SubmitTeamSection = ({
  attackingPlayers,
  defensivePlayers,
  hasBothTeamsSubmitted,
  hasOwnTeamSubmitted,
  isFormationComplete,
  isReplayPending,
  isReplayReady,
  matchDetails,
  midfieldPlayers,
  onTransactionConfirmed,
  onTransactionFailed,
  onTransactionStarted,
  onWatchReplay,
  selectedMatchId,
}: SubmitTeamSectionProps) => (
  <div className="submit-section submit-review-section">
    <div className="submit-review-header">
      <div>
        <p className="join-flow-kicker">Final check</p>
        <h3>{hasOwnTeamSubmitted ? "Team Locked" : "Review Your Team"}</h3>
      </div>
      <span className={`submit-lock-pill ${hasOwnTeamSubmitted ? "locked" : "editable"}`}>
        {hasOwnTeamSubmitted ? "Locked" : "Editable"}
      </span>
    </div>

    {!isFormationComplete && <p className="warning">Select all 5 players before locking your team.</p>}
    {selectedMatchId === null && <p className="warning">Choose a match before locking your team.</p>}

    <div className="team-submit-summary" aria-label="Team review">
      <div>
        <span>Attack</span>
        <strong>{attackingPlayers.length}</strong>
      </div>
      <div>
        <span>Midfield</span>
        <strong>{midfieldPlayers.length}</strong>
      </div>
      <div>
        <span>Defense</span>
        <strong>{defensivePlayers.length}</strong>
      </div>
    </div>

    {!hasOwnTeamSubmitted && (
      <p className="submit-review-copy">You can keep editing your shape and players until you lock this team.</p>
    )}

    <AddTeam
      matchId={selectedMatchId?.toString() || ""}
      attackingPlayers={attackingPlayers}
      midfieldPlayers={midfieldPlayers}
      defensivePlayers={defensivePlayers}
      wager={matchDetails?.wagerRequired ? formatEther(matchDetails.wagerRequired) : "0"}
      disabled={selectedMatchId === null || !isFormationComplete || hasOwnTeamSubmitted}
      disabledLabel={hasOwnTeamSubmitted ? "Team Submitted" : "Team Not Ready"}
      onTransactionConfirmed={onTransactionConfirmed}
      onTransactionFailed={onTransactionFailed}
      onTransactionStarted={onTransactionStarted}
      readyLabel="Submit Team"
    />
    <div className="match-flow-status" aria-label="Match flow status">
      <div className={`match-flow-step ${selectedMatchId !== null ? "complete" : "pending"}`}>
        <span>1</span>
        <strong>Match selected</strong>
      </div>
      <div
        className={`match-flow-step ${hasOwnTeamSubmitted ? "complete" : isFormationComplete ? "active" : "pending"}`}
      >
        <span>2</span>
        <strong>{hasOwnTeamSubmitted ? "Team submitted" : "Squad selected"}</strong>
      </div>
      <div className={`match-flow-step ${hasBothTeamsSubmitted ? "complete" : "pending"}`}>
        <span>3</span>
        <strong>Opponent ready</strong>
      </div>
      <div className={`match-flow-step ${isReplayReady ? "complete" : isReplayPending ? "active" : "pending"}`}>
        <span>4</span>
        <strong>Replay ready</strong>
      </div>
    </div>
    <div className="play-match-cta">
      <p className="play-match-copy">
        {isReplayReady
          ? "The match replay is ready. Opening it now with the reveal queued."
          : hasBothTeamsSubmitted
            ? "Both teams are locked in. The match is playing and the replay feed is preparing."
            : "Submit your team, then wait for the opponent to lock in before the replay opens."}
      </p>
      <button className="play-match-button" disabled={!isReplayReady} onClick={onWatchReplay} type="button">
        {isReplayReady ? "Opening Replay" : hasBothTeamsSubmitted ? "Playing Match" : "Waiting for Teams"}
      </button>
    </div>
  </div>
);

export default SubmitTeamSection;
