import type { CSSProperties } from "react";

import { formatSignedDelta, getDeltaClassName } from "./playerStats";

interface PlayerStatProps {
  delta?: bigint;
  highlight?: boolean;
  label: string;
  value: bigint;
  variant: "card" | "inline";
}

const cardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  padding: "10px",
};

const labelStyle: CSSProperties = {
  fontSize: "0.72rem",
  opacity: 0.75,
  marginBottom: "4px",
};

const valueRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "8px",
};

const valueStyle: CSSProperties = {
  fontSize: "1.15rem",
  fontWeight: 800,
};

const inlineStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "baseline",
  gap: "6px",
};

const PlayerStat = ({ delta = 0n, highlight = false, label, value, variant }: PlayerStatProps) => {
  const deltaNode =
    delta !== 0n ? <span className={`stat-delta ${getDeltaClassName(delta)}`}>{formatSignedDelta(delta)}</span> : null;

  if (variant === "card") {
    return (
      <div
        style={{
          ...cardStyle,
          ...(highlight
            ? {
                borderColor: "rgba(250,204,21,0.35)",
                background: "rgba(250,204,21,0.08)",
              }
            : {}),
        }}
      >
        <div style={labelStyle}>{label}</div>
        <div style={valueRowStyle}>
          <span style={valueStyle}>{value.toString()}</span>
          {deltaNode}
        </div>
      </div>
    );
  }

  return (
    <span className={highlight ? "player-stats-highlight" : undefined} style={inlineStyle}>
      {label} <strong>{value.toString()}</strong>
      {deltaNode}
    </span>
  );
};

export default PlayerStat;
