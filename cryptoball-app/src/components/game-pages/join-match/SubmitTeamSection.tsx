import { formatEther } from "viem";

import AddTeam from "../../actions/addTeam";
import type { Player } from "../../player";
import type { MatchDetails } from "./types";

interface SubmitTeamSectionProps {
  attackingPlayers: Player[];
  defensivePlayers: Player[];
  isFormationComplete: boolean;
  matchDetails?: MatchDetails;
  midfieldPlayers: Player[];
  selectedMatchId: number | null;
}

const SubmitTeamSection = ({
  attackingPlayers,
  defensivePlayers,
  isFormationComplete,
  matchDetails,
  midfieldPlayers,
  selectedMatchId,
}: SubmitTeamSectionProps) => (
  <div className="submit-section">
    {!isFormationComplete && <p className="warning">Please select all 5 players before submitting your team.</p>}
    {selectedMatchId === null && <p className="warning">Please select a match before submitting your team.</p>}
    <AddTeam
      matchId={selectedMatchId?.toString() || ""}
      attackingPlayers={attackingPlayers}
      midfieldPlayers={midfieldPlayers}
      defensivePlayers={defensivePlayers}
      wager={matchDetails?.wagerRequired ? formatEther(matchDetails.wagerRequired) : "0"}
    />
  </div>
);

export default SubmitTeamSection;
