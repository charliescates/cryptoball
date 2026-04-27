import FootballPlayerAvatar from "./avatar/FootballPlayerAvatar";
import { buildTraitsFromSeed } from "./avatar/avatarSeed";

export default function TestPage() {
  const seeds = [
    "seed-2",
    "seed-3",
    "seed-5",
    "seed-8",
    "seed-15",
    "seed-19",
    "seed-26",
    "seed-31",
    "seed-35",
    "seed-44",
  ];

  return (
    <div
      style={{
        padding: 32,
        display: "grid",
        gap: 24,
      }}
    >
      <div style={{ color: "#d8e2ff", fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Avatar Seed Check
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 10,
          alignItems: "start",
        }}
      >
        {seeds.map((seed) => {
          const traits = buildTraitsFromSeed(seed);
          return (
            <div
              key={seed}
              style={{
                padding: 8,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.03)",
                textAlign: "center",
              }}
            >
              <FootballPlayerAvatar seed={seed} size={92} showBadge={false} />
              <div style={{ marginTop: 6, color: "#f3f6ff", fontSize: 10, fontWeight: 700 }}>{traits.hairStyle}</div>
              <div style={{ marginTop: 3, color: "#c7d1f3", fontSize: 9 }}>{seed}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
