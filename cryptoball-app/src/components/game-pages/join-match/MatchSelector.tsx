import { formatEther } from "viem";

import type { MatchDetails } from "./types";

interface MatchSelectorProps {
  disabled?: boolean;
  matchDetails?: MatchDetails;
  matchList: number[];
  selectedMatchId: number | null;
  onMatchChange: (matchId: number | null) => void;
}

const formatAddress = (address: string) => (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Available");

const MatchSelector = ({
  disabled = false,
  matchDetails,
  matchList,
  selectedMatchId,
  onMatchChange,
}: MatchSelectorProps) => (
  <div className="match-selection-section">
    <h2>Select Match</h2>
    {matchList.length === 0 ? (
      <p className="no-matches">No matches available</p>
    ) : (
      <select
        className="match-select"
        disabled={disabled}
        onChange={(event) => {
          const { value } = event.target;
          onMatchChange(value === "" ? null : Number(value));
        }}
        value={selectedMatchId || ""}
      >
        <option value="">-- Select a Match --</option>
        {matchList.map((id) => (
          <option key={id} value={id}>
            Match #{id}
          </option>
        ))}
      </select>
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
            <strong>Home:</strong> {formatAddress(matchDetails.homeAddress)}
          </p>
          <p>
            <strong>Away:</strong> {formatAddress(matchDetails.awayAddress)}
          </p>
          <p>
            <strong>Wager Required:</strong>{" "}
            {matchDetails.wagerRequired ? formatEther(matchDetails.wagerRequired) : "0"} ETH
          </p>
          <p>
            <strong>Prize Pot:</strong> {matchDetails.pot ? formatEther(matchDetails.pot) : "0"} ETH
          </p>
        </div>
      </div>
    )}
  </div>
);

export default MatchSelector;
