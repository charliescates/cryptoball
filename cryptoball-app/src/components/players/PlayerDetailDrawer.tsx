import { type MouseEvent, useEffect } from "react";

import { formatPol } from "../academy/formatters";
import FootballPlayerAvatar from "../avatar/FootballPlayerAvatar";
import type { Player } from "../player";
import { getPlayerName } from "../utils/playerName";
import { getPlayerTypeColor, getPlayerTypeIcon, getPlayerTypeName } from "../utils/playerType";
import type { AcademyPlayer } from "../utils/playerUtils";

type PlayerDetailDrawerProps =
  | {
      kind: "squad";
      player: Player | null;
      onClose: () => void;
    }
  | {
      kind: "academy";
      player: AcademyPlayer | null;
      onClose: () => void;
    };

const getProgressLabel = (potential: bigint, attack: bigint, defense: bigint) => {
  const current = Math.round((Number(attack) + Number(defense)) / 2);
  const gap = Number(potential) - current;

  if (gap >= 25) return "Raw upside";
  if (gap >= 12) return "Developing";
  if (gap >= 4) return "Near ceiling";
  return "Ready now";
};

const DetailStat = ({ label, value }: { label: string; value: string }) => (
  <div className="player-detail-stat">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const PlayerDetailDrawer = (props: PlayerDetailDrawerProps) => {
  useEffect(() => {
    if (!props.player) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        props.onClose();
      }
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [props.player, props.onClose]);

  if (!props.player) return null;

  const { player } = props;
  const playerTypeColor = getPlayerTypeColor(player.playerType);
  const playerTypeName = getPlayerTypeName(player.playerType);
  const playerName = getPlayerName(player.id);
  const progressLabel = getProgressLabel(player.potential, player.attack, player.defense);
  const closeOnBackdropPress = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      props.onClose();
    }
  };

  return (
    <div className="player-detail-backdrop" role="presentation" onMouseDown={closeOnBackdropPress}>
      <dialog open aria-label={`${playerName} details`} aria-modal="true" className="player-detail-drawer">
        <button className="player-detail-close" type="button" onClick={props.onClose}>
          Close
        </button>

        <div className="player-detail-hero">
          <div className="player-detail-avatar" style={{ borderColor: playerTypeColor }}>
            <FootballPlayerAvatar
              seed={`${player.id.toString()}-${player.playerType.toString()}`}
              size={136}
              showBadge={false}
              traits={{
                primaryKitColor: playerTypeColor,
                secondaryKitColor: "#ffffff",
              }}
            />
          </div>
          <div>
            <p className="player-detail-kicker">
              {getPlayerTypeIcon(player.playerType)} {playerTypeName}
            </p>
            <h2>{playerName}</h2>
            <span className="player-detail-progress">{progressLabel}</span>
          </div>
        </div>

        <div className="player-detail-grid">
          <DetailStat label="Attack" value={player.attack.toString()} />
          <DetailStat label="Defense" value={player.defense.toString()} />
          <DetailStat label="Potential" value={player.potential.toString()} />
          {props.kind === "squad" ? (
            <SquadDetailStats player={props.player} />
          ) : (
            <AcademyDetailStats player={props.player} />
          )}
        </div>

        <section className="player-detail-note">
          <strong>Manager read</strong>
          <p>
            {props.kind === "squad"
              ? "Use this player where their role fit and remaining games protect your strongest match five."
              : "Shortlist this prospect if their potential or role fills a current squad gap."}
          </p>
        </section>
      </dialog>
    </div>
  );
};

const SquadDetailStats = ({ player }: { player: Player }) => (
  <>
    <DetailStat label="Games left" value={player.gamesLeft.toString()} />
    <DetailStat label="Goals" value={player.goalsScored.toString()} />
    <DetailStat label="Growth" value={`${(player.attack - player.originalAttack).toString()} ATT`} />
  </>
);

const AcademyDetailStats = ({ player }: { player: AcademyPlayer }) => (
  <>
    <DetailStat label="Value" value={`${formatPol(player.value)} POL`} />
    <DetailStat label="Recruit fit" value={Number(player.potential) >= 85 ? "Priority" : "Depth"} />
    <DetailStat label="Role" value={getPlayerTypeName(player.playerType)} />
  </>
);

export default PlayerDetailDrawer;
