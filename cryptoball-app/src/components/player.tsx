import { useDrag } from "react-dnd";

import PlayerAvatar from "./playerAvatar";
import PlayerStat from "./players/PlayerStat";
import { getPlayerName } from "./utils/playerName";
import { getPlayerTypeColor, getPlayerTypeIcon, getPlayerTypeName } from "./utils/playerType";

export type Player = {
  id: bigint;
  originalAttack: bigint;
  attack: bigint;
  originalDefense: bigint;
  defense: bigint;
  potential: bigint;
  gamesLeft: bigint;
  goalsScored: bigint;
  playerType: bigint;
};

type PlayerCardProps = {
  player: Player;
};

const PlayerCard = ({ player }: PlayerCardProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "PLAYER",
    item: player,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const playerTypeColor = getPlayerTypeColor(player.playerType);
  const playerTypeName = getPlayerTypeName(player.playerType);
  const attackDelta = player.attack - player.originalAttack;
  const defenseDelta = player.defense - player.originalDefense;

  const statCards: Array<{
    delta?: bigint;
    highlight?: boolean;
    label: string;
    value: bigint;
  }> = [
    { delta: attackDelta, label: "ATTACK", value: player.attack },
    { delta: defenseDelta, label: "DEFENSE", value: player.defense },
    { highlight: true, label: "POTENTIAL", value: player.potential },
    { label: "GOALS", value: player.goalsScored },
  ];

  return (
    <div
      ref={drag}
      className="player"
      style={{
        opacity: isDragging ? 0.55 : 1,
        background: isDragging
          ? "linear-gradient(135deg, #f4f4f4 0%, #dddddd 100%)"
          : "linear-gradient(135deg, #1f1f1f 0%, #2b2b2b 100%)",
        color: isDragging ? "#222" : "#f3f3f3",
        border: isDragging ? "1px dashed #888" : `1px solid ${playerTypeColor}`,
        borderRadius: "16px",
        padding: "14px",
        boxShadow: isDragging ? "0 6px 14px rgba(0,0,0,0.12)" : "0 10px 22px rgba(0,0,0,0.28)",
        cursor: "grab",
        minWidth: "260px",
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <div
          style={{
            padding: "3px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${playerTypeColor} 0%, #ffffff 140%)`,
            boxShadow: `0 0 16px ${playerTypeColor}55`,
          }}
        >
          <PlayerAvatar seed={player.id.toString()} size={64} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                lineHeight: 1.2,
                wordBreak: "break-word",
              }}
            >
              {getPlayerName(player.id)}
            </div>

            <span
              style={{
                backgroundColor: playerTypeColor,
                padding: "4px 8px",
                borderRadius: "999px",
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "#111",
                whiteSpace: "nowrap",
              }}
              title={playerTypeName}
            >
              {getPlayerTypeIcon(player.playerType)}
            </span>
          </div>

          <div
            style={{
              marginTop: "6px",
              fontSize: "0.8rem",
              opacity: isDragging ? 0.75 : 0.9,
            }}
          >
            {playerTypeName}
          </div>
        </div>
      </div>

      <div
        className="player-info"
        style={{
          marginTop: "14px",
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "10px",
        }}
      >
        {statCards.map((stat) => (
          <PlayerStat
            key={stat.label}
            delta={stat.delta}
            highlight={stat.highlight}
            label={stat.label}
            value={stat.value}
            variant="card"
          />
        ))}
      </div>

      <div
        style={{
          marginTop: "10px",
          fontSize: "0.8rem",
          opacity: 0.8,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Games left</span>
        <span style={{ fontWeight: 700 }}>{player.gamesLeft.toString()}</span>
      </div>
    </div>
  );
};

export default PlayerCard;
