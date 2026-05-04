import FootballPlayerAvatar from "../avatar/FootballPlayerAvatar";
import { getPlayerName } from "../utils/playerName";

interface ReplayPositionCardProps {
  goalCount: number;
  isLatestScorer: boolean;
  playerId: string;
  positionLabel: string;
  teamColour: string;
}

export function ReplayPositionCard({
  goalCount,
  isLatestScorer,
  playerId,
  positionLabel,
  teamColour,
}: ReplayPositionCardProps) {
  const name = getPlayerName(BigInt(playerId));
  const isScorer = goalCount > 0;

  const borderColor = isLatestScorer ? "#7ef0a7" : isScorer ? "rgba(126, 240, 167, 0.55)" : teamColour;

  const cardClass = ["position filled", isLatestScorer ? "position--just-scored" : isScorer ? "position--scored" : ""]
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
              seed={playerId}
              size={52}
              showBadge={false}
              traits={{
                primaryKitColor: teamColour,
                secondaryKitColor: "#ffffff",
              }}
            />
          </div>
          <div className="position-title-wrap">
            <strong className="player-name">{name}</strong>
            <span className="position-role-pill" style={{ backgroundColor: `${teamColour}18`, color: teamColour }}>
              {positionLabel}
            </span>
          </div>
        </div>
        <div className={`replay-goal-count${isScorer ? "" : " replay-goal-count--empty"}`} aria-hidden={!isScorer}>
          <span className="replay-goal-count-ball">Goal</span>
          <span className="replay-goal-count-num">{goalCount > 1 ? `x${goalCount}` : "1"}</span>
        </div>
      </div>
    </div>
  );
}
