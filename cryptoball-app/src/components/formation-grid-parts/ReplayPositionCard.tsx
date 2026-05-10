import FootballPlayerAvatar from "../avatar/FootballPlayerAvatar";
import { getPlayerName } from "../utils/playerName";
import { getTeamKitTraitsFromAddress } from "../utils/teamKit";

interface ReplayPositionCardProps {
  goalCount: number;
  isLatestScorer: boolean;
  isRevealed?: boolean;
  playerStats?: {
    attack: string;
    defense: string;
    gamesLeft: string;
    goals: string;
    position: string;
    potential: string;
  };
  playerId: string;
  playerType?: string;
  positionLabel: string;
  teamAddress?: string;
  teamColour: string;
}

export function ReplayPositionCard({
  goalCount,
  isLatestScorer,
  isRevealed = true,
  playerStats,
  playerId,
  playerType,
  positionLabel,
  teamAddress,
  teamColour,
}: ReplayPositionCardProps) {
  const name = getPlayerName(BigInt(playerId));
  const isScorer = goalCount > 0 && isRevealed;
  const teamKitTraits = getTeamKitTraitsFromAddress(teamAddress);

  const borderColor = !isRevealed
    ? "rgba(255, 255, 255, 0.18)"
    : isLatestScorer
      ? "#7ef0a7"
      : isScorer
        ? "rgba(126, 240, 167, 0.55)"
        : teamColour;

  const cardClass = [
    "position filled",
    !isRevealed ? "position--concealed" : isLatestScorer ? "position--just-scored" : isScorer ? "position--scored" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass} style={{ borderColor, cursor: "default" }}>
      <div className="position-content">
        <div className="position-header">
          <div
            className="position-avatar"
            style={{ borderColor: isScorer ? "rgba(126, 240, 167, 0.3)" : "rgba(255, 255, 255, 0.08)" }}
          >
            <FootballPlayerAvatar
              seed={playerType !== undefined ? `${playerId}-${playerType}` : playerId}
              size={52}
              showBadge={false}
              traits={
                teamKitTraits ?? {
                  primaryKitColor: teamColour,
                  secondaryKitColor: "#ffffff",
                }
              }
            />
          </div>
          <div className="position-title-wrap">
            <strong className="player-name">{isRevealed ? name : "Undisclosed"}</strong>
            <span className="position-role-pill" style={{ backgroundColor: `${teamColour}18`, color: teamColour }}>
              {positionLabel}
            </span>
          </div>
        </div>
        <div className={`replay-goal-count${isScorer ? "" : " replay-goal-count--empty"}`} aria-hidden={!isScorer}>
          <span className="replay-goal-count-ball">Goal</span>
          <span className="replay-goal-count-num">{goalCount > 1 ? `x${goalCount}` : "1"}</span>
        </div>
        <div className="replay-card-stats" aria-label={`${name} stats`}>
          <span>ATK {isRevealed ? (playerStats?.attack ?? "-") : "--"}</span>
          <span>DEF {isRevealed ? (playerStats?.defense ?? "-") : "--"}</span>
          <span>POT {isRevealed ? (playerStats?.potential ?? "-") : "--"}</span>
          <span>GL {isRevealed ? (playerStats?.gamesLeft ?? "-") : "--"}</span>
          <span>G {isRevealed ? (playerStats?.goals ?? "-") : "--"}</span>
        </div>
      </div>
    </div>
  );
}
