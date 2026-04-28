import FootballPlayerAvatar from "../avatar/FootballPlayerAvatar";
import type { Player } from "../player";
import { getPlayerName } from "../utils/playerName";
import { getPlayerTypeColor, getPlayerTypeIcon, getPlayerTypeName } from "../utils/playerType";
import { formatSignedDelta, getDeltaClassName } from "./playerStats";

interface SquadPlayerCardProps {
  player: Player;
}

const SquadPlayerCard = ({ player }: SquadPlayerCardProps) => {
  const playerTypeColor = getPlayerTypeColor(player.playerType);
  const playerTypeName = getPlayerTypeName(player.playerType);
  const attackDelta = player.attack - player.originalAttack;
  const defenseDelta = player.defense - player.originalDefense;

  return (
    <div className="player-card player-card-roster">
      <div className="player-card-top">
        <div className="player-avatar-frame player-avatar-frame-roster" style={{ borderColor: `${playerTypeColor}66` }}>
          <FootballPlayerAvatar
            seed={`${player.id.toString()}-${player.playerType.toString()}`}
            size={92}
            showBadge={false}
            traits={{
              primaryKitColor: playerTypeColor,
              secondaryKitColor: "#ffffff",
            }}
          />
        </div>

        <div className="player-card-copy">
          <div className="player-card-header">
            <div className="player-card-title-wrap">
              <strong className="player-card-name">{getPlayerName(player.id)}</strong>
              <span className="player-card-id">Player #{player.id.toString()}</span>
            </div>

            <span
              className="selected-badge"
              style={{
                width: "auto",
                minWidth: "24px",
                padding: "0 8px",
                borderRadius: "999px",
                fontSize: "12px",
              }}
              title={playerTypeName}
            >
              {getPlayerTypeIcon(player.playerType)}
            </span>
          </div>

          <div
            className="player-role-pill"
            style={{
              backgroundColor: `${playerTypeColor}18`,
              color: playerTypeColor,
            }}
            title={playerTypeName}
          >
            {playerTypeName}
          </div>

          <div className="player-card-note">Built for {playerTypeName.toLowerCase()} duties.</div>
        </div>
      </div>

      <div className="player-stats player-stats-grid">
        <PlayerStat label="ATT" value={player.attack} delta={attackDelta} />
        <PlayerStat label="DEF" value={player.defense} delta={defenseDelta} />
        <PlayerStat label="POT" value={player.potential} highlight />
      </div>

      <div className="player-card-footer">
        <span>
          Games left <strong>{player.gamesLeft.toString()}</strong>
        </span>
        <span>
          Goals <strong>{player.goalsScored.toString()}</strong>
        </span>
      </div>
    </div>
  );
};

interface PlayerStatProps {
  delta?: bigint;
  highlight?: boolean;
  label: string;
  value: bigint;
}

const PlayerStat = ({ delta = 0n, highlight = false, label, value }: PlayerStatProps) => (
  <span className={highlight ? "player-stats-highlight" : undefined}>
    {label} <strong>{value.toString()}</strong>
    {delta !== 0n && <em className={`stat-delta ${getDeltaClassName(delta)}`}>{formatSignedDelta(delta)}</em>}
  </span>
);

export default SquadPlayerCard;
