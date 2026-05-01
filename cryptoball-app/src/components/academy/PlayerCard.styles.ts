import type { CSSProperties } from "react";

export const getCardStyle = (accentColor: string): CSSProperties => ({
  position: "relative",
  overflow: "hidden",
  boxSizing: "border-box",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  borderRadius: "26px",
  padding: "12px",
  color: "#ffffff",
  background: `
    radial-gradient(circle at 50% 0%, ${accentColor}4d 0%, transparent 34%),
    linear-gradient(145deg, rgba(255,255,255,0.08) 0%, transparent 24%),
    linear-gradient(180deg, #202020 0%, #0a0a0a 100%)
  `,
  border: `2px solid ${accentColor}`,
  boxShadow: `
    0 20px 48px rgba(0,0,0,0.55),
    0 0 22px ${accentColor}55,
    inset 0 0 0 1px rgba(255,255,255,0.08)
  `,
});

export const cardPatternStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  backgroundImage: `
    repeating-linear-gradient(
      45deg,
      rgba(255,255,255,0.025) 0px,
      rgba(255,255,255,0.025) 1px,
      transparent 1px,
      transparent 8px
    )
  `,
};

export const cardContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
};

export const cardTopRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "8px",
  marginBottom: "0",
};

export const ratingLabelStyle: CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 950,
  letterSpacing: "0.18em",
  opacity: 0.95,
};

export const ratingValueStyle: CSSProperties = {
  fontSize: "clamp(1.9rem, 7vw, 2.7rem)",
  fontWeight: 950,
  lineHeight: 0.9,
  letterSpacing: "-0.06em",
  textShadow: "0 8px 22px rgba(0,0,0,0.55)",
};

export const avatarStageStyle: CSSProperties = {
  position: "relative",
  height: "clamp(150px, 32vw, 210px)",
  marginTop: "-4px",
  marginBottom: "6px",
};

export const cardSignalsStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "4px",
  minWidth: 0,
};

export const getSignalPillStyle = (tone: "attack" | "defense"): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "5px 8px",
  borderRadius: "999px",
  fontSize: "0.6rem",
  fontWeight: 900,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  color: tone === "attack" ? "#ffd9c7" : "#ccfff2",
  background:
    tone === "attack"
      ? "linear-gradient(180deg, rgba(255,112,67,0.22), rgba(255,112,67,0.1))"
      : "linear-gradient(180deg, rgba(0,188,212,0.2), rgba(0,188,212,0.08))",
  border: tone === "attack" ? "1px solid rgba(255,112,67,0.34)" : "1px solid rgba(0,188,212,0.34)",
  boxShadow: tone === "attack" ? "0 8px 16px rgba(255,112,67,0.14)" : "0 8px 16px rgba(0,188,212,0.14)",
});

export const avatarShadowStyle: CSSProperties = {
  position: "absolute",
  bottom: "8px",
  left: "50%",
  transform: "translateX(-50%)",
  width: "58%",
  height: "24px",
  borderRadius: "999px",
  background: "rgba(0,0,0,0.42)",
  filter: "blur(9px)",
};

export const avatarWrapStyle: CSSProperties = {
  position: "absolute",
  bottom: 0,
  left: "50%",
  transform: "translateX(-50%)",
};

export const playerNameStyle: CSSProperties = {
  textAlign: "center",
  fontWeight: 950,
  fontSize: "clamp(0.84rem, 2vw, 0.98rem)",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  padding: "8px 10px",
  borderRadius: "14px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05))",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const statsGridStyle: CSSProperties = {
  marginTop: "8px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(76px, 1fr))",
  gap: "6px",
};

export const buyPlayerWrapStyle: CSSProperties = {
  marginTop: "8px",
};

export const statBoxStyle: CSSProperties = {
  padding: "8px 9px",
  borderRadius: "12px",
  background: "rgba(0,0,0,0.38)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
  minWidth: 0,
};

export const getFeaturedStatBoxStyle = (tone: "attack" | "defense"): CSSProperties => ({
  ...statBoxStyle,
  background:
    tone === "attack"
      ? "linear-gradient(180deg, rgba(255,112,67,0.18), rgba(0,0,0,0.42))"
      : "linear-gradient(180deg, rgba(0,188,212,0.17), rgba(0,0,0,0.42))",
  border: tone === "attack" ? "1px solid rgba(255,112,67,0.34)" : "1px solid rgba(0,188,212,0.34)",
  boxShadow:
    tone === "attack"
      ? "inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 18px rgba(255,112,67,0.12)"
      : "inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 18px rgba(0,188,212,0.11)",
});

export const statLabelStyle: CSSProperties = {
  fontSize: "0.6rem",
  opacity: 0.72,
  textTransform: "uppercase",
  letterSpacing: "0.11em",
  marginBottom: "4px",
};

export const statValueStyle: CSSProperties = {
  fontSize: "0.95rem",
  fontWeight: 950,
  lineHeight: 1,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const academyGridStyle: CSSProperties = {
  display: "grid",
  alignItems: "stretch",
};
