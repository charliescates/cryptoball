import FootballPlayerAvatar from "../avatar/FootballPlayerAvatar";
import type { Player } from "../player";
import { getPlayerName } from "../utils/playerName";
import { getTeamKitTraitsFromAddress } from "../utils/teamKit";
import { getPlayerTypeColor, getPlayerTypeIcon, getPlayerTypeName } from "../utils/playerType";
import PlayerStat from "./PlayerStat";

interface SquadPlayerCardProps {
  onOpenDetails?: (player: Player) => void;
  player: Player;
  roleFitLabel?: string;
  teamAddress?: string;
}

const SquadPlayerCard = ({ onOpenDetails, player, roleFitLabel, teamAddress }: SquadPlayerCardProps) => {
  const playerTypeColor = getPlayerTypeColor(player.playerType);
  const playerTypeName = getPlayerTypeName(player.playerType);
  const attackDelta = player.attack - player.originalAttack;
  const defenseDelta = player.defense - player.originalDefense;
  const teamKitTraits = getTeamKitTraitsFromAddress(teamAddress);

  return (
    <div className="player-card player-card-roster">
      <div className="player-card-top">
        <div className="player-avatar-frame player-avatar-frame-roster" style={{ borderColor: `${playerTypeColor}66` }}>
          <FootballPlayerAvatar
            seed={`${player.id.toString()}-${player.playerType.toString()}`}
            size={92}
            showBadge={false}
            traits={
              teamKitTraits ?? {
                primaryKitColor: playerTypeColor,
                secondaryKitColor: "#ffffff",
              }
            }
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

          {roleFitLabel ? <div className="player-fit-badge">{roleFitLabel}</div> : null}

          <div className="player-card-note">Built for {playerTypeName.toLowerCase()} duties.</div>
        </div>
      </div>

      <div className="player-stats player-stats-grid">
        <PlayerStat label="ATT" value={player.attack} delta={attackDelta} variant="inline" />
        <PlayerStat label="DEF" value={player.defense} delta={defenseDelta} variant="inline" />
        <PlayerStat label="POT" value={player.potential} highlight variant="inline" />
      </div>

      <div className="player-card-footer">
        <span>
          Games left <strong>{player.gamesLeft.toString()}</strong>
        </span>
        <span>
          Goals <strong>{player.goalsScored.toString()}</strong>
        </span>
      </div>

      {onOpenDetails ? (
        <button className="player-detail-trigger" type="button" onClick={() => onOpenDetails(player)}>
          Player details
        </button>
      ) : null}
    </div>
  );
};

export default SquadPlayerCard;
