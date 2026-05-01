import { BuyPlayer } from "../actions/BuyPlayer";
import FootballPlayerAvatar from "../avatar/FootballPlayerAvatar";
import { getPlayerName } from "../utils/playerName";
import {
  POTENTIAL_GOLD,
  getPlayerTypeColor,
  getPlayerTypeIcon,
  getPlayerTypeName,
  getPotentialColor,
} from "../utils/playerType";
import { type AcademyPlayer, getOverallRating } from "../utils/playerUtils";
import {
  avatarShadowStyle,
  avatarStageStyle,
  avatarWrapStyle,
  buyPlayerWrapStyle,
  cardSignalsStyle,
  cardContentStyle,
  cardPatternStyle,
  cardTopRowStyle,
  getCardStyle,
  getSignalPillStyle,
  playerNameStyle,
  ratingLabelStyle,
  ratingValueStyle,
  statsGridStyle,
} from "./PlayerCard.styles";
import PlayerCardRibbon from "./PlayerCardRibbon";
import PlayerCardStatBox from "./PlayerCardStatBox";
import { formatPol } from "./formatters";

interface PlayerCardProps {
  player: AcademyPlayer;
}

export const PlayerCard = ({ player }: PlayerCardProps) => {
  const playerTypeColor = getPlayerTypeColor(player.playerType);
  const accentColor = getPotentialColor(player.potential, playerTypeColor);
  const playerTypeName = getPlayerTypeName(player.playerType);
  const playerTypeIcon = getPlayerTypeIcon(player.playerType);
  const rating = getOverallRating(player);
  const playerSeed = `${player.id.toString()}-${player.playerType.toString()}`;
  const isHighPotential = accentColor === POTENTIAL_GOLD;
  const hasEliteAttack = player.attack >= 85n;
  const hasEliteDefense = player.defense >= 85n;

  return (
    <div className="player-card academy-player-card" style={getCardStyle(accentColor)}>
      <div style={cardPatternStyle} />
      <PlayerCardRibbon
        accentColor={accentColor}
        isHighPotential={isHighPotential}
        playerTypeColor={playerTypeColor}
        playerTypeIcon={playerTypeIcon}
        playerTypeName={playerTypeName}
      />

      <div style={cardContentStyle}>
        <div style={cardTopRowStyle}>
          <div>
            <div style={ratingLabelStyle}>OVR</div>
            <div style={ratingValueStyle}>{rating}</div>
          </div>
          <div style={cardSignalsStyle}>
            {hasEliteAttack && <div style={getSignalPillStyle("attack")}>Elite Attack</div>}
            {hasEliteDefense && <div style={getSignalPillStyle("defense")}>Elite Defense</div>}
          </div>
        </div>

        <div className="academy-avatar-stage" style={avatarStageStyle}>
          <div style={avatarShadowStyle} />
          <div style={avatarWrapStyle}>
            <FootballPlayerAvatar
              className="academy-avatar"
              seed={playerSeed}
              size={168}
              showBadge={false}
              traits={{
                primaryKitColor: accentColor,
                secondaryKitColor: "#ffffff",
              }}
            />
          </div>
        </div>

        <div className="academy-player-name" style={playerNameStyle}>{getPlayerName(player.id)}</div>

        <div className="academy-stats-grid" style={statsGridStyle}>
          <PlayerCardStatBox
            label="Attack"
            value={player.attack.toString()}
            tone={hasEliteAttack ? "attack" : undefined}
          />
          <PlayerCardStatBox
            label="Defense"
            value={player.defense.toString()}
            tone={hasEliteDefense ? "defense" : undefined}
          />
          <PlayerCardStatBox label="Potential" value={player.potential.toString()} />
          <PlayerCardStatBox label="Value" value={formatPol(player.value)} />
        </div>

        <div className="academy-buy-wrap" style={buyPlayerWrapStyle}>
          <BuyPlayer playerId={player.id} price={player.value} accentColor={accentColor} />
        </div>
      </div>
    </div>
  );
};
