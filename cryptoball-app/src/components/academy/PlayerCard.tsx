import { BuyPlayer } from "../actions/BuyPlayer";
import FootballPlayerAvatar from "../avatar/FootballPlayerAvatar";
import type { AcademyPlayer } from "../utils/playerUtils";
import {
  avatarShadowStyle,
  avatarStageStyle,
  avatarWrapStyle,
  buyPlayerWrapStyle,
  cardContentStyle,
  cardPatternStyle,
  cardSignalsStyle,
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
import { getPlayerCardModel } from "./playerCardModel";

interface PlayerCardProps {
  isShortlisted?: boolean;
  onOpenDetails?: (player: AcademyPlayer) => void;
  onToggleShortlist?: (playerId: bigint) => void;
  player: AcademyPlayer;
}

export const PlayerCard = ({ isShortlisted = false, onOpenDetails, onToggleShortlist, player }: PlayerCardProps) => {
  const card = getPlayerCardModel(player);

  return (
    <div className="player-card academy-player-card" style={getCardStyle(card.accentColor)}>
      <div style={cardPatternStyle} />
      <PlayerCardRibbon
        accentColor={card.accentColor}
        isHighPotential={card.isHighPotential}
        playerTypeColor={card.playerTypeColor}
        playerTypeIcon={card.playerTypeIcon}
        playerTypeName={card.playerTypeName}
      />

      <div style={cardContentStyle}>
        <div style={cardTopRowStyle}>
          <div>
            <div style={ratingLabelStyle}>OVR</div>
            <div style={ratingValueStyle}>{card.rating}</div>
          </div>
          <div style={cardSignalsStyle}>
            {card.hasEliteAttack && <div style={getSignalPillStyle("attack")}>Elite Attack</div>}
            {card.hasEliteDefense && <div style={getSignalPillStyle("defense")}>Elite Defense</div>}
          </div>
        </div>

        <div className="academy-avatar-stage" style={avatarStageStyle}>
          <div style={avatarShadowStyle} />
          <div style={avatarWrapStyle}>
            <FootballPlayerAvatar
              className="academy-avatar"
              seed={card.playerSeed}
              size={168}
              showBadge={false}
              traits={{
                primaryKitColor: card.accentColor,
                secondaryKitColor: "#ffffff",
              }}
            />
          </div>
        </div>

        <div className="academy-player-name" style={playerNameStyle}>
          {card.playerName}
        </div>

        <div className="academy-stats-grid" style={statsGridStyle}>
          {card.stats.map((stat) => (
            <PlayerCardStatBox key={stat.label} label={stat.label} value={stat.value} tone={stat.tone} />
          ))}
        </div>

        <div className="academy-buy-wrap" style={buyPlayerWrapStyle}>
          <BuyPlayer playerId={player.id} price={player.value} accentColor={card.accentColor} />
        </div>

        <div className="academy-card-actions">
          {onOpenDetails ? (
            <button type="button" onClick={() => onOpenDetails(player)}>
              Details
            </button>
          ) : null}
          {onToggleShortlist ? (
            <button
              type="button"
              className={isShortlisted ? "active" : ""}
              onClick={() => onToggleShortlist(player.id)}
            >
              {isShortlisted ? "Shortlisted" : "Shortlist"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
