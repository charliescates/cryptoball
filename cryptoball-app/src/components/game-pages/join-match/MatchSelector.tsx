import { formatEther } from "viem";

import generateName from "../../utils/teamName";
import type { MatchDetails } from "./types";

interface MatchWithDetails {
  id: number;
  details: MatchDetails;
}

interface MatchSelectorProps {
  currentAddress?: string;
  disabled?: boolean;
  matchDetails?: MatchDetails;
  matchesWithDetails: MatchWithDetails[];
  selectedMatchId: number | null;
  onMatchChange: (matchId: number | null) => void;
}

const MatchSelector = ({
  currentAddress,
  disabled = false,
  matchDetails,
  matchesWithDetails,
  selectedMatchId,
  onMatchChange,
}: MatchSelectorProps) => {
  const userAddr = currentAddress?.toLowerCase();

  return (
    <div className="match-selection-section">
      <div className="match-selection-header">
        <h2>Your Matches</h2>
        <span className="match-selection-scope-pill">Showing your fixtures only</span>
      </div>
      {matchesWithDetails.length === 0 ? (
        <p className="no-matches">No open matches found for your address</p>
      ) : (
        <div className="match-card-grid" role="list" aria-label="Your matches">
          {matchesWithDetails.map(({ id, details }) => {
            const isSelected = selectedMatchId === id;
            const isHome = userAddr && details.homeAddress.toLowerCase() === userAddr;
            const opponentAddress = isHome ? details.awayAddress : details.homeAddress;
            const opponentName = opponentAddress ? generateName(opponentAddress) : "Open slot";
            const wager = details.wagerRequired ? formatEther(details.wagerRequired) : "0";

            return (
              <button
                key={id}
                type="button"
                className={`match-card${isSelected ? " match-card--selected" : ""}${disabled ? " match-card--disabled" : ""}`}
                disabled={disabled}
                aria-pressed={isSelected}
                aria-label={`Match ${id} vs ${opponentName}`}
                onClick={() => onMatchChange(isSelected ? null : id)}
              >
                <span className="match-card-id">Match #{id}</span>
                <div className="match-card-opponent">
                  <span className="match-card-team-label">Opponent</span>
                  <strong>{opponentName}</strong>
                </div>
                {Number(wager) > 0 && (
                  <div className="match-card-wager">
                    <span>Wager</span>
                    <strong>{wager} POL</strong>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
      {disabled && <p className="match-lock-note">This match is locked while your submitted team is being processed.</p>}

      {matchDetails && selectedMatchId !== null && (
        <div className="match-details">
          <h3>Match Details</h3>
          <div className="match-info">
            <p>
              <strong>Match ID:</strong> {selectedMatchId}
            </p>
            <p>
              <strong>Home:</strong> {generateName(matchDetails.homeAddress)}
            </p>
            <p>
              <strong>Away:</strong>{" "}
              {matchDetails.awayAddress ? generateName(matchDetails.awayAddress) : "Available"}
            </p>
            <p>
              <strong>Wager Required:</strong>{" "}
              {matchDetails.wagerRequired ? formatEther(matchDetails.wagerRequired) : "0"} POL
            </p>
            <p>
              <strong>Prize Pot:</strong> {matchDetails.pot ? formatEther(matchDetails.pot) : "0"} POL
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchSelector;
